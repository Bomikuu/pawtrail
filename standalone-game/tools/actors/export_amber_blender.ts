/** Authoring export only. Run with tsx; native Canvas is installed outside the game. */
import { createRequire } from 'node:module'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import * as T from 'three'

const project = process.cwd()
const output = resolve(project, 'assets/actor-appearances/amber-blender-mcp-v1')
const require = createRequire(resolve(process.env.PAWTRAIL_CANVAS_ROOT ?? '/run/media/micxsz/Drive/Blender/authoring', 'package.json'))
const { createCanvas, Image: NativeImage } = require('@napi-rs/canvas')
class AssetImage extends NativeImage {
  set src(value: string) { super.src = readFileSync(resolve(project, 'public', value.replace(/^\//, ''))) }
  async decode() { if (!this.width) throw new Error('An Amber source texture did not decode.') }
}
Object.assign(globalThis, { document: { createElement: () => createCanvas(1, 1) }, Image: AssetImage })

const { defaultAppearance, fittedAppearance } = await import('../../src/game/actor-rig/appearance')
const { loadAmberStudyTextures } = await import('../../src/game/actor-rig/amber-study-textures')
const { createAmberShoulderStudy } = await import('../../src/game/actor-rig/amber-study-rig')
const { createAmberVolumeStudy } = await import('../../src/game/actor-rig/amber-volume-study')
const registry = JSON.parse(readFileSync(resolve(project, 'src/game/runtime/actor-previews.json'), 'utf8'))
const amber = registry.find((entry: { id: string }) => entry.id === 'amber-outrider')
if (!amber) throw new Error('Amber is missing from the actor registry.')
const base = defaultAppearance()
const appearance = fittedAppearance({ ...base, parts: { ...base.parts, ...amber.parts }, colors: { ...base.colors, ...amber.colors }, accessories: { ...base.accessories, ...amber.accessories }, face: amber.face ?? base.face })
await loadAmberStudyTextures()
mkdirSync(resolve(output, 'textures'), { recursive: true })
const textures = new Map<T.Texture, string>()
const materials = new Map<T.Material, string>()
const materialData: Record<string, unknown> = {}
const round = (values: ArrayLike<number>) => Array.from(values, value => Math.round(value * 1e6) / 1e6)
function materialId(material: T.Material) {
  if (materials.has(material)) return materials.get(material)!
  const id = 'material-' + materials.size
  materials.set(material, id)
  const m = material as T.MeshBasicMaterial
  let texture: string | undefined
  if (m.map) {
    texture = textures.get(m.map)
    if (!texture) {
      texture = `textures/${m.map.userData.studioSurface ?? 'surface'}-${textures.size}.png`
      writeFileSync(resolve(output, texture), m.map.image.toBuffer('image/png'))
      textures.set(m.map, texture)
    }
  }
  materialData[id] = { color: m.color.toArray(), texture, vertexColors: m.vertexColors, opacity: m.opacity, side: m.side }
  return id
}
function exportRig(factory: typeof createAmberShoulderStudy) {
  const rig = factory(appearance)
  rig.pose('idle', 0, { secondaryMotion: { phase: 0, locomotion: 0 } })
  rig.root.updateMatrixWorld(true)
  const nodes: unknown[] = [], meshes: Record<string, unknown> = {}
  function visit(node: T.Object3D, path: string, parent: string | null, visible: boolean) {
    const shown = visible && node.visible && !/Archive/.test(node.name)
    nodes.push({ path, parent, name: node.name, matrix: round(node.matrix.elements), visible: shown })
    if (shown && node instanceof T.Mesh) {
      const g = node.geometry
      meshes[path] = {
        name: node.name,
        attributes: Object.fromEntries(['position', 'normal', 'uv', 'color'].filter(key => g.hasAttribute(key)).map(key => [key, { size: g.getAttribute(key).itemSize, array: round(g.getAttribute(key).array) }])),
        index: g.index ? Array.from(g.index.array) : null,
        groups: g.groups,
        materials: (Array.isArray(node.material) ? node.material : [node.material]).map(materialId),
      }
    }
    node.children.forEach((child, i) => visit(child, `${path}/${i}:${child.name}`, path, shown))
  }
  visit(rig.root, '0:' + rig.root.name, null, true)
  return { nodes, meshes }
}
const current = exportRig(createAmberShoulderStudy)
const candidate = exportRig(createAmberVolumeStudy)
writeFileSync(resolve(output, 'source.json'), JSON.stringify({ version: 1, appearance, current, candidate, materials: materialData }))
console.log(`Exported Amber's existing meshes and ${textures.size} original pixel textures to ${output}`)
