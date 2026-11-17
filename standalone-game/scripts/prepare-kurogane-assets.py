"""Production exports for the original cyberpunk robot, without touching prior bosses."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/monster-studio/kurogane-neon-bastion'
OUT = ROOT / 'public/pawtrail-game/monsters/kurogane-neon-bastion/v1'
OUT.mkdir(parents=True, exist_ok=True)
CELL = 256

def fit(image, size, padding=8):
    image = image.convert('RGBA')
    image.putalpha(image.getchannel('A').point(lambda a: 255 if a > 170 else 0))
    bounds = image.getchannel('A').getbbox()
    if bounds:
        image = image.crop(bounds)
    ratio = min((size-padding*2)/image.width, (size-padding*2)/image.height)
    image = image.resize((max(1, round(image.width*ratio)), max(1, round(image.height*ratio))), Image.Resampling.NEAREST)
    result = Image.new('RGBA', (size, size))
    result.alpha_composite(image, ((size-image.width)//2, (size-image.height)//2))
    return result

def save(image, path):
    image.quantize(colors=160, method=Image.Quantize.FASTOCTREE,
                   dither=Image.Dither.NONE).convert('RGBA').save(path, lossless=True, method=6)

image = Image.open(SOURCE/'illustration-master.png').convert('RGBA')
for i, name in enumerate(('normal', 'enraged')):
    save(fit(image.crop((i*image.width//2, 0, (i+1)*image.width//2, image.height)), 384), OUT/(name+'.webp'))
image = Image.open(SOURCE/'parts-master.png').convert('RGBA')
atlas = Image.new('RGBA', (CELL*4, CELL*4))
for i in range(16):
    x, y = i % 4, i // 4
    crop = image.crop((x*image.width//4+5, y*image.height//4+5,
                       (x+1)*image.width//4-5, (y+1)*image.height//4-5))
    atlas.alpha_composite(fit(crop, CELL, 10), (x*CELL, y*CELL))
save(atlas, OUT/'parts.webp')
image = Image.open(SOURCE/'portraits-master.png').convert('RGBA')
portraits = Image.new('RGBA', (384, 256))
for i in range(6):
    x, y = i % 3, i // 3
    portraits.alpha_composite(fit(image.crop((x*image.width//3, y*image.height//2,
                                             (x+1)*image.width//3, (y+1)*image.height//2)), 128, 2), (x*128, y*128))
save(portraits, OUT/'portraits.webp')
save(portraits.crop((0, 0, 128, 128)), OUT/'portrait.webp')
fit(portraits.crop((0, 0, 128, 128)), 64, 2).save(OUT/'icon.png', optimize=True)
manifest = {'id':'kurogane-neon-bastion','version':1,'representation':'native-articulated-2d',
 'atlas':'parts.webp','cellWidth':CELL,'cellHeight':CELL,'columns':4,'rows':4,'enragedFrameOffset':8,
 'parts':{'head':0,'torso':1,'leftArm':2,'rightArm':3,'leftLeg':4,'rightLeg':5,'funnel':6,'emitter':7},
 'anchors':{'armShoulder':[.5,.9],'legFoot':[.5,.06]},
 'worldScale':{'nominalHeight':7.5,'playerScaleChanged':False},
 'portrait':{'file':'portraits.webp','cellWidth':128,'cellHeight':128,'states':['alert','threatening','hurt'],'enragedRow':1},
 'illustrations':{'normal':'normal.webp','enraged':'enraged.webp','width':384,'height':384},
 'icon':{'file':'icon.png','width':64,'height':64},'decodedAtlasBytes':CELL*4*CELL*4*4,
 'provenance':'Built-in ImageGen, original cyberpunk identity. Hard-alpha cleanup and nearest-neighbor registration; exact prompts retained.',
 'runtimeArtworkBytes':{p.name:p.stat().st_size for p in OUT.iterdir() if p.suffix in ('.png','.webp')}}
for folder in (SOURCE, OUT):
    (folder/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
(OUT/'profile.json').write_text((SOURCE/'profile.json').read_text())
print(json.dumps(manifest['runtimeArtworkBytes']))
