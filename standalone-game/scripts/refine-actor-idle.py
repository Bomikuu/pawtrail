"""Author the calm-idle/Shy revision from existing complete native frames.

Only the missing Shy artwork is generated. Reuse extraction/registration and
preserve all existing facial artwork. Does not run the app, tests or browsers.
Run with: uv run --no-project --with pillow --with brotli python <this file>
"""
from pathlib import Path
import copy
import hashlib
import importlib.util
import io
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/actor-appearances/calm-idle-shy-2026-11-13'
PREVIOUS = ROOT / 'assets/actor-appearances/motion-refresh-2026-11-13'
spec = importlib.util.spec_from_file_location('motion_export', ROOT/'scripts/refresh-actor-motion.py')
motion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(motion)


def write(path, data, compact=False):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=None if compact else 2,
                               separators=(',', ':') if compact else None) + '\n')


def inputs():
    saved = JOB/'inputs.json'
    if saved.exists():
        return json.loads(saved.read_text())
    catalog = json.loads((ROOT/'src/game/actor-rig/photo-portrait-catalog.json').read_text())
    data = {'portrait': next(item for item in catalog if item['id']=='amber-refined-cel')}
    for kind in ['illustration','boss']:
        data[kind] = json.loads((PREVIOUS/kind/'publication.json').read_text())
    write(saved, data)
    return data


