from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'public/assets/game'; refs=root/'housing/references'
files=[root/'housing/tilesets/interior-floors-housing-v1.png',root/'housing/furniture/sofa-housing-v1.png',root/'housing/furniture/table-housing-v1.png',root/'housing/pet-furniture/cat-bed-housing-v1.png',root/'housing/pet-furniture/scratching-post-housing-v1.png',root/'housing/pet-furniture/feeding-bowl-full-housing-v1.png',root/'animals/cats/orange-tabby-idle-housing-v1.png',root/'characters/base/rescuer-idle-housing-v1.png']
review=Image.new('RGBA',(1024,512),(243,232,210,255)); entries=[]
for idx,path in enumerate(files):
    i=Image.open(path).convert('RGBA'); x=(idx%4)*256;y=(idx//4)*256
    if idx==0:
        review.alpha_composite(i,(x+64,y))
        review.alpha_composite(Image.open(root/'housing/tilesets/interior-walls-housing-v1.png').convert('RGBA'),(x+32,y+128))
    else:
        scale=min(4,224//i.width,224//i.height)
        view=i.resize((i.width*scale,i.height*scale),Image.Resampling.NEAREST)
        review.alpha_composite(view,(x+(256-view.width)//2,y+(256-view.height)//2))
    alpha=sorted(set(i.getchannel('A').get_flattened_data()))
    entries.append(dict(group=idx+1,file='/assets/game/'+str(path.relative_to(root)),width=i.width,height=i.height,alphaValues=alpha,colorCount=len(i.getcolors(i.width*i.height) or []),status='style-review',productionReady=False))
review.convert('RGB').save(refs/'housing-first-batch-v1-review.png')
manifest=dict(version='housing-first-batch-v1',generationTool='built-in image_gen',scope='Only first eight asset groups; assets only, no gameplay or interface changes',referenceSheet='/assets/game/housing/references/housing-first-batch-v1-review.png',assets=entries,tilesetManifest='/assets/game/housing/tilesets/tilesets-first-batch.json',promptFiles=['/assets/game/housing/references/first-batch-prompts.json','/assets/game/housing/furniture/furniture-first-batch-prompts.json','/assets/game/housing/pet-furniture/pet-furniture-first-batch.json','/assets/game/animals/cats/housing-idle-first-batch.json','/assets/game/characters/base/housing-idle-first-batch.json'],limitations=['Walls/corners require assembly refinement; not production approved.','Single idle poses only; no animation frames are implied.','Collision footprints are proposals, not engine-verified.'])
(root/'housing-first-batch-v1.json').write_text(json.dumps(manifest,indent=2))
print('Updated eight-group review sheet and dimension/alpha/color manifest.')
