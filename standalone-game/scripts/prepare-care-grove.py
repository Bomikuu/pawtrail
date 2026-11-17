"""Author Care Grove from existing atlases; export only its stage and registry.

Run with uv --no-project --with pillow python scripts/prepare-care-grove.py.
This is native asset production, not a game build or verification harness.
"""
from pathlib import Path
import datetime
import hashlib
import json
import math
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/maps/care-grove-v1'
SOURCE=ROOT/'public/pawtrail-game/game-assets/world-manifest.json'

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def title(name):return name.replace('_',' ').capitalize()

manifest=json.loads(SOURCE.read_text())
assets=[]
terrain={}
for key,entry in manifest['sprites'].items():
    if not key.startswith('terrain/'):continue
    frame=entry['y']//32*16+entry['x']//32
    ident='terrain:'+str(frame);terrain[entry['id']]=ident
    assets.append({'id':ident,'label':title(entry['id']),'category':'Terrain' if frame<18 else 'Paths & shores',
        'kind':'tile','file':'/pawtrail-game/game-assets/terrain.png','width':32,'height':32,
        'anchor':[16,32],'footprint':[0,0,32,32],'rotations':[0],'frame':frame,
        'blocking':entry['id']=='water' or entry['id'].startswith('water_')})

def scenery(entry,scale=1):
    ident=entry['id'];building=entry['sheet']=='buildings'
    if building:ground=[17,80,94,42]
    elif 'tree' in ident or ident=='palm':ground=[23,47,18,12]
    elif ident.startswith('fence'):ground=[4,44,56,16]
    elif ident=='rocks':ground=[21,47,22,12]
    elif ident in ['round_bush','leafy_shrub'] or 'flower' in ident:ground=[0,0,0,0]
    elif ident in ['stepping_stones','water_bowl','food_bowl']:ground=[0,0,0,0]
    else:ground=[20,47,24,12]
    return {'id':'native:'+ident+(':2x' if scale==2 else ''),'label':title(ident)+(' · large' if scale==2 else ''),
        'category':'Landmarks' if building else 'Woodland scenery','kind':'object',
        'file':'/pawtrail-game/game-assets/'+entry['sheet']+'.png',
        'width':entry['width']*scale,'height':entry['height']*scale,
        'anchor':[v*scale for v in entry['anchor']],'footprint':[v*scale for v in ground],
        'rotations':[0],'sourceRect':[entry['x'],entry['y'],entry['width'],entry['height']]}

for key,entry in manifest['sprites'].items():
    if entry['sheet'] not in ['environment','buildings']:continue
    assets.append(scenery(entry))
    if entry['id'] in ['large_tree','small_tree','palm','flowering_tree','rocks','rescue_shelter']:
        assets.append(scenery(entry,2))
registry={'version':1,'source':'public/pawtrail-game/game-assets/world-manifest.json','assets':assets}
write(ROOT/'src/game/stage-editor/native-assets.json',registry)

W,H=32,24
tiles={}
for y in range(H):
    for x in range(W):
        variant=max(0,min(7,round(3.3+2*math.sin(x/5)+1.7*math.cos(y/4)+.8*math.sin((x-y)/3))))
        tiles[f'{x},{y}']=terrain[f'grass_{variant}']
paths={}

def segment_distance(x,y,a,b):
    dx,dy=b[0]-a[0],b[1]-a[1]
    t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
    return math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)

def path(points,material='dirt_path',radius=1.25):
    for y in range(H):
        for x in range(W):
            if any(segment_distance(x+.5,y+.5,a,b)<=radius for a,b in zip(points,points[1:])):
                paths[x,y]=material

path([(0,17.5),(8.5,17.5),(13.5,16.5),(20.5,17.5),(28.5,17.5),(32,16.5)])
path([(16.5,24),(16.5,21.5),(15.5,19),(14.5,17)])
path([(9.5,17.5),(11.5,14.5),(14.5,11.5),(20.5,12.5),(24.5,10.5)])
path([(7.5,17.5),(8.5,14.5),(8.5,9.5),(7.5,6.5)],radius=1.05)
path([(7.5,7.5),(11.5,7.5)],radius=.8)
path([(27.5,17.5),(25.5,13.5),(24.5,10.5)],'stone_path',1.15)
for y in range(8,12):
    for x in range(21,29):paths[x,y]='stone_path'
