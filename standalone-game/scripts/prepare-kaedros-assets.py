"""Production export of approved ImageGen masters; no generated replacement artwork."""
from pathlib import Path
from PIL import Image
from collections import deque
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/monster-studio/kaedros-embermaw'
OUT = ROOT / 'public/pawtrail-game/monsters/kaedros-embermaw/v1'
OUT.mkdir(parents=True, exist_ok=True)

def fit(image, size, padding=8):
    bounds = image.getchannel('A').getbbox()
    if bounds:
        image = image.crop(bounds)
    scale = min((size - padding * 2) / image.width, (size - padding * 2) / image.height)
    image = image.resize((max(1, round(image.width * scale)), max(1, round(image.height * scale))), Image.Resampling.NEAREST)
    result = Image.new('RGBA', (size, size))
    result.alpha_composite(image, ((size - image.width) // 2, size - padding - image.height))
    return result

def largest_cutout(image):
    """Remove detached neighbouring-cell fragments from the illustration master."""
    alpha = image.getchannel('A'); values = alpha.load(); width, height = image.size
    seen = set(); largest = []
    for y in range(height):
        for x in range(width):
            if values[x, y] < 32 or (x, y) in seen:
                continue
            queue = deque([(x, y)]); seen.add((x, y)); component = []
            while queue:
                px, py = queue.popleft(); component.append((px, py))
                for dx, dy in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(-1,1),(1,-1),(1,1)):
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < width and 0 <= ny < height and values[nx, ny] >= 32 and (nx, ny) not in seen:
                        seen.add((nx, ny)); queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    mask = Image.new('L', image.size); pixels = mask.load()
    for x, y in largest:
        pixels[x, y] = values[x, y]
    image.putalpha(mask)
    return image

master = Image.open(SOURCE / 'illustration-master.png').convert('RGBA')
for index, name in enumerate(('normal', 'enraged')):
    cell = master.crop((master.width * index // 2, 0, master.width * (index + 1) // 2, master.height))
    largest_cutout(fit(cell, 384)).quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA').save(OUT / (name + '.webp'), lossless=True, method=6)
    if index == 0:
        # Crop the defining five-headed silhouette rather than using unrelated icon art.
        head_group = cell.crop((0, 0, cell.width, round(cell.height * .66)))
        fit(head_group, 64, 3).save(OUT / 'icon.png', optimize=True)
        fit(head_group, 128, 4).save(OUT / 'portrait.webp', lossless=True, method=6)

master = Image.open(SOURCE / 'parts-master.png').convert('RGBA')
atlas = Image.new('RGBA', (512, 512))
for i in range(16):
    x, y = i % 4, i // 4
    cell = master.crop((x * master.width // 4, y * master.height // 4, (x + 1) * master.width // 4, (y + 1) * master.height // 4))
    if i in (7, 15):
        # Neck links overlap along a curve. Exclude the exposed tube ends so a
        # continuous throat does not repeat the cutout's open attachment holes.
        cell = cell.crop(cell.getchannel('A').getbbox())
        cell = cell.crop((0, round(cell.height * .19), cell.width, round(cell.height * .80)))
    atlas.alpha_composite(fit(cell, 128, 3), (x * 128, y * 128))
atlas.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA').save(OUT / 'parts.webp', lossless=True, method=6)

manifest = {
    'id': 'kaedros-embermaw', 'version': 1, 'representation': 'native-layered-2d',
    'atlas': 'parts.webp', 'cellWidth': 128, 'cellHeight': 128, 'columns': 4, 'rows': 4,
    'parts': {'torso': 0, 'leftWing': 1, 'rightWing': 2, 'tail': 3, 'headClosed': 4, 'headRoar': 5, 'leg': 6, 'neck': 7},
    'enragedFrameOffset': 8, 'illustrations': {'normal': 'normal.webp', 'enraged': 'enraged.webp', 'width': 384, 'height': 384},
    'icon': {'url': 'icon.png', 'width': 64, 'height': 64},
    'rendering': 'nearest-neighbor, integer display zoom; transparent cutout margins preserved',
    'provenance': 'Built-in ImageGen; supplied hydra reference; production slicing and nearest-neighbor export only',
    'runtimeBytes': {file.name: file.stat().st_size for file in OUT.iterdir() if file.suffix in ('.webp', '.png')},
}
(OUT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(json.dumps(manifest['runtimeBytes']))
