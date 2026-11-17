"""Compose native authoring evidence for one converted furniture batch."""
from pathlib import Path
from PIL import Image, ImageDraw
import argparse
import json

root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--batch',required=True)
args=parser.parse_args()
queue=json.loads((root/'assets/furniture-studio/batches/conversion-queue.json').read_text())
batch=next(row for row in queue['batches'] if row['id']==args.batch)
out=root/'output/furniture'/args.batch
out.mkdir(parents=True,exist_ok=True)

def native_reference(view):
    source=Image.open(root/'public'/view['file'].lstrip('/')).convert('RGBA')
    frame=Image.new('RGBA',(96,112))
    frame.alpha_composite(source,(48-view['anchor'][0],96-view['anchor'][1]))
    return frame

for item_id in batch['items']:
    manifest=json.loads((root/'assets/furniture-studio/exports'/item_id/'manifest.json').read_text())
    for angles,suffix in [([0,90,180,270],'facings'),([45,135],'corners')]:
        board=Image.new('RGB',(384*len(angles),824),'#eddfc3')
        draw=ImageDraw.Draw(board)
        for i,angle in enumerate(angles):
            view=manifest['referenceStudy']['turnaround']['views'][str(angle)]
            path=root/'assets/furniture-studio/exports'/item_id/f'review-{angle}.png' if angle in [45,135] else root/'public'/manifest['item']['styles'][0]['views'][str(angle)]['file'].lstrip('/')
            model=Image.open(path).convert('RGBA')
            for row,(image,label) in enumerate([(native_reference(view),'Canonical front' if angle==0 else 'Reviewed generated angle'),(model,'Actual 3D render')]):
                thumb=image.crop((0,20,96,112)).resize((384,368),Image.Resampling.NEAREST)
                board.paste(thumb,(i*384,row*412+32),thumb)
                draw.text((i*384+12,row*412+12),f'{item_id} - {label} - {angle}',fill='#39271e')
        board.save(out/f'{item_id}-{suffix}.png')
    print(item_id,manifest['revision'])

board=Image.new('RGB',(1152,440),'#eddfc3')
draw=ImageDraw.Draw(board)
for i,item_id in enumerate(batch['items']):
    image=Image.open(root/'assets/furniture-studio/exports'/item_id/'standing-0.png').convert('RGBA')
    thumb=image.crop((0,12,96,112)).resize((384,400),Image.Resampling.NEAREST)
    board.paste(thumb,(i*384,32),thumb)
    draw.text((i*384+12,12),item_id+' - actual shared actor nearby',fill='#39271e')
board.save(out/'actor-scale.png')
