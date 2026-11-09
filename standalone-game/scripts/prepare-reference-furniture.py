"""Export the owner-authorized reference furniture with exact native cells and binary alpha."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/game/housing/furniture/reference-v3'
OUT.mkdir(parents=True, exist_ok=True)
seating = Image.open(ROOT / 'assets/room-v2/seating-source-v1.png').convert('RGBA')
details = Image.open(ROOT / 'assets/room-v2/details-source-v1.png').convert('RGBA')

def cell(image, col, row, rows):
    return (image.width * col // 2, image.height * row // rows,
            image.width * (col + 1) // 2, image.height * (row + 1) // rows)

specs = [
    ('sage-loveseat-east','Sage loveseat · faces right',seating,cell(seating,0,0,2),(64,96),[32,96],[16,32,32,64],True,'Living room','sit',95),
    ('sage-loveseat-west','Sage loveseat · faces left',seating,cell(seating,1,0,2),(64,96),[32,96],[16,32,32,64],True,'Living room','sit',95),
    ('round-flower-table','Round daisy coffee table',seating,cell(seating,0,1,2),(64,64),[32,64],[6,36,52,28],True,'Living room','inspect',65),
    ('woven-area-rug','Honey woven area rug',seating,cell(seating,1,1,2),(128,96),[64,96],None,False,'Decor','inspect',45),
    ('sage-chaise','Sage window chaise',details,cell(details,0,0,3),(96,64),[48,64],[8,40,80,24],True,'Living room','sit',85),
    ('lantern-cabinet','Lantern bedside cabinet',details,cell(details,1,0,3),(32,64),[16,64],[3,48,26,16],True,'Bedroom','inspect',45),
    ('wicker-display-cabinet','Wicker display cabinet',details,cell(details,0,1,3),(64,96),[32,96],[8,72,48,24],True,'Living room','inspect',85),
    ('bamboo-window','Bamboo garden window',details,cell(details,1,1,3),(64,64),[32,64],None,False,'Decor','inspect',35),
    ('woven-runner','Woven welcome runner',details,cell(details,0,2,3),(64,128),[32,128],None,False,'Decor','inspect',35),
    ('double-feeding-tray','Double feeding tray',details,cell(details,1,2,3),(64,32),[16,32],[4,16,56,16],True,'Pet essentials','feed',35),
]
palette = Image.new('P',(1,1))
palette.putpalette(json.loads((ROOT/'public/assets/game/housing/furniture/cozy-room-v1/manifest.json').read_text())['palette'] + [0]*(768-192))
catalog_path = ROOT/'src/game/housing/catalog.json'
catalog = json.loads(catalog_path.read_text())
manifest = {'version':3,'tileSize':32,'lighting':'upper-left','perspective':'top-down-three-quarter','generation':'built-in image_gen','prompts':'assets/room-v2/prompts.json','alpha':'binary; translucent generator glow removed under prior owner authorization','assets':[]}
for identifier,label,source,rect,size,anchor,footprint,blocking,category,interaction,price in specs:
    sprite=source.crop(rect)
    sprite.putalpha(sprite.getchannel('A').point(lambda a:255 if a>=245 else 0))
    sprite=sprite.crop(sprite.getbbox())
    ratio=min((size[0]-2)/sprite.width,(size[1]-2)/sprite.height)
    sprite=sprite.resize((max(1,round(sprite.width*ratio)),max(1,round(sprite.height*ratio))),Image.Resampling.NEAREST)
    image=Image.new('RGBA',size);image.alpha_composite(sprite,((size[0]-sprite.width)//2,size[1]-sprite.height))
    alpha=image.getchannel('A')
    image=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
    file='/assets/game/housing/furniture/reference-v3/'+identifier+'.png'
    image.save(ROOT/('public'+file),optimize=True)
    item=dict(id=identifier,label=label,file=file,width=size[0],height=size[1],anchor=anchor,footprint=footprint,blocking=blocking,rotatable=False,category=category,interaction=interaction,price=price,zones=['interior'])
    catalog['items']=[i for i in catalog['items'] if i['id']!=identifier]+[item]
    manifest['assets'].append({**item,'sourceCell':rect,'frames':1})
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
catalog_path.write_text(json.dumps(catalog,indent=2)+'\n')
(ROOT/'backend/housing/catalog.json').write_text(json.dumps(catalog,indent=2)+'\n')
