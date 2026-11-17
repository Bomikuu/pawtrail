"""Scoped native art export for approved Undergrid/Rainline batch. No app checks."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
JOB=ROOT/'assets/floors/f01-neon-heights/batch-b-v1'
OUT=ROOT/'public/pawtrail-game/floors/f01/batch-b-v1'
URL='/pawtrail-game/floors/f01/batch-b-v1'
def native(im,size):return im.transform(size,Image.Transform.AFFINE,(im.width/size[0],0,0,0,im.height/size[1],0),Image.Resampling.NEAREST)
def save(im,path):path.parent.mkdir(parents=True,exist_ok=True);im.save(path,optimize=True)
def export():
 for key,size in [('undergrid-ground',(1280,896)),('skybridge-ground',(1280,768)),('pump-array',(224,176)),('coolant-reservoir',(176,128)),('pipe-wall',(320,144))]:
  save(native(Image.open(JOB/'sources'/f'{key}.png').convert('RGBA'),size),OUT/f'{key}.png')
 # Front, back and side paint remain genuine generated pixels; patches avoid sheet dividers.
 patches={
  'relay':{'front':(.10,.09,.46,.44),'metal':(.13,.06,.19,.10),'back':(.14,.59,.43,.91),'side':(.70,.12,.82,.40)},
  'archive':{'front':(.16,.10,.38,.44),'metal':(.18,.06,.23,.09),'back':(.16,.60,.38,.93),'side':(.65,.13,.73,.41)},
  'supply':{'front':(.15,.13,.40,.40),'metal':(.17,.09,.21,.12),'back':(.16,.63,.41,.91),'side':(.69,.13,.78,.40)},
  'valve':{'front':(.14,.26,.41,.42),'metal':(.17,.24,.22,.27),'back':(.16,.76,.41,.91),'side':(.68,.28,.79,.41)}}
 for key,regions in patches.items():
  im=Image.open(JOB/'sources'/f'{key}-reference.png').convert('RGBA')
  for name,(l,t,r,b) in regions.items():save(native(im.crop((round(l*im.width),round(t*im.height),round(r*im.width),round(b*im.height))),(128,128)),OUT/'textures'/f'{key}-{name}.png')
 print('Exported Batch B native scenery and generated model paint patches')
if __name__=='__main__':export()
