"""Install generated Care Grove terrain/scenery; do not regenerate other maps.

Native image export only. Source images come from built-in image_gen and stay
in the map job directory. Runtime collision/contacts remain independent of art.
"""
from pathlib import Path
from PIL import Image
import datetime
import hashlib
import json

ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/maps/care-grove-v2'
PUBLIC=ROOT/'public/pawtrail-game/map-art/care-grove-v2'
PUBLIC.mkdir(parents=True,exist_ok=True)

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,indent=2)+'\n')

def url(name):return '/pawtrail-game/map-art/care-grove-v2/'+name+'.png'

ground=Image.open(JOB/'sources/ground.png').convert('RGBA')
if ground.size!=(1024,768):ground=ground.resize((1024,768),Image.Resampling.NEAREST)
ground.save(PUBLIC/'ground.png')
assets=[]
for name,box,label in [('hall',(312,240),'Weathered stone hall'),('pine',(112,180),'Woodland fir'),('cliff',(208,272),'Mossy stone cliff'),('bush',(64,44),'Dry woodland scrub'),('bareTree',(100,164),'Gnarled woodland tree')]:
    im=Image.open(JOB/'sources'/f'{name}.png').convert('RGBA')
    if im.getextrema()[3][0]==255:
        raise ValueError(f'{name} requires genuine generated transparency; regenerate its background through image_gen.')
    bounds=im.getchannel('A').getbbox()
    if not bounds:raise ValueError(f'{name} is empty.')
    im=im.crop(bounds)
    scale=min(box[0]/im.width,box[1]/im.height)
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
    im.save(PUBLIC/f'{name}.png')
    w,h=im.size
    if name=='hall':anchor=[w//2,h-5];foot=[int(w*.12),h-46,int(w*.76),40]
    elif name in ['pine','bareTree']:anchor=[w//2,h-4];foot=[w//2-8,h-16,16,12]
    elif name=='bush':anchor=[w//2,h-2];foot=[0,0,0,0]
    else:anchor=[w//2,h-6];foot=[int(w*.15),int(h*.52),int(w*.7),int(h*.44)]
    assets.append({'id':'grove:'+name,'label':label,'category':'Care Grove · generated','kind':'object','file':url(name),
                   'width':w,'height':h,'anchor':anchor,'footprint':foot,'rotations':[0]})
    if name=='pine':
        small=im.resize((w*3//4,h*3//4),Image.Resampling.NEAREST);small.save(PUBLIC/'pine-small.png')
        sw,sh=small.size
        assets.append({'id':'grove:pine-small','label':'Woodland fir · young','category':'Care Grove · generated','kind':'object','file':url('pine-small'),
                       'width':sw,'height':sh,'anchor':[sw//2,sh-3],'footprint':[sw//2-6,sh-12,12,9],'rotations':[0]})
registry={'version':2,'grounds':[{'id':'grove:terrain','label':'Care Grove · worn woodland','file':url('ground'),'width':1024,'height':768}], 'assets':assets}
write(ROOT/'src/game/stage-editor/grove-art.json',registry)
stage=json.loads((ROOT/'src/game/stage-editor/maps/care-grove.json').read_text())
stage['groundArt']='grove:terrain';stage['tiles']={}
# Keep the new muted scenery consistent; v1's bright boulders are retained only in v1.
stage['objects']=[obj for obj in stage['objects'] if not obj['id'].startswith('rock-edge-')]
for obj in stage['objects']:
    if obj['id']=='care-lodge':obj['asset']='grove:hall'
    elif obj['asset'].startswith('native:') and any(word in obj['asset'] for word in ['tree','palm']):
        obj['asset']='grove:bareTree' if obj['id'] in ['woodland-15','woodland-17'] else 'grove:pine' if ':2x' in obj['asset'] and obj['id'] not in ['woodland-1','woodland-4','woodland-10','woodland-14'] else 'grove:pine-small'
    elif obj['asset'] in ['native:round_bush','native:leafy_shrub','native:white_flowers','native:pink_flowers','native:yellow_flowers']:
        obj['asset']='grove:bush'
# A solid, irregular cliff anchors the same left woodland boundary as the reference.
stage['objects'].append({'id':'western-cliff','asset':'grove:cliff','x':60,'y':296,'elevation':0,'layer':'world','bias':0,'rotation':0})
write(ROOT/'src/game/stage-editor/maps/care-grove-v2.json',stage)
write(ROOT/'public/pawtrail-game/stages/care-grove-v2.json',stage)
write(JOB/'care-grove.stage.json',stage)
views={a['id']:a for a in json.loads((ROOT/'src/game/stage-editor/native-assets.json').read_text())['assets']}
views.update({a['id']:a for a in assets})
views.update({'f:'+a['id']:a for a in json.loads((ROOT/'src/game/housing/catalog.json').read_text())['items']})
images={}
def image(file):
    if file not in images:images[file]=Image.open(ROOT/('public'+file)).convert('RGBA')
    return images[file]
overview=ground.copy()
for obj in sorted(stage['objects'],key=lambda o:({'ground':-100000,'world':0,'foreground':100000}[o['layer']]+o['y']+o['bias'],o['id'])):
    a=views[obj['asset']];im=image(a['file'])
    if a.get('sourceRect'):
        x,y,w,h=a['sourceRect'];im=im.crop((x,y,x+w,y+h))
    if im.size!=(a['width'],a['height']):im=im.resize((a['width'],a['height']),Image.Resampling.NEAREST)
    overview.alpha_composite(im,(obj['x']-a['anchor'][0],obj['y']-a['anchor'][1]))
overview.save(JOB/'native-overview.png')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
job=json.loads((JOB/'job.json').read_text())
job['phases']['nativeExport']={'status':'complete','completedAt':now,'evidence':'assets/maps/care-grove-v2/native-overview.png'}
job['phases']['integration'].setdefault('firstRecordedAt',now)
job['phases']['integration'].update(status='in_progress')
write(JOB/'job.json',job)
write(JOB/'asset-inputs.json',{'mode':'built-in image_gen','prompts':'assets/maps/care-grove-v2/prompts.json',
    'sources':{name:hashlib.sha256((JOB/'sources'/f'{name}.png').read_bytes()).hexdigest() for name in ['ground','hall','pine','cliff','bush','bareTree']},
    'registry':'src/game/stage-editor/grove-art.json','layout':'src/game/stage-editor/maps/care-grove-v2.json',
    'nativeGroundSize':[1024,768],'runtimeImages':{p.name:{'bytes':p.stat().st_size,'dimensions':list(Image.open(p).size)} for p in PUBLIC.glob('*.png')},
    'localOnly':True,'newArtwork':['ground','hall','pine','cliff','bush','bareTree'],'preservedInteractions':['benches','door','lamps','food station','planters'],
    'review':'Native artwork inspection only; no automated checks/tests/builds or browser review requested'})
print(json.dumps({'stage':stage['name'],'objects':len(stage['objects']),'assets':len(assets),'overview':str(JOB/'native-overview.png')}))
