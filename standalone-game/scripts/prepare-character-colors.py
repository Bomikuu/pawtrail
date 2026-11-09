"""Slice imagegen character collections into the incumbent native game layout.

The reference packs three 9-row blocks side by side plus one 96px portrait.
Uses the owner's approved exact-export image-processing pass; no art is recolored
by this script. Imagegen supplies each complete source.
"""
from pathlib import Path
import argparse
import json
from statistics import median
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--collection', default='assets/character-colors-v1')
args = parser.parse_args()
SOURCES = ROOT / args.collection
source_prefix = SOURCES.relative_to(ROOT).as_posix()
CHARACTERS = ROOT / 'public/assets/game/characters'
PORTRAITS = ROOT / 'public/pawtrail-game/game-assets/dialogue-portraits'
collection = json.loads((SOURCES / 'generation-prompts.json').read_text())
variants = collection['variants']
base = json.loads((CHARACTERS / 'animations/glasses-rescuer/manifest-v2.json').read_text())
base_colors = json.loads((ROOT / 'public/pawtrail-game/game-assets/animation-manifest.json').read_text())['palette']
index_path = CHARACTERS / 'complete-characters-manifest.json'
index = json.loads(index_path.read_text())
portraits = []

for variant in variants:
    identifier = variant['id']
    directory = CHARACTERS / 'animations' / identifier
    directory.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCES / f'{identifier}-source.png').convert('RGBA')
    # Preserve the generated alpha; threshold only the native export's edges.
    source.putalpha(source.getchannel('A').point(lambda value: 255 if value >= 128 else 0))
    colors = base_colors + variant['colors']
    rgb = [tuple(bytes.fromhex(color.lstrip('#'))) for color in colors]
    palette = Image.new('P', (1, 1))
    palette.putpalette([channel for color in (rgb + [rgb[0]] * (256 - len(rgb))) for channel in color])

    def native(frame, size):
        frame = frame.resize(size, Image.Resampling.NEAREST)
        alpha = frame.getchannel('A')
        result = frame.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
        result.putalpha(alpha)
        return result

    # Generated edit dimensions and row spacing can differ from the reference.
    # Detect actual occupied row bands rather than scaling guessed rectangles.
    bands, start = [], None
    alpha = source.getchannel('A')
    for y in range(source.height):
        present = sum(alpha.crop((0, y, source.width, y + 1)).tobytes()) > 10 * 255
        if present and start is None:
            start = y
        elif not present and start is not None:
            if y - start > 10:
                bands.append((start, y))
            start = None
    if start is not None:
        bands.append((start, source.height))
    if len(bands) != 10:
        raise ValueError(f'{identifier}: source layout changed; update row extraction before exporting')
    scale = 42 / median(bottom - top for top, bottom in bands[:4])

    atlas = Image.new('RGBA', (128, 1296))
    animations = []
    for row, original in enumerate(base['animations']):
        group, band = row // 9, row % 9
        top, bottom = bands[band]
        strip = Image.new('RGBA', (128, 48))
        rects = []
        for column in range(4):
            left, right = round((group * 4 + column) * source.width / 12), round((group * 4 + column + 1) * source.width / 12)
            frame = source.crop((left, top, right, bottom))
            bounds = frame.getchannel('A').getbbox()
            if bounds is None:
                raise ValueError(f'{identifier}: generated cell is empty')
            rects.append([left + bounds[0], top + bounds[1], left + bounds[2], top + bounds[3]])
            frame = frame.crop(bounds)
            fit = min(scale, 30 / frame.width, 42 / frame.height)
            frame = native(frame, (max(1, round(frame.width * fit)), max(1, round(frame.height * fit))))
            strip.alpha_composite(frame, (column * 32 + (32 - frame.width) // 2, 46 - frame.height))
        strip.save(directory / f"{original['id']}-v2.png", optimize=True)
        atlas.alpha_composite(strip, (0, row * 48))
        animations.append(dict(id=original['id'], file=f"{original['id']}-v2.png", frameWidth=32,
            frameHeight=48, frames=4, frameRate=original['frameRate'], repeat=original['repeat'],
            anchorPixels=[16, 46], atlasRect=[0, row * 48, 128, 48], sourceFrameRectsXYXY=rects,
            loopReview='not playback-certified', productionReady=False))
    atlas.save(directory / 'complete-v2.png', optimize=True)
    manifest = dict(variant=identifier, atlas='complete-v2.png', frameWidth=32, frameHeight=48,
        columns=4, rows=27, animations=animations, generationMode='built-in image_gen',
        source=f'{source_prefix}/{identifier}-source.png',
        prompt=f'{source_prefix}/generation-prompts.json', palette=colors,
        description=variant.get('description', variant.get('hair', '')),
        notes=[collection.get('description', 'Hair-color variant of the glasses rescuer; same action layout.'),
               'Nearest-neighbor native export with binary alpha. No automated checks or playback review.',
               'Generated edits can have small pose/pixel differences; fine animation polish is not certified.'])
    (directory / 'manifest-v2.json').write_text(json.dumps(manifest, indent=2) + '\n')
    top, bottom = bands[-1]
    frame = source.crop((0, top, source.width, bottom))
    bounds = frame.getchannel('A').getbbox()
    frame = frame.crop(bounds)
    fit = min(88 / frame.width, 92 / frame.height)
    frame = native(frame, (round(frame.width * fit), round(frame.height * fit)))
    portrait = Image.new('RGBA', (96, 96))
    portrait.alpha_composite(frame, ((96 - frame.width) // 2, 96 - frame.height))
    portrait.save(PORTRAITS / f'{identifier}.png', optimize=True)
    portraits.append(dict(id=identifier, file=f'{identifier}.png', width=96, height=96,
        source=manifest['source'], sourceRect=[bounds[0], top + bounds[1], bounds[2], top + bounds[3]], palette=colors))
    index['variants'] = [entry for entry in index['variants'] if entry['id'] != identifier] + [
        dict(id=identifier, file=f'/assets/game/characters/animations/{identifier}/complete-v2.png',
             manifest=f'/assets/game/characters/animations/{identifier}/manifest-v2.json', animationCount=27, frameCount=108)]

index['appearanceCount'] = len(index['variants'])
index['animationCount'] = sum(entry['animationCount'] for entry in index['variants'])
index['frameCount'] = sum(entry['frameCount'] for entry in index['variants'])
index['productionReady'] = False
index_path.write_text(json.dumps(index, indent=2) + '\n')
(PORTRAITS / collection.get('portraitManifest', 'color-variants-manifest.json')).write_text(json.dumps(dict(generationMode='built-in image_gen',
    portraits=portraits), indent=2) + '\n')

preview = Image.new('RGB', (192 * len(variants), 288), '#fff6e8')
for column, variant in enumerate(variants):
    atlas = Image.open(CHARACTERS / 'animations' / variant['id'] / 'complete-v2.png')
    frame = atlas.crop((0, 4 * 48, 32, 5 * 48)).resize((64, 96), Image.Resampling.NEAREST)
    preview.paste(frame, (column * 192 + 64, 8), frame)
    portrait = Image.open(PORTRAITS / f"{variant['id']}.png").resize((192, 192), Image.Resampling.NEAREST)
    preview.paste(portrait, (column * 192, 96), portrait)
preview.save(SOURCES / 'preview.png')
print(f"Exported {len(variants)} characters and matching portraits; catalog contains {index['appearanceCount']} appearances.")
