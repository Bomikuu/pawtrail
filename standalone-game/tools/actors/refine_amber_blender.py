"""Executed inside Blender through MCP. Mesh editing, original UVs, shared rig."""
import bpy
import json
import math
from pathlib import Path
from mathutils import Matrix, Vector

ROOT = Path('/run/media/micxsz/Drive/Workspaces/Documents/ChatGPT/pawtrail')
OUT = ROOT / 'assets/actor-appearances/amber-blender-mcp-v1'
PUBLIC = ROOT / 'public/pawtrail-game/actor-studio/amber-blender-mcp-v1'
PUBLIC.mkdir(parents=True, exist_ok=True)
source = json.loads((OUT / 'source.json').read_text())
scene = bpy.data.scenes.new('Amber · Blender MCP revision')
bpy.context.window.scene = scene
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x = 128
scene.render.resolution_y = 160
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.color_depth = '8'
scene.render.filter_size = 0.01
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
scene.world = bpy.data.worlds.new('Amber authoring world')
scene.world.color = (0.8, 0.8, 0.8)

materials = {}
for key, spec in source['materials'].items():
    mat = bpy.data.materials.new('Amber/' + key)
    mat.use_nodes = True
    mat.diffuse_color = (*spec['color'], 1)
    tree = mat.node_tree
    tree.nodes.clear()
    output = tree.nodes.new('ShaderNodeOutputMaterial')
    emission = tree.nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*spec['color'], 1)
    tree.links.new(emission.outputs[0], output.inputs['Surface'])
    previous = None
    if spec.get('texture'):
        image = bpy.data.images.load(str(OUT / spec['texture']), check_existing=True)
        image.pack()
        tex = tree.nodes.new('ShaderNodeTexImage')
        tex.image = image
        tex.interpolation = 'Closest'
        tex.extension = 'REPEAT'
        previous = tex.outputs['Color']
    if spec.get('vertexColors'):
        attr = tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'PaintedShade'
        if previous:
            multiply = tree.nodes.new('ShaderNodeMixRGB')
            multiply.blend_type = 'MULTIPLY'
            multiply.inputs[0].default_value = 1
            tree.links.new(previous, multiply.inputs[1])
            tree.links.new(attr.outputs['Color'], multiply.inputs[2])
            previous = multiply.outputs[0]
        else:
            multiply = tree.nodes.new('ShaderNodeMixRGB')
            multiply.blend_type = 'MULTIPLY'
            multiply.inputs[0].default_value = 1
            multiply.inputs[1].default_value = (*spec['color'], 1)
            tree.links.new(attr.outputs['Color'], multiply.inputs[2])
            previous = multiply.outputs[0]
    if previous:
        tree.links.new(previous, emission.inputs['Color'])
    materials[key] = mat


