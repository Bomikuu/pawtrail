"""Export the owner-requested authored portrait/illustration motion revision.

Uses complete generated drawings and one uniform scale per sheet. No facial
patches, synthesized intermediate frames, runtime warping or app checks.
Run through uv --with pillow --with brotli python; sources remain versioned.
"""
from pathlib import Path
from collections import deque
import argparse
import brotli
import hashlib
import json
import shutil
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/motion-refresh-2026-11-13'
SOURCES = JOB / 'sources'


def clean(image):
    """Retain the main complete cutout and attached/nearby ornaments."""
    image = image.convert('RGBA')
    a = image.getchannel('A').point(lambda v: 255 if v >= 230 else 0)
    width, height = image.size
    pending = bytearray(a.tobytes())
    components = []
    for seed, value in enumerate(pending):
        if not value:
            continue
        pending[seed] = 0
        group, queue = [], [seed]
        while queue:
            index = queue.pop(); group.append(index)
            x, y = index % width, index // width
            for ny in range(max(0, y - 1), min(height, y + 2)):
                for nx in range(max(0, x - 1), min(width, x + 2)):
                    n = ny * width + nx
                    if pending[n]:
                        pending[n] = 0; queue.append(n)
        components.append(group)
    if not components:
        raise RuntimeError('The generated cell contains no opaque character.')
    main = max(components, key=len)
    selected = Image.new('L', image.size)
    bits = bytearray(width * height)
    for index in main:
        bits[index] = 255
    selected.frombytes(bytes(bits))
    expanded = selected.filter(ImageFilter.MaxFilter(13)).tobytes()
    for component in components:
        if component is main:
            continue
        if len(component) < len(main) * .12 and any(expanded[i] for i in component):
            for index in component:
                bits[index] = 255
    image.putalpha(Image.frombytes('L', image.size, bytes(bits)))
    return image


def cells(path, columns, rows):
    sheet = Image.open(path).convert('RGBA')
    result = []
    for row in range(rows):
        for col in range(columns):
            rect = (round(col * sheet.width / columns), round(row * sheet.height / rows), round((col + 1) * sheet.width / columns), round((row + 1) * sheet.height / rows))
            result.append(clean(sheet.crop(rect)))
    return result


def register(images, size, margin=4, reference=None):
    """Uniform scale; translate whole drawings using the lower torso/base anchor."""
    w, h = size
    boxes = [im.getbbox() for im in images]
    reference_box = reference.getbbox() if reference is not None else (margin, margin, w-margin, h-margin)
    vertical_scale = (reference_box[3] - reference_box[1]) / max(b[3] - b[1] for b in boxes)
    # A portrait is a bust crop. A wider lower shoulder/hair shape must not
    # shrink its whole head during a blink; retain the reference's vertical
    # scale and ordinary lower-bust side crop. Ribbon/head bounds are inspected.
    scale = vertical_scale if reference is not None else min((reference_box[2] - reference_box[0]) / max(b[2] - b[0] for b in boxes), vertical_scale)
    result = []
    for im, box in zip(images, boxes):
        # Anchor the lower quarter, so a moving hair tip cannot recenter a face.
        mask = im.getchannel('A')
        points = [(x, y) for y in range(round(box[3] - (box[3] - box[1]) * .14), box[3]) for x in range(box[0], box[2]) if mask.getpixel((x, y))]
        center = sum(x for x, _ in points) / len(points)
        x, y = w / 2 - center * scale, reference_box[3] - box[3] * scale
        native = im.transform((w, h), Image.Transform.AFFINE, (1 / scale, 0, -x / scale, 0, 1 / scale, -y / scale), Image.Resampling.NEAREST)
        native.putalpha(native.getchannel('A').point(lambda v: 255 if v >= 230 else 0))
        result.append(native)
    return result


