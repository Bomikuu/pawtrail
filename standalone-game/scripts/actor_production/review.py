"""Resumable capture/visual-review units bound to their exact dependencies."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import uuid
from urllib.parse import urlparse, parse_qs
from .ledger import digest, atomic_json
from .readiness import snapshot


def cases(job):
    actions = json.loads(job.resolve('src/game/actor-rig/actions.json').read_text())['rescuer']
    output = []
    for actor in job.data['actors']:
        def add(key, kind, groups, instructions, **fields):
            output.append({'id': actor['id']+'/'+key, 'actor': actor['id'], 'kind': kind,
                           'groups': groups, 'instructions': instructions, **fields})
        for action, clip in actions.items():
            add('action/'+action, 'action', ['model','portrait','preview'],
                'Inspect entry, two motion phases, limbs/contacts, props, hair/cloth fit, matching portrait intent, effects/shadow and return. Capture alone does not pass this action.',
                action=action, durationMs=round(1000*clip.get('frames', 6)/clip.get('fps', 6)) if isinstance(clip.get('frames', 6), (int,float)) else 1200)
        for angle in ['down','down_left','left','up']:
            add('heading/'+angle, 'heading', ['model','preview'],
                'Compare silhouette and actual textured volume to the approved illustration: face/eye UVs, fringe, shoulders, garment fronts/reverses and full swing clearance.', direction=angle)
        portrait = actor['portrait']
        for pose in portrait['poses']:
            for emotion in portrait['emotions']:
                add('portrait/'+pose+'/'+emotion, 'portrait', ['portrait','preview'],
                    'Compare this angle/emotion to its own source drawings. Inspect authored rest/half/closed blink, both mouth states, breathing below the chin, stable identity and natural transitions.', pose=pose, emotion=emotion)
        for variant in actor.get('illustrationVariants', ['normal','enraged']):
            add('illustration/'+variant, 'illustration', ['illustration','preview'],
                'Inspect multiple full loops with background/aura hidden, then restored. Hair must visibly move from pinned roots; inspect cloth, underlays, steady face/grip, outlines and evolving facial effects. Reject frozen lightning or pulse-only movement.',
                variant=variant, cycleMs=actor.get('illustrationCycleMs',5000))
        add('icon', 'icon', ['icon','preview'], 'Inspect native 40px artwork and integer enlargement: readable face, three-quarter identity, hair/accessories, woody default border and distinct active glow.')
        add('dialogue', 'dialogue', ['portrait','preview'], 'Inspect selected angle in the compact wood HUD, typewriter speech/rest, all pages/choices, emotion transitions, pause/restoration and close behavior.')
        add('lifecycle', 'manual', ['model','portrait','preview'], 'In Firefox: move while acting, turn, pause/resume, replace/cancel, complete one-shots, expire timed actions, return to idle, leave/re-enter the scene, and inspect effects/audio cleanup. Keep sound, shadow and ground circle attached and separate.')
        add('illustration-controls', 'manual', ['illustration','preview'], 'In Firefox: pause, resume, restart, visibility return and reduced-motion still for both variants. Check independent background/aura controls and subdued composition.')
        add('likeness', 'manual', ['model','illustration','portrait','icon','preview'], 'Side by side with approved art: identity, mature illustration anatomy, own face fitting and materials, curved/tapered geometry, textured long hair/cloth fronts/reverses/edges and maximum swing. Inspect native and enlarged sizes.')
        add('sound-shadow', 'manual', ['model','preview'], 'Listen to applicable shared action sounds, check floating ground shadow and drawn ground circle, mute/interruption/cleanup. Omitted speech does not omit action-SFX review.')
        add('mobile', 'mobile', ['model','portrait','preview'], 'Inspect portrait, controls, model and keyboard/touch alternatives at 390px, without horizontal overflow.')
        if actor.get('installInGame'):
            add('gameplay', 'manual', ['model','portrait','gameplay'], 'Use the real roster in an isolated Firefox profile. Walk/run/turn, test collision/depth and care/interactions, verify portrait and return/cleanup. No authoritative rewards/account writes.')
        if actor.get('modelKind') == 'vehicle':
            add('vehicle', 'manual', ['model','gameplay','preview'], 'Enter/exit cockpit, preserve a safe handoff position, inspect canopy opening and vehicle footprint, test narrow gaps and blocked human furniture. Check parked sit/sleep/float/ride with all limbs visible.')
        if actor.get('voices') != 'omitted':
            add('voice', 'manual', ['voice','portrait','preview'], 'Listen to all six cues: distinct personality-led speaker, text/pronunciation, matching portrait speech/emotion, interruption, mute and no overlapping lines. Capture audio evidence; action SFX do not replace voices.')
    return output


def fingerprint(job, case, cache=None):
    actor = next(a for a in job.data['actors'] if a['id'] == case['actor'])
    paths = []
    seen = set()
    cache = {} if cache is None else cache
    def read_snapshot(path):
        if path not in cache:
            cache[path] = snapshot(path)
        return cache[path]
    def add(entry):
        spec = {'path':entry} if isinstance(entry,str) else entry
        path = job.resolve(spec['path'])
        if path.is_dir() and job.folder.is_relative_to(path):
            raise ValueError('Declare specific dependencies, not a directory containing the journal/evidence')
        if not path.exists() and spec.get('optional'):
            paths.append({'path':spec['path'],'missing':True})
            return
        if path in seen:
            return
        seen.add(path)
        paths.append({'path':path.relative_to(job.root).as_posix(), **read_snapshot(path)})
        if spec.get('imports') and path.is_file() and path.suffix in {'.ts','.tsx','.js','.mjs'}:
            # Follow literal local imports, including shared rigs/poses/materials.
            # Computed imports need explicit manifest entries.
            modules = re.findall(r"(?:from\s*|import\s*\(\s*|import\s*)['\"]([^'\"]+)['\"]",path.read_text())
            for module in modules:
                if not module.startswith(('.', '@/')):
                    continue
                base = job.root/'src'/module[2:] if module.startswith('@/') else path.parent/module
                choices = [base, *[Path(str(base)+ext)for ext in ['.ts','.tsx','.js','.json']], base/'index.ts',base/'index.tsx']
                resolved = next((p for p in choices if p.is_file()),None)
                if resolved is None:
                    raise ValueError('Unresolved local model dependency: '+module)
                add({'path':resolved.resolve().relative_to(job.root).as_posix(),'imports':True})
    for group in case['groups']:
        entries = actor.get('dependencies', {}).get(group)
        if not entries:
            raise ValueError(f"{actor['id']}: declare dependencies for {group}")
        for entry in entries:
            add(entry)
    paths.append({'path':'src/game/actor-rig/actions.json', **read_snapshot(job.resolve('src/game/actor-rig/actions.json'))})
    value = {'case':case, 'actor':{k:v for k,v in actor.items() if k!='dependencies'}, 'inputs':paths}
    return hashlib.sha256(json.dumps(value, sort_keys=True).encode()).hexdigest()


def evidence_valid(job, event):
    return bool(event.get('evidence')) and all(job.resolve(row['path']).is_file() and digest(job.resolve(row['path'])) == row['sha256'] for row in event['evidence'])


def status(job):
    events = job.events()
    output = []
    cache = {}
    for case in cases(job):
        try:
            signature = fingerprint(job, case, cache)
            captures = [e for e in events if e['type']=='review.capture' and e['case']==case['id']]
            captured = next((e for e in reversed(captures) if e['fingerprint']==signature and evidence_valid(job,e)),None)
            results = [e for e in events if e['type']=='review.result' and e['case']==case['id'] and e['fingerprint']==signature]
            result = results[-1] if results else None
            failures = [e for e in events if e['type']=='review.capture.failed' and e['case']==case['id'] and e['fingerprint']==signature]
            failure = failures[-1] if failures else None
            if failure and failure['at'] > max((result or {}).get('at',''), (captured or {}).get('at','')):
                state = 'capture failed'
            elif result and evidence_valid(job,result) and (result['result']=='pass' or not captured or result['at']>=captured['at']):
                state = result['result']
            else:
                state = 'captured — needs visual review' if captured else 'stale' if captures else 'pending'
            output.append({**case, 'state':state, 'fingerprint':signature, 'capture':captured})
        except (ValueError, OSError) as error:
            output.append({**case, 'state':'blocked', 'error':str(error)})
    return output


def record_result(job, case_id, result, note, evidence):
    if not note.strip() or not evidence:
        raise ValueError('A visual result requires an observation note and actual evidence files')
    case = next((c for c in cases(job) if c['id']==case_id),None)
    if not case:
        raise ValueError('Unknown review case')
    signature = fingerprint(job, case)
    if case['kind'] != 'manual' and result == 'pass':
        receipt = next((e for e in reversed(job.events()) if e['type']=='review.capture' and e['case']==case_id and e['fingerprint']==signature and evidence_valid(job,e)),None)
        if not receipt:
            raise ValueError('Capture this exact candidate before recording its visual result')
        allowed = {e['path'] for e in receipt['evidence']}
        if any(job.resolve(name).relative_to(job.root).as_posix() not in allowed for name in evidence):
            raise ValueError('Evidence must belong to this case and candidate; use a manual case for other observations')
    rows = []
    for name in evidence:
        path = job.resolve(name)
        if path.suffix.lower() not in {'.png','.webp','.jpg','.jpeg','.gif','.mp4','.webm','.ogg','.opus','.mp3','.wav'}:
            raise ValueError('Evidence must be an image, video or audio artifact')
        rows.append({'path':path.relative_to(job.root).as_posix(), **snapshot(path)})
    return job.append('review.result', case=case_id, result=result, note=note,
                      fingerprint=signature, evidence=rows, reviewer='explicit visual observation')


def preview_url(actor):
    parsed = urlparse(actor['previewUrl'])
    query = parse_qs(parsed.query)
    if parsed.scheme!='http' or parsed.hostname not in {'127.0.0.1','localhost','::1'} or parsed.path!='/play' or parsed.username or parsed.password or query.get('preview')!=['actors'] or query.get('skin')!=[actor['id']]:
        raise ValueError('Review requires a local /play?preview=actors&skin=<actor-id> development URL')
    return actor['previewUrl']


def capture(job, case_id, wrapper, session):
    case = next((c for c in cases(job) if c['id']==case_id),None)
    if not case:
        raise ValueError('Unknown review case')
    if case['kind']=='manual':
        return {'case':case_id,'state':'pending','instructions':case['instructions']}
    actor = next(a for a in job.data['actors'] if a['id']==case['actor'])
    preview_url(actor)
    signature = fingerprint(job, case)
    target = job.folder / 'evidence' / case['actor'] / (case['id'].split('/',1)[1].replace('/','-')) / uuid.uuid4().hex
    target.mkdir(parents=True)
    params = {'actor':actor,'case':case,'target':str(target)}
    code = (Path(__file__).parent/'firefox-capture.js').read_text().replace('/*PRODUCTION_PARAMS*/',json.dumps(params))
    span = job.start('capture '+case_id,case['actor'],'review')
    try:
        command = ['bash',str(wrapper),'--session='+session,'run-code',code]
        done = subprocess.run(command,cwd=job.root,capture_output=True,text=True,timeout=max(60,case.get('cycleMs',5000)*.003+45))
        transcript = target/'capture-log.txt'
        transcript.write_text(done.stdout+'\n'+done.stderr)
        if done.returncode or '### Error' in done.stdout:
            raise ValueError('Firefox capture failed; inspect '+str(transcript))
        files = sorted(target.glob('*.png'))
        if not files:
            raise ValueError('Capture produced no images; no case was completed')
        if signature != fingerprint(job,case):
            raise ValueError('Candidate changed during capture; evidence retained but not accepted')
        rows = [{'path':p.relative_to(job.root).as_posix(), **snapshot(p)} for p in files]
        event = job.append('review.capture',case=case_id,fingerprint=signature,evidence=rows)
        job.end(span['id'],note='Captured, awaiting visual observation; no automatic approval')
        return {'case':case_id,'state':'captured — needs visual review','receipt':event['id'],'evidence':rows,'instructions':case['instructions']}
    except BaseException as error:
        job.append('review.capture.failed',case=case_id,fingerprint=signature,error=str(error))
        job.end(span['id'],'interrupted' if isinstance(error,KeyboardInterrupt) else 'failed',str(error))
        raise


def write_queue(job):
    rows = status(job)
    value = {'job':job.data['id'],'cases':rows,'complete':all(r['state']=='pass' for r in rows),
             'omissions':[{'actor':a['id'],'voices':'omitted','reason':a.get('voiceOmissionReason','')} for a in job.data['actors'] if a.get('voices')=='omitted']}
    atomic_json(job.folder/'review-queue.json',value)
    return value
