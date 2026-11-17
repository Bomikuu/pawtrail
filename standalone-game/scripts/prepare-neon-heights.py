"""Export a cyberpunk stage from declared generated 2D assets.

Native artwork production only; does not build or verify the running app.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import datetime,hashlib,json
ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/maps/neon-heights-v1'
PUBLIC=ROOT/'public/pawtrail-game/map-art/neon-heights-v1'
PUBLIC.mkdir(parents=True,exist_ok=True)
def write(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(value,indent=2)+'\n')
def url(name):return '/pawtrail-game/map-art/neon-heights-v1/'+name+'.png'
definitions=[
 ('spire','Cyan skyline spire',(224,304),[112,298],[47,265,130,33],'Cyberpunk · skyline'),
 ('arc-tower','Magenta arc tower',(224,288),[112,282],[38,249,150,33],'Cyberpunk · skyline'),
 ('hab-block','Neon habitat block',(272,240),[136,234],[14,196,244,38],'Cyberpunk · skyline'),
 ('holo-head','Android hologram',(160,224),[80,218],[26,184,108,34],'Cyberpunk · holograms'),
 ('holo-koi','Holographic koi emitter',(160,144),[80,138],[37,119,86,19],'Cyberpunk · holograms'),
 ('kiosk','Neon street kiosk',(144,128),[72,122],[23,105,98,17],'Cyberpunk · street props'),
 ('hvac','Rooftop fan and duct',(96,72),[48,68],[8,48,80,20],'Cyberpunk · street props'),
 ('railing','Steel observation railing',(128,48),[64,44],[4,30,120,14],'Cyberpunk · street props'),
]
assets=[]
for name,label,size,anchor,foot,category in definitions:
    im=Image.open(JOB/'sources'/f'{name}.png').convert('RGBA')
    if im.getextrema()[3][0]==255:raise ValueError(name+' needs genuinely transparent cutout art.')
    bounds=im.getchannel('A').getbbox()
    if not bounds:raise ValueError(name+' is empty.')
    im=im.crop(bounds);scale=min(size[0]/im.width,size[1]/im.height)
    im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
    frame=Image.new('RGBA',size);frame.alpha_composite(im,((size[0]-im.width)//2,size[1]-im.height));frame.save(PUBLIC/f'{name}.png')
    assets.append({'id':'neon:'+name,'label':label,'category':category,'kind':'object','file':url(name),'width':size[0],'height':size[1],'anchor':anchor,'footprint':foot,'rotations':[0]})
# Large skyline variants reuse exact native pixels at integer 2x. Their upper
# stories intentionally continue beyond the north map edge; bases stay editable.
for asset in list(assets[:3]):
    name=asset['id'].split(':')[1]+'-large'
    Image.open(PUBLIC/(name.removesuffix('-large')+'.png')).resize((asset['width']*2,asset['height']*2),Image.Resampling.NEAREST).save(PUBLIC/f'{name}.png')
    assets.append({**asset,'id':'neon:'+name,'label':asset['label']+' · large','file':url(name),'width':asset['width']*2,'height':asset['height']*2,'anchor':[v*2 for v in asset['anchor']],'footprint':[v*2 for v in asset['footprint']]})
ground=Image.open(JOB/'sources/ground.png').convert('RGBA').resize((1536,1152),Image.Resampling.NEAREST)
ground.save(PUBLIC/'ground.png')
registry={'version':1,'grounds':[{'id':'neon:terrain','label':'Neon Heights · reflective streets','file':url('ground'),'width':1536,'height':1152}],'assets':assets}
write(ROOT/'src/game/stage-editor/neon-art.json',registry)
objects=[]
def place(ident,asset,x,y):objects.append({'id':ident,'asset':'neon:'+asset,'x':x,'y':y,'elevation':0,'layer':'world','bias':0,'rotation':0})
blocks=[('north-1','spire-large',152,320),('north-2','hab-block-large',440,304),('north-3','arc-tower-large',768,320),('north-4','spire-large',1096,320),('north-5','hab-block-large',1384,312),
        ('middle-1','hab-block',152,744),('middle-2','arc-tower',440,752),('middle-3','hab-block',1096,744),('middle-4','spire',1384,752),
        ('terrace-west','hab-block',168,1128),('terrace-east','hab-block',1368,1136)]
for ident,asset,x,y in blocks:place('tower-'+ident,asset,x,y)
place('central-android-projection','holo-head',672,576)
place('plaza-koi-projection','holo-koi',872,672)
place('boulevard-koi-projection','holo-koi',360,392)
for i,(x,y) in enumerate([(608,800),(944,800)]):place('street-kiosk-'+str(i),'kiosk',x,y)
for i,(x,y) in enumerate([(400,1104),(528,1048),(1040,1048),(1160,1104)]):place('terrace-fan-'+str(i),'hvac',x,y)
for i,x in enumerate([64,192,320,448,576,960,1088,1216,1344,1472]):place('observation-rail-'+str(i),'railing',x,1152)
for i,x in enumerate([432,560,976,1104]):place('terrace-edge-rail-'+str(i),'railing',x,968)
stage={'format':'pawtrail-stage','version':1,'name':'Sampaguita Neon Heights','width':48,'height':36,'baseTile':'terrain:12','groundArt':'neon:terrain','tiles':{},'shell':False,'wallpaper':'cream','objects':objects}
write(ROOT/'src/game/stage-editor/maps/neon-heights-v1.json',stage)
write(ROOT/'public/pawtrail-game/stages/neon-heights-v1.json',stage)
write(JOB/'neon-heights.stage.json',stage)
views={a['id']:a for a in assets};images={}
def image(file):
    if file not in images:images[file]=Image.open(ROOT/('public'+file)).convert('RGBA')
    return images[file]
overview=ground.copy()
for obj in sorted(objects,key=lambda o:(o['y']+o['bias'],o['id'])):
    a=views[obj['asset']];im=image(a['file'])
    overview.alpha_composite(im,(obj['x']-a['anchor'][0],obj['y']-a['anchor'][1]))
overview.save(JOB/'native-overview.png')
sheet=Image.new('RGBA',(1024,640),'#121b2b');draw=ImageDraw.Draw(sheet);font=ImageFont.load_default(size=14)
for i,a in enumerate(assets[:8]):
    im=image(a['file']);scale=min(1,220/im.width,268/im.height)
    if scale<1:im=im.resize((max(1,round(im.width*scale)),max(1,round(im.height*scale))),Image.Resampling.NEAREST)
    col,row=i%4,i//4;x=col*256+(256-im.width)//2;y=row*320+286-im.height
    sheet.alpha_composite(im,(x,y));draw.text((col*256+12,row*320+300),a['label'],font=font,fill='#c9e8f0')
sheet.save(JOB/'asset-sheet.png')
guide=overview.copy();draw=ImageDraw.Draw(guide);draw.ellipse((760,1080,776,1096),fill='#9ff4ff',outline='#17344b',width=2);draw.text((782,1079),'Arrival',font=font,fill='#dbfaff');guide.save(JOB/'arrival-guide.png')
now=datetime.datetime.now(datetime.timezone.utc).isoformat();job=json.loads((JOB/'job.json').read_text())
job['phases']['authoring'].update(status='complete',completedAt=now)
job['phases']['nativeExport']={'status':'complete','completedAt':now,'evidence':'assets/maps/neon-heights-v1/native-overview.png'}
job['objectCount']=len(objects);job['towerCount']=len(blocks);write(JOB/'job.json',job)
write(JOB/'asset-inputs.json',{'mode':'built-in image_gen','prompts':'assets/maps/neon-heights-v1/prompts.json','sourceHashes':{name:hashlib.sha256((JOB/'sources'/f'{name}.png').read_bytes()).hexdigest() for name in ['ground',*[d[0] for d in definitions]]},'layout':'src/game/stage-editor/maps/neon-heights-v1.json','registry':'src/game/stage-editor/neon-art.json','runtimeArt':'public/pawtrail-game/map-art/neon-heights-v1/','runtimeImages':{p.name:{'dimensions':list(Image.open(p).size),'bytes':p.stat().st_size} for p in PUBLIC.glob('*.png')},'nativeDimensions':[1536,1152],'objects':len(objects),'towers':len(blocks),'limits':'Static city/hologram scenery with ground collision and existing local walking; no building interiors, new E actions or vehicle controls','review':'Native artwork evidence only; no tests/checks/builds or browser verification requested'})
print(json.dumps({'map':stage['name'],'objects':len(objects),'towers':len(blocks),'overview':str(JOB/'native-overview.png')}))
