"""Sieg's scoped production pass. Keep originals; export complete pixel frames."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, shutil, subprocess, hashlib

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/sieg-stormwarden-v1'
GENERATED = Path('/home/micxsz/.codex/generated_images/01a19a5c-6747-7123-9ce4-c6c0d6649969')
for name, filename in {
    'illustration-loop-clean-generated.png':'exec-2950899c-d03f-469d-be88-501b29f8b5f0.png',
    'background-loop-generated.png':'exec-3f3c9726-5758-4c14-9e1f-f74a732247fd.png',
    'aura-loop-generated.png':'exec-93366076-0493-4ca0-ae0b-9b2275a34585.png',
}.items():
    if not (JOB / name).exists(): shutil.copyfile(GENERATED / filename, JOB / name)
poses = ['front-pout','three-quarter-left','head-tilt-smile-right']
emotions = ['neutral','smile','happy','sad','angry','surprised']
# One shared 63-color palette, measured from all three authored source sheets.
sample = Image.new('RGB',(384,360),'#1d2431')
for i in range(3):
    im=Image.open(JOB/f'pose-{i}-complete-generated.png').convert('RGBA')
    im.thumbnail((128,360),Image.Resampling.NEAREST)
    sample.paste(im,(i*128,0),im)
quantized=sample.quantize(colors=63,method=Image.Quantize.MEDIANCUT)
palette=quantized.getpalette()[:63*3]
colors=['#'+''.join(f'{v:02x}' for v in palette[n:n+3]) for n in range(0,len(palette),3)]
config={'nativeCell':[96,120],'palette':colors,'poses':poses,'nativeMargin':[6,8]}
(JOB/'source.json').write_text(json.dumps(config,indent=2)+'\n')
if not (JOB/'native/head-tilt-smile-right-surprised-open.png').exists():
    subprocess.run([__import__('sys').executable,str(ROOT/'scripts/import-portrait-frames.py'),str(JOB/'source.json')],check=True)
performance={'nativeCell':[96,120],'contentBounds':[0,0,96,120],'poses':{}}
for pose in poses:
    expressions={}
    for i,emotion in enumerate(emotions):
        expressions[emotion]={
            'eyesClosedAtRest':emotion=='happy',
            'breathing':{'periodMs':4600+i*80,'torsoStartY':91,'anchorRows':2},
            'blinkPerformance':{'sequence':[0,1,0],'durationsMs':[85,110,85],'idleDelayMs':[3100+i*50,4600+i*60]},
            'speechPerformance':{'sequence':[0,1,2,1,0,1,2,0],'durationsMs':[180,150,150,130,230,150,170,200]},
        }
    performance['poses'][pose]={'expressions':expressions}
(JOB/'performance.json').write_text(json.dumps(performance,indent=2)+'\n')
# Intermediate indexed data is replaced by portable WebP below; publication
# enforces the actual 300 KB cap, including references and metadata.
pack={'id':'sieg-refined-cel','name':'Refined cel','source':str(JOB),'performanceFile':str(JOB/'performance.json'),'postersOnly':True,'budgetBytes':1000000}
(JOB/'pack.json').write_text(json.dumps(pack,indent=2)+'\n')
subprocess.run([__import__('sys').executable,str(ROOT/'scripts/prepare-portrait-frames.py'),str(JOB/'pack.json')],check=True)
# Portable whole-frame WebP atlas, including the pre-exported torso breaths.
runtime=JOB/'runtime/sieg-refined-cel'
m=json.loads((runtime/'portrait.json').read_text())
pd=m.pop('pixelData')
raw=subprocess.run(['node','--input-type=module','-e',"import z from 'node:zlib';import fs from 'node:fs';process.stdout.write(z.brotliDecompressSync(fs.readFileSync(process.argv[1])))",str(runtime/'portrait.frames.br')],capture_output=True,check=True).stdout
atlas=Image.new('RGBA',(96*10,120*((pd['frameCount']+9)//10)))
m['frames']=[]
for i in range(pd['frameCount']):
    tile=Image.frombytes('P',(96,120),raw[i*96*120:(i+1)*96*120])
    tile.putpalette([c for rgb in pd['palette'] for c in rgb]+[0]*(768-3*len(pd['palette'])))
    tile.info['transparency']=0
    x,y=i%10*96,i//10*120;atlas.paste(tile.convert('RGBA'),(x,y))
    m['frames'].append([x,y,96,120])
atlas=atlas.quantize(colors=48,method=Image.Quantize.FASTOCTREE).convert('RGBA')
atlas.save(runtime/'portrait.webp',lossless=True,method=6)
for pose in poses:
    frame=m['poses'][pose]['expressions']['neutral']['states']['rest'][0]
    x,y,w,h=m['frames'][frame]
    atlas.crop((x,y,x+w,y+h)).save(runtime/f'reference/{pose}-neutral.png',optimize=True)
(runtime/'portrait.frames.br').unlink()
m.update(atlas='portrait.webp',encoding='lossless-webp-complete-frames',reviewStatus='asset-inspected-runtime-pending')
(runtime/'portrait.json').write_text(json.dumps(m,separators=(',',':'))+'\n')
revision=hashlib.sha256((runtime/'portrait.webp').read_bytes()+(runtime/'portrait.json').read_bytes()).hexdigest()[:12]
folder=f'/pawtrail-game/game-assets/dialogue-portraits/sieg-refined-cel-v1/{revision}'
dest=ROOT/'public'/folder.lstrip('/');shutil.copytree(runtime,dest,dirs_exist_ok=True)
size=sum(f.stat().st_size for f in dest.rglob('*') if f.is_file())
if size>300000: raise ValueError(f'Sieg portrait cap exceeded: {size}')
catalog=ROOT/'src/game/actor-rig/photo-portrait-catalog.json'
entries=[e for e in json.loads(catalog.read_text()) if e['id']!='sieg-refined-cel']
entries.append({'id':'sieg-refined-cel','name':'Refined cel','styleKey':'refined-cel','characterId':'sieg','characterName':'Sieg','playback':'complete-frames','nativeCell':[96,120],'contentBounds':[0,0,96,120],'folder':folder,'revision':revision,'poseIds':poses,'emotionIds':['idle','smile','happy','sad','angry','surprised'],'budgetBytes':300000,'completeBytes':size,'poseCount':3,'expressionCount':6,'encoding':m['encoding']})
catalog.write_text(json.dumps(entries,indent=2)+'\n')

# Icon is a coarse crop of Sieg's actual new artwork. Frame/active glow is shared.
still=Image.open(JOB/'native/front-pout-neutral-rest.png').convert('RGBA')
icon=still.crop((13,0,83,70)).resize((40,40),Image.Resampling.NEAREST)
icon_dir=ROOT/'public/pawtrail-game/actor-studio/icons/sieg/v1';icon_dir.mkdir(parents=True,exist_ok=True)
icon.save(icon_dir/'icon.png',optimize=True)

def clean(im):
    im=im.convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:255 if a>=230 else 0));return im
def export_layer(filename,cols,rows,native,kind):
    src=Image.open(JOB/filename).convert('RGBA');cells=[]
    for n in range(cols*rows):
        cell=src.crop((round(n%cols*src.width/cols),round(n//cols*src.height/rows),round((n%cols+1)*src.width/cols),round((n//cols+1)*src.height/rows)))
        if kind=='actor':
            cell=clean(cell);cells.append(cell.crop(cell.getbbox()))
        else:cells.append(clean(cell) if kind=='aura' else cell)
    if kind=='actor':
        scale=min((native[0]-18)/max(c.width for c in cells),(native[1]-12)/max(c.height for c in cells))
        fitted=[]
        for c in cells:
            c=c.resize((round(c.width*scale),round(c.height*scale)),Image.Resampling.NEAREST)
            out=Image.new('RGBA',native);out.paste(c,((native[0]-c.width)//2,native[1]-5-c.height));fitted.append(out)
        cells=fitted
    else:cells=[c.resize(native,Image.Resampling.NEAREST) for c in cells]
    # Palette reduction preserves hard alpha and deliberate clusters.
    atlas=Image.new('RGBA',(native[0]*cols,native[1]*rows))
    for i,c in enumerate(cells):atlas.paste(c,(i%cols*native[0],i//cols*native[1]))
    atlas=atlas.quantize(colors=128,method=Image.Quantize.FASTOCTREE).convert('RGBA')
    target=illustration_dir/f'{kind}.webp';atlas.save(target,lossless=True,method=6)
    return cells,{'id':kind,'atlas':target.name,'nativeSize':list(native),'frames':[{'id':i,'rect':[i%cols*native[0],i//cols*native[1],*native]} for i in range(len(cells))],'sequence':list(range(len(cells)))+list(range(len(cells)-2,0,-1)),'durationMs':[480]*(len(cells)*2-2)}
illustration_dir=ROOT/'public/pawtrail-game/actor-studio/illustrations/sieg/v1';illustration_dir.mkdir(parents=True,exist_ok=True)
body,actor=export_layer('illustration-loop-clean-generated.png',3,2,(192,320),'actor')
bg,background=export_layer('background-loop-generated.png',2,2,(256,320),'background')
aura,wind=export_layer('aura-loop-generated.png',3,2,(256,320),'aura')
manifest={**actor,'style':'Refined cel','compositionSize':[256,320],'layers':[dict(background,offset=[0,0]),dict(wind,offset=[0,0]),dict(actor,offset=[32,0])]}
(illustration_dir/'illustration.json').write_text(json.dumps(manifest,separators=(',',':'))+'\n')
poster=bg[0].copy();poster.alpha_composite(aura[0]);poster.alpha_composite(body[0],(32,0));poster.save(illustration_dir/'poster.webp',lossless=True,method=6)
body[0].save(illustration_dir/'actor-poster.webp',lossless=True,method=6)

# Review material: all expression rests and representative illustration composition.
review=Image.new('RGBA',(96*6,120*3),'#d7d2c4')
for p,pose in enumerate(poses):
    for e,emotion in enumerate(emotions):review.alpha_composite(Image.open(JOB/f'native/{pose}-{emotion}-rest.png').convert('RGBA'),(96*e,120*p))
review.save(JOB/'portrait-review.png')
poster.save(JOB/'illustration-review.png')
(JOB/'export-report.json').write_text(json.dumps({'portraitBytes':size,'portraitFolder':folder,'iconBytes':(icon_dir/'icon.png').stat().st_size,'illustrationBytes':sum(f.stat().st_size for f in illustration_dir.iterdir() if f.is_file()),'nativePortraitFrames':pd['frameCount'],'voice':'omitted-by-owner','runtimeReview':'pending'},indent=2)+'\n')
print((JOB/'export-report.json').read_text())
