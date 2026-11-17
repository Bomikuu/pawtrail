"""Build only the four approved F01 props in a fresh background Blender scene.
Geometry, embedded generated paint and four native views share one source.
Run: blender --background --factory-startup --threads 2 --python scripts/author-f01-props.py
"""
from pathlib import Path
import bpy, json, math
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/pawtrail-game/floors/f01/batch-a-v1'
SOURCE=ROOT/'assets/floors/f01-neon-heights/batch-a-v1'
PITCH=math.radians(34.5)
palette={'metal':'#3b3542','edge':'#76605c','dark':'#211e2d','brass':'#ac7a4b','cyan':'#53d7e6','pink':'#eb6dcb','amber':'#ffc274','wood':'#644330','paper':'#bc9968'}
materials={}

def color(hex): return tuple(int(hex[i:i+2],16)/255 for i in (1,3,5))+(1,)
def material(key,kind,paint=None):
    name=key+'-'+kind+('-'+paint if paint else '')
    if name in materials:return materials[name]
    m=bpy.data.materials.new(name);m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color(palette[kind]);bs.inputs['Roughness'].default_value=.88
    if kind in ['cyan','pink','amber']:
        bs.inputs['Emission Color'].default_value=color(palette[kind]);bs.inputs['Emission Strength'].default_value=.7
    if paint:
        image=bpy.data.images.load(str(OUT/'textures'/f'{key}-{paint}.png'),check_existing=True);image.pack()
        tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image;tex.interpolation='Closest'
        m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
    materials[name]=m;return m

def box(name,pos,size,kind='metal',paint=None,bevel=.5,parent=None):
    x,y,z=pos;w,h,d=size
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x,-z,y));o=bpy.context.object;o.name=name;o.dimensions=(w,d,h)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material(KEY,kind,paint))
    if bevel:
        mod=o.modifiers.new('Authored edge bevel','BEVEL');mod.width=min(bevel,min(size)/4);mod.segments=2
        bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
    if parent:o.parent=parent
    return o

def group(name):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);return o

def screw(x,y,z):box('rivet',(x,y,z),(1.7,1.7,1.4),'brass',bevel=.6)
def panel(x,y,z,w,h,paint):
    box('panel rim',(x,y,z),(w+3,h+3,3),'brass')
    box('painted '+paint,(x,y,z+1.8),(w,h,.8),'metal',paint,bevel=0)
    for dx in [-w/2,w/2]:
        for dy in [-h/2,h/2]:screw(x+dx,y+dy,z+2)

def lift():
    box('sill',(0,3,0),(88,6,30),'edge',bevel=2)
    box('dark portal recess',(0,47,-9),(62,88,3),'dark',bevel=2)
    for x in [-37,37]:
        box('column',(x,49,0),(14,94,24),'metal','metal',bevel=2)
        for y in [10,84]:box('column collar',(x,y,1),(18,10,28),'edge',bevel=2)
        box('amber shaft',(x,51,13),(3,46,1),'amber')
        for y in [21,26,31]:box('call light',(x,y,13),(3,2,1),'cyan' if y==26 else 'brass')
    box('lintel',(0,93,0),(78,18,26),'metal','metal',bevel=3)
    box('badge',(0,98,14),(28,12,2),'brass',bevel=2)
    box('badge inset',(0,98,15.3),(23,8,.7),'dark',bevel=1)
    for i,x in enumerate([-14,14]):
        door=group('door-left' if i==0 else 'door-right')
        box('door leaf',(x,46,3),(27,80,7),'metal','door-left' if i==0 else 'door-right',bevel=1,parent=door)
        box('door top trim',(x,83,7),(26,1.5,1),'brass',parent=door)
        box('door lower trim',(x,9,7),(26,1.5,1),'brass',parent=door)
        box('glass inset',(x,56,7),(6,36,1),'cyan',parent=door)
    box('rear service hatch',(0,47,-14),(44,62,2),'metal','back',bevel=1)
    for x in [-23,23]:
        box('outer side housing',(x,46,-9),(3,70,9),'metal','side')
    return {'size':[88,104,30],'ground':[[-44,-15,88,30]],'openGround':[[-44,-15,15,30],[29,-15,15,30]],'approach':[0,35],'action':'toggle_door'}

def allocation():
    box('plinth',(0,3,0),(80,6,34),'edge',bevel=2)
    box('cabinet',(0,40,-2),(73,72,22),'metal','metal',bevel=2)
    for i,x in enumerate([-24,0,24]):
        box('module rib',(x,42,0),(22,74,26),'metal','metal')
        panel(x,52,14,17,25,'screen-pink' if i==1 else 'screen-cyan')
        box('module strip',(x,72,14),(14,1.5,1),'pink' if i==1 else 'cyan')
        box('lever socket',(x,30,16),(13,11,7),'dark')
        lever=group('lever-'+str(i));box('lever',(x,32,21),(2,12,2),'brass',parent=lever)
        box('lever cap',(x,39,21),(5,3,4),'pink' if i==1 else 'cyan',parent=lever)
        for y in range(10,24,3):box('cable band',(x,y,15),(5,1.5,6),'pink' if i==1 else 'cyan')
        for sy in [-1,1]:screw(x+sy*8,43,16)
    box('rear service',(0,40,-15),(65,54,2),'metal','back')
    for x in [-40,40]:
        box('side pipe',(x,27,0),(4,42,5),'brass',bevel=1)
        box('side lamp',(x,52,0),(5,14,5),'amber',bevel=1)
    return {'size':[86,78,34],'ground':[[-43,-17,86,34]],'approach':[0,40],'action':'preview_allocation'}