for (x,y),family in paths.items():
    mask=sum(bit for dx,dy,bit in [(0,-1,1),(1,0,2),(0,1,4),(-1,0,8)] if (x+dx,y+dy) in paths)
    # Cross connectors have grassy corners; use solid dirt in broad path interiors.
    tiles[f'{x},{y}']=terrain['dirt' if family=='dirt_path' and mask==15 else f'{family}_{mask}']
for y in range(12,16):
    for x in range(15,19):
        if ((x-16.7)/1.8)**2+((y-13.5)/1.25)**2<1 and (x,y) not in paths:
            tiles[f'{x},{y}']=terrain['flowers_pink' if x<17 else 'flowers_yellow']

objects=[]
def place(ident,asset,x,y,layer='world'):
    objects.append({'id':ident,'asset':asset,'x':x,'y':y,'elevation':0,'layer':layer,'bias':0,'rotation':0})

place('care-lodge','native:rescue_shelter:2x',808,288)
trees=[(52,142,'large_tree'),(144,194,'small_tree'),(66,270,'large_tree'),(156,338,'flowering_tree'),
       (56,422,'large_tree'),(160,478,'small_tree'),(62,590,'large_tree'),(124,674,'flowering_tree'),(48,754,'large_tree'),
       (268,122,'small_tree'),(390,112,'large_tree'),(490,154,'flowering_tree'),(612,118,'small_tree'),
       (978,156,'large_tree'),(1000,314,'small_tree'),(966,500,'large_tree'),(1004,662,'small_tree'),(930,738,'flowering_tree')]
for i,(x,y,kind) in enumerate(trees):place(f'woodland-{i:02d}','native:'+kind+':2x',x,y)
for i,(x,y,kind) in enumerate([(420,320,'small_tree'),(638,374,'flowering_tree'),(542,254,'small_tree'),(222,680,'palm'),(878,690,'small_tree')]):
    place(f'garden-tree-{i}','native:'+kind,x,y)
for i,(x,y) in enumerate([(60,360),(126,550),(50,686),(194,122),(1010,430),(952,594)]):
    place(f'rock-edge-{i}','native:rocks:2x',x,y)

place('quiet-bench','f:garden-bench',368,224)
place('garden-bench','f:community-bench',448,416)
place('courtyard-bench','f:garden-bench',896,384)
place('garden-gate','f:wooden-door',272,352)
for i,x in enumerate([160,220,328,384]):place('garden-fence-'+str(i),'native:fence_straight',x,352)
place('feeding-station','f:garden-feeding',688,480)
place('herb-planter','f:garden-pot',528,352)
place('courtyard-planter','f:flower-pot',896,304)
place('path-light','f:garden-lamp',832,608)
place('garden-light','f:garden-lamp',336,272)
place('arrival-sign','native:wooden_sign',576,688)
place('garden-sign','native:wooden_sign',384,496)
place('lodge-sign','native:wooden_sign',720,320)

for i,(x,y,kind) in enumerate([(218,452,'round_bush'),(224,486,'leafy_shrub'),(258,430,'round_bush'),
        (326,416,'yellow_flowers'),(392,472,'white_flowers'),(504,480,'pink_flowers'),(552,448,'yellow_flowers'),
        (602,486,'pink_flowers'),(616,514,'leafy_shrub'),(728,520,'round_bush'),(934,436,'white_flowers'),
        (664,300,'leafy_shrub'),(676,274,'round_bush'),(936,314,'pink_flowers'),(904,320,'white_flowers'),
        (398,190,'garden_pot'),(310,242,'pink_flowers'),(340,262,'white_flowers'),(208,264,'leafy_shrub'),
        (226,590,'yellow_flowers'),(280,636,'round_bush'),(340,682,'leafy_shrub'),(402,716,'pink_flowers'),
        (612,686,'white_flowers'),(688,716,'round_bush'),(768,664,'leafy_shrub'),(884,626,'pink_flowers')]):
    place(f'planting-{i:02d}','native:'+kind,x,y)
for i,x in enumerate([288,352,416,640,704,768]):place('arrival-fence-'+str(i),'native:fence_straight',x,756)

stage={'format':'pawtrail-stage','version':1,'name':'Sampaguita Care Grove','width':W,'height':H,
       'baseTile':terrain['grass_0'],'tiles':tiles,'shell':False,'wallpaper':'cream','objects':objects}
