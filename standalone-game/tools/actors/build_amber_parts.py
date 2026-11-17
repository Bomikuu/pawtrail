"""Blender authoring: editable part meshes, a rigid-weighted skeleton and offline renders.

Run with Blender --background --threads 2 --python this_file -- --root PROJECT.
This is reference-guided Blender mesh authoring, not neural image-to-3D generation.
"""
import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

args = argparse.ArgumentParser()
args.add_argument('--root', type=Path, required=True)
args.add_argument('--preview-only', action='store_true')
args.add_argument('--output-id', default='amber-parts-baked-v1')
args.add_argument('--detail', action='store_true')
args.add_argument('--face-texture', type=Path)
settings = args.parse_args(sys.argv[sys.argv.index('--') + 1:])
ROOT = settings.root
OUT = ROOT / 'assets/actor-appearances' / settings.output_id
OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'renders').mkdir(exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

COLORS = {
    'skin': '#efb797', 'skinLight': '#ffe0ba', 'skinShade': '#b46c5c',
    'hair': '#52352e', 'hairLight': '#815342', 'hairShade': '#302327',
    'red': '#a82935', 'redLight': '#d64a43', 'redShade': '#651c2c',
    'ivory': '#f1dfbc', 'gold': '#d3a456', 'goldShade': '#926237',
    'leather': '#674634', 'dark': '#30262b', 'ink': '#1b1720',
    'white': '#fff6df', 'amber': '#c98527', 'glass': '#6eacba',
}


def rgba(value):
    value = value.lstrip('#')
    # Blender node values are linear; references and the runtime palette are sRGB.
    rgb = [int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4 for c in rgb) + (1,)


MATS = {}
for key, color in COLORS.items():
    material = bpy.data.materials.new(key)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = rgba(color)
    bsdf.inputs['Roughness'].default_value = .78 if key not in ('gold', 'glass') else .37
    bsdf.inputs['Metallic'].default_value = .4 if key == 'gold' else 0
    material.diffuse_color = rgba(color)
    MATS[key] = material

# Explicit joints make the individual parts inspectable and re-authorable.
bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0))
RIG = bpy.context.object
RIG.name = 'Amber_Parts_Rig'
RIG.data.name = 'Amber_Comparison_Skeleton'
RIG.data.edit_bones.remove(RIG.data.edit_bones[0])
BONES = {}


def bone(name, head, tail, parent=None):
    item = RIG.data.edit_bones.new(name)
    item.head, item.tail = head, tail
    if parent:
        item.parent = BONES[parent]
    BONES[name] = item


bone('root', (0, 0, 0), (0, 0, .3))
bone('hips', (0, 0, 2.25), (0, 0, 2.55), 'root')
bone('spine', (0, 0, 2.45), (0, 0, 3.5), 'hips')
bone('head', (0, 0, 3.5), (0, 0, 4.4), 'spine')
bone('hair', (0, .2, 4.35), (0, .4, 2.65), 'head')
bone('ribbon', (0, 0, 4.65), (0, 0, 5.3), 'head')
bone('face_open', (0, -.4, 4.06), (0, -.4, 4.16), 'head')
bone('face_closed', (0, -.4, 4.06), (0, -.4, 4.16), 'head')
for sign, side in [(-1, 'L'), (1, 'R')]:
    bone('upper_arm.' + side, (sign * .65, 0, 3.32), (sign * .73, 0, 2.65), 'spine')
    bone('forearm.' + side, (sign * .73, 0, 2.65), (sign * .78, -.02, 2.02), 'upper_arm.' + side)
    bone('thigh.' + side, (sign * .31, 0, 2.25), (sign * .31, 0, 1.23), 'hips')
    bone('shin.' + side, (sign * .31, 0, 1.23), (sign * .31, 0, .19), 'thigh.' + side)
    bone('foot.' + side, (sign * .31, 0, .19), (sign * .31, -.35, .12), 'shin.' + side)
    bone('cape.' + side, (sign * .25, .25, 3.4), (sign * .3, .5, 2.35), 'spine')
bpy.ops.object.mode_set(mode='OBJECT')
RIG.show_in_front = True
PARTS = []


