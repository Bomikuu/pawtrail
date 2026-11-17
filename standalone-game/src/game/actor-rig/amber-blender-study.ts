import * as T from 'three'
import type { ActorAppearance } from './appearance'
import { disposeRig, type Rig } from './rigs'
import { createAmberVolumeStudy } from './amber-volume-study'
import { loadAmberStudyTextures } from './amber-study-textures'

type MeshPatch = {
  path: string
  name: string
  attributes: { position: number[]; normal: number[]; uv?: number[]; color?: number[] }
  groups: { start: number; count: number; materialIndex: number }[]
}
type MeshPackage = { version: number; id: string; base: string; meshes: MeshPatch[] }
let packageData: MeshPackage | undefined
let loading: Promise<void> | undefined

/** The comparison is lazy: no Blender assets are downloaded for ordinary play. */
export function prepareAmberBlenderStudy() {
  return loading ??= Promise.all([
    loadAmberStudyTextures(),
    fetch('/pawtrail-game/actor-studio/amber-blender-mcp-v1/mesh-patches.json').then(async response => {
      if (!response.ok) throw new Error('Amber’s Blender revision could not load. Retry the comparison.')
      const data = await response.json() as MeshPackage
      if (data.version !== 1 || data.id !== 'amber-blender-mcp-v1' || data.base !== 'createAmberVolumeStudy' || !Array.isArray(data.meshes) || !data.meshes.length) {
        throw new Error('Amber’s Blender mesh package is incompatible with this rig.')
      }
      for (const mesh of data.meshes) {
        const { position, normal, uv, color } = mesh.attributes
        if (!position?.length || position.length % 9 || position.length > 150_000 || normal?.length !== position.length || uv && uv.length !== position.length / 3 * 2 || color && color.length !== position.length) {
          throw new Error('An Amber mesh has incompatible vertex data.')
        }
      }
      packageData = data
    }),
  ]).then(() => undefined).catch(error => { loading = undefined; throw error })
}

/** Only visible mesh buffers change. The existing joints, poses and cloth stay live. */
export function createAmberBlenderStudy(appearance: ActorAppearance): Rig {
  if (!packageData) throw new Error('Load Amber’s Blender revision before creating its model.')
  const rig = createAmberVolumeStudy(appearance)
  const paths = new Map<string, T.Object3D>()
  const visit = (node: T.Object3D, path: string) => {
    paths.set(path, node)
    node.children.forEach((child, index) => visit(child, `${path}/${index}:${child.name}`))
  }
  visit(rig.root, '0:' + rig.root.name)
  for (const patch of packageData.meshes) {
    const node = paths.get(patch.path)
    if (!(node instanceof T.Mesh) || node.name !== patch.name) {
      disposeRig(rig)
      throw new Error('Amber’s model parts changed. Re-export the Blender revision against the current rig.')
    }
  }
  const replaced = new Set<T.BufferGeometry>()
  for (const patch of packageData.meshes) {
    const node = paths.get(patch.path) as T.Mesh
    const geometry = new T.BufferGeometry()
    for (const [name, values] of Object.entries(patch.attributes)) {
      geometry.setAttribute(name, new T.Float32BufferAttribute(values, name === 'uv' ? 2 : 3))
    }
    for (const group of patch.groups) geometry.addGroup(group.start, group.count, group.materialIndex)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    replaced.add(node.geometry)
    node.geometry = geometry
  }
  const retained = new Set<T.BufferGeometry>()
  rig.root.traverse(node => { if (node instanceof T.Mesh) retained.add(node.geometry) })
  for (const geometry of replaced) if (!retained.has(geometry) && !geometry.userData.sharedActorGeometry) geometry.dispose()
  rig.root.userData.blenderRevision = packageData.id
  return rig
}
