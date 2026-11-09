"""Publish one complete-frame portrait job without replacing another style."""
from pathlib import Path
import hashlib
import json
import shutil
import sys

root = Path(__file__).resolve().parents[1]
app = Path('/home/micxsz/projects/pawtrail/.worktrees/implementation')
job = Path(sys.argv[1]).resolve()
sizes = json.loads((job / 'sizes.json').read_text())
config = json.loads((job / 'source.json').read_text()) if (job / 'source.json').exists() else {}
bundle = job / 'runtime' / sizes['id']
files = [path for path in bundle.rglob('*') if path.is_file()]
sizes['referenceBytes'] = sum(path.stat().st_size for path in files if path.parent.name == 'reference')
sizes['completeBytes'] = sum(path.stat().st_size for path in files)
sizes['runtimeBytes'] = sizes['completeBytes'] - sizes['referenceBytes']
(job / 'sizes.json').write_text(json.dumps(sizes, indent=2) + '\n')
budget = config.get('budgetBytes', sizes.get('budgetBytes', 300000))
if sizes['completeBytes'] > budget:
    raise SystemExit(f'Complete portrait exceeds the {budget:,}-byte cap; finish the export before publication.')
manifest = json.loads((bundle / 'portrait.json').read_text())
revision = hashlib.sha256((bundle / manifest['pixelData']['file']).read_bytes() + (bundle / 'portrait.json').read_bytes()).hexdigest()[:12]
public = Path('public/pawtrail-game/game-assets/dialogue-portraits') / job.name / sizes['id']
for base in [root, app]:
    destination = base / public
    if destination.exists(): shutil.rmtree(destination)
    shutil.copytree(bundle, destination)
entry = {**{key: value for key, value in sizes.items() if key != 'budgetBytes'},
         'styleKey': config.get('styleKey', sizes.get('styleKey', sizes['name'].lower().replace(' ', '-'))),
         'characterId': config.get('characterId', 'yae-miko'), 'characterName': config.get('characterName', 'Yae Miko'),
         'folder': '/' + public.as_posix().removeprefix('public/'), 'revision': revision,
         'poseIds': list(manifest['poses']), 'budgetBytes': budget}
path = root / 'src/game/actor-rig/photo-portrait-catalog.json'
catalogue = [item for item in json.loads(path.read_text()) if item['id'] != entry['id']]
catalogue.append(entry)
order = ['Sharp cel', 'Compact fantasy', 'Sparse anime', 'Console icon', 'Rough manga', 'Refined cel']
subject = [item for item in catalogue if item.get('characterId') == entry['characterId']]
subject.sort(key=lambda item: order.index(item['name']) if item['name'] in order else len(order))
catalogue = [item for item in catalogue if item.get('characterId') != entry['characterId']] + subject
path.write_text(json.dumps(catalogue, indent=2) + '\n')
for relative in ['game/actor-rig/photo-portrait-catalog.json', 'game/actor-rig/photo-portrait-catalog.ts', 'game/actor-rig/photo-portrait-renderer.ts', 'game/actor-rig/portrait-style-definitions.json', 'components/game/photo-portrait-studio.tsx', 'components/game/portrait-gallery.tsx']:
    source = root / 'src' / relative
    target = app / 'src/features/neighborhood' / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(source.read_text().replace('@/game/', '@/features/neighborhood/game/').replace('@/components/game/', '@/features/neighborhood/components/game/'))
(job / 'publication.json').write_text(json.dumps(entry, indent=2) + '\n')
print(json.dumps({'id': entry['id'], 'revision': revision, 'completeBytes': entry['completeBytes']}))
