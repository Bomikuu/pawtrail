"""Derive source-painted aquarium layers; never resize or repaint the source PNG."""
from pathlib import Path
from PIL import Image
import base64, hashlib, json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'public/assets/game/housing/furniture/cozy-room-v1/aquarium-v1.png'
im = Image.open(SOURCE).convert('RGBA')
width, height = im.size
palette = ['#00000000']
indices = []
for pixel in im.get_flattened_data():
    color = '#%02x%02x%02x%02x' % pixel if pixel[3] else '#00000000'
    if color not in palette:
        palette.append(color)
    indices.append(palette.index(color))

def is_water(x, y):
    r, g, b, _ = im.getpixel((x, y))
    return r < g * .5 and b > g * .5

fish_rects = [[29, 21, 12, 6], [49, 25, 11, 6]]
fish_layers = []
removed = set()
for x, y, w, h in fish_rects:
    layer = [0] * (width * height)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if not is_water(xx, yy):
                index = yy * width + xx
                layer[index] = indices[index]
                removed.add(index)
    fish_layers.append(layer)

water = [0] * (width * height)
plants = [0] * (width * height)
for y in range(14, 43):
    for x in range(7, 89):
        index = y * width + x
        if index not in removed and (y < 19 or is_water(x, y)):
            water[index] = indices[index]
        else:
            candidates = [xx for xx in range(7, 89) if is_water(xx, y)]
            if not candidates:
                candidates = [xx for xx in range(7, 89) if is_water(xx, min(y, 35))]
            sx = min(candidates, key=lambda xx: abs(xx - x))
            sy = y if is_water(sx, y) else min(y, 35)
            water[index] = indices[sy * width + sx]
            if index not in removed:
                plants[index] = indices[index]

frame = [0] * (width * height)
for y in range(14, 43):
    for x in [5, 6, 89, 90]:
        frame[y * width + x] = indices[y * width + x]

def encoded(values):
    return base64.b64encode(bytes(values)).decode()

data = {
    'source': '/assets/game/housing/furniture/cozy-room-v1/aquarium-v1.png',
    'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
    'width': width, 'height': height, 'anchor': [48, 60],
    'palette': palette,
    'layers': {name: encoded(values) for name, values in {
        'source': indices, 'water': water, 'plants': plants, 'frame': frame,
        'fish1': fish_layers[0], 'fish2': fish_layers[1],
    }.items()},
    'landmarks': {
        'opaqueBounds': [3, 2, 90, 62], 'hoodTop': [4, 2, 88, 8],
        'hoodFront': [4, 10, 88, 4], 'water': [7, 14, 82, 29],
        'tankBase': [3, 43, 90, 5], 'cabinet': [4, 48, 88, 14],
        'feet': [5, 62, 86, 2], 'fish': fish_rects, 'frontCompartmentCount': 4,
    },
    'normalizedLandmarks': {
        'hoodBottom': 14 / height, 'waterBottom': 43 / height,
        'cabinetTop': 48 / height, 'cabinetBottom': 62 / height,
    },
    'render': {
        'projection': 'orthographic', 'nativeFrame': [96, 112],
        'nativeAnchor': [48, 96], 'cameraPosition': [0, 34.5, 90],
        'cameraTarget': [0, 0, 0], 'frustum': [-48, 48, 96, -16, .1, 300],
        'origin': 'centered floor pivot; canonical front reference anchor (48,60)', 'toneMapping': 'none',
        'outputColorSpace': 'srgb', 'filter': 'nearest', 'antialias': False,
        'referenceFacing': 0, 'referencePhase': 0,
    },
}
(ROOT / 'src/game/furniture/references/aquarium.json').write_text(json.dumps(data, indent=2) + '\n')
print('Prepared six source layers and measured landmarks from the original 96×64 aquarium.')
