"""Approved Batch C live models; generated paint, four facings, native contacts."""
from pathlib import Path
base=Path(__file__).with_name('author-f01-props.py').read_text()
exec(compile(base.split("manifest={'version':1")[0],str(Path(__file__).with_name('author-f01-props.py')),'exec'))
OUT=ROOT/'public/pawtrail-game/floors/f01/batch-c-v1';SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-c-v1'

def bulkhead():
 box('sill',(0,3,0),(124,6,30),'edge',bevel=2)
 box('recess',(0,58,-11),(100,110,3),'dark',bevel=3)
 for x in [-55,55]:
  box('jamb',(x,62,0),(14,118,30),'metal','metal',bevel=3)
  for y in [12,106]:box('jamb collar',(x,y,0),(19,15,32),'edge',bevel=2)
  box('amber jamb',(x,62,16),(3,62,1),'amber',bevel=1)
 box('lintel',(0,116,0),(120,17,30),'metal','metal',bevel=3)
 box('lintel lamp',(0,117,16),(34,4,1),'pink',bevel=1)
 for i,x in enumerate([-24,24]):
  g=group('door-left' if i==0 else 'door-right')
  box('split armored door',(x,58,1),(47,102,9),'metal','front',bevel=2,parent=g)
  for y in [14,98]:box('reinforcement',(x,y,7),(46,5,3),'brass',parent=g)
  box('seam rail',(x+(20 if i==0 else -20),58,7),(3,96,2),'edge',parent=g)
  box('service window',(x,69,7),(12,28,1),'cyan',bevel=2,parent=g)
 for x in range(-54,55,12):
  o=box('hazard sill',(x,6,15),(6,3,2),'brass',bevel=0);o.rotation_euler.y=.25
 box('rear service panel',(0,62,-17),(96,86,3),'metal','back',bevel=2)
 for y in range(28,86,7):box('rear vent',(0,y,-19),(66,2,1),'dark')
 for x in [-63,63]:box('side panel',(x,61,0),(2,88,25),'metal','side',bevel=1)
 return {'size':[128,125,38],'ground':[[-65,-19,130,38]],'openGround':[[-78,-19,52,38],[26,-19,52,38]],'approach':[0,43],'action':'toggle_door'}

def authorization():
 box('foot',(0,3,0),(92,6,38),'edge',bevel=2)
 box('desk cabinet',(0,30,-2),(86,53,30),'metal','front',bevel=3)
 box('sloped console',(0,59,0),(92,13,38),'metal','metal',bevel=3)
 box('rear screen rim',(0,72,-9),(26,22,5),'brass',bevel=2)
 box('central screen',(0,72,-5.5),(21,16,1),'cyan',bevel=1)
 for i,x in enumerate([-26,26]):
  box('empty record recess',(x,67,5),(17,3,18),'dark',bevel=2)
  for sx in [-1,1]:box('slot rail',(x+sx*10,69,5),(2,5,20),'brass',bevel=1)
  g=group('sealed-record-left' if i==0 else 'sealed-record-right')
  box('seated record',(x,71,5),(13,7,14),'brass' if i==0 else 'pink',bevel=1,parent=g)
  box('record signature',(x,75,5),(7,1,9),'cyan',bevel=0,parent=g)
 box('amber acceptance lamp',(39,75,-8),(5,10,5),'amber',bevel=2)
 box('rear panel',(0,30,-19),(76,42,2),'metal','back',bevel=1)
 for x in [-24,-12,0,12,24]:box('rear cable',(x,20,-21),(3,28,3),'dark',bevel=1)
 for x in [-45,45]:box('side hatch',(x,31,-2),(2,34,24),'metal','side',bevel=1)
 return {'size':[96,84,44],'ground':[[-48,-22,96,44]],'approach':[0,45],'action':'inspect_plan'}

manifest={'version':1,'frame':{'width':160,'height':192,'anchor':[80,168]},'pitch':34.5,'representation':'live-textured-3d','assets':[]}
for KEY,build in [('bulkhead',bulkhead),('authorization',authorization)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 info=build();objects=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY']]
 for o in objects:o.select_set(True)
 path=OUT/'models'/KEY;path.mkdir(parents=True,exist_ok=True)
 bpy.ops.export_scene.gltf(filepath=str(path/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
 for o in objects:
  if o.name.startswith('sealed-record-'):o.hide_render=True
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2
 scene.render.resolution_x=160;scene.render.resolution_y=192;scene.render.resolution_percentage=100;scene.render.film_transparent=True
 scene.world.color=(.36,.36,.36);scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
 bpy.ops.object.light_add(type='AREA',location=(-80,-120,180));light=bpy.context.object;light.data.energy=220000;light.data.shape='DISK';light.data.size=140
 target=Vector((0,math.sin(PITCH)*72,math.cos(PITCH)*72))
 bpy.ops.object.camera_add(location=target+Vector((0,-math.cos(PITCH)*300,math.sin(PITCH)*300)));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=192;scene.camera=cam
 piv=group('render-turntable')
 for o in objects:
  if o.parent is None:o.parent=piv
 views={}
 for facing in [0,90,180,270]:
  piv.rotation_euler.z=math.radians(-facing);scene.render.filepath=str(path/f'{facing}.png');bpy.ops.render.render(write_still=True)
  convert=lambda rects:[[r[0]+80,r[1]+168,r[2],r[3]] for r in [native_rect(rect,facing) for rect in rects]]
  ground=convert(info['ground']);ax,az=info['approach'];a=math.radians(-facing)
  approach=[80+round(ax*math.cos(a)+az*math.sin(a),3),168+round((-ax*math.sin(a)+az*math.cos(a))*math.sin(PITCH),3)]
  geometry={'version':2,'ground':ground,'placement':ground,'approaches':[approach],'seats':[],'surfaces':[],'occlusion':'base','actions':[info['action']]}
  if 'openGround' in info:geometry['openGround']=convert(info['openGround'])
  views[str(facing)]={'width':160,'height':192,'anchor':[80,168],'footprint':ground[0],'geometry':geometry}
 piv.rotation_euler.z=0;bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{KEY}-source.blend'))
 manifest['assets'].append({'id':KEY,'model':f'/pawtrail-game/floors/f01/batch-c-v1/models/{KEY}/model.glb','views':views,'sourceDimensions':info['size'],'action':info['action'],'keyedNodes':[o.name for o in objects if o.type=='EMPTY']})
(OUT/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(SOURCE/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
