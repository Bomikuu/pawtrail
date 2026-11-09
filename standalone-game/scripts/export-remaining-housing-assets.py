from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1]/'public/assets/game'
jobs=json.loads((root/'housing/references/remaining-root-sources.json').read_text())
colors=json.loads((root/'housing/furniture/furniture-first-batch.json').read_text())['palette']+['456b74','69989e','a3c4be','dbebd4','44423e','74736a','aaa799','ded6c0']
palette=Image.new('P',(1,1));rgb=[tuple(bytes.fromhex(c)) for c in colors];palette.putpalette([v for c in rgb for v in c]+list(rgb[-1])*(256-len(rgb)))
def clean_components(image):
 from collections import deque
 alpha=image.getchannel('A'); seen=set(); groups=[]
 for y in range(image.height):
  for x in range(image.width):
   if (x,y) in seen or not alpha.getpixel((x,y)): continue
   queue=deque([(x,y)]);seen.add((x,y));group=[]
   while queue:
    px,py=queue.popleft();group.append((px,py))
    for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(-1,1),(1,-1),(-1,-1)]:
     nx,ny=px+dx,py+dy
     if 0<=nx<image.width and 0<=ny<image.height and (nx,ny) not in seen and alpha.getpixel((nx,ny)):
      seen.add((nx,ny));queue.append((nx,ny))
   groups.append(group)
 if groups:
  maximum=max(map(len,groups))
  for group in groups:
   if len(group)<max(2,maximum*.20):
    for xy in group:image.putpixel(xy,(0,0,0,0))
 return image

