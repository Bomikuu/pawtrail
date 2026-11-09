"""Production export pass approved by the owner: exact canvases, palette, binary alpha."""
import json,shutil
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/community-v1/transport-and-plaza-source-v1.png'
OUT=ROOT/'public/assets/game/community';OUT.mkdir(parents=True,exist_ok=True)
world=json.loads((ROOT/'public/game-assets/world-manifest.json').read_text())
palette=Image.new('P',(1,1));colors=[]
for value in world['palette']:colors+=list(bytes.fromhex(value.lstrip('#')))
palette.putpalette((colors+[0]*768)[:768])
manifest={'version':1,'tile':32,'lighting':'upper-left','perspective':'top-down-three-quarter','generationMode':'built-in image_gen','review':'Native exports; rendered game placement has not been exercised.','sprites':{}}
def export(name,image,size=None,footprint=None,origin='existing'):
    if size:
        box=image.getbbox();image=image.crop(box) if box else image
        scale=min((size[0]-2)/image.width,(size[1]-2)/image.height)
        image=image.resize((max(1,round(image.width*scale)),max(1,round(image.height*scale))),Image.Resampling.NEAREST)
        canvas=Image.new('RGBA',size);canvas.alpha_composite(image,((size[0]-image.width)//2,size[1]-image.height));image=canvas
    alpha=image.getchannel('A').point(lambda a:255 if a>=128 else 0)
    image=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
    image.save(OUT/(name+'.png'),optimize=True)
    manifest['sprites'][name]={'file':'/assets/game/community/'+name+'.png','width':image.width,'height':image.height,'anchor':[image.width//2,image.height],'footprint':footprint,'source':origin,'frames':1}
source=Image.open(SOURCE).convert('RGBA');w,h=source.size
for name,rect,size,fp in [('jeepney',(0,0,w//2,h//2),(128,96),[0,64,128,32]),('stop',(w//2,0,w,h//2),(96,96),[0,64,96,32]),('fountain',(0,h//2,w//2,h),(96,64),[16,16,64,48]),('banana',(w//2,h//2,w,h),(64,64),[20,48,24,16])]:export(name,source.crop(rect),size,fp,'assets/community-v1/transport-and-plaza-source-v1.png')
for name,key in {'shelter':'buildings/rescue_shelter','vet':'buildings/veterinary_clinic','shop':'buildings/pet_supply_shop','store':'buildings/sari_sari_store','workshop':'buildings/bamboo_house','tree':'environment/large_tree','bush':'environment/round_bush'}.items():
    s=world['sprites'][key];sheet=Image.open(ROOT/'public/game-assets'/(s['sheet']+'.png')).convert('RGBA');export(name,sheet.crop((s['x'],s['y'],s['x']+s['width'],s['y']+s['height'])),origin='public/game-assets/world-manifest.json#'+key)
for name,file in {'bench':'outdoor-bench','fence':'garden-fence-straight','gate':'garden-gate-open','feeding':'outdoor-feeding-station','pot':'flowerpot','lamp':'garden-lamp','starter-house':'starter-house','garden-house':'garden-house','pastel-house':'pastel-house'}.items():
    export(name,Image.open(ROOT/'public/assets/game/housing/exteriors'/(file+'-catalog-v1.png')).convert('RGBA'))
(ROOT/'src/game/housing/community-art.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
# Add existing native garden art to the same authoritative furniture catalog.
catpath=ROOT/'src/game/housing/catalog.json';catalog=json.loads(catpath.read_text())
for i in catalog['items']:
    i['zones']=['interior','yard'] if i['category'] in ['Plants','Pet essentials'] else ['interior']
for name,label,price,fp in [('bench','Garden bench',55,[4,48,56,16]),('pot','Garden flower pot',15,[4,20,24,12]),('feeding','Outdoor care station',50,[4,48,56,16]),('banana','Banana plant',30,[20,48,24,16]),('lamp','Garden lamp',35,[10,48,12,16])]:
    id='garden-'+name;s=manifest['sprites'][name]
    item={'id':id,'label':label,'file':s['file'],'width':s['width'],'height':s['height'],'anchor':s['anchor'],'footprint':fp,'blocking':True,'rotatable':False,'category':'Garden','interaction':'sit' if name=='bench' else 'inspect','price':price,'zones':['yard']}
    catalog['items']=[a for a in catalog['items'] if a['id']!=id]+[item]
catpath.write_text(json.dumps(catalog,indent=2)+'\n');(ROOT/'backend/housing/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
