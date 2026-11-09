"""Catalog asset inspection and lightweight native packaging. No application execution."""
from pathlib import Path
from PIL import Image
import json,zipfile
root=Path(__file__).resolve().parents[1]/'public/assets/game'
manifestPaths={
'interiors':'housing/tilesets/complete-interior-manifest.json',
'furniture':'housing/furniture/complete-furniture-manifest.json',
'petFurniture':'housing/pet-furniture/complete-pet-furniture-manifest.json',
'cats':'animals/cats/housing-v2/complete-cats-manifest.json',
'characters':'characters/complete-characters-manifest.json',
'effects':'effects/complete-effects-manifest.json',
'exteriors':'housing/exteriors/complete-exteriors-manifest.json',
'icons':'ui/icons/complete-icons-manifest.json',
'audio':'audio/sound-manifest.json'}
missing=[p for p in manifestPaths.values() if not (root/p).exists()]
if missing:raise SystemExit('Waiting for category manifests: '+', '.join(missing))
checks=[];native=[];warnings=[]
for path in sorted(root.rglob('*.png')):
 relative=path.relative_to(root);text=str(relative).lower()
 if any(term in text for term in ['source','review','preview','reference','contact']):continue
 with Image.open(path) as raw:
  image=raw.convert('RGBA');alpha=set(image.getchannel('A').get_flattened_data());visible=image.getbbox() is not None
  check=dict(file='/assets/game/'+str(relative),width=image.width,height=image.height,binaryAlpha=alpha<={0,255},hasVisiblePixels=visible)
  checks.append(check)
  if not check['binaryAlpha'] or not visible:warnings.append(check)
 native.append(path)
index=dict(version='housing-catalog-v1',generationMode='built-in image_gen; native export/pixel preparation',scope='Assets only; no gameplay or UI implementation',categories={k:'/assets/game/'+p for k,p in manifestPaths.items()},counts=dict(nativePngFiles=len(native),cats=10,catVisibleAnimationFrames=920,playerAppearances=3,playerVisibleAnimationFrames=324,socialEffectVisibleAnimationFrames=84,furnitureAssets=44,petFurnitureAssetsOrGroups=44,uiIcons=30,houses=5,exteriorModulesAndProps=24,newModularInteriorTiles=116,pendingAudioClips=30),productionReady=False,limitations=['Audio files are pending; only a sound manifest is delivered.','Animation loops, fine marking consistency and in-engine collision/placement are not certified; consult per-category notes.','Static atlas/module exports are reusable artwork; no game functionality is implied.'],assetFileCheckFailures=warnings)
(root/'housing-catalog-v1.json').write_text(json.dumps(index,indent=2))
(root/'housing/references/catalog-native-file-checks.json').write_text(json.dumps(dict(checks=checks,failures=warnings),indent=2))
# Include exact prompts/metadata and all native sprites; high-res originals remain separately in workspace.
extras=[p for p in root.rglob('*') if p.is_file() and p.suffix in ['.json','.txt','.md']]
archive=root/'pawtrail-housing-catalog-v1-native.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
 for path in sorted(set(native+extras)):
  z.write(path,str(path.relative_to(root)))
 # Selected overview sheets for convenient review, not every large contact sheet.
 for relative in ['housing/references/complete-exterior-review.png','housing/references/complete-ui-icon-review.png','animals/cats/housing-v2/all-cats-review.png','housing/references/housing-catalog-v1-overview.png','characters/complete-characters-review-v2.png','effects/emotes/complete-review-v2.png','effects/particles/complete-review-v2.png']:
  p=root/relative
  if p.exists():z.write(p,relative)
print(json.dumps(dict(nativePngFiles=len(native),fileCheckFailures=len(warnings),archive=str(archive),bytes=archive.stat().st_size),indent=2))
