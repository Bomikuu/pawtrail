"""Scoped friendly NPC art export. Full-body idle + portraits; voices/combat deferred."""
from pathlib import Path
import importlib.util, json, shutil, sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from actor_production.ledger import Job, atomic_json
from actor_production.readiness import import_asset
spec=importlib.util.spec_from_file_location('portrait_export',ROOT/'scripts/prepare-sieghart-revision.py')
shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-a-v1/sources'

def run(actor,name,short,normal_span):
    folder=ROOT/f'assets/actor-appearances/{actor}-floor-v1';manifest=folder/'production.json'
    data=json.loads(manifest.read_text());entry=data['actors'][0]
    entry.update(illustrationVariants=['normal'],illustrationCycleMs=4800,scope='friendly-floor-npc-first-loop',portraitStyle='Refined cel',portraitDefaultAngle='three-quarter-left',iconAngle='three-quarter-left',scopeOmissions=['enraged illustration and combat kit: friendly NPC, not requested','voice: deferred by approved floor plan','full hero/comparison acceptance: outside this batch'])
    entry['dependencies']['preview']=['src/game/floors/npcs.ts','src/game/stage-editor/canvas.ts','src/components/game/floor-npc-panel.tsx']
    data['assets']=[{'id':'normal','path':str((folder/'normal-generated.png').relative_to(ROOT)),'kind':'image','alpha':True}]+[{'id':f'portrait-{i}','path':str((folder/f'portrait-{i}-generated.png').relative_to(ROOT)),'kind':'image','alpha':True} for i in range(3)]
    atomic_json(manifest,data);job=Job(manifest)
    import_asset(job,'normal',SOURCE/f'{actor}.png',normal_span)
    if not any(e['type']=='span.end' and e.get('span')==normal_span for e in job.events()):job.end(normal_span,note='Generated full-body source saved and explicitly approved by owner')
    span=job.start('native-art-export',actor,'export')
    for i in range(3):import_asset(job,f'portrait-{i}',folder/f'portrait-{i}-generated.png',span['id'])
    image=Image.open(folder/'normal-generated.png').convert('RGBA')
    cells=[]
    for i in range(6):
        cell=image.crop((round(i%3*image.width/3),round(i//3*image.height/2),round((i%3+1)*image.width/3),round((i//3+1)*image.height/2)))
        # Keep genuine generated alpha, including the source's faint edge glow.
        core=cell.getchannel('A').point(lambda a:255 if a>=180 else 0);bounds=core.getbbox();cells.append((cell,bounds))
    width,height=192,320
    scale=min((width-14)/max(b[2]-b[0] for _,b in cells),(height-12)/max(b[3]-b[1] for _,b in cells))
    frames=[];atlas=Image.new('RGBA',(width*3,height*2));dest=ROOT/f'public/pawtrail-game/floors/f01/npcs/{short}';(dest/'illustration').mkdir(parents=True,exist_ok=True)
    for i,(cell,bounds) in enumerate(cells):
        # One shared scale, anchored feet; authored facial states are not warped.
        center=(bounds[0]+bounds[2])/2;x=width/2-center*scale;y=height-6-bounds[3]*scale
        frame=cell.transform((width,height),Image.Transform.AFFINE,(1/scale,0,-x/scale,0,1/scale,-y/scale),Image.Resampling.NEAREST)
        frames.append(frame);atlas.alpha_composite(frame,(i%3*width,i//3*height))
    atlas.save(dest/'illustration/actor.webp',lossless=True,method=4,exact=True)
    times=[2200,90,100,90,1100,1220]
    track=dict(nativeSize=[width,height],atlas='actor.webp',frames=[dict(id=i,rect=[i%3*width,i//3*height,width,height]) for i in range(6)],sequence=list(range(6)),durationMs=times)
    atomic_json(dest/'illustration/illustration.json',track);frames[0].save(dest/'illustration/poster.webp',lossless=True,method=4)
    # Source face crop from approved normal illustration, native icon and editor body poster.
    frame=frames[0];core=frame.getchannel('A').point(lambda a:255 if a>=180 else 0);b=core.getbbox()
    head=frame.crop((b[0],b[1],b[2],b[1]+round((b[3]-b[1])*.31)))
    native=head.transform((40,40),Image.Transform.AFFINE,(head.width/40,0,0,0,head.height/40,0),Image.Resampling.NEAREST)
    icon=Image.new('RGBA',(48,48));icon.alpha_composite(native,(4,4));icon.save(dest/'icon.png',optimize=True)
    body=frame.transform((48,80),Image.Transform.AFFINE,(4,0,0,0,4,0),Image.Resampling.NEAREST);body.save(dest/'body.png',optimize=True)
    shared.portraits(folder,actor,name,happy_closed_poses=set())
    exported=json.loads((folder/'portrait-export.json').read_text())
    atomic_json(dest/'presentation.json',{'id':short,'name':name,'portraitCollection':exported['id'],'illustration':{'name':name,'folder':f'/pawtrail-game/floors/f01/npcs/{short}/illustration','nativeSize':[width,height],'style':'Refined cel + painterly','motion':'Authored full-body idle and blink'},'icon':f'/pawtrail-game/floors/f01/npcs/{short}/icon.png','portraitBytes':exported['completeBytes'],'scope':'friendly NPC · normal only · no voices'})
    job.end(span['id'],note='Native illustration/icon/portrait outputs authored; browser and animated visual acceptance remain pending')

if __name__=='__main__':
    run('mara-solis','Mara Solis','mara','a9579613829b47f7aa548095046b4d23')
    run('ivo-mercado','Ivo Mercado','ivo','224a25f0d26a4b30adb1a9509412c9ac')
