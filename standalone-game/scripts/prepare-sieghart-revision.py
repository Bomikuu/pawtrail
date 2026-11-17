"""Scoped Sieghart v2 production export; retains his earlier painterly pack."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import argparse
import hashlib
import json
import math
import shutil
from collections import deque

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/sieghart-revision-v2'
POSES = ['front-pout', 'three-quarter-left', 'head-tilt-smile-right']
EMOTIONS = ['neutral', 'smile', 'happy', 'sad', 'angry', 'surprised']
STATES = ['rest', 'half', 'closed', 'small', 'open']


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n')


def cutout(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 0 if a < 80 else 255 if a >= 200 else a))
    return image


def portrait_cell(image):
    """Remove detached neighbor-cell slivers without moving facial features."""
    image = cutout(image)
    width, height = image.size
    alpha = image.getchannel('A').tobytes()
    seen = bytearray(len(alpha))
    components = []
    for start, value in enumerate(alpha):
        if not value or seen[start]:
            continue
        seen[start] = 1
        queue, component = deque([start]), []
        while queue:
            index = queue.popleft()
            component.append(index)
            x, y = index % width, index // width
            for near in ([index - 1] if x else []) + ([index + 1] if x + 1 < width else []) + ([index - width] if y else []) + ([index + width] if y + 1 < height else []):
                if alpha[near] and not seen[near]:
                    seen[near] = 1
                    queue.append(near)
        components.append(component)
    if not components:
        return image
    main = max(components, key=len)
    left, right = min(i % width for i in main), max(i % width for i in main)
    top, bottom = min(i // width for i in main), max(i // width for i in main)
    cleaned = bytearray(alpha)
    for component in components:
        if len(component) >= len(main) * .08:
            continue
        if any(left - 2 <= i % width <= right + 2 and top - 2 <= i // width <= bottom + 2 for i in component):
            continue
        for index in component:
            cleaned[index] = 0
    image.putalpha(Image.frombytes('L', (width, height), bytes(cleaned)))
    return image


def illustration(variants=('normal', 'enraged')):
    report_path = JOB / 'illustration-export.json'
    reports = json.loads(report_path.read_text()) if report_path.exists() else {}
    for variant in variants:
        source = Image.open(JOB / f'{variant}-generated.png').convert('RGBA')
        cells, boxes, feet = [], [], []
        for i in range(6):
            cell = cutout(source.crop((i % 3 * source.width // 3, i // 3 * source.height // 2,
                                      (i % 3 + 1) * source.width // 3, (i // 3 + 1) * source.height // 2)))
            core = cell.getchannel('A').point(lambda a: 255 if a > 200 else 0)
            bounds = core.getbbox()
            if not bounds:
                raise ValueError(f'Empty {variant} illustration cell {i}')
            band = core.crop((0, bounds[3] - 12, cell.width, bounds[3]))
            xs = [x for y in range(band.height) for x in range(band.width) if band.getpixel((x, y))]
            cells.append(cell)
            boxes.append(bounds)
            feet.append(sum(xs) / len(xs))
        size, margin = 384, 9
        left = max(center - box[0] for center, box in zip(feet, boxes))
        right = max(box[2] - center for center, box in zip(feet, boxes))
        scale = min((size - margin * 2) / (left + right),
                    (size - margin * 2) / max(box[3] - box[1] for box in boxes))
        pivot = (size - (left + right) * scale) / 2 + left * scale
        frames, atlas = [], Image.new('RGBA', (size * 3, size * 2))
        registration = []
        for i, (cell, center, box) in enumerate(zip(cells, feet, boxes)):
            x, y = pivot - center * scale, size - margin - box[3] * scale
            frame = cell.transform((size, size), Image.Transform.AFFINE,
                                   (1 / scale, 0, -x / scale, 0, 1 / scale, -y / scale), Image.Resampling.BICUBIC)
            atlas.paste(frame, (i % 3 * size, i // 3 * size))
            frames.append(frame)
            registration.append({'cell': i, 'scale': scale, 'translation': [x, y], 'sourceBounds': box})
        dest = ROOT / 'public/pawtrail-game/actor-studio/illustrations/sieghart/v2' / variant
        dest.mkdir(parents=True, exist_ok=True)
        atlas.save(dest / 'actor.webp', quality=88, method=6, exact=True)

        def track(name, count, columns, times, opacity=1):
            return {'id': name, 'atlas': name + '.webp', 'nativeSize': [size, size],
                    'frames': [{'id': i, 'rect': [i % columns * size, i // columns * size, size, size]} for i in range(count)],
                    'sequence': list(range(count)), 'durationMs': times, 'offset': [0, 0], 'opacity': opacity}

        # Suitable approved, independently animated quiet background and aura.
        old = ROOT / 'public/pawtrail-game/actor-studio/illustrations/sieghart/v1'
        layer_first = {}
        for name, count, columns, width, height in [('background', 4, 2, 288, 384), ('aura', 6, 3, 288, 384)]:
            original = Image.open(old / f'{name}.webp').convert('RGBA')
            layer_atlas = Image.new('RGBA', (size * columns, size * math.ceil(count / columns)))
            for i in range(count):
                layer = original.crop((i % columns * width, i // columns * height,
                                       i % columns * width + width, i // columns * height + height))
                layer = layer.resize((size, size), Image.Resampling.LANCZOS)
                if name == 'aura':
                    layer = layer.quantize(colors=96, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA')
                layer_atlas.paste(layer, (i % columns * size, i // columns * size))
                if i == 0:
                    layer_first[name] = layer
            layer_atlas.save(dest / f'{name}.webp', quality=76, method=4)
        actor = track('actor', 6, 3, [1000, 750, 850, 850, 750, 1000])
        background = track('background', 4, 2, [1350] * 4, .18)
        aura = track('aura', 6, 3, [900] * 6, .48 if variant == 'enraged' else .35)
        manifest = {**actor, 'variant': variant, 'compositionSize': [size, size], 'backdrop': '#25212d',
                    'rendering': 'smooth', 'layers': [background, aura, actor]}
        write_json(dest / 'illustration.json', manifest)
        poster = Image.new('RGBA', (size, size), '#25212d')
        for name, opacity in [('background', .18), ('aura', aura['opacity'])]:
            layer = layer_first[name].copy()
            layer.putalpha(layer.getchannel('A').point(lambda value: round(value * opacity)))
            poster.alpha_composite(layer)
        poster.alpha_composite(frames[0])
        poster.save(dest / 'poster.webp', quality=88, method=6)
        frames[0].save(dest / 'actor-poster.webp', quality=88, method=6, exact=True)
        poster.save(JOB / f'{variant}-review.png')
        write_json(JOB / f'{variant}-registration.json', registration)
        reports[variant] = {'folder': '/' + str(dest.relative_to(ROOT / 'public')),
                            'bytes': sum(path.stat().st_size for path in dest.iterdir()), 'frames': 6}
    write_json(JOB / 'illustration-export.json', reports)
    print(json.dumps(reports, indent=2), flush=True)


def portraits(job=JOB, actor_id='sieghart', actor_name='Sieghart', happy_closed_poses=None):
    JOB = job
    width, height = 96, 120
    frames, poses, registration = [], {}, []
    native = JOB / 'native'
    native.mkdir(exist_ok=True)
    for pi, pose in enumerate(POSES):
        source = Image.open(JOB / f'portrait-{pi}-generated.png').convert('RGBA')
        cells = []
        for ei, emotion in enumerate(EMOTIONS):
            for si, state in enumerate(STATES):
                cell = portrait_cell(source.crop((round(si * source.width / 5) + 1, round(ei * source.height / 6) + 1,
                                           round((si + 1) * source.width / 5) - 1, round((ei + 1) * source.height / 6) - 1)))
                bounds = cell.getbbox()
                if not bounds:
                    raise ValueError(f'Empty {pose}/{emotion}/{state}')
                cells.append((emotion, state, cell.crop(bounds)))
        scale = min((width - 6) / max(cell.width for _, _, cell in cells),
                    (height - 5) / max(cell.height for _, _, cell in cells))
        expressions = {}
        for emotion, state, cell in cells:
            size = (round(cell.width * scale), round(cell.height * scale))
            cell = cell.transform(size, Image.Transform.AFFINE, (cell.width/size[0],0,0,0,cell.height/size[1],0), Image.Resampling.NEAREST)
            image = Image.new('RGBA', (width, height))
            offset = ((width - cell.width) // 2, height - 1 - cell.height)
            image.alpha_composite(cell, offset)
            image.save(native / f'{pose}-{emotion}-{state}.png', optimize=True)
            # Offline complete torso-inhale drawings for every authored face state;
            # playback never paints, patches or morphs the face at runtime.
            breath = image.copy()
            breath.paste(image.crop((0, 92, width, height - 1)), (0, 91))
            ids = [len(frames), len(frames) + 1]
            frames.extend([image, breath])
            expression = expressions.setdefault(emotion, {'states': {}, 'eyesClosedAtRest': emotion == 'happy' and (happy_closed_poses is None or pose in happy_closed_poses),
                'blinkPerformance': {'sequence': [0, 1, 0], 'durationsMs': [85, 105, 85], 'idleDelayMs': [3200, 4800]},
                'speechPerformance': {'sequence': [0, 1, 2, 1, 0, 1, 2, 0], 'durationsMs': [180, 150, 170, 150, 220, 160, 150, 210]},
                'breathPerformance': {'sequence': [0, 1, 0], 'durationsMs': [1500, 1600, 1500]}})
            expression['states'][state] = ids
            registration.append({'pose': pose, 'emotion': emotion, 'state': state, 'scale': scale,
                                 'offset': offset, 'source': f'portrait-{pi}-generated.png'})
        poses[pose] = {'expressions': expressions}
    atlas = Image.new('RGBA', (width * 10, height * math.ceil(len(frames) / 10)))
    mask, rectangles = Image.new('L', (width, height)), []
    for i, frame in enumerate(frames):
        x, y = i % 10 * width, i // 10 * height
        atlas.paste(frame, (x, y))
        rectangles.append([x, y, width, height])
        mask = ImageChops.lighter(mask, frame.getchannel('A'))
    # Generated transparency can retain arbitrary invisible RGB. Remove those
    # pixels before palette selection/encoding so they neither waste bytes nor
    # displace the character's rare eye/ornament colors from the palette.
    cleared = Image.new('RGBA', atlas.size)
    cleared.paste(atlas, (0, 0), atlas.getchannel('A').point(lambda a: 255 if a else 0))
    atlas = cleared
    bounds = mask.getbbox()
    content = [bounds[0], bounds[1], bounds[2] - bounds[0], bounds[3] - bounds[1]]
    output = JOB / 'portrait-runtime'
    (output / 'reference').mkdir(parents=True, exist_ok=True)
    atlas_name = 'portrait.webp'
    encoding = 'lossless-webp-complete-frames'
    manifest = {'version': 3, 'kind': 'authored-frame-portrait', 'style': 'Refined cel',
                'nativeCell': [width, height], 'contentBounds': content, 'frames': rectangles, 'poses': poses,
                'atlas': atlas_name, 'blinkSpeechPolicy': 'blink-frame-priority', 'filter': 'nearest',
                'reviewStatus': 'candidate', 'encoding': encoding}
    (output / 'portrait.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
    (output / 'portrait.avif').unlink(missing_ok=True)
    for colors in [48,40,32,24]:
        packed = atlas.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert('RGBA')
        packed.save(output / atlas_name, lossless=True, method=6, exact=True)
        for pose in POSES:
            index = poses[pose]['expressions']['neutral']['states']['rest'][0]
            rect = rectangles[index]
            reference=packed.crop((rect[0], rect[1], rect[0] + width, rect[1] + height))
            reference=reference.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
            reference.save(output / f'reference/{pose}-neutral.png', optimize=True)
        total = sum(path.stat().st_size for path in output.rglob('*') if path.is_file())
        if total <= 300000:
            break
    else:
        raise ValueError(f'Refined cel complete bundle exceeds 300 KB: {total}')
    revision = hashlib.sha256((output / 'portrait.json').read_bytes() + (output / atlas_name).read_bytes()).hexdigest()[:12]
    folder = f'/pawtrail-game/game-assets/dialogue-portraits/{actor_id}-refined-cel-v1/{revision}'
    shutil.copytree(output, ROOT / 'public' / folder.lstrip('/'), dirs_exist_ok=True)
    catalog = ROOT / 'src/game/actor-rig/photo-portrait-catalog.json'
    entries = [entry for entry in json.loads(catalog.read_text()) if entry['id'] != actor_id + '-refined-cel']
    reference_bytes = sum(path.stat().st_size for path in (output / 'reference').iterdir())
    entry = {'id': actor_id + '-refined-cel', 'name': 'Refined cel', 'styleKey': 'refined-cel',
             'characterId': actor_id, 'characterName': actor_name, 'playback': 'complete-frames',
             'nativeCell': [width, height], 'contentBounds': content, 'folder': folder, 'revision': revision,
             'poseIds': POSES, 'emotionIds': ['idle', 'smile', 'happy', 'sad', 'angry', 'surprised'],
             'budgetBytes': 300000, 'completeBytes': total, 'referenceBytes': reference_bytes,
             'runtimeBytes': total - reference_bytes, 'poseCount': 3, 'expressionCount': 6,
             'uniqueFullFrames': len(frames), 'sourceImagesUsed': 90, 'encoding': encoding,
             'paletteLimitIncludingTransparency': colors}
    entries.append(entry)
    write_json(catalog, entries)
    write_json(JOB / 'portrait-registration.json', registration)
    write_json(JOB / 'portrait-export.json', entry)
    review = Image.new('RGBA', (width * 6, height * 3), '#d9d3df')
    for pi, pose in enumerate(POSES):
        for ei, emotion in enumerate(EMOTIONS):
            index = poses[pose]['expressions'][emotion]['states']['rest'][0]
            rect = rectangles[index]
            frame = packed.crop((rect[0], rect[1], rect[0] + width, rect[1] + height))
            review.alpha_composite(frame, (ei * width, pi * height))
    review.save(JOB / 'portrait-review.png')
    print(json.dumps(entry, indent=2), flush=True)


def icon():
    original = cutout(Image.open(JOB / 'icon-generated.png'))
    image = original.resize((40, 40), Image.Resampling.NEAREST)
    image = image.quantize(colors=32, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    folder = ROOT / 'public/pawtrail-game/actor-studio/icons/sieghart/v3'
    folder.mkdir(parents=True, exist_ok=True)
    image.save(folder / 'icon.png', optimize=True)
    image.resize((320, 320), Image.Resampling.NEAREST).save(JOB / 'icon-review.png')
    write_json(JOB / 'icon-export.json', {'actor': 'sieghart', 'style': 'Refined cel',
        'angle': 'three-quarter-left', 'nativeSize': [40, 40], 'displaySize': [48, 48],
        'frame': 'shared woody frame and active glow', 'source': 'icon-generated.png',
        'file': '/pawtrail-game/actor-studio/icons/sieghart/v3/icon.png',
        'bytes': (folder / 'icon.png').stat().st_size})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=['illustration', 'enraged', 'portraits', 'icon', 'all'])
    args = parser.parse_args()
    if args.stage in ['illustration', 'all']:
        illustration()
    if args.stage == 'enraged':
        illustration(['enraged'])
    if args.stage in ['portraits', 'all']:
        portraits()
    if args.stage in ['icon', 'all']:
        icon()
