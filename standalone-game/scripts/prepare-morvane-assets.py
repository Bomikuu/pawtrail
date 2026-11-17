"""Slice approved skeletal cutouts; retain the generated masters and native metadata."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/monster-studio/morvane-ossuary-serpent'
OUT = ROOT / 'public/pawtrail-game/monsters/morvane-ossuary-serpent/v1'
OUT.mkdir(parents=True, exist_ok=True)

def clean(image):
    image.putalpha(image.getchannel('A').point(lambda value: 255 if value > 170 else 0))
    return image

def fit(image, size, padding=6):
    bounds = image.getchannel('A').getbbox()
    if bounds:
        image = image.crop(bounds)
    scale = min((size - padding * 2) / image.width, (size - padding * 2) / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.NEAREST)
    output = Image.new('RGBA', (size, size))
    output.alpha_composite(image, ((size - image.width) // 2, size - padding - image.height))
    return output

def save(image, path):
    image.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA').save(path, lossless=True, method=6)

master = Image.open(SOURCE / 'illustration-master.png').convert('RGBA')
for index, name in enumerate(('normal', 'enraged')):
    cell = clean(master.crop((master.width * index // 2, 0, master.width * (index + 1) // 2, master.height)))
    save(fit(cell, 384), OUT / (name + '.webp'))

master = Image.open(SOURCE / 'parts-master.png').convert('RGBA')
atlas = Image.new('RGBA', (1024, 1024))
for i in range(16):
    x, y = i % 4, i // 4
    cell = clean(master.crop((x * master.width // 4, y * master.height // 4, (x + 1) * master.width // 4, (y + 1) * master.height // 4)))
    if i in (2, 10):
        # One paired rib per body joint; a whole chest repeated at every joint
        # obscures the long spine and turns the silhouette into a dense fringe.
        cell = cell.crop(cell.getchannel('A').getbbox())
        cell = cell.crop((0, round(cell.height * .38), cell.width, round(cell.height * .64)))
    if i in (3, 11):
        cell = cell.crop(cell.getchannel('A').getbbox())
        cell = cell.crop((0, round(cell.height * .13), cell.width, round(cell.height * .87)))
    if i in (4, 12, 5, 13):
        # Register the attachment axis vertically before joint-to-joint playback.
        cell = cell.rotate(45 if i in (4, 12) else 20, resample=Image.Resampling.NEAREST, expand=True)
    atlas.alpha_composite(fit(cell, 256), (x * 256, y * 256))
    if i == 0:
        fit(cell, 64, 3).save(OUT / 'icon.png', optimize=True)
        save(fit(cell, 128, 4), OUT / 'portrait.webp')
save(atlas, OUT / 'parts.webp')

manifest = {
    'id': 'morvane-ossuary-serpent', 'version': 1, 'representation': 'native-layered-segmented-2d',
    'atlas': 'parts.webp', 'cellWidth': 256, 'cellHeight': 256, 'columns': 4, 'rows': 4,
    'parts': {'skull': 0, 'jaw': 1, 'ribs': 2, 'spine': 3, 'arm': 4, 'blade': 5, 'leg': 6, 'tail': 7},
    'enragedFrameOffset': 8, 'bodySegments': 33, 'segmentSpacing': 0.6,
    'illustrations': {'normal': 'normal.webp', 'enraged': 'enraged.webp', 'width': 384, 'height': 384},
    'provenance': 'Built-in ImageGen reference-guided masters; hard alpha, slicing, nearest-neighbor and non-dithered palette production export',
    'runtimeBytes': {file.name: file.stat().st_size for file in OUT.iterdir() if file.suffix in ('.png', '.webp')},
}
for destination in (OUT, SOURCE):
    (destination / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest['runtimeBytes']))
