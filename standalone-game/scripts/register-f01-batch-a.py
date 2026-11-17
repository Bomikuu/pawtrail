"""Install only the versioned, approved first three stage layouts and native registry."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
BASE='/pawtrail-game/floors/f01/batch-a-v1'
REG=ROOT/'src/game/stage-editor/f01-art.json'
def write(path,data):path.write_text(json.dumps(data,indent=2)+'\n')
def object(id,asset,x,y,**extra):return dict(id=id,asset=asset,x=x,y=y,elevation=0,layer='world',bias=0,rotation=0,**extra)
def main():
    grounds=[dict(id='f01:lobby-ground',label='Wayfarer Concourse',file=BASE+'/lobby-ground.png',width=1024,height=896,reflections=[[300,480,180,28],[510,330,80,40]]),dict(id='f01:market-ground',label='Lumen Market',file=BASE+'/market-ground.png',width=1024,height=896,reflections=[[350,430,200,18],[470,690,160,22]])]
    neon=json.loads((ROOT/'src/game/stage-editor/neon-art.json').read_text())
    # Arrival keeps the accepted source ground, with new local motion metadata.
    grounds.append({**neon['grounds'][0],'id':'f01:arrival-ground','reflections':[[690,540,150,32],[550,840,120,25],[950,650,160,26]]})
    assets=[]
    for a in neon['assets']:
        a={**a,'id':a['id'].replace('neon:','f01:'),'category':'Floor 01 · animated scenery'}
        key=a['id'][4:]
        motion={'kind':'lights','cycleMs':7600}
        if key=='holo-head':motion={'kind':'holo-head','cycleMs':7200,'projectionBottom':173}
        if key=='holo-koi':motion={'kind':'holo-koi','cycleMs':8200,'projectionBottom':96,'atlas':{'file':BASE+'/koi-tail-atlas.png','cell':[64,48],'columns':4,'rows':2}}
        if key=='hvac':motion={'kind':'fan','cycleMs':1800,'rotor':[52,20,18,9]}
        a['motion']=motion;assets.append(a)
    for key,label,w,h,fp,motion in [
        ('lobby-wall','Concourse wall',320,160,[8,137,304,17],{'kind':'lights','cycleMs':8500}),
        ('repair-bay','Repair bay shelter',240,208,[23,166,194,22],{'kind':'lights','cycleMs':6300}),
        ('awning-stall','Market awning',208,176,[25,145,154,17],{'kind':'cloth','cycleMs':6500,'projectionBottom':70}),
        ('clinic-canopy','Mara’s clinic canopy',240,192,[26,142,188,19],{'kind':'cloth','cycleMs':7200,'projectionBottom':75})]:
        assets.append(dict(id='f01:'+key,label=label,category='Floor 01 · animated scenery',kind='object',file=BASE+'/'+key+'.png',width=w,height=h,anchor=[w//2,h-6],footprint=fp,rotations=[0],motion=motion))
    models=json.loads((ROOT/'public'/BASE.lstrip('/')/'model-manifest.json').read_text())
    labels={'lift':'Wayfarer lift','allocation':'P01 allocation console','planning':'Expedition planning board','counter':'Ivo’s vendor counter'}
    for m in models['assets']:
        key=m['id'];views=m['views'];files={str(f):f'{BASE}/models/{key}/{f}.png' for f in [0,90,180,270]}
        for angle,v in views.items():
            if key=='lift':v['stateViews']={'open':{'file':files[angle],'ground':v.pop('openGround')}}
        furniture=dict(id='f01-'+key,label=labels[key],file=files['0'],**{k:views['0'][k] for k in ['width','height','anchor','footprint','geometry']},renderedViews=views,orientationVariants=files,supportedRotations=[0,90,180,270],blocking=True,rotatable=True,category='Floor 01 · usable 3D',interaction=m['action'],price=0,zones=['interior','yard'])
        assets.append(dict(id='f01:'+key,label=labels[key],category='Floor 01 · usable 3D',kind='object',file=files['0'],width=160,height=192,anchor=[80,168],footprint=views['0']['footprint'],rotations=[0,90,180,270],furniture=furniture,liveModel={'file':m['model']}))
    # Existing approved couch model is re-used; its native actor contacts stay canonical.
    catalog=json.loads((ROOT/'src/game/housing/catalog.json').read_text())
    seat=next(a for a in catalog['items'] if a['id']=='studio-couch')
    assets.append(dict(id='f01:camp-seat',label='Concourse camp seat',category='Floor 01 · usable 3D',kind='object',file=seat['file'],width=seat['width'],height=seat['height'],anchor=seat['anchor'],footprint=seat['footprint'],rotations=seat.get('supportedRotations',[0,90,180,270]),furniture=seat,liveModel={'existing':'studio-couch'}))
    for id,name in [('mara','Mara Solis'),('ivo','Ivo Mercado')]:
        geometry=dict(version=2,ground=[[18,74,12,6]],placement=[[18,74,12,6]],approaches=[[24,104],[0,86],[48,86]],seats=[],surfaces=[],occlusion='base',actions=['talk_npc'])
        file=f'/pawtrail-game/floors/f01/npcs/{id}/body.png'
        furniture=dict(id='f01-'+id,label=name,file=file,width=48,height=80,anchor=[24,78],footprint=[18,74,12,6],geometry=geometry,blocking=True,rotatable=False,category='Floor 01 · NPCs',interaction='talk_npc',price=0,zones=['interior','yard'])
        assets.append(dict(id='f01:'+id,label=name,category='Floor 01 · NPCs',kind='object',file=file,width=48,height=80,anchor=[24,78],footprint=[18,74,12,6],rotations=[0],furniture=furniture,npc=id))
    write(REG,dict(version=1,grounds=grounds,assets=assets))
    lobby=[object('lift','f01:lift',512,210),object('planning','f01:planning',725,340),object('lobby-counter','f01:counter',300,390),object('camp-seat','f01:camp-seat',300,580),object('head','f01:holo-head',180,330),object('koi','f01:holo-koi',820,590),object('fan','f01:hvac',860,280)]
    for i,x in enumerate([160,832]):lobby.append(object('north-wall-'+str(i),'f01:lobby-wall',x,230))
    for i,x in enumerate([96,224,352,672,800,928]):lobby.append(object('south-rail-'+str(i),'f01:railing',x,830))
    market=[object('ivo-counter','f01:counter',720,530),object('ivo','f01:ivo',650,530),object('ivo-stall','f01:awning-stall',720,490),object('p01','f01:allocation',500,320),object('repair-bay','f01:repair-bay',200,680),object('market-koi','f01:holo-koi',550,640),object('market-head','f01:holo-head',920,340),object('market-fan','f01:hvac',230,700)]
    for i,(x,y,key) in enumerate([(120,210,'hab-block'),(420,235,'spire'),(690,240,'arc-tower'),(920,240,'hab-block')]):market.append(object('market-skyline-'+str(i),'f01:'+key,x,y))
    arrival=json.loads((ROOT/'src/game/stage-editor/maps/neon-heights-v1.json').read_text())
    arrival['name']='F01 · Lantern Landing · v1';arrival['groundArt']='f01:arrival-ground'
    arrival['objects']=[{**o,'asset':o['asset'].replace('neon:','f01:')} for o in arrival['objects'] if o['asset'].startswith('neon:')]
    arrival['objects'] += [object('arrival-lift','f01:lift',760,1050),object('clinic','f01:clinic-canopy',440,850),object('mara','f01:mara',400,890),object('clinic-seat','f01:camp-seat',490,890),object('arrival-planning','f01:planning',1000,900)]
    for key,name,ground,objects in [('lobby','Wayfarer Concourse','f01:lobby-ground',lobby),('market','Lumen Market','f01:market-ground',market)]:
        write(ROOT/f'src/game/stage-editor/maps/f01-{key}-v1.json',dict(format='pawtrail-stage',version=1,name='F01 · '+name+' · v1',width=32,height=28,baseTile='terrain:12',groundArt=ground,tiles={},shell=False,wallpaper='cream',objects=objects))
    write(ROOT/'src/game/stage-editor/maps/f01-arrival-v1.json',arrival)
    print('Registered versioned F01 native assets and lobby/arrival/market layouts')
if __name__=='__main__':main()
