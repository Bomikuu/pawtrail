"""Export the generated glasses rescuer and dialogue portraits at native scale.

Uses the owner's approved image-processing production pass: nearest-neighbor
sampling, the existing game palette, and binary transparency. Does not generate art.
"""
from pathlib import Path
from statistics import median
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public/assets/game/characters/animations/glasses-rescuer'
PORTRAITS = ROOT / 'public/pawtrail-game/game-assets/dialogue-portraits'
GROUPS = [
    ('movement', ['walk_down', 'walk_up', 'walk_left', 'walk_right', 'idle_down', 'idle_up', 'idle_left', 'idle_right']),
    ('social', ['wave', 'laugh', 'dance', 'clap', 'cheer', 'sit', 'sleep', 'give_gift', 'hold_item']),
    ('care-decoration', ['pet', 'feed', 'play', 'refill_water', 'clean', 'carry_supplies', 'pick_up_furniture', 'move_object', 'place_object', 'inspect_furniture']),
]
colors = json.loads((ROOT / 'public/pawtrail-game/game-assets/animation-manifest.json').read_text())['palette']
palette = Image.new('P', (1, 1))
rgb = [tuple(bytes.fromhex(color.lstrip('#'))) for color in colors]
palette.putpalette([channel for color in (rgb + [rgb[0]] * (256 - len(rgb))) for channel in color])


def binary(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
    return image


def native(image, size):
    image = image.resize(size, Image.Resampling.NEAREST)
    alpha = image.getchannel('A')
    result = image.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
    result.putalpha(alpha)
    return result


def row_bands(image):
    alpha = image.getchannel('A')
    bands, start = [], None
    for y in range(image.height):
        present = sum(alpha.crop((0, y, image.width, y + 1)).tobytes()) > 10 * 255
        if present and start is None:
            start = y
        elif not present and start is not None:
            if y - start > 8:
                bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, image.height))
    return bands


atlas = Image.new('RGBA', (128, 48 * 27))
animations = []
for group, names in GROUPS:
    source = binary(Image.open(DEST / f'{group}-source-v2.png'))
    bands = row_bands(source)
    if len(bands) != len(names):
        raise ValueError(f'{group}: source row layout changed; update extraction before exporting')
    # A single standing-height scale preserves body size through crouching poses.
    scale = 42 / median(bands[i][1] - bands[i][0] for i in range(min(4, len(bands)))) if group == 'movement' else 42 / (bands[0][1] - bands[0][0])
    for name, (top, bottom) in zip(names, bands):
        frames, rects = [], []
        for column in range(4):
            left, right = round(column * source.width / 4), round((column + 1) * source.width / 4)
            cell = source.crop((left, top, right, bottom))
            bounds = cell.getchannel('A').getbbox()
            if bounds is None:
                raise ValueError(f'{name}: generated cell is empty')
            rects.append([left + bounds[0], top + bounds[1], left + bounds[2], top + bounds[3]])
            frames.append(cell.crop(bounds))
        fit = min(scale, 30 / max(f.width for f in frames), 42 / max(f.height for f in frames))
        strip = Image.new('RGBA', (128, 48))
        for column, frame in enumerate(frames):
            frame = native(frame, (max(1, round(frame.width * fit)), max(1, round(frame.height * fit))))
            strip.alpha_composite(frame, (column * 32 + (32 - frame.width) // 2, 46 - frame.height))
        row = len(animations)
        atlas.alpha_composite(strip, (0, row * 48))
        strip.save(DEST / f'{name}-v2.png', optimize=True)
        animations.append(dict(id=name, file=f'{name}-v2.png', frameWidth=32, frameHeight=48, frames=4,
            frameRate=4 if name.startswith('idle') else 7, repeat=-1 if name.startswith(('idle', 'walk')) else 0,
            anchorPixels=[16, 46], atlasRect=[0, row * 48, 128, 48],
            source=f'{group}-source-v2.png', sourceFrameRectsXYXY=rects, exportScale=fit,
            loopReview='not playback-certified', productionReady=False))
atlas.save(DEST / 'complete-v2.png', optimize=True)
(DEST / 'manifest-v2.json').write_text(json.dumps(dict(variant='glasses-rescuer', atlas='complete-v2.png',
    frameWidth=32, frameHeight=48, columns=4, rows=27, animations=animations,
    generationMode='built-in image_gen', nativeExport='nearest-neighbor; existing palette; binary alpha',
    notes=['Wide actions share one row fit scale; fine rigging and loop polish are not certified.']), indent=2) + '\n')

PORTRAITS.mkdir(parents=True, exist_ok=True)
source = binary(Image.open(ROOT / 'assets/character-portraits-v1/source.png'))
portrait_rows = []
for index, name in enumerate(['maya', 'jo', 'lina', 'glasses-rescuer']):
    column, row = index % 2, index // 2
    box = (round(column * source.width / 2), round(row * source.height / 2), round((column + 1) * source.width / 2), round((row + 1) * source.height / 2))
    frame = source.crop(box)
    frame = frame.crop(frame.getchannel('A').getbbox())
    scale = min(88 / frame.width, 92 / frame.height)
    frame = native(frame, (round(frame.width * scale), round(frame.height * scale)))
    result = Image.new('RGBA', (96, 96))
    result.alpha_composite(frame, ((96 - frame.width) // 2, 96 - frame.height))
    result.save(PORTRAITS / f'{name}.png', optimize=True)
    portrait_rows.append(dict(id=name, file=f'{name}.png', width=96, height=96, sourceRect=box))
(PORTRAITS / 'manifest.json').write_text(json.dumps(dict(generationMode='built-in image_gen', portraits=portrait_rows,
    palette=colors, export='nearest-neighbor with binary alpha', source='assets/character-portraits-v1/source.png'), indent=2) + '\n')

index_file = ROOT / 'public/assets/game/characters/complete-characters-manifest.json'
index = json.loads(index_file.read_text())
index['variants'] = [v for v in index['variants'] if v['id'] != 'glasses-rescuer'] + [dict(id='glasses-rescuer',
    file='/assets/game/characters/animations/glasses-rescuer/complete-v2.png',
    manifest='/assets/game/characters/animations/glasses-rescuer/manifest-v2.json', animationCount=27, frameCount=108)]
index['appearanceCount'] = len(index['variants'])
index['animationCount'] = sum(v['animationCount'] for v in index['variants'])
index['frameCount'] = sum(v['frameCount'] for v in index['variants'])
# Prior catalog checks apply only to the original delivery, not to this export.
if 'technicalChecks' in index:
    index['priorDeliveryChecks'] = index.pop('technicalChecks')
index['notes'] = [n for n in index.get('notes', []) if not n.startswith('Glasses rescuer:')] + [
    'Glasses rescuer: 27 new rows; exported at native scale without automated testing or playback certification.']
index_file.write_text(json.dumps(index, indent=2) + '\n')
print('Exported glasses rescuer: 27 rows / 108 frames; four 96x96 dialogue portraits.')