def import_model(label, payload, offset):
    collection = bpy.data.collections.new(label)
    scene.collection.children.link(collection)
    coordinate = bpy.data.objects.new(label, None)
    collection.objects.link(coordinate)
    coordinate.rotation_euler.x = math.pi / 2
    coordinate.location.x = offset
    objects = {}
    for node in payload['nodes']:
        spec = payload['meshes'].get(node['path'])
        if spec:
            attrs = spec['attributes']
            raw = attrs['position']['array']
            vertices = [raw[i:i+3] for i in range(0, len(raw), 3)]
            ix = spec['index'] or list(range(len(vertices)))
            faces = [ix[i:i+3] for i in range(0, len(ix), 3)]
            mesh = bpy.data.meshes.new(label + '/' + node['name'])
            mesh.from_pydata(vertices, [], faces)
            mesh.update()
            obj = bpy.data.objects.new(node['name'] or 'Ear', mesh)
            for material in spec['materials']:
                mesh.materials.append(materials[material])
            for group in spec['groups']:
                for face in mesh.polygons[group['start']//3:(group['start']+group['count'])//3]:
                    face.material_index = group['materialIndex']
            if 'uv' in attrs:
                uv = mesh.uv_layers.new(name='UVMap')
                for loop in mesh.loops:
                    uv.data[loop.index].uv = attrs['uv']['array'][loop.vertex_index*2:loop.vertex_index*2+2]
            if 'color' in attrs:
                shade = mesh.color_attributes.new(name='PaintedShade', type='FLOAT_COLOR', domain='POINT')
                for i, color in enumerate(shade.data):
                    color.color = (*attrs['color']['array'][i*3:i*3+3], 1)
            for face in mesh.polygons:
                face.use_smooth = True
            if 'normal' in attrs:
                normals = attrs['normal']['array']
                mesh.normals_split_custom_set_from_vertices([normals[i:i+3] for i in range(0,len(normals),3)])
        else:
            obj = bpy.data.objects.new(node['name'] or 'Joint', None)
            obj.empty_display_type = 'PLAIN_AXES'
            obj.empty_display_size = 0.7
        collection.objects.link(obj)
        obj.parent = objects.get(node['parent'], coordinate)
        m = node['matrix']
        obj.matrix_local = Matrix([m[i:i+4] for i in range(0,16,4)]).transposed()
        obj['pawtrail_path'] = node['path']
        obj['shared_animation_binding'] = node['name']
        obj.hide_render = not node['visible']
        obj.hide_viewport = not node['visible']
        objects[node['path']] = obj
    return coordinate, collection, objects


before, before_collection, _ = import_model('Current Amber · shared rig', source['current'], -28)
after, after_collection, objects = import_model('Blender Amber · shared rig', source['candidate'], 28)
modified = []
for path, obj in objects.items():
    if obj.type != 'MESH' or path not in source['candidate']['meshes']:
        continue
    name = source['candidate']['meshes'][path]['name']
    changed = False
    # Tailored bevels change the actual outline; they do not blur the textures.
    if name in {'OpenRedJacket', 'CapeCollar', 'HipPouch', 'PouchFlap', 'GloveCuff'}:
        bevel = obj.modifiers.new('Small tailored edge', 'BEVEL')
        bevel.width = 0.22 if name == 'OpenRedJacket' else 0.14
        bevel.segments = 1
        bevel.limit_method = 'ANGLE'
        bevel.angle_limit = math.radians(32)
        changed = True
    if name == 'FittedBodice':
        for vertex in obj.data.vertices:
            x,y,z = vertex.co
            # Shape the waist and chest in depth without widening the silhouette.
            if z > 0:
                vertex.co.z += 0.24 * math.exp(-((y - 1.6)/2.8)**2) * max(0, 1-(x/6)**2)
        changed = True
    elif name == 'RoundedShoulderSleeve':
        for vertex in obj.data.vertices:
            x,y,z = vertex.co
            if y > -1.4:
                vertex.co.x *= 0.95
                vertex.co.z *= 1.035
        changed = True
    elif name in {'SeparatedBackLock', 'PointedSideTail', 'SharpCheekLock'}:
        positions = [v.co.y for v in obj.data.vertices]
        lo,hi = min(positions),max(positions)
        side = -1 if ('BackHairLayer_0' in path or 'BackHairLayer_1' in path or '_-1/' in path) else 1
        for vertex in obj.data.vertices:
            t = (hi-vertex.co.y)/max(hi-lo,0.001)
            if name == 'SeparatedBackLock':
                layer = next((i for i in range(4) if f'BackHairLayer_{i}/' in path), 0)
                vertex.co.x += side * (0.6 if layer in (0,3) else 0.18) * t*t
                vertex.co.y += (0.9 if layer in (0,3) else -0.25) * t*t
                vertex.co.z -= 0.2 * math.sin(t*math.pi)
            elif name == 'PointedSideTail':
                vertex.co.x += side*0.32*t*t
                vertex.co.z += 0.25*math.sin(t*math.pi)
            else:
                vertex.co.z += 0.16*math.sin(t*math.pi)
        changed = True
    if changed:
        obj.data.update()
        modified.append(path)

# Export only edited mesh buffers. Joints, sockets, face states and live cloth
# remain owned by the existing JS rig, so every shared action stays available.
patches = []
depsgraph = bpy.context.evaluated_depsgraph_get()
for path in modified:
    obj = objects[path]
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh(preserve_all_data_layers=True, depsgraph=depsgraph)
    mesh.calc_loop_triangles()
    attrs = {'position': [], 'normal': [], 'uv': [], 'color': []}
    groups = []
    shade = mesh.color_attributes.get('PaintedShade')
    uv = mesh.uv_layers.active
    for triangle in mesh.loop_triangles:
        start = len(attrs['position'])//3
        material_index = triangle.material_index
        if not groups or groups[-1]['materialIndex'] != material_index:
            groups.append({'start': start, 'count': 0, 'materialIndex': material_index})
        groups[-1]['count'] += 3
        for loop_index in triangle.loops:
            loop = mesh.loops[loop_index]
            vertex = mesh.vertices[loop.vertex_index]
            attrs['position'].extend(vertex.co)
            attrs['normal'].extend(mesh.corner_normals[loop_index].vector)
            if uv:
                attrs['uv'].extend(uv.data[loop_index].uv)
            if shade:
                color_index = loop.vertex_index if shade.domain == 'POINT' else loop_index
                attrs['color'].extend(shade.data[color_index].color[:3])
    patches.append({'path': path, 'name': source['candidate']['meshes'][path]['name'],
        'attributes': {key:[round(v,5) for v in values] for key,values in attrs.items() if values}, 'groups': groups})
    evaluated.to_mesh_clear()

package = {'version':1, 'id':'amber-blender-mcp-v1', 'base':'createAmberVolumeStudy',
    'source':'Official Blender Lab MCP · execute_blender_code', 'meshes':patches}
(PUBLIC/'mesh-patches.json').write_text(json.dumps(package,separators=(',',':')))
(OUT/'mesh-patches.json').write_text(json.dumps(package,separators=(',',':')))

camera_data = bpy.data.cameras.new('PawTrail shared orthographic camera')
camera = bpy.data.objects.new('PawTrail shared orthographic camera', camera_data)
scene.collection.objects.link(camera)
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 80
scene.camera = camera
def convert(v):
    return Vector((v[0],-v[2],v[1]))
camera.location = convert((0,56,90))
camera.rotation_euler = (convert((0,21.5,0))-camera.location).to_track_quat('-Z','Y').to_euler()
scene['pawtrail_note'] = 'Nearest textures and unlit painted color. Live preview applies the shared pixel palette/contour. Do not replace the shared animation rig.'
scene['editable_meshes'] = len(modified)
scene['shared_animations'] = 'Runtime reuses createAmberVolumeStudy → createAmberShoulderStudy → createRescuer.pose'
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'amber-blender-mcp.blend'))

