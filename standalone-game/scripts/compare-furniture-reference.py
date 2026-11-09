"""Authoring comparison of native furniture pixels, aligned by declared source anchors."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import argparse, json

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--id', required=True)
parser.add_argument('--before', help='An existing native asset revision for the before panel')
args = parser.parse_args()
source = root / 'assets/furniture-studio/exports' / args.id
manifest = json.loads((source / 'manifest.json').read_text())
definition = manifest['definition']
frame = definition['frame']
size = (frame['width'], frame['height'])
reference = Image.new('RGBA', size)
original = Image.open(root / 'public' / definition['reference'].lstrip('/')).convert('RGBA')
a = definition['referenceFrame']['anchor']
reference.alpha_composite(original, (frame['anchor'][0] - a[0], frame['anchor'][1] - a[1]))
rendered = Image.open(root / 'public' / manifest['item']['file'].lstrip('/')).convert('RGBA')
if rendered.size != size:
    raise ValueError('Native render dimensions differ from the declared production frame')
changed = Image.new('RGBA', size)
count = exact = silhouette = 0
coordinates = []
for y in range(size[1]):
    for x in range(size[0]):
        before, after = reference.getpixel((x, y)), rendered.getpixel((x, y))
        if before[3] or after[3]:
            count += 1
            exact += before == after
            silhouette += bool(before[3]) != bool(after[3])
            if before != after:
                coordinates.append([x, y])
                changed.putpixel((x, y), (225, 55, 63, 255))
report = {
    'revision': manifest['revision'], 'view': 0, 'phase': 0,
    'method': 'Exact RGBA equality within the union of nontransparent object pixels, aligned by declared anchors. No rescaling/warping; transparent background excluded.',
    'referenceBounds': reference.getbbox(), 'renderBounds': rendered.getbbox(),
    'exactPixels': exact, 'objectPixels': count, 'exactPercent': round(exact / count * 100, 4),
    'silhouetteMismatches': silhouette, 'changedNativeCoordinates': coordinates,
    'limitations': 'This measures the primary image at its source pose, not semantic 3D fidelity. Occupied states and other views need separate review; unseen surfaces are authored interpretations.',
}
(source / 'comparison.json').write_text(json.dumps(report, indent=2) + '\n')
output = root / 'output/playwright'
output.mkdir(parents=True, exist_ok=True)
background = '#e7d9bb'
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)

def board(parts, columns):
    scale = 4
    w, h = size[0] * scale, size[1] * scale
    result = Image.new('RGB', (w * columns, h * ((len(parts) + columns - 1) // columns)), background)
    draw = ImageDraw.Draw(result)
    for index, (label, image) in enumerate(parts):
        canvas = Image.new('RGBA', size, background)
        canvas.alpha_composite(image)
        x, y = index % columns * w, index // columns * h
        result.paste(canvas.resize((w, h), Image.Resampling.NEAREST), (x, y))
        draw.text((x + 12, y + 14), label, font=font, fill='#3d3425')
    return result

primary = [('Original · native scale', reference)]
if args.before:
    old = root / 'public/pawtrail-game/furniture-studio' / args.id / args.before / 'sage-0.png'
    primary.append(('Previous model', Image.open(old).convert('RGBA')))
primary.append(('Source-painted 3D', rendered))
board(primary, len(primary)).save(output / f'{args.id}-fidelity.png')
views = manifest['item']['styles'][0]['views']
turns = [(f'{angle}°', Image.open(root / 'public' / views[str(angle)]['file'].lstrip('/')).convert('RGBA')) for angle in [0, 90, 180, 270]]
board(turns, 4).save(output / f'{args.id}-turntable.png')
board(primary + [('50% aligned overlay', Image.blend(reference, rendered, .5)), ('Changed pixels · red', changed), ('3D side view', turns[1][1])], 3).save(output / f'{args.id}-reference-comparison.png')
native = Image.new('RGBA', (size[0] * 2, size[1]))
native.alpha_composite(reference)
native.alpha_composite(rendered, (size[0], 0))
native.save(output / f'{args.id}-reference-native.png')
print(json.dumps({key: report[key] for key in ['revision', 'exactPercent', 'silhouetteMismatches', 'referenceBounds', 'renderBounds']}))
