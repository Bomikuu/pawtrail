"""Save native reference/render and animation art boards for the aquarium."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
root = Path(__file__).resolve().parents[1]
manifest = json.loads((root/'assets/furniture-studio/exports/aquarium/manifest.json').read_text())
references = json.loads((root/'src/game/furniture/references/aquarium-turnaround.json').read_text())['referenceViews']
output = root/'output/playwright'
output.mkdir(parents=True, exist_ok=True)

def reference(angle):
    view = references[str(angle)]
    image = Image.open(root/'public'/view['file'].lstrip('/')).convert('RGBA')
    frame = Image.new('RGBA', (96,112))
    frame.alpha_composite(image,(48-view['anchor'][0],96-view['anchor'][1]))
    return frame

for angles, name in [([0,90,180,270],'aquarium-turnaround-review'),([45,135],'aquarium-three-quarter-review')]:
    board = Image.new('RGB',(384*len(angles),864),'#e8dabc')
    draw = ImageDraw.Draw(board)
    for i,angle in enumerate(angles):
        if angle in [45,135]:
            model_path = root/'assets/furniture-studio/exports/aquarium'/f'review-{angle}.png'
        else:
            model_path = root/'public'/manifest['item']['styles'][0]['views'][str(angle)]['file'].lstrip('/')
        model = Image.open(model_path).convert('RGBA')
        for row,image,label in [(0,reference(angle),'Original front' if angle==0 else 'Approved reference'),(1,model,'3D model')]:
            image = image.crop((0,12,96,112)).resize((384,400),Image.Resampling.NEAREST)
            board.paste(image,(i*384,row*432+32),image)
            draw.text((i*384+12,row*432+12),f'{label} - {angle} degrees',fill='#332214')
    board.save(output/(name+'.png'))
board=Image.new('RGB',(1536,864),'#e8dabc');draw=ImageDraw.Draw(board)
for i,angle in enumerate([0,90,180,270]):
    view=manifest['item']['styles'][0]['views'][str(angle)]
    for row,index in enumerate([1,6]):
        path=root/'public'/view['motion'][index]['file'].lstrip('/')
        image=Image.open(path).convert('RGBA').crop((0,12,96,112)).resize((384,400),Image.Resampling.NEAREST)
        board.paste(image,(i*384,row*432+32),image);draw.text((i*384+12,row*432+12),f'{angle} degrees - motion frame {index}',fill='#332214')
board.save(output/'aquarium-motion-review.png')
print('Saved aquarium four-facing, three-quarter and motion boards.')
