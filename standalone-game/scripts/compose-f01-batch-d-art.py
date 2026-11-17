"""Native production boards, not browser or interaction evidence."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/floors/f01-neon-heights/batch-d-v1';BASE=ROOT/'public/pawtrail-game/floors/f01/batch-d-v1'
board=Image.new('RGBA',(640,420),'#202639');d=ImageDraw.Draw(board)
for row,key in enumerate(['koi-lamp','bastion-bench']):
 for col,angle in enumerate([0,90,180,270]):board.alpha_composite(Image.open(BASE/f'models/{key}/{angle}.png'),(col*160,row*210));d.text((col*160+4,row*210+194),f'{key} {angle}',fill='white')
board.save(DEST/'model-native-review.png')
registries=[json.loads((ROOT/'src/game/stage-editor'/name).read_text()) for name in ['f01-art.json','f01-batch-b-art.json','f01-batch-c-art.json','f01-batch-d-art.json']];assets={a['id']:a for j in registries for a in j['assets']};grounds={g['id']:g for j in registries for g in j['grounds']}
for key in ['lobby','arrival','market']:
 stage=json.loads((ROOT/f'src/game/stage-editor/maps/f01-{key}-v1.json').read_text());g=grounds[stage['groundArt']];im=Image.open(ROOT/'public'/g['file'].lstrip('/')).convert('RGBA')
 def obj(id,asset,x,y):return dict(id=id,asset=asset,x=x,y=y,elevation=0,layer='world',bias=0,rotation=0)
 extras={'lobby':[obj('camp-koi','f01:koi-lamp',650,590),obj('camp-bench','f01:bastion-bench',730,740)],'arrival':[obj('plaza-controller','f01:planning',760,610),obj('plaza-koi','f01:planning',740,740)],'market':[obj('repair-station','f01:counter',365,770),obj('bay-toolkit','f01:supply',340,700)]}[key]
 combined={o['id']:o for o in stage['objects']+extras}
 for o in sorted(combined.values(),key=lambda o:o['y']+o['bias']):
  a=assets[o['asset']];sprite=Image.open(ROOT/'public'/a['file'].lstrip('/')).convert('RGBA');im.alpha_composite(sprite,(round(o['x']-a['anchor'][0]),round(o['y']-a['anchor'][1])))
 im.save(DEST/f'{key}-native-art-layout.png',optimize=True)
# Sprite foreground/contact registration is shown independently of player testing.
m=json.loads((BASE/'model-manifest.json').read_text());contacts=Image.new('RGBA',(640,220),'#202639');d=ImageDraw.Draw(contacts)
bench=next(a for a in m['assets'] if a['id']=='bastion-bench')
for col,(f,v) in enumerate(bench['views'].items()):
 x=col*160;contacts.alpha_composite(Image.open(BASE/f'models/bastion-bench/{f}.png'),(x,0))
 for r in v['geometry']['ground']:d.rectangle([x+r[0],r[1],x+r[0]+r[2],r[1]+r[3]],outline='#efb66b')
 for seat in v['geometry']['seats']:
  px,py=seat['point'];e=seat['elevation'];d.ellipse([x+px-3,py-e-3,x+px+3,py-e+3],outline='#80e4f6');ex,ey=seat['exit'];d.line([x+px,py-e,x+ex,ey],fill='#80e4f6');d.text((x+4,195),f+' degrees / 2 sockets',fill='white')
contacts.save(DEST/'bench-native-contacts.png')
