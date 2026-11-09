"""Import the generated couch reference sheet into native review views and material patches."""
from pathlib import Path
from PIL import Image
from collections import deque
import base64,hashlib,json
r=Path(__file__).resolve().parents[1]
folder=r/'assets/furniture-studio/references/studio-couch'
sheet=Image.open(folder/'turnaround-v2.png').convert('RGBA')
source=json.loads((r/'src/game/furniture/references/couch.json').read_text())
colors=[tuple(bytes.fromhex(h[1:7])) for h in source['palette'][1:]]
fabric=[tuple(bytes.fromhex(h[1:])) for h in source['materials']['fabric']]
revision=hashlib.sha256((folder/'turnaround-v2.png').read_bytes()+b'native-import-224-v2').hexdigest()[:12]
public=r/'public/pawtrail-game/furniture-references/studio-couch'/revision
public.mkdir(parents=True,exist_ok=True)

def object_cell(index):
 cell=sheet.crop((index%3*512,index//3*512,index%3*512+512,index//3*512+512))
 alpha=cell.getchannel('A');mask=bytearray(1 if a>=224 else 0 for a in alpha.get_flattened_data());best=[]
 for start in range(512*512):
  if not mask[start]:continue
  mask[start]=0;q=deque([start]);component=[]
  while q:
   i=q.popleft();component.append(i);x=i%512;y=i//512
   for dy in [-1,0,1]:
    for dx in [-1,0,1]:
     xx=x+dx;yy=y+dy
     if 0<=xx<512 and 0<=yy<512:
      j=yy*512+xx
      if mask[j]:mask[j]=0;q.append(j)
  if len(component)>len(best):best=component
 xs=[i%512 for i in best];ys=[i//512 for i in best]
 box=(min(xs),min(ys),max(xs)+1,max(ys)+1)
 binary=Image.new('RGBA',(512,512))
 for i in best:
  x=i%512;y=i//512;binary.putpixel((x,y),cell.getpixel((x,y))[:3]+(255,))
 return binary.crop(box),box

cells={};names=['front-generated','left-profile','back','right-profile','front-three-quarter','rear-three-quarter']
for index,name in enumerate(names):
 crop,box=object_cell(index);cells[name]=crop
 print(name,box,crop.size)
 # The untouched raw sheet remains authoritative generation provenance.
 crop.save(public/(name+'-import.png'))

# Same uniform scale across views; profiles are mapped by actual facing, not the prompt's labels.
scale=58/cells['front-generated'].width
refs={'0':{'file':source['source'],'width':64,'height':64,'anchor':[32,55],'label':'Original front · canonical'}}
for angle,name,label in [(90,'right-profile','Generated left-facing reference'),(180,'back','Generated rear reference'),(270,'left-profile','Generated right-facing reference')]:
 crop=cells[name];size=(round(crop.width*scale),round(crop.height*scale));native=crop.resize(size,Image.Resampling.NEAREST)
 pixels=[]
 for rr,gg,bb,aa in native.get_flattened_data():
  if not aa:pixels.append((0,0,0,0));continue
  rgb=min(colors,key=lambda c:(c[0]-rr)**2+(c[1]-gg)**2+(c[2]-bb)**2)
  pixels.append(rgb+(255,))
 native.putdata(pixels)
 canvas=Image.new('RGBA',(96,112));canvas.alpha_composite(native,((96-size[0])//2,102-size[1]));file=f'reference-{angle}.png';canvas.save(public/file)
 refs[str(angle)]={'file':'/'+str(public.relative_to(r/'public'))+'/'+file,'width':96,'height':112,'anchor':[48,96],'label':label,'generatedCell':name}

patches={}
def patch(name,cell,rect,size,palette):
 image=cells[cell];w,h=image.size;box=tuple(round(value*(w if i%2==0 else h)) for i,value in enumerate(rect));im=image.crop(box).resize(size,Image.Resampling.NEAREST)
 data=[]
 for rr,gg,bb,aa in im.get_flattened_data():
  rgb=min(palette,key=lambda c:(c[0]-rr)**2+(c[1]-gg)**2+(c[2]-bb)**2)
  data.extend(rgb+(255,))
 patches[name]={'width':size[0],'height':size[1],'rgba':base64.b64encode(bytes(data)).decode()}
patch('side','right-profile',[.12,.50,.90,.86],(32,20),fabric)
patch('rear','back',[.12,.40,.88,.87],(46,24),fabric)
patch('upper','back',[.16,.09,.45,.25],(22,12),fabric)
patch('edge','right-profile',[.15,.43,.87,.51],(28,4),fabric)
patch('wood','front-generated',[.10,.94,.16,.99],(5,5),[c for c in colors if c[0]>100 and c[0]>c[1]*1.2 and c[1]>45])
patch('arm','right-profile',[.075,.43,.94,.90],(32,22),fabric)
patch('rearPanel','back',[.125,.30,.885,.86],(46,25),fabric)
patch('cushionRear','back',[.13,.025,.495,.315],(24,14),fabric)
patch('cushionSide','right-profile',[.76,.025,.94,.465],(12,23),fabric)
patch('pillowEdge','front-generated',[.20,.39,.23,.45],(4,6),[c for c in colors if c[0]>150 and c[1]>115 and c[2]>70])
metadata={'version':1,'sheet':'assets/furniture-studio/references/studio-couch/turnaround-v2.png','sheetSha256':hashlib.sha256((folder/'turnaround-v2.png').read_bytes()).hexdigest(),'referenceViews':refs,'patches':patches,'dimensions':{'width':58,'depth':36.4,'backTop':37.7,'armTop':23,'seatTop':10.4},'calibration':'References use one uniform import scale. Couch front/rear retain the original source camera; profiles use an explicit 12-degree camera calibration. Actor artwork keeps the shared native camera and docks through projected pelvis/seat contacts. Generated camera geometry remains approximate.','import':{'alphaCutoff':224,'foreground':'largest connected component per sheet cell','palette':'original couch palette','filter':'nearest'}}
metadata['projection']={'sidePitchDegrees': 12, 'blend': 'sin(yaw)^4', 'nativeActorCamera': [0, 34.5, 90], 'note': 'Couch side projection follows the flatter generated profiles. Front/rear retain the source camera; actors retain their shared camera with pelvis docking.'}
metadata['dimensions']={'width': 56.645, 'depth': 34.3, 'backTop': 37.319, 'armTop': 21.1, 'seatTop': 10.4}
(r/'src/game/furniture/references/couch-turnaround.json').write_text(json.dumps(metadata,indent=2)+'\n')
manifest=json.loads((folder/'reference-set.json').read_text());manifest['nativeImport']=str(public.relative_to(r));finding='Profiles assigned to game yaw by observed backrest position; generated labels alone were reversed.';manifest['review']['findings']=list(dict.fromkeys(manifest['review']['findings']+[finding]));(folder/'reference-set.json').write_text(json.dumps(manifest,indent=2)+'\n')
