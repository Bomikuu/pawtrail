"""Aurelia's scoped artwork exports using the existing painted-part contracts."""
from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageDraw
import importlib.util
import json, math, argparse, hashlib, shutil

ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/actor-appearances/aurelia-weiss-v1'
PUBLIC=ROOT/'public/pawtrail-game/actor-studio'
SIZE=(320,448);CYCLE=5000
spec=importlib.util.spec_from_file_location('painted_helpers',ROOT/'scripts/prepare-sieghart-blend.py')
helpers=importlib.util.module_from_spec(spec);spec.loader.exec_module(helpers)
clean=helpers.clean;mask=helpers.mask;record=helpers.record
PARTS={
 'normal':[
  ('feather-left',[(335,548),(405,565),(360,760),(300,900),(260,1200),(245,1515),(0,1515),(0,700),(135,675)],(350,570),(-.3,1),900,5.5,-.9),
  ('feather-right',[(750,840),(1024,880),(1024,1520),(650,1520),(640,1380),(620,1250),(650,1080),(710,900)],(760,850),(.25,1),650,6.5,-1.9),
  ('hair-long',[(620,300),(740,278),(1024,280),(1024,740),(755,740),(730,600),(715,450),(620,360)],(620,333),(1,.5),470,7.5,.3),
  ('hair-crown',[(285,50),(390,45),(420,115),(355,125),(285,150)],(350,135),(0,-1),95,3.0,-.4),
  ('hair-temple',[(275,145),(311,130),(320,175),(320,245),(285,245)],(315,170),(-.3,1),90,2.5,.8),
 ],
 'enraged':[
  ('feather-left',[(330,700),(400,720),(350,840),(260,980),(180,1220),(165,1355),(0,1355),(0,650),(200,660)],(335,715),(-.3,1),680,6.5,-.8),
  ('feather-right',[(820,680),(1160,620),(1160,1355),(970,1355),(930,1180),(860,1020),(820,880)],(830,720),(.35,1),680,7.0,-1.8),
  ('hair-long-left',[(275,250),(335,260),(270,360),(235,470),(300,540),(330,640),(0,640),(0,240),(175,230)],(295,295),(-1,.5),410,8.0,.3),
  ('hair-long-right',[(645,250),(850,235),(1000,245),(1005,357),(920,367),(780,347),(645,330)],(650,285),(1,.15),370,7.0,1.1),
  ('hair-crown',[(360,100),(460,65),(505,130),(490,180),(400,170),(355,195)],(440,180),(0,-1),120,3.2,-.4),
 ],
}

def image_fit(image,scale,tx,ty):
 return image.transform(SIZE,Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC)

