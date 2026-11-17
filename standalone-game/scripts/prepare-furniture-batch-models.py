"""Prepare palette-indexed source/hidden-face paint for the approved first batch."""
from pathlib import Path
from PIL import Image
import base64
import hashlib
import json

root = Path(__file__).resolve().parents[1]
settings = {
    'table': dict(width=54, depth=30, height=31, anchor=[32, 53], sidePitch=5),
    'side-table': dict(width=25, depth=21, height=22, anchor=[16, 26], sidePitch=15),
    'bookshelf': dict(width=44, depth=14, height=55.5, anchor=[32, 58], sidePitch=2),
}
book_rows = [
    [[16,15,4,12],[21,17,3,10],[25,15,3,12],[29,18,3,9],[33,14,4,13],[38,18,2,9],[41,15,3,12],[45,18,3,9]],
    [[16,32,3,9],[20,31,3,10],[24,33,4,8],[29,33,3,8],[33,32,3,9],[37,31,4,10],[42,33,3,8],[45,31,3,10]],
    [[16,45,3,10],[20,46,3,9],[24,45,3,10],[28,47,3,8],[32,44,4,11],[37,45,4,10],[42,47,3,8],[45,45,3,10]],
]
models = {}
for item_id, config in settings.items():
    folder = root / 'assets/furniture-studio/references' / item_id
    path = folder / 'reference-set.json'
    info = json.loads(path.read_text())
    if info['review']['state'] not in ['explicit_yes', 'no_response_default']:
        raise ValueError('Resolve the shown 2D reference review before preparing dependent model data')
    source = Image.open(root / info['canonicalFront']).convert('RGBA')
    colors = list(dict.fromkeys(pixel[:3] for pixel in source.get_flattened_data() if pixel[3]))
    palette = ['#00000000'] + ['#%02x%02x%02xff' % color for color in colors]
    lookup = {color: index + 1 for index, color in enumerate(colors)}
    def encode(image):
        indices = []
        for pixel in image.get_flattened_data():
            if pixel[3] < 128:
                indices.append(0)
                continue
            color = pixel[:3]
            if color not in lookup:
                closest = min(colors, key=lambda c: sum((c[i] - color[i]) ** 2 for i in range(3)))
                lookup[color] = lookup[closest]
            indices.append(lookup[color])
        return dict(width=image.width, height=image.height, indices=base64.b64encode(bytes(indices)).decode())
    views = info['derivedReferences']['views']
    models[item_id] = dict(source='/' + info['canonicalFront'].removeprefix('public/'),
        sha256=info['sourceSha256'], sheet=str((folder / info['selectedSheet']).relative_to(root)),
        sheetSha256=info['sheetSha256'], palette=palette, sourceFrame=dict(width=source.width,height=source.height,anchor=config['anchor']),
        sourceTexture=encode(source), dimensions={k:config[k] for k in ['width','depth','height']},
        projection=dict(sidePitchDegrees=config['sidePitch'],blendPower=1),
        paintViews={angle:encode(Image.open(root / 'public' / views[angle]['file'].lstrip('/')).convert('RGBA')) for angle in ['90','180','270']},
        referenceViews={'0':dict(file='/' + info['canonicalFront'].removeprefix('public/'),width=source.width,height=source.height,anchor=config['anchor'],label='Original front · canonical'),
            **{angle:views[angle] for angle in ['90','180','270','45','135']}},
        books=book_rows if item_id == 'bookshelf' else [],
        representation='Distinct closed structural parts with canonical front paint and reviewed side/rear paint; no full-object billboard.',
        review=info['review'])
    info['modelCalibration'] = dict(dimensions=models[item_id]['dimensions'],sourceAnchor=config['anchor'],projection=models[item_id]['projection'],
        note='Explicit profile camera calibration compensates for the generated drawings; geometry remains shared and actor projection stays native.')
    path.write_text(json.dumps(info,indent=2)+'\n')

out = root / 'src/game/furniture/references/batch-01.json'
out.write_text(json.dumps(models,separators=(',',':'))+'\n')
definitions = root / 'src/game/furniture/definitions.json'
values = json.loads(definitions.read_text())
for item_id, config in settings.items():
    info=json.loads((root/'assets/furniture-studio/references'/item_id/'reference-set.json').read_text())
    item=info['sourceCatalog']
    definition=dict(id=item_id,label=item['label'],model=item_id,reference=item['file'],
        description={'table':'Low honey-oak table with a deep solid apron and four short timber feet.',
            'side-table':'Beveled square table with four legs and a low inset shelf.',
            'bookshelf':'Shallow timber bookcase with three rows of individual books and an inset plain rear.'}[item_id],
        frame=dict(width=96,height=112,anchor=[48,96]),referenceFrame=models[item_id]['sourceFrame'],
        styles=[dict(id=id,label=label,fabric=color,light=light,shade=shade,pillow='#f7dda3',wood=color)
            for id,label,color,light,shade in [('original','Honey oak','#e28c4b','#ffd995','#805a36'),('walnut','Walnut','#8f5c3e','#b9865a','#553b2b'),('pale','Pale oak','#d7bf8f','#f5e5c0','#99815d')]],
        price=item['price'],construction=item.get('construction',dict(seconds=0,materials=[])))
    values['items']=[value for value in values['items'] if value['id']!=item_id]+[definition]
definitions.write_text(json.dumps(values,indent=2)+'\n')
print('Prepared reviewed source/side/rear maps and definitions for:', ', '.join(models))
