"""Author/export the Old Quarter stage using approved scenery and three new images.

Native asset production only; no app build or gameplay verification is performed.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import datetime,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/maps/sampaguita-village-v1'
PUBLIC=ROOT/'public/pawtrail-game/map-art/sampaguita-village-v1'
PUBLIC.mkdir(parents=True,exist_ok=True)
def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2)+'\n')
def url(name):return '/pawtrail-game/map-art/sampaguita-village-v1/'+name+'.png'
assets=[]
for name,label,size,anchor,foot in [
    ('workshop','Wide slate-roof workshop',(280,216),[140,210],[22,153,236,55]),
    ('townhouse','Terracotta-roof townhouse',(208,240),[104,234],[20,174,168,58]),
]:
    im=Image.open(JOB/'sources'/f'{name}.png').convert('RGBA')
    if im.getextrema()[3][0]==255:raise ValueError(name+' requires genuine transparent artwork.')
    bounds=im.getchannel('A').getbbox()
    if not bounds:raise ValueError(name+' source is empty.')
    im=im.crop(bounds);scale=min(size[0]/im.width,size[1]/im.height)
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
    frame=Image.new('RGBA',size);frame.alpha_composite(im,((size[0]-im.width)//2,size[1]-im.height));frame.save(PUBLIC/f'{name}.png')
    assets.append({'id':'village:'+name,'label':label,'category':'Village houses','kind':'object','file':url(name),'width':size[0],'height':size[1],'anchor':anchor,'footprint':foot,'rotations':[0]})
ground=Image.open(JOB/'sources/ground.png').convert('RGBA').resize((1536,1024),Image.Resampling.NEAREST)
ground.save(PUBLIC/'ground.png')
registry={'version':1,'grounds':[{'id':'village:terrain','label':'Old Quarter · cobbled streets','file':url('ground'),'width':1536,'height':1024}],'assets':assets}
write(ROOT/'src/game/stage-editor/village-art.json',registry)
objects=[]
def place(ident,asset,x,y):objects.append({'id':ident,'asset':asset,'x':x,'y':y,'elevation':0,'layer':'world','bias':0,'rotation':0})
A='grove:village-house';B='village:workshop';C='village:townhouse'
houses=[('north-1',A,152,264),('north-2',B,448,252),('north-3',C,1096,248),('north-4',A,1384,264),
        ('middle-1',B,168,568),('middle-2',C,448,552),('middle-3',A,1096,552),('middle-4',B,1384,568),
        ('south-1',C,168,996),('south-2',A,448,984),('south-3',B,1096,984),('south-4',C,1384,996)]
for ident,asset,x,y in houses:place('house-'+ident,asset,x,y)
place('community-hall','grove:hall',768,252)
for i,(x,y) in enumerate([(240,284),(528,280),(1184,276),(1472,288),(248,592),(528,584),(1184,580),(1472,592)]):place('supplies-'+str(i),'grove:village-barrels',x,y)
for i,(x,y) in enumerate([(992,584),(540,704)]):place('cart-'+str(i),'grove:village-cart',x,y)
for i,(x,y) in enumerate([(592,528),(944,408),(616,888),(940,888)]):place('courtyard-wall-'+str(i),'grove:village-wall-low',x,y)
for i,(x,y) in enumerate([(32,284),(1508,280),(32,652),(1508,652),(32,1010),(1508,1010)]):place('edge-tree-'+str(i),'grove:pine-small',x,y)
for i,(x,y) in enumerate([(44,300),(272,280),(576,280),(976,276),(1240,280),(1496,300),(44,600),(276,592),(576,592),(976,596),(1240,592),(1496,604),(48,1010),(280,1008),(576,1008),(976,1008),(1232,1008),(1492,1008),(592,848),(944,848)]):place('planting-'+str(i),'grove:bush',x,y)
for i,(x,y) in enumerate([(624,472),(912,568),(592,752)]):place('rest-bench-'+str(i),'f:garden-bench',x,y)
for i,(x,y) in enumerate([(584,360),(976,360),(584,656),(976,656),(856,864)]):place('street-lamp-'+str(i),'f:garden-lamp',x,y)
place('care-station','f:garden-feeding',944,480)
place('market-planter-left','f:garden-pot',600,588)
place('market-planter-right','f:flower-pot',920,624)
stage={'format':'pawtrail-stage','version':1,'name':'Sampaguita Old Quarter','width':48,'height':32,'baseTile':'terrain:0','groundArt':'village:terrain','tiles':{},'shell':False,'wallpaper':'cream','objects':objects}
write(ROOT/'src/game/stage-editor/maps/sampaguita-village-v1.json',stage)
write(ROOT/'public/pawtrail-game/stages/sampaguita-village-v1.json',stage)
write(JOB/'village.stage.json',stage)
views={a['id']:a for a in assets}
views.update({a['id']:a for a in json.loads((ROOT/'src/game/stage-editor/grove-art.json').read_text())['assets']})
views.update({'f:'+a['id']:a for a in json.loads((ROOT/'src/game/housing/catalog.json').read_text())['items']})
images={}
def image(file):
    if file not in images:images[file]=Image.open(ROOT/('public'+file)).convert('RGBA')
    return images[file]
overview=ground.copy()
for obj in sorted(objects,key=lambda o:(o['y']+o['bias'],o['id'])):
    a=views[obj['asset']];im=image(a['file'])
    if im.size!=(a['width'],a['height']):im=im.resize((a['width'],a['height']),Image.Resampling.NEAREST)
    overview.alpha_composite(im,(obj['x']-a['anchor'][0],obj['y']-a['anchor'][1]))
overview.save(JOB/'native-overview.png')
guide=overview.copy();draw=ImageDraw.Draw(guide);font=ImageFont.load_default(size=15)
for obj in objects:
    label='Sit' if obj['asset']=='f:garden-bench' else 'Light' if obj['asset']=='f:garden-lamp' else 'Refill food' if obj['asset']=='f:garden-feeding' else 'Water plant' if obj['asset'] in ['f:garden-pot','f:flower-pot'] else None
    if label:
        x,y=obj['x'],obj['y'];width=int(draw.textlength(label,font=font))+12
        draw.rectangle((x-width//2,y+6,x+width//2,y+25),fill='#f5e7cd',outline='#553d2a');draw.text((x-width//2+6,y+7),label,font=font,fill='#382c22')
draw.ellipse((760,952,776,968),fill='#eedab4',outline='#68442c',width=2);draw.text((782,951),'Arrival',font=font,fill='#f5e7cd')
guide.save(JOB/'interaction-guide.png')
now=datetime.datetime.now(datetime.timezone.utc).isoformat();job=json.loads((JOB/'job.json').read_text())
job['phases']['authoring'].update(status='complete',completedAt=now)
job['phases']['nativeExport']={'status':'complete','completedAt':now,'evidence':'assets/maps/sampaguita-village-v1/native-overview.png'}
job['objectCount']=len(objects);job['houseCount']=len(houses);job['buildingCount']=len(houses)+1
write(JOB/'job.json',job)
files={views[o['asset']]['file'] for o in objects}|{url('ground')}
write(JOB/'asset-inputs.json',{'mode':'built-in image_gen for missing ground/two houses; approved existing scenery reused','prompts':'assets/maps/sampaguita-village-v1/prompts.json','newSourceHashes':{name:hashlib.sha256((JOB/'sources'/f'{name}.png').read_bytes()).hexdigest() for name in ['ground','workshop','townhouse']},'reusedRegistry':'src/game/stage-editor/grove-art.json','layout':'src/game/stage-editor/maps/sampaguita-village-v1.json','registry':'src/game/stage-editor/village-art.json','runtimeArt':'public/pawtrail-game/map-art/sampaguita-village-v1/','dependencies':sorted(files),'houseCount':len(houses),'buildingCount':len(houses)+1,'objectCount':len(objects),'nativeDimensions':[1536,1024],'review':'Native artwork authoring only; gameplay verification not requested'})
print(json.dumps({'map':stage['name'],'houses':len(houses),'buildings':len(houses)+1,'objects':len(objects),'overview':str(JOB/'native-overview.png')}))
