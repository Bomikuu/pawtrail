"""Production slicing of the generated 4x4 parts sheet (not a test runner)."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
SOURCE = Path(__file__).with_name('parts-generated.png')
OUT = ROOT / 'public/assets/game/skins/mochi-floating-v1'
PALETTE = ['#34232f', '#59414f', '#806377', '#a17b95', '#c993b6',
           '#e5b1cc', '#f5d9e5', '#fcf9f6', '#eee4ee', '#d1bed6',
           '#c2a9c7', '#f2d9d7', '#eec4c8', '#fffefd', '#1f1723']

def main():
    config_path = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else None
    config = json.loads(config_path.read_text()) if config_path else {}
    source_path = config_path.parent / config['source'] if config_path else SOURCE
    out = ROOT / config['out'] if config_path else OUT
    rows = config.get('rows', [0, .25, .5, .75, 1])
    source = Image.open(source_path).convert('RGBA')
    palette = Image.new('P', (1, 1))
    color_values = config.get('palette', PALETTE)
    colors = [tuple(bytes.fromhex(c[1:])) for c in color_values]
    palette.putpalette([v for c in colors + [colors[0]] * (256 - len(colors)) for v in c])
    out.mkdir(parents=True, exist_ok=True)
    entries = {}

    def export(name, col, row, size, box, mirror=False, bottom=False, rotate=False, open_cap=False, register_span=False):
        cell = source.crop((col * source.width // 4, round(rows[row] * source.height),
                            (col + 1) * source.width // 4, round(rows[row + 1] * source.height)))
        cell.putalpha(cell.getchannel('A').point(lambda a: 255 if a >= 128 else 0))
        bounds = cell.getbbox()
        if not bounds:
            raise ValueError('Generated part is empty: ' + name)
        cell = cell.crop(bounds)
        if rotate:
            cell = cell.transpose(Image.Transpose.ROTATE_90)
        x, y, w, h = box
        ratio = min(w / cell.width, h / cell.height)
        dimensions = (w, h) if register_span else (max(1, round(cell.width * ratio)), max(1, round(cell.height * ratio)))
        cell = cell.resize(dimensions, Image.Resampling.NEAREST)
        if mirror:
            cell = ImageOps.mirror(cell)
        alpha = cell.getchannel('A')
        cell = cell.convert('RGB').quantize(palette=palette, dither=Image.Dither.NONE).convert('RGBA')
        cell.putalpha(alpha)
        canvas = Image.new('RGBA', size)
        canvas.alpha_composite(cell, (x + (w - cell.width) // 2, y + (h - cell.height if bottom else (h - cell.height) // 2)))
        if open_cap:
            # A white overlap tongue joins the two pieces without a dark cap
            # drawn across the elbow/knee. Outer silhouette remains stepped.
            ImageDraw.Draw(canvas).rectangle((25, 20, 38, 30), fill='#fffdfb')
        path = out / (name + '.png')
        canvas.save(path, optimize=True)
        entries[name] = {'file': path.name, 'width': size[0], 'height': size[1], 'bytes': path.stat().st_size}
        return canvas

    for direction, col in [('front', 0), ('right', 1), ('back', 2), ('left', 3)]:
        export('layer-head-' + direction, col, 0, (128, 160), config.get('head_box', (4, 22, 120, 120)))
        export('layer-garment-' + direction, col, 1, (128, 192), config.get('garment_box', (28, 54, 72, 78)), bottom=True)
    joint_layout = config.get('panel_layout') == 'joint-panels-v2'
    for side in ['left', 'right']:
        views = [('front', 2), ('right', 2), ('back', 3), ('left', 2)] if joint_layout else [('front', 2), ('back', 3)]
        for direction, row in views:
            pieces = [('shoulder', 0, (15, 21, 34, 43)),
                      ('elbow', 2, (19, 21, 26, 35)),
                      ('wrist', 1, (22, 40, 20, 22)),
                      ('hip', 2, (14, 21, 36, 49)),
                      ('knee', 2, (18, 21, 28, 47)),
                      ('ankle', 3, ((10, 29, 44, 20) if direction in ['left', 'right'] else (16, 29, 32, 20)))] if joint_layout else [
                      ('shoulder', 0, (12, 26, 40, 40)), ('elbow', 1, (14, 26, 36, 42)),
                      ('hip', 2, (14, 28, 36, 48)), ('knee', 3, (10, 28, 44, 60))]
            for bone, col, box in pieces:
                export('layer-' + bone + '-' + side + '-' + direction, col, row, (64, 96), box,
                       mirror=(side == 'right') != (direction == 'left'),
                       bottom=bone in (['ankle'] if joint_layout else ['hip', 'knee']),
                       rotate=joint_layout and bone == 'shoulder', open_cap=joint_layout and bone in ['elbow', 'knee'],
                       register_span=joint_layout and bone in ['shoulder', 'elbow', 'hip', 'knee'])
    manifest = {'id': config.get('id', 'mochi-floating'), 'version': config.get('version', 1), 'representation': 'joint-attached-directional-cutouts',
                'generator': 'built-in image_gen', 'reference': 'source/reference.png',
                'palette': color_values, 'surfaces': entries,
                'panelLayout': config.get('panel_layout', 'legacy-24'),
                'pivots': {'upperArm_forearm_thigh_shin': [32, 24], 'hand': [32, 48], 'foot': [32, 32]} if joint_layout else None,
                'review': {'source_art': 'visually inspected', 'browser_actions': 'pending; not authorized by current workspace rules'}}
    (out / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'Exported {len(entries)} transparent surfaces, {sum(e["bytes"] for e in entries.values()):,} bytes of PNG artwork.')

if __name__ == '__main__':
    main()
