"""Install original couch art plus accepted 2D profiles, with native contacts."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, base64, hashlib, copy

root = Path(__file__).resolve().parents[1]
reference = json.loads((root/'src/game/furniture/references/couch.json').read_text())
turnaround = json.loads((root/'src/game/furniture/references/couch-turnaround.json').read_text())
source = root/'public'/reference['source'].lstrip('/')
image = Image.open(source).convert('RGBA')
source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
if source_hash != reference['sha256']:
    raise ValueError('The source changed; inspect its layer masks before exporting.')
left = base64.b64decode(reference['layers']['leftArm'])
right = base64.b64decode(reference['layers']['rightArm'])
front_mask = Image.new('RGBA', image.size)
front_mask.putdata([pixel if left[i] or right[i] else (0,0,0,0) for i,pixel in enumerate(image.get_flattened_data())])
catalog = json.loads((root/'src/game/housing/catalog.json').read_text())
original = next(row for row in catalog['items'] if row['id']=='sofa')
views = {0:image}
masks = {0:front_mask}
provenance = {'0':{'source':reference['source'],'sha256':source_hash,'method':'Original PNG, unchanged; exact source-pixel arm mask.'}}
for rotation in (90,180,270):
    ref = turnaround['referenceViews'][str(rotation)]['file']
    path = root/'public'/ref.lstrip('/')
    # Existing approved native references: translate into the original 64px frame,
    # retaining every opaque source pixel, its palette and original pixel scale.
    views[rotation] = Image.open(path).convert('RGBA').crop((16,42,80,106))
    mask = Image.new('RGBA',(64,64))
    for y in range(64):
        for x in range(64):
            foreground = rotation==180 or y>=36 or (rotation==90 and x>=40) or (rotation==270 and x<=23)
            if foreground: mask.putpixel((x,y),views[rotation].getpixel((x,y)))
    masks[rotation] = mask
    provenance[str(rotation)] = {'source':ref,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'crop':[16,42,80,106],'method':'Exact pixels from accepted couch turnaround; translated only, no rescale, repaint or new model.'}

def seat(i,point,exit,elevation=5):
    return dict(id='seat-'+str(i),point=point,facing='down',elevation=elevation,exit=exit)

def geometry(ground,seats,approaches):
    return dict(version=2,ground=[ground],placement=[ground],approaches=approaches,seats=seats,surfaces=[],occlusion='base',actions=['sit','inspect'])

geometries = {
  0:geometry([5,43,54,17],[seat(1,[22,57],[22,74],8),seat(2,[42,57],[42,74],8)],[[22,74],[42,74],[-6,52],[70,52],[32,32]]),
  90:geometry([15,43,34,17],[seat(1,[26,52],[0,52]),seat(2,[26,56],[0,59])],[[0,52],[0,59],[26,74],[58,52],[32,32]]),
  180:geometry([5,43,54,17],[seat(1,[41,52],[41,34],14),seat(2,[23,52],[23,34],14)],[[41,34],[23,34],[-6,52],[70,52],[32,74]]),
  270:geometry([15,43,34,17],[seat(1,[38,56],[64,59]),seat(2,[38,52],[64,52])],[[64,59],[64,52],[38,74],[6,52],[32,32]])
}
geometries[0]['surfaces'] = original['geometry']['surfaces']
model = next(row for row in catalog['items'] if row['id']=='studio-couch')
for rotation in (90,180,270):
    surfaces = copy.deepcopy(model['renderedViews'][str(rotation)]['geometry']['surfaces'])
    for surface in surfaces:
        for key in ['point','approach','descent']:
            if key in surface:surface[key]=[surface[key][0]-16,surface[key][1]-42]
        if 'landingBounds' in surface:
            surface['landingBounds'][0]-=16;surface['landingBounds'][1]-=42
    geometries[rotation]['surfaces']=surfaces

payload = b''.join(views[r].tobytes()+masks[r].tobytes() for r in views)+json.dumps(geometries,sort_keys=True).encode()
revision = hashlib.sha256(payload).hexdigest()[:12]
relative = Path('pawtrail-game/furniture-sprites/sofa')/revision
output = root/'public'/relative
output.mkdir(parents=True,exist_ok=True)
record = {**original,'representation':'sprite','geometry':geometries[0],'supportedRotations':[0,90,180,270],'rotatable':True,'defaultStyle':'original'}
record['renderedViews']={}
style_views={}
for rotation in views:
    if rotation:views[rotation].save(output/f'{rotation}.png')
    masks[rotation].save(output/f'{rotation}-front.png')
    style_views[str(rotation)]={'file':reference['source'] if rotation==0 else '/'+str(relative/f'{rotation}.png'),'frontFile':'/'+str(relative/f'{rotation}-front.png')}
    record['renderedViews'][str(rotation)]={'width':64,'height':64,'anchor':[32,60],'visibleBounds':(lambda b:[b[0],b[1],b[2]-b[0],b[3]-b[1]])(views[rotation].getbbox()),'indicatorHeight':58,'footprint':geometries[rotation]['ground'][0],'geometry':geometries[rotation]}
record['frontFile']=style_views['0']['frontFile']
record['styles']=[{'id':'original','label':'Original sage','color':'#898a4a','views':style_views}]
manifest=dict(version=2,id='sofa',representation='sprite',revision=revision,source=reference['source'],sourceSha256=source_hash,frame=dict(width=64,height=64,anchor=[32,60]),item=record,views=provenance,foreground={'0':'Original arm masks','90':'Near arm and rear upright, exact view pixels','180':'Backrest/body hides seated actors','270':'Near arm and rear upright, exact view pixels'},contacts=dict(actorScale=1,occupancy='Existing room leases; trial has local shared reservations.'),review=dict(art='Existing accepted turnaround views reused; unchanged front. No new generated art.',runtime='Pending focused Firefox review.'))
(output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
folder=root/'assets/furniture-studio/sprites/sofa';folder.mkdir(parents=True,exist_ok=True)
(folder/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
board=Image.new('RGBA',(64*4,82),'#fff5e7');draw=ImageDraw.Draw(board)
for i,(rotation,im) in enumerate(views.items()):
    board.alpha_composite(im,(i*64,12));draw.text((i*64+5,1),{0:'Front',90:'Left',180:'Back',270:'Right'}[rotation],fill='#38271e')
board.resize((1024,328),Image.Resampling.NEAREST).save(folder/'four-views.png')
for rel in ['src/game/housing/catalog.json','backend/housing/catalog.json']:
    path=root/rel;data=json.loads(path.read_text());data['items']=[record if row['id']=='sofa' else row for row in data['items']];path.write_text(json.dumps(data,indent=2)+'\n')
print('Installed four-view sprite couch:',revision)
