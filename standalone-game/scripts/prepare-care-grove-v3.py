"""Export a Care Grove art revision, preserving installed geometry.

Requires the declared built-in ImageGen source edits and new scenery for the revision.
Exports native images and an artwork overview; does not run game verification.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import datetime
import hashlib
import json
import argparse

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--revision',type=int,default=3,choices=range(3,100))
REVISION=parser.parse_args().revision
SLUG=f'care-grove-v{REVISION}'
JOB=ROOT/'assets/maps'/SLUG
PUBLIC=ROOT/'public/pawtrail-game/map-art'/SLUG
REGISTRY=ROOT/'src/game/stage-editor/grove-art.json'
PUBLIC.mkdir(parents=True,exist_ok=True)

def write(path,data):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(data,indent=2)+'\n')

prior=JOB/'prior-registry.json'
if not prior.exists():prior.write_text(REGISTRY.read_text())
registry=json.loads(prior.read_text())
registry['version']=REVISION
additions_path=JOB/'additions.json'
additions=json.loads(additions_path.read_text()) if additions_path.exists() else []
known={asset['id'] for asset in registry['assets']}
registry['assets'].extend(asset for asset in additions if asset['id'] not in known)
derived={'pine-small','village-wall-low'}
source_names=['ground',*[asset['id'].split(':')[1] for asset in registry['assets'] if asset['id'].split(':')[1] not in derived]]

def export_prop(name,definition):
    source=Image.open(JOB/'sources'/f'{name}.png').convert('RGBA')
    if source.getextrema()[3][0]==255:
        raise ValueError(f'{name} is opaque; the cutout needs a transparent ImageGen revision.')
    bounds=source.getchannel('A').getbbox()
    if not bounds:raise ValueError(f'{name} is empty.')
    source=source.crop(bounds)
    w,h=definition['width'],definition['height']
    scale=min(w/source.width,h/source.height)
    size=(max(1,round(source.width*scale)),max(1,round(source.height*scale)))
    source=source.resize(size,Image.Resampling.NEAREST)
    # Normalize to the existing native canvas and ground anchor. No collider changes.
    native=Image.new('RGBA',(w,h))
    native.alpha_composite(source,((w-source.width)//2,h-source.height))
    native.save(PUBLIC/f'{name}.png')
    definition['file']=f'/pawtrail-game/map-art/{SLUG}/'+name+'.png'

for asset in registry['assets']:
    name=asset['id'].split(':')[1]
    if name in derived:continue
    export_prop(name,asset)

pine=Image.open(PUBLIC/'pine.png').convert('RGBA')
for asset in registry['assets']:
    if asset['id']=='grove:pine-small':
        pine.resize((asset['width'],asset['height']),Image.Resampling.NEAREST).save(PUBLIC/'pine-small.png')
        asset['file']=f'/pawtrail-game/map-art/{SLUG}/pine-small.png'

for asset in registry['assets']:
    if asset['id']=='grove:village-wall-low':
        wall=Image.open(PUBLIC/'village-wall.png').convert('RGBA')
        wall.resize((asset['width'],asset['height']),Image.Resampling.NEAREST).save(PUBLIC/'village-wall-low.png')
        asset['file']=f'/pawtrail-game/map-art/{SLUG}/village-wall-low.png'

ground=Image.open(JOB/'sources/ground.png').convert('RGBA')
ground=ground.resize((1024,768),Image.Resampling.NEAREST)
ground.save(PUBLIC/'ground.png')
registry['grounds'][0]['file']=f'/pawtrail-game/map-art/{SLUG}/ground.png'
write(REGISTRY,registry)
write(JOB/'registry.json',registry)
layout_source=JOB/'layout-source.json'
runtime_layout=f'src/game/stage-editor/maps/{SLUG}.json' if layout_source.exists() else 'src/game/stage-editor/maps/care-grove-v2.json'
stage=json.loads((layout_source if layout_source.exists() else ROOT/runtime_layout).read_text())
if layout_source.exists():write(ROOT/runtime_layout,stage)
write(JOB/'care-grove.stage.json',stage)
write(ROOT/'public/pawtrail-game/stages'/f'{SLUG}.json',stage)
views={a['id']:a for a in json.loads((ROOT/'src/game/stage-editor/native-assets.json').read_text())['assets']}
views.update({a['id']:a for a in registry['assets']})
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
if additions:
    sheet=Image.new('RGBA',(256*len(additions),300),'#252a27')
    draw=ImageDraw.Draw(sheet);font=ImageFont.load_default(size=14)
    for index,asset in enumerate(additions):
        name=asset['id'].split(':')[1];im=Image.open(PUBLIC/f'{name}.png').convert('RGBA')
        scale=min(2,224//im.width,236//im.height)
        scale=max(1,scale);im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
        x=index*256+(256-im.width)//2;y=250-im.height
        sheet.alpha_composite(im,(x,y));draw.text((index*256+12,267),asset['label'],font=font,fill='#eee5d7')
    sheet.save(JOB/'new-scenery.png')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
job=json.loads((JOB/'job.json').read_text())
job['phases']['integration'].update(status='complete',completedAt=now)
job['phases']['nativeExport']={'status':'complete','completedAt':now,'evidence':f'assets/maps/{SLUG}/native-overview.png'}
write(JOB/'job.json',job)
write(JOB/'asset-inputs.json',{'mode':'built-in image_gen','prompts':f'assets/maps/{SLUG}/prompts.json',
    'sourceHashes':{name:hashlib.sha256((JOB/'sources'/f'{name}.png').read_bytes()).hexdigest() for name in source_names},
    'geometryContract':f'assets/maps/{SLUG}/prior-registry.json','registry':'src/game/stage-editor/grove-art.json',
    'layout':runtime_layout,'runtimeArt':f'public/pawtrail-game/map-art/{SLUG}/','newAssets':[asset['id'] for asset in additions],
    'runtimeImages':{p.name:{'dimensions':list(Image.open(p).size),'bytes':p.stat().st_size} for p in PUBLIC.glob('*.png')},
    'scope':'Reference-led artwork revision; existing native geometry/contacts retained; declared scenery additions have independent ground footprints',
    'evidence':'Native artwork overview only. No tests/builds/browser verification.'})
print(json.dumps({'overview':str(JOB/'native-overview.png'),'objects':len(stage['objects']),'runtimeAssets':len(list(PUBLIC.glob('*.png')))}))
