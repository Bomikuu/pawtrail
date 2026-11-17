"""Import reviewed 3x2 furniture proposals as transparent native references.

This is an art-production importer; untouched tool masters remain in assets/.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from collections import deque
import argparse
import json
import math
import hashlib

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--batch', required=True)
args = parser.parse_args()
queue = json.loads((root / 'assets/furniture-studio/batches/conversion-queue.json').read_text())
batch = next(row for row in queue['batches'] if row['id'] == args.batch)
angles = [0, 90, 180, 270, 45, 135]
labels = ['Generated front', 'Generated left', 'Generated back', 'Generated right', 'Generated front 3/4', 'Generated rear 3/4']

def foreground(cell):
    width, height = cell.size
    pixels = bytearray(cell.getchannel('A').point(lambda a: 255 if a >= 224 else 0).tobytes())
    largest = []
    for seed in range(len(pixels)):
        if not pixels[seed]:
            continue
        pixels[seed] = 0
        pending, component = deque([seed]), []
        while pending:
            at = pending.popleft()
            component.append(at)
            x, y = at % width, at // width
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < width and 0 <= yy < height:
                        neighbor = yy * width + xx
                        if pixels[neighbor]:
                            pixels[neighbor] = 0
                            pending.append(neighbor)
        if len(component) > len(largest):
            largest = component
    alpha = bytearray(width * height)
    for at in largest:
        alpha[at] = 255
    mask = Image.frombytes('L', cell.size, bytes(alpha))
    bounds = mask.getbbox()
    if not bounds:
        raise ValueError('No furniture foreground found in a generated cell')
    cell.putalpha(mask)
    return cell.crop(bounds), bounds

for item_id in batch['items']:
    path = root / 'assets/furniture-studio/references' / item_id / 'reference-set.json'
    info = json.loads(path.read_text())
    sheet = Image.open(path.parent / info['selectedSheet']).convert('RGBA')
    cell_width, cell_height = sheet.width // 3, sheet.height // 2
    cells = [foreground(sheet.crop((i % 3 * cell_width, i // 3 * cell_height,
        (i % 3 + 1) * cell_width, (i // 3 + 1) * cell_height))) for i in range(6)]
    dimensions = info['derivedReferences']['dimensions']
    w, d = dimensions['width'], dimensions['depth']
    scale = w / cells[0][0].width
    calibration = info.get('modelCalibration', {}).get('projection')
    version = hashlib.sha256((info['sheetSha256'] + json.dumps(calibration,sort_keys=True) + 'native224-v2').encode()).hexdigest()[:12]
    output = root / 'public/pawtrail-game/furniture-references' / item_id / version
    output.mkdir(parents=True, exist_ok=True)
    board = Image.new('RGB', (1152, 800), '#eddfc3')
    draw = ImageDraw.Draw(board)
    views = {}
    for i, ((image, bounds), angle, label) in enumerate(zip(cells, angles, labels)):
        size = (round(image.width * scale), round(image.height * scale))
        native = image.resize(size, Image.Resampling.NEAREST)
        depth = abs(w * math.sin(math.radians(angle))) + abs(d * math.cos(math.radians(angle)))
        pitch = math.atan2(34.5,90)
        if calibration:
            weight = abs(math.sin(math.radians(angle))) ** calibration.get('blendPower',1)
            pitch += (math.radians(calibration['sidePitchDegrees']) - pitch) * weight
        baseline = 96 + round(depth * math.sin(pitch) / 2)
        frame = Image.new('RGBA', (96, 112))
        frame.alpha_composite(native, ((96 - size[0]) // 2, baseline - size[1]))
        file = output / f'reference-{angle}.png'
        frame.save(file)
        views[str(angle)] = dict(file='/' + str(file.relative_to(root / 'public')),
            width=96, height=112, anchor=[48, 96], label=label, cellBounds=list(bounds),
            occupiedSize=list(size), footBaseline=baseline)
        thumbnail = frame.crop((0, 20, 96, 112)).resize((384, 368), Image.Resampling.NEAREST)
        board.paste(thumbnail, (i % 3 * 384, i // 3 * 400 + 32), thumbnail)
        draw.text((i % 3 * 384 + 12, i // 3 * 400 + 12), item_id + ' - ' + label, fill='#39271e')
    board.save(path.parent / 'turnaround-native-review.png')
    info['derivedReferences'].update(version=version, uniformScale=scale, views=views)
    path.write_text(json.dumps(info, indent=2) + '\n')
    print(item_id, 'generated native front', views['0']['occupiedSize'])
