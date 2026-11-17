import * as T from 'three'
import { createFurniture, furnitureCamera, furnitureDefinitions, projectedGeometry, FURNITURE_FRAME, FACINGS, type FurnitureDefinition } from '../furniture/model'
import { furnitureOutline } from '../furniture/pixel-outline'
import { PixelFinish } from '../actor-rig/pixel-renderer'
import { loadAuthoredProp } from './authored-props'
import type { FloorPropState } from './prop-state'

type Facing = typeof FACINGS[number]
type Contacts = ReturnType<typeof projectedGeometry>
type Instance = { definition: FurnitureDefinition; model: ReturnType<typeof createFurniture>; finish: PixelFinish; contacts: Map<Facing, Contacts>; cameras: Map<Facing, T.OrthographicCamera> }

/** Lazy-import this adapter only after entering an installed floor.
 * One shared context renders existing real furniture models into the stage's
 * native 2D composition. No generated artwork, duplicated actor or per-prop RAF.
 * Actor docking/collision still use the shared controller and returned contacts.
 */
export class FloorPropRenderer {
  private renderer: T.WebGLRenderer
  private scene = new T.Scene()
  private scratch = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private instances = new Map<string, Instance>()
  private authored = new Map<string, Awaited<ReturnType<typeof loadAuthoredProp>>>()
  private painted = new Map<string, { canvas: HTMLCanvasElement; key: string }>()
  private authoredCamera = new T.OrthographicCamera(-80, 80, 168, -24, .1, 1000)
  private events = new AbortController()
  private lost = false
  private disposed = false
  constructor(private limit = 16) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 32) throw Error('Choose a bounded floor prop capacity from 1 to 32.')
    this.scratch.width = 160; this.scratch.height = 192
    const context = this.scratch.getContext('2d', { willReadFrequently: true })
    if (!context) throw Error('Native prop composition is unavailable.')
    this.context = context
    this.renderer = new T.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(160, 192, false)
    this.renderer.setClearColor(0, 0)
    this.renderer.outputColorSpace = T.SRGBColorSpace
    this.renderer.toneMapping = T.NoToneMapping
    const pitch = 34.5 * Math.PI / 180
    this.authoredCamera.position.set(0, Math.sin(pitch) * 300, Math.cos(pitch) * 300); this.authoredCamera.lookAt(0, 0, 0)
    this.scene.add(new T.AmbientLight(0xffffff, 1.4))
    const light = new T.DirectionalLight(0xffe5ca, 2); light.position.set(-80, 180, 120); this.scene.add(light)
    this.renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); this.lost = true }, { signal: this.events.signal })
    this.renderer.domElement.addEventListener('webglcontextrestored', () => { this.lost = false }, { signal: this.events.signal })
  }
  async addAuthored(instanceId: string, file: string) {
    if (this.disposed || this.authored.has(instanceId) || this.authored.size + this.instances.size >= this.limit) throw Error('The floor prop capacity is unavailable.')
    const model = await loadAuthoredProp(file)
    if (this.disposed) { model.dispose(); return }
    model.root.visible = false; this.scene.add(model.root); this.authored.set(instanceId, model)
  }
  has(instanceId: string) { return this.authored.has(instanceId) || this.instances.has(instanceId) }
  drawAuthored(target: CanvasRenderingContext2D, instanceId: string, x: number, y: number, facing: number, timeMs: number, state?: FloorPropState, reducedMotion = false) {
    const model = this.authored.get(instanceId)
    if (!model || this.disposed || this.lost) throw Error('The live floor model is unavailable. Return to Edit and retry.')
    const key = [facing, reducedMotion ? 0 : Math.floor(timeMs / 80), JSON.stringify(state)].join(':')
    let cached = this.painted.get(instanceId)
    if (!cached) { const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 192; cached = { canvas, key: '' }; this.painted.set(instanceId, cached) }
    if (cached.key === key) { target.drawImage(cached.canvas, Math.round(x - 80), Math.round(y - 168)); return }
    model.root.visible = true; model.root.rotation.y = -facing * Math.PI / 180
    try {
      model.animate(timeMs, state, reducedMotion); this.renderer.setViewport(0, 0, 160, 192); this.renderer.setScissorTest(false)
      this.renderer.render(this.scene, this.authoredCamera)
      this.context.clearRect(0, 0, 160, 192); this.context.drawImage(this.renderer.domElement, 0, 0)
      this.context.putImageData(furnitureOutline(this.context.getImageData(0, 0, 160, 192)), 0, 0)
      const copy = cached.canvas.getContext('2d')!; copy.clearRect(0, 0, 160, 192); copy.drawImage(this.scratch, 0, 0); cached.key = key
      target.save(); target.imageSmoothingEnabled = false; target.drawImage(this.scratch, Math.round(x - 80), Math.round(y - 168)); target.restore()
    } finally { model.root.visible = false }
  }
  add(instanceId: string, definitionId: string, styleId?: string) {
    if (this.disposed || this.instances.has(instanceId) || this.instances.size + this.authored.size >= this.limit) throw Error('The prop renderer is closed, full, or already owns this instance.')
    const definition = furnitureDefinitions.find(item => item.id === definitionId)
    if (!definition) throw Error('Choose an existing registered furniture model.')
    const style = styleId ? definition.styles.find(item => item.id === styleId) : definition.styles[0]
    if (!style) throw Error('This furniture style is not registered.')
    const model = createFurniture(definition, style)
    try {
      const contacts = new Map<Facing, Contacts>(), cameras = new Map<Facing, T.OrthographicCamera>()
      for (const facing of FACINGS) { contacts.set(facing, projectedGeometry(facing, definition)); cameras.set(facing, furnitureCamera(facing, definition)) }
      model.root.visible = false; this.scene.add(model.root)
      this.instances.set(instanceId, { definition, model, finish: new PixelFinish(model.palette), contacts, cameras })
    } catch (error) { model.dispose(); throw error }
  }
  contacts(instanceId: string, facing: Facing) {
    const contacts = this.instances.get(instanceId)?.contacts.get(facing)
    if (!contacts) throw Error('The live furniture instance or facing is unavailable.')
    return structuredClone(contacts)
  }
  draw(target: CanvasRenderingContext2D, instanceId: string, x: number, y: number, facing: Facing, phase: number, force = 0, part: 'whole' | 'front' = 'whole') {
    if (this.disposed || this.lost) throw Error('The live prop renderer is unavailable. Keep the current stage paused.')
    const instance = this.instances.get(instanceId), contacts = instance?.contacts.get(facing), camera = instance?.cameras.get(facing)
    if (!instance || !contacts || !camera || ![x, y, phase, force].every(Number.isFinite)) throw Error('The prop or its native placement is invalid.')
    const { model } = instance, context = this.context, cacheId = instanceId + ':' + part
    const key = [facing, Math.floor(phase * 48), Math.round(force * 16)].join(':')
    let cached = this.painted.get(cacheId)
    if (!cached) { const canvas = document.createElement('canvas'); canvas.width = FURNITURE_FRAME.width; canvas.height = FURNITURE_FRAME.height; cached = { canvas, key: '' }; this.painted.set(cacheId, cached) }
    if (cached.key === key) { target.drawImage(cached.canvas, Math.round(x - contacts.anchor[0]), Math.round(y - contacts.anchor[1])); return }
    model.whole(); model.root.visible = true; model.root.rotation.y = -facing * Math.PI / 180
    try {
      model.animate(phase, Math.max(-1, Math.min(1, force)))
      if (part === 'front') model.foreground(facing)
      this.renderer.setViewport(0, 0, FURNITURE_FRAME.width, FURNITURE_FRAME.height); this.renderer.setScissorTest(false)
      this.renderer.render(this.scene, camera)
      context.clearRect(0, 0, this.scratch.width, this.scratch.height)
      context.drawImage(this.renderer.domElement, 0, 192 - FURNITURE_FRAME.height, FURNITURE_FRAME.width, FURNITURE_FRAME.height, 0, 0, FURNITURE_FRAME.width, FURNITURE_FRAME.height)
      const source = context.getImageData(0, 0, FURNITURE_FRAME.width, FURNITURE_FRAME.height)
      context.putImageData(!model.preservePaint || instance.definition.model === 'couch' ? instance.finish.finish(source) : furnitureOutline(source), 0, 0)
      const copy = cached.canvas.getContext('2d')!; copy.clearRect(0, 0, cached.canvas.width, cached.canvas.height); copy.drawImage(this.scratch, 0, 0); cached.key = key
      target.save()
      try { target.imageSmoothingEnabled = false; target.drawImage(this.scratch, Math.round(x - contacts.anchor[0]), Math.round(y - contacts.anchor[1])) }
      finally { target.restore() }
    } finally { model.whole(); model.root.visible = false }
  }
  remove(instanceId: string) {
    for (const key of [instanceId, instanceId + ':whole', instanceId + ':front']) { const painted = this.painted.get(key); if (painted) { painted.canvas.width = painted.canvas.height = 1; this.painted.delete(key) } }
    const authored = this.authored.get(instanceId)
    if (authored) { this.scene.remove(authored.root); authored.dispose(); this.authored.delete(instanceId); return }
    const instance = this.instances.get(instanceId)
    if (!instance) return
    this.scene.remove(instance.model.root); instance.model.dispose(); this.instances.delete(instanceId)
  }
  get resources() { return { instances: this.instances.size + this.authored.size, contexts: this.disposed ? 0 : 1, nativeFrame: { width: 160, height: 192 }, gpu: { ...this.renderer.info.memory } } }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.events.abort()
    for (const id of [...this.instances.keys(), ...this.authored.keys()]) this.remove(id)
    this.renderer.dispose(); this.renderer.forceContextLoss()
    this.scratch.width = 1; this.scratch.height = 1
  }
}
