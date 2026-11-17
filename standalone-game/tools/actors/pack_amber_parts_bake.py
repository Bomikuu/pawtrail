"""Finish actual Blender frames as native sprites and package the comparison."""
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
import json
import math
import shutil
import struct
import hashlib
import PIL

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/actor-appearances/amber-parts-baked-v1'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-parts-baked-v1'
PUBLIC.mkdir(parents=True, exist_ok=True)
record = json.loads((SOURCE / 'render-record.json').read_text())
if record['previewOnly']:
    raise ValueError('Render the full animation batch before packing it.')
parts = json.loads((SOURCE / 'parts.json').read_text())
colors = ['#211b24', '#32232b', '#49312f', '#604138', '#805341', '#a06a4b', '#c48a64',
          '#f2b78d', '#ffcfaa', '#ffe5bd', '#b87560', '#85534c', '#54212d', '#752235',
          '#a32e3d', '#c74644', '#e35e4c', '#742d34', '#942f3e', '#d6a65b', '#f3d28c',
          '#ad7a42', '#755038', '#543a30', '#30282e', '#49404a', '#68555c', '#8e746a',
          '#b5a08e', '#e1c9a8', '#f4dfbc', '#fff3d7', '#977c65', '#c99347', '#e8ae58']
palette = Image.new('P', (1, 1))
rgb = [int(color[i:i + 2], 16) for color in colors for i in (1, 3, 5)]
palette.putpalette((rgb + rgb[:3] * 256)[:768])
frames, clips = [], {}
for index, frame in enumerate(record['frames']):
    image = Image.open(SOURCE / frame['file']).convert('RGBA').resize((64, 80), Image.Resampling.NEAREST)
    alpha = image.getchannel('A').point(lambda value: 255 if value > 96 else 0)
    pixels = image.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    pixels.putalpha(alpha)
    outline = Image.new('RGBA', (64, 80), '#211b24')
    outline.putalpha(ImageChops.subtract(alpha.filter(ImageFilter.MaxFilter(3)), alpha))
    outline.alpha_composite(pixels); frames.append(outline)
    key = clips.setdefault(frame['action'], {}).setdefault(frame['direction'], {'start': index, 'frames': 0, 'durationMs': next(clip['durationMs'] for clip in parts['clips'] if clip['name'] == frame['action'])})
    key['frames'] += 1
columns, rows = 16, math.ceil(len(frames) / 16)
atlas = Image.new('RGBA', (columns * 64, rows * 80))
for index, frame in enumerate(frames):
    atlas.paste(frame, (index % columns * 64, index // columns * 80))
atlas.save(PUBLIC / 'sprites.png', optimize=True)
for action, directions in clips.items():
    for direction, clip in directions.items():
        sequence = frames[clip['start']:clip['start'] + clip['frames']]
        sequence[0].save(SOURCE / f'{action}-{direction}.webp', save_all=True, append_images=sequence[1:], duration=round(clip['durationMs'] / clip['frames']), loop=0, lossless=True)
views = Image.new('RGBA', (768, 320))
for index, direction in enumerate(['down', 'left', 'up']):
    views.alpha_composite(Image.open(SOURCE / f'renders/idle-{direction}-00.png').convert('RGBA'), (index * 256, 0))
views.save(PUBLIC / 'source-views.webp', lossless=True)
shutil.copy2(SOURCE / 'amber-parts.glb', PUBLIC / 'amber-parts.glb')
glb = (SOURCE / 'amber-parts.glb').read_bytes()
chunk_size = struct.unpack_from('<I', glb, 12)[0]
model = json.loads(glb[20:20 + chunk_size])
categories = {}
for part in parts['parts']:
    categories[part['category']] = categories.get(part['category'], 0) + 1
manifest = {
    'id': 'amber-parts-baked-v1', 'version': 1, 'representation': 'offline-3d-to-2d',
    'url': '/pawtrail-game/actor-studio/amber-parts-baked-v1/sprites.png',
    'frameWidth': 64, 'frameHeight': 80, 'columns': columns, 'rows': rows, 'frames': len(frames),
    'groundPixel': {'x': 32, 'y': 60}, 'anchor': {'x': .5, 'y': .75},
    'directions': ['down', 'left', 'up', 'right'], 'clips': clips,
    'filter': 'nearest', 'outline': 'one native pixel, shared dark contour',
    'authoring': 'reference-guided Blender meshes by parts; not neural mesh generation',
    'face': 'approved Amber texture, mapped onto a curved mesh with bone-driven blink states',
    'sourceModel': '/pawtrail-game/actor-studio/amber-parts-baked-v1/amber-parts.glb',
    'sourceViews': '/pawtrail-game/actor-studio/amber-parts-baked-v1/source-views.webp',
    'sourceFile': 'assets/actor-appearances/amber-parts-baked-v1/amber-parts.blend',
    'sourceModelBytes': len(glb), 'modelMeshes': len(model.get('meshes', [])),
    'sourceModelSha256': hashlib.sha256(glb).hexdigest(),
    'sourceScriptSha256': hashlib.sha256((ROOT / 'tools/actors/build_amber_parts.py').read_bytes()).hexdigest(),
    'modelAnimations': [animation.get('name') for animation in model.get('animations', [])],
    'partCount': len(parts['parts']), 'partCategories': categories,
    'triangles': sum(part['triangles'] for part in parts['parts']),
    'bytes': (PUBLIC / 'sprites.png').stat().st_size, 'decodedAtlasBytes': atlas.width * atlas.height * 4,
    'bake': {'tool': 'Blender 5.0.1 Cycles CPU', 'threads': 2, 'sourceFrame': [256, 320], 'samples': 16, 'pillowVersion': PIL.__version__},
    'runtime': 'sprite atlas playback only; no character mesh, pose evaluation or WebGL renderer',
    'installation': 'comparison only', 'review': 'source and native artwork inspected; live comparison and full actor acceptance pending',
}
for folder in (SOURCE, PUBLIC):
    (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps({'frames': len(frames), 'spriteBytes': manifest['bytes'], 'parts': manifest['partCount'], 'modelAnimations': manifest['modelAnimations']}))
