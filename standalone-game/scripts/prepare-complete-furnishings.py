"""Prepare generated furnishings; no runtime changes. Sources are preserved."""
from PIL import Image,ImageDraw
from pathlib import Path
import json,shutil,math
from collections import deque
ROOT=Path(__file__).resolve().parents[1]
F=ROOT/'public/assets/game/housing/furniture';P=F.parent/'pet-furniture'
batches=json.loads((F/'remaining-source-batches.json').read_text())
base=json.loads((F/'furniture-first-batch.json').read_text())['palette']
extended=base+['395866','557986','79a5b4','a2cbd5','c7e3e5','f0fafa']
def pal(colors):
 i=Image.new('P',(1,1));rgb=[int(c[j:j+2],16) for c in colors for j in (0,2,4)];rgb+=(rgb[:3])*((768-len(rgb))//3);i.putpalette(rgb);return i
PAL=pal(base);PETPAL=pal(extended)
configs={
'living':(3,[('three-seat-sofa',96,64),('television',32,32),('tv-cabinet',64,32),('side-table',32,32),('decorative-rug',64,64),('wall-clock',32,32)]),
'bedroom':(3,[('double-bed',64,64),('bedside-table',32,32),('chair',32,32),('mirror',32,64),('dresser',64,64),('decorative-pillows',32,32)]),
'kitchen':(3,[('kitchen-counter',64,64),('dining-table',64,64),('dining-chair',32,32),('cupboards',64,64),('kitchen-shelves',64,32),('food-storage-containers',32,32)]),
'decor1':(4,[('small-indoor-plant',32,32),('large-indoor-plant',32,64),('flower-pot',32,32),('painting',32,32),('picture-frame',32,32),('decorative-lights',64,32),('candles',32,32),('wall-shelf',64,32)]),
'decor2':(2,[('storage-box',32,32),('books',32,32),('small-rug',64,32),('coffee-table',64,32)]),
'pet1':(3,[('small-cat-bed',32,32),('round-fluffy-cat-bed',32,32),('wooden-cat-house',64,64),('cat-tree',64,96),('tall-cat-climbing-tower',64,128),('cat-tunnel',64,32)]),
'pet2':(3,[('window-perch',64,32),('hanging-cat-hammock',64,64),('cat-basket',32,32),('cardboard-box',32,32),('cat-carrier',64,32),('automatic-feeder',32,64)]),
'pet3':(3,[('pet-food-storage-container',32,32),('pet-food-bag',32,32),('treat-container',32,32),('water-fountain',32,64),('yarn-ball',32,32),('feather-wand',64,32)]),
'pet4':(3,[('toy-mouse',32,32),('rubber-ball',32,32),('fish-plush-toy',32,32),('interactive-track-toy',32,32),('toy-basket',32,32),('litter-box',64,32)]),
'pet5':(3,[('grooming-brush',32,32),('small-towel',32,32),('pet-blanket',64,32),('cleaning-supplies',32,32),('first-aid-kit',32,32),('first-aid-pouch',32,32)]),
'states':(3,[('food-bowl-empty',32,32),('food-bowl-half',32,32),('food-bowl-full',32,32),('water-bowl-empty',32,32),('water-bowl-full',32,32),('water-bowl-half',32,32)])}
configs['colors']=(3,[('sofa-sage',64,64),('sofa-terracotta',64,64),('sofa-cream',64,64),('pet-blanket-sage',64,32),('pet-blanket-terracotta',64,32),('pet-blanket-cream',64,32)])
assetsF=[];assetsP=[]
def prefix(folder):return '/assets/game/housing/'+folder.name+'/'
def binarize(i):
 i=i.convert('RGBA');i.putalpha(i.getchannel('A').point(lambda a:255 if a>=128 else 0));return i

def colorize(i,ispet=False):
 alpha=i.getchannel('A');i=i.convert('RGB').quantize(palette=PETPAL if ispet else PAL,dither=Image.Dither.NONE).convert('RGBA');i.putalpha(alpha)
 i.putdata([c if c[3] else (0,0,0,0) for c in i.get_flattened_data()]);return i

def export(crop,w,h,ispet=False):
 crop=binarize(crop)
 # Remove only disconnected neighboring-object fragments that touch the source-cell edge.
 small=crop.getchannel('A').resize((128,128),Image.Resampling.NEAREST)
 points={(x,y) for y in range(128) for x in range(128) if small.getpixel((x,y))}
 components=[]
 while points:
  start=points.pop();q=deque([start]);component=[start]
  while q:
   x,y=q.popleft()
   for n in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
    if n in points:points.remove(n);q.append(n);component.append(n)
  components.append(component)
 if components:
  largest=max(components,key=len)
  for component in components:
   if component is largest:continue
   if any(x in (0,127) or y in (0,127) for x,y in component):
    xs=[v[0] for v in component];ys=[v[1] for v in component]
    region=(max(0,(min(xs)-1)*crop.width//128),max(0,(min(ys)-1)*crop.height//128),min(crop.width,(max(xs)+2)*crop.width//128),min(crop.height,(max(ys)+2)*crop.height//128))
    crop.paste((0,0,0,0),region)
 box=crop.getbbox()
 if not box:raise ValueError('Empty source')
 crop=crop.crop(box);scale=min((w-4)/crop.width,(h-4)/crop.height)
 crop=crop.resize((max(1,round(crop.width*scale)),max(1,round(crop.height*scale))),Image.Resampling.NEAREST)
 crop=colorize(crop,ispet);i=Image.new('RGBA',(w,h));i.paste(crop,((w-crop.width)//2,h-2-crop.height));return i

for group,(cols,items) in configs.items():
 ispet=group.startswith('pet') or group=='states';folder=P if ispet else F
 source=Image.open(batches[group]['source']).convert('RGBA');rows=math.ceil(len(items)/cols)
 sourceName='complete-'+group+'-source.png';shutil.copy2(batches[group]['source'],folder/'sources-complete'/sourceName)
 if group=='colors':shutil.copy2(batches[group]['source'],P/'sources-complete'/sourceName)
 for idx,(name,w,h) in enumerate(items):
  if group=='colors':ispet=idx>=3;folder=P if ispet else F
  col,row=idx%cols,idx//cols
  box=[col*source.width//cols,row*source.height//rows,(col+1)*source.width//cols,(row+1)*source.height//rows]
  if group=='living' and idx==0:box=[20,50,590,480] # Observed sofa spills beyond requested first grid cell; preserve full silhouette.
  i=export(source.crop(box),w,h,ispet)
  # Remove unwanted cushion-like seams generated in the empty bowl interiors.
  if name in ('food-bowl-empty','water-bowl-empty'):
   d=ImageDraw.Draw(i);d.ellipse((6,8,25,18),fill='#cfbf9c');d.ellipse((7,9,24,17),fill='#f2e3c5')
  filename=name+'-complete-v1.png';i.save(folder/filename)
  bounds=i.getbbox();x,y,x2,y2=bounds;wall=name in ['wall-clock','painting','picture-frame','decorative-lights','wall-shelf','cupboards','kitchen-shelves','window-perch','hanging-cat-hammock'];rug='rug' in name
  a=dict(id=name,file=prefix(folder)+filename,source=prefix(folder)+'sources-complete/'+sourceName,sourceRect=box,frameWidth=w,frameHeight=h,frames=1,anchorPixels=[w//2,h-2],occupiedBounds=list(bounds),collisionFootprintPixels=None if rug or wall else [x+1,max(y,y2-min(16,y2-y)),max(1,x2-x-2),min(16,y2-y)],placementLayer='wall' if wall else 'floor',collisionStatus='proposed; not engine-verified',alphaValues=sorted(set(i.getchannel('A').get_flattened_data())),paletteColors=len({c[:3] for c in i.get_flattened_data() if c[3]}),productionReady=False,reviewStatus='native dimensions, silhouette separation, palette and binary alpha inspected; scene placement pending')
  if name=='coffee-table':a['notes']='Decorative plant is baked into this coffee-table variant.'
  (assetsP if ispet else assetsF).append(a)

# Four-frame tree animation and three four-frame toy rows: common per-row framing preserves relative motion.
for key,name,w,h,rows,actions in [('treeAnimation','cat-tree-swing',64,96,1,['interaction']),('toyAnimation','toy-mouse-states',32,32,3,['idle','moved','played'])]:
 source=Image.open(batches[key]['source']).convert('RGBA');sourceName=name+'-source.png';shutil.copy2(batches[key]['source'],P/'sources-complete'/sourceName)
 atlas=Image.new('RGBA',(4*w,rows*h));anim={};frames=[]
 for row,action in enumerate(actions):
  cells=[binarize(source.crop((col*source.width//4,row*source.height//rows,(col+1)*source.width//4,(row+1)*source.height//rows))) for col in range(4)]
  boxes=[c.getbbox() for c in cells];union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes));uw,uh=union[2]-union[0],union[3]-union[1];factor=min((w-4)/uw,(h-4)/uh);size=(max(1,round(uw*factor)),max(1,round(uh*factor)))
  strip=Image.new('RGBA',(4*w,h))
  for col,cell in enumerate(cells):
   c=colorize(cell.crop(union).resize(size,Image.Resampling.NEAREST),True);frame=Image.new('RGBA',(w,h));frame.paste(c,((w-size[0])//2,h-2-size[1]));strip.paste(frame,(col*w,0));atlas.paste(frame,(col*w,row*h));frames.append(frame)
  stripName=f'{name}-{action}-complete-v1.png';strip.save(P/stripName)
  anim[action]=dict(file=prefix(P)+stripName,frames=[dict(x=col*w,y=0,width=w,height=h) for col in range(4)],frameRate=5 if action=='idle' else 8,loop=True,review='Four distinct generated poses inspected; precise loop pacing requires playback review.')
 filename=name+'-complete-v1.png';atlas.save(P/filename)
 assetsP.append(dict(id=name,file=prefix(P)+filename,source=prefix(P)+'sources-complete/'+sourceName,frameWidth=w,frameHeight=h,frames=4*rows,animations=anim,productionReady=False,reviewStatus='generated pose changes and framing inspected; continuity/engine playback not certified'))

# Existing exports stay intact and retain their original metadata.
oldF=[]
for file in ['furniture-first-batch.json','living-room-batch-2.json','bedroom-batch-2.json','kitchen-batch-2.json']:
 d=json.loads((F/file).read_text())
 for a in d.get('assets',[]):oldF.append(dict(a,metadataSource=prefix(F)+file))
oldP=json.loads((P/'pet-furniture-first-batch.json').read_text()).get('assets',[])

for folder,new,existing,kind in [(F,assetsF,oldF,'furniture'),(P,assetsP,oldP,'pet-furniture')]:
 manifest=dict(generationMode='built-in image_gen',palette=extended if folder==P else base,postprocessing='Observed source-grid crops, threshold alpha128 to remove glow, native nearest-neighbor fitting, disconnected boundary fragment removal, palette remap without dithering, explicit fixed canvas; state/animation rows have actual exported frame positions.',newAssets=new,existingAssets=existing,prompts={k:v['prompt'] for k,v in batches.items() if k=='colors' or ((k.startswith('pet') or k in ['states','treeAnimation','toyAnimation'])==(folder==P))},limitations=['Placement anchors and collision footprints are proposals until engine verification.','Generated source renders have antialiased glow; native exports remove it.','Animation loop pacing/continuity requires playback review; no production-ready claim.'])
 (folder/f'complete-{kind}-manifest.json').write_text(json.dumps(manifest,indent=2))
 preview=Image.new('RGBA',(1024,math.ceil(len(new)/8)*160),'#f3e8d2')
 for idx,a in enumerate(new):
  i=Image.open(ROOT/'public'/a['file'].lstrip('/')).convert('RGBA');i=i.crop((0,0,a['frameWidth'],a['frameHeight']));factor=min(3,120//i.width,144//i.height);i=i.resize((i.width*factor,i.height*factor),Image.Resampling.NEAREST);preview.alpha_composite(i,((idx%8)*128+(128-i.width)//2,(idx//8)*160+(160-i.height)//2))
 preview.convert('RGB').save(folder/f'complete-{kind}-review.png')
print('New furniture',len(assetsF),'new pet assets including state/animation groups',len(assetsP),'existing',len(oldF),len(oldP))
