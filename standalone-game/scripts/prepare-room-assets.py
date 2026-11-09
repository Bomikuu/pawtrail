"""Authorized native export: alpha cleanup, nearest-neighbor sizing and shared palette."""
from pathlib import Path
import json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/room-v1/furniture-source-v1.png'
OUT=ROOT/'public/assets/game/housing/furniture/cozy-room-v1';OUT.mkdir(parents=True,exist_ok=True)
source=Image.open(SOURCE).convert('RGBA');w,h=source.size
specs=[('sage-bed','Sage quilt bed',(0,0,w//2,h//2),(64,96),[8,32,48,64],'Bedroom','sleep',120),('aquarium','Little reef aquarium',(w//2,0,w,h//2),(96,64),[4,40,88,24],'Living room','inspect',160),('basket-cat-stand','Basket cat stand',(0,h//2,w//2,h),(64,96),[8,76,48,20],'Pet essentials','climb',75),('cozy-cat-perch','Cozy cat perch',(w//2,h//2,w,h),(64,64),[12,44,40,20],'Pet essentials','climb',55)]
prepared=[]
for identifier,label,rect,size,fp,category,interaction,price in specs:
    image=source.crop(rect);alpha=image.getchannel('A').point(lambda a:255 if a>=245 else 0);image.putalpha(alpha)
    image=image.crop(image.getbbox());scale=min((size[0]-2)/image.width,(size[1]-2)/image.height)
    image=image.resize((max(1,round(image.width*scale)),max(1,round(image.height*scale))),Image.Resampling.NEAREST)
    canvas=Image.new('RGBA',size);canvas.alpha_composite(image,((size[0]-image.width)//2,size[1]-image.height));prepared.append(canvas)
# All four pieces share one 64-color palette; opaque pixels determine the ramp.
palette_pixels=[]
for image in prepared:palette_pixels.extend([rgb[:3] for rgb in image.get_flattened_data() if rgb[3]])
colors=Image.new('RGB',(len(palette_pixels),1));colors.putdata(palette_pixels);palette=colors.quantize(colors=64,method=Image.Quantize.MEDIANCUT)
manifest={'version':1,'generationMode':'built-in image_gen','source':'assets/room-v1/furniture-source-v1.png','reference':'docs/images/pawtrail-home-room-reference-v1.png','baseTile':32,'lighting':'upper-left','perspective':'top-down-three-quarter','alpha':'binary after authorized cleanup','palette':palette.getpalette()[:192],'assets':[]}
catpath=ROOT/'src/game/housing/catalog.json';catalog=json.loads(catpath.read_text())
for spec,image in zip(specs,prepared):
    identifier,label,rect,size,fp,category,interaction,price=spec;alpha=image.getchannel('A');image=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
    filename=identifier+'-v1.png';image.save(OUT/filename,optimize=True)
    item={'id':identifier,'label':label,'file':'/assets/game/housing/furniture/cozy-room-v1/'+filename,'width':size[0],'height':size[1],'anchor':[size[0]//2,size[1]],'footprint':fp,'blocking':True,'rotatable':False,'category':category,'interaction':interaction,'price':price,'zones':['interior']}
    catalog['items']=[i for i in catalog['items'] if i['id']!=identifier]+[item]
    manifest['assets'].append({**item,'sourceRect':rect,'frames':1,'collisionStatus':'Authored footprint; rendered placement not exercised'})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
catpath.write_text(json.dumps(catalog,indent=2)+'\n');(ROOT/'backend/housing/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
