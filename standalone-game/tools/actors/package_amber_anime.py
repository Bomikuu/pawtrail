"""Publish only the inspected source images; no app/browser checks are run."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
import shutil

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'assets/actor-appearances/amber-anime-v3'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-anime-v3'
panels = Image.new('RGB', (2304, 960), '#e8e4e0')
for col, name in enumerate(['front', 'left', 'back']):
    image = Image.open(OUT / 'renders' / f'{name}.png').convert('RGBA')
    panels.paste(image, (col * 768, 0), image)
    ImageDraw.Draw(panels).text((col * 768 + 25, 25), name.capitalize() + ' · actual 3D source', fill='#302827', font_size=22)
panels.save(OUT / 'source-views.webp', quality=93, method=6)
shutil.copy2(OUT / 'source-views.webp', PUBLIC / 'source-views.webp')
shutil.copy2(OUT / 'renders/face.png', PUBLIC / 'face.png')
Image.open(OUT / 'modeling-reference.png').convert('RGB').save(PUBLIC / 'modeling-reference.webp', quality=95, method=6)
(OUT / 'acceptance.json').write_text(json.dumps({
    'sourceModel': 'Amber anime v3',
    'sourceViews': 'Front, side, back and face authoring renders inspected. Fringe/eye occlusion, intersecting thigh/shorts, crown coverage and hair layers corrected.',
    'scope': 'Live reference-guided Blender model revision, preserving earlier comparison assets.',
    'runtimeReview': 'Pending owner review; no automated tests, build, checks or browser verification were run.',
    'remaining': 'Hand-authored interpretation, not a reconstruction guaranteed to exactly match the reference. Retargeting the full gameplay action set and roster installation remain outside this focused comparison.',
}, indent=2) + '\n')
print('Published actual source views and reference')
