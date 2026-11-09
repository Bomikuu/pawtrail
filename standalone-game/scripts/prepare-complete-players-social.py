"""Prepare inspected built-in imagegen sheets. No runtime/UI modification."""
from pathlib import Path
from PIL import Image
import json,shutil
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'public/assets/game'
CFG=json.loads((ASSETS/'characters/player-generation-jobs-v2.json').read_text())
ACTIONS={'movement':['walk_down','walk_up','walk_left','walk_right','idle_down','idle_up','idle_left','idle_right'],'social':['wave','laugh','dance','clap','cheer','sit','sleep','give_gift','hold_item'],'care-decoration':['pet','feed','play','refill_water','clean','carry_supplies','pick_up_furniture','move_object','place_object','inspect_furniture']}
def clean(image):
 i=image.convert('RGBA');i.putalpha(i.getchannel('A').point(lambda a:255 if a>=180 else 0));return i
def bands(image):
 alpha=list(image.getchannel('A').get_flattened_data()); counts=[sum(v>0 for v in alpha[y*image.width:(y+1)*image.width]) for y in range(image.height)]
 intervals=[];start=None
 for y,c in enumerate(counts+[0]):
  if c>10 and start is None:start=y
  if c<=10 and start is not None:
   if y-start>15:intervals.append([start,y])
   start=None
 return intervals
def palette_sheet(image):
 rgb=image.convert('RGB').quantize(colors=48,dither=Image.Dither.NONE)
 return rgb
def remap(image,palette):
 alpha=image.getchannel('A');i=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');i.putalpha(alpha);return i
