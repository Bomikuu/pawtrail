"""Sieghart v3: original painted cutouts, pinned cloth parts and a separate eye arc.

Production image processing only. This does not synthesize faces or animation frames.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops, ImageFilter
import json
import math
from collections import deque

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/sieghart-blend-v3'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio'
SIZE = (320, 448)
CYCLE = 5000


def record(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + '\n')


def clean(image):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a >= 195 else 0))
    return image


def mask(size, polygon):
    result = Image.new('L', size)
    ImageDraw.Draw(result).polygon(polygon, fill=255)
    return result


def connected_body(image):
    """Discard disconnected underlay scraps, preserving the fixed main silhouette."""
    alpha=bytearray(image.getchannel('A').tobytes())
    seen=bytearray(len(alpha));components=[];width,height=image.size
    for start,value in enumerate(alpha):
        if not value or seen[start]: continue
        component=[];queue=deque([start]);seen[start]=1
        while queue:
            index=queue.popleft();component.append(index);x,y=index%width,index//width
            for near in ([index-1] if x else [])+([index+1] if x+1<width else [])+([index-width] if y else [])+([index+width] if y+1<height else []):
                if alpha[near] and not seen[near]: seen[near]=1;queue.append(near)
        components.append(component)
    largest=max(components,key=len)
    result=bytearray(len(alpha))
    for index in largest: result[index]=alpha[index]
    image.putalpha(Image.frombytes('L',image.size,bytes(result)))
    return image


# Polygons follow only loose painted material. Face, arms, grip and sword are excluded.
PARTS = {
    'normal': [
        ('scarf-upper', [(620,235),(670,175),(705,178),(740,100),(860,65),(1024,92),(1024,306),(945,302),(920,206),(840,195),(758,270),(665,300),(620,280)], (620,260), (1,-.1), 375, 8.0, .4),
        ('scarf-lower', [(635,309),(720,290),(1024,290),(1024,670),(780,670),(700,446),(635,367)], (635,330), (1,.35), 400, 9.0, -1.0),
        ('coat-hem', [(755,844),(830,815),(1024,830),(1024,1410),(885,1410),(738,1310),(738,1190),(766,1080)], (760,855), (.3,1), 520, 6.5, -1.8),
        ('hair-tips', [(550,104),(605,100),(650,140),(650,207),(585,218),(558,176)], (549,127), (1,.35), 95, 4.0, .8),
        ('hair-crown', [(350,0),(648,0),(648,94),(585,100),(490,94),(435,92),(350,94)], (480,101), (0,-1), 100, 3.8, -.5),
    ],
    'enraged': [
        ('scarf-upper', [(815,333),(875,293),(930,251),(1070,235),(1199,285),(1199,510),(1110,485),(1080,365),(955,392),(866,438),(803,388)], (815,354), (1,.03), 380, 9.0, .4),
        ('scarf-lower', [(800,457),(885,431),(1199,434),(1199,784),(870,785),(788,610),(770,531)], (800,480), (1,.45), 420, 10.0, -.8),
        ('coat-hem', [(780,780),(905,756),(1199,756),(1199,1195),(1070,1200),(965,1110),(870,1045),(780,985)], (780,796), (.8,.75), 455, 7.0, -1.65),
        ('hair-tips', [(749,234),(832,231),(843,288),(788,304),(758,277)], (743,248), (1,.35), 95, 4.0, .7),
        ('hair-crown', [(552,98),(842,98),(842,220),(760,230),(680,220),(552,220)], (660,232), (0,-1), 130, 4.0, -.5),
    ],
}


def export_variant(variant):
    name = 'enraged-lightning' if variant == 'enraged' else 'normal'
    original = clean(Image.open(JOB / (name + '-generated.png')))
    underlay = clean(Image.open(JOB / (variant + '-underlay-generated.png')))
    if underlay.size != original.size:
        underlay = underlay.resize(original.size, Image.Resampling.LANCZOS)
    body_source = original.copy()
    lightning = None
    if variant == 'enraged':
        before = clean(Image.open(JOB / 'enraged-generated.png'))
        arc_area = mask(original.size, [(407,181),(490,183),(566,197),(618,244),(658,284),(659,324),(616,349),(535,347),(496,309),(431,286),(405,243)])
        alpha = Image.new('L', original.size)
        pixels, previous, selected, output = original.load(), before.load(), arc_area.load(), alpha.load()
        for y in range(180,350):
            for x in range(405,660):
                if not selected[x,y]:
                    continue
                r,g,b,a = pixels[x,y]
                pr,pg,pb,_ = previous[x,y]
                bright = min(r,b)>165 and (min(r,b)-g>32 or min(r,g,b)>222)
                changed = max(abs(r-pr),abs(g-pg),abs(b-pb))>42
                if a and bright and changed:
                    output[x,y]=255
        core = original.copy()
        core.putalpha(ImageChops.multiply(original.getchannel('A'),alpha))
        lightning = Image.new('RGBA',original.size,(183,66,255,0))
        lightning.putalpha(alpha.filter(ImageFilter.GaussianBlur(5)).point(lambda a:round(a*.8)))
        lightning.alpha_composite(core)
        # Repair the entire old bolt/bloom footprint, so a static duplicate cannot
        # remain underneath the moving arc. Preserve the revised grin below it.
        body_source = Image.composite(before, original, arc_area)

    base = body_source.copy()
    source_parts = []
    for name, polygon, root, direction, length, amplitude, phase in PARTS[variant]:
        selection = mask(original.size, polygon)
        part = body_source.copy()
        part.putalpha(ImageChops.multiply(part.getchannel('A'), selection))
        # Hair perimeter roots stay in the solid hair mass; their outside is empty.
        # Cloth uses the painted body underlay for correct overlap coverage.
        if name.startswith('hair-'):
            base.putalpha(ImageChops.multiply(base.getchannel('A'),ImageChops.invert(selection)))
        else:
            base = Image.composite(underlay, base, selection)
        source_parts.append((name, part, root, direction, length, amplitude, phase, None))
    if lightning is not None:
        source_parts.append(('eye-lightning',lightning,(640,308),(-1,-.45),260,5.0,.35,{'min':.8,'max':1,'cycles':2}))

    bounds = original.getbbox()
    scale = min((SIZE[0]-24)/(bounds[2]-bounds[0]),(SIZE[1]-24)/(bounds[3]-bounds[1]))
    tx = (SIZE[0]-(bounds[2]-bounds[0])*scale)/2-bounds[0]*scale
    ty = SIZE[1]-12-bounds[3]*scale

    def fit(image):
        return image.transform(SIZE, Image.Transform.AFFINE,
                               (1/scale,0,-tx/scale,0,1/scale,-ty/scale),Image.Resampling.BICUBIC)

    prepared = [('body',connected_body(fit(base)),(0,0),(1,0),1,0,0,None)]
    for name,part,root,direction,length,amplitude,phase,pulse in source_parts:
        prepared.append((name,fit(part),(root[0]*scale+tx,root[1]*scale+ty),direction,length*scale,amplitude,phase,pulse))
    crops=[]
    for name,image,root,direction,length,amplitude,phase,pulse in prepared:
        box=image.getbbox()
        if not box:
            raise ValueError('Empty painted part: '+name)
        crops.append((name,image.crop(box),box[:2],root,direction,length,amplitude,phase,pulse))
    atlas_width=512
    cursor_x=cursor_y=row_height=0
    placed=[]
    for entry in crops:
        width,height=entry[1].size
        if cursor_x+width+2>atlas_width:
            cursor_y+=row_height+4;cursor_x=row_height=0
        placed.append((entry,(cursor_x,cursor_y,width,height)))
        cursor_x+=width+4;row_height=max(row_height,height)
    atlas=Image.new('RGBA',(atlas_width,cursor_y+row_height))
    parts=[]
    for (name,image,offset,root,direction,length,amplitude,phase,pulse),rect in placed:
        atlas.paste(image,rect[:2])
        part={'id':name,'rect':rect,'offset':offset,'root':root,'direction':direction,
              'length':length,'amplitude':amplitude,'phase':phase}
        if pulse:
            part['pulse']=pulse
        if name=='eye-lightning':
            part['cycles']=3
        parts.append(part)
    dest=PUBLIC/'illustrations/sieghart/v5'/variant
    dest.mkdir(parents=True,exist_ok=True)
    atlas.save(dest/'parts.webp',quality=90,method=6,exact=True)
    poster=fit(original)
    poster.save(dest/'actor.webp',quality=90,method=6,exact=True)
    poster.save(dest/'actor-poster.webp',quality=90,method=6,exact=True)

    def track(id,count,columns,durations,opacity=1):
        return {'id':id,'atlas':id+'.webp','nativeSize':SIZE,
                'frames':[{'id':i,'rect':[i%columns*SIZE[0],i//columns*SIZE[1],*SIZE]} for i in range(count)],
                'sequence':list(range(count)),'durationMs':durations,'offset':[0,0],'opacity':opacity}
    actor=track('actor',1,1,[CYCLE])
    layers=[]
    first={}
    for name,count,columns,opacity in [('background',4,2,.10),('aura',6,3,.22 if variant=='enraged' else .15)]:
        source=Image.open(PUBLIC/'illustrations/sieghart/v2/normal'/(name+'.webp')).convert('RGBA')
        out=Image.new('RGBA',(SIZE[0]*columns,SIZE[1]*math.ceil(count/columns)))
        for i in range(count):
            cell=source.crop((i%columns*384,i//columns*384,i%columns*384+384,i//columns*384+384))
            # Quiet backdrop/effect layers do not need the actor's high frequency detail.
            cell=cell.resize((80,112),Image.Resampling.LANCZOS).resize(SIZE,Image.Resampling.BICUBIC)
            cell.putalpha(cell.getchannel('A').point(lambda a:0 if a<28 else round(a/17)*17))
            cell=cell.quantize(colors=48,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).convert('RGBA')
            out.paste(cell,(i%columns*SIZE[0],i//columns*SIZE[1]))
            if i==0:
                first[name]=cell
        out.save(dest/(name+'.webp'),quality=73,method=6)
        layers.append(track(name,count,columns,[CYCLE/count]*count,opacity))
    layers.append(actor)
    manifest={**actor,'variant':variant,'compositionSize':SIZE,'backdrop':'#24212b','rendering':'smooth',
              'layers':layers,'motionRig':{'atlas':'parts.webp','cycleMs':CYCLE,'parts':parts}}
    record(dest/'illustration.json',manifest)
    backdrop=Image.new('RGBA',SIZE,'#24212b')
    for layer in layers[:-1]:
        image=first[layer['id']].copy()
        image.putalpha(image.getchannel('A').point(lambda a:round(a*layer['opacity'])))
        backdrop.alpha_composite(image)
    backdrop.alpha_composite(poster)
    backdrop.save(dest/'poster.webp',quality=89,method=6)
    backdrop.save(JOB/(variant+'-review.png'))
    for name,image,*_ in crops:
        image.save(JOB/(variant+'-part-'+name+'.png'))
    return {'variant':variant,'source':str(JOB/(('enraged-lightning' if variant=='enraged' else 'normal')+'-generated.png')),
            'sourceBounds':bounds,'scale':scale,'translation':[tx,ty],'parts':[p['id'] for p in parts],
            'runtimeBytes':{p.name:p.stat().st_size for p in dest.iterdir() if p.is_file()},
            'decodedPartsBytes':atlas.width*atlas.height*4}


def export_icon():
    image=clean(Image.open(JOB/'icon-generated.png'))
    image=image.crop(image.getbbox()).resize((40,40),Image.Resampling.NEAREST)
    image=image.quantize(colors=48,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
    dest=PUBLIC/'icons/sieghart/v4'
    dest.mkdir(parents=True,exist_ok=True)
    image.save(dest/'icon.png',optimize=True)
    image.convert('RGBA').resize((320,320),Image.Resampling.NEAREST).save(JOB/'icon-review.png')
    record(dest/'icon.json',{'id':'sieghart','style':'Refined cel + painterly','angle':'three-quarter-left',
                           'source':'normal-generated.png → dedicated icon-generated.png','nativeSize':[40,40],
                           'bytes':(dest/'icon.png').stat().st_size})


def export_circle():
    image=Image.open(JOB/'circle-generated.png').convert('RGBA').resize((128,128),Image.Resampling.LANCZOS)
    pixels=image.load()
    for y in range(128):
        for x in range(128):
            r,g,b,a=pixels[x,y]
            radius=math.hypot(x-63.5,y-63.5)
            fade=max(0,min(1,(64-radius)/5))
            line=max(0,min(1,(min(r,g,b)-135)/85))
            pixels[x,y]=(r,g,b,round(a*fade*(.2+.8*line)))
    dest=PUBLIC/'sieghart/v3'
    dest.mkdir(parents=True,exist_ok=True)
    image.quantize(colors=128,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE).save(dest/'sigil.png',optimize=True)
    image.save(JOB/'sigil-review.png')


if __name__=='__main__':
    reports=[export_variant(v) for v in ['normal','enraged']]
    export_icon()
    export_circle()
    record(JOB/'export.json',{'style':'Refined cel + painterly','method':'Continuous pinned 2D painted-part mesh; not duplicated pose frames',
                            'nativeSize':SIZE,'cycleMs':CYCLE,'variants':reports})
    print(json.dumps(reports,indent=2))
