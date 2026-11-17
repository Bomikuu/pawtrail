"""Native authoring export for approved F01 batch A; no world sync or app checks."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
JOB = ROOT / 'assets/floors/f01-neon-heights/batch-a-v1'
OUT = ROOT / 'public/pawtrail-game/floors/f01/batch-a-v1'
URL = '/pawtrail-game/floors/f01/batch-a-v1'

def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, optimize=True)

def resize(image, size):
    # This host's Pillow resize kernel fails; the equivalent nearest affine
    # export preserves native pixel sampling without a dependency change.
    return image.transform(size, Image.Transform.AFFINE, (image.width/size[0],0,0,0,image.height/size[1],0), Image.Resampling.NEAREST)

def export():
    OUT.mkdir(parents=True, exist_ok=True)
    for key, size in [('lobby-ground',(1024,896)),('market-ground',(1024,896)),('lobby-wall',(320,160)),('repair-bay',(240,208)),('awning-stall',(208,176)),('clinic-canopy',(240,192))]:
        source = Image.open(JOB / 'sources' / (key+'.png')).convert('RGBA')
        save(resize(source,size), OUT / (key+'.png'))
    source = Image.open(JOB / 'sources/koi-tail-atlas.png').convert('RGBA')
    atlas = Image.new('RGBA', (256,96))
    for row in range(2):
        for col in range(4):
            cell = source.crop((round(col*source.width/4),round(row*source.height/2),round((col+1)*source.width/4),round((row+1)*source.height/2)))
            scale=min(64/cell.width,48/cell.height)
            cell=resize(cell,(round(cell.width*scale),round(cell.height*scale)))
            atlas.alpha_composite(cell,(col*64+(64-cell.width)//2,row*48+(48-cell.height)//2))
    save(atlas,OUT/'koi-tail-atlas.png')
    # Generated paint patches are real model materials, never a billboard model.
    patches = {
        'lift': {'door-left':(.233,.35,.303,.81),'door-right':(.313,.35,.382,.81),'metal':(.14,.33,.19,.67),'side':(.71,.37,.79,.82),'back':(.25,1.4,.40,1.88)},
        'allocation': {'screen-cyan':(.147,.25,.228,.46),'screen-pink':(.279,.25,.365,.46),'metal':(.13,.54,.19,.76),'back':(.23,1.42,.45,1.82)},
        'planning': {'map':(.244,.25,.400,.55),'metal':(.16,.23,.19,.56),'wood':(.3,1.48,.4,1.58)},
        'counter': {'drawer':(.155,.65,.231,.83),'metal':(.09,.49,.14,.79),'wood':(.2,.41,.27,.46),'display':(.295,.34,.469,.54)}
    }
    for key, regions in patches.items():
        source=Image.open(JOB/'sources'/f'{key}-reference.png').convert('RGBA')
        # Coordinates measured in fractions of one half-height / full sheet width.
        for name,(l,t,r,b) in regions.items():
            image=source.crop((round(l*source.width),round(t*source.height/2),round(r*source.width),round(b*source.height/2)))
            save(resize(image,(128,128)),OUT/'textures'/f'{key}-{name}.png')
    print(str(OUT))

if __name__ == '__main__': export()
