"""Inspect native asset files and create a contact sheet; never touches game code."""
from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]
assets=root/'public/assets/game'
furniture=assets/'housing/furniture'
refs=assets/'housing/references'
items=[('armchair',(32,64)),('bookshelf',(64,64)),('floor-lamp',(32,64)),('single-bed',(32,64)),('wardrobe',(64,64)),('desk',(64,64)),('refrigerator',(32,64)),('stove',(32,64)),('sink-counter',(64,64))]
palette=json.loads((furniture/'furniture-first-batch.json').read_text())['palette']
allowed={tuple(bytes.fromhex(color)) for color in palette}
sheet=Image.new('RGBA',(768,768),'#f3e8d2')
entries=[]
for index,(name,size) in enumerate(items):
    path=furniture/f'{name}-housing-v1.png'
    image=Image.open(path).convert('RGBA')
    colors=set(image.get_flattened_data())
    alphas=sorted({color[3] for color in colors})
    checks=dict(dimensions=image.size==size,binaryAlpha=alphas==[0,255],sharedPalette=all(color[:3] in allowed for color in colors if color[3]),hasTransparentMargin=image.getbbox()[0]>0 and image.getbbox()[1]>0 and image.getbbox()[2]<image.width and image.getbbox()[3]<image.height)
    scale=3
    preview=image.resize((image.width*scale,image.height*scale),Image.Resampling.NEAREST)
    col,row=index%3,index//3
    sheet.alpha_composite(preview,(col*256+(256-preview.width)//2,row*256+(256-preview.height)//2))
    entries.append(dict(id=name,file='/assets/game/housing/furniture/'+path.name,width=image.width,height=image.height,frames=1,alphaValues=alphas,visibleColors=sum(color[3]>0 for color in colors),checks=checks,productionReady=False,status='native export; style and placement review'))
sheet.convert('RGB').save(refs/'housing-furniture-batch-2-review.png')
manifest=dict(version='housing-furniture-batch-2',generationMode='built-in image_gen',scope='Nine static furniture sprites; assets only',palette=palette,assets=entries,categoryManifests=['/assets/game/housing/furniture/living-room-batch-2.json','/assets/game/housing/furniture/bedroom-batch-2.json','/assets/game/housing/furniture/kitchen-batch-2.json'],reviewSheet='/assets/game/housing/references/housing-furniture-batch-2-review.png',limitations=['Collision footprints are proposed in the category manifests, not verified in a game engine.','Static sprites only: no animation states or gameplay functionality are implied.'])
(assets/'housing-furniture-batch-2.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps([dict(id=e['id'],checks=e['checks']) for e in entries],indent=2))
