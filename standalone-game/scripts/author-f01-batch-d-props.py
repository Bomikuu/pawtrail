"""Approved Phase 6 craft outputs: real painted volumes and native contacts."""
from pathlib import Path
base=Path(__file__).with_name('author-f01-props.py').read_text()
exec(compile(base.split("manifest={'version':1")[0],str(Path(__file__).with_name('author-f01-props.py')),'exec'))
OUT=ROOT/'public/pawtrail-game/floors/f01/batch-d-v1';SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-d-v1';palette.update(fabric='#414658',fabriclight='#4d5365',red='#704b51',**{'holo-cyan':'#66e5ed','holo-pink':'#f285d6'})
def ellipsoid(name,pos,size,kind='cyan',parent=None):
 x,y,z=pos;bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=10,radius=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.scale=(size[0]/2,size[2]/2,size[1]/2);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material(KEY,kind));
 if parent:o.parent=parent
 return o

def koi():
 box('bottom brass plinth',(0,3,0),(48,6,38),'brass',bevel=4)
 box('emitter body',(0,12,0),(45,15,35),'metal',bevel=4)
 box('front generated paint',(0,12,18),(36,10,1),'metal','front',bevel=1)
 bpy.ops.mesh.primitive_cylinder_add(vertices=8,radius=24,depth=7,location=(0,0,21));crown=bpy.context.object;crown.name='octagonal emitter crown';crown.scale.y=38/48;crown.data.materials.append(material(KEY,'edge'))
 box('top ring',(0,25,0),(33,3,27),'brass',bevel=5)
 box('projection aperture',(0,27,0),(29,2,23),'cyan',bevel=5)
 for x in [-17,17]:
  for z in [-12,12]:box('brass foot',(x,1,z),(8,3,8),'brass',bevel=2)
 for x in [-15,15]:
  for yy in [10,14]:box('front vent',(x,yy,18),(10,1.3,1),'dark')
 box('back service hatch',(0,12,-19),(26,12,2),'metal','back',bevel=1)
 for x in [-10,10]:box('rear coupling',(x,7,-21),(4,11,4),'cyan' if x<0 else 'pink',bevel=2)
 projection=group('koi-projection')
 for i,(x,y,z,kind) in enumerate([(-7,51,-2,'holo-cyan'),(8,38,3,'holo-pink')]):
  g=group('koi-fish-'+str(i));g.parent=projection;g.location=(x,-z,y)
  ellipsoid('koi body',(0,0,0),(18,7,5),kind,g);ellipsoid('round koi head',(7,0,0),(7,6,5),kind,g)
  tail=group('koi-tail-'+str(i));tail.parent=g;tail.location=(-8,0,0)
  for yy in [-3,3]:
   fin=box('forked tail',(-3,yy,0),(8,2,1),kind,bevel=1,parent=tail);fin.rotation_euler.y=math.radians(25 if yy>0 else -25)
  for zz in [-3,3]:box('pectoral fin',(0,-1,zz),(6,1,5),kind,bevel=1,parent=g)
  box('dorsal fin',(-2,4,0),(9,3,1),kind,bevel=1,parent=g)
  for zz in [-2.6,2.6]:ellipsoid('koi eye',(8,1,zz),(1.4,1.4,.7),'dark',g)
 return {'size':[48,60,42],'ground':[[-24,-21,48,42]],'approach':[0,39],'action':'toggle_light'}

def bench():
 # Stable low chassis with four separate feet, rounded upholstery and readable edges.
 for x in [-51,51]:
  for z in [-14,14]:
   o=box('angled bracket foot',(x,7,z),(9,14,8),'metal','metal',bevel=1.5);o.rotation_euler.y=math.radians(-12 if x<0 else 12)
   box('foot cap',(x+(1 if x>0 else -1),1,z),(11,3,10),'brass',bevel=1)
 box('seat chassis',(0,16,0),(116,10,40),'metal','metal',bevel=3)
 box('front apron',(0,16,22),(92,7,3),'metal','metal',bevel=2)
 for x in [-26,26]:
  box('rounded seat cushion',(x,25,2),(48,10,34),'fabric','fabric',bevel=4)
  back=box('rounded padded back',(x,43,-14),(48,29,10),'fabric','fabric',bevel=4);back.rotation_euler.x=math.radians(-7)
  for dx in [-14,-7,0,7,14]:box('back upholstery channel',(x+dx,43,-8.9),(1,22,.6),'fabriclight',bevel=.2)
 for x in [-56,56]:
  box('armored side',(x,26,0),(8,28,38),'red','side',bevel=3)
  box('soft rounded arm',(x,40,0),(13,12,34),'fabric','fabric',bevel=5)
  box('brass arm cap',(x,38,17),(13,8,4),'brass',bevel=3)
  box('amber front lamp',(x,26,20),(3,14,2),'amber',bevel=1)
 box('rear shell',(0,38,-21),(112,35,4),'metal','back',bevel=3)
 for y in [23,37,53]:
  box('rear crossrail',(0,y,-25),(116,4,4),'edge',bevel=1)
  for x in [-44,44]:box('rail collar',(x,y,-26),(8,7,3),'brass',bevel=1)
 box('rear soft lamp',(0,18,-26),(28,2,1),'cyan',bevel=1)
 return {'size':[125,58,54],'ground':[[-63,-27,126,54]],'approach':[0,47],'action':'sit','seats':[[-26,30,4],[26,30,4]]}