def track(id,size,count=1,cols=1,durations=None,opacity=1,offset=(0,0)):
 return {'id':id,'atlas':id+'.webp','nativeSize':size,'frames':[{'id':i,'rect':[i%cols*size[0],i//cols*size[1],*size]} for i in range(count)],'sequence':list(range(count)),'durationMs':durations or [CYCLE/count]*count,'offset':offset,'opacity':opacity}

def sigil_image(size=128):
 image=Image.open(JOB/'sigil-generated.png').convert('RGBA').resize((size,size),Image.Resampling.LANCZOS)
 pixels=image.load()
 for y in range(size):
  for x in range(size):
   r,g,b,a=pixels[x,y];core=max(0,min(1,(min(r,g,b)-155)/70))
   fade=max(0,min(1,(size/2-math.hypot(x-size/2,y-size/2))/(size*.04)))
   pixels[x,y]=(r,g,b,max(0,min(255,round(a*core*fade/32)*32)))
 return image

def illustration(variant,actor_id='aurelia-weiss',energy_anchor=(455,247),energy_mode='violet'):
 original=clean(Image.open(JOB/f'{variant}-generated.png'))
 under=clean(Image.open(JOB/f'{variant}-underlay-generated.png')).resize(original.size,Image.Resampling.LANCZOS)
 base=original.copy();parts=[]
 bounds=original.getbbox();scale=min((SIZE[0]-28)/(bounds[2]-bounds[0]),(SIZE[1]-24)/(bounds[3]-bounds[1]))
 tx=(SIZE[0]-(bounds[2]-bounds[0])*scale)/2-bounds[0]*scale;ty=SIZE[1]-12-bounds[3]*scale
 fit=lambda image:image_fit(image,scale,tx,ty)
 used=Image.new('L',original.size)
 for name,polygon,root,direction,length,amplitude,phase in PARTS[variant]:
  selection=ImageChops.subtract(mask(original.size,polygon),used);used=ImageChops.lighter(used,selection)
  piece=original.copy();piece.putalpha(ImageChops.multiply(original.getchannel('A'),selection))
  if name in ['hair-crown','hair-temple']:
   base.putalpha(ImageChops.multiply(base.getchannel('A'),ImageChops.invert(selection)))
  else:base=Image.composite(under,base,selection)
  parts.append((name,fit(piece),(root[0]*scale+tx,root[1]*scale+ty),direction,length*scale,amplitude,phase,{}))
 parts.insert(0,('body',helpers.connected_body(fit(base)),(0,0),(1,0),1,0,0,{}))
 if variant=='enraged':
  # Reuse suitable approved painted energy, not another actor's face/artwork.
  old=json.loads((PUBLIC/'illustrations/sieghart/v5/enraged/illustration.json').read_text())
  arc=next(p for p in old['motionRig']['parts'] if p['id']=='eye-lightning')
  src=Image.open(PUBLIC/'illustrations/sieghart/v5/enraged/parts.webp').convert('RGBA')
  x,y,w,h=arc['rect'];energy=src.crop((x,y,x+w,y+h)).resize((round(w*.8),round(h*.8)),Image.Resampling.LANCZOS)
  r,g,b,a=energy.split();energy=Image.merge('RGBA',(r.point(lambda v:min(255,v+15)),g.point(lambda v:min(255,v+8)),b,a))
  if energy_mode=='teal':energy=Image.merge('RGBA',(g.point(lambda v:round(v*.65)),b,r,a))
  root=(energy_anchor[0]*scale+tx,energy_anchor[1]*scale+ty);local=((arc['root'][0]-arc['offset'][0])*.8,(arc['root'][1]-arc['offset'][1])*.8)
  full=Image.new('RGBA',SIZE);full.alpha_composite(energy,(round(root[0]-local[0]),round(root[1]-local[1])))
  parts.append(('moonfeather-energy',full,root,(-1,-.35),52,4.0,.3,{'cycles':3,'pulse':{'min':.8,'max':1,'cycles':2}}))
 entries=[];cursor_x=cursor_y=row_height=0
 for name,image,root,direction,length,amplitude,phase,extra in parts:
  box=image.getbbox()
  if not box:raise ValueError('Empty painted part '+name)
  piece=image.crop(box);w,h=piece.size
  if cursor_x+w+2>512:cursor_y+=row_height+4;cursor_x=row_height=0
  rect=[cursor_x,cursor_y,w,h];entries.append((piece,{'id':name,'rect':rect,'offset':list(box[:2]),'root':root,'direction':direction,'length':length,'amplitude':amplitude,'phase':phase,**extra}))
  cursor_x+=w+4;row_height=max(row_height,h)
 atlas=Image.new('RGBA',(512,cursor_y+row_height))
 for piece,part in entries:atlas.paste(piece,part['rect'][:2])
 dest=PUBLIC/f'illustrations/{actor_id}/v1'/variant;dest.mkdir(parents=True,exist_ok=True)
 atlas.save(dest/'parts.webp',quality=90,method=6,exact=True)
 actor_poster=fit(original)
 for name in ['actor','actor-poster']:actor_poster.save(dest/(name+'.webp'),quality=88,method=6,exact=True)
 # Quiet independently authored background frames.
 source=Image.open(JOB/'background-generated.png').convert('RGBA');bg=Image.new('RGBA',(SIZE[0]*2,SIZE[1]*2));first=None
 for i in range(4):
  cell=source.crop((i%2*source.width//2,i//2*source.height//2,(i%2+1)*source.width//2,(i//2+1)*source.height//2)).resize(SIZE,Image.Resampling.LANCZOS)
  cell=ImageEnhance.Color(cell).enhance(.35).quantize(colors=64,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA')
  bg.paste(cell,(i%2*SIZE[0],i//2*SIZE[1]));first=cell if first is None else first
 bg.save(dest/'background.webp',quality=68,method=6)
 # Smoothly rotating authored feather sigil, separate from actor and context.
 sigil=sigil_image(64).resize((128,128),Image.Resampling.BICUBIC)
 aura=Image.new('RGBA',(160*6,224*4));aura_first=None
 for i in range(24):
  frame=Image.new('RGBA',(160,224));glyph=sigil.rotate(math.sin(i/24*math.pi*2)*9,Image.Resampling.BICUBIC)
  frame.alpha_composite(glyph,(16,36));frame.putalpha(frame.getchannel('A').point(lambda a:round(a/51)*51));aura.paste(frame,(i%6*160,i//6*224));aura_first=frame if aura_first is None else aura_first
 aura=aura.quantize(colors=32,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA');aura.save(dest/'aura.webp',quality=70,method=6,exact=True)
 actor=track('actor',SIZE);layers=[track('background',SIZE,4,2,opacity=.16),track('aura',(160,224),24,6,opacity=.32 if variant=='enraged' else .2,offset=(80,80)),actor]
 data={**actor,'variant':variant,'compositionSize':SIZE,'backdrop':'#282633','rendering':'smooth','layers':layers,'motionRig':{'atlas':'parts.webp','cycleMs':CYCLE,'parts':[p for _,p in entries]}}
 record(dest/'illustration.json',data)
 poster=Image.new('RGBA',SIZE,'#282633');first.putalpha(first.getchannel('A').point(lambda a:round(a*.16)));poster.alpha_composite(first);poster.alpha_composite(actor_poster)
 poster.save(dest/'poster.webp',quality=88,method=6);poster.save(JOB/f'{variant}-review.png')
 return {'variant':variant,'sourceBounds':bounds,'scale':scale,'translation':[tx,ty],'folder':str(dest.relative_to(ROOT)),
         'runtimeBytes':sum(p.stat().st_size for p in dest.iterdir() if p.is_file()),'decodedPartsBytes':atlas.width*atlas.height*4,'parts':[p for _,p in entries]}

def illustrations():
 record(JOB/'illustration-export.json',{'style':'Refined cel + painterly','nativeSize':SIZE,'method':'Continuous pinned painted parts; independent background and sigil aura','variants':[illustration(v) for v in ['normal','enraged']]})

def icon():
 # Dedicated coarse art preserves authored eyes at the final native size.
 source=clean(Image.open(JOB/'icon-native-generated.png'))
 image=source.resize((40,40),Image.Resampling.NEAREST)
 dest=PUBLIC/'icons/aurelia-weiss/v2';dest.mkdir(parents=True,exist_ok=True);image.save(dest/'icon.png',optimize=True)
 record(dest/'icon.json',{'id':'aurelia-weiss','source':'approved normal illustration → dedicated icon','angle':'three-quarter-left','style':'Refined cel + painterly','nativeSize':[40,40],'bytes':(dest/'icon.png').stat().st_size})
 image.resize((320,320),Image.Resampling.NEAREST).save(JOB/'icon-review.png')

def portraits():
 # Reuse the approved complete-frame exporter, with this actor's own sources.
 spec=importlib.util.spec_from_file_location('portrait_export',ROOT/'scripts/prepare-sieghart-revision.py')
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 module.portraits(JOB,'aurelia-weiss','Aurelia Weiss',{'three-quarter-left','head-tilt-smile-right'})

def surfaces():
 dest=PUBLIC/'aurelia-weiss/v1';dest.mkdir(parents=True,exist_ok=True)
 source=Image.open(JOB/'normal-generated.png').convert('RGBA')
 crops={
  'hair':((740,360,880,590),'#cf80a7'),'fringe':((320,82,421,165),'#d989af'),
  'armor':((430,355,550,550),'#e5dce9'),'undersuit':((415,855,500,990),'#3c3344'),
  'skirt':((415,610,565,780),'#b89bc9'),'feather':((95,800,265,1160),'#e9e0ee'),
  'lining':((735,1080,860,1305),'#a28bb8'),'boots':((325,895,415,1110),'#e5dce8'),
  'bracer':((609,615,674,766),'#e5dce9'),
 }
 for name,(box,color) in crops.items():
  crop=source.crop(box);paint=Image.new('RGBA',crop.size,color);paint.alpha_composite(crop)
  paint=paint.convert('RGB').resize((64,96),Image.Resampling.NEAREST)
  paint.save(dest/(name+'.png'),optimize=True)
 back_source=Image.open(JOB/'turnaround-generated.png').convert('RGBA')
 back=back_source.crop((1217,223,1334,376));paint=Image.new('RGBA',back.size,'#4c3d56');paint.alpha_composite(back)
 paint.convert('RGB').resize((64,96),Image.Resampling.NEAREST).save(dest/'back.png',optimize=True)
 for name,state in [('face','rest'),('half','half'),('closed','closed')]:
  original=Image.open(JOB/f'native/front-pout-neutral-{state}.png').convert('RGBA')
  selection=Image.new('L',original.size);ImageDraw.Draw(selection).polygon([(32,69),(64,69),(66,80),(58,91),(48,96),(37,91),(29,81)],fill=255)
  # Retain this actor's authored irises, eyelids, mouth and cheek colors. The
  # separate scalp/fringe geometry supplies hair instead of wrapping a bust on a face.
  color=Image.new('RGBA',original.size,'#f5c8b0');color=Image.composite(original,color,selection)
  # Include forehead space so the eyes sit below the separate sculpted fringe.
  color.crop((26,48,70,98)).resize((64,96),Image.Resampling.NEAREST).save(dest/(name+'.png'),optimize=True)
 sigil_image(128).quantize(colors=96,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(dest/'sigil.png',optimize=True)
 shutil.copyfile(JOB/'profile.json',dest/'profile.json')
 record(JOB/'model-texture-provenance.json',{'face':'Own authored front neutral open/half/closed portrait regions, fitted to curved face UVs without hair/collar projection',
  'faceSourceCrop':[26,48,70,98],'backSourceCrop':[1217,223,1334,376],
  'surfaces':'Crops of the approved normal illustration, filled beneath transparency with matching material base colors',
  'sourceCrops':{k:list(v[0]) for k,v in crops.items()},'nativeSurfaceSize':[64,96],
  'bytes':{p.name:p.stat().st_size for p in dest.iterdir() if p.is_file()}})

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['illustrations','portraits','icon','surfaces']);args=parser.parse_args()
 globals()[args.stage]()
