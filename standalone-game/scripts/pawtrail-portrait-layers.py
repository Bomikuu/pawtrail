#!/usr/bin/env python3
"""Production export: native drawn expression patches; lossless existing base art.
No app/browser execution. Run from the standalone PawTrail game workspace.
"""
from pathlib import Path
from PIL import Image, ImageDraw
from collections import Counter
import json, math

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
ART = PUBLIC / 'pawtrail-game/game-assets/dialogue-portraits'
OUT = ART / 'layered-v1'
EVIDENCE = ROOT / 'assets/portrait-2d/evidence'
OUT.mkdir(parents=True, exist_ok=True)
EVIDENCE.mkdir(parents=True, exist_ok=True)
# Native coordinates, individually aligned to the existing illustration.
# Eye rectangles exclude brows, hair and spectacle rims; mouth excludes noses.
SPECS = {
 'maya': dict(eyes=[(32,36,40,43),(48,33,56,40)], mouth=(40,46,54,52), cut=64),
 'lina': dict(eyes=[(31,42,38,47),(47,38,55,44)], mouth=(39,51,51,57), cut=65),
 'jo': dict(eyes=[(28,34,32,39),(41,31,49,37)], mouth=(37,48,49,53), cut=59),
 'glasses-rescuer': dict(eyes=[(33,42,39,48),(50,38,57,45)], mouth=(42,54,53,59), cut=69),
 'blonde-rescuer': dict(eyes=[(33,42,39,48),(50,38,57,45)], mouth=(42,54,53,59), cut=69),
 'red-rescuer': dict(eyes=[(33,42,39,48),(50,38,57,45)], mouth=(42,54,53,59), cut=69),
 'violet-rescuer': dict(eyes=[(33,42,39,48),(50,38,57,45)], mouth=(42,54,53,59), cut=69),
 'male-red-gardener': dict(eyes=[(27,40,31,45),(41,36,50,42)], mouth=(32,50,44,56), cut=63),
 'male-blonde-scout': dict(eyes=[(31,43,38,47),(48,40,56,45)], mouth=(41,54,53,59), cut=64),
 'male-violet-volunteer': dict(eyes=[(33,41,38,46),(50,38,58,44)], mouth=(41,52,50,57), cut=65),
 'trail-rescuer': dict(file='illustrated-v2/trail-rescuer.png', eyes=[(53,48,60,55),(74,43,82,51)], mouth=(62,60,76,66), cut=91),
}
SKIN = lambda c: c[3] > 240 and c[0] > c[1]*1.13 and c[1] > c[2]*1.13 and c[0] > 130 and c[1] > 65
INK = (68,38,40,255)

def clean_region(base, box, rounded=True, feline=False):
    """Paint an irregular skin plate from nearby native skin clusters, not a fill box."""
    x0,y0,x1,y1 = box; result=base.copy(); pixels=base.load()
    neighbors=[]
    for y in range(max(0,y0-3),min(base.height,y1+4)):
        for x in range(max(0,x0-4),min(base.width,x1+5)):
            if not (x0<=x<x1 and y0<=y<y1) and (SKIN(pixels[x,y]) if not feline else pixels[x,y][3]>240): neighbors.append((x,y,pixels[x,y]))
    if not neighbors: return result
    palette=list({c for _,_,c in neighbors})
    for y in range(y0,y1):
        for x in range(x0,x1):
            # Keep the rounded patch edge and existing skin/texture at its perimeter.
            nx=(x-(x0+x1-1)/2)/max(1,(x1-x0)/2);ny=(y-(y0+y1-1)/2)/max(1,(y1-y0)/2)
            if rounded and nx*nx+ny*ny>1.12: continue
            near=sorted(neighbors,key=lambda p:(p[0]-x)**2+(p[1]-y)**2)[:8]
            weights=[1/(1+(xx-x)**2+(yy-y)**2) for xx,yy,_ in near]
            color=[sum(p[2][c]*w for p,w in zip(near,weights))/sum(weights) for c in range(3)]
            chosen=min(palette,key=lambda c:sum((c[i]-color[i])**2 for i in range(3)))
            result.putpixel((x,y),chosen)
    return result

