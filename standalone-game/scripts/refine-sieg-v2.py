"""Scoped adult illustration, readable framing and calm presentation exports."""
from pathlib import Path
from PIL import Image
import json, shutil, hashlib

root=Path(__file__).resolve().parents[1];job=root/'assets/actor-appearances/sieg-stormwarden-v1'
source=job/'illustration-adult-v2-generated.png'
if not source.exists():shutil.copyfile('/home/micxsz/.codex/generated_images/01a19a5c-6747-7123-9ce4-c6c0d6649969/exec-fd29cc4f-82d4-45bb-9026-e2ccb216daea.png',source)

# Content bounds describe actual whole drawings, not a full blank cell.
catalog=root/'src/game/actor-rig/photo-portrait-catalog.json';entries=json.loads(catalog.read_text());entry=next(e for e in entries if e['id']=='sieg-refined-cel')
old=root/'public'/entry['folder'].lstrip('/');m=json.loads((old/'portrait.json').read_text());atlas=Image.open(old/'portrait.webp').convert('RGBA')
mask=Image.new('L',(96,120))
from PIL import ImageChops
for x,y,w,h in m['frames']:mask=ImageChops.lighter(mask,atlas.crop((x,y,x+w,y+h)).getchannel('A'))
x0,y0,x1,y1=mask.getbbox();bounds=[x0,y0,x1-x0,y1-y0]
# The renderer allows transparent margins outside this tight visible rectangle.
m['contentBounds']=bounds;m['reviewStatus']='visual-review-in-progress'
payload=json.dumps(m,separators=(',',':'))+'\n';revision=hashlib.sha256(payload.encode()+(old/'portrait.webp').read_bytes()).hexdigest()[:12]
folder=f'/pawtrail-game/game-assets/dialogue-portraits/sieg-refined-cel-v2/{revision}'
dest=root/'public'/folder.lstrip('/')
if old.resolve()!=dest.resolve():shutil.copytree(old,dest,dirs_exist_ok=True)
(dest/'portrait.json').write_text(payload)
entry.update(folder=folder,revision=revision,contentBounds=bounds,completeBytes=sum(f.stat().st_size for f in dest.rglob('*') if f.is_file()))
if entry['completeBytes']>300000:raise ValueError('Portrait budget exceeded')
catalog.write_text(json.dumps(entries,indent=2)+'\n')
portrait=Image.open(job/'native/front-pout-neutral-rest.png').convert('RGBA')
icon=portrait.crop((15,13,82,80)).resize((40,40),Image.Resampling.NEAREST)
icon_dir=root/'public/pawtrail-game/actor-studio/icons/sieg/v2';icon_dir.mkdir(parents=True,exist_ok=True);icon.save(icon_dir/'icon.png',optimize=True)

