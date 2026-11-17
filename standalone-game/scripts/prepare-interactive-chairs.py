"""Prepare approved chair reference paint and definitions; no source art is replaced."""
from pathlib import Path
from PIL import Image
from collections import deque
import base64
import json
import colorsys

root = Path(__file__).resolve().parents[1]
settings = {
    'chair': dict(width=22, depth=20, height=31, seat=12, crops=dict(wood=(11,5,10,3),leg=(8,23,3,6),seat=(8,17,16,5),back=(11,5,10,3),arm=(8,23,3,6),pillow=(11,5,10,3),top=(10,17,12,2))),
    'dining-chair': dict(width=22, depth=20, height=30.5, seat=11.65, crops=dict(wood=(8,3,16,4),leg=(8,23,3,6),seat=(8,14,15,5),back=(8,3,16,4),arm=(8,23,3,6),pillow=(8,14,15,5),top=(10,14,12,2))),
    'armchair': dict(width=33, depth=26, height=30, seat=12.45, crops=dict(wood=(5,57,3,3),leg=(5,57,3,3),seat=(9,50,14,7),back=(6,28,20,15),arm=(2,39,7,17),pillow=(17,38,10,14),top=(10,50,12,3))),
}

def fill(image, exclude=None):
    image=image.convert('RGBA'); pixels=list(image.get_flattened_data()); w,h=image.size
    seen=bytearray(w*h); pending=deque()
    for index,pixel in enumerate(pixels):
        x,y=index%w,index//w
        hidden=exclude and exclude[0]<=x<exclude[2] and exclude[1]<=y<exclude[3]
        if pixel[3]>=128 and not hidden: seen[index]=1;pending.append(index)
    while pending:
        at=pending.popleft();x,y=at%w,at//w
        for other in (at-1 if x else -1,at+1 if x+1<w else -1,at-w if y else -1,at+w if y+1<h else -1):
            if other<0 or seen[other]: continue
            seen[other]=1;pixels[other]=pixels[at];pending.append(other)
    image.putdata([pixel[:3]+(255,) for pixel in pixels]);return image

def encode(image):
    return dict(width=image.width,height=image.height,rgba=base64.b64encode(image.tobytes()).decode())

def upholstery(image):
    image=image.convert('RGBA'); pixels=[]
    for r,g,b,a in image.get_flattened_data():
        hue,sat,_=colorsys.rgb_to_hsv(r/255,g/255,b/255)
        pixels.append((r,g,b,a if .14<=hue<=.29 and sat>=.15 else 0))
    image.putdata(pixels)
    return fill(image)

references={}
definitions=json.loads((root/'src/game/furniture/definitions.json').read_text())
for id,config in settings.items():
    folder=root/'assets/furniture-studio/references'/id; info=json.loads((folder/'reference-set.json').read_text())
    if info['review']['state'] not in ('explicit_yes','no_response_default'): raise ValueError('Reference review is unresolved')
    source=Image.open(root/info['canonicalFront']).convert('RGBA'); plain=fill(source,(17,38,27,52) if id=='armchair' else None)
    patches={}
    for name,(x,y,w,h) in config['crops'].items():
        original=source if name=='pillow' else plain
        patch=original.crop((x,y,x+w,y+h))
        if id=='armchair' and name=='pillow':
            # Remove surrounding sage cloth from the pillow's own material, so
            # upholstery variants cannot expose a green rectangle around it.
            pixels=[]
            for r,g,b,a in patch.get_flattened_data():
                # Cream, orange flower and brown stitching are warm; olive
                # pixels around the silhouette do not belong to the pillow.
                pixels.append((r,g,b,a if r>g+12 else 0))
            patch.putdata(pixels)
        patches[name]=encode(fill(patch))
    reference=dict(source='/' + info['canonicalFront'].removeprefix('public/'),sha256=info['sourceSha256'],sheet=str((folder/info['selectedSheet']).relative_to(root)),sheetSha256=info['sheetSha256'],
        modelSource='src/game/furniture/reference-chairs.ts',dimensions={k:config[k] for k in ('width','depth','height')},seatHeight=config['seat'],patches=patches,
        paintViews={angle:encode((upholstery if id=='armchair' else fill)(Image.open(root/'public'/info['derivedReferences']['views'][angle]['file'].lstrip('/')))) for angle in ('90','180','270')},
        projection=dict(sidePitchDegrees=8,blendPower=2),sourceFrame=dict(width=source.width,height=source.height,anchor=info['sourceCatalog']['anchor']),
        referenceViews={'0':dict(file='/' + info['canonicalFront'].removeprefix('public/'),width=source.width,height=source.height,anchor=info['sourceCatalog']['anchor'],label='Original front · canonical'),**{angle:info['derivedReferences']['views'][angle] for angle in ('90','180','270','45','135')}},
        representation='Closed individual chair frame/cushion volumes, canonical material patches and approved hidden-face painting. No full-object billboard.',review=info['review'])
    references[id]=reference
    styles=[dict(id=key,label=label,fabric=fabric,light=light,shade=shade,pillow='#f7dda3',wood=wood) for key,label,fabric,light,shade,wood in (
        [('original','Sage','#8b9050','#b7bf78','#535c31','#ce9148'),('terracotta','Terracotta','#b86443','#df9c70','#704331','#ce9148'),('cream','Cream','#d7c9a8','#f8e9c9','#95866b','#ce9148')]
        if id=='armchair' else [('original','Honey oak','#a1a65d','#ffd995','#805a36','#d58b46'),('walnut','Walnut','#a1a65d','#b9865a','#553b2b','#8f5c3e'),('pale','Pale oak','#a1a65d','#f5e5c0','#99815d','#d7bf8f')])]
    item=info['sourceCatalog']; definition=dict(id=id,label=item['label'],model=id,reference=item['file'],description='Reference-guided single-seat '+item['label'].lower()+' with physical actor docking, clearance and matching native facings.',frame=dict(width=96,height=112,anchor=[48,96]),referenceFrame=reference['sourceFrame'],styles=styles,price=item['price'],construction=item.get('construction',dict(seconds=0,materials=[])))
    definitions['items']=[d for d in definitions['items'] if d['id']!=id]+[definition]
    info['modelCalibration']=dict(dimensions=reference['dimensions'],seatHeight=config['seat'],projection=reference['projection'],note='Compact canonical fronts take precedence over taller generated drawings. Shared actor projection stays native; no actor scaling.')
    (folder/'reference-set.json').write_text(json.dumps(info,indent=2)+'\n')
(root/'src/game/furniture/references/chairs.json').write_text(json.dumps(references,separators=(',',':'))+'\n')
(root/'src/game/furniture/definitions.json').write_text(json.dumps(definitions,indent=2)+'\n')
print('Prepared approved Chair, Armchair and Dining Chair paint/definitions.')
