"""Blender authoring setup; supplied for the artist, not executed in this workspace.
Run inside Blender: blender --python blender-setup.py -- --bundle /path/to/unzipped
"""
import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
bundle=Path(args[args.index('--bundle')+1]) if '--bundle' in args else Path(__file__).resolve().parent
reference=json.loads((bundle/'reference/reference.json').read_text())
cam=reference['camera']
def point(values): return Vector((values[0],-values[2],values[1]))
if (bundle/'prototype-bust.glb').exists(): bpy.ops.import_scene.gltf(filepath=str(bundle/'prototype-bust.glb'))
root=bpy.data.objects.get('MayaPortraitRoot')
if not root:
 root=bpy.data.objects.new('MayaPortraitRoot',None);bpy.context.collection.objects.link(root)
 root['authoringStatus']='procedural-starter-not-approved'
pose=bpy.data.objects.new('MayaReferencePose_DO_NOT_EXPORT',None);bpy.context.collection.objects.link(pose)
original=root.matrix_world.copy();root.parent=pose;root.matrix_world=original
pose.rotation_euler.z=reference['pose']['yaw']
data=bpy.data.cameras.new('MayaReferenceCamera');data.type='ORTHO';data.ortho_scale=cam['height'];data.clip_start=cam['near'];data.clip_end=cam['far']
camera=bpy.data.objects.new('MayaReferenceCamera',data);bpy.context.collection.objects.link(camera)
camera.location=point(cam['position']);target=point(cam['target']);camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler()
data.show_background_images=True
background=data.background_images.new();background.image=bpy.data.images.load(str(bundle/'reference/maya.png'));background.alpha=.5;background.display_depth='FRONT';background.frame_method='FIT'
scene=bpy.context.scene;scene.camera=camera;scene.render.resolution_x=192;scene.render.resolution_y=192;scene.render.resolution_percentage=100;scene.render.film_transparent=True
scene.view_settings.view_transform='Standard'
try: scene.view_settings.look='None'
except (TypeError,ValueError): pass
scene.view_settings.exposure=0;scene.view_settings.gamma=1
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
guides=bpy.data.objects.new('REFERENCE_GUIDES_DO_NOT_EXPORT',None);bpy.context.collection.objects.link(guides)
q=camera.rotation_euler.to_quaternion();right=q@Vector((1,0,0));up=q@Vector((0,1,0))
for mark in reference['landmarks']:
 x=(mark['pixel'][0]*2/192-.5)*cam['height'];y=(.5-mark['pixel'][1]*2/192)*cam['height']
 empty=bpy.data.objects.new('REF_'+mark['node'],None);bpy.context.collection.objects.link(empty);empty.parent=guides;empty.location=target+right*x+up*y;empty.empty_display_type='SPHERE';empty.empty_display_size=.10
 empty['guideOnly']='Source-image target; NOT an actual measured model landmark. Do not export.'
print('Reference scaffold created. Replace the prototype geometry; author actual LM_* nodes on the model. Reference guides are not acceptance evidence.')