out=root/'public/pawtrail-game/actor-studio/illustrations/sieg/v2';out.mkdir(parents=True,exist_ok=True)
src=Image.open(source).convert('RGBA');cells=[];feet=[];bounds=[]
for i in range(6):
 c=src.crop((i%3*src.width//3,i//3*src.height//2,(i%3+1)*src.width//3,(i//3+1)*src.height//2))
 c.putalpha(c.getchannel('A').point(lambda a:255 if a>=230 else 0));box=c.getbbox();bounds.append(box)
 # Register the feet, not the changing cape silhouette's bounding-box center.
 band=c.getchannel('A').crop((0,box[3]-16,c.width,box[3]));xs=[x for y in range(band.height) for x in range(band.width) if band.getpixel((x,y))]
 feet.append(sum(xs)/len(xs));cells.append(c)
left=max(cx-box[0] for cx,box in zip(feet,bounds));right=max(box[2]-cx for cx,box in zip(feet,bounds))
scale=min(174/(left+right),306/max(box[3]-box[1] for box in bounds));anchor=9+left*scale
frames=[];sprites=[];sheet=Image.new('RGBA',(192*3,320*2))
for i,(c,cx,box) in enumerate(zip(cells,feet,bounds)):
 xoff=anchor-cx*scale;yoff=315-box[3]*scale
 fitted=c.transform((192,320),Image.Transform.AFFINE,(1/scale,0,-xoff/scale,0,1/scale,-yoff/scale),Image.Resampling.NEAREST)
 sprites.append(fitted);sheet.paste(fitted,(i%3*192,i//3*320));frames.append({'id':i,'rect':[i%3*192,i//3*320,192,320]})
sheet=sheet.quantize(colors=128,method=Image.Quantize.FASTOCTREE).convert('RGBA');sheet.save(out/'actor.webp',lossless=True,method=6)
previous=root/'public/pawtrail-game/actor-studio/illustrations/sieg/v1'
for name in ['background.webp','aura.webp']:shutil.copyfile(previous/name,out/name)
manifest=json.loads((previous/'illustration.json').read_text());manifest.update(frames=frames,sequence=[0,1,2,3,4,5],durationMs=[1050,750,800,800,750,1050],backdrop='#303940')
for layer in manifest['layers']:
 if layer['id']=='actor':layer.update(frames=frames,sequence=manifest['sequence'],durationMs=manifest['durationMs'])
 else:layer['opacity']=.28 if layer['id']=='background' else .38
(out/'illustration.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
poster=Image.new('RGBA',(256,320),'#303940')
for name,alpha in [('background',.28),('aura',.38)]:
 layer=Image.open(out/f'{name}.webp').convert('RGBA').crop((0,0,256,320));layer.putalpha(layer.getchannel('A').point(lambda a:round(a*alpha)));poster.alpha_composite(layer)
poster.alpha_composite(sprites[0],(32,0));poster.save(out/'poster.webp',lossless=True,method=6)
sprites[0].save(out/'actor-poster.webp',lossless=True,method=6)
poster.save(job/'adult-illustration-review.png')
report={'version':2,'portraitBytes':entry['completeBytes'],'contentBounds':entry['contentBounds'],'iconBytes':(icon_dir/'icon.png').stat().st_size,'illustrationBytes':sum(f.stat().st_size for f in out.iterdir() if f.is_file()),'registration':'Fixed foot pivot and baseline across all six whole frames','voice':'omitted-by-owner'}
# Broader, restrained hair clusters replace the old repeated fine stripes.
surfaces=root/'public/pawtrail-game/actor-studio/sieg/v2';surfaces.mkdir(parents=True,exist_ok=True)
for original in (root/'public/pawtrail-game/actor-studio/sieg/v1').glob('*.png'):shutil.copyfile(original,surfaces/original.name)
from PIL import ImageDraw
for surface,colors in {'hair':['#302d37','#222330','#48424f','#66545a'],'copper':['#ad5837','#713e30','#c77c4c','#d99861']}.items():
 im=Image.new('RGBA',(64,96),colors[0]);d=ImageDraw.Draw(im)
 d.polygon([(0,0),(9,0),(13,22),(8,48),(14,72),(10,95),(0,95)],fill=colors[1])
 d.polygon([(18,7),(30,5),(34,19),(27,37),(29,55),(23,79),(17,81),(21,54),(18,35),(23,18)],fill=colors[2])
 d.polygon([(21,10),(29,8),(30,15),(23,24),(21,22)],fill=colors[3])
 d.polygon([(45,0),(52,0),(47,28),(54,51),(48,77),(53,95),(44,95),(40,72),(45,49),(40,25)],fill=colors[1])
 d.rectangle((0,92,63,95),fill=colors[1]);im.save(surfaces/(surface+'.png'),optimize=True)
profile=json.loads((job/'profile.json').read_text());profile['presentation']={'revision':2,'illustration':'Adult fantasy proportions with a restrained head/eye size and longer torso/legs, in Refined cel pixel style','model':'Existing stylized world scale and shared action rig; short swept layered hair and front/back cape drape','background':'Subdued neutral preview stage; separate context and aura layers at reduced opacity'}
(surfaces/'profile.json').write_text(json.dumps(profile,indent=2)+'\n')
report['modelTextureBytes']=sum(f.stat().st_size for f in surfaces.glob('*.png'))
report['totalRuntimeBytes']=report['portraitBytes']+report['iconBytes']+report['illustrationBytes']+report['modelTextureBytes']
(job/'v2-export-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
