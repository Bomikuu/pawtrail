from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'public/assets/game';out=root/'housing/tilesets';entries=[]
styles={'cream':'cream-straight','sage':'sage-wall','beige':'beige-wall','blue':'blue-wall','wood':'wood-panel','wallpaper':'floral-wallpaper'}
# Compose reusable pieces from generated artwork; no replacement of source exports.
for style,source in styles.items():
 panel=Image.open(out/f'{source}-housing-v1.png').convert('RGBA')
 for y in range(32):panel.putpixel((31,y),panel.getpixel((0,y)))
 side=Image.new('RGBA',(32,32));strip=panel.crop((5,0,11,24)).resize((6,32),Image.Resampling.NEAREST)
 for x in range(6):strip.putpixel((x,31),strip.getpixel((x,0)))
 side.paste(strip,(0,0));east=Image.new('RGBA',(32,32));east.paste(strip,(26,0))
 south=Image.new('RGBA',(32,32));south.paste(panel.crop((0,24,32,32)),(0,24))
 fill=panel.crop((4,0,28,24)).resize((32,32),Image.Resampling.NEAREST)
 pieces={'north':panel,'west':side,'east':east,'south':south,'fill':fill}
 for direction,isleft in [('nw',True),('ne',False)]:
  im=panel.copy();x=0 if isleft else 26
  for dx in range(6):im.putpixel((x+dx,31),strip.getpixel((dx,0)))
  pieces[direction]=im
 for direction,isleft in [('sw',True),('se',False)]:
  im=south.copy();im.alpha_composite(side if isleft else east);pieces[direction]=im
 for direction,(left,top) in {'inner-nw':(True,True),'inner-ne':(False,True),'inner-sw':(True,False),'inner-se':(False,False)}.items():
  im=Image.new('RGBA',(32,32));im.alpha_composite(side if left else east)
  band=panel.crop((0,0 if top else 24,32,8 if top else 32));im.paste(band,(0,0 if top else 24));pieces[direction]=im
 doorway=panel.copy()
 for y in range(6,32):
  for x in range(8,24):doorway.putpixel((x,y),(0,0,0,0))
 pieces['doorway']=doorway
 for name,image in pieces.items():
  file=out/f'{style}-{name}-modular-v2.png';image.save(file)
  entries.append(dict(id=f'{style}-{name}',file='/assets/game/'+str(file.relative_to(root)),width=32,height=32,source=f'/assets/game/housing/tilesets/{source}-housing-v1.png',type='wall',anchorPixels=[0,0],productionReady=False,reviewStatus='generated-art composition; native alpha/dimensions checked; visual map assembly review remains'))
# Material transitions use the generated matching canonical floor textures.
base=Image.open(out/'oak-light-a-housing-v1.png').convert('RGBA')
for material in ['carpet-a','ceramic-a','stone','patterned']:
 other=Image.open(out/f'{material}-housing-v1.png').convert('RGBA')
 for direction in ['north','south','east','west','nw','ne','sw','se']:
  tile=base.copy()
  for y in range(32):
   for x in range(32):
    take={'north':y<16,'south':y>=16,'east':x>=16,'west':x<16,'nw':x<16 and y<16,'ne':x>=16 and y<16,'sw':x<16 and y>=16,'se':x>=16 and y>=16}[direction]
    if take:tile.putpixel((x,y),other.getpixel((x,y)))
  path=out/f'oak-{material}-{direction}-transition-v2.png';tile.save(path)
  entries.append(dict(id=f'oak-{material}-{direction}',file='/assets/game/'+str(path.relative_to(root)),width=32,height=32,type='floor-transition',productionReady=False,reviewStatus='native material blend; exact canonical floor edges retained; no automatic art approval'))
# A modular tileset atlas with actual file rectangles for all new exports.
cols=14;rows=(len(entries)+cols-1)//cols;atlas=Image.new('RGBA',(cols*32,rows*32))
for index,e in enumerate(entries):
 x,y=index%cols*32,index//cols*32;atlas.paste(Image.open(root/e['file'].removeprefix('/assets/game/')),(x,y));e['atlasRect']=[x,y,32,32]
atlas.save(out/'modular-interiors-v2.png')
atlas.resize((atlas.width*2,atlas.height*2),Image.Resampling.NEAREST).save(root/'housing/references/modular-interiors-v2-review.png')
(out/'complete-interior-manifest.json').write_text(json.dumps(dict(assets=entries,atlas='/assets/game/housing/tilesets/modular-interiors-v2.png',existingAtlasManifest='/assets/game/housing/tilesets/tilesets-first-batch.json',joinPolicy='North pieces repeat horizontally; west/east pieces repeat vertically; corner edge pixels explicitly meet selected side strips. First-batch decorative architecture stays available separately.',limitations=['Derived native composition of generated artwork, not newly generated each wall corner.','Furniture wall occlusion/collision remains unverified in game.','Mixed material transitions intentionally show a material boundary; they are not a claim all arbitrary floor variants cross-tile seamlessly.']),indent=2))
print('Prepared',len(entries),'modular wall and floor-transition tiles.')
