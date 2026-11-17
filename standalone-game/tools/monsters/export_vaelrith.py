"""Native artwork packing and original cue authoring; not an application test."""
from pathlib import Path
from PIL import Image
import json, shutil, wave, math, random, struct

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'assets/monster-studio/vaelrith-riftbound'
OUT = ROOT / 'public/pawtrail-game/monsters/vaelrith-riftbound/v1'
GENERATED = Path('/home/micxsz/.codex/generated_images/01a1b00f-0e2a-7211-a1a5-4b35d704dc9b')
FILES = {
    'portraits': 'exec-1462215a-3925-409a-9979-44ca6a8af383.png',
    'illustration': 'exec-d6ab137c-0da8-475f-b7a1-bb4bf776b278.png',
    'textures': 'exec-0b8b261c-e267-493c-bb94-4afec477aab2.png',
}

def export():
    OUT.mkdir(parents=True, exist_ok=True)
    for kind, filename in FILES.items():
        shutil.copy2(GENERATED / filename, SOURCE / 'art' / (kind + '-source.png'))
    def save(image, name):
        image.save(OUT / name, lossless=True, method=6)
    def sheet(kind, cols, rows, size):
        image = Image.open(SOURCE / 'art' / (kind + '-source.png')).convert('RGBA')
        packed = Image.new('RGBA', (cols * size[0], rows * size[1]))
        for row in range(rows):
            for col in range(cols):
                box = (col*image.width//cols, row*image.height//rows,
                       (col+1)*image.width//cols, (row+1)*image.height//rows)
                frame = image.crop(box).resize(size, Image.Resampling.NEAREST)
                packed.paste(frame, (col*size[0], row*size[1]))
        save(packed, kind + '.webp')
        return packed
    portraits = sheet('portraits', 3, 2, (128, 128))
    illustration = sheet('illustration', 2, 2, (384, 256))
    # The approved front head supplies the icon, separate from portrait playback.
    face = portraits.crop((8, 0, 120, 112)).resize((48, 48), Image.Resampling.NEAREST)
    face.save(OUT / 'icon.png', optimize=True)
    portraits.crop((8, 0, 120, 112)).resize((40, 40), Image.Resampling.NEAREST).save(OUT / 'icon-framed.png', optimize=True)
    save(illustration.crop((0, 0, 384, 256)), 'poster.webp')
    concept = Image.open(SOURCE / 'art/concept-v1.png')
    save(concept.resize((480, 270), Image.Resampling.NEAREST), 'concept.webp')
    textures = Image.open(SOURCE / 'art/textures-source.png').convert('RGB')
    for index, material in enumerate(['armor', 'throat', 'stone', 'horn']):
        x, y = index % 2, index // 2
        tile = textures.crop((x*textures.width//2,y*textures.height//2,
                              (x+1)*textures.width//2,(y+1)*textures.height//2))
        tile.resize((128,128),Image.Resampling.NEAREST).save(OUT / (material+'.png'), optimize=True)
    # Original synthesized, nonverbal cues. Existing effects mixer handles playback.
    for index, (name, duration, pitch) in enumerate([
        ('awakening',1.25,62),('warning',.8,92),('breath',1.25,115),
        ('hurt',.42,145),('stagger',.75,78),('defeat',1.6,52)]):
        rng = random.Random(410+index); rate = 16000; low = 0.; samples = []
        for frame in range(int(rate*duration)):
            t=frame/rate; p=t/duration; low=low*.84+rng.uniform(-1,1)*.16
            envelope=min(1,t/.08)*max(0,1-p)**.7
            f=pitch*(1-.35*p)
            tone=math.sin(2*math.pi*f*t+math.sin(2*math.pi*17*t)*.8)
            rasp=math.sin(2*math.pi*f*1.503*t)*.24+low*.7
            value=math.tanh((tone*.5+rasp)*1.4)*envelope*.48
            samples.append(struct.pack('<h',int(value*32767)))
        with wave.open(str(OUT/(name+'.wav')),'wb') as stream:
            stream.setparams((1,2,rate,0,'NONE','not compressed'))
            stream.writeframes(b''.join(samples))
    profile = json.loads((SOURCE/'profile.json').read_text())
    prior = json.loads((SOURCE/'manifest.json').read_text()) if (SOURCE/'manifest.json').exists() else {}
    manifest = {
        'version':1,'id':'vaelrith-riftbound','revision':'v1',
        'portrait':{'file':'portraits.webp','frame':[128,128],'grid':[3,2],
                    'expressions':{'watchful':[0,3],'threatening':[1,4],'hurt':[2,5]},
                    'angles':['front','three-quarter','head-tilt'],
                    'bundleBytes':(OUT/'portraits.webp').stat().st_size},
        'icon':{'file':'icon.png','nativeSize':[48,48],'bytes':(OUT/'icon.png').stat().st_size,
                'framedFile':'icon-framed.png','framedNativeSize':[40,40]},
        'illustration':{'file':'illustration.webp','frame':[384,256],'grid':[2,2],
                        'sequence':[0,1,2,3,2,1],'frameMs':420,'poster':'poster.webp'},
        'materials':{key:key+'.png' for key in ['armor','throat','stone','horn']},
        'audio':{'original':True,'method':'deterministic procedural synthesis','cues':6},
        'review':{'design':'owner-approved','runtime':'pending; not authorized',
                  'animationSeam':'pending live review','sound':'pending listening'},
        'health':profile['health'],
    }
    for binding in ['model', 'effects', 'animation']:
        if binding in prior:
            manifest[binding] = prior[binding]
    manifest['portrait']['bundleBytes'] += len(json.dumps(manifest['portrait']).encode())
    manifest['runtimeAssetBytes'] = sum(f.stat().st_size for f in OUT.iterdir() if f.is_file() and f.name != 'manifest.json')
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (SOURCE/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Native assets authored:', OUT)

if __name__ == '__main__':
    export()
