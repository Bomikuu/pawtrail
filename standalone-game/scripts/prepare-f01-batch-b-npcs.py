"""Scoped approved NPC art authoring export; no runtime verification."""
from pathlib import Path
import importlib.util,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('floor_npc_export',ROOT/'scripts/prepare-f01-npcs.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
shared.SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-b-v1/sources'
for actor,name,short,normal_span in [('nyx-tal','Nyx Tal','nyx','d7b2f9cc76044e78994f5c4018a603ac'),('eko-9','EKO-9','eko','f671549324cb4e1fb6b330402160ded8')]:
 shared.run(actor,name,short,normal_span)
 path=ROOT/f'assets/actor-appearances/{actor}-floor-v1/production.json';job=json.loads(path.read_text());entry=job['actors'][0]
 entry.update(scope='friendly-floor-npc-phase4',installInGame=True,previewUrl='http://127.0.0.1:3000/play?preview=stage&map='+('f01-skybridge' if short=='nyx' else 'f01-arrival'))
 entry['dependencies']['preview']=['src/game/floors/npcs.ts','src/game/stage-editor/canvas.ts','src/components/game/floor-npc-panel.tsx']
 entry['portrait']['collection']=actor+'-refined-cel'
 export=json.loads((path.parent/'portrait-export.json').read_text());entry['dependencies']['portrait']=[export['folder'].lstrip('/') if not export['folder'].startswith('/pawtrail-game') else 'public'+export['folder'],'src/game/actor-rig/photo-portrait-renderer.ts']
 if short=='nyx':entry['dependencies']['model']=['src/game/floors/npcs/nyx.ts','src/game/floors/npc-renderer.ts','src/game/actor-rig/pixel-renderer.ts']
 else:
  entry['modelKind']='hologram-projection';entry['representation']='existing-animated-2d-projection'
  entry['dependencies']['model']=['src/game/floors/scenery-motion.ts','public/pawtrail-game/map-art/neon-heights-v1/holo-head.png']
  entry['scopeOmissions'].append('Humanoid full-body rig: EKO is the canonical anchored holographic head/shoulders and full emitter, not a walking biological actor')
 if (path.parent/'icon-generated.png').exists():
  image=Image.open(path.parent/'icon-generated.png').convert('RGBA');bounds=image.getchannel('A').point(lambda a:255 if a>=180 else 0).getbbox();image=image.crop(bounds);scale=min(40/image.width,40/image.height);size=(round(image.width*scale),round(image.height*scale));image=image.transform(size,Image.Transform.AFFINE,(image.width/size[0],0,0,0,image.height/size[1],0),Image.Resampling.NEAREST)
  icon=Image.new('RGBA',(48,48));icon.alpha_composite(image,((48-size[0])//2,(48-size[1])//2));icon.save(ROOT/f'public/pawtrail-game/floors/f01/npcs/{short}/icon.png',optimize=True)
  job['assets'].append({'id':'icon','path':str((path.parent/'icon-generated.png').relative_to(ROOT)),'kind':'image','alpha':True})
 entry['illustrationStyle']='Refined cel + painterly';entry['artApproval']='Explicit owner approved designs + Refined cel portraits'
 if short=='eko':
  presentation=ROOT/'public/pawtrail-game/floors/f01/npcs/eko/presentation.json';value=json.loads(presentation.read_text());value['illustration']['motion']='Authored hologram head-and-shoulders motion, blink and full grounded emitter';value['scope']='friendly anchored hologram NPC · normal only · no biological lower body, combat or voices';presentation.write_text(json.dumps(value,indent=2)+'\n')
 path.write_text(json.dumps(job,indent=2)+'\n')
print('Exported Nyx and EKO native illustration, icon and portrait packages')
