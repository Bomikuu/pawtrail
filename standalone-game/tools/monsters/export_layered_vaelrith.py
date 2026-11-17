"""Pack the generated cutout parts; retain the editable master and registration."""
from pathlib import Path
from PIL import Image
import argparse
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
AUTHORING = ROOT / 'assets/monster-studio/vaelrith-riftbound/layered-2d'
RUNTIME = ROOT / 'public/pawtrail-game/monsters/vaelrith-riftbound/layered-2d-v1'


def export(source=None):
    AUTHORING.mkdir(parents=True, exist_ok=True)
    RUNTIME.mkdir(parents=True, exist_ok=True)
    master = AUTHORING / 'generated-parts.png'
    if source:
        shutil.copy2(source, master)
    image = Image.open(master).convert('RGBA')
    native = 128
    atlas = Image.new('RGBA', (native * 3, native * 4))
    for row in range(4):
        for column in range(3):
            frame = image.crop((column * image.width // 3, row * image.height // 4,
                                (column + 1) * image.width // 3, (row + 1) * image.height // 4))
            frame = frame.resize((native, native), Image.Resampling.NEAREST)
            atlas.paste(frame, (column * native, row * native))
    atlas.save(RUNTIME / 'part-atlas.png', optimize=True)
    manifest = {
        'version': 1, 'id': 'vaelrith-layered-2d-v1', 'representation': 'layered-2d',
        'generation': 'built-in ImageGen, approved creature identity reference',
        'url': '/pawtrail-game/monsters/vaelrith-riftbound/layered-2d-v1/part-atlas.png',
        'frameWidth': native, 'frameHeight': native, 'columns': 3, 'rows': 4, 'frames': 12,
        'anchor': [64, 64], 'transparent': True, 'neckSegments': 7,
        'parts': {'alert': [0, 1, 2], 'roar': [3, 4, 5], 'hurt': [6, 7, 8], 'neck': 9, 'socket': 10, 'seal': 11},
        'bytes': (RUNTIME / 'part-atlas.png').stat().st_size,
        'decodedAtlasBytes': atlas.width * atlas.height * 4,
        'camera': 'fixed illustration view; zoom allowed, no orbit',
        'poseSource': 'shared 32-sample attack timelines, interpolated part transforms',
        'combat': 'same local MonsterEncounter and weapon runtime as the 3D preview',
        'review': 'generated artwork inspected; live comparison pending owner review',
    }
    for folder in (AUTHORING, RUNTIME):
        (folder / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(RUNTIME / 'part-atlas.png')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path)
    export(parser.parse_args().source)
