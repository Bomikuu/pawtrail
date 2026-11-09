"""Pack existing, complete native portraits. Playback never assembles face parts.

Run from the workspace root. The optional breath variant is prepared here, once,
from the lower torso; it is an ordinary complete atlas frame at runtime.
"""
from pathlib import Path
from PIL import Image
import hashlib
import json
import sys

config_path = Path(sys.argv[1]).resolve()
data = json.loads(config_path.read_text())
out = config_path.parent
source = Path(data['source'])
native_source = Path(data.get('nativeSource', source / 'native'))
performance_file = Path(data['performanceFile']) if data.get('performanceFile') else source / 'runtime' / data['id'] / 'portrait.json'
old_manifest = json.loads(performance_file.read_text())
width, height = old_manifest['nativeCell']
runtime = out / 'runtime' / data['id']
references = runtime / 'reference'
references.mkdir(parents=True, exist_ok=True)
for previous_reference in references.glob('*.png'):
    previous_reference.unlink()
palette = Image.open(native_source / 'front-pout-neutral-rest.png').getpalette()
tiles, rectangles, identities = [], [], {}
provenance, poses = [], {}


def indexed(image):
    colors = [tuple(palette[n:n + 3]) for n in range(0, len(palette), 3)]
    lookup = {rgb: n for n, rgb in reversed(list(enumerate(colors)))}
    # Palette index zero is reserved for transparency.
    pixels = bytes(lookup[tuple(pixel[:3])] if pixel[3] else 0 for pixel in image.getdata())
    result = Image.frombytes('P', image.size, pixels)
    result.putpalette(palette)
    result.info['transparency'] = 0
    return result


def add(image):
    digest = hashlib.sha256(image.tobytes()).hexdigest()
    if digest not in identities:
        identities[digest] = len(tiles)
        tiles.append(image)
    return identities[digest]


for pose, old_pose in old_manifest['poses'].items():
    expressions = {}
    for emotion, performance in old_pose['expressions'].items():
        closed_eyes = performance.get('eyesClosedAtRest', emotion == 'happy')
        states = {}
        for state in ['rest', 'half', 'closed', 'small', 'open']:
            source_state = 'rest' if data.get('holdClosedEyeBlinks') and closed_eyes and state in ['half', 'closed'] else state
            filename = native_source / f'{pose}-{emotion}-{source_state}.png'
            image = Image.open(filename).convert('RGBA')
            ids = [add(image)]
            # A pre-exported native breath pose: no runtime displacement, scaling,
            # masks, synthesized eyelids, mouth replacement or frame blending.
            breath = performance['breathing']
            boundary, anchor = breath['torsoStartY'], height - breath['anchorRows']
            if state == 'rest':
                raised = image.copy()
                raised.paste(image.crop((0, boundary + 1, width, anchor)), (0, boundary))
                raised.paste(image.crop((0, anchor - 1, width, anchor)), (0, anchor - 1))
                ids.append(add(raised))
            else:
                # Use the actual whole motion drawing unchanged. The optional
                # idle breath doesn't manufacture variants for blink/speech.
                ids.append(ids[0])
            states[state] = ids
            provenance.append({'pose': pose, 'emotion': emotion, 'state': state,
                               'source': str(filename), 'sourceSha256': hashlib.sha256(filename.read_bytes()).hexdigest(), 'completeFrameIds': ids})
        period = performance['breathing']['periodMs']
        expressions[emotion] = {
            'states': states,
            'eyesClosedAtRest': closed_eyes,
            'blinkPerformance': performance['blinkPerformance'],
            'speechPerformance': performance['speechPerformance'],
            'breathPerformance': {'sequence': [0, 1, 0], 'durationsMs': [round(period * .35), round(period * .3), round(period * .35)]},
        }
        if not data.get('postersOnly') or emotion == 'neutral':
            Image.open(native_source / f'{pose}-{emotion}-rest.png').save(
                references / f'{pose}-{emotion}.png', optimize=True)
    poses[pose] = {'expressions': expressions}

# Losslessly compress complete palette-indexed frames as one sprite asset.
# This is image decoding, not runtime facial compositing: each decoded frame is
# already a complete immutable portrait, identical to the exported native PNG.
import subprocess
raw = b''.join(indexed(image).tobytes() for image in tiles)
compressor = "import z from 'node:zlib';const chunks=[];for await(const c of process.stdin)chunks.push(c);process.stdout.write(z.brotliCompressSync(Buffer.concat(chunks),{params:{[z.constants.BROTLI_PARAM_QUALITY]:11,[z.constants.BROTLI_PARAM_LGWIN]:22}}));"
encoded = subprocess.run(['node', '--input-type=module', '-e', compressor], input=raw, capture_output=True, check=True).stdout
for extension in ['png', 'webp']:
    (runtime / f'portrait.{extension}').unlink(missing_ok=True)
(runtime / 'portrait.frames.br').write_bytes(encoded)
colors = [palette[n:n + 3] for n in range(0, max(max(indexed(image).getdata()) for image in tiles) * 3 + 3, 3)]
manifest = {
    'version': 3, 'kind': 'authored-frame-portrait', 'style': data['name'],
    'nativeCell': [width, height], 'contentBounds': old_manifest['contentBounds'],
    'frames': [[0, 0, width, height] for _ in tiles], 'poses': poses,
    'pixelData': {'file': 'portrait.frames.br', 'encoding': 'indexed8-brotli', 'palette': colors, 'frameCount': len(tiles)},
    'blinkSpeechPolicy': 'blink-frame-priority', 'filter': 'nearest',
    'reviewStatus': 'candidate', 'encoding': 'lossless-indexed-brotli',
}
(runtime / 'portrait.json').write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
(out / 'frame-sources.json').write_text(json.dumps(provenance, indent=2) + '\n')
runtime_bytes = len(encoded) + (runtime / 'portrait.json').stat().st_size
reference_bytes = sum(p.stat().st_size for p in references.glob('*.png'))
report = {
    'id': data['id'], 'name': data['name'], 'playback': 'complete-frames',
    'nativeCell': [width, height], 'contentBounds': old_manifest['contentBounds'],
    'runtimeBytes': runtime_bytes, 'referenceBytes': reference_bytes,
    'completeBytes': runtime_bytes + reference_bytes, 'poseCount': len(poses),
    'expressionCount': 6, 'uniqueFullFrames': len(tiles), 'sourceImagesUsed': len({item['source'] for item in provenance}),
    'encoding': 'lossless-indexed-brotli', 'budgetBytes': data.get('budgetBytes', 300000),
}
(out / 'sizes.json').write_text(json.dumps(report, indent=2) + '\n')
if report['completeBytes'] > report['budgetBytes']:
    raise ValueError(f'Complete style exceeds the cap: {report["completeBytes"]}')
print(json.dumps(report, indent=2))