def prepare(image,size,center=False):
 image=image.convert('RGBA');alpha=image.getchannel('A').point(lambda a:255 if a>=160 else 0);image.putalpha(alpha);image=clean_components(image);bounds=image.getbbox()
 if not bounds: raise ValueError('Empty source cell')
 image=image.crop(bounds);scale=min((size[0]-4)/image.width,(size[1]-4)/image.height)
 image=image.resize((max(1,int(image.width*scale)),max(1,int(image.height*scale))),Image.Resampling.NEAREST)
 alpha=image.getchannel('A');image=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA');image.putalpha(alpha)
 result=Image.new('RGBA',size);result.paste(image,((size[0]-image.width)//2,(size[1]-image.height)//2 if center else size[1]-2-image.height));return clean_components(result)
icons={'nav':['home','friends','chat','inventory','decoration','quests','settings','map'],'animal-icons':['pet','feed','play','help','give-water','view-profile','follow-pet','take-photo'],'social-icons':['visit','invite','add-friend','send-message','wave','gift','guestbook'],'decoration-icons':['move','rotate','place','store','delete','undo','redo']}
modules=['roof-left','roof-repeat','roof-right','roof-ridge','eave-left','eave-repeat','eave-right','chimney','front-door-closed','front-door-open','window-cream','window-shutter']
props=['mailbox','house-sign','flowerpot','garden-fence-straight','garden-fence-corner','garden-fence-end','garden-gate-open','outdoor-bench','path-straight','path-corner','garden-lamp','outdoor-feeding-station']
entries=[]
for job in jobs:
 id=job['id'];image=Image.open(job['source']).convert('RGBA');isicon=id in icons
 out=root/('ui/icons' if isicon else 'housing/exteriors');out.mkdir(parents=True,exist_ok=True)
 source=out/f'{id}-catalog-v1-source.png'
 if Path(job['source']).resolve()!=source.resolve():shutil.copy2(job['source'],source)
 if isicon: names=icons[id];columns,rows=4,2
 elif id=='exterior-modules':names=modules;columns,rows=4,3
 elif id=='garden-props':names=props;columns,rows=4,3
 else:names=[id];columns=rows=1
 for index,name in enumerate(names):
  col,row=index%columns,index//columns
  rect=(col*image.width//columns,row*image.height//rows,(col+1)*image.width//columns,(row+1)*image.height//rows)
  if id=='exterior-modules':
   bands=[[(80,350),(440,590),(640,1030)],[(80,350),(440,590),(640,1030)],[(80,350),(440,590),(700,975)],[(140,270),(370,640),(700,975)]]
   top,bottom=bands[col][row];rect=(rect[0],top,rect[2],bottom)
  size=(32,32) if isicon else (32,64) if name in ['front-door-closed','front-door-open','garden-lamp'] else (96,96) if name=='starter-house' else (192,160) if name=='upgraded-house' else (128,128) if 'house' in name or name=='wooden-cottage' else (64,64) if name in ['garden-gate-open','outdoor-bench','outdoor-feeding-station','garden-fence-corner'] else (32,32)
  native=prepare(image.crop(rect),size,center=isicon);file=out/f'{name}-catalog-v1.png';native.save(file)
  bounds=native.getbbox();base=dict(id=name,category='ui-icon' if isicon else 'exterior',file='/assets/game/'+str(file.relative_to(root)),source='/assets/game/'+str(source.relative_to(root)),sourceRect=list(rect),width=size[0],height=size[1],frames=1,anchorPixels=[size[0]//2,size[1]-2],collisionFootprintPixels=None if isicon else [bounds[0],max(bounds[1],bounds[3]-12),bounds[2]-bounds[0],min(12,bounds[3]-bounds[1])],collisionStatus='not applicable' if isicon else 'proposed; not engine verified',productionReady=False,reviewStatus='native style/alpha/dimension review; assembly and placement pending')
  entries.append(base)
for category,file in [('ui-icon',root/'ui/icons/complete-icons-manifest.json'),('exterior',root/'housing/exteriors/complete-exteriors-manifest.json')]:
 file.write_text(json.dumps(dict(generationMode='built-in image_gen',palette=colors,assets=[e for e in entries if e['category']==category],sourcePromptManifest='/assets/game/housing/references/remaining-root-sources.json'),indent=2))
for category,cols,cell in [('ui-icon',8,96),('exterior',6,192)]:
 selected=[e for e in entries if e['category']==category];rows=(len(selected)+cols-1)//cols;sheet=Image.new('RGBA',(cols*cell,rows*cell),'#f3e8d2')
 for index,e in enumerate(selected):
  im=Image.open(root/e['file'].removeprefix('/assets/game/'));scale=max(1,min(3,(cell-12)//max(im.size)));im=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
  sheet.alpha_composite(im,((index%cols)*cell+(cell-im.width)//2,(index//cols)*cell+(cell-im.height)//2))
 sheet.convert('RGB').save(root/f'housing/references/complete-{category}-review.png')
print('Exported',len(entries),'native icons/exterior assets')
# Audio-generation tools are unavailable. The brief expressly permits a pending manifest.
groups={'ambience':['indoor-room','outdoor-neighborhood','birds','wind','rain','night-crickets'],'interactions':['footsteps-wood','footsteps-grass','door-open','door-close','item-pickup','furniture-place','furniture-rotate'],'animals':['cat-meow','cat-purr','cat-eating','cat-drinking','dog-bark','dog-pant','animal-happy'],'social':['friend-join','friend-leave','chat-notification','invitation','emote-activate','gift-received'],'rewards':['kibble-earned','quest-complete','achievement-unlocked','furniture-purchased']}
sounds=[]
for category,names in groups.items():
 (root/'audio'/category).mkdir(parents=True,exist_ok=True)
 for name in names:sounds.append(dict(id=name,category=category,status='pending-audio-generation',file=None,plannedFile=f'/assets/game/audio/{category}/{name}.ogg',loop=category=='ambience',suggestedDurationSeconds=[10,30] if category=='ambience' else [.1,2],license=None,requirements='Original or properly licensed; pleasant repeated playback, no clipping, matched loudness'))
(root/'audio/music').mkdir(parents=True,exist_ok=True)
(root/'audio/sound-manifest.json').write_text(json.dumps(dict(status='audio files pending; no audio-generation tool available',assets=sounds),indent=2))
