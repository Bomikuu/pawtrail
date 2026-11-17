"""Pack authored Amber sprites into the existing native feet/frame contract."""
from pathlib import Path
from PIL import Image
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
AUTHOR = ROOT / 'assets/actor-appearances/amber-native-2d-v1'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-native-2d-v1'


def export(source=None):
    AUTHOR.mkdir(parents=True, exist_ok=True)
    PUBLIC.mkdir(parents=True, exist_ok=True)
    master = AUTHOR / 'generated-master.png'
    if source:
        shutil.copy2(source, master)
    image = Image.open(master).convert('RGBA')
    reference = Image.open(ROOT / 'assets/actor-appearances/exports/amber-outrider/sprites/idle/down/0.png').convert('RGBA')
    reference_bounds = reference.getchannel('A').point(lambda value: 255 if value > 24 else 0).getbbox()
    target_height = reference_bounds[3] - reference_bounds[1]
    parts = []
    for row in range(4):
        for col in range(8):
            frame = image.crop((col * image.width // 8, row * image.height // 4,
                                (col + 1) * image.width // 8, (row + 1) * image.height // 4))
            bounds = frame.getchannel('A').point(lambda value: 255 if value > 24 else 0).getbbox()
            if bounds is None:
                raise ValueError(f'Artwork is missing at row {row}, column {col}')
            part = frame.crop(bounds)
            feet = part.getchannel('A').crop((0, part.height * 3 // 4, part.width, part.height)).point(lambda value: 255 if value > 24 else 0).getbbox()
            axis = (feet[0] + feet[2]) / 2 if feet else part.width / 2
            parts.append((part, axis))
    scale = min(target_height / max(part.height for part, _ in parts),
                29 / max(max(axis, part.width - axis) for part, axis in parts))
    atlas = Image.new('RGBA', (512, 320))
    frames = []
    for index, (part, axis) in enumerate(parts):
        part = part.resize((max(1, round(part.width * scale)), max(1, round(part.height * scale))), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', (64, 80))
        frame.paste(part, (32 - round(axis * scale), 60 - part.height))
        atlas.paste(frame, (index % 8 * 64, index // 8 * 80)); frames.append(frame)
    atlas.save(PUBLIC / 'sprites.png', optimize=True)
    for row, direction in enumerate(['down', 'left', 'up', 'right']):
        sequence = frames[row * 8 + 2:row * 8 + 8]
        sequence[0].save(AUTHOR / f'walk-{direction}.webp', save_all=True, append_images=sequence[1:], duration=133, loop=0, lossless=True)
    manifest = {
        'version': 1, 'id': 'amber-native-2d-comparison-v1', 'representation': 'native-2d',
        'url': '/pawtrail-game/actor-studio/amber-native-2d-v1/sprites.png',
        'frameWidth': 64, 'frameHeight': 80, 'columns': 8, 'rows': 4, 'frames': 32,
        'groundPixel': {'x': 32, 'y': 60}, 'anchor': {'x': .5, 'y': .75},
        'idleFrames': 2, 'strideFrames': 6, 'directions': ['down', 'left', 'up', 'right'],
        'filter': 'nearest', 'generation': 'built-in ImageGen, native 2D artwork; not baked from the rig',
        'registration': 'shared scale, centered feet axis; existing Amber native frame height reference',
        'referenceBodyHeight': target_height, 'bytes': (PUBLIC / 'sprites.png').stat().st_size,
        'decodedAtlasBytes': 512 * 320 * 4,
        'actions': {'idle': 'standing with brief authored blink', 'walk': 'six authored stride frames', 'run': 'same stride frames at faster cadence; separate sprint art not yet authored'},
        'installation': 'comparison only, not the live game actor library',
        'review': 'artwork inspected; live motion and full actor acceptance pending',
    }
    for folder in (AUTHOR, PUBLIC):
        (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(PUBLIC / 'sprites.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    export(parser.parse_args().source)