def planning():
    for x in [-37,37]:
        box('foot',(x,3,0),(17,6,28),'edge',bevel=1)
        box('post',(x,43,0),(8,80,9),'wood','wood')
        box('post cap',(x,80,0),(12,5,13),'metal')
        box('rear brace',(x,19,-8),(6,35,5),'brass')
    box('board',(0,60,0),(80,48,7),'wood','wood')
    for y in [35,85]:box('board rail',(0,y,3),(89,5,11),'metal','metal')
    for x in [-43,43]:box('board edge',(x,60,3),(5,48,11),'metal','metal')
    panel(0,60,5,58,35,'map')
    box('console shelf',(28,36,12),(22,4,18),'brass')
    box('console housing',(28,41,9),(18,9,8),'dark')
    box('console glow',(28,44,14),(13,4,1),'cyan')
    box('lamp neck',(0,94,0),(2,15,2),'brass')
    box('lamp shade',(0,99,5),(12,4,10),'brass',bevel=2)
    box('lamp emission',(0,97,5),(8,2,7),'amber')
    return {'size':[89,102,32],'ground':[[-45,-14,90,28]],'approach':[0,36],'action':'inspect_plan'}

def counter():
    box('cabinet',(0,20,0),(84,36,34),'metal','metal',bevel=2)
    box('worktop',(0,40,0),(90,5,39),'wood','wood',bevel=2)
    for x in [-42,42]:
        box('corner beam',(x,21,0),(5,38,36),'edge')
        box('status strip',(x,23,19),(1.5,13,1),'cyan')
    for x in [-26,0,26]:
        panel(x,22,18,21,23,'drawer')
        box('handle',(x,28,21),(8,2,2),'brass')
    # A shallow transparent display has real side/top/back surfaces.
    box('display base',(18,44,-1),(42,4,29),'edge')
    box('display back',(18,54,-13),(42,18,2),'dark')
    panel(18,53,12,37,16,'display')
    for x in [-3,39]:box('display upright',(x,53,0),(2,20,28),'edge')
    box('display top',(18,63,0),(44,2,30),'cyan')
    box('cell',(18,49,0),(19,6,8),'cyan',bevel=2)
    lid=group('display-lid');box('lid rim',(18,65,0),(44,2,30),'brass',parent=lid)
    box('lamp foot',(-29,45,-4),(11,3,10),'brass',bevel=2)
    box('lamp arm',(-29,55,-4),(2,22,2),'brass')
    box('lamp shade',(-29,67,2),(14,5,12),'brass',bevel=2)
    box('lamp glow',(-29,64,2),(10,1,9),'amber')
    return {'size':[90,70,39],'ground':[[-45,-20,90,40]],'approach':[0,42],'action':'inspect_stock'}

def native_rect(rect,facing):
    x,z,w,d=rect;a=math.radians(-facing)
    pts=[(xx*math.cos(a)+zz*math.sin(a),(-xx*math.sin(a)+zz*math.cos(a))*math.sin(PITCH)) for xx in [x,x+w] for zz in [z,z+d]]
    l=min(p[0] for p in pts);t=min(p[1] for p in pts)
    return [round(l,3),round(t,3),round(max(p[0] for p in pts)-l,3),round(max(p[1] for p in pts)-t,3)]

manifest={'version':1,'frame':{'width':160,'height':192,'anchor':[80,168]},'pitch':34.5,'representation':'live-textured-3d','assets':[]}
for KEY,build in [('lift',lift),('allocation',allocation),('planning',planning),('counter',counter)]:
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
        # Blender Z rotation corresponds to Three's negative Y-facing rotation.
        piv.rotation_euler.z=math.radians(-facing)
        scene.render.filepath=str(path/f'{facing}.png');bpy.ops.render.render(write_still=True)
        ground=[native_rect(rect,facing) for rect in info['ground']]
        ground=[[r[0]+80,r[1]+168,r[2],r[3]] for r in ground]
        ax,az=info['approach'];a=math.radians(-facing)
        approach=[80+round(ax*math.cos(a)+az*math.sin(a),3),168+round((-ax*math.sin(a)+az*math.cos(a))*math.sin(PITCH),3)]
        view={'width':160,'height':192,'anchor':[80,168],'footprint':ground[0],'geometry':{'version':2,'ground':ground,'placement':ground,'approaches':[approach],'seats':[],'surfaces':[],'occlusion':'base','actions':[info['action']]}}
        if KEY=='lift':view['openGround']=[[r[0]+80,r[1]+168,r[2],r[3]] for r in [native_rect(rect,facing) for rect in info['openGround']]]
        views[str(facing)]=view
    piv.rotation_euler.z=0
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{KEY}-source.blend'))
    manifest['assets'].append({'id':KEY,'model':f'/pawtrail-game/floors/f01/batch-a-v1/models/{KEY}/model.glb','views':views,'sourceDimensions':info['size'],'action':info['action'],'keyedNodes':[o.name for o in objects if o.type=='EMPTY']})
(OUT/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(SOURCE/'model-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('F01 four approved model packages authored')
