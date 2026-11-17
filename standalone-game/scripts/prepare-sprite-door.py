"""Export the existing closed/open door at integer actor-compatible scale."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,hashlib
root=Path(__file__).resolve().parents[1]
files={state:root/f'public/assets/game/housing/tilesets/door-{state}-housing-v1.png' for state in ['closed','open']}
native=Image.open(files['closed']).convert('RGBA')
# Extract the canonical frame/panel from its wall tile; keep exact painted pixels.
for y in range(32):
 for x in range(32):
  if x<6 or x>=28 or y<1:native.putpixel((x,y),(0,0,0,0))
opened=native.copy()
# The original open tile has an opaque painted interior. A game passage needs
# actual alpha and the identical closed frame, not an opaque dark rectangle.
for y in range(6,32):
 for x in range(10,24):opened.putpixel((x,y),(0,0,0,0))
images={'closed':native.resize((64,64),Image.Resampling.NEAREST),'open':opened.resize((64,64),Image.Resampling.NEAREST)}
geometry={'version':2,'ground':[[12,42,44,22]],'placement':[[12,42,44,22]],'approaches':[[32,78],[32,32]],'seats':[],'surfaces':[],'occlusion':'base','actions':['toggle_door','inspect']}
open_ground=[[12,42,8,22],[48,42,8,22]]
revision=hashlib.sha256(b''.join(im.tobytes() for im in images.values())+json.dumps([geometry,open_ground],sort_keys=True).encode()).hexdigest()[:12]
relative=f'pawtrail-game/furniture-sprites/wooden-door/{revision}';output=root/'public'/relative;output.mkdir(parents=True,exist_ok=True)
for state,im in images.items():im.save(output/(state+'.png'))
catalog=json.loads((root/'src/game/housing/catalog.json').read_text());old=next(i for i in catalog['items'] if i['id']=='wooden-door')
record={**old,'file':'/'+relative+'/closed.png','width':64,'height':64,'anchor':[32,64],'footprint':[12,42,44,22],'geometry':geometry,'rotatable':False,'supportedRotations':[0],'representation':'sprite','stateViews':{'open':{'file':'/'+relative+'/open.png','ground':open_ground}}}
manifest={'version':1,'id':'wooden-door','representation':'sprite','revision':revision,'source':{state:{'file':'/'+str(path.relative_to(root/'public')),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()} for state,path in files.items()},'production':'Canonical closed door pixels extracted from their wall tile, exact integer 2x nearest-neighbor. Open state preserves that same frame and makes only the inner panel transparent. The old opaque open tile is a source reference. No new generated artwork or model; fixed-facing architectural door.','frame':{'width':64,'height':64,'anchor':[32,64]},'item':record,'actorContract':{'actorScale':1,'closed':'Panel blocks passage.','open':'Only frame posts remain solid.','close':'Owner only; refuse while any actor/pet foot overlaps the doorway.','cancel':'No state change before completion.','authority':'Live object_states and idempotency remain server-owned. Preview state is local.'},'review':{'runtime':'pending'}}
folder=root/'assets/furniture-studio/sprites/wooden-door';folder.mkdir(parents=True,exist_ok=True)
for p in [output/'manifest.json',folder/'manifest.json']:p.write_text(json.dumps(manifest,indent=2)+'\n')
board=Image.new('RGBA',(128,80),'#fff5e7');draw=ImageDraw.Draw(board)
for i,(state,im) in enumerate(images.items()):board.alpha_composite(im,(i*64,16));draw.text((i*64+5,2),state.title(),fill='#38271e')
board.resize((512,320),Image.Resampling.NEAREST).save(folder/'states.png')
for rel in ['src/game/housing/catalog.json','backend/housing/catalog.json']:
 p=root/rel;d=json.loads(p.read_text());d['items']=[record if i['id']=='wooden-door' else i for i in d['items']];p.write_text(json.dumps(d,indent=2)+'\n')
print('Exported sprite door',revision)