char_index={'generationMode':'built-in image_gen','frameWidth':32,'frameHeight':48,'appearanceCount':3,'variants':[],'productionReady':False,'notes':['Source rows were detected from alpha bands before slicing; actual rectangles are recorded.','Loop interpolation and human approval remain unverified.','Wide prop/crouch actions use a shared fit scale within each row; these action rows may need rigging refinement for perfect head-size continuity.','Holding-item source bottom clipping repaired at native shoe pixels using a separately generated four-frame strip.']}
for variant in ['rescuer','jacket-rescuer','braided-rescuer']:
 folder=ASSETS/'characters/animations'/variant;folder.mkdir(parents=True,exist_ok=True)
 jobs=[j for j in CFG['players'] if j['variant']==variant]
 strips=[];records=[]
 repair=next(j for j in jobs if j['group']=='holding-item-repair')
 repairimage=clean(Image.open(repair['source']));repairband=bands(repairimage)[0]
 for job in [j for j in jobs if j['group'] in ACTIONS]:
  image=clean(Image.open(job['source']));intervals=bands(image)
  if len(intervals)!=job['rows']: raise ValueError((variant,job['group'],intervals))
  sourcefile=folder/(job['group']+'-source-v2.png');shutil.copy2(job['source'],sourcefile)
  if 'previousSource' in job:shutil.copy2(job['previousSource'],folder/(job['group']+'-before-repair-source-v2.png'))
  for row,(action,(top,bottom)) in enumerate(zip(ACTIONS[job['group']],intervals)):
   frames=[];rects=[]
   for col in range(4):
    rect=[col*image.width//4,top,(col+1)*image.width//4,bottom]
    f=image.crop(rect);box=f.getbbox();frames.append(f.crop(box));rects.append(rect)
   factor=min(42/max(f.height for f in frames),28/max(f.width for f in frames))
   strip=Image.new('RGBA',(128,48));boxes=[]
   for col,f in enumerate(frames):
    f=f.resize((max(1,round(f.width*factor)),max(1,round(f.height*factor))),Image.Resampling.NEAREST)
    canvas=Image.new('RGBA',(32,48));canvas.paste(f,((32-f.width)//2,46-f.height))
    if action=='hold_item' and bottom==image.height:
     # Keep the original identity/pose; replace ONLY the two lowermost shoe rows.
     rf=repairimage.crop((col*repairimage.width//4,repairband[0],(col+1)*repairimage.width//4,repairband[1]));rf=rf.crop(rf.getbbox());rf=rf.resize((f.width,f.height),Image.Resampling.NEAREST)
     canvas.paste(rf.crop((0,max(0,rf.height-2),rf.width,rf.height)),((32-f.width)//2,44))
    strip.paste(canvas,(col*32,0));boxes.append(list(canvas.getbbox()))
   strips.append(strip)
   records.append({'id':action,'file':action+'-v2.png','frameWidth':32,'frameHeight':48,'frames':4,'frameRate':6 if action.startswith('walk') else 4,'repeat':-1 if action.startswith(('walk','idle')) else 0,'anchorPixels':[16,46],'source':str(sourcefile.relative_to(ASSETS)),'sourceFrameRectsXYXY':rects,'nativeOccupiedBounds':boxes,'motionDistinctFrames':None,'sourceClippingRepaired':action=='hold_item' and bottom==image.height,'identityReview':'source images visually inspected; jacket care long trousers repaired with targeted imagegen edit','loopReview':'not playback-certified','productionReady':False})
  (folder/(job['group']+'-prompt-v2.json')).write_text(json.dumps(job,indent=2))
 shutil.copy2(repair['source'],folder/'hold-item-repair-source-v2.png');(folder/'hold-item-repair-prompt-v2.json').write_text(json.dumps(repair,indent=2))
 atlas=Image.new('RGBA',(128,len(strips)*48))
 for idx,strip in enumerate(strips):atlas.paste(strip,(0,idx*48))
 palette=palette_sheet(atlas);atlas=remap(atlas,palette)
 for idx,record in enumerate(records):
  strip=atlas.crop((0,idx*48,128,(idx+1)*48));strip.save(folder/record['file']);record['atlasRect']=[0,idx*48,128,48];record['motionDistinctFrames']=len({strip.crop((c*32,0,(c+1)*32,48)).tobytes() for c in range(4)})
 atlas.save(folder/'complete-v2.png');atlas.resize((384,len(strips)*144),Image.Resampling.NEAREST).save(folder/'complete-review-v2.png')
 data={'variant':variant,'atlas':'complete-v2.png','frameWidth':32,'frameHeight':48,'animations':records,'productionReady':False};(folder/'manifest-v2.json').write_text(json.dumps(data,indent=2));char_index['variants'].append({'id':variant,'file':'/assets/game/'+str((folder/'complete-v2.png').relative_to(ASSETS)),'manifest':'/assets/game/'+str((folder/'manifest-v2.json').relative_to(ASSETS)),'animationCount':len(records),'frameCount':len(records)*4})
char_index['animationCount']=sum(v['animationCount'] for v in char_index['variants']);char_index['frameCount']=sum(v['frameCount'] for v in char_index['variants']);(ASSETS/'characters/complete-characters-manifest.json').write_text(json.dumps(char_index,indent=2))
# Effects have two four-frame horizontal animations per source row.
effect_index={'generationMode':'built-in image_gen','frameWidth':32,'frameHeight':32,'animations':[],'productionReady':False}
for group,names in [('emotes',['happy','laughing','heart','wave','sad','surprised','confused','angry','sleepy','thumbs_up','celebration','paw']),('particles',['floating_hearts','sparkles','question','exclamation','stars','friendship','pet_affection','kibble_reward','quest_complete'])]:
 job=CFG[group];folder=ASSETS/'effects'/group;image=clean(Image.open(job['source']));shutil.copy2(job['source'],folder/'complete-source-v2.png');(folder/'complete-prompts-v2.json').write_text(json.dumps(job,indent=2))
 atlas=Image.new('RGBA',(128,len(names)*32));records=[]
 for idx,name in enumerate(names):
  row,half=divmod(idx,2);frames=[];rects=[]
  for c in range(4):
   col=half*4+c;left=col*image.width//8;top=row*image.height//job['rows'];right=(col+1)*image.width//8;bottom=(row+1)*image.height//job['rows'];inset=6 if group=='particles' else 2
   f=image.crop((left+inset,top+inset,right-inset,bottom-inset));box=f.getbbox()
   if not box:raise ValueError((group,name,c,'empty cell'))
   frames.append(f.crop(box));rects.append([left+inset,top+inset,right-inset,bottom-inset])
  factor=min(28/max(f.width for f in frames),28/max(f.height for f in frames));strip=Image.new('RGBA',(128,32))
  for c,f in enumerate(frames):
   f=f.resize((max(1,round(f.width*factor)),max(1,round(f.height*factor))),Image.Resampling.NEAREST);strip.paste(f,(c*32+(32-f.width)//2,(32-f.height)//2))
  atlas.paste(strip,(0,idx*32));records.append({'id':name,'file':name+'-v2.png','frameWidth':32,'frameHeight':32,'frames':4,'frameRate':6,'anchorPixels':[16,16],'sourceFrameRectsXYXY':rects,'productionReady':False,'loopReview':'four visually distinct sequential poses inspected; playback timing not certified'})
 palette=palette_sheet(atlas);atlas=remap(atlas,palette);atlas.save(folder/'complete-v2.png');atlas.resize((512,len(names)*128),Image.Resampling.NEAREST).save(folder/'complete-review-v2.png')
 for idx,record in enumerate(records):
  strip=atlas.crop((0,idx*32,128,(idx+1)*32));strip.save(folder/record['file']);record['atlasRect']=[0,idx*32,128,32];record['distinctFrames']=len({strip.crop((c*32,0,(c+1)*32,32)).tobytes() for c in range(4)});record['file']='/assets/game/'+str((folder/record['file']).relative_to(ASSETS));effect_index['animations'].append(record)
 (folder/'manifest-v2.json').write_text(json.dumps({'group':group,'animations':records,'productionReady':False},indent=2))
effect_index['animationCount']=len(effect_index['animations']);effect_index['frameCount']=len(effect_index['animations'])*4;(ASSETS/'effects/complete-effects-manifest.json').write_text(json.dumps(effect_index,indent=2))
print('Prepared',char_index['animationCount'],'player action strips /',char_index['frameCount'],'frames and',effect_index['animationCount'],'effects /',effect_index['frameCount'],'frames.')
# Flatten review-only backdrops so viewers cannot misinterpret hidden alpha RGB.
for group,count in [('emotes',12),('particles',9)]:
 folder=ASSETS/'effects'/group
 view=Image.open(folder/'complete-v2.png').convert('RGBA').resize((512,count*128),Image.Resampling.NEAREST)
 bg=Image.new('RGBA',view.size,'#f3e8d2');bg.alpha_composite(view);bg.convert('RGB').save(folder/'complete-review-v2.png')
sheet=Image.new('RGBA',(576,864),'#f3e8d2')
for vi,v in enumerate(char_index['variants']):
 path=ASSETS/v['manifest'].removeprefix('/assets/game/');data=json.loads(path.read_text())
 for ai,record in enumerate(data['animations']):
  im=Image.open(path.parent/record['file']).convert('RGBA')
  record['checks']={'nativeDimensions':im.size==(128,48),'binaryAlpha':set(im.getchannel('A').get_flattened_data())<={0,255},'nonemptyFrames':all(im.crop((c*32,0,(c+1)*32,48)).getbbox() for c in range(4))}
  record['nativeMotionPresent']=record['motionDistinctFrames']>=2
  preview=im.crop((0,0,32,48)).resize((64,96),Image.Resampling.NEAREST);sheet.alpha_composite(preview,((vi*3+ai%3)*64,(ai//3)*96))
 path.write_text(json.dumps(data,indent=2))
sheet.convert('RGB').save(ASSETS/'characters/complete-characters-review-v2.png')
