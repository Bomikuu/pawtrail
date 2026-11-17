"""Amber anime study: a meter-scale skinned mesh with authored UV/PBR surfaces.

Blender --background --threads 2 --python tools/actors/build_amber_anime.py -- --root PROJECT
This is reference-guided mesh authoring, not a neural reconstruction or a sprite.
Only a few source views are rendered; no full animation sprite bake is needed.
"""
import argparse
import hashlib
import json
import math
import shutil
import sys
from pathlib import Path

import bpy
import bmesh
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument('--root', type=Path, required=True)
parser.add_argument('--skip-ao', action='store_true', help='Authoring iteration only; final delivery bakes AO.')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
ROOT = args.root
OUT = ROOT / 'assets/actor-appearances/amber-anime-v3'
TEX = OUT / 'textures'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-anime-v3'
OUT.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)
(OUT / 'renders').mkdir(exist_ok=True)
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
PARTS = []
MATS = {}
SKIN = json.loads((TEX / 'material-provenance.json').read_text())['skinSRGB']


def linear(c):
    return c / 12.92 if c < .04045 else ((c + .055) / 1.055) ** 2.4


def rgb(color):
    if isinstance(color, str):
        color = [int(color[i:i + 2], 16) for i in (1, 3, 5)]
    return tuple(linear(c / 255) for c in color) + (1,)


def image(path, color=True):
    item = bpy.data.images.load(str(path), check_existing=True)
    item.colorspace_settings.name = 'sRGB' if color else 'Non-Color'
    return item


