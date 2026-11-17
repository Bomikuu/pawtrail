"""Native artwork contact sheets; these are not browser/runtime verification."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1];JOB=ROOT/'assets/floors/f01-neon-heights/batch-a-v1'
registry=json.loads((ROOT/'src/game/stage-editor/f01-art.json').read_text());assets={a['id']:a for a in registry['assets']};grounds={a['id']:a for a in registry['grounds']}
def load(file):return Image.open(ROOT/'public'/file.lstrip('/')).convert('RGBA')
def resize(im,size):return im.transform(size,Image.Transform.AFFINE,(im.width/size[0],0,0,0,im.height/size[1],0),Image.Resampling.NEAREST)
for key in ['lobby','arrival','market']:
    stage=json.loads((ROOT/f'src/game/stage-editor/maps/f01-{key}-v1.json').read_text());scene=load(grounds[stage['groundArt']]['file'])
    for o in sorted(stage['objects'],key=lambda o:o['y']+o['bias']):
        a=assets[o['asset']];image=load(a['file']);definition=a.get('furniture',{});front=definition.get('frontFile')
        image=resize(image,(a['width'],a['height']));scene.alpha_composite(image,(o['x']-a['anchor'][0],o['y']-a['anchor'][1]))
        if front:scene.alpha_composite(resize(load(front),(a['width'],a['height'])),(o['x']-a['anchor'][0],o['y']-a['anchor'][1]))
    scene.save(JOB/f'{key}-native-layout.png',optimize=True)
review=Image.new('RGBA',(640,768),'#37343e');draw=ImageDraw.Draw(review)
for row,key in enumerate(['lift','allocation','planning','counter']):
    for col,angle in enumerate([0,90,180,270]):
        review.alpha_composite(load(f'/pawtrail-game/floors/f01/batch-a-v1/models/{key}/{angle}.png'),(col*160,row*192))
        draw.text((col*160+5,row*192+5),f'{key} {angle}',fill='#f2e4ce')
review.save(JOB/'model-native-views.png',optimize=True)
print('Authored native map compositions and four-angle model contact sheet')
