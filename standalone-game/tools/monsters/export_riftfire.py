"""Pack the generated full-frame VFX drawings into a native, shared runtime atlas."""
from pathlib import Path
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[2]
AUTHORING = ROOT / 'assets/monster-studio/vaelrith-riftbound/effects/riftfire-v1'
RUNTIME = ROOT / 'public/pawtrail-game/monsters/vaelrith-riftbound/effects/riftfire-v1'
MASTER = Path('/home/micxsz/.codex/generated_images/01a1b00f-0e2a-7211-a1a5-4b35d704dc9b/exec-882144d1-dc6a-4d8b-8a12-6584a6ade6af.png')

def export():
    AUTHORING.mkdir(parents=True, exist_ok=True); RUNTIME.mkdir(parents=True, exist_ok=True)
    shutil.copy2(MASTER, AUTHORING / 'generated-master.png')
    source = Image.open(AUTHORING / 'generated-master.png').convert('RGBA')
    atlas = Image.new('RGBA', (256, 384))
    for row in range(4):
        for col in range(4):
            cell = source.crop((col*source.width//4,row*source.height//4,(col+1)*source.width//4,(row+1)*source.height//4))
            atlas.paste(cell.resize((64,96),Image.Resampling.NEAREST),(col*64,row*96))
    atlas.save(RUNTIME/'fire-atlas.png',optimize=True)
    frames = [atlas.crop(((i%4)*64,(i//4)*96,(i%4+1)*64,(i//4+1)*96)) for i in range(16)]
    frames[0].save(AUTHORING/'fire-preview.webp',save_all=True,append_images=frames[1:],duration=67,loop=0,lossless=True,method=6)
    manifest = {'version':1,'id':'vaelrith-riftfire','source':'generated-master.png','generation':'built-in image_gen',
                'file':'fire-atlas.png','frameWidth':64,'frameHeight':96,'columns':4,'rows':4,'frames':16,
                'anchor':[32,88],'frameMs':1000/15,'intro':[0,1,2,3],'loop':[4,5,6,7,8,9,10,11],'outro':[12,13,14,15],
                'rendering':'nearest-neighbor; shared atlas; pool of eight sprites','transparent':True,
                'bytes':(RUNTIME/'fire-atlas.png').stat().st_size,'review':'native artwork inspected; live motion review pending'}
    for folder in [AUTHORING,RUNTIME]: (folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Authored Riftfire atlas:',RUNTIME/'fire-atlas.png')
if __name__=='__main__': export()