renders = OUT/'renders'
renders.mkdir(exist_ok=True)
# These are offline artwork renders, not browser or application verification.
for label, root, collection, other in [('current',before,before_collection,after_collection), ('blender',after,after_collection,before_collection)]:
    collection.hide_render = False
    other.hide_render = True
    offset = root.location.x
    root.location.x = 0
    for heading, angle in [('front',0), ('three-quarter',-math.pi/4), ('side',-math.pi/2)]:
        root.rotation_euler = (Matrix.Rotation(math.pi/2,4,'X') @ Matrix.Rotation(angle,4,'Y')).to_euler()
        scene.render.filepath = str(renders/f'{label}-{heading}.png')
        bpy.ops.render.render(write_still=True)
    root.location.x = offset
    root.rotation_euler = (math.pi/2,0,0)
before_collection.hide_render = False
after_collection.hide_render = False
bpy.context.view_layer.objects.active = next(obj for obj in objects.values() if obj.type=='MESH' and not obj.hide_render)
result = {'status':'ok', 'source_model':str(OUT/'amber-blender-mcp.blend'), 'mesh_patches':len(patches),
    'runtime_bytes':(PUBLIC/'mesh-patches.json').stat().st_size, 'offline_renders':str(renders),
    'preserved':['face shape and three eye states','shared skeleton and actions','continuous hair and cape motion','feet anchors and sockets','native pixel textures']}
