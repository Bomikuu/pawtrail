"""Rika/Peony exports: reuse the measured portrait and painted-part recipes."""
from pathlib import Path
from PIL import Image,ImageDraw
import importlib.util,json,shutil,argparse,time
from datetime import datetime,timezone

ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/actor-appearances/rika-hoshino-v1'
PUBLIC=ROOT/'public/pawtrail-game/actor-studio'
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
paint=module('rika_painted','prepare-aurelia-assets.py');paint.JOB=JOB
portrait=module('rika_portrait','prepare-sieghart-revision.py')
def record(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2)+'\n')
paint.PARTS={
 'normal':[
  ('ponytail',[(280,330),(305,360),(255,412),(221,468),(210,520),(192,535),(164,587),(196,645),(200,688),(100,710),(20,680),(20,450),(100,390),(182,350)],(280,360),(-.7,1),350,6.5,.3),
  ('hair-crown',[(238,326),(280,312),(305,328),(285,351),(258,361)],(281,346),(-.7,-1),70,2.8,.8),
 ],
 'enraged':[
  ('ponytail',[(300,320),(350,350),(300,400),(260,460),(230,520),(240,590),(155,650),(0,640),(0,280),(200,310)],(300,380),(-1,.3),340,7.0,.3),
 ],
}

def illustrations():
 manifest=JOB/'production.json'
 if manifest.exists():
  specs=json.loads(manifest.read_text())['illustrationParts']
  paint.PARTS={variant:[(p['id'],p['polygon'],p['root'],p['direction'],p['length'],p['amplitude'],p['phase']) for p in parts] for variant,parts in specs.items()}
 values=[paint.illustration(v,'rika-hoshino',(350,520),'teal') for v in ['normal','enraged']]
 record(JOB/'illustration-export.json',{'nativeSize':[320,448],'cycleMs':5000,'style':'Refined cel + painterly','variants':values})

def face_check():
 """Review the first sheet before generating further angles; no fake states."""
 source=Image.open(JOB/'portrait-0-generated.png').convert('RGBA');cells=[]
 for row,emotion in enumerate(portrait.EMOTIONS):
  for col,state in enumerate(portrait.STATES):
   cell=portrait.portrait_cell(source.crop((round(col*source.width/5)+1,round(row*source.height/6)+1,round((col+1)*source.width/5)-1,round((row+1)*source.height/6)-1)))
   cells.append((emotion,state,cell.crop(cell.getbbox())))
 scale=min(90/max(c.width for _,_,c in cells),115/max(c.height for _,_,c in cells));dest=JOB/'early-face';dest.mkdir(exist_ok=True)
 board=Image.new('RGBA',(480,840),'#d4ced7');draw=ImageDraw.Draw(board)
 for i,(emotion,state,cell) in enumerate(cells):
  c=cell.resize((round(cell.width*scale),round(cell.height*scale)),Image.Resampling.NEAREST);im=Image.new('RGBA',(96,120));im.alpha_composite(c,((96-c.width)//2,119-c.height));im.save(dest/f'{emotion}-{state}.png',optimize=True)
  board.alpha_composite(im,(i%5*96,i//5*140+18));draw.text((i%5*96+2,i//5*140+2),emotion+' '+state,fill='#2f2432')
 board.resize((720,1260),Image.Resampling.NEAREST).save(JOB/'early-face-review.png')

def portraits():
 # Explicit pose-specific happy eye state is determined from this actor's sheets.
 portrait.portraits(JOB,'rika-hoshino','Rika Hoshino',set())

def icon():
 source=paint.clean(Image.open(JOB/'icon-native-generated.png'))
 # Native trial retained the headset but enlarged the face; no regeneration.
 source=source.crop((round(source.width*.04),round(source.height*.20),round(source.width*.86),source.height))
 image=source.resize((40,40),Image.Resampling.NEAREST);dest=PUBLIC/'icons/rika-hoshino/v1';dest.mkdir(parents=True,exist_ok=True);image.save(dest/'icon.png',optimize=True)
 record(dest/'icon.json',{'id':'rika-hoshino','source':'approved normal illustration','angle':'three-quarter-left','nativeSize':[40,40],'style':'Refined cel + painterly','bytes':(dest/'icon.png').stat().st_size})
 image.resize((320,320),Image.Resampling.NEAREST).save(JOB/'icon-review.png')

def surfaces():
 dest=PUBLIC/'rika-hoshino/v1';dest.mkdir(parents=True,exist_ok=True);source=Image.open(JOB/'normal-generated.png').convert('RGBA')
 crops={
  'hair':((92,470,200,645),'#714332'),'fringe':((300,370,360,405),'#714332'),
  'suit':((252,550,335,655),'#574795'),'pilot-back':((253,610,299,685),'#4c3c79'),
  'white':((194,1110,236,1164),'#e9e1e9'),'trim':((325,701,359,764),'#e5609c'),
  'pink':((554,200,720,252),'#e881b4'),'canopy':((557,293,711,440),'#285a65'),
  'metal':((499,863,549,938),'#5a5269'),'mech-white':((508,980,591,1060),'#d8c6dc'),
 }
 for name,(box,color) in crops.items():
  image=source.crop(box);flat=Image.new('RGBA',image.size,color);flat.alpha_composite(image);flat.convert('RGB').resize((64,96),Image.Resampling.NEAREST).save(dest/(name+'.png'),optimize=True)
 # Face crop/selection is set after reviewing this actor's early native face.
 config=json.loads((JOB/'face-fit.json').read_text())
 for surface,state in [('face','rest'),('half','half'),('closed','closed')]:
  original=Image.open(JOB/f'early-face/neutral-{state}.png').convert('RGBA');selection=Image.new('L',original.size);ImageDraw.Draw(selection).polygon(config['polygon'],fill=255)
  image=Image.composite(original,Image.new('RGBA',original.size,config['skin']),selection)
  image.crop(tuple(config['crop'])).resize((64,96),Image.Resampling.NEAREST).save(dest/(surface+'.png'),optimize=True)
 paint.sigil_image(128).quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(dest/'sigil.png',optimize=True)
 shutil.copyfile(JOB/'profile.json',dest/'profile.json')
 record(JOB/'model-texture-provenance.json',{'source':'normal-generated.png','crops':{k:list(v[0]) for k,v in crops.items()},'faceFit':config,'nativeSize':[64,96]})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['illustrations','face_check','portraits','icon','surfaces']);args=parser.parse_args();start=time.time();status='failed'
 # Existing exports use the same structural gate as future actor jobs. The
 # generic actor-job export wrapper owns the durable operation receipts.
 manifest=JOB/'production.json'
 if manifest.exists():
  from actor_production.readiness import require_ready
  require_ready(manifest,args.stage)
 try:globals()[args.stage]();status='complete'
 finally:
  path=JOB/'timings.json';data=json.loads(path.read_text());data.setdefault('exports',[]).append({'stage':args.stage,'status':status,'startedAt':datetime.fromtimestamp(start,timezone.utc).isoformat(),'finishedAt':datetime.now(timezone.utc).isoformat(),'elapsedMs':round((time.time()-start)*1000)});record(path,data)
