"""Build native-scale art review boards; original and generated references stay distinct."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
root = Path(__file__).resolve().parents[1]
reference = json.loads((root / 'src/game/furniture/references/couch-turnaround.json').read_text())
manifest = json.loads((root / 'assets/furniture-studio/exports/studio-couch/manifest.json').read_text())
output = root / 'output/playwright'
output.mkdir(parents=True, exist_ok=True)

def native_reference(angle):
    if angle in [45, 135]:
        cell = 'front-three-quarter' if angle == 45 else 'rear-three-quarter'
        base = Path(reference['referenceViews']['90']['file']).parent
        source = Image.open(root / 'public' / str(base / (cell + '-import.png')).lstrip('/')).convert('RGBA')
        # Same reference scale as the accepted front; no per-view warping.
        scale = 58 / 432
        source = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', (96, 112))
        frame.alpha_composite(source, ((96 - source.width) // 2, 102 - source.height))
        return frame
    view = reference['referenceViews'][str(angle)]
    source = Image.open(root / 'public' / view['file'].lstrip('/')).convert('RGBA')
    frame = Image.new('RGBA', (96, 112))
    frame.alpha_composite(source, (48-view['anchor'][0], 96-view['anchor'][1]))
    return frame

for angles, name in [([0, 90, 180, 270], 'couch-turnaround-review'), ([45, 135], 'couch-three-quarter-review')]:
    board = Image.new('RGB', (384 * len(angles), 576), '#e8dabc')
    draw = ImageDraw.Draw(board)
    for column, angle in enumerate(angles):
        ref = native_reference(angle)
        model_path = (root / 'assets/furniture-studio/exports/studio-couch' / f'review-{angle}.png') if angle in [45,135] else (root / 'public' / manifest['item']['styles'][0]['views'][str(angle)]['file'].lstrip('/'))
        model = Image.open(model_path).convert('RGBA')
        for row, image, title in [(0, ref, 'Original front' if angle == 0 else 'Generated reference'), (1, model, '3D model')]:
            image = image.crop((0,48,96,112)).resize((384,256), Image.Resampling.NEAREST)
            board.paste(image, (column*384,row*288+32),image)
            draw.text((column*384+12,row*288+12), f'{title} - {angle} degrees',fill='#332214')
    board.save(output / (name+'.png'))
print('Saved four-facing and three-quarter review boards.')
