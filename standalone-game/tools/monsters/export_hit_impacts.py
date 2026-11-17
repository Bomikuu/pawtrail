"""Native packing of original generated contact VFX, with the style reference kept private."""
from pathlib import Path
from PIL import Image
import json, shutil

ROOT = Path(__file__).resolve().parents[2]
AUTHORING = ROOT/'assets/combat-effects/hit-impact-v1'
RUNTIME = ROOT/'public/pawtrail-game/effects/hit-impact-v1'
MASTER = Path('/home/micxsz/.codex/generated_images/01a1b00f-0e2a-7211-a1a5-4b35d704dc9b/exec-ac16c6ce-9be9-4321-b420-ce2d76969d04.png')

def export():
    AUTHORING.mkdir(parents=True,exist_ok=True);RUNTIME.mkdir(parents=True,exist_ok=True)
    shutil.copy2(MASTER,AUTHORING/'generated-master.png')
    reference=Path('/tmp/codex-clipboard-1eb345bc-1078-4ec6-b373-ad3a47c86935.png')
    if reference.exists():shutil.copy2(reference,AUTHORING/'owner-style-reference.png')
    source=Image.open(AUTHORING/'generated-master.png').convert('RGBA')
    atlas=Image.new('RGBA',(256,384));frames=[]
    for row in range(6):
        for col in range(4):
            frame=source.crop((col*source.width//4,row*source.height//6,(col+1)*source.width//4,(row+1)*source.height//6)).resize((64,64),Image.Resampling.NEAREST)
            frames.append(frame);atlas.paste(frame,(col*64,row*64))
    atlas.save(RUNTIME/'impact-atlas.png',optimize=True)
    clips={}
    for name,first,duration in [('slash',0,1000/3),('weak',8,375),('fire',16,1000*5/12)]:
        sequence=frames[first:first+8]
        sequence[0].save(AUTHORING/(name+'-preview.webp'),save_all=True,append_images=sequence[1:],duration=round(duration/8),loop=0,lossless=True,method=6)
        clips[name]={'firstFrame':first,'frames':8,'durationMs':duration}
    manifest={'version':1,'id':'confirmed-hit-impact-v1','generation':'built-in ImageGen','file':'impact-atlas.png','frameWidth':64,'frameHeight':64,'columns':4,'rows':6,'frames':24,'anchor':[32,32],'transparent':True,'clips':clips,'maximumVisibleImpacts':12,'bytes':(RUNTIME/'impact-atlas.png').stat().st_size,'trigger':'actual accepted damage/contact event at target position','reducedMotion':'peak authored frame, held briefly','review':'native artwork inspected; live encounter review pending'}
    for folder in [AUTHORING,RUNTIME]:(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print('Exported impact atlas:',RUNTIME/'impact-atlas.png')

if __name__=='__main__':export()
