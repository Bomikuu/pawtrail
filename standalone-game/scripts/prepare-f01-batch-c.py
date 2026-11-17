"""Native export of approved Switchyard art; not runtime verification."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];JOB=ROOT/'assets/floors/f01-neon-heights/batch-c-v1';OUT=ROOT/'public/pawtrail-game/floors/f01/batch-c-v1'
def native(im,size):return im.transform(size,Image.Transform.AFFINE,(im.width/size[0],0,0,0,im.height/size[1],0),Image.Resampling.NEAREST)
for key,size in [('switchyard-ground',(1152,896)),('dispatch-cabin',(272,224)),('freight-stack',(192,160)),('freight-crates',(160,128))]:
 im=Image.open(JOB/'sources'/f'{key}.png').convert('RGBA');native(im,size).save(OUT/f'{key}.png',optimize=True)
im=Image.open(JOB/'sources/yard-crane-layers.png').convert('RGBA');w,h=im.size
for key,rect,size in [('yard-crane',(.08,.03,.55,.96),(224,224)),('crane-load',(.70,.03,.87,.94),(48,128))]:
 crop=im.crop(tuple(round(v*(w if i%2==0 else h)) for i,v in enumerate(rect)));b=crop.getchannel('A').point(lambda a:255 if a>=160 else 0).getbbox();crop=crop.crop(b);native(crop,size).save(OUT/f'{key}.png',optimize=True)