def contact(images, size, path, columns=4, zoom=2):
    w, h = size
    out = Image.new('RGBA', (w * columns, h * ((len(images) + columns - 1) // columns)), '#d9dfd3')
    for index, image in enumerate(images):
        out.alpha_composite(image.convert('RGBA'), (index % columns * w, index // columns * h))
    out.resize((out.width * zoom, out.height * zoom), Image.Resampling.NEAREST).save(path)


def portrait():
    catalog_file = ROOT / 'src/game/actor-rig/photo-portrait-catalog.json'
    catalog = json.loads(catalog_file.read_text())
    entry = next(item for item in catalog if item['id'] == 'amber-refined-cel')
    # Always rebuild from the immutable pre-revision pack, not our own output.
    old = ROOT / 'public/pawtrail-game/game-assets/dialogue-portraits/amber-refined-cel-v1/amber-refined-cel'
    manifest = json.loads((old / 'portrait.json').read_text())
    old_source_ids = {ids[0] for pose in manifest['poses'].values() for expression in pose['expressions'].values() for ids in expression['states'].values()}
    width, height = manifest['nativeCell']
    palette = manifest['pixelData']['palette']
    packed = brotli.decompress((old / manifest['pixelData']['file']).read_bytes())
    frames = [packed[i:i + width * height] for i in range(0, len(packed), width * height)]
    lookup = {}
    def indexed(im):
        out = bytearray()
        for r, g, b, a in im.getdata():
            if a < 230:
                out.append(0); continue
            color = r, g, b
            if color not in lookup:
                lookup[color] = min(range(1, len(palette)), key=lambda i: 3 * (palette[i][0] - r)**2 + 4 * (palette[i][1] - g)**2 + 2 * (palette[i][2] - b)**2)
            out.append(lookup[color])
        return bytes(out)
    def image(raw):
        out = Image.new('RGBA', (width, height))
        out.putdata([(*palette[i][:3], 255 if i else 0) for i in raw])
        return out
    author = JOB / 'portrait'; author.mkdir(exist_ok=True)
    source_map = []
    state_sheet = cells(SOURCES / 'portrait-neutral-states.png', 4, 3) if (SOURCES / 'portrait-neutral-states.png').exists() else None
    for pose_number, (pose, filename) in enumerate([('front-pout', 'portrait-front.png'), ('three-quarter-left', 'portrait-quarter.png'), ('head-tilt-smile-right', 'portrait-tilt.png')]):
        drawings = register(cells(SOURCES / filename, 4, 3), (width, height), 3)
        new_ids = []
        natives = []
        for index, drawing in enumerate(drawings):
            raw = indexed(drawing)
            new_ids.append(len(frames)); frames.append(raw); manifest['frames'].append([0, 0, width, height])
            native = image(raw); natives.append(native); native.save(author / f'{pose}-{index:02d}.png')
            source_map.append({'pose': pose, 'source': filename, 'cell': [index % 4, index // 4], 'frame': new_ids[-1]})
        perf = manifest['poses'][pose]['expressions']['neutral']
        perf['states']['rest'] = new_ids
        perf['idlePerformance'] = {'sequence': list(range(12)), 'durationsMs': [125] * 12}
        if state_sheet:
            states = register(state_sheet[pose_number*4:pose_number*4+4], (width, height), 3, reference=natives[0])
            for state, drawing in zip(['half','closed','small','open'], states):
                raw = indexed(drawing); frame = len(frames); frames.append(raw)
                perf['states'][state] = [frame, frame]
                image(raw).save(author / f'{pose}-{state}.png')
                source_map.append({'pose':pose,'source':'portrait-neutral-states.png','state':state,'frame':frame})
        contact(natives, (width, height), author / f'{pose}-contact.png')
        natives[0].save(author / f'{pose}-motion.gif', save_all=True, append_images=natives[1:], duration=125, loop=0, disposal=2)
    # Drop only unreferenced old neutral drawings. Retain all existing emotion
    # artwork and any frame shared by another expression.
    used = sorted({i for pose in manifest['poses'].values() for expression in pose['expressions'].values() for ids in expression['states'].values() for i in ids})
    source_count = len(old_source_ids.intersection(used)) + len(source_map)
    remap = {old:i for i,old in enumerate(used)}
    frames = [frames[i] for i in used]
    for pose in manifest['poses'].values():
        for expression in pose['expressions'].values():
            expression['states'] = {state:[remap[i] for i in ids] for state,ids in expression['states'].items()}
    for item in source_map: item['frame'] = remap[item['frame']]
    manifest['pixelData']['frameCount'] = len(frames)
    manifest['motionRevision'] = 'authored-idle-v2'
    manifest['motionScope'] = 'Neutral idle: 12 complete authored frames per existing angle, with matching whole blink/speech drawings. Other five expressions retain existing artwork.' if state_sheet else 'Neutral idle: 12 complete authored frames per existing angle. Other five expressions and blink/speech drawings retained.'
    manifest['reviewStatus'] = 'candidate; source and native contacts inspected, live cycle pending owner review'
    # Native lossless WebP is directly decoded by the browser, including the
    # standalone game without the social application's Brotli API adapter.
    atlas = Image.new('RGBA', (width * 12, height * ((len(frames) + 11) // 12)))
    for i, raw in enumerate(frames):
        atlas.paste(image(raw), (i % 12 * width, i // 12 * height))
    import io
    output = io.BytesIO(); atlas.save(output, format='WEBP', lossless=True, method=6)
    encoded = output.getvalue()
    manifest.pop('pixelData')
    manifest['atlas'] = 'portrait.webp'
    manifest['encoding'] = 'lossless-webp-complete-frames'
    manifest['frames'] = [[i % 12 * width, i // 12 * height, width, height] for i in range(len(frames))]
    revision = hashlib.sha256(encoded + json.dumps(manifest, sort_keys=True).encode()).hexdigest()[:12]
    folder = f'/pawtrail-game/game-assets/dialogue-portraits/amber-refined-cel-motion-v2/{revision}'
    destination = ROOT / ('public' + folder)
    destination.mkdir(parents=True, exist_ok=True)
    shutil.copytree(old / 'reference', destination / 'reference', dirs_exist_ok=True)
    (destination / 'portrait.webp').write_bytes(encoded)
    (destination / 'portrait.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
    complete = sum(f.stat().st_size for f in destination.rglob('*') if f.is_file())
    reference = sum(f.stat().st_size for f in (destination / 'reference').glob('*') if f.is_file())
    if complete > entry['budgetBytes']:
        raise RuntimeError(f'Portrait bundle is {complete} bytes; keep the owner’s 300 KB cap before publication.')
    entry.update(folder=folder, revision=revision, uniqueFullFrames=len(frames), sourceImagesUsed=source_count, completeBytes=complete, referenceBytes=reference, runtimeBytes=complete-reference, idleFramesPerAngle=12, encoding='lossless-webp-complete-frames')
    catalog_file.write_text(json.dumps(catalog, indent=2) + '\n')
    (author / 'publication.json').write_text(json.dumps(entry, indent=2) + '\n')
    (author / 'source-map.json').write_text(json.dumps(source_map, indent=2) + '\n')
    print('PORTRAIT_PUBLISHED', json.dumps({'frames':len(frames), 'bundleBytes':complete, 'revision':revision}), flush=True)


def illustration(kind):
    boss = kind == 'boss'
    name = 'vaelrith-illustration' if boss else 'amber-full-body-motion'
    size = (384, 256) if boss else (192, 320)
    images = register(cells(SOURCES / (name + '.png'), 4, 4 if boss else 3), size, 5 if boss else 7)
    # Use one authored palette across the whole loop; do not quantize each frame
    # independently and introduce palette shimmer.
    colors = Image.new('RGB', (size[0] * 4, size[1] * ((len(images)+3)//4)), '#1d1721')
    for i, im in enumerate(images): colors.paste(im.convert('RGB'), (i % 4 * size[0], i // 4 * size[1]))
    pal = colors.quantize(colors=127, method=Image.Quantize.MEDIANCUT)
    natives = []
    for im in images:
        native = im.convert('RGB').quantize(palette=pal, dither=Image.Dither.NONE).convert('RGBA'); native.putalpha(im.getchannel('A')); natives.append(native)
    images = natives
    revision = hashlib.sha256(b''.join(im.tobytes() for im in images)).hexdigest()[:12]
    folder = f'/pawtrail-game/monsters/vaelrith-riftbound/illustration-v2-{revision}' if boss else f'/pawtrail-game/actor-studio/illustrations/amber-outrider/full-body-v3-{revision}'
    destination = ROOT / ('public' + folder); destination.mkdir(parents=True, exist_ok=True)
    atlas = Image.new('RGBA', (size[0] * 4, size[1] * ((len(images)+3)//4)))
    for i, im in enumerate(images): atlas.paste(im, (i % 4 * size[0], i // 4 * size[1]))
    atlas.save(destination / 'atlas.webp', lossless=True, method=6)
    images[0].save(destination / 'poster.webp', lossless=True, method=6)
    manifest = {'version':3,'id':name,'revision':revision,'nativeSize':list(size),'atlas':'atlas.webp','poster':'poster.webp',
        'frames':[{'id':i,'rect':[i%4*size[0], i//4*size[1], *size]} for i in range(len(images))],
        'sequence':list(range(len(images))), 'durationMs':[100 if boss else 120]*len(images),
        'motion':['neck/head counter-sway','jaw/throat breathing','fixed wall anchor'] if boss else ['head/shoulder weight shift','hair/ribbon/coat follow-through','planted feet and full lower body'],
        'review':{'source':'Source/native contacts inspected','liveCycle':'pending owner review; no browser checks performed'},'sourceFile':str((SOURCES/(name+'.png')).relative_to(ROOT))}
    (destination / 'illustration.json').write_text(json.dumps(manifest, indent=2)+'\n')
    author = JOB / ('boss' if boss else 'illustration'); author.mkdir(exist_ok=True)
    contact(images, size, author / 'contact.png', zoom=1 if boss else 2)
    images[0].save(author / 'motion.gif', save_all=True, append_images=images[1:],duration=manifest['durationMs'],loop=0,disposal=2)
    total=sum(p.stat().st_size for p in destination.iterdir() if p.is_file())
    published={'name':'Vaelrith' if boss else 'Amber','folder':folder,'nativeSize':list(size),'style':'Refined cel','motion':'Neck, head & throat movement' if boss else 'Full-body idle · hair, ribbon & coat sway','frames':len(images),'runtimeBytes':total}
    (author / 'publication.json').write_text(json.dumps(published,indent=2)+'\n')
    print('ILLUSTRATION_PUBLISHED',json.dumps(published),flush=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser();parser.add_argument('kind',choices=['portrait','boss','illustration']);settings=parser.parse_args()
    portrait() if settings.kind=='portrait' else illustration(settings.kind)
