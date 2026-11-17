"""Native art-layout proof, not an application screenshot or gameplay check."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/floors/f01-neon-heights/batch-b-v1'
registries=[json.loads((ROOT/'src/game/stage-editor'/name).read_text()) for name in ['f01-art.json','f01-batch-b-art.json']]
assets={a['id']:a for j in registries for a in j['assets']};grounds={g['id']:g for j in registries for g in j['grounds']}
for key in ['undergrid','skybridge']:
 stage=json.loads((ROOT/f'src/game/stage-editor/maps/f01-{key}-v1.json').read_text());g=grounds[stage['groundArt']]
 image=Image.open(ROOT/'public'/g['file'].lstrip('/')).convert('RGBA')
 for obj in sorted(stage['objects'],key=lambda o:({'ground':-100000,'world':0,'foreground':100000}[o['layer']]+o['y']+o['bias'])):
  a=assets[obj['asset']];sprite=Image.open(ROOT/'public'/a['file'].lstrip('/')).convert('RGBA')
  if sprite.size!=(a['width'],a['height']):sprite=sprite.transform((a['width'],a['height']),Image.Transform.AFFINE,(sprite.width/a['width'],0,0,0,sprite.height/a['height'],0),Image.Resampling.NEAREST)
  image.alpha_composite(sprite,(round(obj['x']-a['anchor'][0]),round(obj['y']-a['anchor'][1]-obj['elevation'])))
 image.save(DEST/f'{key}-native-art-layout.png',optimize=True)
print('Exported two native art layout proofs; no application was launched')
