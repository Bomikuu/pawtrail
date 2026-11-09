"""Pack one actual appearance export; run by pawtrail-actors.mjs."""
import json
import sys
from pathlib import Path
from PIL import Image
from pixel_actor_art import PixelFinish

source = Path(sys.argv[1]).resolve()
meta = json.loads((source/'appearance-render.json').read_text())
production = PixelFinish(meta['palette'])
w, h = meta['frameWidth'], meta['frameHeight']
# Fit whole horizontal clips by length instead of wasting a row tail whenever
# the next source-order clip is too long. Manifest offsets preserve lookup order.
clips=[(direction,action,config,config.get('frames',8))
       for direction in meta['directions'] for action,config in meta['actions'].items()]
columns = 32
while columns*w <= 4096:
    used=[];positions={}
    for index in sorted(range(len(clips)),key=lambda i:(-clips[i][3],i)):
        count=clips[index][3]
        if count>columns:break
        candidates=[row for row,total in enumerate(used) if total+count<=columns]
        row=max(candidates,key=lambda r:used[r]) if candidates else len(used)
        if row==len(used):used.append(0)
        positions[index]=row*columns+used[row];used[row]+=count
    else:
        rows=len(used)
        if rows*h<=4096:
            layout=[(direction,action,config,positions[i],count) for i,(direction,action,config,count) in enumerate(clips)]
            break
    columns+=8
else:
    raise SystemExit('Appearance atlas exceeds the pixel budget. Reduce frame padding or split the action collection.')

sheet = Image.new('RGBA',(w*columns,h*rows))
animations = {}
updated = set(meta.get('updatedActions',meta['actions']))
for direction, action, config, start, count in layout:
    folder = source/'sprites'/action/direction
    folder.mkdir(parents=True,exist_ok=True)
    for frame in range(count):
        raw = source/'frames'/action/direction/f'{frame}.png'
        if not raw.exists():
            raise SystemExit(f'Missing {action}/{direction}/{frame}. Export the full appearance before updating selected actions.')
        finished = folder/f'{frame}.png'
        if action not in updated and finished.exists():
            sprite = Image.open(finished).convert('RGBA')
        else:
            sprite = production.finish(raw)
            sprite.save(finished)
        index = start+frame
        sheet.alpha_composite(sprite,((index % columns)*w,(index//columns)*h))
    animations[f'{action}-{direction}'] = dict(start=start,end=start+count-1,frameRate=config['fps'],repeat=config['repeat'])
sheet.save(source/'spritesheet.png',optimize=True)
ground = meta['groundPixel']
manifest = dict(frameWidth=w,frameHeight=h,columns=columns,rows=rows,spacing=0,margin=0,
                groundPixel=ground,anchor=dict(x=ground['x']/w,y=ground['y']/h),filter='nearest',headHeight=meta.get('headHeight',38 if h>=48 else 20),
                animations=animations,source='source-rig.glb',
                palette=['#%02x%02x%02x'%color for color in production.colors])
(source/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
Image.open(source/'sprites/idle/down/0.png').save(source/'portrait.png')
print(f"Finished {meta['id']}: {len(animations)} directional clips, {sheet.width}×{sheet.height} native sheet.")
