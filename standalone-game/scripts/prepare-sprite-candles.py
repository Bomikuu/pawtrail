"""Export original candle on art and exact-pixel unlit art; keep geometry/identity."""
from pathlib import Path
import hashlib
import json
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
FLAMES=((8,2,14,9),(20,10,25,16))


def export():
    source=ROOT/'public/assets/game/housing/furniture/candles-complete-v1.png'
    on=Image.open(source).convert('RGBA'); off=on.copy()
    # Native flame-only rectangles: leave the existing wicks, wax, plate,
    # contours and alpha outside those two areas exactly as authored.
    for left,top,right,bottom in FLAMES:
        for y in range(top,bottom):
            for x in range(left,right): off.putpixel((x,y),(0,0,0,0))
    source_hash=hashlib.sha256(source.read_bytes()).hexdigest()
    revision=hashlib.sha256(on.tobytes()+off.tobytes()+json.dumps(FLAMES).encode()).hexdigest()[:12]
    relative=f'pawtrail-game/furniture-sprites/candles/{revision}'
    output=ROOT/'public'/relative; output.mkdir(parents=True,exist_ok=True)
    on.save(output/'lit.png'); off.save(output/'unlit.png')
    frontend=ROOT/'src/game/housing/catalog.json'
    catalog=json.loads(frontend.read_text()); original=next(i for i in catalog['items'] if i['id']=='candles')
    record={**original,'file':'/'+relative+'/lit.png','representation':'sprite',
        'stateViews':{**original.get('stateViews',{}),'unlit':{'file':'/'+relative+'/unlit.png'}}}
    manifest={'version':1,'id':'candles','representation':'sprite','revision':revision,
        'source':{'file':'/'+str(source.relative_to(ROOT/'public')),'sha256':source_hash},
        'frame':{'width':on.width,'height':on.height,'anchor':record['anchor']},
        'production':'Original native on pixels; unlit removes only the two recorded flame regions. Wicks, wax, plate and contours remain canonical. No new generation, mesh or hidden facings.',
        'flameRegions':FLAMES,'item':record,
        'actorContract':{'facing':'Fixed front; rotation remains disabled.','solid':'Original ground/placement geometry is unchanged.','state':'Existing lit flag defaults on unless explicitly false.','action':'Existing toggle_light; permissions/idempotency remain server-owned.','preview':'Shared actor/controller trial is local; account persistence requires separate authenticated evidence.'},
        'review':{'art':'pending','localInteraction':'pending','authenticatedPersistence':'not_run'}}
    folder=ROOT/'assets/furniture-studio/sprites/candles'; folder.mkdir(parents=True,exist_ok=True)
    for target in [output/'manifest.json',folder/'manifest.json']:
        target.write_text(json.dumps(manifest,indent=2)+'\n')
    board=Image.new('RGBA',(96,48),'#fff5e7'); draw=ImageDraw.Draw(board)
    for index,(name,im) in enumerate([('Lit',on),('Unlit',off)]):
        x=index*48; draw.text((x+3,1),name,fill='#38271e'); board.alpha_composite(im,(x+8,14))
    board.resize((576,288),Image.Resampling.NEAREST).save(folder/'states.png')
    for relative_catalog in ['src/game/housing/catalog.json','backend/housing/catalog.json']:
        path=ROOT/relative_catalog; data=json.loads(path.read_text())
        data['items']=[record if item['id']=='candles' else item for item in data['items']]
        path.write_text(json.dumps(data,indent=2)+'\n')
    print('Installed Candles sprite states:',revision)


if __name__=='__main__': export()
