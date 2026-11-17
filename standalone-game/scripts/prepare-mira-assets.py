"""Mira's scoped production recipe; shared image helpers and encoding settings.

Offline authored eye drawings and pinned loose-hair parts become complete native
frames. Playback does not paint faces. This is an asset exporter, not an app test.
"""
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
import argparse, importlib.util, json, math, shutil

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/mira-adler-v1'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio'
SIZE = (320, 448)
CYCLE = 4200
FRAME_COUNT = 60
REVISION = 'v2'
BLINKS = {
    'normal': {'half': [36,39], 'closed': [37,38]},
    'enraged': {'half': [43,46], 'closed': [44,45]},
}

def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'scripts' / file)
    value = importlib.util.module_from_spec(spec); spec.loader.exec_module(value)
    return value

paint = module('mira_painted', 'prepare-sieghart-blend.py')
portrait = module('mira_portraits', 'prepare-sieghart-revision.py')

def record(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + '\n')

# Loose outside locks only: exclude planted legs, arms, face and weapon grip.
PARTS = {
    'normal': [
        ('left-curls', [(0,845),(285,845),(340,925),(338,1080),(304,1240),(0,1240)], 845, 1200, 7.0, .3),
        ('right-curls', [(660,860),(1024,830),(1024,1240),(650,1240),(650,1040)], 840, 1200, 7.8, -1.1),
        ('outer-lock', [(80,533),(312,478),(304,575),(225,621),(178,620),(90,650)], 475, 650, 3.6, .9),
    ],
    'enraged': [
        ('left-curls', [(0,740),(250,760),(292,852),(280,1130),(0,1130)], 740, 1090, 8.0, .3),
        ('right-curls', [(815,790),(1024,740),(1024,1140),(745,1140),(745,950)], 740, 1100, 8.8, -1.1),
        ('upper-lock', [(0,430),(290,415),(295,465),(210,525),(80,535),(0,585)], 410, 585, 4.0, .9),
    ],
}
# Each eye is registered to this actor/variant. No common eyelid/mouth stencil.
EYES = {
    'normal': {
        'target': [(452,249,496,280),(519,262,561,290)],
        'half': [(299,334,352,372),(386,348,430,383)],
        'closed': [(849,335,902,373),(932,348,976,383)],
    },
    'enraged': {
        'target': [(459,280,506,310),(533,284,576,315)],
        'half': [(290,989,352,1031),(383,999,432,1041)],
        'closed': [(840,993,902,1035),(926,1002,975,1044)],
    },
}

