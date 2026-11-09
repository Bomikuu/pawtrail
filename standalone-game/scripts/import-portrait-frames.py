"""Import whole generated cells. Never extract or replace facial features."""
from pathlib import Path
from PIL import Image, ImageFilter
import json

import sys
config = Path(sys.argv[1]).resolve()
out = config.parent
runtime_settings = json.loads(config.read_text())
width, height = runtime_settings['nativeCell']
colors = [tuple(int(value[n:n + 2], 16) for n in (1, 3, 5)) for value in runtime_settings['palette']]
cache = {}
native = out / 'native'
native.mkdir(exist_ok=True)
poses = runtime_settings.get('poses', ['front-pout', 'three-quarter-left', 'profile-left', 'head-tilt-smile-right'])
emotions = ['neutral', 'smile', 'happy', 'sad', 'angry', 'surprised']
states = ['rest', 'half', 'closed', 'small', 'open']
registration = []


def indexed(image):
    pixels = bytearray()
    for red, green, blue, alpha in image.getdata():
        if alpha < 230:
            pixels.append(0)
            continue
        rgb = red, green, blue
        if rgb not in cache:
            cache[rgb] = min(range(len(colors)), key=lambda n: 3 * (colors[n][0] - red) ** 2 + 4 * (colors[n][1] - green) ** 2 + 2 * (colors[n][2] - blue) ** 2) + 1
        pixels.append(cache[rgb])
    result = Image.frombytes('P', image.size, bytes(pixels))
    result.putpalette(([0, 0, 0] + [channel for color in colors for channel in color] + [0] * 768)[:768])
    result.info['transparency'] = 0
    return result


def isolate_character(image, radius=3):
    # A generated sheet can put a neighboring sprite's tip across a grid line.
    # Remove disconnected foreign fragments, retaining nearby detached ornaments.
    alpha = image.getchannel('A')
    pending = {(x, y) for y in range(image.height) for x in range(image.width) if alpha.getpixel((x, y))}
    components = []
    while pending:
        seed = pending.pop(); component = [seed]; queue = [seed]
        while queue:
            x, y = queue.pop()
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    point = x + dx, y + dy
                    if point in pending:
                        pending.remove(point); component.append(point); queue.append(point)
        components.append(component)
    main = max(components, key=len)
    selected = Image.new('L', image.size)
    for point in main:
        selected.putpixel(point, 255)
    nearby = selected.filter(ImageFilter.MaxFilter(radius * 2 + 1))
    for component in components:
        if component is main or (not any(x in (0, image.width - 1) for x, y in component) and len(component) < len(main) * .15 and any(nearby.getpixel(point) for point in component)):
            for point in component:
                selected.putpixel(point, 255)
    cleaned = image.copy(); cleaned.putalpha(selected)
    return cleaned


for pose_number, pose in enumerate(poses):
    sheet = Image.open(out / f'pose-{pose_number}-complete-generated.png').convert('RGBA')
    cell_width, cell_height = sheet.width / 5, sheet.height / 6
    cells = []
    # Real generated gutters are not perfectly uniform. Take an allowance, then
    # isolate the complete character rather than clipping to a guessed cell edge.
    for row, emotion in enumerate(emotions):
        for column, state in enumerate(states):
            cell = sheet.crop((max(0, round(column * cell_width) - 20), max(0, round(row * cell_height) - 8), min(sheet.width, round((column + 1) * cell_width) + 20), min(sheet.height, round((row + 1) * cell_height) + 8)))
            cell.putalpha(cell.getchannel('A').point(lambda alpha: 255 if alpha >= 230 else 0))
            cell = isolate_character(cell, radius=6)
            box = cell.getbbox()
            cells.append((row, column, emotion, state, cell.crop(box)))
    margin_x, margin_y = runtime_settings.get('nativeMargin', [6, 8])
    scale = min((width - margin_x) / max(item[4].width for item in cells), (height - margin_y) / max(item[4].height for item in cells))
    for row, column, emotion, state, cell in cells:
        # One uniform scale per angle; translate the entire drawing to a fixed
        # center/bust baseline. No individual eye, mouth, jaw or nose adjustment.
        offset_x = width / 2 - cell.width / 2 * scale
        offset_y = height - 1 - cell.height * scale
        image = cell.transform((width, height), Image.Transform.AFFINE, (1 / scale, 0, -offset_x / scale, 0, 1 / scale, -offset_y / scale), Image.Resampling.NEAREST)
        image = isolate_character(indexed(image).convert('RGBA'))
        indexed(image).save(native / f'{pose}-{emotion}-{state}.png', optimize=True)
        registration.append({'pose': pose, 'emotion': emotion, 'state': state, 'sheetCell': [column, row], 'scale': scale, 'wholeFrameOffset': [offset_x, offset_y], 'sourceSize': list(cell.size)})
(out / 'registration.json').write_text(json.dumps(registration, indent=2) + '\n')
print(f'Imported {len(registration)} whole generated portrait cells; no face-part compositing.')