def material(name, base, rough=.8, metal=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = rgb(base)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    mat.diffuse_color = rgb(base)
    MATS[name] = mat
    return mat


for name, color, rough, metal in [('Skin', SKIN, .8, 0), ('IvoryGlove', '#e8ddc9', .88, 0), ('GoggleGlass', '#5d4b36', .25, .25)]:
    material(name, color, rough, metal)

for name, stem in [('TexturedClothes', 'amber'), ('Head', 'amber-head')]:
    mat = material(name, '#ffffff')
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    uv = nodes.new('ShaderNodeUVMap'); uv.uv_map = 'PrimaryUV'
    albedo = nodes.new('ShaderNodeTexImage'); albedo.image = image(TEX / f'{stem}-albedo.png')
    normal = nodes.new('ShaderNodeTexImage'); normal.image = image(TEX / f'{stem}-normal.png', False)
    orm = nodes.new('ShaderNodeTexImage'); orm.image = image(TEX / f'{stem}-metal-roughness.png', False)
    for node in [albedo, normal, orm]:
        links.new(uv.outputs['UV'], node.inputs['Vector'])
        node.interpolation = 'Linear'
    links.new(albedo.outputs['Color'], bsdf.inputs['Base Color'])
    split = nodes.new('ShaderNodeSeparateColor')
    links.new(orm.outputs['Color'], split.inputs['Color'])
    links.new(split.outputs['Green'], bsdf.inputs['Roughness'])
    links.new(split.outputs['Blue'], bsdf.inputs['Metallic'])
    normalmap = nodes.new('ShaderNodeNormalMap'); normalmap.uv_map = 'PrimaryUV'
    normalmap.inputs['Strength'].default_value = .18 if name == 'TexturedClothes' else .05
    links.new(normal.outputs['Color'], normalmap.inputs['Color'])
    links.new(normalmap.outputs['Normal'], bsdf.inputs['Normal'])


# Three columns / two rows. UV coordinates avoid adjacent-tile bleed.
TILES = {'red': (0, 0), 'ivory': (1, 0), 'leather': (2, 0), 'boot': (0, 1), 'hair': (1, 1), 'gold': (2, 1)}


def tileuv(key, u, v):
    if key not in TILES:
        return (u, v)
    col, row = TILES[key]
    return ((col + .025 + .95 * u) / 3, (1 - row) * .5 + (.025 + .95 * v) * .5)


# Full humanoid chain. Palms and each finger have independent joints.
bpy.ops.object.armature_add(enter_editmode=True)
RIG = bpy.context.object; RIG.name = 'Amber_Anime_Humanoid'
RIG.data.edit_bones.remove(RIG.data.edit_bones[0])
BONES = {}
REST = {}


def bone(name, head, tail, parent=None):
    item = RIG.data.edit_bones.new(name)
    item.head, item.tail = head, tail
    if parent:
        item.parent = BONES[parent]
    BONES[name] = item
    REST[name] = (Vector(head).copy(), Vector(tail).copy())


bone('root', (0, 0, 0), (0, 0, .12))
bone('hips', (0, 0, .88), (0, 0, .99), 'root')
bone('spine', (0, 0, .99), (0, 0, 1.15), 'hips')
bone('chest', (0, 0, 1.15), (0, 0, 1.32), 'spine')
bone('neck', (0, 0, 1.32), (0, 0, 1.44), 'chest')
bone('head', (0, 0, 1.44), (0, 0, 1.66), 'neck')
bone('hair.root', (0, .045, 1.65), (0, .075, 1.39), 'head')
bone('hair.tip', (0, .075, 1.39), (0, .105, 1.02), 'hair.root')
bone('ribbon', (0, 0, 1.70), (0, 0, 1.84), 'head')
for s, side in [(-1, 'L'), (1, 'R')]:
    bone('clavicle.' + side, (0, 0, 1.31), (s * .158, 0, 1.31), 'chest')
    bone('upper_arm.' + side, (s * .158, 0, 1.31), (s * .235, 0, 1.11), 'clavicle.' + side)
    bone('forearm.' + side, (s * .235, 0, 1.11), (s * .278, -.008, .947), 'upper_arm.' + side)
    bone('wrist.' + side, (s * .278, -.008, .947), (s * .292, -.01, .892), 'forearm.' + side)
    for index, offset in enumerate([-.022, -.0075, .0075, .022]):
        length = [.043, .052, .048, .039][index]
        start = Vector((s * (.292 + offset), -.011, .892 + abs(offset) * .15))
        mid = start + Vector((s * .006, -.004, -length * .55))
        end = start + Vector((s * .009, -.012, -length))
        bone(f'finger{index + 1}.01.{side}', start, mid, 'wrist.' + side)
        bone(f'finger{index + 1}.02.{side}', mid, end, f'finger{index + 1}.01.{side}')
    bone('thumb.01.' + side, (s * .265, -.01, .924), (s * .244, -.026, .905), 'wrist.' + side)
    bone('thumb.02.' + side, (s * .244, -.026, .905), (s * .241, -.032, .885), 'thumb.01.' + side)
    bone('thigh.' + side, (s * .085, 0, .88), (s * .085, -.012, .485), 'hips')
    bone('shin.' + side, (s * .085, -.012, .485), (s * .085, 0, .105), 'thigh.' + side)
    bone('ankle.' + side, (s * .085, 0, .105), (s * .085, -.09, .055), 'shin.' + side)
    bone('toe.' + side, (s * .085, -.09, .055), (s * .085, -.14, .043), 'ankle.' + side)
    bone('cloth.root.' + side, (s * .07, .07, 1.29), (s * .10, .10, 1.12), 'chest')
    bone('cloth.tip.' + side, (s * .10, .10, 1.12), (s * .12, .13, .96), 'cloth.root.' + side)
bpy.ops.object.mode_set(mode='OBJECT')
RIG.show_in_front = True


def norm_weights(items):
    total = sum(items.values())
    return {key: val / total for key, val in items.items() if val > .0001}


def blend(a, b, value):
    value = max(0, min(1, value)); value = value * value * (3 - 2 * value)
    return norm_weights({a: 1 - value, b: value})


def body_weights(point):
    z = point[2]
    if z < 1.06:
        return blend('hips', 'spine', (z - .96) / .10)
    return blend('spine', 'chest', (z - 1.10) / .15)


def make(name, vertices, faces, uv, mat, weights, category):
    data = bpy.data.meshes.new(name + '_Topology')
    data.from_pydata(vertices, [], faces); data.update()
    bm = bmesh.new(); bm.from_mesh(data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces); bm.to_mesh(data); bm.free()
    obj = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(obj)
    obj.data.materials.append(MATS['TexturedClothes' if mat in TILES else mat])
    layer = data.uv_layers.new(name='PrimaryUV')
    for poly in data.polygons:
        poly.use_smooth = True
        for loop in poly.loop_indices:
            coord = uv[data.loops[loop].vertex_index]
            layer.data[loop].uv = tileuv(mat, *coord)
    groups = {}
    for i, point in enumerate(vertices):
        influences = weights(point) if callable(weights) else {weights: 1}
        for joint, strength in influences.items():
            if joint not in groups:
                groups[joint] = obj.vertex_groups.new(name=joint)
            groups[joint].add([i], strength, 'REPLACE')
    mod = obj.modifiers.new('Smooth humanoid skin', 'ARMATURE'); mod.object = RIG
    obj.parent = RIG; obj['category'] = category
    PARTS.append(obj)
    return obj


def interpolate(points, steps=4):
    """Centripetal-looking bounded Catmull-Rom loft; endpoints retained."""
    result = []
    for j in range(len(points) - 1):
        p0, p1, p2, p3 = [Vector(points[max(0, min(len(points) - 1, k))]) for k in (j - 1, j, j + 1, j + 2)]
        for i in range(steps):
            t = i / steps
            result.append((p1 * 2 + (p2 - p0) * t + (p0 * 2 - p1 * 5 + p2 * 4 - p3) * t * t + (-p0 + p1 * 3 - p2 * 3 + p3) * t ** 3) * .5)
    result.append(Vector(points[-1]))
    return result


def loft(name, sections, mat, weights, category, seg=24, steps=3, start=-math.pi, end=math.pi, head=False, cap=True):
    sections = interpolate(sections, steps)
    vertices, uv, faces = [], [], []
    for j, (z, rx, ry, x, y) in enumerate(sections):
        for i in range(seg + 1):
            a = start + (end - start) * i / seg
            px, py = x + rx * math.sin(a), y - ry * math.cos(a)
            if head and math.cos(a) > 0:
                # Small integrated nose/bridge; no bead sitting on the face.
                py -= .012 * math.exp(-(px / .012) ** 2 - ((z - 1.536) / .018) ** 2)
                py -= .004 * math.exp(-(px / .018) ** 2 - ((z - 1.56) / .035) ** 2)
            vertices.append((px, py, z)); uv.append((i / seg, (z - 1.43) / .27 if head else j / (len(sections) - 1)))
    n = seg + 1
    for j in range(len(sections) - 1):
        for i in range(seg):
            a = j * n + i; faces.append((a, a + 1, a + n + 1, a + n))
    if cap:
        faces += [tuple(reversed(range(n))), tuple(range((len(sections) - 1) * n, len(vertices)))]
    return make(name, vertices, faces, uv, mat, weights, category)


def strand(name, controls, widths, depths, mat, weights, category, seg=8, steps=4):
    rows = interpolate([(*p, w, d) for p, w, d in zip(controls, widths, depths)], steps)
    vertices, uv, faces = [], [], []
    for j, row in enumerate(rows):
        p = Vector(row[:3])
        tangent = Vector(rows[min(j + 1, len(rows) - 1)][:3]) - Vector(rows[max(0, j - 1)][:3])
        tangent.normalize()
        wide = tangent.cross(Vector((0, 1, 0)))
        if wide.length < .01:
            wide = Vector((1, 0, 0))
        wide.normalize(); deep = tangent.cross(wide).normalized()
        for i in range(seg + 1):
            a = math.tau * i / seg
            # Narrow elliptical hair locks have real tapered thickness.
            vertices.append(tuple(p + wide * math.cos(a) * max(.0002, row[3]) + deep * math.sin(a) * max(.0002, row[4])))
            uv.append((i / seg, 1 - j / (len(rows) - 1)))
    n = seg + 1
    for j in range(len(rows) - 1):
        for i in range(seg):
            a = j * n + i; faces.append((a, a + 1, a + n + 1, a + n))
    faces += [tuple(reversed(range(n))), tuple(range((len(rows) - 1) * n, len(vertices)))]
    return make(name, vertices, faces, uv, mat, weights, category)


def tube(name, points, radius, mat, weights, category='tailoring'):
    return strand(name, points, [radius] * len(points), [radius] * len(points), mat, weights, category, seg=6, steps=2)


def oval(name, center, size, mat, joint, category, seg=20, rings=10):
    vertices, uv, faces = [], [], []
    for j in range(rings + 1):
        a = math.pi * j / rings
        for i in range(seg + 1):
            b = math.tau * i / seg
            vertices.append((center[0] + size[0] * math.sin(a) * math.cos(b), center[1] + size[1] * math.sin(a) * math.sin(b), center[2] + size[2] * math.cos(a)))
            uv.append((i / seg, j / rings))
    for j in range(rings):
        for i in range(seg):
            k = j * (seg + 1) + i; faces.append((k, k + 1, k + seg + 2, k + seg + 1))
    return make(name, vertices, faces, uv, mat, joint, category)


torso = [(.96, .108, .068, 0, .003), (1.02, .096, .064, 0, 0), (1.10, .099, .068, 0, 0), (1.18, .127, .086, 0, -.004), (1.25, .133, .078, 0, 0), (1.31, .141, .058, 0, .003), (1.34, .073, .046, 0, .002)]
loft('Embroidered_fitted_bodice', torso, 'ivory', body_weights, 'bodice', seg=40, steps=4)
loft('Neck_with_tapered_base', [(1.31, .055, .042, 0, .003), (1.38, .036, .034, 0, .006), (1.45, .038, .039, 0, .005)], 'Skin', lambda p: blend('chest', 'neck', (p[2] - 1.33) / .07), 'anatomy', seg=24)
head_sections = [(1.43, .008, .016, 0, -.012), (1.445, .034, .039, 0, -.016), (1.475, .067, .060, 0, -.006), (1.515, .089, .073, 0, 0), (1.56, .100, .080, 0, .005), (1.61, .103, .086, 0, .012), (1.66, .082, .074, 0, .016), (1.69, .047, .048, 0, .016), (1.70, .003, .004, 0, .016)]
loft('Continuous_anime_face_and_cranium', head_sections, 'Head', 'head', 'head', seg=56, steps=4, head=True)
for s in [-1, 1]:
    oval('Ear_' + str(s), (s * .098, .006, 1.545), (.013, .016, .028), 'Skin', 'head', 'head', seg=16)
    oval('Earring_' + str(s), (s * .100, -.002, 1.519), (.004, .004, .006), 'gold', 'head', 'jewelry', seg=12, rings=6)

jacket = [(1.075, .108, .074, 0, .004), (1.16, .137, .091, 0, -.001), (1.25, .144, .086, 0, .004), (1.31, .152, .065, 0, .006), (1.336, .077, .052, 0, .004)]
loft('Open_jacket_real_back_and_side_panels', jacket, 'red', body_weights, 'jacket', seg=36, steps=3, start=.70, end=math.tau - .70, cap=False)
for s in [-1, 1]:
    tube('Gold_lapel_' + str(s), [(s * .075, -.055, 1.332), (s * .097, -.073, 1.27), (s * .091, -.077, 1.18), (s * .070, -.061, 1.08)], .0025, 'gold', body_weights)
    strand('Standing_collar_' + str(s), [(s * .052, .007, 1.36), (s * .056, -.040, 1.35), (s * .068, -.060, 1.322)], [.014, .015, .007], [.006, .005, .001], 'leather', 'chest', 'collar', seg=8)
    tube('Collar_edge_' + str(s), [(s * .052, -.006, 1.366), (s * .058, -.042, 1.36), (s * .071, -.063, 1.327)], .002, 'gold', 'chest')

# Fitted shorts, belt and hanging utility pouches are individual modeled layers.
loft('Burgundy_shorts_waist', [(.921, .124, .076, 0, .007), (.94, .120, .075, 0, .003), (.966, .112, .070, 0, .002)], 'red', 'hips', 'shorts', seg=32)
loft('Leather_utility_belt', [(.948, .117, .076, 0, .002), (.973, .113, .074, 0, .002)], 'leather', 'hips', 'belt', seg=40, steps=1)
for s, side in [(-1, 'L'), (1, 'R')]:
    arm_weight = lambda p, side=side: blend('upper_arm.' + side, 'forearm.' + side, (1.145 - p[2]) / .07)
    wrist_weight = lambda p, side=side: blend('forearm.' + side, 'wrist.' + side, (.98 - p[2]) / .045)
    leg_weight = lambda p, side=side: blend('thigh.' + side, 'shin.' + side, (.53 - p[2]) / .09)
    hair_weight = lambda p: blend('hair.root', 'hair.tip', (1.44 - p[2]) / .25)
    loft('Tailored_sleeve_' + side, [(1.065, .037, .037, s * .247, 0), (1.12, .041, .044, s * .232, .001), (1.22, .046, .047, s * .196, 0), (1.29, .054, .047, s * .169, .002), (1.323, .030, .030, s * .151, .003)], 'red', arm_weight, 'sleeves', seg=24)
    loft('Folded_cuff_' + side, [(1.054, .046, .047, s * .25, 0), (1.078, .052, .051, s * .246, 0), (1.10, .048, .048, s * .239, .002)], 'leather', arm_weight, 'cuffs', seg=24, steps=2)
    for z, x in [(1.059, .25), (1.098, .24)]:
        tube('Cuff_piping_' + side + str(z), [(s * x + .049 * math.sin(a), -.049 * math.cos(a), z) for a in [i * math.tau / 24 for i in range(25)]], .002, 'gold', arm_weight)
    loft('Exposed_forearm_' + side, [(.944, .023, .023, s * .278, -.008), (.984, .028, .027, s * .27, -.005), (1.055, .033, .034, s * .251, 0), (1.086, .033, .033, s * .242, 0)], 'Skin', wrist_weight, 'anatomy', seg=24, steps=3)
    loft('Red_wrist_strap_' + side, [(.945, .027, .026, s * .279, -.008), (.966, .029, .028, s * .275, -.006)], 'red', 'wrist.' + side, 'gloves', seg=20, steps=1)
    loft('Anatomical_glove_palm_' + side, [(.887, .030, .014, s * .292, -.010), (.91, .033, .018, s * .288, -.009), (.944, .024, .021, s * .279, -.008)], 'IvoryGlove', 'wrist.' + side, 'hands', seg=20)
    for i, offset in enumerate([-.022, -.0075, .0075, .022]):
        start, mid = REST[f'finger{i + 1}.01.{side}']
        end = REST[f'finger{i + 1}.02.{side}'][1]
        length = (end - start).length
        strand(f'Articulated_finger{i + 1}_{side}', [start, mid, end], [.006, .0055, .0025], [.0065, .0058, .003], 'IvoryGlove', lambda p, i=i, side=side, start=start, length=length: blend(f'finger{i + 1}.01.{side}', f'finger{i + 1}.02.{side}', (start.z - p[2]) / length), 'fingers', seg=8, steps=3)
    strand('Separated_thumb_' + side, [REST['thumb.01.' + side][0], REST['thumb.01.' + side][1], REST['thumb.02.' + side][1]], [.008, .006, .003], [.008, .006, .003], 'IvoryGlove', lambda p, side=side: blend('thumb.01.' + side, 'thumb.02.' + side, (.91 - p[2]) / .025), 'fingers', seg=8, steps=3)
    oval('Glove_red_crest_' + side, (s * .288, -.028, .919), (.019, .003, .017), 'red', 'wrist.' + side, 'gloves', seg=12)
    tube('Sleeve_gold_seam_' + side, [(s * .168, -.043, 1.30), (s * .196, -.047, 1.22), (s * .23, -.044, 1.12)], .0018, 'gold', arm_weight)
    oval('Shoulder_medallion_' + side, (s * .189, -.042, 1.269), (.017, .004, .021), 'gold', 'upper_arm.' + side, 'jewelry', seg=16)
    loft('Shorts_leg_' + side, [(.82, .067, .072, s * .075, 0), (.86, .074, .078, s * .073, .004), (.91, .076, .079, s * .067, .005), (.93, .071, .077, s * .065, .005)], 'red', 'thigh.' + side, 'shorts', seg=24)
    loft('Thigh_anatomy_' + side, [(.67, .053, .056, s * .085, 0), (.75, .058, .060, s * .085, 0), (.83, .060, .064, s * .079, 0), (.89, .060, .066, s * .076, 0)], 'Skin', 'thigh.' + side, 'anatomy', seg=28)
    boot = [(.105, .028, .036, s * .085, .001), (.18, .034, .038, s * .085, .004), (.27, .045, .047, s * .085, .008), (.36, .047, .049, s * .085, .008), (.45, .039, .047, s * .085, -.003), (.50, .043, .049, s * .085, -.008), (.59, .049, .053, s * .085, -.003), (.69, .058, .060, s * .085, 0), (.765, .064, .065, s * .084, .001)]
    loft('Shaped_thigh_boot_' + side, boot, 'boot', leg_weight, 'boots', seg=28, steps=3)
    loft('Folded_red_boot_cuff_' + side, [(.705, .060, .063, s * .085, 0), (.765, .067, .068, s * .084, .001), (.779, .067, .068, s * .084, .001)], 'red', 'thigh.' + side, 'boot_cuff', seg=28, steps=2)
    tube('Boot_gold_cuff_' + side, [(s * .084 + .067 * math.sin(a), -.068 * math.cos(a), .777) for a in [i * math.tau / 24 for i in range(25)]], .002, 'gold', 'thigh.' + side)
    # The boot has a shaped instep and extended toe, not a scaled cylinder.
    loft('Boot_instep_and_toe_' + side, [(.026, .040, .092, s * .085, -.046), (.044, .043, .092, s * .085, -.047), (.066, .041, .085, s * .085, -.043), (.09, .033, .055, s * .085, -.015), (.13, .029, .037, s * .085, .001)], 'boot', 'ankle.' + side, 'footwear', seg=28, steps=3)
    loft('Separate_boot_sole_' + side, [(.018, .041, .094, s * .085, -.045), (.027, .043, .095, s * .085, -.045), (.034, .043, .094, s * .085, -.045)], 'leather', 'ankle.' + side, 'footwear', seg=28, steps=1)
    loft('Low_boot_heel_' + side, [(0, .030, .026, s * .085, .014), (.024, .031, .027, s * .085, .014)], 'boot', 'ankle.' + side, 'footwear', seg=16, steps=1)
    tube('Boot_back_seam_' + side, [(s * .085, .040, .12), (s * .085, .057, .34), (s * .085, .043, .49), (s * .085, .064, .72)], .0015, 'leather', leg_weight)
    for branch in [-1, 1]:
        tube('Gold_boot_leaf_' + side + str(branch), [(s * .085, -.062, .585), (s * .085 + branch * .012, -.064, .63), (s * .085 + branch * .029, -.062, .657), (s * .085 + branch * .037, -.054, .70)], .0026, 'gold', 'thigh.' + side)
        tube('Gold_boot_vein_' + side + str(branch), [(s * .085, -.062, .63), (s * .085 + branch * .019, -.066, .686), (s * .085 + branch * .034, -.062, .731)], .0017, 'gold', 'thigh.' + side)
    # Rounded rectangular pouch panels keep real thickness with sewn flaps.
    loft('Hip_utility_pouch_' + side, [(.818, .025, .025, s * .142, .014), (.831, .037, .034, s * .145, .014), (.916, .037, .033, s * .141, .012), (.929, .028, .025, s * .137, .012)], 'leather', 'hips', 'utility', seg=16, steps=2)
    tube('Pouch_stitched_flap_' + side, [(s * .111, -.02, .91), (s * .142, -.026, .892), (s * .175, -.02, .91)], .002, 'gold', 'hips')
    oval('Pouch_fastener_' + side, (s * .142, -.025, .88), (.004, .003, .006), 'gold', 'hips', 'utility', seg=12, rings=6)
    cloth_weight = lambda p, side=side: blend('cloth.root.' + side, 'cloth.tip.' + side, (1.16 - p[2]) / .15)
    strand('Split_coattail_' + side, [(s * .07, .067, 1.30), (s * .091, .096, 1.20), (s * .111, .117, 1.08), (s * .125, .13, .97)], [.050, .055, .050, .018], [.006, .006, .004, .001], 'red', cloth_weight, 'cloth', seg=8, steps=4)
    tube('Coattail_gold_edge_' + side, [(s * .11, .07, 1.30), (s * .14, .10, 1.20), (s * .15, .12, 1.08), (s * .135, .131, .97)], .0017, 'gold', cloth_weight)

oval('Belt_central_buckle', (0, -.077, .962), (.021, .005, .015), 'gold', 'hips', 'utility', seg=16)
oval('Buckle_leather_inset', (0, -.083, .962), (.013, .002, .008), 'leather', 'hips', 'utility', seg=16)
for z in [1.115, 1.19, 1.255]:
    oval('Bodice_fastener_' + str(z), (0, -.091 if z < 1.24 else -.083, z), (.003, .003, .004), 'gold', 'chest' if z > 1.15 else 'spine', 'jewelry', seg=10, rings=6)

# A scalp follows a real cranium; layered locks cover it with distinct curved
# silhouettes rather than long circular sausages or a single plastic helmet.
scalp = [(1.615, .110, .093, 0, .015), (1.65, .100, .092, 0, .015), (1.68, .076, .073, 0, .015), (1.705, .041, .046, 0, .015), (1.718, .002, .004, 0, .015)]
loft('Hair_fitted_scalp', scalp, 'hair', 'head', 'hair', seg=40, steps=3)
for s in [-1, 1]:
    # Front bangs: overlapping, asymmetric leaves tapered at their tips.
    for i in range(4):
        x = .012 + i * .022
        start = (s * x, -.033 - .003 * i, 1.701 - .004 * i)
        mid = (s * (x + .015), -.078 - .001 * i, 1.662 - .006 * i)
        low = (s * (x + .025), -.090 + .004 * i, 1.632 - .009 * i)
        tip = (s * (x + .041), -.082 + .008 * i, 1.609 - .016 * i)
        strand('Tapered_bang_' + str(s) + '_' + str(i), [start, mid, low, tip], [.009, .020 - i * .001, .016 - i * .001, .0005], [.005, .008, .005, .0003], 'hair', 'head', 'bangs', seg=8, steps=4)
    for i in range(3):
        strand('Cheek_frame_' + str(s) + '_' + str(i), [(s * .086, -.028 + i * .02, 1.66), (s * (.111 + .008 * i), -.033 + i * .018, 1.565), (s * (.114 + .010 * i), -.029 + i * .02, 1.49), (s * (.084 + .01 * i), -.047 + i * .018, 1.465 - i * .015)], [.016, .025, .022, .0005], [.006, .009, .005, .0003], 'hair', 'head', 'hair', seg=8, steps=4)
    for i in range(9):
        a = .10 + i / 8 * 1.18
        x, y = s * math.sin(a), math.cos(a)
        spread = .18 + .012 * (i % 3)
        controls = [(x * .073, y * .065 + .01, 1.69), (x * .12, y * .092 + .01, 1.53), (x * .17 + s * .01, y * .12 + .012, 1.37), (x * spread + s * .012, y * .105 + .018, 1.23 + .025 * (i % 3)), (x * (spread + .027) + s * .015, y * .09 + .016, 1.16 + .043 * (i % 4)), (x * (spread + .060) + s * .02, y * .075, 1.105 + .043 * (i % 4))]
        strand('Layered_curved_hair_' + str(s) + '_' + str(i), controls, [.014, .035, .040, .029, .012, .0004], [.002, .004, .005, .0035, .0015, .0002], 'hair', lambda p: blend('hair.root', 'hair.tip', (1.48 - p[2]) / .30), 'hair', seg=8, steps=4)
    for i in range(4):
        a = .22 + i * .29
        x, y = s * math.sin(a), math.cos(a)
        strand('Short_overlapping_hair_layer_' + str(s) + '_' + str(i), [(x * .080, y * .078 + .012, 1.68), (x * .131, y * .112 + .02, 1.52), (x * .173 + s * .018, y * .133 + .018, 1.385), (x * .212 + s * .026, y * .125, 1.35 + i * .015), (x * .23 + s * .03, y * .11, 1.31 + i * .015)], [.010, .029, .028, .012, .0004], [.002, .004, .004, .0015, .0002], 'hair', lambda p: blend('hair.root', 'hair.tip', (1.48 - p[2]) / .30), 'hair', seg=8, steps=4)
    # Fine silhouette wisp, using thin real geometry (no transparent sorting).
    strand('Fine_hair_wisp_' + str(s), [(s * .10, .075, 1.52), (s * .17, .08, 1.40), (s * .20, .07, 1.42)], [.005, .004, .0003], [.002, .0015, .0002], 'hair', 'hair.root', 'hair', seg=6, steps=5)
    strand('Ribbon_ear_' + str(s), [(s * .015, .0, 1.704), (s * .057, .0, 1.77), (s * .085, .006, 1.84), (s * .093, .01, 1.87)], [.012, .032, .021, .0006], [.004, .008, .005, .0003], 'red', 'ribbon', 'ribbon', seg=8, steps=4)
    tube('Ribbon_gold_tip_' + str(s), [(s * .074, -.004, 1.83), (s * .094, -.001, 1.866), (s * .102, .005, 1.834)], .0018, 'gold', 'ribbon')
    # Goggles: oval lenses, full brass rim, bridge and rear head strap.
    points = [(s * .047 + .037 * math.cos(a), -.081, 1.666 + .024 * math.sin(a)) for a in [i * math.tau / 28 for i in range(29)]]
    tube('Brass_goggle_rim_' + str(s), points, .004, 'gold', 'head', 'goggles')
    oval('Recessed_goggle_lens_' + str(s), (s * .047, -.078, 1.666), (.032, .004, .019), 'GoggleGlass', 'head', 'goggles', seg=24, rings=8)
tube('Goggle_bridge', [(-.012, -.082, 1.666), (0, -.087, 1.671), (.012, -.082, 1.666)], .003, 'gold', 'head', 'goggles')
tube('Goggle_leather_headband', [(.102 * math.sin(a), -.087 * math.cos(a) + .012, 1.666) for a in [i * math.tau / 40 for i in range(41)]], .006, 'leather', 'head', 'goggles')

# Record editable components before merging an export copy. The .blend retains
# the named sources; the GLB has one skinned object with a few material batches.
part_records = []
for obj in PARTS:
    obj.data.calc_loop_triangles()
    part_records.append({'name': obj.name, 'category': obj['category'], 'vertices': len(obj.data.vertices), 'triangles': len(obj.data.loop_triangles), 'joints': [g.name for g in obj.vertex_groups]})
copies = []
for obj in PARTS:
    copy = obj.copy(); copy.data = obj.data.copy(); bpy.context.collection.objects.link(copy); copies.append(copy)
    obj.hide_render = True; obj.hide_set(True)
bpy.ops.object.select_all(action='DESELECT')
for obj in copies:
    obj.select_set(True)
bpy.context.view_layer.objects.active = copies[0]
bpy.ops.object.join()
EXPORT = bpy.context.object; EXPORT.name = 'Amber_Anime_Skinned_Export'
EXPORT.data.uv_layers.new(name='BakeUV')
EXPORT.data.uv_layers.active = EXPORT.data.uv_layers['BakeUV']
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=.008)
bpy.ops.object.mode_set(mode='OBJECT')

