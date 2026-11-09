"""Prepare only generated housing-cat sources; never invent poses or animation rows."""
from pathlib import Path
from PIL import Image
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/game/animals/cats/housing-v2'
VARIANTS=['orange-tabby','black-cat','white-cat','gray-tabby','calico','tuxedo','siamese','brown-tabby','cream-cat','gray-white']
ACTIONS=['standing','sitting','blink','tail_swish','walk_down','walk_up','walk_left','walk_right','lie_down','sleep','stretch','eat','drink','pet','happy','play','groom','approach','jump_sofa','sofa_sit','bed_sleep','scratch_post','cat_tree_play']
FLOOR_ALIGNED={'standing','sitting','blink','tail_swish','walk_down','walk_up','walk_left','walk_right','approach','sofa_sit'}
ONESHOT={'lie_down','stretch','jump_sofa'}
masters={};source_details={}
for variant in VARIANTS:
    image=Image.open(OUT/'sources'/f'{variant}-source.png').convert('RGBA')
    if image.size!=(1024,1536): raise ValueError(f'Inspect source grid for {variant}: unexpected size{image.size}')
    image.putalpha(image.getchannel('A').point(lambda a:255 if a>=128 else 0))
    empty=image.crop((512,1408,1024,1536)).getbbox()
    if empty: raise ValueError(f'{variant}: expected final four source cells to be empty, got{empty}')
    atlas=Image.new('RGBA',(384,576))
    for index in range(92):
        c,r=index%8,index//8
        cell=image.crop((c*128,r*128,(c+1)*128,(r+1)*128)).resize((38,38),Image.Resampling.NEAREST)
        frame=Image.new('RGBA',(48,48));frame.paste(cell,(5,8));box=frame.getbbox()
        if not box: raise ValueError(f'{variant}: empty frame{index}')
        action=ACTIONS[index//4]
        if action in FLOOR_ALIGNED:
            shifted=Image.new('RGBA',(48,48));shifted.paste(frame,(0,46-box[3]));frame=shifted
        atlas.paste(frame,(c*48,r*48))
    masters[variant]=atlas
    source_details[variant]={'sourceSize':[1024,1536],'observedGrid':[8,12],'emptyCells':[92,93,94,95]}
# A single64-color palette for all ten variants. Colors sampled only from visible pixels.
colors=[]
for image in masters.values():
    colors.extend((r,g,b) for r,g,b,a in image.get_flattened_data() if a)
sample=Image.new('RGB',(len(colors),1));sample.putdata(colors)
palette=sample.quantize(colors=64,dither=Image.Dither.NONE)
palette_img=Image.new('P',(1,1));palette_img.putpalette(palette.getpalette())
manifest={'version':'housing-cats-v2','generationMode':'built-in image_gen','frameWidth':48,'frameHeight':48,'framesPerAction':4,'variants':[],'requiredActions':ACTIONS,'aliases':{'rest_sit':'sitting'},'productionReady':False,'limitations':['Generated source poses and native strips cover all requested actions, but seamless-loop timing and subtle pose motion are not certified.','Furniture interactions are animal-only compositing layers, not precomposed furniture.','Sitting appears in both idle/rest requirements and uses the same sitting strip, explicitly aliased.'],'postprocessing':'Observed8x12 source grids with23four-frame groups. Fixed38x38 sample in48x48 cells; alpha128 threshold, nearest-neighbor only, shared64-color palette, fixed walking/idle baseline46. No repeated or relabeled poses invented.'}
contact=Image.new('RGBA',(960,192),'#f3e8d2')
for n,(variant,image) in enumerate(masters.items()):
    alpha=image.getchannel('A');image=image.convert('RGB').quantize(palette=palette_img,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
    folder=OUT/variant;folder.mkdir(exist_ok=True)
    image.save(folder/f'{variant}-housing-v2.png')
    anims={};issues=[]
    for action_index,action in enumerate(ACTIONS):
        strip=Image.new('RGBA',(192,48));rects=[];frame_hashes=[];bounds=[]
        framefolder=folder/'frames'/action;framefolder.mkdir(parents=True,exist_ok=True)
        for f in range(4):
            index=action_index*4+f;c,r=index%8,index//8;rect=[c*48,r*48,48,48]
            frame=image.crop((rect[0],rect[1],rect[0]+48,rect[1]+48))
            strip.paste(frame,(f*48,0));frame.save(framefolder/f'{f}.png');rects.append(rect)
            frame_hashes.append(hashlib.sha256(frame.tobytes()).hexdigest());bounds.append(list(frame.getbbox()))
        strip.save(folder/f'{action}.png')
        unique=len(set(frame_hashes))
        if unique<4: issues.append(f'{action}: {unique} unique native poses of4; low-motion/symmetric endpoints may repeat')
        anims[action]={'file':f'{variant}/{action}.png','frames':4,'frameRate':8 if action.startswith('walk') or action=='approach' else 5,'loop':action not in ONESHOT,'loopVerified':False,'sourceFrameIndexes':list(range(action_index*4,action_index*4+4)),'atlasRects':rects,'anchorPixels':[24,46],'bounds':bounds,'uniqueNativeFrames':unique,'motionReview':'Source action inspected; native loop requires playback/animation polish review','productionReady':False}
    record={'id':variant,'file':f'{variant}/{variant}-housing-v2.png','source':f'sources/{variant}-source.png','prompt':f'prompts/{variant}.txt','dimensions':[384,576],'visibleFrames':92,'gridCells':96,'sourceInspection':source_details[variant],'alphaValues':sorted(set(alpha.get_flattened_data())),'animations':anims,'notes':issues,'productionReady':False}
    manifest['variants'].append(record)
    (folder/'manifest.json').write_text(json.dumps(record,indent=2))
    # Representative standing + sidewalk at native3x, no labels baked in.
    for j,index in enumerate([0,24]):
        frame=image.crop(((index%8)*48,(index//8)*48,(index%8+1)*48,(index//8+1)*48)).resize((96,96),Image.Resampling.NEAREST)
        contact.alpha_composite(frame,(n*96,j*96))
    # Full sheet pixel inspection export at2x.
    bg=Image.new('RGBA',image.size,'#f3e8d2');bg.alpha_composite(image)
    bg.convert('RGB').resize((768,1152),Image.Resampling.NEAREST).save(folder/'review.png')
manifest['palette']=['#%02x%02x%02x'%tuple(palette.getpalette()[j:j+3]) for j in range(0,192,3)]
contact.convert('RGB').save(OUT/'all-cats-review.png')
(OUT/'complete-cats-manifest.json').write_text(json.dumps(manifest,indent=2))
print(json.dumps({'variants':len(manifest['variants']),'actionsPerVariant':len(ACTIONS),'visibleFrames':920,'nativeAtlases':10,'nativeStrips':230,'alphaValues':[0,255],'paletteColors':64,'productionReady':False},indent=2))