def bind(obj, name, material, joint, category):
    obj.name = name
    if material:
        obj.data.materials.append(MATS[material])
    group = obj.vertex_groups.new(name=joint)
    group.add(range(len(obj.data.vertices)), 1, 'REPLACE')
    mod = obj.modifiers.new('Skeleton binding', 'ARMATURE')
    mod.object = RIG
    obj.parent = RIG
    obj['part_category'] = category
    obj['bound_joint'] = joint
    PARTS.append(obj)
    return obj


def smooth(obj):
    for face in obj.data.polygons:
        face.use_smooth = True


def ellipsoid(name, center, size, mat, joint, category, segments=20):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=24 if settings.detail and segments >= 32 else 12, radius=1, location=center)
    obj = bpy.context.object
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    smooth(obj)
    return bind(obj, name, mat, joint, category)


def mesh(name, vertices, faces, mat, joint, category):
    data = bpy.data.meshes.new(name + '_mesh')
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    return bind(obj, name, mat, joint, category)


def rings(name, sections, mat, joint, category, segments=20):
    # Each cross-section is z, radius-x, radius-y, center-x, center-y.
    vertices = []
    for z, rx, ry, x, y in sections:
        for i in range(segments):
            angle = i * math.tau / segments
            vertices.append((x + rx * math.sin(angle), y - ry * math.cos(angle), z))
    faces = []
    for r in range(len(sections) - 1):
        for i in range(segments):
            a, b = r * segments + i, r * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.extend([tuple(reversed(range(segments))), tuple(range((len(sections) - 1) * segments, len(vertices)))])
    obj = mesh(name, vertices, faces, mat, joint, category)
    smooth(obj)
    return obj


def ribbon(name, path, widths, depths, mat, joint, category, segments=10):
    # A closed loft with elliptical sections: actual volume rather than flat art.
    vertices = []
    for index, point in enumerate(path):
        p = Vector(point)
        tangent = Vector(path[min(index + 1, len(path) - 1)]) - Vector(path[max(0, index - 1)])
        tangent.normalize()
        wide = tangent.cross(Vector((0, 1, 0)))
        if wide.length < .01:
            wide = Vector((1, 0, 0))
        wide.normalize()
        depth = tangent.cross(wide).normalized()
        for i in range(segments):
            angle = i * math.tau / segments
            vertices.append(p + wide * math.cos(angle) * widths[index] + depth * math.sin(angle) * depths[index])
    faces = []
    for r in range(len(path) - 1):
        for i in range(segments):
            a, b = r * segments + i, r * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.extend([tuple(reversed(range(segments))), tuple(range((len(path) - 1) * segments, len(vertices)))])
    obj = mesh(name, vertices, faces, mat, joint, category)
    smooth(obj)
    return obj


def line(name, points, radius, mat, joint, category):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'; curve.resolution_u = 2
    spline = curve.splines.new('POLY'); spline.points.add(len(points) - 1)
    for p, value in zip(spline.points, points):
        p.co = (*value, 1)
    curve.bevel_depth = radius; curve.bevel_resolution = 2
    obj = bpy.data.objects.new(name, curve); bpy.context.collection.objects.link(obj)
    bpy.ops.object.select_all(action='DESELECT'); obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    return bind(bpy.context.object, name, mat, joint, category)


