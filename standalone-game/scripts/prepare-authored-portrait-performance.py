"""Compile authored per-expression performances with explicit geometric masks.

Input names each pose's real performance sheet, source/native registration and
anatomical polygons. No neutral-motion fallback or RGB-derived facial islands.
"""
from pathlib import Path
from PIL import Image,ImageDraw,ImageChops
import sys,json,math
ROOT=Path.cwd();CONFIG=Path(sys.argv[1]).resolve();OUT=CONFIG.parent;DATA=json.loads(CONFIG.read_text());EMOTIONS=['neutral','smile','happy','sad','angry','surprised'];NAMES=['rest','half','closed','small','open'];W,H=DATA['nativeCell'];PALETTE=DATA['palette'];COLORS=[tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in PALETTE];CACHE={}
def finish(art):
 raw=art.tobytes();data=bytearray(art.width*art.height)
 for n in range(len(data)):
  r,g,b,a=raw[n*4:n*4+4]
  if a<160:continue
  key=r,g,b
  if key not in CACHE:CACHE[key]=min(range(len(COLORS)),key=lambda i:3*(COLORS[i][0]-r)**2+4*(COLORS[i][1]-g)**2+2*(COLORS[i][2]-b)**2)+1
  data[n]=CACHE[key]
 out=Image.frombytes('P',art.size,bytes(data));out.putpalette(([0,0,0]+[c for rgb in COLORS for c in rgb]+[0]*768)[:768]);out.info['transparency']=0;return out

def mask(spec):
 out=Image.new('L',(W,H));draw=ImageDraw.Draw(out)
 for polygon in spec['polygons']:draw.polygon([tuple(p) for p in polygon],fill=255)
 for hole in spec.get('holes',[]):draw.rectangle(tuple(hole),fill=0)
 return out

def regions(m):
 # Lossless run rectangles; unlike a bounding box they never erase another channel.
 previous={};out=[]
 for y in range(H):
  spans=[];start=None
  for x in range(W+1):
   yes=x<W and m.getpixel((x,y))>0
   if yes and start is None:start=x
   if start is not None and not yes:spans.append((start,x-start));start=None
  current={}
  for key in spans:
   if key in previous:rect=previous[key];rect[3]+=1
   else:rect=[key[0],y,key[1],1];out.append(rect)
   current[key]=rect
  previous=current
 return out

def patch(art,m):
 out=art.copy();out.putalpha(ImageChops.multiply(art.getchannel('A'),m));return out

def profile(emotion,pose):
 period={'neutral':4800,'smile':4600,'happy':3600,'sad':5600,'angry':3800,'surprised':4200}[emotion]
 delay={'neutral':2900,'smile':3100,'happy':3300,'sad':3400,'angry':2600,'surprised':2200}[emotion]
 duration={'sad':[120,170,120],'angry':[85,100,85],'surprised':[85,85,85]}.get(emotion,[85,110,85])
 durations={'sad':[180,180,150,180,200,150,170,180],'angry':[140,100,140,100,160,120,140,140],'happy':[120,140,180,130,160,140,180,150]}.get(emotion,[150,150,150,130,200,150,150,180])
 result={'blinkPerformance':{'sequence':[0,1,0],'durationsMs':duration,'idleDelayMs':[delay,delay+1300]},'speechPerformance':{'sequence':[0,1,2,1,0,1,2,0],'durationsMs':durations},'breathing':{'periodMs':period,'risePixels':1,'torsoStartY':pose.get('torsoStartY',85),'anchorRows':4}}
 for overrides in [DATA.get('performances',{}).get(emotion,{}),pose.get('performances',{}).get(emotion,{})]:
  for key in result:
   if key in overrides:result[key]={**result[key],**overrides[key]}
 return result

runtime=OUT/'runtime'/DATA['id'];refs=runtime/'reference';refs.mkdir(parents=True,exist_ok=True);native=OUT/'native';native.mkdir(exist_ok=True);tiles=[];frames=[];poses={};names={};all_coverage=[]
def add(name,art):
 names[name]=len(tiles);tiles.append(art);return len(tiles)-1
