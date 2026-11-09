from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1]/'public/assets/game'
sheet=Image.new('RGBA',(1200,900),'#f3e8d2')
def place(path,x,y,w,h):
 im=Image.open(path).convert('RGBA');bounds=im.getbbox()
 if bounds:im=im.crop(bounds)
 scale=min(w/im.width,h/im.height)
 im=im.resize((max(1,int(im.width*scale)),max(1,int(im.height*scale))),Image.Resampling.NEAREST)
 sheet.alpha_composite(im,(x+(w-im.width)//2,y+(h-im.height)//2))
# Five houses; independent sprites rather than an assembled scene.
houses=['starter-house','wooden-cottage','pastel-house','garden-house','upgraded-house']
for n,name in enumerate(houses):place(root/f'housing/exteriors/{name}-catalog-v1.png',(n%3)*132,10+(n//3)*140,124,124)
# Representative household furniture.
furniture=['three-seat-sofa-complete-v1','television-complete-v1','double-bed-complete-v1','wardrobe-housing-v1','desk-housing-v1','refrigerator-housing-v1','sink-counter-housing-v1','bookshelf-housing-v1','sofa-terracotta-complete-v1']
for n,name in enumerate(furniture):
 p=root/f'housing/furniture/{name}.png'
 if p.exists():place(p,405+(n%3)*130,5+(n//3)*98,120,90)
# Pet furniture.
pet=['cat-tree','cat-carrier','hanging-cat-hammock','water-fountain','automatic-feeder','toy-basket','grooming-brush','food-bowl-full','pet-blanket-terracotta']
for n,name in enumerate(pet):
 p=root/f'housing/pet-furniture/{name}-complete-v1.png'
 if p.exists():place(p,805+(n%3)*130,5+(n//3)*98,120,90)
# Cats in their actual generated identities, one first standing frame each.
cats=json.loads((root/'animals/cats/housing-v2/complete-cats-manifest.json').read_text())
for n,cat in enumerate(cats['variants']):
 atlas=Image.open(root/'animals/cats/housing-v2'/cat['file']).convert('RGBA');frame=atlas.crop((0,0,48,48));b=frame.getbbox();frame=frame.crop(b);frame=frame.resize((frame.width*2,frame.height*2),Image.Resampling.NEAREST)
 x=(n%5)*80+(80-frame.width)//2;y=330+(n//5)*110+(100-frame.height)//2;sheet.alpha_composite(frame,(x,y))
# Player appearances (standing first movement cell) and a row of social poses.
characters=json.loads((root/'characters/complete-characters-manifest.json').read_text())
for n,character in enumerate(characters['variants']):
 atlas=Image.open(root/character['file'].removeprefix('/assets/game/')).convert('RGBA');frame=atlas.crop((0,0,32,48));frame=frame.resize((64,96),Image.Resampling.NEAREST);sheet.alpha_composite(frame,(430+n*120,350))
# A sample of generated action icons, not an interface.
icons=json.loads((root/'ui/icons/complete-icons-manifest.json').read_text())['assets']
for n,icon in enumerate(icons):place(root/icon['file'].removeprefix('/assets/game/'),805+(n%6)*64,310+(n//6)*52,48,48)
# Modular interiors plus representative animation strips.
atlas=root/'housing/tilesets/modular-interiors-v2.png';place(atlas,10,610,570,260)
for n,name in enumerate(['pet','sleep','happy','walk_right']):
 p=root/f'animals/cats/housing-v2/orange-tabby/{name}.png'
 if p.exists():place(p,620,610+n*64,540,56)
out=root/'housing/references/housing-catalog-v1-overview.png';sheet.convert('RGB').save(out);print(out)
