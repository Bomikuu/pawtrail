"""Create the authorized Amber voice cues through the existing VoiceStudio.

This script never installs/downloads models, sends media to cloud providers, or
installs the audition in the game. Finish VoiceStudio's selected engine first.
"""
from __future__ import annotations

import json
import argparse
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import wave

ROOT = Path(__file__).resolve().parents[1]
SERVICE = 'http://127.0.0.1:3900'
DRIVE = Path('/run/media/micxsz/Drive/VoiceStudio')
PROFILE_FILE = ROOT / 'assets/actor-appearances/profiles/amber-outrider/voice-audition-v1.json'
OUTPUT = PROFILE_FILE.parent / 'audio/audition-v1'
SOURCES = DRIVE / 'pawtrail/amber-audition-v1'
FFTOOLS = DRIVE / 'data/media_tools/ffbin-df95abcb0ce6/linux'
PROFILE_NAME = 'Amber - PawTrail original Japanese audition (VoxCPM2)'
SEED = 1131301


def request(path, body=None, *, form=False, timeout=45, method=None):
    headers = {}
    data = None
    if body is not None:
        if form:
            boundary = 'PawTrail' + uuid.uuid4().hex
            parts = []
            for key, value in body.items():
                parts.append((f'--{boundary}\r\nContent-Disposition: form-data; name="{key}"\r\n\r\n{value}\r\n').encode())
            parts.append(f'--{boundary}--\r\n'.encode())
            data = b''.join(parts)
            headers['Content-Type'] = 'multipart/form-data; boundary=' + boundary
        else:
            data = json.dumps(body, ensure_ascii=False).encode()
            headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(SERVICE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read(), dict(response.headers)
    except urllib.error.HTTPError as error:
        detail = error.read().decode(errors='replace')
        raise RuntimeError(f'VoiceStudio {path}: HTTP {error.code}: {detail[:3000]}') from error


def api(path, body=None, *, form=False, timeout=45, method=None):
    data, _ = request(path, body, form=form, timeout=timeout, method=method)
    return json.loads(data)


def save_profile(document):
    PROFILE_FILE.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n')


def probe(path):
    completed = subprocess.run([str(FFTOOLS/'ffprobe'), '-v', 'error', '-show_entries',
        'format=duration:stream=codec_name,sample_rate,channels', '-of', 'json', str(path)],
        check=True, capture_output=True, text=True)
    return json.loads(completed.stdout)


def main(actor_id='amber-outrider', revision='audition-v1', selected_cues=None):
    global PROFILE_FILE, OUTPUT, SOURCES, PROFILE_NAME, SEED
    PROFILE_FILE = ROOT / 'assets/actor-appearances/profiles' / actor_id / 'voice-audition-v1.json'
    OUTPUT = PROFILE_FILE.parent / 'audio' / revision
    SOURCES = DRIVE / 'pawtrail' / (('amber' if actor_id == 'amber-outrider' else actor_id) + '-' + revision)
    document = json.loads(PROFILE_FILE.read_text())
    design = document.get('voiceDesign', {})
    PROFILE_NAME = design.get('profileName', PROFILE_NAME)
    SEED = design.get('seed', SEED)
    engine = next(item for item in api('/engines/tts')['backends'] if item['id'] == 'voxcpm2')
    if not engine['available']:
        raise RuntimeError('VoxCPM2 is not ready: ' + str(engine.get('reason')))
    api('/engines/select', {'family': 'tts', 'backend_id': 'voxcpm2'})
    OUTPUT.mkdir(parents=True, exist_ok=True)
    SOURCES.mkdir(parents=True, exist_ok=True)
    voices = api('/profiles')
    profile = next((item for item in voices if item['name'] == PROFILE_NAME), None)
    if profile is None:
        # Explicit supported categories avoid the description mapper treating
        # negations such as "not shrill" as a request for very high pitch.
        attrs = {'Gender': 'female', 'Age': 'young adult', 'Pitch': 'high pitch',
                 'Style': 'Auto', 'EnglishAccent': 'Auto', 'ChineseDialect': 'Auto'}
        attrs.update(design.get('attributes', {}))
        profile = api('/profiles', {'name': PROFILE_NAME, 'kind': 'design',
            'vd_states': json.dumps(attrs), 'instruct': design.get('instruct', 'female, young adult, high pitch'),
            'language': 'Japanese', 'seed': str(SEED),
            'ref_text': document['cues'][0]['text'],
            'personality': design.get('personality', 'Original bright, warm, courageous exploration companion.')}, form=True, timeout=1800)
    profile_id = profile['id']
    document['provider'].update(engineId='voxcpm2', voiceProfileId=profile_id,
        status='Generating owner-authorized local audition', device='cpu')
    document['status'] = 'generating-audition'
    save_profile(document)
    print('Using saved original voice profile', profile_id, flush=True)
    budget = api('/generate/budget?engine=voxcpm2')
    (SOURCES/'generation-budget.json').write_text(json.dumps(budget, indent=2)+'\n')
    for cue in document['cues']:
        if selected_cues is not None and cue['id'] not in selected_cues:
            continue
        take_file = SOURCES / (cue['id'] + '.take.json')
        wav_file = SOURCES / (cue['id'] + '.wav')
        text = cue['text']
        if cue.get('deliveryControl'):
            text = '(' + cue['deliveryControl'] + ')' + text
        elif cue['id'] == 'hi':
            text = '(Bright, warm, cheerful and clear young adult female voice, naturally smiling Japanese delivery)' + text
        elif cue['id'] == 'attack':
            text = '(Confident, quick and spirited attack call, strongly projected with crisp rhythm)' + text
        if wav_file.exists() and take_file.exists():
            take = json.loads(take_file.read_text())
            if take['profileId'] != profile_id or take['generationText'] != text:
                raise RuntimeError('Existing take uses another identity/script; keep it and choose a new audition version.')
            print('Reusing existing', cue['id'], 'take', flush=True)
        else:
            print('Generating', cue['id'], 'with VoxCPM2; CPU first use may take time.', flush=True)
            started = time.monotonic()
            wav, headers = request('/generate', {'text': text, 'profile_id': profile_id,
                'engine': 'voxcpm2', 'language': 'Japanese', 'num_step': '10',
                'guidance_scale': '2.0', 'denoise': 'false', 'postprocess_output': 'false',
                'pronounce': 'false', 'wav_bits': '16'}, form=True, timeout=3600)
            if not wav.startswith(b'RIFF') or wav[8:12] != b'WAVE':
                raise RuntimeError('VoiceStudio returned a non-WAV response; it was not saved as successful audio.')
            wav_file.write_bytes(wav)
            h = {key.lower(): value for key, value in headers.items()}
            take = {'engine': 'voxcpm2', 'modelRepo': 'openbmb/VoxCPM2', 'profileId': profile_id,
                'generationText': text, 'spokenText': cue['text'], 'inferenceSteps': 10,
                'audioId': h.get('x-audio-id'), 'durationReported': h.get('x-audio-duration'),
                'generationSecondsReported': h.get('x-gen-time'),
                'requestSeconds': round(time.monotonic()-started, 2),
                'source': str(wav_file), 'sourceBytes': len(wav)}
            with wave.open(str(wav_file), 'rb') as source:
                take['sourceMeasurement'] = {'sampleRate': source.getframerate(),
                    'channels': source.getnchannels(), 'sampleWidth': source.getsampwidth(),
                    'durationSeconds': source.getnframes()/source.getframerate()}
            take_file.write_text(json.dumps(take, ensure_ascii=False, indent=2)+'\n')
        if cue['id'] == 'hi':
            current = api('/profiles/' + profile_id)
            if not current.get('is_locked'):
                if not take.get('audioId'):
                    raise RuntimeError('Greeting has no actual history ID to lock; do not invent one.')
                api('/profiles/' + profile_id + '/lock', {'history_id': take['audioId'], 'seed': str(SEED)}, form=True)
                print('Pinned the generated greeting as the repeatable speaker reference.', flush=True)
                # Update the transcript only when we just pinned this recording.
                # A revised greeting must not rewrite an older locked reference's
                # transcript while its reference audio still says different words.
                api('/profiles/' + profile_id, {'ref_text': cue['text']}, method='PUT')
        files = {}
        for extension, codec in [('ogg', ['-c:a','libopus','-b:a','24k','-vbr','on','-application','voip']),
                                 ('mp3', ['-c:a','libmp3lame','-b:a','48k'])]:
            target = OUTPUT / (cue['id'] + '.' + extension)
            subprocess.run([str(FFTOOLS/'ffmpeg'), '-hide_banner', '-loglevel', 'error', '-y',
                '-i', str(wav_file), '-map_metadata', '-1', '-ac', '1', '-ar', '24000',
                *codec, str(target)], check=True)
            files[extension] = {'file': str(target.relative_to(ROOT)),
                'bytes': target.stat().st_size, 'probe': probe(target)}
        cue.update(file=files['ogg']['file'], auditionPreviewFile=files['mp3']['file'],
            durationSeconds=take['sourceMeasurement']['durationSeconds'],
            voiceStudioAudioId=take['audioId'], source=str(wav_file), exports=files,
            review=cue.get('review') if cue.get('listeningAccepted') else 'Generated and format/duration measured; owner listening audition pending.')
        save_profile(document)
        print(cue['id'], json.dumps({key: value['bytes'] for key,value in files.items()}), flush=True)
    if any(not cue.get('file') or not (ROOT / cue['file']).is_file() for cue in document['cues']):
        document['status'] = 'partial-audition-awaiting-generation'
        save_profile(document)
        print('Selected cues exported; the remaining pack is incomplete.', flush=True)
        return
    document['status'] = 'audition-generated-awaiting-listening'
    document['provider']['status'] = 'VoxCPM2 audition generated with a saved original speaker and pinned greeting reference'
    document['production'].update(filesGenerated=True, listeningReview='Pending owner audition',
        purpose='Six-cue actor-preview voice pack',
        currentAudioBytes=sum(c['exports']['ogg']['bytes'] for c in document['cues']),
        auditionPreviewBytes=sum(c['exports']['mp3']['bytes'] for c in document['cues']),
        gameInstallation='Audition only; not installed in game',
        modelSelection='VoxCPM2 selected by owner; authoring models stored on Drive')
    save_profile(document)
    (OUTPUT/'manifest.json').write_text(json.dumps({'version':1,'engine':'voxcpm2','profileId':profile_id,
        'kind':'original-synthetic-character-voice','language':'ja-JP','scope':'local-audition',
        'listeningReview':'pending owner audition','cues':document['cues']},ensure_ascii=False,indent=2)+'\n')
    print(f"{len(document['cues'])}-cue pack exported; new-cue listening acceptance remains pending.", flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--actor', choices=['amber-outrider', 'yae-miko'], default='amber-outrider')
    parser.add_argument('--revision', default='audition-v1')
    parser.add_argument('--cues', nargs='+', choices=['hi', 'bye', 'attack', 'hurt', 'thanks', 'encouragement'],
                        help='Render only the revised cues, retaining completed unchanged cues.')
    settings = parser.parse_args()
    if not settings.revision.replace('-', '').isalnum():
        parser.error('Use a simple alphanumeric revision name.')
    main(settings.actor, settings.revision, set(settings.cues) if settings.cues else None)
