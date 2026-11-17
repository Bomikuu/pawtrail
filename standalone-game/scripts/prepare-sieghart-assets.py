"""Export Sieghart's painterly complete-frame artwork without pixel-style conversion."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance
import json, hashlib, shutil, math

ROOT=Path(__file__).resolve().parents[1];JOB=ROOT/'assets/actor-appearances/sieghart-painterly-v1'
POSES=['front-pout','three-quarter-left','head-tilt-smile-right'];EMOTIONS=['neutral','smile','happy','sad','angry','surprised'];STATES=['rest','half','closed','small','open']
W,H=144,180
def clean(im,threshold=24):
 im=im.convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:0 if a<max(80,threshold) else 255 if a>=200 else round(a/32)*32));return im
def save_json(p,value):p.write_text(json.dumps(value,separators=(',',':'))+'\n')
native=JOB/'native';native.mkdir(exist_ok=True);frames=[];poses={};registration=[]
for pi,pose in enumerate(POSES):
 src=Image.open(JOB/f'pose-{pi}-generated.png').convert('RGBA');cells=[]
 for e,emotion in enumerate(EMOTIONS):
  for s,state in enumerate(STATES):
   cell=clean(src.crop((round(s*src.width/5)+1,round(e*src.height/6)+1,round((s+1)*src.width/5)-1,round((e+1)*src.height/6)-1)),48)
   cells.append((emotion,state,cell.crop(cell.getbbox())))
 scale=min((W-8)/max(c.width for _,_,c in cells),(H-8)/max(c.height for _,_,c in cells))
 expressions={}
 for emotion,state,cell in cells:
  size=(round(cell.width*scale),round(cell.height*scale));cell=cell.resize(size,Image.Resampling.LANCZOS)
  whole=Image.new('RGBA',(W,H));offset=((W-size[0])//2,H-1-size[1]);whole.alpha_composite(cell,offset)
  whole.save(native/f'{pose}-{emotion}-{state}.png',optimize=True)
  states=expressions.setdefault(emotion,{'states':{},'eyesClosedAtRest':emotion=='happy',
   'blinkPerformance':{'sequence':[0,1,0],'durationsMs':[85,110,85],'idleDelayMs':[3100,4600]},
   'speechPerformance':{'sequence':[0,1,2,1,0,1,2,0],'durationsMs':[180,150,160,150,230,160,150,210]},
   'breathPerformance':{'sequence':[0,1,0],'durationsMs':[1800,1550,1800]}})['states']
  ids=[len(frames)];frames.append(whole)
  if state=='rest':
   breath=whole.copy();breath.paste(whole.crop((0,132,W,H-2)),(0,131));breath.paste(whole.crop((0,H-3,W,H-2)),(0,H-3));ids.append(len(frames));frames.append(breath)
  else:ids.append(ids[0])
  states[state]=ids
  registration.append({'pose':pose,'emotion':emotion,'state':state,'scale':scale,'wholeFrameOffset':list(offset),'source':f'pose-{pi}-generated.png'})
 poses[pose]={'expressions':expressions}
atlas=Image.new('RGBA',(W*10,H*math.ceil(len(frames)/10)));rects=[];mask=Image.new('L',(W,H))
for i,frame in enumerate(frames):
 x,y=i%10*W,i//10*H;atlas.paste(frame,(x,y));rects.append([x,y,W,H]);mask=ImageChops.lighter(mask,frame.getchannel('A'))
box=mask.getbbox();bounds=[box[0],box[1],box[2]-box[0],box[3]-box[1]]
out=JOB/'portrait-runtime';out.mkdir(exist_ok=True);(out/'reference').mkdir(exist_ok=True)
manifest={'version':3,'kind':'authored-frame-portrait','style':'Painterly anime fantasy','nativeCell':[W,H],'contentBounds':bounds,'frames':rects,'poses':poses,'atlas':'portrait.avif','blinkSpeechPolicy':'blink-frame-priority','filter':'smooth','reviewStatus':'candidate','encoding':'avif-complete-frames'}
save_json(out/'portrait.json',manifest)
for p,pose in enumerate(POSES):frames[poses[pose]['expressions']['neutral']['states']['rest'][0]].quantize(colors=128,method=Image.Quantize.FASTOCTREE).save(out/f'reference/{pose}-neutral.png',optimize=True)
overhead=(out/'portrait.json').stat().st_size+sum(p.stat().st_size for p in (out/'reference').iterdir())
for quality in [45,38,32,26]:
 print('Packing painterly portrait quality',quality,flush=True)
 atlas.save(out/'portrait.avif',quality=quality,speed=6,max_threads=2)
 total=overhead+(out/'portrait.avif').stat().st_size
 if total<=300000:break
else:raise ValueError(f'Painterly portrait exceeds 300 KB: {total}')
(out/'portrait.webp').unlink(missing_ok=True)
revision=hashlib.sha256((out/'portrait.json').read_bytes()+(out/'portrait.avif').read_bytes()).hexdigest()[:12]
folder=f'/pawtrail-game/game-assets/dialogue-portraits/sieghart-painterly-v1/{revision}';dest=ROOT/'public'/folder.lstrip('/');shutil.copytree(out,dest,dirs_exist_ok=True)
catalog=ROOT/'src/game/actor-rig/photo-portrait-catalog.json';entries=[e for e in json.loads(catalog.read_text()) if e['id']!='sieghart-painterly']
entries.append({'id':'sieghart-painterly','name':'Painterly anime fantasy','styleKey':'painterly-anime','characterId':'sieghart','characterName':'Sieghart','playback':'complete-frames','nativeCell':[W,H],'contentBounds':bounds,'folder':folder,'revision':revision,'poseIds':POSES,'emotionIds':['idle','smile','happy','sad','angry','surprised'],'rendering':'smooth','budgetBytes':300000,'completeBytes':total,'runtimeBytes':total-overhead+(out/'portrait.json').stat().st_size,'referenceBytes':overhead-(out/'portrait.json').stat().st_size,'poseCount':3,'expressionCount':6,'encoding':'avif-complete-frames','quality':quality})
catalog.write_text(json.dumps(entries,indent=2)+'\n');save_json(JOB/'registration.json',registration)
icon=ROOT/'public/pawtrail-game/actor-studio/icons/sieghart/v2';icon.mkdir(parents=True,exist_ok=True)
frames[0].crop((29,43,115,129)).resize((40,40),Image.Resampling.NEAREST).save(icon/'icon.png',optimize=True)

# Uniform anatomical registration: loose cloth never determines the body pivot.
src=Image.open(JOB/'illustration-loop-generated.png').convert('RGBA');cells=[];feet=[];boxes=[]
for i in range(6):
 c=clean(src.crop((i%3*src.width//3,i//3*src.height//2,(i%3+1)*src.width//3,(i//3+1)*src.height//2)),48)
 # Use core alpha for registration; retain antialiased cutout edges in artwork.
 a=c.getchannel('A').point(lambda v:255 if v>200 else 0);box=a.getbbox();boxes.append(box)
 band=a.crop((0,box[3]-12,c.width,box[3]));xs=[x for y in range(band.height) for x in range(band.width) if band.getpixel((x,y))]
 feet.append(sum(xs)/len(xs));cells.append(c)
width,height=256,384;left=max(cx-b[0] for cx,b in zip(feet,boxes));right=max(b[2]-cx for cx,b in zip(feet,boxes))
scale=min(238/(left+right),368/max(b[3]-b[1] for b in boxes));anchor=9+left*scale
illustration=ROOT/'public/pawtrail-game/actor-studio/illustrations/sieghart/v1';illustration.mkdir(parents=True,exist_ok=True)
sheet=Image.new('RGBA',(width*3,height*2));body=[]
for i,(c,cx,box) in enumerate(zip(cells,feet,boxes)):
 xoff=anchor-cx*scale;yoff=height-7-box[3]*scale
 frame=c.transform((width,height),Image.Transform.AFFINE,(1/scale,0,-xoff/scale,0,1/scale,-yoff/scale),Image.Resampling.BICUBIC)
 body.append(frame);sheet.paste(frame,(i%3*width,i//3*height))
sheet.save(illustration/'actor.webp',quality=88,method=6,exact=True)
def track(name,nw,nh,count,cols,times):return {'id':name,'atlas':name+'.webp','nativeSize':[nw,nh],'frames':[{'id':i,'rect':[i%cols*nw,i//cols*nh,nw,nh]} for i in range(count)],'sequence':list(range(count)),'durationMs':times,'offset':[0,0]}
actor=track('actor',width,height,6,3,[1000,750,850,850,750,1000]);actor['offset']=[16,0]
# Reuse suitable approved quiet context art; retain it as a separate layer.
old=ROOT/'public/pawtrail-game/actor-studio/illustrations/sieg/v1/background.webp';bgsrc=Image.open(old).convert('RGBA');bgs=[];bga=Image.new('RGBA',(288*2,384*2))
for i in range(4):
 c=bgsrc.crop((i%2*256,i//2*320,i%2*256+256,i//2*320+320)).resize((288,384),Image.Resampling.LANCZOS);c=ImageEnhance.Color(c).enhance(.25);bgs.append(c);bga.paste(c,(i%2*288,i//2*384))
bga.save(illustration/'background.webp',quality=70,method=6);background=track('background',288,384,4,2,[1350]*4);background['opacity']=.22
aurasrc=Image.open(JOB/'aura-generated.png').convert('RGBA');auras=[];auraatlas=Image.new('RGBA',(288*3,384*2))
for i in range(6):
 c=aurasrc.crop((i%3*aurasrc.width//3+3,i//3*aurasrc.height//2+3,(i%3+1)*aurasrc.width//3-3,(i//3+1)*aurasrc.height//2-3)).resize((288,384),Image.Resampling.LANCZOS)
 pixels=[]
 for r,g,b,a in c.getdata():
  chroma=max(r,g,b)-min(r,g,b);alpha=round(a*min(1,chroma/25)**2) if b>g+2 else 0
  pixels.append((r,g,b,alpha))
 c.putdata(pixels);auras.append(c);auraatlas.paste(c,(i%3*288,i//3*384))
auraatlas.save(illustration/'aura.webp',quality=80,method=6,exact=True);aura=track('aura',288,384,6,3,[900]*6);aura['opacity']=.45
im={**actor,'compositionSize':[288,384],'backdrop':'#28232f','rendering':'smooth','layers':[background,aura,actor]};save_json(illustration/'illustration.json',im)
poster=Image.new('RGBA',(288,384),'#28232f')
for c,alpha in [(bgs[0],.22),(auras[0],.45)]:
 c=c.copy();c.putalpha(c.getchannel('A').point(lambda a:round(a*alpha)));poster.alpha_composite(c)
poster.alpha_composite(body[0],(16,0));poster.save(illustration/'poster.webp',quality=88,method=6);body[0].save(illustration/'actor-poster.webp',quality=88,method=6,exact=True);poster.save(JOB/'illustration-review.png')

# Actor-specific generated UV surfaces, not recolored maps from another identity.
surfaces=ROOT/'public/pawtrail-game/actor-studio/sieghart/v1';surfaces.mkdir(parents=True,exist_ok=True)
uv=Image.open(JOB/'surfaces-generated.png').convert('RGB');keys=['face','half','closed','hair','coat','lining','vest','scarf','trousers','boots','blade','fringe']
for i,key in enumerate(keys):
 c=uv.crop((round(i%4*uv.width/4)+2,round(i//4*uv.height/3)+2,round((i%4+1)*uv.width/4)-2,round((i//4+1)*uv.height/3)-2)).resize((96,144),Image.Resampling.LANCZOS);c.save(surfaces/(key+'.webp'),quality=92,method=6)
profile={'id':'sieghart','name':'Sieghart','title':'Violet Vanguard','style':'Painterly anime fantasy','age':29,'origin':'Fictional city of Duskmere','nationality':'Fictional Duskmere Free Cities','personality':['steadfast','reserved','wry','protective'],'biography':'A wandering swordsman who escorts caravans through the passes around Duskmere. Beneath a severe manner, he has a habit of making room in his camp for lost travelers and stray animals.','tone':'Measured, dry and assured; brief reassurance instead of grand speeches.','authorship':'Story details are authored fictional choices for this reference-guided interpretation.','voice':{'status':'omitted-by-owner'},'runtimeScope':'Separate actor preview choice; live roster unchanged'}
save_json(surfaces/'profile.json',profile);(JOB/'profile.json').write_text(json.dumps(profile,indent=2)+'\n')
review=Image.new('RGBA',(W*6,H*3),'#d9d3df')
for p,pose in enumerate(POSES):
 for e,emotion in enumerate(EMOTIONS):review.alpha_composite(frames[poses[pose]['expressions'][emotion]['states']['rest'][0]],(e*W,p*H))
review.save(JOB/'portrait-review.png')
report={'id':'sieghart','style':'Painterly anime fantasy','portraitBytes':total,'portraitQuality':quality,'portraitNativeCell':[W,H],'portraitFolder':folder,'completeFrames':len(frames),'iconBytes':(icon/'icon.png').stat().st_size,'illustrationBytes':sum(p.stat().st_size for p in illustration.iterdir() if p.is_file()),'modelSurfaceBytes':sum(p.stat().st_size for p in surfaces.iterdir() if p.suffix=='.webp'),'rendering':'Smooth 2D artwork; existing native-pixel gameplay renderer','voice':'omitted-by-owner','reviewStatus':'pending-live-review'}
(JOB/'export-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
