"""Export menu thumbnails from the same pixel masks used by the game effects."""
from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
art = json.loads((ROOT / 'src/game/runtime/emote-art.json').read_text())
out = ROOT / 'public/pawtrail-game/game-assets/emote-fx-v3'
out.mkdir(parents=True, exist_ok=True)

def stamp(draw, name, x, y, scale=1):
    for py, row in enumerate(art['sprites'][name]):
        for px, pixel in enumerate(row):
            if pixel in art['palette']:
                draw.rectangle((x+px*scale, y+py*scale, x+(px+1)*scale-1, y+(py+1)*scale-1), fill=art['palette'][pixel])

for emote in ['sad', 'happy', 'angry', 'dance', 'float', 'sleepy', 'tired', 'surprised', 'play', 'pet', 'laughing', 'sick', 'car']:
    image = Image.new('RGBA', (32,32))
    draw = ImageDraw.Draw(image)
    if emote == 'sad':
        stamp(draw, 'storm', 5, 3)
        for x,y in [(7,17),(13,23),(19,17),(25,22)]: draw.rectangle((x,y,x+1,y+4), fill='#57b4d2')
    elif emote == 'happy':
        stamp(draw, emote, 4, 5, 2)
        for x,y,c in [(1,2,'#f5c864'),(29,3,'#ef805a'),(1,27,'#73b995')]: draw.rectangle((x,y,x+1,y+2),fill=c)
    elif emote in ['angry', 'surprised']:
        stamp(draw, emote, 6, 6)
        draw.rectangle((1,10,3,11), fill='#ef805a' if emote == 'angry' else '#f5c864')
        draw.rectangle((28,7,29,13), fill='#ef805a' if emote == 'angry' else '#f5c864')
        draw.rectangle((28,16,29,17), fill='#ef805a' if emote == 'angry' else '#f5c864')
    elif emote == 'dance':
        stamp(draw, 'disco', 4, 7, 2)
        for x,y in [(2,2),(27,27),(27,2)]: draw.rectangle((x,y,x+2,y),fill='#b586d5');draw.rectangle((x+1,y-1,x+1,y+1),fill='#b586d5')
    elif emote == 'float':
        stamp(draw, 'fluffy', 0, 11)
        draw.rectangle((8,3,10,4),fill='#f5c864');draw.rectangle((23,6,24,8),fill='#57b4d2')
    elif emote == 'sleepy':
        stamp(draw,'z',2,18,2);stamp(draw,'z',16,10);stamp(draw,'z',24,2)
    elif emote == 'play':
        stamp(draw,'yarn',3,2,2)
        draw.line([(19,26),(25,28),(30,25)], fill='#d098e3',width=1)
    elif emote == 'pet':
        stamp(draw,'heartLarge',3,4,2)
    elif emote in ['laughing','sick']:
        stamp(draw,'laugh' if emote == 'laughing' else 'sick',6 if emote == 'laughing' else 3,6)
        if emote == 'laughing':
            draw.rectangle((2,15,3,19),fill='#57b4d2');draw.rectangle((28,15,29,19),fill='#57b4d2')
    elif emote == 'car':
        car=Image.open(ROOT/'assets/animation-approval-v1/exports/emote-car/sprites/down_right/0.png').convert('RGBA')
        car=car.crop(car.getbbox());car.thumbnail((30,28),Image.Resampling.NEAREST)
        image.alpha_composite(car,((32-car.width)//2,(32-car.height)//2))
    else:
        stamp(draw,'battery',4,10,2)
        for x in [9,15,21]: draw.rectangle((x,26,x+1,27),fill='#9ba9ba')
    image.save(out / (emote+'.png'), optimize=True)
print('Exported thirteen transparent pixel action icons.')
