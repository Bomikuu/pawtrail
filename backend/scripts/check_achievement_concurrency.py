"""Exercise real HTTP reward races against an explicitly isolated PostgreSQL database.

Run with the backend venv, PAWTRAIL_CONCURRENCY_DATABASE_URL, and --base-url.
Requires current_setting('pawtrail.isolated_test') = 'on', a loopback database/API,
and the database name pawtrail_concurrency. Never uses force_authenticate or mocks.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from io import BytesIO
import json
import os
from pathlib import Path
import secrets
import subprocess
import threading
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import uuid

import psycopg
from psycopg.rows import dict_row


class Suite:
    def __init__(self, base_url, output, concurrency, native_runner=None):
        self.base = base_url.rstrip('/') + '/'
        self.dsn = os.environ['PAWTRAIL_CONCURRENCY_DATABASE_URL']
        for address in [self.base, self.dsn]:
            if urlsplit(address).hostname not in {'127.0.0.1', 'localhost'}:
                raise RuntimeError('This generated-data suite requires loopback addresses.')
        self.db = psycopg.connect(self.dsn, autocommit=True, row_factory=dict_row,
                                  application_name='pawtrail-concurrency-controller')
        marker = self.db.execute("SELECT current_database() db, current_setting('pawtrail.isolated_test', true) isolated, version() version").fetchone()
        if marker['db'] != 'pawtrail_concurrency' or marker['isolated'] != 'on':
            raise RuntimeError('Refusing generated records outside the isolated test database.')
        self.output = Path(output)
        self.output.parent.mkdir(parents=True, exist_ok=True)
        self.concurrency = concurrency
        self.native_runner = native_runner
        self.prefix = 'pg_' + uuid.uuid4().hex[:10]
        self.actors = {}
        self.results = []
        self.report = {'databaseVersion': marker['version'], 'run': self.prefix,
                       'concurrency': concurrency, 'scenarios': self.results}
        self.persist()

    def persist(self):
        self.output.write_text(json.dumps(self.report, indent=2, default=str))

    def check(self, name, actual, expected):
        passed = actual == expected
        self.results.append({'name': name, 'passed': passed, 'actual': actual, 'expected': expected})
        self.persist()
        print(('PASS ' if passed else 'FAIL ') + name + ': ' + str(actual), flush=True)
        if not passed:
            raise AssertionError(name)

    def request(self, actor, method, path, payload=None, key=None, raw=None, content=None):
        headers = {'Accept': 'application/json'}
        if actor:
            headers['Authorization'] = 'Bearer ' + self.actors[actor]['access']
        if method != 'GET':
            headers['Idempotency-Key'] = key or self.prefix + ':' + uuid.uuid4().hex
        body = raw
        if raw is not None:
            headers['Content-Type'] = content
        elif payload is not None:
            body = json.dumps(payload).encode()
            headers['Content-Type'] = 'application/json'
        started = time.monotonic()
        try:
            response = urlopen(Request(self.base + path, data=body, method=method, headers=headers), timeout=25)
        except HTTPError as error:
            response = error
        with response:
            status, body = response.status, response.read()
        try:
            value = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            value = {'nonJsonBody': True}
        return {'status': status, 'value': value, 'seconds': round(time.monotonic() - started, 4)}

    def ok(self, actor, method, path, payload=None, status=200, **kwargs):
        response = self.request(actor, method, path, payload, **kwargs)
        self.check(method + ' ' + path, response['status'], status)
        return response['value']

    def parallel(self, name, operations):
        barrier = threading.Barrier(len(operations))
        def run(operation):
            barrier.wait(timeout=10)
            return operation()
        with ThreadPoolExecutor(max_workers=len(operations)) as pool:
            responses = list(pool.map(run, operations))
        counts = dict(sorted(Counter(r['status'] for r in responses).items()))
        self.results.append({'name': name + ' HTTP distribution', 'passed': all(r['status'] < 500 for r in responses),
                             'statuses': counts, 'maxSeconds': max(r['seconds'] for r in responses)})
        self.persist()
        self.check(name + ' no server errors', sum(r['status'] >= 500 for r in responses), 0)
        return responses

    def setup(self):
        for role in ['member', 'other', 'reviewer', 'reviewer2']:
            username = self.prefix + '_' + role
            account = {'username': username, 'email': username + '@example.test',
                       'displayName': 'Isolated PostgreSQL ' + role, 'password': secrets.token_urlsafe(32)}
            tokens = self.ok(None, 'POST', 'auth/register', account, status=201)
            self.actors[role] = {'id': tokens['session']['actor']['id'], 'access': tokens['access']}
            actual = self.db.execute('SELECT id FROM accounts_user WHERE username=%s', [username]).fetchone()
            self.check(role + ' API and SQL use same database', str(actual['id']), self.actors[role]['id'])
            self.db.execute('UPDATE social_userprofile SET seed_key=%s, bio=%s WHERE user_id=%s',
                            [self.prefix + ':' + role, 'Generated actor for isolated concurrency QA only.', actual['id']])
            if role.startswith('reviewer'):
                self.db.execute('UPDATE accounts_user SET is_staff=true WHERE id=%s', [actual['id']])
        for role in ['member', 'other']:
            post = self.ok(role, 'POST', 'community/posts', {
                'text': 'Generated educational QA content in an isolated PostgreSQL database. This is not evidence of real-world animal care.',
                'type': 'story', 'mediaIds': [], 'refs': []}, status=201)
            self.actors[role]['post'] = post
            self.actors[role]['media'] = self.upload(role)
        self.report['generatedActorIds'] = {key: actor['id'] for key, actor in self.actors.items()}
        self.persist()

    def upload(self, role, jpeg=False):
        # A PDF explicitly labeling the document as synthetic. Persisted through the real upload endpoint.
        data = b'%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\n% ISOLATED SYNTHETIC QA DOCUMENT - NOT REAL WORLD EVIDENCE\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n'
        mime, filename = 'application/pdf', 'isolated-qa.pdf'
        if jpeg:
            from PIL import Image, ImageDraw
            image = Image.new('RGB', (640, 480), 'white')
            ImageDraw.Draw(image).text((20, 30), 'ISOLATED GENERATED QA - NOT REAL WORLD EVIDENCE', fill='black')
            stream = BytesIO()
            image.save(stream, format='JPEG')
            data, mime, filename = stream.getvalue(), 'image/jpeg', 'isolated-qa.jpg'
        boundary = 'PawTrail' + uuid.uuid4().hex
        raw = b''
        for key, value in {'purpose': 'private_evidence', 'alt': 'Synthetic isolated PostgreSQL QA document'}.items():
            raw += f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n'.encode()
        raw += f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n'.encode() + data + f'\r\n--{boundary}--\r\n'.encode()
        return self.ok(role, 'POST', 'media', status=201, raw=raw, content='multipart/form-data; boundary=' + boundary)['id']

    def proof(self, actor, badge='educator'):
        return self.ok(actor, 'POST', 'me/achievement-proofs', {
            'badgeId': badge, 'ref': {'kind': 'post', 'id': self.actors[actor]['post']['id']},
            'occurredAt': datetime.now(timezone.utc).isoformat(),
            'details': 'Generated proof for isolated PostgreSQL concurrency QA only; not real-world evidence.',
            'mediaIds': [self.actors[actor]['media']]}, status=201)

    def decision(self, proof, decision='approved', reviewer='reviewer', key=None):
        return self.request(reviewer, 'POST', 'moderation/achievement-proofs/' + proof['id'] + '/review', {
            'expectedVersion': proof['version'], 'decision': decision,
            'reason': 'Isolated generated-data PostgreSQL QA decision: ' + decision}, key=key)

    def approve(self, proof):
        response = self.decision(proof)
        self.check('independent approval', response['status'], 200)
        return response['value']

    def claim(self, actor='member', badge='educator', key=None):
        return self.request(actor, 'POST', 'me/achievements/claim', {'badgeId': badge}, key=key)

    def revise(self, actor, proof):
        return self.ok(actor, 'POST', 'me/achievement-proofs', {
            'id': proof['id'], 'expectedVersion': proof['version'], 'badgeId': proof['badgeId'],
            'ref': proof['ref'], 'occurredAt': proof['occurredAt'],
            'details': 'Revised generated proof for isolated PostgreSQL QA only; no real-world verification.',
            'mediaIds': proof['mediaIds']}, status=201)

    def latest(self, proof):
        actor = next(key for key, value in self.actors.items() if value['id'] == proof['userId'])
        values = self.ok(actor, 'GET', 'me/achievement-proofs')['results']
        return next(row for row in values if row['id'] == proof['id'])

    def snapshot(self, actor, expected, name):
        uid = self.actors[actor]['id']
        rows = self.db.execute('SELECT id, achievement_claim_id, mission_participation_id, grant_id, amount, balance_after, revision FROM rewards_ledgerentry WHERE owner_id=%s ORDER BY created_at,id', [uid]).fetchall()
        wallet = self.db.execute('SELECT balance FROM rewards_wallet WHERE owner_id=%s', [uid]).fetchone()
        claims = self.db.execute('SELECT id,badge_id,state,credited,reward_kibble,reward_revision FROM social_achievementclaim WHERE user_id=%s', [uid]).fetchall()
        total = sum(row['amount'] for row in rows)
        self.check(name + ' ledger sum', total, expected)
        self.check(name + ' wallet cache', wallet['balance'], expected)
        self.check(name + ' API wallet', self.ok(actor, 'GET', 'me/kibble')['balance'], expected)
        running, valid = 0, True
        for row in rows:
            running += row['amount']
            valid &= row['balance_after'] == running and running >= 0
            valid &= sum(row[key] is not None for key in ['achievement_claim_id','mission_participation_id','grant_id']) == 1
        self.check(name + ' running balances and exclusive source', valid, True)
        self.check(name + ' unique badge claims', len({row['badge_id'] for row in claims}), len(claims))
        for claim in claims:
            history = [row for row in rows if row['achievement_claim_id'] == claim['id']]
            self.check(name + ' ' + claim['badge_id'] + ' credited equals history', sum(row['amount'] for row in history), claim['credited'])
            self.check(name + ' ' + claim['badge_id'] + ' consecutive revisions', [row['revision'] for row in history], list(range(1, claim['reward_revision'] + 1)))
            self.check(name + ' ' + claim['badge_id'] + ' state matches credit', claim['credited'], claim['reward_kibble'] if claim['state'] == 'active' else 0)
        sources = self.db.execute('SELECT id,credited,reward_revision,state FROM social_missionparticipation WHERE volunteer_id=%s', [uid]).fetchall()
        for source in sources:
            history = [row for row in rows if row['mission_participation_id'] == source['id']]
            self.check(name + ' mission credit equals history', source['credited'], sum(row['amount'] for row in history))
            self.check(name + ' mission consecutive revisions', [row['revision'] for row in history], list(range(1, source['reward_revision'] + 1)))
            if source['state'] != 'approved':
                self.check(name + ' unapproved mission has no credit', source['credited'], 0)
        self.check(name + ' all source credits equal wallet', sum(claim['credited'] for claim in claims) + sum(source['credited'] for source in sources), expected)
        self.report.setdefault('snapshots', []).append({'name': name, 'actor': actor, 'wallet': wallet['balance'], 'ledger': rows, 'claims': claims})
        self.persist()
        return rows

    def wait_wallet_waiters(self, count):
        deadline = time.monotonic() + 4
        while time.monotonic() < deadline:
            waiting = self.db.execute("SELECT count(*) n FROM pg_stat_activity WHERE datname=current_database() AND application_name='pawtrail-achievements-concurrency' AND wait_event_type='Lock' AND query LIKE '%%rewards_wallet%%'").fetchone()['n']
            if waiting >= count:
                return
            time.sleep(0.02)
        raise AssertionError('The expected independent PostgreSQL wallet waiters did not arrive.')

    def ordered_claim_withdrawal(self, actor, proof, claim_first):
        # Hold the real wallet row, then observe both HTTP transactions waiting in PostgreSQL.
        gate = psycopg.connect(self.dsn)
        try:
            gate.execute('SELECT owner_id FROM rewards_wallet WHERE owner_id=%s FOR UPDATE', [self.actors[actor]['id']])
            with ThreadPoolExecutor(max_workers=2) as pool:
                operations = [lambda: self.claim(actor), lambda: self.decision(proof, 'rejected')]
                if not claim_first:
                    operations.reverse()
                first = pool.submit(operations[0])
                self.wait_wallet_waiters(1)
                second = pool.submit(operations[1])
                self.wait_wallet_waiters(2)
                gate.commit()
                responses = [first.result(timeout=25), second.result(timeout=25)]
            self.check('ordered race no server errors', sum(r['status'] >= 500 for r in responses), 0)
            self.check('ordered race HTTP statuses', sorted(r['status'] for r in responses), [200, 200] if claim_first else [200, 409])
        finally:
            gate.rollback()
            gate.close()
        return self.latest(proof)

    def mixed_mission_rewards(self):
        mission = self.ok('reviewer', 'POST', 'missions', {
            'title': 'Isolated generated PostgreSQL QA mission',
            'description': 'Synthetic task used only to test the shared local reward ledger.',
            'kind': 'mission', 'urgency': 'normal',
            'deadline': (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
            'rewardKibble': 25, 'location': {'areaId': 'isolated-qa', 'neighborhood': 'Isolated QA',
                'latitude': 0, 'longitude': 0, 'approximateRadiusMeters': 1500},
            'animalId': None, 'shelterId': None, 'hordeId': None, 'evidenceRequirements': ['Synthetic private QA image']}, status=201)
        participation = self.ok('member', 'POST', 'missions/' + mission['id'] + '/accept', {})
        media = self.upload('member', jpeg=True)
        participation = self.ok('member', 'POST', 'mission-participations/' + participation['id'] + '/evidence', {
            'expectedVersion': participation['version'], 'text': 'Generated evidence for isolated PostgreSQL concurrency QA; not real-world activity.', 'mediaIds': [media]})
        participation = self.ok('reviewer', 'POST', 'mission-participations/' + participation['id'] + '/review', {
            'expectedVersion': participation['version'], 'decision': 'approved', 'reason': 'Isolated generated-data mission approval test.'})
        self.snapshot('member', 25, 'mission source award')
        self.check('mission-dependent achievement claim', self.claim(badge='first-help')['status'], 200)
        before = len(self.snapshot('member', 55, 'mission and achievement awards'))
        rows = self.parallel('mission reversal racing achievement claims',
            [lambda: self.claim(badge='first-help') for _ in range(self.concurrency)] +
            [lambda: self.request('reviewer', 'POST', 'mission-participations/' + participation['id'] + '/review', {
                'expectedVersion': participation['version'], 'decision': 'rejected',
                'reason': 'Isolated generated-data mission correction test.'})])
        self.check('mixed mission race statuses', all(row['status'] in [200,409] for row in rows), True)
        self.check('mission and dependent badge corrections both appended', len(self.snapshot('member', 0, 'mission correction cascade')), before + 2)

    def ordered_encounter_reconciliation(self, actor, claim_first):
        uid = str(uuid.UUID(self.actors[actor]['id']))
        # Execute the same collector/deferred callback used by capture publication.
        # No animal identity, reference, sighting or fabricated encounter is needed
        # to reproduce this wallet/account lock inversion.
        code = (
            "from django.db import connection; "
            "c=connection.cursor(); "
            "c.execute(\"SELECT current_database(),current_setting('pawtrail.isolated_test',true)\"); "
            "assert c.fetchone()==('pawtrail_concurrency','on'); "
            "from social.achievements.changes import achievement_changes,defer_encounter_rewards; "
            "scope=achievement_changes(); "
            "scope.__enter__(); "
            f"defer_encounter_rewards('{uid}'); "
            "scope.__exit__(None,None,None); print('ENCOUNTER_RECONCILED')"
        )
        def reconcile():
            started = time.monotonic()
            result = subprocess.run(self.native_runner + [code], capture_output=True, text=True, timeout=25)
            return {'exit': result.returncode, 'reconciled': 'ENCOUNTER_RECONCILED' in result.stdout,
                    'deadlock': 'deadlock detected' in result.stderr, 'seconds': round(time.monotonic() - started, 4)}
        gate = psycopg.connect(self.dsn)
        try:
            gate.execute('SELECT owner_id FROM rewards_wallet WHERE owner_id=%s FOR UPDATE', [uid])
            with ThreadPoolExecutor(max_workers=2) as pool:
                operations = [lambda: self.claim(actor), reconcile] if claim_first else [reconcile, lambda: self.claim(actor)]
                first = pool.submit(operations[0])
                self.wait_wallet_waiters(1)
                second = pool.submit(operations[1])
                self.wait_wallet_waiters(2)
                gate.commit()
                responses = [first.result(timeout=25), second.result(timeout=25)]
            native = next(row for row in responses if 'exit' in row)
            http = next(row for row in responses if 'status' in row)
            label = 'encounter/claim ordered ' + ('claim first' if claim_first else 'encounter first')
            self.check(label + ' native exit', native['exit'], 0)
            self.check(label + ' collector completed', native['reconciled'], True)
            self.check(label + ' no deadlock', native['deadlock'], False)
            self.check(label + ' ineligible claim rejected normally', http['status'], 409)
        finally:
            gate.rollback()
            gate.close()
        self.snapshot(actor, 0, label)

    def run(self):
        self.setup()
        proof = self.approve(self.proof('member'))
        n = self.concurrency
        rows = self.parallel('simultaneous first claims', [lambda: self.claim() for _ in range(n)])
        self.check('all first claims resolve', [r['status'] for r in rows], [200] * n)
        self.check('single first award', len(self.snapshot('member', 40, 'first claims')), 1)
        rows = self.parallel('same-key claim retries', [lambda: self.claim(key=self.prefix + ':same-claim') for _ in range(n)])
        self.check('same-key claim results', [r['status'] for r in rows], [200] * n)
        self.check('same-key writes no extra award', len(self.snapshot('member', 40, 'claim retries')), 1)
        rows = self.parallel('two-moderator simultaneous reversals', [lambda i=i: self.decision(proof, 'rejected', 'reviewer' if i % 2 else 'reviewer2') for i in range(n)])
        self.check('exactly one reversal succeeds', sorted(r['status'] for r in rows), [200] + [409] * (n - 1))
        self.check('single reversal entry', len(self.snapshot('member', 0, 'simultaneous reversal')), 2)
        proof = self.approve(self.revise('member', self.latest(proof)))
        rows = self.parallel('simultaneous reclaims', [lambda: self.claim() for _ in range(n)])
        self.check('all reclaims resolve', [r['status'] for r in rows], [200] * n)
        self.check('single restoration entry', len(self.snapshot('member', 40, 'simultaneous reclaims')), 3)
        rows = self.parallel('claims racing reversal', [lambda: self.claim() for _ in range(n)] + [lambda: self.decision(proof, 'rejected')])
        self.check('racing claim statuses are success or ineligible', all(r['status'] in [200,409] for r in rows), True)
        self.check('race still reverses exactly once', len(self.snapshot('member', 0, 'claim withdrawal race')), 4)
        # Cold-wallet/first-claim paths and both observed lock arrival orders.
        other = self.approve(self.proof('other'))
        other = self.ordered_claim_withdrawal('other', other, True)
        self.check('claim-first writes award and reversal', len(self.snapshot('other', 0, 'ordered claim first')), 2)
        other = self.approve(self.revise('other', other))
        other = self.ordered_claim_withdrawal('other', other, False)
        self.check('withdrawal-first adds no award', len(self.snapshot('other', 0, 'ordered withdrawal first')), 2)
        # Independent proof reversals share one wallet and must preserve both corrections.
        proof = self.approve(self.revise('member', self.latest(proof)))
        awareness = self.approve(self.proof('member', 'awareness-champion'))
        self.check('educator restore', self.claim()['status'], 200)
        self.check('awareness claim', self.claim(badge='awareness-champion')['status'], 200)
        before = len(self.snapshot('member', 80, 'two claimed proofs'))
        rows = self.parallel('different proofs same wallet reversal', [lambda: self.decision(proof,'rejected'), lambda: self.decision(awareness,'rejected','reviewer2')])
        self.check('both independent reversals succeed', sorted(r['status'] for r in rows), [200,200])
        self.check('both corrections retained', len(self.snapshot('member', 0, 'different proof reversals')), before + 2)
        self.mixed_mission_rewards()
        self.ordered_encounter_reconciliation('other', False)
        self.ordered_encounter_reconciliation('other', True)
        self.report['complete'] = True
        self.persist()
        print('PostgreSQL concurrency suite passed.', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-url', required=True)
    parser.add_argument('--output', required=True)
    parser.add_argument('--concurrency', type=int, default=12)
    parser.add_argument('--native-runner', type=json.loads, required=True,
                        help='JSON argv prefix that runs manage.py shell -c against this isolated backend')
    args = parser.parse_args()
    if not 2 <= args.concurrency <= 24:
        parser.error('concurrency must be between 2 and 24')
    if not isinstance(args.native_runner, list) or not args.native_runner or not all(isinstance(part, str) for part in args.native_runner):
        parser.error('native-runner must be a nonempty JSON array of command arguments')
    suite = Suite(args.base_url, args.output, args.concurrency, args.native_runner)
    try:
        suite.run()
    finally:
        suite.db.close()


if __name__ == '__main__':
    main()