# Fitted body and distinct red jacket panels.
rings('Ivory_fitted_bodice', [(2.35, .37, .22, 0, 0), (2.55, .40, .24, 0, 0), (2.8, .34, .23, 0, 0), (3.1, .46, .28, 0, -.01), (3.35, .48, .25, 0, 0), (3.48, .28, .19, 0, 0)], 'ivory', 'spine', 'bodice')
ellipsoid('Neck_skin', (0, 0, 3.53), (.18, .17, .27), 'skin', 'head', 'head')
rings('Shorts_waist', [(2.16, .49, .27, 0, 0), (2.42, .43, .25, 0, 0), (2.53, .39, .24, 0, 0)], 'redShade', 'hips', 'shorts')
for sign, side in [(-1, 'L'), (1, 'R')]:
    ribbon('Jacket_panel_' + side, [(sign * .51, -.06, 3.43), (sign * .48, -.22, 3.22), (sign * .42, -.23, 2.99), (sign * .39, -.18, 2.8)], [.19, .17, .14, .10], [.14, .12, .10, .07], 'red', 'spine', 'jacket')
    line('Jacket_gold_lapel_' + side, [(sign * .32, -.27, 3.43), (sign * .30, -.31, 3.2), (sign * .29, -.30, 2.97), (sign * .31, -.27, 2.8)], .023, 'gold', 'spine', 'trim')
    ellipsoid('Round_shoulder_cap_' + side, (sign * .62, 0, 3.29), (.28, .24, .25), 'red', 'upper_arm.' + side, 'sleeves')
    ellipsoid('Shoulder_gold_badge_' + side, (sign * .72, -.19, 3.3), (.12, .035, .095), 'gold', 'upper_arm.' + side, 'trim')
    rings('Long_dark_sleeve_' + side, [(2.67, .145, .15, sign * .73, 0), (2.85, .18, .17, sign * .71, 0), (3.24, .19, .19, sign * .65, 0)], 'dark', 'upper_arm.' + side, 'sleeves')
    rings('Fitted_forearm_' + side, [(2.08, .13, .135, sign * .78, -.02), (2.25, .15, .15, sign * .77, -.01), (2.66, .145, .15, sign * .73, 0)], 'dark', 'forearm.' + side, 'sleeves')
    rings('Red_glove_cuff_' + side, [(2.03, .16, .17, sign * .78, -.02), (2.24, .17, .18, sign * .77, -.02)], 'red', 'forearm.' + side, 'gloves')
    ellipsoid('Glove_hand_' + side, (sign * .78, -.025, 1.93), (.15, .14, .17), 'ivory', 'forearm.' + side, 'gloves')
    ellipsoid('Glove_thumb_' + side, (sign * .64, -.07, 1.99), (.075, .075, .11), 'red', 'forearm.' + side, 'gloves')
    rings('Shorts_leg_' + side, [(1.95, .25, .245, sign * .29, 0), (2.25, .29, .26, sign * .29, 0)], 'redShade', 'thigh.' + side, 'shorts')
    rings('Visible_thigh_' + side, [(1.65, .22, .22, sign * .31, 0), (2.08, .25, .24, sign * .31, 0)], 'skin', 'thigh.' + side, 'legs')
    rings('Thigh_boot_top_' + side, [(1.23, .19, .21, sign * .31, 0), (1.48, .22, .23, sign * .31, 0), (1.79, .245, .24, sign * .31, 0)], 'dark', 'thigh.' + side, 'boots')
    ribbon('Red_boot_panel_' + side, [(sign * .31, -.245, 1.8), (sign * .31, -.25, 1.6), (sign * .31, -.22, 1.38)], [.22, .18, .08], [.025, .03, .02], 'red', 'thigh.' + side, 'boots')
    line('Gold_boot_top_' + side, [(sign * .31 - .22, -.18, 1.78), (sign * .31, -.245, 1.72), (sign * .31 + .22, -.18, 1.78)], .018, 'gold', 'thigh.' + side, 'trim')
    rings('Boot_calf_' + side, [(.18, .13, .17, sign * .31, .015), (.55, .18, .19, sign * .31, .02), (1.0, .18, .22, sign * .31, 0), (1.24, .185, .21, sign * .31, 0)], 'dark', 'shin.' + side, 'boots')
    ellipsoid('Boot_foot_' + side, (sign * .31, -.12, .13), (.18, .34, .13), 'dark', 'foot.' + side, 'boots')
    ellipsoid('Boot_gold_toe_' + side, (sign * .31, -.31, .145), (.12, .15, .065), 'gold', 'foot.' + side, 'trim')
    ellipsoid('Boot_heel_' + side, (sign * .31, .20, .07), (.12, .10, .07), 'dark', 'foot.' + side, 'boots')
    for branch in [-1, 1]:
        line('Boot_gold_crest_' + side + str(branch), [(sign * .31, -.265, 1.43), (sign * .31 + branch * .055, -.275, 1.55), (sign * .31 + branch * .12, -.255, 1.65)], .018, 'gold', 'thigh.' + side, 'trim')
    ellipsoid('Leather_pouch_' + side, (sign * .53, .0, 2.38), (.16, .18, .21), 'leather', 'hips', 'belt')
    line('Pouch_gold_flap_' + side, [(sign * .53 - .13, -.18, 2.49), (sign * .53, -.21, 2.43), (sign * .53 + .13, -.18, 2.49)], .025, 'gold', 'hips', 'trim')
    # Split cloth has thickness and an independent parent bone.
    ribbon('Split_red_cape_' + side, [(sign * .25, .26, 3.43), (sign * .33, .36, 3.1), (sign * .38, .45, 2.72), (sign * .4, .52, 2.32)], [.24, .27, .26, .19], [.04, .05, .04, .02], 'redShade', 'cape.' + side, 'cape')
    line('Cape_gold_edge_' + side, [(sign * .48, .27, 3.4), (sign * .57, .38, 3.1), (sign * .61, .47, 2.7), (sign * .55, .53, 2.34)], .018, 'gold', 'cape.' + side, 'trim')

