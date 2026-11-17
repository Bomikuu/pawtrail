"""Author only Batch B props in a fresh background Blender scene."""
from pathlib import Path
# Reuse the accepted Batch A bevel/material/native-camera helpers without running its job.
base=Path(__file__).with_name('author-f01-props.py').read_text()
exec(compile(base.split("manifest={'version':1")[0],str(Path(__file__).with_name('author-f01-props.py')),'exec'))
OUT=ROOT/'public/pawtrail-game/floors/f01/batch-b-v1'
SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-b-v1'
palette['red']='#9e4c4d'

def pivot(name,pos):
 o=group(name);x,y,z=pos;o.location=(x,-z,y);return o

def cylinder(name,pos,radius,depth,kind='brass',parent=None):
 x,y,z=pos;bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=radius,depth=depth,location=(x,-z,y));o=bpy.context.object;o.name=name;o.data.materials.append(material(KEY,kind))
 if parent:o.parent=parent
 return o

def cabinet(w,h,d):
 box('base',(0,3,0),(w+6,6,d+4),'edge',bevel=2)
 box('shell',(0,h/2+4,0),(w,h,d),'metal','metal',bevel=2)
 box('back hatch',(0,h/2,-d/2-1),(w-12,h-16,2),'metal','back',bevel=1)
 for x in [-w/2,w/2]:
  box('corner rail',(x,h/2+4,0),(4,h,d+2),'edge',bevel=1)
  box('side paint',(x,h/2,-1),(1,h-14,d-5),'metal','side',bevel=0)
  for y in [9,h-3]:box('collar',(x,y,0),(7,7,d+5),'brass')
 for x in [-w*.36,w*.36]:box('lamp',(x,h+5,d/2),(10,3,2),'amber')

def relay():
 cabinet(77,91,23)
 panel(0,48,13,68,72,'front')
 ports={1:[2,1],2:[3,2],3:[3,1],4:[3,0],5:[0,1]}
 for row in range(3):
  for col in range(3):
   i=row*3+col;x=(col-1)*23;y=73-row*24
   box('cell recess',(x,y,16),(21,22,3),'dark',bevel=1)
   p=pivot('relay-rotor-'+str(i),(x,y,19))
   box('coil core',(0,0,0),(10,11,2),'cyan' if i%2==0 else 'pink',bevel=2,parent=p)
   for dy in [-4,0,4]:box('coil band',(0,dy,2),(12,1,2),'brass',parent=p)
   for direction in ports.get(i,[]):
    xx,yy=[(0,7),(7,0),(0,-7),(-7,0)][direction]
    box('connector',(xx,yy,3),(4 if xx==0 else 13,13 if xx==0 else 4,2),'cyan',bevel=1,parent=p)
 return {'size':[86,100,27],'ground':[[-43,-14,86,28]],'approach':[0,43],'action':'inspect_plan'}

def archive():
 cabinet(51,96,25)
 panel(0,62,14,41,43,'front')
 for i,x in enumerate([-17,-6,6,17]):box('symbol light',(x,86,15),(8,8,2),'cyan' if i%2==0 else 'pink',bevel=2)
 drawer=group('archive-drawer')
 box('archive drawer',(0,22,15),(42,24,8),'metal',bevel=1,parent=drawer)
 box('drawer paint',(0,22,19.5),(37,19,1),'metal','front',bevel=0,parent=drawer)
 box('drawer handle',(0,29,21),(17,3,3),'brass',parent=drawer)
 box('archive memory cube',(0,28,6),(8,8,8),'cyan',bevel=1,parent=drawer)
 for y in [8,11,14]:box('vent',(0,y,14),(28,1.2,1),'dark')
 return {'size':[60,104,30],'ground':[[-30,-16,60,40]],'approach':[0,46],'action':'inspect_plan'}

def supply():
 cabinet(57,73,24)
 for i,sign in enumerate([-1,1]):
  door=pivot('cabinet-left' if i==0 else 'cabinet-right',(sign*27,39,14))
  box('door',(sign*-13,0,0),(25,57,3),'metal','front',bevel=1,parent=door)
  box('handle',(sign*-22,0,4),(2.5,15,3),'brass',parent=door)
  for yy in [12,16,20]:box('door vent',(sign*-13,yy,2),(17,1,1),'dark',parent=door)
  box('light strip',(sign*0,5,2),(1.5,18,1),'cyan',parent=door)
 return {'size':[66,82,30],'ground':[[-34,-16,68,45]],'approach':[0,46],'action':'inspect_plan'}

def valve():
 cabinet(52,40,29)
 panel(0,25,16,43,25,'front')
 for x in [-35,35]:
  box('pipe',(x,19,0),(19,11,11),'edge',bevel=4)
  box('flange',(x*.85,19,0),(4,18,18),'brass',bevel=2)
 cylinder('stem',(0,51,0),4,23,'brass')
 cylinder('stem collar',(0,46,0),12,5,'edge')
 wheel=pivot('valve-wheel',(0,66,0))
 bpy.ops.mesh.primitive_torus_add(major_radius=19,minor_radius=2.6,major_segments=32,minor_segments=8,location=(0,0,0));o=bpy.context.object;o.name='red handwheel';o.parent=wheel;o.data.materials.append(material(KEY,'red'))
 cylinder('hub',(0,0,0),4.5,5,'brass',wheel)
 for i in range(6):
  a=i*math.pi/3;spoke=box('wheel spoke',(math.cos(a)*10,0,math.sin(a)*10),(20,2.5,2.5),'red',bevel=1,parent=wheel);spoke.rotation_euler.z=-a
 cylinder('lamp foot',(-18,44,0),5,4)
 box('lamp',(-18,52,0),(6,11,6),'amber',bevel=2)
 box('gauge',(20,49,0),(13,16,6),'brass',bevel=3);panel(20,50,4,9,11,'side')
 return {'size':[90,72,40],'ground':[[-45,-20,90,40]],'approach':[0,44],'action':'inspect_plan'}

manifest={'version':1,'frame':{'width':160,'height':192,'anchor':[80,168]},'pitch':34.5,'representation':'live-textured-3d','assets':[]}
for KEY,build in [('relay',relay),('archive',archive),('supply',supply),('valve',valve)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 info=build();objects=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY']]
 for o in objects:o.select_set(True)
 path=OUT/'models'/KEY;path.mkdir(parents=True,exist_ok=True)
 bpy.ops.export_scene.gltf(filepath=str(path/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
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
  ground=[[r[0]+80,r[1]+168,r[2],r[3]] for r in [native_rect(rect,facing) for rect in info['ground']]]
  ax,az=info['approach'];a=math.radians(-facing)
  approach=[80+round(ax*math.cos(a)+az*math.sin(a),3),168+round((-ax*math.sin(a)+az*math.cos(a))*math.sin(PITCH),3)]
  views[str(facing)]={'width':160,'height':192,'anchor':[80,168],'footprint':ground[0],'geometry':{'version':2,'ground':ground,'placement':ground,'approaches':[approach],'seats':[],'surfaces':[],'occlusion':'base','actions':[info['action']]}}
 piv.rotation_euler.z=0;bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{KEY}-source.blend'))
 manifest['assets'].append({'id':KEY,'model':f'/pawtrail-game/floors/f01/batch-b-v1/models/{KEY}/model.glb','views':views,'sourceDimensions':info['size'],'action':info['action'],'keyedNodes':[o.name for o in objects if o.type=='EMPTY']})
(OUT/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(SOURCE/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Authored four Batch B geometry/paint packages')