scene = bpy.context.scene
scene.render.engine = 'CYCLES'; scene.cycles.device = 'CPU'; scene.cycles.samples = 24
scene.cycles.use_denoising = True
scene.render.threads_mode = 'FIXED'; scene.render.threads = 2
scene.render.use_persistent_data = True
scene.render.resolution_x = 768; scene.render.resolution_y = 960; scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'; scene.render.image_settings.color_mode = 'RGBA'
scene.render.film_transparent = True; scene.render.fps = 30
scene.view_settings.view_transform = 'AgX'
scene.world.color = (.22, .22, .22)

# AO sees all the actual clothing, hair and anatomy geometry, and has its own
# UV set so repeated material tiles cannot overwrite contact shadows.
ao = bpy.data.images.new('Amber_Geometry_AO', 1024, 1024, alpha=False)
ao.colorspace_settings.name = 'Non-Color'; ao.generated_color = (1, 1, 1, 1)
for mat in EXPORT.data.materials:
    node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = ao; node.name = 'Geometry_AO_bake_target'
    mat.node_tree.nodes.active = node
if not args.skip_ao:
    scene.cycles.samples = 16
    scene.render.bake.use_clear = True; scene.render.bake.margin = 4
    bpy.ops.object.bake(type='AO', use_selected_to_active=False)
    scene.cycles.samples = 24
