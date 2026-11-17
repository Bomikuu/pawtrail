"""Export a genuinely rebuilt Maya candidate. This helper has not been run here."""
import bpy
from pathlib import Path
root=bpy.data.objects.get('MayaPortraitRoot')
if root is None: raise RuntimeError('Create MayaPortraitRoot before export.')
if root.get('authoringStatus')=='procedural-starter-not-approved': raise RuntimeError('This is still marked as the starter. Rebuild and review it, then set authoringStatus to artist-candidate; do not rename the starter to claim fidelity.')
required=['MayaHead','MayaHair','MayaTorso']
missing=[name for name in required if bpy.data.objects.get(name) is None]
if missing: raise RuntimeError('Missing authored groups: '+', '.join(missing))
for obj in bpy.context.selected_objects: obj.select_set(False)
def select_tree(obj):
 obj.select_set(True)
 for child in obj.children: select_tree(child)
select_tree(root)
pose=bpy.data.objects.get('MayaReferencePose_DO_NOT_EXPORT')
rotation=pose.rotation_euler.copy() if pose else None
if pose: pose.rotation_euler.z=0
try:
 output=Path(bpy.data.filepath).parent/'maya.glb'
 bpy.ops.export_scene.gltf(filepath=str(output),export_format='GLB',use_selection=True,export_yup=True,export_animations=False,export_morph=True,export_extras=True)
 print('Exported '+str(output)+'. Review with the saved runtime reference yaw; no likeness approval is implied.')
finally:
 if pose: pose.rotation_euler=rotation