def portrait(source):
    original = ROOT/('public'+source['folder'])
    data = json.loads((original/'portrait.json').read_text())
    atlas = Image.open(original/data['atlas']).convert('RGBA')
    w,h = data['nativeCell']
    frames = [atlas.crop((x,y,x+width,y+height)) for x,y,width,height in data['frames']]
    original_count = len(frames)
    generated = motion.cells(JOB/'sources/shy-states.png',6,3)
    palette_data = json.loads((ROOT/'public/pawtrail-game/game-assets/dialogue-portraits/amber-refined-cel-v1/amber-refined-cel/portrait.json').read_text())['pixelData']['palette']
    palette = Image.new('P',(1,1))
    colors = [palette_data[1]]+palette_data[1:]
    colors += [colors[-1]]*(256-len(colors))
    palette.putpalette([channel for color in colors for channel in color[:3]])
    author = JOB/'portrait';author.mkdir(exist_ok=True)
    sources = []
    for row,(pose,definition) in enumerate(data['poses'].items()):
        neutral = definition['expressions']['neutral']
        resting = neutral['states']['rest']
        # Front returns to quiet breathing. Retain a small range of the current
        # facial movement in the other held angles, at a relaxed cadence.
        indices = [0,1] if pose=='front-pout' else [0,1,10,11]
        neutral['states']['rest'] = [resting[i] for i in indices]
        if pose=='front-pout':
            neutral.pop('idlePerformance',None)
        else:
            neutral['idlePerformance'] = {'sequence':[0,1,2,3], 'durationsMs':[1400,1000,1000,1400]}
        rest_reference = frames[neutral['states']['rest'][0]]
        drawings = motion.register(generated[row*6:row*6+6],(w,h),3,reference=rest_reference)
        ids=[]
        for column,drawing in enumerate(drawings):
            native = drawing.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
            native.putalpha(drawing.getchannel('A'))
            ids.append(len(frames));frames.append(native)
            native.save(author/f'{pose}-shy-{column}.png')
            sources.append({'pose':pose,'expression':'shy','source':'shy-states.png','cell':[column,row],'frame':ids[-1]})
        shy = copy.deepcopy(neutral)
        shy.pop('idlePerformance',None)
        shy['states'] = {'rest':ids[:2], 'half':[ids[2],ids[2]], 'closed':[ids[3],ids[3]],
                         'small':[ids[4],ids[4]], 'open':[ids[5],ids[5]]}
        shy['breathPerformance'] = {'sequence':[0,1,0],'durationsMs':[1470,1260,1470]}
        shy['blinkPerformance']['idleDelayMs'] = [3200,4500]
        definition['expressions']['shy'] = shy
        motion.contact(drawings,(w,h),author/f'{pose}-shy-contact.png',columns=6,zoom=2)
    used = sorted({i for pose in data['poses'].values() for expression in pose['expressions'].values()
                   for state in expression['states'].values() for i in state})
    retained = [i for i in used if i<original_count]
    remap = {old:new for new,old in enumerate(used)}
    frames = [frames[i] for i in used]
    for pose in data['poses'].values():
        for expression in pose['expressions'].values():
            expression['states'] = {state:[remap[i] for i in ids] for state,ids in expression['states'].items()}
    for item in sources:item['frame']=remap[item['frame']]
    result = Image.new('RGBA',(w*12,h*((len(frames)+11)//12)))
    for i,frame in enumerate(frames):result.paste(frame,(i%12*w,i//12*h))
    output=io.BytesIO();result.save(output,format='WEBP',lossless=True,method=6)
    data['frames']=[[i%12*w,i//12*h,w,h] for i in range(len(frames))]
    data['motionRevision']='calm-breathing-shy-v3'
    data['motionScope']='Current facial art retained. Front neutral: restrained 4.2-second breath. Other neutral angles: 4.8-second small-range idle. Shy includes complete rest/breath/blink/speech drawings in all three angles.'
    data['reviewStatus']='candidate; native artwork inspection only, live motion review pending'
    revision=hashlib.sha256(output.getvalue()+json.dumps(data,sort_keys=True).encode()).hexdigest()[:12]
    folder=f'/pawtrail-game/game-assets/dialogue-portraits/amber-refined-cel-calm-v3/{revision}'
    destination=ROOT/('public'+folder);destination.mkdir(parents=True,exist_ok=True)
    shutil.copytree(original/'reference',destination/'reference',dirs_exist_ok=True)
    (destination/'portrait.webp').write_bytes(output.getvalue());write(destination/'portrait.json',data,True)
    total=sum(f.stat().st_size for f in destination.rglob('*') if f.is_file())
    references=sum(f.stat().st_size for f in (destination/'reference').glob('*') if f.is_file())
    if total>source['budgetBytes']:raise RuntimeError(f'Keep the complete portrait within its cap: {total} bytes.')
    entry=copy.deepcopy(source);entry.pop('idleFramesPerAngle',None)
    entry.update(folder=folder,revision=revision,completeBytes=total,referenceBytes=references,
                 runtimeBytes=total-references,uniqueFullFrames=len(frames),expressionCount=7,
                 sourceImagesUsed=source['sourceImagesUsed']-(original_count-len(retained))+len(sources),
                 idleFrameCounts={'front-pout':2,'three-quarter-left':4,'head-tilt-smile-right':4},
                 emotionIds=['idle','smile','happy','sad','angry','surprised','shy'])
    catalog_path=ROOT/'src/game/actor-rig/photo-portrait-catalog.json'
    catalog=json.loads(catalog_path.read_text())
    catalog=[entry if item['id']==entry['id'] else item for item in catalog];write(catalog_path,catalog)
    write(author/'publication.json',entry);write(author/'source-map.json',{'retainedInputFrameIds':retained,'newArtwork':sources})
    for pose in data['poses']:
        expression=data['poses'][pose]['expressions']['neutral']
        native=[frames[i] for i in expression['states']['rest']]
        motion.contact(native,(w,h),author/f'{pose}-calm-contact.png',columns=len(native),zoom=3)
        timing=expression.get('idlePerformance',expression['breathPerformance'])
        sequence=[native[i] for i in timing['sequence']]
        sequence[0].resize((w*3,h*3),Image.Resampling.NEAREST).save(author/f'{pose}-calm.gif',save_all=True,
            append_images=[im.resize((w*3,h*3),Image.Resampling.NEAREST) for im in sequence[1:]],
            duration=timing['durationsMs'],loop=0,disposal=2)
    print(json.dumps({'portrait':folder,'frames':len(frames),'completeBytes':total,'expressions':7}),flush=True)


def illustration(kind,source):
    original=ROOT/('public'+source['folder'])
    data=json.loads((original/'illustration.json').read_text())
    data['durationMs']=([500,350,300,250,250,250,300,400,500,350,300,250,250,250,300,350] if kind=='boss'
                        else [600,400,350,300,300,350,600,450,350,350,350,400])
    data['timingRevision']='calm-idle-v1'
    data['review']['liveCycle']='pending owner review; pacing revised from fast candidate; all artwork retained'
    revision=hashlib.sha256(json.dumps(data,sort_keys=True).encode()).hexdigest()[:12]
    data['revision']=revision
    folder=(f'/pawtrail-game/monsters/vaelrith-riftbound/illustration-v3-calm-{revision}' if kind=='boss'
            else f'/pawtrail-game/actor-studio/illustrations/amber-outrider/full-body-v4-calm-{revision}')
    destination=ROOT/('public'+folder);destination.mkdir(parents=True,exist_ok=True)
    for name in ['atlas.webp','poster.webp']:shutil.copy2(original/name,destination/name)
    write(destination/'illustration.json',data)
    author=JOB/kind;author.mkdir(exist_ok=True)
    atlas=Image.open(destination/data['atlas']).convert('RGBA')
    frames=[]
    for frame in data['frames']:
        x,y,w,h=frame['rect'];frames.append(atlas.crop((x,y,x+w,y+h)))
    sequence=[frames[i] for i in data['sequence']]
    sequence[0].save(author/'calm-motion.gif',save_all=True,append_images=sequence[1:],duration=data['durationMs'],loop=0,disposal=2)
    publication=copy.deepcopy(source);publication.update(folder=folder,cycleMs=sum(data['durationMs']),
        runtimeBytes=sum(f.stat().st_size for f in destination.iterdir() if f.is_file()))
    write(author/'publication.json',publication)
    # Update only the existing pointer; the atlas/poster are byte-for-byte copies.
    consumer=ROOT/('src/components/game/monster-studio.tsx' if kind=='boss' else 'src/game/creator/illustrations.ts')
    consumer.write_text(consumer.read_text().replace(source['folder'],folder))
    print(json.dumps({'illustration':kind,'folder':folder,'cycleMs':publication['cycleMs']}),flush=True)


def boss_portrait():
    path=ROOT/'public/pawtrail-game/monsters/vaelrith-riftbound/v1/manifest.json'
    data=json.loads(path.read_text())
    data['portrait']['idlePerformance']={'sequence':[0,1,0],'durationsMs':[1800,800,1600]}
    data['portrait']['motionRevision']='calm-breathing-v2'
    write(path,data)
    write(JOB/'boss/portrait-timing.json',{'asset':str(path.relative_to(ROOT)),
        'artwork':'All six existing complete portrait drawings retained unchanged',
        'timing':data['portrait']['idlePerformance'],'liveReview':'pending; no browser verification requested'})


if __name__=='__main__':
    source=inputs()
    portrait(source['portrait'])
    for kind in ['illustration','boss']:illustration(kind,source[kind])
    boss_portrait()
