"""Register the approved five-pose family sheets and export runtime companion art."""
from pathlib import Path
from PIL import Image
import json
import argparse

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/monster-studio/families'
PUBLIC = ROOT / 'public/pawtrail-game/monsters/families'
catalog = json.loads((SOURCE / 'catalog.json').read_text())
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--family', help='Only export this family; preserve all other runtime files.')
args = parser.parse_args()
families = [family for family in catalog['families'] if not args.family or family['id'] == args.family]
if not families:
    raise SystemExit('Unknown family: '+str(args.family))
CELL, BASELINE, CONTENT = 256, 248, 232
POSES = {'idle': 0, 'walk': 1, 'windup': 2, 'attack': 3, 'hurt': 4}

def save(image, path):
    image.quantize(colors=160, method=Image.Quantize.FASTOCTREE,
                   dither=Image.Dither.NONE).convert('RGBA').save(path, lossless=True, method=6)

def fit(image, size, padding=6):
    bounds = image.getchannel('A').getbbox()
    image = image.crop(bounds) if bounds else image
    ratio = min((size-padding*2)/image.width, (size-padding*2)/image.height)
    image = image.resize((max(1, round(image.width*ratio)), max(1, round(image.height*ratio))), Image.Resampling.NEAREST)
    result = Image.new('RGBA', (size, size))
    result.alpha_composite(image, ((size-image.width)//2, size-padding-image.height))
    return result

totals = {}
for family in families:
    folder = SOURCE / family['id']; output = PUBLIC / family['id'] / 'v1'
    output.mkdir(parents=True, exist_ok=True)
    master = Image.open(folder / 'poses-master.png').convert('RGBA')
    master.putalpha(master.getchannel('A').point(lambda a: 255 if a > 170 else 0))
    source_rows = family.get('sourceRows', [row*master.height//5 for row in range(6)])
    cells = [master.crop((col*master.width//5, source_rows[row],
                         (col+1)*master.width//5, source_rows[row+1]))
             for row in range(5) for col in range(5)]
    atlas = Image.new('RGBA', (CELL*5, CELL*5))
    registered = {}
    for creature in family['creatures']:
        rows = [creature['row']] + ([creature['enragedRow']] if creature['enragedRow'] is not None else [])
        boxes = [cells[row*5+col].getchannel('A').getbbox() for row in rows for col in range(5)]
        boxes = [box for box in boxes if box]
        if not boxes:
            raise RuntimeError('Empty generated creature: '+creature['id'])
        union = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
        ratio = min(CONTENT/(union[2]-union[0]), CONTENT/(union[3]-union[1]))
        size = (max(1,round((union[2]-union[0])*ratio)),max(1,round((union[3]-union[1])*ratio)))
        for row in rows:
            for col in range(5):
                cropped = cells[row*5+col].crop(union).resize(size, Image.Resampling.NEAREST)
                cell = Image.new('RGBA',(CELL,CELL))
                # Generated poses can leave different amounts of empty space
                # below their feet. Keep scale/x registration shared, but bind
                # each actual silhouette's ground contact to the same baseline.
                bottom = cropped.getchannel('A').getbbox()[3]
                cell.alpha_composite(cropped, ((CELL-size[0])//2,BASELINE-bottom))
                atlas.alpha_composite(cell,(col*CELL,row*CELL))
                registered[(row,col)] = cell
        target = output/creature['id']; target.mkdir(parents=True, exist_ok=True)
        idle = registered[(creature['row'],0)]
        save(fit(idle,384,10),target/'normal.webp')
        if creature['enragedRow'] is not None:
            save(fit(registered[(creature['enragedRow'],0)],384,10),target/'enraged.webp')
        fit(idle,64,3).save(target/'icon.png',optimize=True)
        portraits = Image.new('RGBA',(384,128))
        for index,col in enumerate((0,2,4)):
            portraits.alpha_composite(fit(registered[(creature['row'],col)],128,4),(index*128,0))
        save(portraits,target/'portraits.webp')
        save(portraits.crop((0,0,128,128)),target/'portrait.webp')
        manifest = {'id':creature['id'],'parentBoss':family['bossId'],'familyId':family['id'],'tier':creature['tier'],
                    'representation':'native-authored-2d-frames','atlas':'../actors.webp','cellWidth':CELL,'cellHeight':CELL,
                    'columns':5,'rows':5,'row':creature['row'],'enragedRow':creature['enragedRow'],
                    'poses':POSES,'authoredPoseCount':10 if creature['enragedRow'] is not None else 5,
                    'portrait':{'file':'portraits.webp','cellWidth':128,'cellHeight':128,'states':['alert','threatening','hurt']},
                    'icon':{'file':'icon.png','width':64,'height':64},
                    'illustration':{'normal':'normal.webp','enraged':'enraged.webp' if creature['enragedRow'] is not None else None,
                                    'motion':'runtime breathing, not additional authored image frames'},
                    'worldHeight':creature['height'],'baseline':BASELINE,
                    'contentHeight':idle.getchannel('A').getbbox()[3]-idle.getchannel('A').getbbox()[1],
                    'registration':{'union':union,'scale':ratio,'baselinePerFrame':BASELINE},'collisionRadius':creature['radius'],
                    'profile':'profile.json','provenance':'Built-in ImageGen derived from approved parent-boss artwork; full prompts and master retained.'}
        for directory in (target,folder/creature['id']):
            (directory/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
        shutil_profile = folder/creature['id']/'profile.json'
        (target/'profile.json').write_text(shutil_profile.read_text())
    save(atlas,output/'actors.webp')
    manifest = {'familyId':family['id'],'parentBoss':family['bossId'],'atlas':'actors.webp',
                'cellWidth':CELL,'cellHeight':CELL,'columns':5,'rows':5,'baseline':BASELINE,'contentHeight':CONTENT,'poses':POSES,
                'decodedAtlasBytes':CELL*5*CELL*5*4,'sourceRows':source_rows,'members':[c['id'] for c in family['creatures']]}
    manifest['runtimeArtworkBytes'] = sum(p.stat().st_size for p in output.rglob('*') if p.suffix in ('.webp','.png'))
    for directory in (output,folder):
        (directory/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    totals[family['id']] = manifest['runtimeArtworkBytes']
print(json.dumps({'runtimeArtworkBytes':totals,'total':sum(totals.values())}))