write(ROOT/'src/game/stage-editor/maps/care-grove.json',stage)
write(ROOT/'public/pawtrail-game/stages/care-grove-v1.json',stage)
write(JOB/'care-grove.stage.json',stage)

furniture=json.loads((ROOT/'src/game/housing/catalog.json').read_text())['items']
views={a['id']:a for a in assets}
views.update({'f:'+i['id']:i for i in furniture})
images={}
def image(file):
    if file not in images:images[file]=Image.open(ROOT/('public'+file)).convert('RGBA')
    return images[file]

overview=Image.new('RGBA',(W*32,H*32))
for key,ident in tiles.items():
    x,y=map(int,key.split(','));a=views[ident];im=image(a['file']);frame=a['frame']
    overview.alpha_composite(im.crop((frame%16*32,frame//16*32,frame%16*32+32,frame//16*32+32)),(x*32,y*32))
for obj in sorted(objects,key=lambda o:({'ground':-100000,'world':0,'foreground':100000}[o['layer']]+o['y']+o['bias'],o['id'])):
    a=views[obj['asset']];im=image(a['file'])
    if a.get('sourceRect'):
        x,y,w,h=a['sourceRect'];im=im.crop((x,y,x+w,y+h))
    if im.size!=(a['width'],a['height']):im=im.resize((a['width'],a['height']),Image.Resampling.NEAREST)
    overview.alpha_composite(im,(obj['x']-a['anchor'][0],obj['y']-a['anchor'][1]))
overview.save(JOB/'native-overview.png')
guide=overview.copy();draw=ImageDraw.Draw(guide)
for obj in objects:
    a=views[obj['asset']]
    if not obj['asset'].startswith('f:'):continue
    text={'quiet-bench':'Sit','garden-bench':'Sit','courtyard-bench':'Sit','garden-gate':'Open / close',
          'feeding-station':'Refill food','herb-planter':'Water plant','courtyard-planter':'Water plant',
          'path-light':'Switch light','garden-light':'Switch light'}.get(obj['id'])
    if text:
        x,y=obj['x'],obj['y'];width=len(text)*6+10
        draw.rectangle((x-width//2,y+10,x+width//2,y+26),fill='#fff4df',outline='#745b37')
        draw.text((x-width//2+5,y+13),text,fill='#34241d')
draw.ellipse((504,696,520,712),fill='#fff4df',outline='#a45124',width=2)
draw.text((524,698),'Start',fill='#34241d')
guide.save(JOB/'interaction-guide.png')
write(JOB/'asset-inputs.json',{'sourceManifest':str(SOURCE.relative_to(ROOT)),
    'nativeTileSize':32,'nativeSceneryScales':[1,2],
    'sourceAtlasRectangles':'src/game/stage-editor/native-assets.json',
    'selectedAssetIds':sorted({o['asset'] for o in objects}),
    'sourceHashes':{f:hashlib.sha256((ROOT/f).read_bytes()).hexdigest() for f in [
        'public/pawtrail-game/game-assets/world-manifest.json','public/pawtrail-game/game-assets/terrain.png',
        'public/pawtrail-game/game-assets/environment.png','public/pawtrail-game/game-assets/buildings.png',
        'src/game/housing/catalog.json']},
    'exports':{'stage':'src/game/stage-editor/maps/care-grove.json','public':'public/pawtrail-game/stages/care-grove-v1.json','overview':'assets/maps/care-grove-v1/native-overview.png'},
    'objectCount':len(objects),'tileCount':W*H,'newRasterArtwork':False,
    'omissions':['No overworld portal or enterable lodge interior','No combat encounters or NPC/account records','Local interaction state resets on leaving Play']})
job=json.loads((JOB/'job.json').read_text())
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
job['phases']['authoring'].setdefault('completedAt',now)
job['phases']['authoring'].update(status='complete',lastExportAt=now)
job['phases']['integration'].setdefault('startedAt',now)
job['phases']['integration'].update(status='in_progress')
write(JOB/'job.json',job)
print(json.dumps({'stage':stage['name'],'tiles':[W,H],'objects':len(objects),'registeredNativeAssets':len(assets),'overview':str(JOB/'native-overview.png')},indent=2))