def track(name, size, count, cols, times, opacity=1, offset=(0,0)):
    return {'id':name,'atlas':name+'.webp','nativeSize':list(size),
            'frames':[{'id':i,'rect':[i%cols*size[0],i//cols*size[1],*size]} for i in range(count)],
            'sequence':list(range(count)),'durationMs':times,'offset':list(offset),'opacity':opacity}

def detach_energy(image):
    """Separate the authored violet arcs; restore only their small hair overlap.

    This local VFX cleanup never selects eyes, brows, skin or mouth pixels.
    Pixels under the tiny arc use neighboring original hair, not another face.
    """
    original=image.copy();energy=Image.new('RGBA',image.size);selected=set()
    for left,top,right,bottom in [(290,190,445,293),(599,260,692,360)]:
        for y in range(top,bottom):
            for x in range(left,right):
                r,g,b,a=original.getpixel((x,y))
                if a and b>170 and r>120 and b>r*.98 and b>g*1.4:
                    selected.add((x,y));energy.putpixel((x,y),(r,g,b,a))
    for x,y in selected:
        neighbors=[];opaque=0
        for dx,dy in [(-4,0),(4,0),(0,-4),(0,4),(-3,-3),(3,3),(-3,3),(3,-3)]:
            px,py=x+dx,y+dy
            r,g,b,a=original.getpixel((px,py))
            if a:opaque+=1
            if a and (px,py) not in selected:neighbors.append((r,g,b,a))
        if opaque>=6 and neighbors:
            image.putpixel((x,y),tuple(sorted(c[i] for c in neighbors)[len(neighbors)//2] for i in range(4)))
        else:image.putpixel((x,y),(0,0,0,0))
    return energy

def illustrations():
    background = Image.open(ROOT/'assets/actor-appearances/aurelia-weiss-v1/background-generated.png').convert('RGBA')
    glyph = Image.open(ROOT/'public/pawtrail-game/actor-studio/aurelia-weiss/v1/sigil.png').convert('RGBA')
    blink = paint.clean(Image.open(JOB/'blink-generated.png'))
    reports=[]
    for variant in ['normal','enraged']:
        source=paint.clean(Image.open(JOB/f'{variant}-generated.png'))
        box=source.getbbox();scale=min((SIZE[0]-28)/(box[2]-box[0]),(SIZE[1]-24)/(box[3]-box[1]))
        tx=(SIZE[0]-(box[2]-box[0])*scale)/2-box[0]*scale;ty=SIZE[1]-12-box[3]*scale
        def fit(im):
            return im.transform(SIZE,Image.Transform.AFFINE,(1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.NEAREST)
        energy=fit(detach_energy(source)) if variant=='enraged' else None
        base=source.copy();pieces=[];used=Image.new('L',source.size)
        for name,polygon,root,end,amplitude,phase in PARTS[variant]:
            selected=ImageChops.subtract(paint.mask(source.size,polygon),used);used=ImageChops.lighter(used,selected)
            part=source.copy();part.putalpha(ImageChops.multiply(part.getchannel('A'),selected))
            base.putalpha(ImageChops.multiply(base.getchannel('A'),ImageChops.invert(selected)))
            pieces.append((name,fit(part),root*scale+ty,end*scale+ty,amplitude,phase))
        # Stronger sway can expose disconnected remnants just outside a cutout.
        # Keep the fixed body coherent instead of leaving floating outline chips.
        base=paint.connected_body(base)
        states={'rest':fit(base)}
        for state in ['half','closed']:
            drawing=base.copy()
            for src,dst in zip(EYES[variant][state],EYES[variant]['target']):
                patch=blink.crop(src).resize((dst[2]-dst[0],dst[3]-dst[1]),Image.Resampling.NEAREST)
                drawing.alpha_composite(patch,dst[:2])
            states[state]=fit(drawing)
        frames=[]
        for index in range(FRAME_COUNT):
            state='closed' if index in BLINKS[variant]['closed'] else 'half' if index in BLINKS[variant]['half'] else 'rest'
            image=states[state].copy();clock=index/FRAME_COUNT*math.tau
            for name,piece,root,end,amplitude,phase in pieces:
                moved=Image.new('RGBA',SIZE)
                for y in range(SIZE[1]):
                    progress=max(0,min(1,(y-root)/max(1,end-root)))
                    dx=round(math.sin(clock+phase-progress*1.35)*amplitude*progress*progress)
                    moved.paste(piece.crop((0,y,SIZE[0],y+1)),(dx,y))
                image.alpha_composite(moved)
            if energy is not None:
                # Actual arc/tip movement, not a fixed drawing with brightness changes.
                arc=energy.rotate(math.sin(clock*3)*3,Image.Resampling.NEAREST,center=(160,85))
                image.alpha_composite(arc,(round(math.sin(clock*3+.6)*1),round(math.cos(clock*3)*1)))
            frames.append(image)
        dest=PUBLIC/f'illustrations/mira-adler/{REVISION}/{variant}';dest.mkdir(parents=True,exist_ok=True)
        atlas=Image.new('RGBA',(SIZE[0]*8,SIZE[1]*math.ceil(FRAME_COUNT/8)))
        for i,im in enumerate(frames):atlas.paste(im,(i%8*SIZE[0],i//8*SIZE[1]))
        atlas.save(dest/'actor.webp',quality=88,method=6,exact=True)
        frames[0].save(dest/'actor-poster.webp',quality=88,method=6,exact=True)
        bg=Image.new('RGBA',(SIZE[0]*2,SIZE[1]*2))
        for i in range(4):
            cell=background.crop((i%2*background.width//2,i//2*background.height//2,(i%2+1)*background.width//2,(i//2+1)*background.height//2)).resize(SIZE,Image.Resampling.NEAREST)
            bg.paste(cell,(i%2*SIZE[0],i//2*SIZE[1]))
        bg.save(dest/'background.webp',quality=68,method=6)
        aura=Image.new('RGBA',(160*6,224*4));sigil=glyph.resize((138,138),Image.Resampling.NEAREST)
        for i in range(24):
            layer=Image.new('RGBA',(160,224));turn=sigil.rotate(i/24*360,Image.Resampling.NEAREST)
            layer.alpha_composite(turn,(11,34));aura.paste(layer,(i%6*160,i//6*224))
        aura.save(dest/'aura.webp',quality=70,method=6,exact=True)
        actor=track('actor',SIZE,FRAME_COUNT,8,[CYCLE/FRAME_COUNT]*FRAME_COUNT)
        layers=[track('background',SIZE,4,2,[1250]*4,.56),track('aura',(160,224),24,6,[CYCLE/24]*24,.56 if variant=='enraged' else .36,(80,90)),actor]
        record(dest/'illustration.json',{**actor,'variant':variant,'compositionSize':SIZE,'backdrop':'#27222d','layers':layers,'rendering':'pixelated','reviewStatus':'candidate; live review pending'})
        poster=bg.crop((0,0,*SIZE));poster.putalpha(143);flat=Image.new('RGBA',SIZE,'#27222d');flat.alpha_composite(poster);flat.alpha_composite(frames[0]);flat.save(dest/'poster.webp',quality=88,method=6)
        frames[0].save(JOB/f'{variant}-review-{REVISION}.png')
        frames[0].save(JOB/f'{variant}-motion-{REVISION}.gif',save_all=True,append_images=frames[1:],duration=round(CYCLE/FRAME_COUNT),loop=0,disposal=2)
        reports.append({'variant':variant,'frames':FRAME_COUNT,'cycleMs':CYCLE,'blinkFrames':BLINKS[variant],'closedHoldMs':len(BLINKS[variant]['closed'])*CYCLE/FRAME_COUNT,'sourceBounds':box,'scale':scale,'translation':[tx,ty],'runtimeBytes':sum(p.stat().st_size for p in dest.iterdir()),'parts':[{'id':p[0],'tipAmplitudePx':p[4]} for p in pieces]})
    data={'revision':REVISION,'style':'Refined cel + painterly','nativeSize':SIZE,'variants':reports,'backgroundSource':'Aurelia moonlit garden, approved reusable context','sigilSource':'Aurelia independent sigil artwork','blinkRegistration':EYES,'liveReview':'pending; no browser verification authorized'}
    previous=JOB/'illustration-export.json'
    if previous.exists() and not (JOB/'illustration-export-v1.json').exists():shutil.copyfile(previous,JOB/'illustration-export-v1.json')
    record(previous,data);record(JOB/f'illustration-export-{REVISION}.json',data)

def icon():
    image=paint.clean(Image.open(JOB/'icon-generated.png'))
    image=image.resize((40,40),Image.Resampling.NEAREST).quantize(colors=48,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
    dest=PUBLIC/'icons/mira-adler/v1';dest.mkdir(parents=True,exist_ok=True);image.save(dest/'icon.png',optimize=True)
    image.resize((320,320),Image.Resampling.NEAREST).save(JOB/'icon-review.png')
    record(dest/'icon.json',{'id':'mira-adler','angle':'three-quarter-left','source':'normal illustration → dedicated compact drawing, icon-generated.png','nativeSize':[40,40],'frame':'shared wood + active glow','bytes':(dest/'icon.png').stat().st_size})

def portraits():
    portrait.portraits(JOB,'mira-adler','Mira Adler',set())

def surfaces():
    dest=PUBLIC/'mira-adler/v1';dest.mkdir(parents=True,exist_ok=True)
    source=paint.clean(Image.open(JOB/'normal-generated.png'))
    crops={
        'hair':((720,900,820,1080),'#694a43'),
        'suit':((452,480,580,590),'#302638'),
        'stocking':((393,950,443,1110),'#745b53'),
        'cuff':((515,710,530,725),'#f4e6d5'),
        'ear':((479,85,504,129),'#302638'),
        'metal':((275,650,310,690),'#4d4357'),
    }
    for name,(box,color) in crops.items():
        crop=source.crop(box);flat=Image.new('RGBA',crop.size,color);flat.alpha_composite(crop)
        flat.convert('RGB').resize((64,96),Image.Resampling.NEAREST).save(dest/(name+'.png'),optimize=True)
    # Reuse the same independent sigil used by her illustrated aura.
    shutil.copyfile(PUBLIC/'aurelia-weiss/v1/sigil.png',dest/'sigil.png')
    shutil.copyfile(JOB/'profile.json',dest/'profile.json')
    record(JOB/'model-texture-provenance.json',{'source':'approved normal-generated.png','crops':{name:list(value[0]) for name,value in crops.items()},'nativeSize':[64,96],'projection':'Original shared-body UVs; cosmetic accessories have their own UVs','body':'Canonical createRescuer anatomy, pivots and actions retained'})

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('stage',choices=['illustrations','icon','portraits','surfaces']);args=parser.parse_args()
    globals()[args.stage]()
