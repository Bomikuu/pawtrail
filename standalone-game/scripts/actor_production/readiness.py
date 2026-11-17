"""Production input gates. Structural readiness is not visual acceptance."""
from pathlib import Path
import hashlib
import json
import math
import os
import shutil
import uuid
from .ledger import digest, now, atomic_json


def snapshot(path):
    path = Path(path)
    if path.is_dir():
        files = sorted(p for p in path.rglob('*') if p.is_file())
        if not files:
            raise ValueError(f'Empty asset directory: {path}')
        rows = [{'path': p.relative_to(path).as_posix(), 'sha256': digest(p), 'bytes': p.stat().st_size} for p in files]
        value = hashlib.sha256(json.dumps(rows, sort_keys=True).encode()).hexdigest()
        return {'sha256': value, 'bytes': sum(r['bytes'] for r in rows), 'files': len(rows)}
    if not path.is_file() or path.stat().st_size == 0:
        raise ValueError(f'Missing or empty asset: {path}')
    before = path.stat()
    value = digest(path)
    after = path.stat()
    if (before.st_mtime_ns, before.st_size) != (after.st_mtime_ns, after.st_size):
        raise ValueError(f'Asset changed while reading: {path}')
    return {'sha256': value, 'bytes': after.st_size, 'files': 1}


def inspect_asset(job, asset, receipts=True):
    path = job.resolve(asset['path'])
    value = snapshot(path)
    if asset.get('maxBytes') is not None and value['bytes'] > asset['maxBytes']:
        raise ValueError(f"{asset['id']}: bundle exceeds {asset['maxBytes']} bytes")
    if value['files'] < asset.get('minFiles', 1):
        raise ValueError(f"{asset['id']}: incomplete directory")
    kind = asset.get('kind', 'file')
    if kind == 'json':
        data = json.loads(path.read_text())
        if asset.get('requiredKeys') and (not isinstance(data, dict) or any(k not in data for k in asset['requiredKeys'])):
            raise ValueError(f"{asset['id']}: missing JSON keys")
    if kind == 'image':
        from PIL import Image, ImageChops, ImageDraw
        with Image.open(path) as source:
            source.load()
            image = source.convert('RGBA')
        if asset.get('size') and list(image.size) != asset['size']:
            raise ValueError(f"{asset['id']}: expected {asset['size']}, got {list(image.size)}")
        alpha = image.getchannel('A')
        bounds = alpha.getbbox()
        if not bounds:
            raise ValueError(f"{asset['id']}: fully transparent image")
        if asset.get('transparent') and alpha.getextrema()[0] == 255:
            raise ValueError(f"{asset['id']}: no transparent background")
        margin = asset.get('minMargin', 0)
        if margin and min(bounds[0], bounds[1], image.width-bounds[2], image.height-bounds[3]) < margin:
            raise ValueError(f"{asset['id']}: content touches the required {margin}px margin")
        value.update(size=list(image.size), contentBounds=list(bounds))
        grid = asset.get('grid')
        if grid:
            cols, rows = grid['columns'], grid['rows']
            if not isinstance(cols, int) or not isinstance(rows, int) or min(cols, rows) < 1:
                raise ValueError('Grid dimensions must be positive integers')
            for row in range(rows):
                for col in range(cols):
                    box = (round(col*image.width/cols), round(row*image.height/rows), round((col+1)*image.width/cols), round((row+1)*image.height/rows))
                    if not alpha.crop(box).getbbox():
                        raise ValueError(f"{asset['id']}: empty cell {col},{row}")
        used = Image.new('L', image.size)
        region_counts = {}
        regions = job.data['illustrationParts'][asset['regionRecipe']] if asset.get('regionRecipe') else asset.get('regions', [])
        for region in regions:
            points = region['polygon']
            if len(points) < 3 or any(len(p) != 2 or any(not isinstance(n, (int, float)) or not math.isfinite(n) for n in p) for p in points):
                raise ValueError('A region needs at least three finite coordinate pairs')
            mask = Image.new('L', image.size)
            ImageDraw.Draw(mask).polygon([tuple(p) for p in points], fill=255)
            if region.get('subtractPrevious', True):
                mask = ImageChops.subtract(mask, used)
            visible = ImageChops.multiply(mask, alpha)
            count = sum(visible.histogram()[1:])
            if count < region.get('minPixels', 1):
                raise ValueError(f"{asset['id']}/{region['id']}: empty/overlapped extraction ({count} pixels)")
            region_counts[region['id']] = count
            used = ImageChops.lighter(used, mask)
        value['regions'] = region_counts
    elif kind not in {'file', 'json', 'bundle'}:
        raise ValueError(f'Unknown asset kind: {kind}')
    if receipts and asset.get('origin', 'generated') != 'reused':
        events = job.events()
        ready = next((e for e in reversed(events) if e['type'] == 'asset.ready' and e['asset'] == asset['id'] and e['sha256'] == value['sha256']), None)
        if not ready:
            raise ValueError(f"{asset['id']}: no import/export receipt for these exact bytes")
        if not any(e['type'] == 'span.end' and e['span'] == ready['run'] and e['outcome'] == 'complete' for e in events):
            raise ValueError(f"{asset['id']}: generation/export has not completed")
    elif asset.get('origin') == 'reused' and not asset.get('provenance', '').strip():
        raise ValueError(f"{asset['id']}: reused artwork needs provenance")
    return {'id': asset['id'], **value}


