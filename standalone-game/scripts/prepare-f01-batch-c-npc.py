"""Approved friendly Sena native artwork export; no browser acceptance."""
from pathlib import Path
import importlib.util,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('batch_b_export',ROOT/'scripts/prepare-f01-npcs.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
shared.SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-c-v1/sources'
p=ROOT/'assets/actor-appearances/sena-valez-floor-v1/production.json';span='44d8dee94a244ab3b1fd26d37b323bc5'
shared.run('sena-valez','Sena Valez','sena',span)
job=json.loads(p.read_text());entry=job['actors'][0];export=json.loads((p.parent/'portrait-export.json').read_text())
entry.update(scope='friendly-floor-npc-phase5',installInGame=True,portraitStyle='Refined cel',artApproval='Explicit owner approved Sena design + Refined cel portraits',previewUrl='http://127.0.0.1:3000/play?preview=stage&map=f01-switchyard')
entry['portrait']['collection']='sena-valez-refined-cel'
entry['dependencies']['model']=['src/game/floors/npcs/sena.ts','src/game/floors/npc-renderer.ts','src/game/actor-rig/pixel-renderer.ts'];entry['dependencies']['portrait']=['public'+export['folder'],'src/game/actor-rig/photo-portrait-renderer.ts']
im=Image.open(p.parent/'icon-generated.png').convert('RGBA');im=im.crop(im.getchannel('A').point(lambda a:255 if a>=180 else 0).getbbox());scale=min(40/im.width,40/im.height);size=(round(im.width*scale),round(im.height*scale));im=im.transform(size,Image.Transform.AFFINE,(im.width/size[0],0,0,0,im.height/size[1],0),Image.Resampling.NEAREST);icon=Image.new('RGBA',(48,48));icon.alpha_composite(im,((48-size[0])//2,(48-size[1])//2));icon.save(ROOT/'public/pawtrail-game/floors/f01/npcs/sena/icon.png',optimize=True)
job['assets'].append({'id':'icon','path':str((p.parent/'icon-generated.png').relative_to(ROOT)),'kind':'image','alpha':True});p.write_text(json.dumps(job,indent=2)+'\n')