ao.filepath_raw = str(TEX / 'amber-ao.png'); ao.file_format = 'PNG'; ao.save()
group = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
group.interface.new_socket(name='Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
for mat in EXPORT.data.materials:
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    node = nodes.get('Geometry_AO_bake_target')
    uv = nodes.new('ShaderNodeUVMap'); uv.uv_map = 'BakeUV'
    links.new(uv.outputs['UV'], node.inputs['Vector'])
    output = nodes.new('ShaderNodeGroup'); output.node_tree = group
    links.new(node.outputs['Color'], output.inputs['Occlusion'])
EXPORT.data.uv_layers.active = EXPORT.data.uv_layers['PrimaryUV']
EXPORT.data.uv_layers['PrimaryUV'].active_render = True
# Tangents require triangles. Retain the editable source quads in PARTS.
bm = bmesh.new(); bm.from_mesh(EXPORT.data)
bmesh.ops.triangulate(bm, faces=bm.faces[:]); bm.to_mesh(EXPORT.data); bm.free()


def pose(kind, phase):
    t = math.tau * phase
    for item in RIG.pose.bones:
        item.rotation_mode = 'XYZ'; item.rotation_euler = (0, 0, 0); item.location = (0, 0, 0); item.scale = (1, 1, 1)
    moving, run = kind != 'idle', kind == 'run'
    if moving:
        RIG.pose.bones['hips'].location.y = .004 * math.cos(t * 2)
        RIG.pose.bones['chest'].rotation_euler.x = .12 if run else .018
        RIG.pose.bones['head'].rotation_euler.x = -.07 if run else -.01
    else:
        # Tiny breathing and weight shift, with stationary ankles/feet.
        RIG.pose.bones['chest'].scale.x = 1 + .003 * math.sin(t)
        RIG.pose.bones['chest'].scale.z = 1 + .003 * math.sin(t)
        RIG.pose.bones['head'].rotation_euler.y = .012 * math.sin(t)
    for offset, side in [(0, 'L'), (math.pi, 'R')]:
        p = t + offset
        if moving:
            target = (.21 if run else .12) * math.cos(p)
            lift = max(0, math.sin(p)) * (.12 if run else .045)
            dz = .88 - (.105 + lift)
            distance = min(.773, math.hypot(target, dz))
            a, b = .395, .38
            knee = math.pi - math.acos(max(-1, min(1, (a*a + b*b - distance*distance) / (2*a*b))))
            thigh = math.atan2(target, dz) - math.atan2(b * math.sin(knee), a + b * math.cos(knee))
            RIG.pose.bones['thigh.' + side].rotation_euler.x = thigh
            RIG.pose.bones['shin.' + side].rotation_euler.x = knee
            RIG.pose.bones['ankle.' + side].rotation_euler.x = -thigh - knee
            RIG.pose.bones['upper_arm.' + side].rotation_euler.x = -math.cos(p) * (.65 if run else .28)
            RIG.pose.bones['forearm.' + side].rotation_euler.x = -.75 if run else -.08 - .08 * max(0, math.cos(p))
        RIG.pose.bones['wrist.' + side].rotation_euler.x = -.06
        for i in range(4):
            RIG.pose.bones[f'finger{i + 1}.02.{side}'].rotation_euler.x = -.10 if run else -.025
        RIG.pose.bones['cloth.root.' + side].rotation_euler.x = (.13 if run else .02) + .02 * math.sin(t - .5 + offset)
        RIG.pose.bones['cloth.tip.' + side].rotation_euler.x = .025 * math.sin(t - 1 + offset)
    RIG.pose.bones['hair.root'].rotation_euler.x = (.06 if run else .003) + .008 * math.sin(t - .6)
    RIG.pose.bones['hair.tip'].rotation_euler.x = .012 * math.sin(t - 1.1)
    RIG.pose.bones['hair.tip'].rotation_euler.z = .008 * math.sin(t - .9)
    RIG.pose.bones['ribbon'].rotation_euler.x = .015 * math.sin(t - .3)


RIG.animation_data_create()
ACTIONS = {}
for kind, duration in [('idle', 2500), ('walk', 800), ('run', 500)]:
    action = bpy.data.actions.new(kind); action.use_fake_user = True; RIG.animation_data.action = action
    for index in range(25):
        pose(kind, index / 24)
        for item in RIG.pose.bones:
            frame = 1 + index / 24 * duration / 1000 * 30
            for prop in ['rotation_euler', 'location', 'scale']:
                item.keyframe_insert(prop, frame=frame, group=item.name)
    ACTIONS[kind] = action
RIG.animation_data.action = ACTIONS['idle']; scene.frame_set(1)

bpy.ops.object.camera_add(location=(0, -3.3, 1.02))
CAMERA = bpy.context.object; CAMERA.name = 'Anime_source_camera'
CAMERA.rotation_euler = (Vector((0, 0, .94)) - CAMERA.location).to_track_quat('-Z', 'Y').to_euler()
CAMERA.data.type = 'ORTHO'; CAMERA.data.ortho_scale = 2.12; scene.camera = CAMERA
for name, point, energy, size in [('Soft_key', (-2, -3, 4), 350, 3), ('Fill', (3, -1.8, 2.7), 200, 3), ('Hair_rim', (1, 3, 3.5), 400, 2.5)]:
    bpy.ops.object.light_add(type='AREA', location=point)
    lamp = bpy.context.object; lamp.name = name; lamp.data.energy = energy; lamp.data.shape = 'DISK'; lamp.data.size = size
    lamp.rotation_euler = (Vector((0, 0, 1)) - lamp.location).to_track_quat('-Z', 'Y').to_euler()

# Pack textures for the editable source and the self-contained runtime model.
for img in bpy.data.images:
    if img.source == 'FILE' or img == ao:
        img.pack()
bpy.ops.object.select_all(action='DESELECT'); EXPORT.select_set(True); RIG.select_set(True); bpy.context.view_layer.objects.active = RIG
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'amber-anime.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT / 'amber-anime.glb'), export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='ACTIONS', export_texcoords=True, export_normals=True, export_tangents=True)
shutil.copy2(OUT / 'amber-anime.glb', PUBLIC / 'amber-anime.glb')

for name, angle in [('front', 0), ('left', -math.pi / 2), ('back', math.pi), ('right', math.pi / 2)]:
    RIG.rotation_euler.z = angle; scene.frame_set(1)
    scene.render.filepath = str(OUT / 'renders' / f'{name}.png'); bpy.ops.render.render(write_still=True)
RIG.rotation_euler.z = 0
CAMERA.location = (0, -.8, 1.59)
CAMERA.rotation_euler = (Vector((0, 0, 1.565)) - CAMERA.location).to_track_quat('-Z', 'Y').to_euler()
CAMERA.data.ortho_scale = .36
scene.render.filepath = str(OUT / 'renders/face.png'); bpy.ops.render.render(write_still=True)

EXPORT.data.calc_loop_triangles()
manifest = {
    'id': 'amber-anime-v3', 'status': 'ready', 'authoring': 'Reference-guided Blender mesh and UV authoring; not neural 3D reconstruction.',
    'sourceModel': '/pawtrail-game/actor-studio/amber-anime-v3/amber-anime.glb',
    'sourceModelBytes': (OUT / 'amber-anime.glb').stat().st_size,
    'sourceModelSha256': hashlib.sha256((OUT / 'amber-anime.glb').read_bytes()).hexdigest(),
    'parts': len(PARTS), 'triangles': len(EXPORT.data.loop_triangles), 'joints': len(BONES),
    'materials': len(EXPORT.data.materials), 'skinnedMeshes': 1,
    'heightMetersWithoutRibbon': 1.70, 'headHeightMeters': .27,
    'textures': {'materialAtlas': list(image(TEX / 'amber-albedo.png').size), 'head': [1024, 1024], 'ao': [1024, 1024], 'maps': ['albedo', 'normal', 'roughness', 'metallic', 'geometry AO'], 'aoUV': 'BakeUV'},
    'viewer': {'body': {'height': 2.14, 'target': [0, .94, 0], 'offset': [0, .08, 3]}, 'face': {'height': .39, 'target': [0, 1.56, 0], 'offset': [0, .03, .9]}},
    'sourceViews': '/pawtrail-game/actor-studio/amber-anime-v3/source-views.webp',
    'sourceFace': '/pawtrail-game/actor-studio/amber-anime-v3/face.png',
    'reference': '/pawtrail-game/actor-studio/amber-anime-v3/modeling-reference.webp',
    'clips': [{'name': name, 'durationMs': duration, 'sourceKeys': 25} for name, duration in [('idle', 2500), ('walk', 800), ('run', 500)]],
    'review': 'Offline source renders inspected; runtime/browser acceptance pending owner review.',
    'limitations': ['Focused source-model revision; no new full sprite bake or game-roster installation.', 'Idle, walk and run study; not the complete gameplay action library.'],
}
(OUT / 'parts.json').write_text(json.dumps({'parts': part_records, 'bones': list(BONES)}, indent=2) + '\n')
for destination in [OUT / 'manifest.json', PUBLIC / 'manifest.json', ROOT / 'src/game/runtime/amber-anime-manifest.json']:
    destination.write_text(json.dumps(manifest, indent=2) + '\n')
print('AMBER_ANIME_COMPLETE', json.dumps({k: manifest[k] for k in ['parts', 'triangles', 'joints', 'sourceModelBytes']}), flush=True)
