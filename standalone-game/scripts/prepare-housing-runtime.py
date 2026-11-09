from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];art=root/'public/assets/game'
items={}
for kind in ['furniture','pet-furniture']:
 d=json.loads((art/f'housing/{kind}/complete-{kind}-manifest.json').read_text())
 for a in d['existingAssets']+d['newAssets']:
  file=a['file'];file=file if file.startswith('/') else f'/assets/game/housing/{kind}/{file}'
  width=a.get('frameWidth',a.get('width',32));height=a.get('frameHeight',a.get('height',32))
  if a.get('frames',1)!=1:continue
  id=a['id'].replace('_housing_v1','')
  nonblock=any(s in id for s in ['rug','blanket','wall-clock','painting','picture-frame','decorative-lights','wall-shelf'])
  interaction='sit' if any(s in id for s in ['sofa','chair','desk']) else 'sleep' if 'bed' in id else 'watch' if 'television' in id else 'read' if 'bookshelf' in id else 'play' if any(s in id for s in ['toy','ball','tree','scratching']) else 'feed' if 'food-bowl' in id else 'water' if 'water-bowl' in id else 'admire'
  anchor=a.get('anchorPixels',[width//2,height-2]);anchor=[anchor['x'],anchor['y']] if isinstance(anchor,dict) else anchor
  collision=a.get('collisionFootprintPixels',a.get('suggestedCollisionFootprint',[2,height-12,width-4,10]));collision=[collision['x'],collision['y'],collision['width'],collision['height']] if isinstance(collision,dict) else collision
  items[id]=dict(id=id,label=id.replace('-',' ').title(),file=file,width=width,height=height,anchor=anchor,footprint=collision,blocking=not nonblock,rotatable=any(s in id for s in ['rug','blanket','ball']),category='Pet essentials' if kind=='pet-furniture' else 'Bedroom' if any(s in id for s in ['bed','wardrobe','desk','dresser','mirror']) else 'Plants' if any(s in id for s in ['plant','flower']) else 'Decorations' if nonblock else 'Living room',interaction=interaction,price=max(15,min(150,15+(width*height)//64)))
items['sofa']=items.get('sofa',items['sofa-sage'])
players={}
for appearance in json.loads((art/'characters/complete-characters-manifest.json').read_text())['variants']:
 variant=appearance['id']
 m=json.loads((art/f'characters/animations/{variant}/manifest-v2.json').read_text());players[variant]=dict(file=f'/assets/game/characters/animations/{variant}/complete-v2.png',rows={a['id']:a['atlasRect'][1]//48 for a in m['animations']})
cats=json.loads((art/'animals/cats/housing-v2/complete-cats-manifest.json').read_text())
catdefs={a['id']:dict(file='/assets/game/animals/cats/housing-v2/'+a['file'],animations={k:v['atlasRects'] for k,v in a['animations'].items()}) for a in cats['variants']}
effects=json.loads((art/'effects/complete-effects-manifest.json').read_text())
data=dict(items=list(items.values()),players=players,cats=catdefs,effects={a['id']:dict(file=a['file'],frames=a['frames']) for a in effects['animations']})
(root/'src/game/housing/catalog.json').write_text(json.dumps(data,separators=(',',':')))
(root/'backend/housing/catalog.json').write_text(json.dumps(data,separators=(',',':')))
print('Prepared runtime catalogue:',len(items),'static furniture definitions')
