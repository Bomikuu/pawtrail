"""Durable, append-only production receipts; interrupted spans remain unknown."""
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
import fcntl
import hashlib
import json
import os
import re
import time
import uuid


def now():
    return datetime.now(timezone.utc).isoformat()


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def atomic_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    try:
        with temp.open('x', encoding='utf-8') as stream:
            json.dump(value, stream, indent=2, ensure_ascii=False)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp, path)
        fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
    finally:
        if temp.exists():
            temp.unlink()


def boot_id():
    path = Path('/proc/sys/kernel/random/boot_id')
    return path.read_text().strip() if path.exists() else None


class Job:
    def __init__(self, manifest):
        self.path = Path(manifest).resolve()
        self.data = json.loads(self.path.read_text())
        if self.data.get('version') != 1:
            raise ValueError('Unsupported actor production manifest version')
        actors = self.data.get('actors', [])
        ids = [a['id'] for a in actors]
        if not ids or len(ids) != len(set(ids)) or any(not re.fullmatch(r'[a-z0-9][a-z0-9_-]*', value) for value in ids):
            raise ValueError('Declare unique, path-safe actor ids')
        for actor in actors:
            if actor.get('voices') not in {'included', 'omitted'}:
                raise ValueError('Declare whether voices are included or explicitly omitted')
            if actor['voices'] == 'omitted' and not actor.get('voiceOmissionReason', '').strip():
                raise ValueError('Record the owner\'s voice omission')
            if not actor['portrait']['poses'] or not actor['portrait']['emotions']:
                raise ValueError('The requested portrait angle/emotion matrix cannot be empty')
        assets = [a['id'] for a in self.data.get('assets', [])]
        if len(assets) != len(set(assets)):
            raise ValueError('Asset ids must be unique')
        if any(not re.fullmatch(r'[a-zA-Z0-9_-]+', stage) for stage in self.data.get('exports', {})):
            raise ValueError('Export stage names must be path-safe')
        self.root = (self.path.parent / self.data['projectRoot']).resolve()
        self.folder = self.path.parent / '.production'
        self.folder.mkdir(parents=True, exist_ok=True)
        fd = os.open(self.path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
        self.journal = self.folder / 'events.jsonl'

    def resolve(self, value):
        path = (self.root / value).resolve()
        if not path.is_relative_to(self.root):
            raise ValueError(f'Job path escapes the project: {value}')
        return path

    @contextmanager
    def locked(self):
        with (self.folder / 'journal.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock, fcntl.LOCK_UN)

    def _read(self):
        data = self.journal.read_bytes() if self.journal.exists() else b''
        events = []
        lines = data.splitlines()
        for index, line in enumerate(lines):
            if not line.strip():
                continue
            # A torn trailing record is retained separately by append(). Interior
            # corruption is an error, never silently skipped as missing history.
            try:
                events.append(json.loads(line))
            except (json.JSONDecodeError, UnicodeDecodeError):
                if index == len(lines)-1 and not data.endswith(b'\n'):
                    break
                raise ValueError('Invalid interior journal record; preserve and inspect events.jsonl')
        return events

    def events(self):
        with self.locked():
            return self._read()

    def _append(self, event_type, **fields):
        event = {'id': uuid.uuid4().hex, 'at': now(), 'type': event_type, **fields}
        with self.journal.open('ab') as stream:
            stream.write((json.dumps(event, separators=(',', ':'), ensure_ascii=False) + '\n').encode())
            stream.flush()
            os.fsync(stream.fileno())
        fd = os.open(self.folder, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
        return event

    def _repair_tail(self):
        if not self.journal.exists():
            return
        data = self.journal.read_bytes()
        if not data or data.endswith(b'\n'):
            return
        last = data.rfind(b'\n') + 1
        tail = data[last:]
        try:
            json.loads(tail)
        except (json.JSONDecodeError, UnicodeDecodeError):
            saved = self.folder / ('torn-tail-' + uuid.uuid4().hex + '.bin')
            with saved.open('xb') as stream:
                stream.write(tail)
                stream.flush()
                os.fsync(stream.fileno())
            with self.journal.open('r+b') as stream:
                stream.truncate(last)
                stream.flush()
                os.fsync(stream.fileno())
            self._append('journal.recovered', preservedTail=saved.name)
        else:
            with self.journal.open('ab') as stream:
                stream.write(b'\n')
                stream.flush()
                os.fsync(stream.fileno())

    def append(self, event_type, **fields):
        with self.locked():
            self._repair_tail()
            return self._append(event_type, **fields)

    def start(self, name, actor, kind='stage', parent=None):
        if actor not in {'shared', *[a['id'] for a in self.data['actors']]}:
            raise ValueError('Choose an actor declared in this job, or shared')
        return self.append('span.start', name=name, actor=actor, kind=kind,
                           parent=parent, boot=boot_id(), monotonic=time.monotonic())

    def end(self, span, outcome='complete', note=''):
        with self.locked():
            self._repair_tail()
            events = self._read()
            starts = [e for e in events if e['type'] == 'span.start' and e['id'] == span]
            if not starts:
                raise ValueError('Unknown span id')
            if any(e['type'] == 'span.end' and e['span'] == span for e in events):
                raise ValueError('Span already ended')
            start = starts[0]
            same_boot = start['boot'] is not None and start['boot'] == boot_id()
            if outcome != 'interrupted' and not same_boot:
                raise ValueError('Host changed: close this span as interrupted; elapsed time is unknown')
            elapsed = round((time.monotonic() - start['monotonic']) * 1000) if same_boot and outcome != 'interrupted' else None
            return self._append('span.end', span=span, outcome=outcome, elapsedMs=elapsed, note=note)


def time_summary(job):
    events = job.events()
    ends = {e['span']: e for e in events if e['type'] == 'span.end'}
    spans = []
    for event in events:
        if event['type'] != 'span.start':
            continue
        end = ends.get(event['id'], {})
        spans.append({k: event[k] for k in ('id', 'name', 'actor', 'kind', 'at')})
        spans[-1].update(status=end.get('outcome', 'open — duration unknown'),
                         elapsedMs=end.get('elapsedMs'), note=end.get('note', ''),
                         finishedAt=end.get('at'))
    # No fictitious aggregate: parallel stage/service spans overlap. The caller
    # can inspect actual spans, including failures and explicit interruption.
    return {'job': job.data['id'], 'spans': spans,
            'note': 'Durations overlap. Open/interrupted spans have no inferred duration. Stage intervals include their waits; they are not CPU or active-coding time.'}
