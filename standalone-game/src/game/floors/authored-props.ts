import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import type { FloorPropState } from './prop-state'

/** One owner per stage: loaded geometry/paint is released with the stage. */
export async function loadAuthoredProp(file: string) {
  const gltf = await new GLTFLoader().loadAsync(file), root = gltf.scene
  const resources = { geometry: new Set<T.BufferGeometry>(), materials: new Set<T.Material>(), textures: new Set<T.Texture>() }
  const nodes = new Map<string, { node: T.Object3D; position: T.Vector3; rotation: T.Euler }>()
  root.traverse(node => {
    nodes.set(node.name, { node, position: node.position.clone(), rotation: node.rotation.clone() })
    if (!(node instanceof T.Mesh)) return
    resources.geometry.add(node.geometry)
    for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
      resources.materials.add(material)
      for (const value of Object.values(material)) if (value instanceof T.Texture) {
        value.magFilter = value.minFilter = T.NearestFilter; value.generateMipmaps = false; value.needsUpdate = true; resources.textures.add(value)
      }
    }
  })
  let openness = 0, lastTime: number | null = null
  const relayAngles=new Map<string,number>()
  return {
    root,
    animate(timeMs: number, state: FloorPropState | undefined, reducedMotion: boolean) {
      const dt = lastTime === null ? 0 : Math.max(0, Math.min(100, timeMs - lastTime)); lastTime = timeMs
      const target = state?.open ? 1 : 0
      openness = reducedMotion ? target : openness + Math.sign(target - openness) * Math.min(Math.abs(target - openness), dt / 380)
      for (const [name, entry] of nodes) {
        entry.node.position.copy(entry.position); entry.node.rotation.copy(entry.rotation)
        if(name==='koi-projection')entry.node.visible=state?.lit!==false
        if(name.startsWith('koi-fish-')&&!reducedMotion){const i=Number(name.slice(9)),t=timeMs/1000+i*Math.PI;entry.node.position.x+=Math.cos(t*.55)*5;entry.node.position.z+=Math.sin(t*.55)*5;entry.node.position.y+=Math.sin(t*.8)*1.2;entry.node.rotation.y+=Math.sin(t*.55)*.3}
        if(name.startsWith('koi-tail-')&&!reducedMotion)entry.node.rotation.y+=Math.sin(timeMs/180+Number(name.slice(9)))*.35
        if(name.startsWith('sealed-record-'))entry.node.visible=!!state?.open
        if (name === 'door-left') entry.node.position.x -= openness * 25
        if (name === 'door-right') entry.node.position.x += openness * 25
        if (name.startsWith('lever-')) entry.node.position.y += state?.allocation ? (name === 'lever-1' || name === (state.allocation === 'clinic' ? 'lever-0' : 'lever-2') ? -4 : 0) : state?.lit === false ? -4 : 0
        if (name === 'display-lid') entry.node.position.y += state?.open ? 8 : 0
        if(name==='archive-drawer')entry.node.position.z+=openness*14
        if(name==='cabinet-left')entry.node.rotation.y-=openness*Math.PI*.61
        if(name==='cabinet-right')entry.node.rotation.y+=openness*Math.PI*.61
        if(name==='valve-wheel')entry.node.rotation.y+=openness*Math.PI*2
        if(name.startsWith('relay-rotor-')){
          const index=Number(name.slice(12)),target=(state?.relay?.[index]??0)*Math.PI/2,previous=relayAngles.get(name)??target
          const delta=Math.atan2(Math.sin(target-previous),Math.cos(target-previous)),angle=reducedMotion?target:previous+delta*Math.min(1,dt/140)
          relayAngles.set(name,angle);entry.node.rotation.z-=angle
        }
      }
      for (const material of resources.materials) if (material instanceof T.MeshStandardMaterial && material.emissiveIntensity > 0) {
        material.emissiveIntensity = state?.lit === false ? .08 : reducedMotion ? .7 : .65 + Math.sin(timeMs / 1700) * .12
      }
    },
    dispose() {
      resources.geometry.forEach(value => value.dispose()); resources.materials.forEach(value => value.dispose())
      resources.textures.forEach(value => { value.dispose(); const source = value.source.data; if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close() })
    },
  }
}
