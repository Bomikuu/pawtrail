"""Register only scoped F01 Batch B native manifests and editable map templates."""
from pathlib import Path
import json,copy
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/pawtrail-game/floors/f01/batch-b-v1';URL='/pawtrail-game/floors/f01/batch-b-v1'
def write(path,value):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(value,indent=2)+'\n')
def geometry(ground,approaches,actions):return dict(version=2,ground=ground,placement=ground,approaches=approaches,seats=[],surfaces=[],occlusion='base',actions=actions)
def furniture(a,geom,interaction):return dict(id=a['id'].replace(':','-'),label=a['label'],file=a['file'],width=a['width'],height=a['height'],anchor=a['anchor'],footprint=a['footprint'],geometry=geom,blocking=True,rotatable=len(a['rotations'])>1,category=a['category'],interaction=interaction,price=0,zones=['interior','yard'])
def obj(id,asset,x,y,layer='world'):return dict(id=id,asset=asset,x=x,y=y,elevation=0,layer=layer,bias=0,rotation=0)
def run():
 grounds=[dict(id='f01:'+k,label=label,file=URL+'/'+k+'.png',width=w,height=h,reflections=refs) for k,label,w,h,refs in [('undergrid-ground','Undergrid',1280,896,[[470,350,180,45],[970,650,140,35],[650,790,160,20]]),('skybridge-ground','Rainline Skybridge',1280,768,[[700,285,260,25],[300,500,120,22],[20,10,230,40],[1040,20,200,30]])]]
 assets=[]
 for key,label,size,anchor,foot,motion in [
  ('pump-array','Double turbine pump',[224,176],[112,169],[13,124,198,45],dict(kind='fan',cycleMs=4600,rotors=[[96,22,15,8],[138,22,15,8]])),
  ('coolant-reservoir','Coolant reservoir',[176,128],[88,122],[8,64,160,58],dict(kind='flow',cycleMs=6600,flow=[32,54,118,41])),
  ('pipe-wall','Insulated pipe wall',[320,144],[160,138],[7,119,306,19],dict(kind='lights',cycleMs=7800))]:
  assets.append(dict(id='f01:'+key,label=label,category='Floor 01 · utility scenery',kind='object',file=URL+'/'+key+'.png',width=size[0],height=size[1],anchor=anchor,footprint=foot,rotations=[0],motion=motion))
 models=json.loads((OUT/'model-manifest.json').read_text())
 for item in models['assets']:
  key=item['id'];v=item['views']['0'];a=dict(id='f01:'+key,label={'relay':'P02 relay board','archive':'P03 signal archive','supply':'Utility supply cabinet','valve':'Coolant harvest valve'}[key],category='Floor 01 · usable 3D',kind='object',file=URL+f'/models/{key}/0.png',width=160,height=192,anchor=[80,168],footprint=v['footprint'],rotations=[0,90,180,270],liveModel=dict(file=item['model']))
  f=furniture(a,v['geometry'],'inspect_plan');f['supportedRotations']=a['rotations'];f['renderedViews']={k:{**v,'file':URL+f'/models/{key}/{k}.png'} for k,v in item['views'].items()};f['orientationVariants']={k:URL+f'/models/{key}/{k}.png' for k in item['views']};a['furniture']=f;assets.append(a)
 base=json.loads((ROOT/'src/game/stage-editor/f01-art.json').read_text())
 a=copy.deepcopy(next(x for x in base['assets'] if x['id']=='f01:mara'));a.update(id='f01:nyx',label='Nyx Tal',file='/pawtrail-game/floors/f01/npcs/nyx/body.png',npc='nyx');a['furniture']=furniture(a,a['furniture']['geometry'],'talk_npc');assets.append(a)
 a=copy.deepcopy(next(x for x in base['assets'] if x['id']=='f01:holo-head'));a.update(id='f01:eko',label='EKO-9',npc='eko');a['furniture']=furniture(a,geometry([a['footprint']],[[80,245],[8,225],[152,225]],['talk_npc']),'talk_npc');assets.append(a)
 write(ROOT/'src/game/stage-editor/f01-batch-b-art.json',dict(version=1,grounds=grounds,assets=assets))
 under=[obj('return-market','f01:lift',105,790),obj('skybridge-lift','f01:lift',1130,210),obj('pump-main','f01:pump-array',220,485),obj('reservoir','f01:coolant-reservoir',215,635),obj('coolant-reservoir','f01:valve',365,650),obj('p02','f01:relay',930,280),obj('relay-west','f01:supply',800,280),obj('relay-east','f01:supply',1050,365),obj('undergrid-plan','f01:planning',120,700)]
 under += [obj('pipe-back-'+str(i),'f01:pipe-wall',180+i*320,100) for i in range(4)]
 under += [obj('pipe-service','f01:pipe-wall',720,680),obj('utility-hvac','f01:hvac',470,520),obj('pump-central','f01:pump-array',730,580),obj('pump-spare','f01:pump-array',580,230)]
 # Deck boundary is measured from generated ground; an inset keeps all foot corners off the void.
 raw=[[40,790],[510,790],[550,735],[1220,735],[1300,670],[1390,650],[1450,550],[1570,495],[1570,245],[1490,245],[1460,305],[1300,305],[1250,275],[1250,140],[1000,140],[920,200],[900,270],[740,280],[670,225],[510,225],[470,285],[400,290],[370,320],[240,335],[210,375],[100,390],[40,420]]
 boundary=[[round(x*1280/1619),round(y*768/971)] for x,y in raw]
 sky=[obj('return-undergrid','f01:lift',155,555),obj('switchyard-gate','f01:lift',1165,335),obj('p03','f01:archive',895,230),obj('archive-locker','f01:supply',1020,295),obj('maintenance-plaque','f01:planning',780,250),obj('nyx','f01:nyx',390,285),obj('courier-shelter','f01:clinic-canopy',365,270),obj('courier-seat','f01:camp-seat',445,290)]
 sky +=[obj('bridge-rail-'+str(i),'f01:railing',605+i*125,596) for i in range(3)]
 sky +=[obj('bridge-advert','f01:holo-head',110,450),obj('bridge-koi','f01:holo-koi',800,535)]
 for key,name,width,height,ground,objects,walkable in [('undergrid','Undergrid',40,28,'undergrid-ground',under,[[22,35],[1255,35],[1255,866],[22,866]]),('skybridge','Rainline Skybridge',40,24,'skybridge-ground',sky,boundary)]:
  value=dict(format='pawtrail-stage',version=1,name=name,width=width,height=height,baseTile='tile:stone',groundArt='f01:'+ground,tiles={},shell=False,wallpaper='cream',objects=objects)
  if walkable:value['walkable']=walkable
  write(ROOT/f'src/game/stage-editor/maps/f01-{key}-v1.json',value)
 write(OUT/'manifest.json',dict(version=1,package='f01-batch-b-v1',grounds=grounds,assets=[dict(id=a['id'],file=a['file'],width=a['width'],height=a['height'],anchor=a['anchor'],motion=a.get('motion'),representation='live-textured-3d' if a.get('liveModel') else 'shared-actor-rig' if a.get('npc')=='nyx' else 'animated-2d') for a in assets],verification='Native artwork inspected; runtime verification deferred by owner'))
 print('Registered Batch B native assets and two editable templates')
if __name__=='__main__':run()
