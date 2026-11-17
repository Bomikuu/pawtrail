"""Authoring composition at native size. This is not a running-app capture."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];DEST=ROOT/'assets/floors/f01-neon-heights/batch-c-v1';BASE=ROOT/'public/pawtrail-game/floors/f01/batch-c-v1'
registries=[json.loads((ROOT/'src/game/stage-editor'/name).read_text()) for name in ['f01-art.json','f01-batch-b-art.json','f01-batch-c-art.json']];assets={a['id']:a for j in registries for a in j['assets']}
stage=json.loads((ROOT/'src/game/stage-editor/maps/f01-switchyard-v1.json').read_text());im=Image.open(BASE/'switchyard-ground.png').convert('RGBA')
for obj in sorted(stage['objects'],key=lambda o:o['y']+o['bias']):
 a=assets[obj['asset']];sprite=Image.open(ROOT/'public'/a['file'].lstrip('/')).convert('RGBA');x=round(obj['x']-a['anchor'][0]);y=round(obj['y']-a['anchor'][1]);im.alpha_composite(sprite,(x,y))
 if obj['asset']=='f01:yard-crane':im.alpha_composite(Image.open(BASE/'crane-load.png').convert('RGBA'),(x+205-24,y+15))
# Actual native Marshal family frame, at declared 3.4 human-height scale.
p=ROOT/'public/pawtrail-game/monsters/families/kurogane/v1/iron-marshal';m=json.loads((p/'manifest.json').read_text());atlas=Image.open(p/m['atlas']).convert('RGBA');c=atlas.crop((0,0,256,256));size=round(40*3.4*256/m['contentHeight']);c=c.transform((size,size),Image.Transform.AFFINE,(256/size,0,0,0,256/size,0),Image.Resampling.NEAREST);im.alpha_composite(c,(round(900-size/2),round(547-m['baseline']/256*size)))
im.save(DEST/'switchyard-native-art-layout.png',optimize=True)
# Native illustration/portrait/icon sheet, original generated face states unpainted.
p=ROOT/'public/pawtrail-game/floors/f01/npcs/sena';sheet=Image.new('RGBA',(672,440),'#202639');sheet.alpha_composite(Image.open(p/'illustration/poster.webp'),(0,70));sheet.alpha_composite(Image.open(p/'icon.png'),(600,12))
job=ROOT/'assets/actor-appearances/sena-valez-floor-v1';poses=['front-pout','three-quarter-left','head-tilt-smile-right']
for row,pose in enumerate(poses):
 for col,state in enumerate(['rest','half','closed','small','open']):sheet.alpha_composite(Image.open(job/'native'/f'{pose}-neutral-{state}.png'),(192+col*96,row*140))
sheet.save(DEST/'sena-native-art-review.png')
