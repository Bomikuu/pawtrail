"""Production slicing and registration of the approved reaper ImageGen masters."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/monster-studio/vesper-hollow-reaper'
OUT = ROOT / 'public/pawtrail-game/monsters/vesper-hollow-reaper/v1'
OUT.mkdir(parents=True, exist_ok=True)

def fit(image, size, padding=6):
    image.putalpha(image.getchannel('A').point(lambda value: 255 if value > 170 else 0))
    bounds = image.getchannel('A').getbbox()
    if bounds:
        image = image.crop(bounds)
    ratio = min((size - padding * 2) / image.width, (size - padding * 2) / image.height)
    image = image.resize((max(1, round(image.width * ratio)), max(1, round(image.height * ratio))), Image.Resampling.NEAREST)
    output = Image.new('RGBA', (size, size)); output.alpha_composite(image, ((size - image.width) // 2, size - padding - image.height))
    return output

def save(image, path):
    image.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA').save(path, lossless=True, method=6)

master = Image.open(SOURCE / 'illustration-master.png').convert('RGBA')
for index, name in enumerate(('normal', 'enraged')):
    cell = master.crop((master.width * index // 2, 0, master.width * (index + 1) // 2, master.height))
    save(fit(cell, 384), OUT / (name + '.webp'))

master = Image.open(SOURCE / 'parts-master.png').convert('RGBA')
atlas = Image.new('RGBA', (1024, 1024))
for i in range(16):
    x, y = i % 4, i // 4
    cell = master.crop((x * master.width // 4, y * master.height // 4, (x + 1) * master.width // 4, (y + 1) * master.height // 4))
    atlas.alpha_composite(fit(cell, 256), (x * 256, y * 256))
    if i == 0:
        fit(cell, 64, 3).save(OUT / 'icon.png', optimize=True)
        save(fit(cell, 128, 4), OUT / 'portrait.webp')
save(atlas, OUT / 'parts.webp')

manifest = {
    'id': 'vesper-hollow-reaper', 'version': 1, 'representation': 'native-layered-hovering-2d',
    'atlas': 'parts.webp', 'cellWidth': 256, 'cellHeight': 256, 'columns': 4, 'rows': 4,
    'parts': {'hood': 0, 'torso': 1, 'leftSleeve': 2, 'rightSleeve': 3, 'scythe': 4, 'leftHem': 5, 'rightHem': 6, 'trail': 7},
    'enragedFrameOffset': 8, 'weaponGrip': {'x': 0.29, 'y': 0.54}, 'holdingHand': {'x': 0.22, 'y': 0.26}, 'holdingShoulder': {'x': 0.77, 'y': 0.85},
    'anchorConvention': 'Sprite UV coordinates measured from bottom-left of the registered native cell',
    'illustrations': {'normal': 'normal.webp', 'enraged': 'enraged.webp', 'width': 384, 'height': 384},
    'portrait': {'url': 'portrait.webp', 'width': 128, 'height': 128}, 'icon': {'url': 'icon.png', 'width': 64, 'height': 64},
    'provenance': 'Built-in ImageGen from supplied scythe-skeleton reference; hard-alpha, nearest-neighbor and non-dithered palette export',
    'runtimeBytes': {file.name: file.stat().st_size for file in OUT.iterdir() if file.suffix in ('.png', '.webp')},
}
for directory in (OUT, SOURCE):
    (directory / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest['runtimeBytes']))