def preflight(job, stage, record=True):
    export = job.data.get('exports', {}).get(stage)
    if export is None or not export.get('requires'):
        raise ValueError(f'Export {stage!r} must declare its required inputs')
    assets = {a['id']: a for a in job.data.get('assets', [])}
    results, errors = [], []
    for identity in export['requires']:
        try:
            results.append(inspect_asset(job, assets[identity]))
        except (ValueError, KeyError, OSError) as error:
            errors.append(f'{identity}: {error}')
    result = {'stage': stage, 'ready': not errors, 'inputs': results, 'errors': errors, 'at': now()}
    if record:
        atomic_json(job.folder / ('readiness-' + stage + '.json'), result)
        job.append('export.readiness', **result)
    return result


def require_ready(manifest, stage):
    from .ledger import Job
    result = preflight(Job(manifest), stage)
    if not result['ready']:
        raise ValueError('Export blocked before output writes:\n' + '\n'.join(result['errors']))
    return result


def import_asset(job, identity, source, run):
    asset = next((a for a in job.data['assets'] if a['id'] == identity), None)
    if asset is None:
        raise ValueError('Unknown asset id')
    events = job.events()
    start = next((e for e in events if e['id'] == run and e['type'] == 'span.start'), None)
    if not start or start['kind'] not in {'generation', 'export'}:
        raise ValueError('Import requires a generation/export span id')
    if any(e['type'] == 'span.end' and e['span'] == run and e['outcome'] != 'complete' for e in events):
        raise ValueError('Cannot import from a failed or interrupted run')
    source = Path(source).resolve()
    target = job.resolve(asset['path'])
    # Import exactly one completed file; bundles are produced by export stages.
    if not source.is_file():
        raise ValueError('Source file is not available yet; wait for generation and download completion')
    target.parent.mkdir(parents=True, exist_ok=True)
    if source != target:
        temp = target.with_name(target.name + '.' + uuid.uuid4().hex + '.tmp')
        try:
            with source.open('rb') as src, temp.open('xb') as dst:
                shutil.copyfileobj(src, dst)
                dst.flush()
                os.fsync(dst.fileno())
            inspect_asset(job, {**asset, 'path':temp.relative_to(job.root).as_posix()}, receipts=False)
            os.replace(temp, target)
            fd = os.open(target.parent, os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)
        finally:
            if temp.exists():
                temp.unlink()
    result = inspect_asset(job, asset, receipts=False)
    return job.append('asset.ready', asset=identity, run=run, source=str(source), **{k:v for k,v in result.items() if k != 'id'})