rings('Utility_belt', [(2.39, .445, .275, 0, 0), (2.53, .43, .27, 0, 0)], 'leather', 'hips', 'belt')
ellipsoid('Gold_belt_buckle', (0, -.28, 2.46), (.14, .035, .1), 'gold', 'hips', 'trim')
for sign in [-1, 1]:
    line('Bodice_gold_scroll_' + str(sign), [(sign * .25, -.267, 3.2), (sign * .12, -.30, 3.1), (sign * .16, -.26, 2.94), (sign * .07, -.25, 2.78), (0, -.25, 2.66)], .018, 'gold', 'spine', 'trim')
line('Bodice_center_fastening', [(0, -.3, 3.3), (0, -.30, 3.05), (0, -.26, 2.65)], .02, 'goldShade', 'spine', 'trim')

# Rounded skull with the approved painted face projected onto its real curvature.
ellipsoid('Face_skull', (0, -.015, 4.06), (.58, .43, .63), 'skin', 'head', 'head', 48 if settings.detail else 32)
ellipsoid('Face_chin', (0, -.10, 3.76), (.39, .34, .33), 'skin', 'head', 'head')
face_image = bpy.data.images.load(str(settings.face_texture or ROOT / 'public/pawtrail-game/actor-studio/amber-study-v3/anime-face.png'), check_existing=True)
face_image.pack()
for variant, column, joint in [('open', 0, 'face_open'), ('closed', 2, 'face_closed')]:
    vertices, faces, uv_coords = [], [], []
    segments = 32 if settings.detail else 16
    for row in range(segments + 1):
        for col in range(segments + 1):
            u, v = col / segments, row / segments
            x, z = (u - .5) * .96, 3.65 + v * .87
            y = -.015 - .43 * math.sqrt(max(.001, 1 - (x / .58) ** 2 - ((z - 4.06) / .63) ** 2))
            chin = 1 - (x / .39) ** 2 - ((z - 3.76) / .33) ** 2
            if chin > 0:
                y = min(y, -.10 - .34 * math.sqrt(chin))
            vertices.append((x, y - .008, z)); uv_coords.append(((column + u) / 3, v))
    for row in range(segments):
        for col in range(segments):
            a = row * (segments + 1) + col
            faces.append((a, a + 1, a + segments + 2, a + segments + 1))
    obj = mesh('Approved_anime_face_' + variant, vertices, faces, None, joint, 'face')
    uv_layer = obj.data.uv_layers.new(name='Approved_face_UV')
    for face in obj.data.polygons:
        for loop_index in face.loop_indices:
            uv_layer.data[loop_index].uv = uv_coords[obj.data.loops[loop_index].vertex_index]
    material = bpy.data.materials.new('Approved_face_' + variant); material.use_nodes = True
    texture = material.node_tree.nodes.new('ShaderNodeTexImage'); texture.image = face_image; texture.interpolation = 'Linear' if settings.detail else 'Closest'
    material.node_tree.links.new(texture.outputs['Color'], material.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
    material.node_tree.nodes.get('Principled BSDF').inputs['Roughness'].default_value = .85
    obj.data.materials.append(material); smooth(obj)
for sign, side in [(-1, 'L'), (1, 'R')]:
    ellipsoid('Ear_' + side, (sign * .57, -.01, 4.0), (.115, .10, .18), 'skinShade', 'head', 'head')
ellipsoid('Nose', (0, -.443, 3.94), (.032, .035, .037), 'skinLight', 'head', 'face')

# Curved crown, swept fringe and individual tapered, thick hair locks.
ellipsoid('Hair_crown', (0, .10, 4.25), (.64, .46, .59), 'hair', 'head', 'hair')
for sign, side in [(-1, 'L'), (1, 'R')]:
    ribbon('Swept_fringe_' + side, [(sign * .10, -.21, 4.77), (sign * .30, -.39, 4.57), (sign * .45, -.48, 4.33), (sign * .48, -.49, 4.08)], [.15, .17, .1, .008], [.06, .07, .05, .005], 'hair', 'head', 'hair')
    ribbon('Pointed_forelock_' + side, [(0, -.32, 4.70), (sign * .12, -.47, 4.46), (sign * .24, -.49, 4.25)], [.09, .12, .008], [.04, .05, .005], 'hair', 'head', 'hair')
    ribbon('Temple_lock_' + side, [(sign * .48, -.16, 4.5), (sign * .59, -.27, 4.15), (sign * .63, -.26, 3.82), (sign * .55, -.27, 3.48)], [.16, .18, .16, .015], [.13, .12, .1, .012], 'hair', 'head', 'hair')
    line('Fringe_highlight_' + side, [(sign * .16, -.3, 4.72), (sign * .35, -.49, 4.51), (sign * .46, -.56, 4.28)], .023, 'hairLight', 'head', 'hair')
for index in range(7):
    x = (index - 3) * .17
    outer = (index - 3) / 3
    ribbon('Back_hair_lock_%02d' % index, [(x, .26, 4.64), (x * 1.4, .48, 4.18), (x * 2.0, .53, 3.64), (x * 2.2, .56, 3.05), (x * 2.0, .48, 2.55), (x * 1.5 - outer * .1, .32, 2.25 + abs(outer) * .18)], [.12, .19, .20, .17, .10, .005], [.09, .1, .12, .09, .055, .003], 'hairLight' if index in (1, 4) else 'hair', 'hair', 'hair')

# Goggles have actual metal rims, glass volumes and a fitted strap.
for sign, side in [(-1, 'L'), (1, 'R')]:
    ellipsoid('Goggle_dark_recess_' + side, (sign * .26, -.52, 4.66), (.235, .10, .17), 'leather', 'head', 'goggles')
    ellipsoid('Goggle_gold_rim_' + side, (sign * .26, -.60, 4.67), (.21, .065, .145), 'gold', 'head', 'goggles')
    ellipsoid('Goggle_glass_' + side, (sign * .26, -.657, 4.67), (.16, .025, .105), 'dark', 'head', 'goggles')
    line('Goggle_glint_' + side, [(sign * .26 - .09, -.685, 4.70), (sign * .26 + .01, -.685, 4.74)], .018, 'ivory', 'head', 'goggles')
line('Goggle_bridge', [(-.08, -.64, 4.66), (0, -.66, 4.67), (.08, -.64, 4.66)], .03, 'gold', 'head', 'goggles')
for sign in [-1, 1]:
    line('Goggle_strap_' + str(sign), [(sign * .44, -.29, 4.56), (sign * .61, 0, 4.56), (sign * .46, .38, 4.55)], .055, 'leather', 'head', 'goggles')

ellipsoid('Ribbon_knot', (0, .04, 4.82), (.16, .13, .12), 'redShade', 'ribbon', 'ribbon')
for sign, side in [(-1, 'L'), (1, 'R')]:
    path = [(sign * .04, .04, 4.83), (sign * .20, .04, 5.02), (sign * .40, .02, 5.2), (sign * (.62 if sign < 0 else .4), 0, 5.3 if sign < 0 else 5.52)]
    ribbon('Rabbit_ribbon_' + side, path, [.075, .19, .15, .012], [.06, .075, .05, .01], 'red', 'ribbon', 'ribbon')
    line('Ribbon_gold_seam_' + side, [(sign * .12, -.04, 4.94), (sign * .28, -.04, 5.15), (sign * .38, -.02, 5.37)], .012, 'gold', 'ribbon', 'trim')

# Skeleton animation; legs solve a ground-aware two-link stride rather than
# translating a static pose. Run has its own reach, lift, arm bend and lean.
def pose(kind, phase):
    for item in RIG.pose.bones:
        item.rotation_mode = 'XYZ'; item.rotation_euler = (0, 0, 0); item.location = (0, 0, 0); item.scale = (1, 1, 1)
    t = math.tau * phase
    blink = kind == 'idle' and .86 < phase < .92
    RIG.pose.bones['face_open'].scale = (.0001,) * 3 if blink else (1, 1, 1)
    RIG.pose.bones['face_closed'].scale = (1, 1, 1) if blink else (.0001,) * 3
    moving = kind != 'idle'
    running = kind == 'run'
    hips = RIG.pose.bones['hips']
    if not moving:
        hips.location.y = .012 * math.sin(t)
        RIG.pose.bones['spine'].scale = (1 + .012 * math.sin(t), 1, 1 + .008 * math.sin(t))
    else:
        hips.location.y = (.035 if running else .015) * math.cos(t * 2)
        RIG.pose.bones['spine'].rotation_euler.x = .16 if running else .025
        RIG.pose.bones['head'].rotation_euler.x = -.08 if running else -.01
    for offset, side in [(0, 'L'), (math.pi, 'R')]:
        p = t + offset
        if moving:
            target_y = (.6 if running else .34) * math.cos(p)
            lift = max(0, math.sin(p)) * (.36 if running else .17)
            dz = 2.25 - (.19 + lift)
            distance = min(2.059, math.hypot(target_y, dz))
            knee = math.pi - math.acos(max(-1, min(1, (1.02 ** 2 + 1.04 ** 2 - distance ** 2) / (2 * 1.02 * 1.04))))
            thigh = math.atan2(target_y, dz) - math.atan2(1.04 * math.sin(knee), 1.02 + 1.04 * math.cos(knee))
            RIG.pose.bones['thigh.' + side].rotation_euler.x = thigh
            RIG.pose.bones['shin.' + side].rotation_euler.x = knee
            RIG.pose.bones['foot.' + side].rotation_euler.x = -thigh - knee
            RIG.pose.bones['upper_arm.' + side].rotation_euler.x = -math.cos(p) * (.8 if running else .4)
            RIG.pose.bones['forearm.' + side].rotation_euler.x = -.9 if running else -.13 - max(0, math.cos(p)) * .15
        RIG.pose.bones['cape.' + side].rotation_euler.x = (.17 if running else .04) + math.sin(t - .5 + offset * .2) * (.07 if moving else .025)
    RIG.pose.bones['hair'].rotation_euler.x = (.08 if running else .015) + math.sin(t - .6) * (.04 if moving else .018)
    RIG.pose.bones['hair'].rotation_euler.z = math.sin(t - .8) * (.025 if moving else .012)
    RIG.pose.bones['ribbon'].rotation_euler.x = math.sin(t - .2) * (.035 if moving else .015)


CLIPS = [('idle', 16, 2500), ('walk', 12, 800), ('run', 12, 500)]
ACTIONS = {}
RIG.animation_data_create()
for kind, count, duration in CLIPS:
    action = bpy.data.actions.new(kind)
    action.use_fake_user = True
    RIG.animation_data.action = action
    for frame in range(count + 1):
        pose(kind, frame / count)
        key_time = 1 + frame / count * duration / 1000 * 30
        for item in RIG.pose.bones:
            item.keyframe_insert('rotation_euler', frame=key_time, group=item.name)
            item.keyframe_insert('location', frame=key_time, group=item.name)
            item.keyframe_insert('scale', frame=key_time, group=item.name)
    # These two surfaces switch expressions; interpolating their scale would
    # visibly shrink the painted face in a live 3D close-up.
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                for curve in bag.fcurves:
                    if curve.data_path.endswith('.scale') and any(name in curve.data_path for name in ['face_open', 'face_closed']):
                        for key in curve.keyframe_points:
                            key.interpolation = 'CONSTANT'
    ACTIONS[kind] = action
RIG.animation_data.action = ACTIONS['idle']

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'; scene.cycles.samples = 32 if settings.detail else 16
scene.cycles.use_denoising = settings.detail
scene.render.threads_mode = 'FIXED'; scene.render.threads = 2
scene.render.use_persistent_data = True
scene.render.resolution_x = 512 if settings.detail else 256; scene.render.resolution_y = 640 if settings.detail else 320; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True
scene.view_settings.view_transform = 'Standard'
scene.render.fps = 30
scene.world.color = (.18, .18, .18)
bpy.ops.object.camera_add(location=(0, -9, 5.70))
CAMERA = bpy.context.object; CAMERA.name = 'Native_comparison_camera'
CAMERA.rotation_euler = (Vector((0, 0, 2.25)) - CAMERA.location).to_track_quat('-Z', 'Y').to_euler()
CAMERA.data.type = 'ORTHO'; CAMERA.data.ortho_scale = 8.4
scene.camera = CAMERA
for name, point, energy, size in [('Key', (-4, -6, 8), 450, 5), ('Fill', (4, -3, 5), 220, 4), ('Rim', (0, 4, 7), 350, 4)]:
    bpy.ops.object.light_add(type='AREA', location=point)
    lamp = bpy.context.object; lamp.name = name; lamp.data.energy = energy; lamp.data.shape = 'DISK'; lamp.data.size = size
    lamp.rotation_euler = (Vector((0, 0, 2.5)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()

# A real model package: meshes remain separate and editable in the source.
pose('idle', 0); scene.frame_set(1)
parts = []
for obj in PARTS:
    obj.data.calc_loop_triangles()
    parts.append({'name': obj.name, 'category': obj['part_category'], 'joint': obj['bound_joint'], 'vertices': len(obj.data.vertices), 'triangles': len(obj.data.loop_triangles)})
(OUT / 'parts.json').write_text(json.dumps({'authoring': 'reference-guided Blender meshes, not neural image-to-3D', 'parts': parts, 'bones': list(BONES), 'clips': [{'name': name, 'frames': count, 'durationMs': duration} for name, count, duration in CLIPS]}, indent=2) + '\n')
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'amber-parts.blend'))
bpy.ops.object.select_all(action='DESELECT')
RIG.select_set(True)
for obj in PARTS:
    obj.select_set(True)
bpy.context.view_layer.objects.active = RIG
bpy.ops.export_scene.gltf(filepath=str(OUT / 'amber-parts.glb'), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS')

frames = []
for direction, angle in [('down', 0), ('left', -math.pi / 2), ('up', math.pi), ('right', math.pi / 2)]:
    RIG.rotation_euler.z = angle
    for kind, count, duration in CLIPS:
        RIG.animation_data.action = ACTIONS[kind]
        chosen = [0] if settings.preview_only else range(count)
        for index in chosen:
            frame_time = 1 + index / count * duration / 1000 * 30
            scene.frame_set(math.floor(frame_time), subframe=frame_time % 1)
            path = OUT / 'renders' / f'{kind}-{direction}-{index:02d}.png'
            scene.render.filepath = str(path)
            bpy.ops.render.render(write_still=True)
            frames.append({'action': kind, 'direction': direction, 'phase': index / count, 'file': str(path.relative_to(OUT))})
(OUT / 'render-record.json').write_text(json.dumps({'width': scene.render.resolution_x, 'height': scene.render.resolution_y, 'nativeFrame': [64, 80], 'nativeGroundPixel': [32, 60], 'frames': frames, 'previewOnly': settings.preview_only, 'camera': {'orthoScale': 8.4, 'target': [0, 0, 2.25]}, 'threads': 2, 'samples': scene.cycles.samples}, indent=2) + '\n')
print('AMBER_PARTS_RENDER_COMPLETE', len(frames), flush=True)
