"""Package detail renders by clip so the browser decodes only one small sheet."""
from pathlib import Path
from PIL import Image
import json
import math
import shutil
import hashlib
import argparse

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/actor-appearances/amber-parts-detail-v2'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-parts-detail-v2'
PUBLIC.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--index-only', action='store_true', help='Publish the source-model inspector while the animation bake is running.')
settings = parser.parse_args()
parts = json.loads((SOURCE / 'parts.json').read_text())
if settings.index_only:
    frames = [{'action': clip['name'], 'direction': direction, 'file': f'renders/{clip["name"]}-{direction}-{index:02d}.png'}
              for direction in ['down', 'left', 'up', 'right'] for clip in parts['clips'] for index in range(clip['frames'])]
    record = {'frames': frames, 'previewOnly': False, 'width': 512, 'height': 640}
else:
    record = json.loads((SOURCE / 'render-record.json').read_text())
if record['previewOnly']:
    raise ValueError('Complete the detail animation render before packing.')
groups = {}
for frame in record['frames']:
    groups.setdefault((frame['action'], frame['direction']), []).append(frame)
clips = {}
for (action, direction), frames in groups.items():
    columns, rows = 4, math.ceil(len(frames) / 4)
    name = f'{action}-{direction}.webp'
    if not settings.index_only:
        sheet = Image.new('RGBA', (256 * columns, 320 * rows))
        for index, frame in enumerate(frames):
            image = Image.open(SOURCE / frame['file']).convert('RGBA').resize((256, 320), Image.Resampling.LANCZOS)
            sheet.paste(image, (index % columns * 256, index // columns * 320))
        sheet.save(PUBLIC / name, lossless=True, method=4)
    clips.setdefault(action, {})[direction] = {
        'url': '/pawtrail-game/actor-studio/amber-parts-detail-v2/' + name,
        'frames': len(frames), 'columns': columns, 'rows': rows,
        'durationMs': {'idle': 2500, 'walk': 800, 'run': 500}[action],
        'bytes': (PUBLIC / name).stat().st_size if (PUBLIC / name).exists() else 0, 'decodedBytes': 256 * columns * 320 * rows * 4,
    }
temporary_model = PUBLIC / 'amber-parts.glb.tmp'
shutil.copy2(SOURCE / 'amber-parts.glb', temporary_model)
temporary_model.replace(PUBLIC / 'amber-parts.glb')
views = Image.new('RGBA', (1536, 640))
for index, direction in enumerate(['down', 'left', 'up']):
    views.alpha_composite(Image.open(SOURCE / f'renders/idle-{direction}-00.png').convert('RGBA'), (index * 512, 0))
views.save(PUBLIC / 'source-views.webp', lossless=True)
face = Image.open(SOURCE / 'face-closeup.png').convert('RGBA') if (SOURCE / 'face-closeup.png').exists() else Image.open(SOURCE / 'renders/idle-down-00.png').convert('RGBA').crop((176, 96, 336, 272))
face.save(PUBLIC / 'face-detail.png')
manifest = {
    'id': 'amber-parts-detail-v2', 'frameWidth': 256, 'frameHeight': 320,
    'status': 'baking' if settings.index_only else 'ready',
    'groundPixel': {'x': 128, 'y': 240}, 'displayFrame': {'width': 64, 'height': 80},
    'faceCrop': {'x': 88, 'y': 48, 'width': 80, 'height': 88},
    'clips': clips, 'frames': sum(len(frames) for frames in groups.values()),
    'maximumLoadedClips': 1, 'maximumDecodedClipBytes': max(clip['decodedBytes'] for directions in clips.values() for clip in directions.values()),
    'totalClipBytes': sum(clip['bytes'] for directions in clips.values() for clip in directions.values()),
    'sourceModel': '/pawtrail-game/actor-studio/amber-parts-detail-v2/amber-parts.glb',
    'sourceModelBytes': (PUBLIC / 'amber-parts.glb').stat().st_size,
    'parts': len(parts['parts']), 'triangles': sum(part['triangles'] for part in parts['parts']),
    'faceTexture': {'width': Image.open(SOURCE / 'face-atlas.png').width, 'height': Image.open(SOURCE / 'face-atlas.png').height, 'expressions': 3},
    'sourceViews': '/pawtrail-game/actor-studio/amber-parts-detail-v2/source-views.webp',
    'sourceFace': '/pawtrail-game/actor-studio/amber-parts-detail-v2/face-detail.png',
    'facePreview': 'actual source-model close-up' if (SOURCE / 'face-closeup.png').exists() else 'body-frame face crop',
    'sourceFrame': [record['width'], record['height']],
    'sourceModelSha256': hashlib.sha256((SOURCE / 'amber-parts.glb').read_bytes()).hexdigest(),
    'sourceScriptSha256': hashlib.sha256((ROOT / 'tools/actors/build_amber_parts.py').read_bytes()).hexdigest(),
    'filter': 'smooth detail rendering; native pixel edition remains separate',
    'review': 'source/detail artwork inspected; live browser review pending',
}
for folder in (SOURCE, PUBLIC):
    temporary = folder / 'manifest.json.tmp'
    temporary.write_text(json.dumps(manifest, indent=2) + '\n')
    temporary.replace(folder / 'manifest.json')
# A generated copy in the watched source tree refreshes authoring previews when
# the bake completes; the authoring folder itself is intentionally unwatched.
generated = ROOT / 'src/game/runtime/amber-detail-manifest.json'
temporary = generated.with_suffix('.json.tmp')
temporary.write_text(json.dumps(manifest, indent=2) + '\n'); temporary.replace(generated)
print(json.dumps({'frames': manifest['frames'], 'totalBytes': manifest['totalClipBytes'], 'maximumDecodedClipBytes': manifest['maximumDecodedClipBytes']}))