def eyes(base,spec,state):
    result=base.copy()
    for box in spec['eyes']:
        x0,y0,x1,y1=box;w=x1-x0;h=y1-y0
        plate=clean_region(base,box,rounded=False,feline=spec.get('feline',False))
        result.paste(plate.crop(box),(x0,y0))
        d=ImageDraw.Draw(result);mid=y0+max(1,round(h*.55));points=[]
        if state=='half':
            # Preserve the lower authored iris, then draw the lowered upper lid.
            lower=y0+max(1,h//2)
            result.paste(base.crop((x0,lower,x1,y1)),(x0,lower))
            points=[(x0,lower),(x0+w//2,lower-1),(x1-1,lower)]
        else:
            bend=-1 if state=='happy' else 1
            points=[(x0,mid),(x0+max(1,w//3),mid+bend),(x1-max(2,w//3),mid+bend),(x1-1,mid)]
        # Native source contours and warm lower-lid shade; no new raster smoothing.
        d.line([(x,y+1) for x,y in points],fill=(196,131,88,255),width=1)
        d.line(points,fill=INK,width=1)
    return result

def mouth(base,spec,state):
    box=spec['mouth'];x0,y0,x1,y1=box;w=x1-x0;h=y1-y0
    result=clean_region(base,box,feline=spec.get('feline',False));d=ImageDraw.Draw(result)
    cx=round((x0+x1-1)/2);cy=y0+h//2
    lip=(183,105,84,255);tongue=(230,134,103,255);teeth=(250,232,206,255)
    if state=='smile':
        d.line([(x0+2,cy-1),(cx-2,cy+1),(cx+2,cy+1),(x1-2,cy-2)],fill=lip)
        d.point((x1-2,cy-1),fill=INK)
    elif state=='talk-a':
        d.polygon([(cx-2,cy-1),(cx+2,cy-1),(cx+3,cy),(cx+1,cy+2),(cx-1,cy+2),(cx-3,cy)],fill=INK)
        d.line((cx-1,cy+1,cx+1,cy+1),fill=tongue)
    elif state=='talk-o':
        d.polygon([(cx-1,cy-2),(cx+1,cy-2),(cx+2,cy-1),(cx+2,cy+1),(cx+1,cy+2),(cx-1,cy+2),(cx-2,cy+1),(cx-2,cy-1)],fill=INK)
        d.point((cx,cy+1),fill=tongue)
    else: # happy / wider speaking vowel
        d.polygon([(x0+2,cy-1),(x1-2,cy-2),(x1-3,cy+1),(cx+1,cy+2),(cx-2,cy+2),(x0+3,cy+1)],fill=INK)
        d.line((x0+3,cy-1,x1-3,cy-1),fill=teeth)
        d.line((cx-1,cy+1,cx+1,cy+1),fill=tongue)
    return result

def mask_for(base,spec):
    mask=Image.new('RGBA',base.size);pix=base.load();dst=mask.load()
    # Conservative semantic masks; dark contours and bright glints stay original.
    for y in range(base.height):
        for x in range(base.width):
            r,g,b,a=pix[x,y];value=max(r,g,b)
            if a<250 or value<64 or min(r,g,b)>230:continue
            role=0
            if SKIN((r,g,b,a)):
                # Warm hair is separated from skin by brightness and crown region.
                role=2 if (r>180 and y>18) else (1 if y<spec['cut'] else 0)
            elif y<spec['cut'] and (r>g*1.09 or b>g*1.12):role=1
            elif y>=spec['cut']:
                role=3 if max(r,g,b)-min(r,g,b)>23 else 4
            if role:dst[x,y]=(role,0,0,255)
    for index,(x0,y0,x1,y1) in enumerate(spec['eyes']):
        cx=(x0+x1)//2;cy=(y0+y1)//2
        for y in range(cy,cy+2):
            for x in range(cx-1,cx+1):
                r,g,b,a=pix[x,y]
                if a>240 and max(r,g,b)<200:dst[x,y]=(5+index,0,0,255)
    return mask

def export(id,spec):
    source=ART/spec.get('file',id+'.png');base=Image.open(source).convert('RGBA')
    eye_box=(min(b[0] for b in spec['eyes']),min(b[1] for b in spec['eyes']),max(b[2] for b in spec['eyes']),max(b[3] for b in spec['eyes']))
    boxes={'eyes':eye_box,'mouth':spec['mouth']};patches=[]
    for state in ['half','closed','happy']:patches.append(('eyes',state,eyes(base,spec,state)))
    for state in ['smile','talk-a','talk-o','happy']:patches.append(('mouth',state,mouth(base,spec,state)))
    width=max(b[2]-b[0] for b in boxes.values());height=max(b[3]-b[1] for b in boxes.values())
    atlas=Image.new('RGBA',(width*len(patches),height));layers={'eyes':{},'mouth':{}}
    for i,(group,state,frame) in enumerate(patches):
        box=boxes[group];w=box[2]-box[0];h=box[3]-box[1]
        atlas.paste(frame.crop(box),(i*width,0))
        layers[group][state]={'source':[i*width,0,w,h],'target':[box[0],box[1],w,h]}
    atlas_path=OUT/(id+'-expressions.png');atlas.save(atlas_path,optimize=True)
    mask=mask_for(base,spec);mask_path=OUT/(id+'-mask.png');mask.save(mask_path,optimize=True)
    doc={'version':1,'id':id,'base':'/'+source.relative_to(PUBLIC).as_posix(),'atlas':'/'+atlas_path.relative_to(PUBLIC).as_posix(),'mask':'/'+mask_path.relative_to(PUBLIC).as_posix(),'size':list(base.size),'layers':layers,'eyeCenters':[[round((b[0]+b[2])/2),round((b[1]+b[3])/2)] for b in spec['eyes']],'sourcePreserved':True,'animation':'native drawn patches; independent eyes and mouth','kind':'cat' if spec.get('feline') else 'actor','budgetBytes':250000}
    path=OUT/(id+'.json');path.write_text(json.dumps(doc,separators=(',',':'))+'\n')
    total=sum(p.stat().st_size for p in [source,atlas_path,mask_path,path])
    # The exporter refuses over-budget deliverables; no app/test runner involved.
    if total>=250000:raise ValueError(f'{id}: portrait exceeds 250,000-byte production budget')
    return base,doc,dict(id=id,bytes=total,baseBytes=source.stat().st_size,atlasBytes=atlas_path.stat().st_size,maskBytes=mask_path.stat().st_size,manifestBytes=path.stat().st_size)

# Cat portraits reuse the owner's existing transparent coat illustrations.
for coat in ['orange','black','white','gray','cream','brown']:
    filename='cat-placeholder-v1.webp' if coat=='orange' else f'cat-{coat}-placeholder-v2.webp'
    original=PUBLIC/'pawtrail-game/discovery'/filename
    base=Image.open(original).convert('RGBA').resize((96,96),Image.Resampling.NEAREST)
    (OUT/f'cat-{coat}-base.png').parent.mkdir(parents=True,exist_ok=True)
    base.save(OUT/f'cat-{coat}-base.png',optimize=True)
    SPECS[f'cat-{coat}']=dict(file=f'layered-v1/cat-{coat}-base.png',eyes=[(31,41,40,50),(57,41,66,50)],mouth=(41,51,56,59),cut=73,feline=True)

reports=[]
for id,spec in SPECS.items():
    spec['eyes']=[(x0-1,y0-1,x1+1,y1+1) for x0,y0,x1,y1 in spec['eyes']]
    base,doc,report=export(id,spec);reports.append(report)
    # Native contact sheet / animation are artwork deliverables, not app screenshots.
    if id in ['maya','trail-rescuer','cat-orange','cat-black']:
        examples=[base,eyes(base,spec,'half'),eyes(base,spec,'closed'),mouth(base,spec,'talk-a'),mouth(base,spec,'talk-o'),mouth(eyes(base,spec,'happy'),spec,'happy')]
        scale=3;w,h=base.size
        sheet=Image.new('RGBA',(w*3,h*2),(232,223,203,255))
        for i,frame in enumerate(examples):sheet.alpha_composite(frame,((i%3)*w,(i//3)*h))
        sheet.resize((sheet.width*scale,sheet.height*scale),Image.Resampling.NEAREST).save(EVIDENCE/(id+'-expressions.png'))
        frames=[]
        for i in range(96):
            frame=base.copy()
            if i in [26,29,68,71]:frame=eyes(frame,spec,'half')
            if i in [27,28,69,70]:frame=eyes(frame,spec,'closed')
            if 36<=i<60:frame=mouth(frame,spec,['talk-a','smile','talk-o','happy'][((i-36)//2)%4])
            bg=Image.new('RGBA',base.size,(232,223,203,255));bg.alpha_composite(frame)
            frames.append(bg.resize((w*3,h*3),Image.Resampling.NEAREST).convert('RGB'))
        frames[0].save(EVIDENCE/(id+'-blink-talk.gif'),save_all=True,append_images=frames[1:],duration=83,loop=0)
report_text=json.dumps({'budgetBytes':250000,'scope':'base + expression atlas + optional color mask + individual manifest; shared JS excluded','portraits':reports},indent=2)+'\n'
(OUT/'sizes.json').write_text(report_text)
(ROOT/'src/game/actor-rig/portrait-sizes.json').write_text(report_text)
print(json.dumps(reports,indent=2))
