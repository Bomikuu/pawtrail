"""Production hard-alpha exports and registered anatomy for the solar colossus."""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/monster-studio/solvaris-solar-arbiter'
OUT=ROOT/'public/pawtrail-game/monsters/solvaris-solar-arbiter/v1'
OUT.mkdir(parents=True,exist_ok=True)
CELL=384

def solid(image):
    image=image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda value:255 if value>170 else 0))
    return image
def fit(image,size,padding=10):
    image=solid(image);bounds=image.getchannel('A').getbbox()
    if bounds:image=image.crop(bounds)
    ratio=min((size-2*padding)/image.width,(size-2*padding)/image.height)
    image=image.resize((max(1,round(image.width*ratio)),max(1,round(image.height*ratio))),Image.Resampling.NEAREST)
    result=Image.new('RGBA',(size,size));result.alpha_composite(image,((size-image.width)//2,(size-image.height)//2))
    return result
def save(image,path):
    image.quantize(colors=160,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA').save(path,lossless=True,method=6)

image=Image.open(SOURCE/'illustration-master.png').convert('RGBA')
for index,name in enumerate(('normal','enraged')):
    save(fit(image.crop((index*image.width//2,0,(index+1)*image.width//2,image.height)),384),OUT/(name+'.webp'))

image=Image.open(SOURCE/'parts-master.png').convert('RGBA');atlas=Image.new('RGBA',(CELL*4,CELL*6))
for index in range(24):
    x,y=index%4,index//4
    cell=image.crop((x*image.width//4+2,y*image.height//6+2,(x+1)*image.width//4-2,(y+1)*image.height//6-2))
    if index%12==2:cell=cell.crop((0,0,cell.width,round(cell.height*.84)))
    atlas.alpha_composite(fit(cell,CELL,12),(x*CELL,y*CELL))
save(atlas,OUT/'parts.webp')

image=Image.open(SOURCE/'portraits-master.png').convert('RGBA');portraits=Image.new('RGBA',(128*3,128*2))
for index in range(6):
    x,y=index%3,index//3
    cell=image.crop((x*image.width//3,y*image.height//2,(x+1)*image.width//3,(y+1)*image.height//2))
    portraits.alpha_composite(fit(cell,128,3),(x*128,y*128))
save(portraits,OUT/'portraits.webp')
save(portraits.crop((0,0,128,128)),OUT/'portrait.webp')
fit(portraits.crop((0,0,128,128)),64,2).save(OUT/'icon.png',optimize=True)

manifest={'id':'solvaris-solar-arbiter','version':1,'representation':'native-articulated-2d-colossus',
 'atlas':'parts.webp','cellWidth':CELL,'cellHeight':CELL,'columns':4,'rows':6,'enragedFrameOffset':12,
 'parts':{'halo':0,'head':1,'torso':2,'lowerBody':3,'leftShoulder':4,'rightShoulder':5,'leftUpperArm':6,'rightUpperArm':7,'leftForearm':8,'rightForearm':9,'leftHand':10,'rightHand':11},
 'limbAnchors':{'leftUpperArm':{'proximal':[.65,.86],'distal':[.40,.15]},'rightUpperArm':{'proximal':[.35,.86],'distal':[.60,.15]},'leftForearm':{'proximal':[.37,.86],'distal':[.65,.15]},'rightForearm':{'proximal':[.63,.86],'distal':[.35,.15]}},
 'handWrist':[.5,.85],'anchorConvention':'Registered sprite UVs from bottom-left; proximal joints point toward the shoulder.',
 'worldScale':{'nominalHeight':30,'haloSpan':28,'playerScaleChanged':False},
 'portrait':{'file':'portraits.webp','cellWidth':128,'cellHeight':128,'states':['alert','threatening','hurt'],'enragedRow':1},
 'illustrations':{'normal':'normal.webp','enraged':'enraged.webp','width':384,'height':384},
 'icon':{'file':'icon.png','width':64,'height':64},'decodedAtlasBytes':CELL*4*CELL*6*4,
 'provenance':'Built-in ImageGen from owner deity reference. Original masters/prompts retained; hard alpha removes generation matte, nearest-neighbor and non-dithered exports.',
 'runtimeArtworkBytes':{p.name:p.stat().st_size for p in OUT.iterdir() if p.suffix in ('.png','.webp')}}
for directory in (SOURCE,OUT):(directory/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'profile.json').write_text((SOURCE/'profile.json').read_text())
print(json.dumps(manifest['runtimeArtworkBytes']))
