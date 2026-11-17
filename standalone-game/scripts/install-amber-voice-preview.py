"""Publish the completed, owner-authorized Amber voice pack to the actor preview.

Copies compact audio only. Source WAVs and model weights stay on Drive.
This installer does not launch the app or perform browser/automated verification.
"""
import json
import argparse
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / 'assets/actor-appearances/profiles/amber-outrider/voice-audition-v1.json'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/voices/amber-outrider/v1'
URL = '/pawtrail-game/actor-studio/voices/amber-outrider/v1'
BINDINGS = {
    'hi': ('wave', 'Wave'),
    'bye': ('wave', 'Farewell wave'),
    'attack': ('power_up', 'Power up'),
    'hurt': ('sick', 'Hurt rehearsal'),
    'thanks': ('clap', 'Clap'),
    'encouragement': ('cheer', 'Cheer'),
}


def main(actor_id='amber-outrider', revision='v1'):
    global PROFILE, PUBLIC, URL
    PROFILE = ROOT / 'assets/actor-appearances/profiles' / actor_id / 'voice-audition-v1.json'
    PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/voices' / actor_id / revision
    URL = '/pawtrail-game/actor-studio/voices/' + actor_id + '/' + revision
    document = json.loads(PROFILE.read_text())
    if {cue['id'] for cue in document['cues']} != set(BINDINGS) or len(document['cues']) != 6:
        raise RuntimeError('The complete six-cue pack is required before publishing.')
    cues = []
    for cue in document['cues']:
        if not cue.get('file') or not cue.get('durationSeconds', 0) > 0:
            raise RuntimeError('A cue has not finished rendering: ' + cue['id'])
        source = ROOT / cue['file']
        if source.suffix != '.ogg' or not source.read_bytes().startswith(b'OggS'):
            raise RuntimeError('Expected an actual Opus/Ogg export: ' + str(source))
        action, label = BINDINGS[cue['id']]
        cues.append({key: cue[key] for key in ['id', 'text', 'romanization', 'translation', 'durationSeconds', 'portraitEmotion']} | {
            'file': URL + '/' + source.name, 'bytes': source.stat().st_size,
            'action': action, 'actionLabel': label,
        })
    total = sum(cue['bytes'] for cue in cues)
    if total > document['production']['packTargetBytes']:
        raise RuntimeError('Keep the compact pack within its configured byte budget before publishing.')
    pack = {
        'version': 1, 'actorId': actor_id, 'name': document['name'],
        'language': 'ja-JP', 'profileId': document['provider']['voiceProfileId'],
        'kind': 'original-synthetic-character-voice', 'scope': 'game-and-preview' if document['production'].get('worldIntegration') else 'actor-preview',
        'totalBytes': total, 'cues': cues,
    }
    PUBLIC.mkdir(parents=True, exist_ok=True)
    for cue in document['cues']:
        source = ROOT / cue['file']
        shutil.copy2(source, PUBLIC / source.name)
    (PUBLIC / 'manifest.json').write_text(json.dumps(pack, ensure_ascii=False, indent=2) + '\n')
    catalog = ROOT / 'src/game/runtime/actor-voices.json'
    existing = json.loads(catalog.read_text()) if catalog.exists() else []
    existing = [entry for entry in existing if entry['actorId'] != pack['actorId']] + [pack]
    catalog.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + '\n')
    document['status'] = 'six-cue-pack-installed-in-actor-preview'
    document['provider']['status'] = 'Six cues generated with the same saved original voice; installed in game and preview' if document['production'].get('worldIntegration') else 'Six cues generated with the same saved original voice; installed in the actor preview'
    document['production'].update(
        previewIntegration='Installed; runtime/browser review not performed',
        gameInstallation='Game and actor preview' if document['production'].get('worldIntegration') else 'Actor preview only; world gameplay bindings unchanged',
        listeningReview='Generated cues await owner listening; per-cue acceptance is recorded in the source profile',
        publicAudioBytes=total,
        previewUrl='/play?preview=actors&skin=' + actor_id + '&art=portrait',
    )
    if document['production'].get('worldIntegration'):
        document['status']='six-cue-pack-installed-in-game-and-preview'
    PROFILE.write_text(json.dumps(document, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'published': len(cues), 'opusBytes': total, 'directory': str(PUBLIC),
                      'durations': {cue['id']: round(cue['durationSeconds'], 3) for cue in cues}}, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--actor', choices=['amber-outrider', 'yae-miko'], default='amber-outrider')
    parser.add_argument('--revision', default='v1')
    settings = parser.parse_args()
    if not settings.revision.replace('-', '').isalnum():
        parser.error('Use a simple alphanumeric revision name.')
    main(settings.actor, settings.revision)