for p,pose in enumerate(DATA['poses']):
 source=Image.open(ROOT/pose['sheet']).convert('RGBA');body=Image.open(ROOT/pose['body']).convert('RGBA');eye=mask(pose['eyeMask']);mouth=mask(pose['mouthMask']);eye=ImageChops.subtract(eye,mouth);eye_regions=regions(eye);mouth_regions=regions(mouth);states={};s=pose['registration']['scale'];ex,ey=pose['registration']['eyesOffset'];mx,my=pose['registration']['mouthOffset'];grid=pose.get('grid',{});cw=grid.get('cellWidth',source.width/5);ch=grid.get('cellHeight',source.height/6);ox,oy=grid.get('origin',[0,0]);board=Image.new('RGB',(5*(W*3+8),6*(H*3+24)),'#d3d4c7');draw=ImageDraw.Draw(board)
 for row,emotion in enumerate(EMOTIONS):
  eyes=[];mouths=[]
  for col,state in enumerate(NAMES):
   cell=source.crop((round(ox+col*cw),round(oy+row*ch),round(ox+(col+1)*cw),round(oy+(row+1)*ch)))
   offset=pose.get('stateOffsets',{}).get(emotion,{}).get(state,[0,0]);xx,yy=offset
   eyes.append(cell.transform((W,H),Image.Transform.AFFINE,(1/s,0,-(ex+xx)/s,0,1/s,-(ey+yy)/s),Image.Resampling.NEAREST))
   mouths.append(cell.transform((W,H),Image.Transform.AFFINE,(1/s,0,-(mx+xx)/s,0,1/s,-(my+yy)/s),Image.Resampling.NEAREST))
  base=body.copy();base.paste(eyes[0],(0,0),eye);base.paste(mouths[0],(0,0),mouth);base=finish(base).convert('RGBA');full=[base]
  for col in range(1,5):
   art=base.copy()
   if col<3:
    if emotion!='happy' or not pose.get('holdHappyEyes',True):art.paste(eyes[col],(0,0),eye)
   else:art.paste(mouths[col],(0,0),mouth)
   full.append(finish(art).convert('RGBA'))
  ref=refs/f'{pose["id"]}-{emotion}.png';finish(base).save(ref,optimize=True)
  ids=[add(f'{pose["id"]}/{emotion}/base',base)]
  for col in range(1,3):ids.append(add(f'{pose["id"]}/{emotion}/{NAMES[col]}',patch(full[col],eye)))
  ids.append(add(f'{pose["id"]}/{emotion}/speech-rest',Image.new('RGBA',(W,H))))
  for col in range(3,5):ids.append(add(f'{pose["id"]}/{emotion}/{NAMES[col]}',patch(full[col],mouth)))
  states[emotion]={'base':ids[0],'blink':ids[1:3],'talk':ids[3:6],'reference':str(ref.relative_to(runtime)),'blinkRegions':eye_regions,'speechRegions':mouth_regions,**profile(emotion,pose)}
  for col,art in enumerate(full):
   finish(art).save(native/f'{pose["id"]}-{emotion}-{NAMES[col]}.png',optimize=True);large=art.resize((W*3,H*3),Image.Resampling.NEAREST);board.paste(large,(col*(W*3+8),row*(H*3+24)+23),large);draw.text((col*(W*3+8)+3,row*(H*3+24)+4),emotion+' / '+NAMES[col],fill='black')
  all_coverage.append({'pose':pose['id'],'emotion':emotion,'review':'pending'})
 poses[pose['id']]={'expressions':states};board.save(OUT/(pose['id']+'-performance.png'))
cols=8;atlas=Image.new('RGBA',(cols*W,math.ceil(len(tiles)/cols)*H))
for n,art in enumerate(tiles):
 x=n%cols*W;y=n//cols*H;atlas.alpha_composite(art,(x,y));frames.append([x,y,W,H])
finish(atlas).save(runtime/'portrait.png',optimize=True)
visible=Image.new('L',(W,H))
for art in tiles:visible=ImageChops.lighter(visible,art.getchannel('A'))
x1,y1,x2,y2=visible.getbbox();x1=max(0,x1-1);y1=max(0,y1-1);x2=min(W,x2+1);y2=min(H,y2+1)
manifest={'version':2,'kind':'authored-expression-portrait','performanceVersion':1,'style':DATA['name'],'nativeCell':[W,H],'contentBounds':[x1,y1,x2-x1,y2-y1],'atlas':'portrait.png','frames':frames,'poses':poses,'frameNames':names,'filter':'nearest','blink':{'sequence':[0,1,0],'durationsMs':[85,110,85],'idleDelayMs':[2900,4200]},'talk':{'sequence':[0,1,2,1,0,1,2,0],'durationsMs':[150,150,150,130,200,150,150,180]},'breathing':{'periodMs':4800,'risePixels':1,'torsoStartY':85,'anchorRows':4},'sourceFidelity':'Unique authored expression/pose acting, explicit anatomical replacement masks, no RGB-derived features or neutral performance fallback.','reviewStatus':'candidate'}
(runtime/'portrait.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n');runtime_bytes=sum((runtime/n).stat().st_size for n in ['portrait.png','portrait.json']);ref_bytes=sum(f.stat().st_size for f in refs.glob('*.png'));report={'id':DATA['id'],'name':DATA['name'],'nativeCell':[W,H],'contentBounds':manifest['contentBounds'],'runtimeBytes':runtime_bytes,'referenceBytes':ref_bytes,'completeBytes':runtime_bytes+ref_bytes,'poseCount':len(poses),'expressionCount':6,'budgetBytes':250000}
if report['completeBytes']>=250000:raise ValueError(f'Complete style exceeds cap: {report["completeBytes"]}')
(OUT/'sizes.json').write_text(json.dumps(report,indent=2)+'\n');(OUT/'coverage-pending.json').write_text(json.dumps(all_coverage,indent=2)+'\n');print(json.dumps(report,indent=2))
