"""Mirror the canonical spatial contract and prepare lightweight design thumbnails."""
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'src/game/housing/house-presets.json'
(ROOT/'backend/housing/house-presets.json').write_text(source.read_text())
(ROOT/'backend/housing/house-presets-legacy.json').write_text((ROOT/'src/game/housing/house-presets-legacy.json').read_text())
out=ROOT/'public/assets/game/housing/presets';out.mkdir(parents=True,exist_ok=True)
references={'studio':'pawtrail-home-room-reference-v1.png','cottage':'pawtrail-home-room-reference-v2-connected-cottage.png','two-storey':'pawtrail-home-room-reference-v3-two-storey.png'}
for key,file in references.items():
    image=Image.open(ROOT/'docs/images'/file).convert('RGB')
    for suffix,width in [('thumb',480),('preview',1100)]:
        image.resize((width,round(image.height*width/image.width)),Image.Resampling.NEAREST).save(out/(key+'-'+suffix+'.webp'),quality=82,method=5)
