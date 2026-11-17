"""Register the approved live Phase 6 craft outputs; no app verification."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/pawtrail-game/floors/f01/batch-d-v1';URL='/pawtrail-game/floors/f01/batch-d-v1'
models=json.loads((OUT/'model-manifest.json').read_text());assets=[]
for m in models['assets']:
 key=m['id'];views=m['views'];files={k:URL+f'/models/{key}/{k}.png' for k in views}
 for k,v in views.items():
  v['file']=files[k]
  if key=='bastion-bench':v['frontFile']=URL+f'/models/{key}/{k}-front.png'
 f=dict(id='f01-'+key,label='Koi Lamp' if key=='koi-lamp' else 'Bastion Bench',**views['0'],renderedViews=views,orientationVariants=files,supportedRotations=[0,90,180,270],blocking=True,rotatable=True,category='Floor 01 · crafted 3D',interaction=m['action'],price=0,zones=['interior','yard'],indicatorHeight=88 if key=='koi-lamp' else 78)
 assets.append(dict(id='f01:'+key,label=f['label'],category=f['category'],kind='object',file=files['0'],width=160,height=192,anchor=[80,168],footprint=f['footprint'],rotations=[0,90,180,270],furniture=f,liveModel=dict(file=m['model'])))
value=dict(version=1,grounds=[],assets=assets)
(ROOT/'src/game/stage-editor/f01-batch-d-art.json').write_text(json.dumps(value,indent=2)+'\n');(OUT/'manifest.json').write_text(json.dumps({**models,'animation':{'koi-lamp':'Fixed emitter, separate swimming fish and oscillating tails; off hides projection','bastion-bench':'Fixed chassis, emissive light cycle'},'runtimeAcceptance':'Pending owner verification'},indent=2)+'\n')
