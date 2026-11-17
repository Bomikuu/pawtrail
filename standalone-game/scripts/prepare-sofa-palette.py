"""Author a single versioned upholstery-index mask per sofa view; no color sprites."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,base64,hashlib
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'src/game/housing/catalog.json').read_text());sofa=next(i for i in catalog['items'] if i['id']=='sofa')
ref=json.loads((root/'src/game/furniture/references/couch.json').read_text())
shades=['#656238','#77763e','#898a4a','#9da05c','#b1b771','#c6cd8a','#f7dda3','#504d2a'];shade_ids={tuple(bytes.fromhex(color[1:])):i+1 for i,color in enumerate(shades)}
layers={key:base64.b64decode(value) for key,value in ref['layers'].items()}
views={};board=Image.new('RGBA',(256,80),'#fff5e7');draw=ImageDraw.Draw(board)
for col,(rotation,files) in enumerate(sofa['styles'][0]['views'].items()):
 path=root/'public'/files['file'].lstrip('/');im=Image.open(path).convert('RGBA');pixels=list(im.get_flattened_data());protected=set();pillow_spans=[]
 if rotation=='0':
  protected={i for i in range(4096) if any(layers[k][i] for k in ['feet','pillowLeft','pillowRight'])}
 else:
  # Authored profile pillow bounds; scan warm fabric edges to retain any green
  # ornament inside the pillow, even when it shares an upholstery RGB value.
  roi={'90':(22,22,38,35),'270':(23,23,41,35)}.get(rotation)
  if roi:
   for y in range(roi[1],roi[3]):
    xs=[x for x in range(roi[0],roi[2]) if (lambda p:p[3]>0 and p[0]>210 and p[0]>p[1]+8 and p[2]>140)(im.getpixel((x,y)))]
    if xs:
     left,right=min(xs),max(xs);pillow_spans.append([y,left,right]);protected.update(y*64+x for x in range(left,right+1))
 if rotation!='0':protected.update(i for i in range(4096) if i//64>=55)
 mask=[]
 for i,pixel in enumerate(pixels):
  cloth=rotation!='0' or any(layers[k][i] for k in ['backLeft','backRight','seatLeft','seatRight','leftArm','rightArm','apron'])
  mask.append(shade_ids.get(pixel[:3],0) if pixel[3] and cloth and i not in protected else 0)
 runs=[]
 for value in mask:
  if runs and runs[-1][1]==value:runs[-1][0]+=1
  else:runs.append([1,value])
 views[rotation]={'file':files['file'],'foreground':files['frontFile'],'width':64,'height':64,'sourceSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'foregroundSha256':hashlib.sha256((root/'public'/files['frontFile'].lstrip('/')).read_bytes()).hexdigest(),'runs':runs,'protectedPillowSpans':pillow_spans,'upholsteryPixels':sum(bool(i) for i in mask)}
 overlay=im.copy()
 for i,value in enumerate(mask):
  if value:overlay.putpixel((i%64,i//64),(192,46,137,255))
 board.alpha_composite(overlay,(col*64,14));draw.text((col*64+3,2),rotation,fill='#33251c')
payload={'version':1,'assetId':'sofa','defaultColor':'#898a4a','shades':shades,'protected':'Wood, pillows, floral motifs, alpha and brown contour/seam colors stay exact. Front uses original semantic component masks; profiles preserve bounded pillow interiors.','views':views}
payload['revision']=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()[:12]
folder=root/'src/game/furniture/palettes';folder.mkdir(parents=True,exist_ok=True);(folder/'sofa.json').write_text(json.dumps(payload,separators=(',',':'))+'\n')
author=root/'assets/furniture-studio/sprites/sofa';board.resize((1024,320),Image.Resampling.NEAREST).save(author/'upholstery-mask-review.png')
print('Palette mask',payload['revision'], {r:v['upholsteryPixels'] for r,v in views.items()})
