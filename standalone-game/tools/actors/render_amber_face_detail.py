"""Render an actual source-model close-up, without enlarging a body sprite."""
from pathlib import Path
import argparse
import sys
import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
folder = args.root / 'assets/actor-appearances/amber-parts-detail-v2'
bpy.ops.wm.open_mainfile(filepath=str(folder / 'amber-parts.blend'))
scene = bpy.context.scene
rig = bpy.data.objects['Amber_Parts_Rig']
rig.animation_data.action = bpy.data.actions['idle']; rig.rotation_euler.z = 0
scene.frame_set(1)
for action in bpy.data.actions:
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    if curve.data_path.endswith('.scale') and any(name in curve.data_path for name in ['face_open', 'face_closed']):
                        for key in curve.keyframe_points:
                            key.interpolation = 'CONSTANT'
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=str(folder / 'amber-parts.blend'))
bpy.ops.object.select_all(action='DESELECT'); rig.select_set(True)
for obj in bpy.context.scene.objects:
    if obj.type == 'MESH' and 'part_category' in obj:
        obj.select_set(True)
bpy.context.view_layer.objects.active = rig
bpy.ops.export_scene.gltf(filepath=str(folder / 'amber-parts.glb'), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS')
camera = scene.camera
camera.location = (0, -4, 5.32)
camera.rotation_euler = (Vector((0, 0, 4.12)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.ortho_scale = 1.9
scene.render.resolution_x = 512; scene.render.resolution_y = 640
scene.render.threads_mode = 'FIXED'; scene.render.threads = 2
scene.render.filepath = str(folder / 'face-closeup.png')
bpy.ops.render.render(write_still=True)