manifest={'version':1,'frame':{'width':160,'height':192,'anchor':[80,168]},'pitch':34.5,'representation':'live-textured-3d','assets':[]}
for KEY,build in [('koi-lamp',koi),('bastion-bench',bench)]:
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 info=build()
 for name,m in materials.items():
  if 'holo-' in name:
   bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Emission Color'].default_value=bs.inputs['Base Color'].default_value;bs.inputs['Emission Strength'].default_value=1.5;bs.inputs['Alpha'].default_value=.82;m.surface_render_method='DITHERED'
 objects=[o for o in bpy.context.scene.objects if o.type in ['MESH','EMPTY']]
 for o in objects:o.select_set(True)
 path=OUT/'models'/KEY;path.mkdir(parents=True,exist_ok=True)
 bpy.ops.export_scene.gltf(filepath=str(path/'model.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=8;scene.cycles.use_denoising=False;scene.render.threads_mode='FIXED';scene.render.threads=2;scene.render.resolution_x=160;scene.render.resolution_y=192;scene.render.resolution_percentage=100;scene.render.film_transparent=True
 scene.world.color=(.36,.36,.36);scene.view_settings.view_transform='Standard';scene.view_settings.look='None';scene.view_settings.exposure=0;scene.view_settings.gamma=1
 bpy.ops.object.light_add(type='AREA',location=(-80,-120,180));bpy.context.object.data.energy=220000;bpy.context.object.data.size=140
 target=Vector((0,math.sin(PITCH)*72,math.cos(PITCH)*72));bpy.ops.object.camera_add(location=target+Vector((0,-math.cos(PITCH)*300,math.sin(PITCH)*300)));cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=192;scene.camera=cam
 piv=group('render-turntable')
 for o in objects:
  if o.parent is None:o.parent=piv
 views={}
 for facing in [0,90,180,270]:
  piv.rotation_euler.z=math.radians(-facing);scene.render.filepath=str(path/f'{facing}.png');bpy.ops.render.render(write_still=True)
  def project(x,y,z):
   a=math.radians(-facing);xx=x*math.cos(a)+z*math.sin(a);zz=-x*math.sin(a)+z*math.cos(a)
   return [round(80+xx,3),round(168+zz*math.sin(PITCH)-y*math.cos(PITCH),3)]
  ground=[[r[0]+80,r[1]+168,r[2],r[3]] for r in [native_rect(rect,facing) for rect in info['ground']]];approach=project(info['approach'][0],0,info['approach'][1]);seats=[]
  for i,(x,y,z) in enumerate(info.get('seats',[])):
   pt=project(x,0,z);elevation=pt[1]-project(x,y-5.8,z)[1];exit=project(x,0,47)
   seats.append({'id':'seat-'+str(i+1),'point':pt,'facing':'down','elevation':round(elevation,3),'exit':exit})
  views[str(facing)]={'width':160,'height':192,'anchor':[80,168],'footprint':ground[0],'geometry':{'version':2,'ground':ground,'placement':ground,'approaches':[approach]+[s['exit'] for s in seats],'seats':seats,'surfaces':[],'occlusion':'base','actions':[info['action']]}}
  if KEY=='bastion-bench':
   # Foreground geometry is rendered from the same model/camera for seated occlusion.
   for o in objects:
    if o.type!='MESH':continue
    x,z,height=o.location.x,-o.location.y,o.location.z
    o.hide_render=not ((facing==0 and (abs(x)>44 or z>18 and height<22)) or (facing==180 and z< -18) or (facing==90 and x>44) or (facing==270 and x< -44))
   scene.render.filepath=str(path/f'{facing}-front.png');bpy.ops.render.render(write_still=True)
   for o in objects:o.hide_render=False
 piv.rotation_euler.z=0;bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{KEY}-source.blend'))
 manifest['assets'].append({'id':KEY,'model':f'/pawtrail-game/floors/f01/batch-d-v1/models/{KEY}/model.glb','views':views,'action':info['action'],'sourceDimensions':info['size'],'keyedNodes':[o.name for o in objects if o.type=='EMPTY']})
(OUT/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(SOURCE/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
