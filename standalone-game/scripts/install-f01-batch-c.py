"""Install approved Batch C native manifests and editable Switchyard composition."""
from pathlib import Path
import json,copy,importlib.util
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/pawtrail-game/floors/f01/batch-c-v1';URL='/pawtrail-game/floors/f01/batch-c-v1'
spec=importlib.util.spec_from_file_location('registration',ROOT/'scripts/install-f01-batch-b.py');shared=importlib.util.module_from_spec(spec);spec.loader.exec_module(shared)
write=shared.write;furniture=shared.furniture;obj=shared.obj
assets=[]
for key,label,size,anchor,foot,motion in [
 ('dispatch-cabin','Freight Dispatch cabin',[272,224],[136,218],[30,185,210,33],dict(kind='fan',lights=True,cycleMs=5200,rotors=[[154,48,20,10]])),
 ('freight-stack','Stacked cargo containers',[192,160],[96,156],[15,121,164,35],dict(kind='lights',cycleMs=7200)),
 ('freight-crates','Cargo and cable spool',[160,128],[80,124],[13,96,135,28],dict(kind='lights',cycleMs=6300)),
 ('yard-crane','Suspended-load yard crane',[224,224],[52,218],[4,188,104,30],dict(kind='crane',cycleMs=8000,hook=[205,15],atlas=dict(file=URL+'/crane-load.png',cell=[48,128],columns=1,rows=1)))]:
 assets.append(dict(id='f01:'+key,label=label,category='Floor 01 · freight scenery',kind='object',file=URL+'/'+key+'.png',width=size[0],height=size[1],anchor=anchor,footprint=foot,rotations=[0],motion=motion))
models=json.loads((OUT/'model-manifest.json').read_text())
for item in models['assets']:
 key=item['id'];v=item['views']['0'];a=dict(id='f01:'+key,label={'bulkhead':'Bastion bulkhead','authorization':'Two-record authorization desk'}[key],category='Floor 01 · usable 3D',kind='object',file=URL+f'/models/{key}/0.png',width=160,height=192,anchor=[80,168],footprint=v['footprint'],rotations=[0,90,180,270],liveModel=dict(file=item['model']))
 f=furniture(a,v['geometry'],item['action']);f['supportedRotations']=a['rotations'];f['renderedViews']={};f['orientationVariants']={k:URL+f'/models/{key}/{k}.png' for k in item['views']}
 for k,view in item['views'].items():
  view=copy.deepcopy(view);opened=view['geometry'].pop('openGround',None);view['file']=URL+f'/models/{key}/{k}.png'
  if opened:view['stateViews']={'open':{'file':view['file'],'ground':opened}}
  f['renderedViews'][k]=view
 f['geometry']=f['renderedViews']['0']['geometry']
 if key=='bulkhead':f['stateViews']=f['renderedViews']['0']['stateViews']
 a['furniture']=f;assets.append(a)
base=json.loads((ROOT/'src/game/stage-editor/f01-art.json').read_text());a=copy.deepcopy(next(x for x in base['assets'] if x['id']=='f01:mara'));a.update(id='f01:sena',label='Sena Valez',file='/pawtrail-game/floors/f01/npcs/sena/body.png',npc='sena');a['furniture']=furniture(a,a['furniture']['geometry'],'talk_npc');assets.append(a)
grounds=[dict(id='f01:switchyard-ground',label='Neon Switchyard',file=URL+'/switchyard-ground.png',width=1152,height=896,reflections=[[135,610,70,130],[420,485,150,16],[825,330,120,20],[980,170,35,110]])]
write(ROOT/'src/game/stage-editor/f01-batch-c-art.json',dict(version=1,grounds=grounds,assets=assets))
objects=[obj('dispatch-cabin','f01:dispatch-cabin',240,280),obj('sena','f01:sena',315,355),obj('authorization','f01:authorization',205,350),obj('dispatch-beacon','f01:planning',90,345),obj('dispatch-supply','f01:supply',395,345),obj('dispatch-seat','f01:camp-seat',100,450),obj('return-skybridge','f01:lift',125,735),obj('market-shortcut','f01:bulkhead',115,485),obj('bastion-gate','f01:bulkhead',1015,175),obj('marshal-entry','f01:planning',650,450),obj('crane','f01:yard-crane',505,255),obj('cargo-upper','f01:freight-stack',800,175),obj('cargo-middle','f01:freight-crates',480,420),obj('cargo-west','f01:freight-stack',330,570),obj('cargo-bottom','f01:freight-crates',600,765)]
map=dict(format='pawtrail-stage',version=1,name='Neon Switchyard',width=36,height=28,baseTile='tile:stone',groundArt='f01:switchyard-ground',tiles={},shell=False,wallpaper='cream',walkable=[[85,155],[145,132],[190,115],[320,125],[800,125],[840,110],[935,110],[955,75],[1080,75],[1105,125],[1090,365],[1110,400],[1105,665],[1070,700],[1070,765],[930,780],[915,805],[530,805],[485,760],[410,760],[375,790],[190,795],[160,840],[90,840],[90,780],[35,730],[35,555],[60,510],[35,485],[35,430],[65,395],[60,290],[40,265],[40,220],[80,180]],objects=objects)
write(ROOT/'src/game/stage-editor/maps/f01-switchyard-v1.json',map)
write(OUT/'manifest.json',dict(version=1,package='f01-batch-c-v1',grounds=grounds,assets=[dict(id=a['id'],file=a['file'],width=a['width'],height=a['height'],anchor=a['anchor'],motion=a.get('motion'),representation='live-textured-3d' if a.get('liveModel') else 'shared-actor-rig' if a.get('npc') else 'animated-2d') for a in assets],verification='Authoring only; runtime checks deferred by owner'))
