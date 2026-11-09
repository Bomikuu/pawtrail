import * as T from 'three'
import { createCat, disposeRig, appearancePalette, actions, type Rig } from './rigs'
import { PixelFinish } from './pixel-renderer'
import { catAppearanceSignature, type CatAppearance } from '../cat-creator/appearance'

export const CAT_CREATOR_FRAME = { width: 160, height: 160, density: 2, worldWidth: 80, worldHeight: 80, anchor: { x: .5, y: 52 / 80 } }
export const catClips = actions['orange-tabby'] as Record<string, { frames?: number; fps: number; repeat: number }>
const headings = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right']

/** The production cat rig/camera/finish, sampled live without exporting a sheet. */
export class PixelCat {
  private renderer = new T.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'low-power' })
  private scene = new T.Scene()
  private camera = new T.OrthographicCamera(-40, 40, 40, -40, .1, 200)
  private canvas = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private rig?: Rig
  private finish!: PixelFinish
  private signature = ''
  private frames = new Map<string, ImageData>()
  private disposed = false
  constructor(appearance: CatAppearance) {
    this.canvas.width = 160; this.canvas.height = 160
    const context = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!context) { this.renderer.dispose(); throw new Error('The cat renderer could not open. Please retry.') }
    this.context = context
    this.renderer.setPixelRatio(1); this.renderer.setSize(160, 160, false); this.renderer.setClearColor(0x000000, 0)
    this.renderer.outputColorSpace = T.SRGBColorSpace; this.renderer.toneMapping = T.NoToneMapping
    this.camera.position.set(0, 44, 68); this.camera.lookAt(0, 13, 0)
    try { this.setAppearance(appearance) } catch (error) { this.dispose(); throw error }
  }
  setAppearance(appearance: CatAppearance) {
    const signature = catAppearanceSignature(appearance)
    if (signature === this.signature) return
    const next = createCat(appearance)
    if (this.rig) disposeRig(this.rig)
    this.rig = next; this.scene.add(next.root)
    this.finish = new PixelFinish(appearancePalette(appearance)); this.signature = signature; this.frames.clear()
  }
  frame(action: string, direction: string, frame: number, locomotionFrame?: number, gait: 'walk' | 'run' = 'walk') {
    const clip = catClips[action] ?? catClips.idle, count = clip.frames ?? 8
    frame = Math.max(0, Math.min(count - 1, Math.floor(frame)))
    const key = [action, direction, frame, locomotionFrame ?? '-', gait].join(':')
    const cached = this.frames.get(key)
    if (cached) return cached
    if (this.renderer.getContext().isContextLost()) throw new Error('The cat renderer was interrupted. Retry the preview.')
    this.rig!.pose(action, frame / (clip.repeat === 0 ? count - 1 : count), {
      locomotionPhase: locomotionFrame === undefined ? undefined : locomotionFrame / (catClips[gait].frames ?? 8), gait,
    })
    this.rig!.root.rotation.y = -Math.max(0, headings.indexOf(direction)) * Math.PI / 4
    this.renderer.render(this.scene, this.camera)
    this.context.clearRect(0, 0, 160, 160); this.context.drawImage(this.renderer.domElement, 0, 0)
    const result = this.finish.finish(this.context.getImageData(0, 0, 160, 160), CAT_CREATOR_FRAME.density)
    if (this.frames.size >= 96) this.frames.delete(this.frames.keys().next().value!)
    this.frames.set(key, result)
    return result
  }
  portrait() {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160
    canvas.getContext('2d')!.putImageData(this.frame('idle', 'down', 0), 0, 0)
    return canvas.toDataURL('image/png')
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    if (this.rig) disposeRig(this.rig)
    this.frames.clear(); this.renderer.dispose(); this.renderer.forceContextLoss()
  }
}
