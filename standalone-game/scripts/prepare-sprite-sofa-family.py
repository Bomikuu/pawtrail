"""Native 2D sofa family: preserve fronts, reuse palette variants, import missing views."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib,copy,argparse
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--review-state',required=True,choices=['explicit_yes','no_response_default']);args=parser.parse_args()
ids=['sofa-sage','sofa-terracotta','sofa-cream','three-seat-sofa']
catalog=json.loads((root/'src/game/housing/catalog.json').read_text());items={i['id']:i for i in catalog['items']}
base=json.loads((root/'assets/furniture-studio/sprites/sofa/manifest.json').read_text())['item']
sheet_path=root/'assets/furniture-studio/references/three-seat-sofa/turnaround-sprite-v1.png'
sheet=Image.open(sheet_path).convert('RGBA')
palette_maps={
 'sofa-sage':['504d2a','656238','77763e','898a4a','9da05c','b1b771','c6cd8a'],
 'sofa-terracotta':['63452e','985037','b15431','b56a47','cf6d3b','ce8659','e3a776'],
 'sofa-cream':['805a36','b9aa86','cfbf9c','e5d5b2','f2e3c5','fff0c8','fff0c8']}
hexrgb=lambda value:tuple(bytes.fromhex(value))
source_palette=list(map(hexrgb,palette_maps['sofa-sage']))

def variant(im,id):
 out=im.copy();lookup=dict(zip(source_palette,map(hexrgb,palette_maps[id])))
 for y in range(im.height):
  for x in range(im.width):
   pixel=im.getpixel((x,y))
   if not pixel[3]:continue
   edge=any(nx<0 or ny<0 or nx>=im.width or ny>=im.height or not im.getpixel((nx,ny))[3] for nx,ny in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
   rgb=hexrgb('33251c') if edge else lookup.get(pixel[:3],pixel[:3])
   out.putpixel((x,y),(*rgb,pixel[3]))
 return out

def shifted_geometry(g):
 g=copy.deepcopy(g)
 for key in ['ground','placement','approaches']:
  for a in g[key]:a[1]+=2
 for seat in g['seats']:
  seat['point'][1]+=2;seat['exit'][1]+=2
 for surface in g['surfaces']:
  for key in ['point','approach','descent','landingBounds']:
   if key in surface:surface[key][1]+=2
 return g

def imported_profile(rotation,front):
 cell={90:0,180:1,270:2}[rotation];cell_width=sheet.width//3
 im=sheet.crop((cell*cell_width,0,(cell+1)*cell_width,sheet.height))
 im.putalpha(im.getchannel('A').point(lambda a:255 if a>=128 else 0))
 im=im.crop(im.getbbox());scale=min((92 if rotation==180 else 46)/im.width,59/im.height)
 size=(max(1,round(im.width*scale)),max(1,round(im.height*scale)))
 im=im.resize(size,Image.Resampling.NEAREST)
 colors=sorted({p[:3] for p in front.get_flattened_data() if p[3]})
 palette=Image.new('P',(1,1));flat=[c for rgb in colors for c in rgb];palette.putpalette(flat+[0]*(768-len(flat)))
 alpha=im.getchannel('A');im=im.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');im.putalpha(alpha)
 out=Image.new('RGBA',(96,64));out.alpha_composite(im,((96-size[0])//2,62-size[1]))
 return out,{'sheet':str(sheet_path.relative_to(root)),'cell':cell,'scale':scale,'size':size,'method':'Uniform per-view native reduction and canonical front palette; transparent alpha, no distortion.'}

def foreground(im,rotation):
 out=Image.new('RGBA',im.size);w=im.width
 for y in range(im.height):
  for x in range(w):
   if rotation==0:keep=y>=27 and (x<14 or x>=w-14)
   elif rotation==180:keep=True
   elif w==64:keep=y>=38 or (x>=40 if rotation==90 else x<=23)
   else:keep=y>=32 or (x>=60 if rotation==90 else x<=35)
   if keep:out.putpixel((x,y),im.getpixel((x,y)))
 return out

def seat(i,p,e,el=8):return {'id':'seat-'+str(i),'point':p,'exit':e,'facing':'down','elevation':el}
def geometry(ground,seats,approaches,surfaces):return {'version':2,'ground':[ground],'placement':[ground],'seats':seats,'approaches':approaches,'surfaces':surfaces,'occlusion':'base','actions':['sit','inspect']}
def three_geometry(original):
 surface=copy.deepcopy(original['geometry']['surfaces'])
 front=geometry([5,46,86,16],[seat(i,[x,60],[x,78]) for i,x in enumerate([22,48,74],1)],[[22,78],[48,78],[74,78],[-6,54],[102,54],[48,32]],surface)
 result={0:front}
 for r in [90,180,270]:
  s=copy.deepcopy(surface)
  for a in s:
   a['point']=[42 if r==90 else 54 if r==270 else 48,56]
   a['approach']=a['descent']=[12 if r==90 else 84 if r==270 else 48,52 if r!=180 else 34]
   a['landingBounds']=[a['point'][0]-10,50,20,12]
  if r==90:seats=[seat(i,[42,y],[12,y]) for i,y in enumerate([46,52,58],1)];ground=[28,45,40,17];approaches=[[12,46],[12,52],[12,58],[48,78],[82,52],[48,32]]
  elif r==270:seats=[seat(i,[54,y],[84,y]) for i,y in enumerate([58,52,46],1)];ground=[28,45,40,17];approaches=[[84,46],[84,52],[84,58],[48,78],[14,52],[48,32]]
  else:seats=[seat(i,[x,58],[x,34]) for i,x in enumerate([74,48,22],1)];ground=[5,46,86,16];approaches=[[74,34],[48,34],[22,34],[-6,54],[102,54],[48,78]]
  result[r]=geometry(ground,seats,approaches,s)
 return result

board=Image.new('RGBA',(384,82*4),'#fff5e7');draw=ImageDraw.Draw(board);exports={}
for row,id in enumerate(ids):
 original=items[id];source=root/'public'/original['file'].lstrip('/');front=Image.open(source).convert('RGBA');views={0:front};sources={};w=front.width
 if w==64:
  geometries={int(r):shifted_geometry(v['geometry']) for r,v in base['renderedViews'].items()}
  geometries[0]['surfaces']=copy.deepcopy(original['geometry']['surfaces'])
  for rotation in [90,180,270]:
   file=base['styles'][0]['views'][str(rotation)]['file'];im=variant(Image.open(root/'public'/file.lstrip('/')).convert('RGBA'),id)
   views[rotation]=Image.new('RGBA',(64,64));views[rotation].alpha_composite(im,(0,2))
   sources[str(rotation)]={'file':file,'method':'Approved couch shape, native +2px vertical translation and documented upholstery palette mapping.','palette':palette_maps[id]}
 else:
  geometries=three_geometry(original)
  for rotation in [90,180,270]:views[rotation],sources[str(rotation)]=imported_profile(rotation,front)
 masks={r:foreground(im,r) for r,im in views.items()}
 source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
 revision=hashlib.sha256(source_hash.encode()+b''.join(views[r].tobytes()+masks[r].tobytes() for r in views)+json.dumps(geometries,sort_keys=True).encode()).hexdigest()[:12]
 rel=Path('pawtrail-game/furniture-sprites')/id/revision;output=root/'public'/rel;output.mkdir(parents=True,exist_ok=True)
 record={**original,'representation':'sprite','rotatable':True,'supportedRotations':[0,90,180,270],'defaultStyle':'original','geometry':geometries[0],'renderedViews':{}}
 style_views={}
 for column,(r,im) in enumerate(views.items()):
  if r:im.save(output/f'{r}.png')
  masks[r].save(output/f'{r}-front.png');bbox=im.getbbox()
  style_views[str(r)]={'file':original['file'] if not r else '/'+str(rel/f'{r}.png'),'frontFile':'/'+str(rel/f'{r}-front.png')}
  record['renderedViews'][str(r)]={'width':w,'height':64,'anchor':original['anchor'],'visibleBounds':[bbox[0],bbox[1],bbox[2]-bbox[0],bbox[3]-bbox[1]],'indicatorHeight':62,'footprint':geometries[r]['ground'][0],'geometry':geometries[r]}
  board.alpha_composite(im,(column*96+(96-w)//2,row*82+18));draw.text((column*96+2,row*82+2),(id+' ' if column==0 else '')+str(r),fill='#38271e')
 record['frontFile']=style_views['0']['frontFile'];record['styles']=[{'id':'original','label':original['label'],'color':'#898a4a' if 'sage' in id or w==96 else '#b15431' if 'terracotta' in id else '#e5d5b2','views':style_views}]
 manifest={'version':1,'id':id,'representation':'sprite','revision':revision,'source':original['file'],'sourceSha256':source_hash,'frame':{'width':w,'height':64,'anchor':original['anchor']},'item':record,'views':sources,'foreground':'Exact pixels extracted from each finished view; arms in front/profile, complete rear body for natural high-back occlusion.','contacts':{'actorScale':1,'seatCount':len(geometries[0]['seats']),'contract':'Existing shared seat claims, normal-size actors and safe exits.'},'artReview':{'state':args.review_state if w==96 else 'approved_shape_and_existing_fronts_reused','generatedSheet':str(sheet_path.relative_to(root)) if w==96 else None},'review':{'runtime':'pending'}}
 folder=root/'assets/furniture-studio/sprites'/id;folder.mkdir(parents=True,exist_ok=True)
 for p in [output/'manifest.json',folder/'manifest.json']:p.write_text(json.dumps(manifest,indent=2)+'\n')
 items[id]=record;exports[id]=revision
for rel in ['src/game/housing/catalog.json','backend/housing/catalog.json']:
 p=root/rel;data=json.loads(p.read_text());data['items']=[items[i['id']] if i['id'] in ids else i for i in data['items']];p.write_text(json.dumps(data,indent=2)+'\n')
board.resize((1152,984),Image.Resampling.NEAREST).save(root/'assets/furniture-studio/batches/interaction-04-native-views.png')
print(json.dumps(exports))
