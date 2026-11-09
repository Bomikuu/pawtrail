"""Import the reviewed aquarium turnaround without replacing its canonical front."""
from pathlib import Path
from collections import deque
from PIL import Image
import base64, hashlib, json, math

root = Path(__file__).resolve().parents[1]
folder = root / 'assets/furniture-studio/references/aquarium'
source = json.loads((root / 'src/game/furniture/references/aquarium.json').read_text())
sheet = Image.open(folder / 'turnaround-v2.png').convert('RGBA')
revision = hashlib.sha256((folder / 'turnaround-v2.png').read_bytes() + b'alpha224-uniform-v1').hexdigest()[:12]
public = root / 'public/pawtrail-game/furniture-references/aquarium' / revision
public.mkdir(parents=True, exist_ok=True)
colors = [tuple(bytes.fromhex(value[1:7])) for value in source['palette'][1:]]
wood = [color for color in colors if color[0] > color[1] * 1.15 and color[0] > color[2] * 1.5]
names = ['front-generated', 'left-profile', 'back', 'right-profile', 'front-three-quarter', 'rear-three-quarter']
cells = {}
for index, name in enumerate(names):
    cell = sheet.crop((index % 3 * 512, index // 3 * 512, index % 3 * 512 + 512, index // 3 * 512 + 512))
    mask = bytearray(value >= 224 for value in cell.getchannel('A').get_flattened_data())
    largest = []
    for start in range(512 * 512):
        if not mask[start]:
            continue
        mask[start] = 0
        queue = deque([start])
        component = []
        while queue:
            item = queue.popleft()
            component.append(item)
            x, y = item % 512, item // 512
            for dy in [-1, 0, 1]:
                for dx in [-1, 0, 1]:
                    xx, yy = x + dx, y + dy
                    if 0 <= xx < 512 and 0 <= yy < 512:
                        j = yy * 512 + xx
                        if mask[j]:
                            mask[j] = 0
                            queue.append(j)
        if len(component) > len(largest):
            largest = component
    if not largest:
        raise RuntimeError('No opaque object in ' + name)
    xs, ys = [i % 512 for i in largest], [i // 512 for i in largest]
    bounds = (min(xs), min(ys), max(xs) + 1, max(ys) + 1)
    imported = Image.new('RGBA', (512, 512))
    for i in largest:
        x, y = i % 512, i // 512
        imported.putpixel((x, y), cell.getpixel((x, y))[:3] + (255,))
    cells[name] = imported.crop(bounds)
    cells[name].save(public / (name + '-import.png'))
    print(name, bounds, cells[name].size)

scale = 90 / cells['front-generated'].width
references = {'0': {'file': source['source'], 'width': 96, 'height': 64, 'anchor': [48, 60], 'label': 'Original front · canonical'}}
for angle, name, label, baseline in [
    (90, 'left-profile', 'Generated left-facing reference', 103),
    (180, 'back', 'Generated rear reference', 100),
    (270, 'right-profile', 'Generated right-facing reference', 103),
    (45, 'front-three-quarter', 'Generated front three-quarter reference', 106),
    (135, 'rear-three-quarter', 'Generated rear three-quarter reference', 106),
]:
    image = cells[name]
    image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.NEAREST)
    pixels = []
    for rr, gg, bb, aa in image.get_flattened_data():
        if not aa:
            pixels.append((0, 0, 0, 0))
        else:
            color = min(colors, key=lambda value: sum((a-b)**2 for a,b in zip(value, (rr,gg,bb))))
            pixels.append(color + (255,))
    image.putdata(pixels)
    frame = Image.new('RGBA', (96,112))
    frame.alpha_composite(image, ((96-image.width)//2, baseline-image.height))
    file = f'reference-{angle}.png'
    frame.save(public / file)
    references[str(angle)] = {'file': '/' + str(public.relative_to(root / 'public')) + '/' + file,
        'width': 96, 'height': 112, 'anchor': [48,96], 'label': label,
        'generatedCell': name, 'footBaseline': baseline}

patches = {}
def patch(name, cell, rect, size):
    image = cells[cell]
    bounds = [round(value * (image.width if i % 2 == 0 else image.height)) for i,value in enumerate(rect)]
    image = image.crop(bounds).resize(size, Image.Resampling.NEAREST)
    pixels = []
    for rr,gg,bb,aa in image.get_flattened_data():
        color = min(wood, key=lambda value: sum((a-b)**2 for a,b in zip(value, (rr,gg,bb))))
        pixels.extend(color + (255,))
    patches[name] = {'width': size[0], 'height': size[1], 'rgba': base64.b64encode(bytes(pixels)).decode()}
patch('cabinetSide', 'left-profile', [.10,.66,.90,.94], (22,18))
patch('cabinetRear', 'back', [.04,.66,.96,.93], (88,18))
patch('hoodSide', 'left-profile', [.06,.11,.94,.19], (22,4))
patch('hoodRear', 'back', [.025,.08,.975,.155], (88,4))
patch('timberEdge', 'back', [.08,.565,.92,.63], (88,4))
metadata = {'version':1, 'sheet':'assets/furniture-studio/references/aquarium/turnaround-v2.png',
    'sheetSha256':hashlib.sha256((folder/'turnaround-v2.png').read_bytes()).hexdigest(),
    'referenceViews':references, 'patches':patches,
    'projection':{'sidePitchDegrees':8,'blendPower':2,'blend':'sin(yaw)^2',
        'nativeActorCamera':[0,34.5,90],'note':'Profile and three-quarter pitch calibrated to the accepted sheet; actor artwork retains its native camera.'},
    'dimensions':{'width':90,'depth':8/(34.5/math.hypot(90,34.5)),'hoodTop':54/(90/math.hypot(90,34.5))},
    'import':{'alphaCutoff':224,'foreground':'largest 8-connected component per cell','filter':'nearest','palette':'original aquarium palette','uniformScale':scale},
    'calibration':'Original front stays canonical. Generated references share one uniform scale; foot baselines reflect facing-specific floor depth. Explicit projection calibration is separate from physical geometry.'}
(root/'src/game/furniture/references/aquarium-turnaround.json').write_text(json.dumps(metadata,indent=2)+'\n')
manifest = json.loads((folder/'reference-set.json').read_text())
manifest['nativeImport'] = str(public.relative_to(root))
manifest['technicalReview'] = {'alpha':'Raw tool output retains a halo; native import removes it with alpha224 and component isolation.', 'scale':scale,
    'findings':['Two source fish, plain cabinet rear and four corner feet retained. The canonical source has four front compartments; generated two-door fronts do not override that source layout.','Profiles and three-quarter cameras are approximate and recorded explicitly.','Source front and source fish remain the canonical identity artwork.']}
(folder/'reference-set.json').write_text(json.dumps(manifest,indent=2)+'\n')
