"""Non-destructive native preparation of the generated first housing tile batch."""
from pathlib import Path
from PIL import Image
import json, shutil
root=Path(__file__).resolve().parents[1]
out=root/'public/assets/game/housing/tilesets'
out.mkdir(parents=True,exist_ok=True)
source=Path('/home/micxsz/.codex/generated_images/01a19a5c-6747-7123-9ce4-c6c0d6649969')
floors=source/'exec-f7a608d7-2aac-4a9e-a45b-bc50181499b7.png'
walls=source/'exec-72963c3c-6ec7-4a34-ba8e-be5f302e8ece.png'
shutil.copy2(floors,out/'interior-floors-housing-v1-source.png')
shutil.copy2(walls,out/'interior-walls-housing-v1-source.png')
names=['oak-light-a','oak-light-b','oak-light-c','oak-light-d','wood-dark-a','wood-dark-b','wood-dark-c','wood-dark-d','ceramic-a','ceramic-b','kitchen-a','kitchen-b','carpet-a','carpet-b','stone','patterned']
wallnames=['cream-straight','cream-end-left','cream-end-right','cream-inner-left','cream-inner-right','cream-fill','cream-outer-left','cream-outer-right','cream-edge-left','cream-edge-right','cream-top-trim','wood-panel','door-closed','door-open','doorframe','window','curtained-window','wall-shelf','sage-wall','blue-wall','beige-wall','floral-wallpaper','room-divider','stairs']
entries=[]
def native(tile):
    return tile.convert('RGB').resize((32,32),Image.Resampling.NEAREST).quantize(colors=32,dither=Image.Dither.NONE).convert('RGBA')
f=Image.open(floors)
fatlas=Image.new('RGBA',(128,128))
for idx,name in enumerate(names):
    col,row=idx%4,idx//4
    tile=native(f.crop((col*f.width//4,row*f.height//4,(col+1)*f.width//4,(row+1)*f.height//4)))
    # Retain generated interior clusters; equalize wrap edges explicitly for repeat sampling.
    for y in range(32): tile.putpixel((31,y),tile.getpixel((0,y)))
    for x in range(32): tile.putpixel((x,31),tile.getpixel((x,0)))
    file=f'{name}-housing-v1.png';tile.save(out/file);fatlas.paste(tile,(col*32,row*32))
    entries.append(dict(id=name,file=f'/assets/game/housing/tilesets/{file}',width=32,height=32,atlas='interior-floors-housing-v1.png',rect=[col*32,row*32,32,32],opaque=True,edgeWrapPixelsMatch=True,productionReady=False,review='Native dimensions/palette/wrap verified; repeated visual composition requires art review.'))
fatlas.save(out/'interior-floors-housing-v1.png')
w=Image.open(walls)
watlas=Image.new('RGBA',(192,128))
# Observed actual source panel boundaries, not invented equal cell coordinates.
xs=[33,282,524,768,1012,1254,1503];ys=[30,272,510,750,994]
for idx,name in enumerate(wallnames):
    col,row=idx%6,idx//6
    tile=native(w.crop((xs[col]+1,ys[row]+1,xs[col+1]-1,ys[row+1]-1)))
    file=f'{name}-housing-v1.png';tile.save(out/file);watlas.paste(tile,(col*32,row*32))
    entries.append(dict(id=name,file=f'/assets/game/housing/tilesets/{file}',width=32,height=32,atlas='interior-walls-housing-v1.png',rect=[col*32,row*32,32,32],opaque=True,productionReady=False,review='Source grid extracted from observed bounds. Wall joins/corners, doorway continuity and mixed-size architectural details still need assembly refinement.'))
watlas.save(out/'interior-walls-housing-v1.png')
review=Image.new('RGB',(1024,768),'#eee3d2')
review.paste(fatlas.resize((512,512),Image.Resampling.NEAREST),(0,0))
review.paste(watlas.resize((768,512),Image.Resampling.NEAREST),(0,256))
review.save(out/'interior-tiles-housing-v1-review.png')
# Exact source sampling/exports documented; no animation indexes.
(out/'tilesets-first-batch.json').write_text(json.dumps(dict(tool='built-in image_gen',nativeTileSize=[32,32],status='style-review',assets=entries,limitations=['Floor texture edges match mathematically, but joint visual tiling needs review.','Walls and architectural modules are draft exports; not certified production-ready.']),indent=2))
print(f'Saved {len(entries)} individual native tiles and two atlases.')
# Share a limited palette within each complete atlas, then re-slice without interpolation.
for atlas,subset,columns in [('interior-floors-housing-v1.png',entries[:16],4),('interior-walls-housing-v1.png',entries[16:],6)]:
    image=Image.open(out/atlas).convert('RGB').quantize(colors=48,dither=Image.Dither.NONE).convert('RGBA')
    image.save(out/atlas)
    for entry in subset:
        x,y,width,height=entry['rect']; image.crop((x,y,x+width,y+height)).save(out/Path(entry['file']).name)
