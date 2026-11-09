import { photoPortraitStyle, photoPortraitPoses, type PhotoPortraitPose } from './photo-portrait-catalog'
import { PORTRAIT_FPS, type DialoguePortraitRenderer } from './portrait-renderer'
import { defaultPortraitView, type PortraitView } from './portrait-state'
import { drawPortraitBreathing, type PortraitBreathing } from './portrait-motion'

type BlinkPerformance = { sequence: number[]; durationsMs: number[]; idleDelayMs: number[] }
type SpeechPerformance = { sequence: number[]; durationsMs: number[] }
type ExpressionLayers = {
  base: number; blink: number[]; talk: number[]; reference: string
  blinkPerformance?: BlinkPerformance
  speechPerformance?: SpeechPerformance
  breathing?: PortraitBreathing
  blinkRegions?: [number, number, number, number][]
  speechRegions?: [number, number, number, number][]
}
type CompletePortraitState = 'rest' | 'half' | 'closed' | 'small' | 'open'
type CompleteExpression = {
  states: Record<CompletePortraitState, number[]>
  eyesClosedAtRest?: boolean
  blinkPerformance: BlinkPerformance
  speechPerformance: SpeechPerformance
  breathPerformance: SpeechPerformance
}
type PoseLayers = { expressions: Record<string, ExpressionLayers> }
type ManifestBase = {
  atlas?: string
  nativeCell: [number, number]
  contentBounds?: [number, number, number, number]
  frames: [number, number, number, number][]
}
type LayerManifest = ManifestBase & {
  version: 2
  kind: 'authored-expression-portrait'
  poses: Record<PhotoPortraitPose, PoseLayers>
  blink: BlinkPerformance
  talk: SpeechPerformance
  breathing: PortraitBreathing
}
type CompleteManifest = ManifestBase & {
  version: 3
  kind: 'authored-frame-portrait'
  poses: Record<PhotoPortraitPose, { expressions: Record<string, CompleteExpression> }>
  pixelData?: { file: string; encoding: string; palette: number[][]; frameCount: number }
}
type Manifest = LayerManifest | CompleteManifest
type Bundle = { manifest: Manifest; image?: HTMLImageElement; pixels?: Uint8Array }
const bundles = new Map<string, Promise<Bundle>>()

async function bundleFor(id: string, revision?: string) {
  const style = photoPortraitStyle(id)
  const suffix = revision ? `?v=${encodeURIComponent(revision)}` : ''
  const key = style.folder + suffix
  const found = bundles.get(key)
  if (found) return found
  const promise = (async () => {
    const response = await fetch(`${style.folder}/portrait.json${suffix}`)
    if (!response.ok) throw new Error('The portrait animation could not be loaded.')
    const manifest: Manifest = await response.json()
    const supported = (manifest.version === 2 && manifest.kind === 'authored-expression-portrait')
      || (manifest.version === 3 && manifest.kind === 'authored-frame-portrait')
    const supportedAtlas = (manifest.kind === 'authored-frame-portrait' && manifest.pixelData) || manifest.atlas === 'portrait.png'
      || (manifest.kind === 'authored-frame-portrait' && manifest.atlas === 'portrait.webp')
    if (!supported || !supportedAtlas
      || !Array.isArray(manifest.nativeCell) || !style.nativeCell.every((n, i) => n === manifest.nativeCell[i])
      || !Array.isArray(manifest.frames) || !manifest.frames.length
      || !photoPortraitPoses(style).every(pose => manifest.poses?.[pose.id]?.expressions?.neutral)) {
      throw new Error('The portrait animation format is not supported.')
    }
    if (manifest.kind === 'authored-frame-portrait' && manifest.pixelData) {
      const pixels = manifest.pixelData
      if (pixels.file !== 'portrait.frames.br' || pixels.encoding !== 'indexed8-brotli'
        || pixels.frameCount !== manifest.frames.length || pixels.frameCount > 512
        || !Array.isArray(pixels.palette) || !pixels.palette.length || pixels.palette.length > 256) {
        throw new Error('The complete portrait pixel format is not supported.')
      }
      let decoded: Uint8Array
      try {
        const decoder = new DecompressionStream('brotli' as CompressionFormat)
        const packed = await fetch(`${style.folder}/${pixels.file}${suffix}`)
        if (!packed.ok || !packed.body) throw new Error('The complete portrait frames could not load.')
        decoded = new Uint8Array(await new Response(packed.body.pipeThrough(decoder)).arrayBuffer())
      } catch {
        // Older browsers can use ordinary HTTP Brotli decoding through the
        // integrated app's public asset adapter; no JS/WASM codec is downloaded.
        const parts = style.folder.match(/\/dialogue-portraits\/([a-z0-9-]+)\/([a-z0-9-]+)$/)
        if (!parts) throw new Error('The complete portrait frames could not decode.')
        const fallback = await fetch(`/api/neighborhood/portrait-frames/${parts[1]}/${parts[2]}${suffix}`)
        if (!fallback.ok) throw new Error('The complete portrait frames could not decode.')
        decoded = new Uint8Array(await fallback.arrayBuffer())
      }
      if (decoded.length !== pixels.frameCount * manifest.nativeCell[0] * manifest.nativeCell[1]) {
        throw new Error('The complete portrait data has an unexpected size.')
      }
      return { manifest, pixels: decoded }
    }
    const image = new Image()
    image.src = `${style.folder}/${manifest.atlas}${suffix}`
    await image.decode()
    if (!manifest.frames.every(rect => Array.isArray(rect) && rect.length === 4
      && rect.every(Number.isInteger) && rect[0] >= 0 && rect[1] >= 0
      && rect[2] === manifest.nativeCell[0] && rect[3] === manifest.nativeCell[1]
      && rect[0] + rect[2] <= image.naturalWidth && rect[1] + rect[3] <= image.naturalHeight)) {
      throw new Error('The portrait atlas does not match its animation frames.')
    }
    return { manifest, image }
  })()
  bundles.set(key, promise)
  if (bundles.size > 2) bundles.delete(bundles.keys().next().value!)
  void promise.catch(() => { if (bundles.get(key) === promise) bundles.delete(key) })
  return promise
}

function phase(time: number, sequence: number[], durations: number[]) {
  const total = durations.reduce((sum, duration) => sum + duration, 0)
  let cursor = time % total
  for (let i = 0; i < durations.length; i++) {
    if (cursor < durations[i]) return sequence[i]
    cursor -= durations[i]
  }
  return sequence[0]
}

function decodeCompleteFrame(bundle: Bundle, id: number): ImageData {
  const manifest = bundle.manifest
  if (manifest.kind !== 'authored-frame-portrait' || !manifest.pixelData || !bundle.pixels
    || !Number.isInteger(id) || id < 0 || id >= manifest.pixelData.frameCount) {
    throw new Error('A complete portrait frame is missing.')
  }
  const [width, height] = manifest.nativeCell, length = width * height
  const rgba = new Uint8ClampedArray(length * 4)
  for (let pixel = 0; pixel < length; pixel++) {
    const index = bundle.pixels[id * length + pixel]
    const color = manifest.pixelData.palette[index]
    if (!color) throw new Error('A complete portrait color is missing.')
    rgba[pixel * 4] = color[0]; rgba[pixel * 4 + 1] = color[1]; rgba[pixel * 4 + 2] = color[2]
    rgba[pixel * 4 + 3] = index === 0 ? 0 : 255
  }
  return new ImageData(rgba, width, height)
}

/** Decode literal complete asset frames for the independent paused-frame strip. */
export async function completePortraitFrameImages(id: string, revision: string, pose: string, emotion: string) {
  const bundle = await bundleFor(id, revision), manifest = bundle.manifest
  if (manifest.kind !== 'authored-frame-portrait') return []
  const performance = manifest.poses[pose as PhotoPortraitPose]?.expressions[emotion === 'idle' ? 'neutral' : emotion]
  if (!performance) return []
  const canvas = document.createElement('canvas')
  ;[canvas.width, canvas.height] = manifest.nativeCell
  const context = canvas.getContext('2d')!
  return (['rest', 'half', 'closed', 'small', 'open'] as const).map(state => {
    context.putImageData(decodeCompleteFrame(bundle, performance.states[state][0]), 0, 0)
    return { state, png: canvas.toDataURL(), width: canvas.width, height: canvas.height }
  })
}

/** Complete frames and legacy deltas share LivingPortrait's playback lifecycle. */
export async function createPhotoPortraitRenderer(id: string, revision?: string): Promise<DialoguePortraitRenderer> {
  return new PhotoPortraitRenderer(await bundleFor(id, revision))
}

class PhotoPortraitRenderer implements DialoguePortraitRenderer {
  readonly assetSource = 'authored' as const
  readonly nativeSize: [number, number]
  readonly contentBounds?: [number, number, number, number]
  private canvas = document.createElement('canvas')
  private context: CanvasRenderingContext2D
  private output = document.createElement('canvas')
  private outputContext: CanvasRenderingContext2D
  private cache = new Map<string, ImageData>()
  private disposed = false

  constructor(private bundle: Bundle) {
    this.nativeSize = bundle.manifest.nativeCell
    this.contentBounds = bundle.manifest.contentBounds
    this.canvas.width = this.nativeSize[0]
    this.canvas.height = this.nativeSize[1]
    const context = this.canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('The portrait canvas is not available.')
    context.imageSmoothingEnabled = false
    this.context = context
    this.output.width = this.nativeSize[0]
    this.output.height = this.nativeSize[1]
    const outputContext = this.output.getContext('2d', { willReadFrequently: true })
    if (!outputContext) throw new Error('The portrait motion canvas is not available.')
    this.outputContext = outputContext
  }

  frame(index: number, view: PortraitView = defaultPortraitView) {
    if (this.disposed) throw new Error('The portrait has been closed.')
    const { manifest, image } = this.bundle
    if (manifest.kind === 'authored-frame-portrait') return this.completeFrame(index, view, manifest, image)
    const angle = view.pose ?? 'front-pout'
    const pose = manifest.poses[angle] ?? manifest.poses['front-pout']
    const emotion = view.expression === 'idle' || view.expression === 'talking' ? 'neutral' : view.expression
    const layers = pose.expressions[emotion] ?? pose.expressions.neutral
    const blinkPerformance = layers.blinkPerformance ?? manifest.blink
    const speechPerformance = layers.speechPerformance ?? manifest.talk
    const time = index * 1000 / PORTRAIT_FPS
    const blinkMode = view.blink ?? 'auto'
    let blink: number | undefined
    if (!view.steady && blinkMode === 'half') blink = 0
    if (!view.steady && blinkMode === 'closed') blink = 1
    if (blinkMode === 'auto' && !view.steady) {
      const start = blinkPerformance.idleDelayMs[0]
      const cycle = time % (start + 700)
      const duration = blinkPerformance.durationsMs.reduce((sum, ms) => sum + ms, 0)
      if (cycle >= start && cycle < start + duration) {
        blink = phase(cycle - start, blinkPerformance.sequence, blinkPerformance.durationsMs)
      }
    }
    const talking = !view.steady && (view.talking || view.expression === 'talking')
    const mouthMode = view.mouth ?? 'auto'
    const mouth = view.steady ? undefined : mouthMode === 'rest' ? 0 : mouthMode === 'small' ? 1 : mouthMode === 'round' ? 2
      : talking ? phase(time, speechPerformance.sequence, speechPerformance.durationsMs) : undefined
    const key = `${angle}:${emotion}:${blink ?? 'rest'}:${mouth ?? 'rest'}`
    const cached = this.cache.get(key)
    let frame = cached
    if (!frame) {
      const draws = [
        { id: layers.base, regions: undefined },
        { id: blink === undefined ? null : layers.blink[blink], regions: layers.blinkRegions },
        { id: mouth === undefined ? null : layers.talk[mouth], regions: mouth ? layers.speechRegions : undefined },
      ]
      this.context.clearRect(0, 0, ...this.nativeSize)
      for (const { id, regions } of draws) {
        if (id === null || id === undefined) continue
        const rect = manifest.frames[id]
        if (!rect) throw new Error('A portrait animation layer is missing.')
        // Authored patches replace their exact anatomical footprint, including
        // transparent profile-lip pixels. Legacy source-over deltas keep working.
        for (const region of regions ?? []) this.context.clearRect(...region)
        this.context.drawImage(image!, ...rect, 0, 0, ...this.nativeSize)
      }
      frame = this.context.getImageData(0, 0, ...this.nativeSize)
      if (this.cache.size >= 24) this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, frame)
    }
    if (view.breathing !== false && !view.steady) {
      this.context.putImageData(frame, 0, 0)
      drawPortraitBreathing(this.canvas, this.outputContext, time, layers.breathing ?? manifest.breathing)
      return this.outputContext.getImageData(0, 0, ...this.nativeSize)
    }
    return frame
  }

  private completeFrame(index: number, view: PortraitView, manifest: CompleteManifest, image?: HTMLImageElement) {
    const pose = manifest.poses[view.pose ?? 'front-pout'] ?? manifest.poses['front-pout']
    const emotion = view.expression === 'idle' || view.expression === 'talking' ? 'neutral' : view.expression
    const performance = pose.expressions[emotion] ?? pose.expressions.neutral
    const time = index * 1000 / PORTRAIT_FPS
    let state: CompletePortraitState = 'rest'
    if (!view.steady) {
      const mouth = view.mouth ?? 'auto'
      const talking = view.talking || view.expression === 'talking'
      if (mouth === 'small') state = 'small'
      else if (mouth === 'round') state = 'open'
      else if (mouth !== 'rest' && talking) {
        const speech = performance.speechPerformance
        state = (['rest', 'small', 'open'] as const)[phase(time, speech.sequence, speech.durationsMs)]
      }
      // A real blink drawing takes precedence. We have no authored combined
      // blink/open-mouth drawing, so never manufacture one from facial patches.
      const blink = view.blink ?? 'auto'
      if (blink === 'half') state = 'half'
      else if (blink === 'closed') state = 'closed'
      else if (blink === 'auto' && !performance.eyesClosedAtRest) {
        const timing = performance.blinkPerformance
        const start = timing.idleDelayMs[0], cycle = time % (start + 700)
        const length = timing.durationsMs.reduce((sum, duration) => sum + duration, 0)
        if (cycle >= start && cycle < start + length) {
          state = phase(cycle - start, timing.sequence, timing.durationsMs) === 0 ? 'half' : 'closed'
        }
      }
    }
    const breath = performance.breathPerformance
    const breathingFrame = !view.steady && view.breathing !== false
      ? phase(time, breath.sequence, breath.durationsMs) : 0
    const id = performance.states[state][breathingFrame]
    const key = `complete:${id}`
    const cached = this.cache.get(key)
    if (cached) return cached
    if (manifest.pixelData && this.bundle.pixels) {
      const frame = decodeCompleteFrame(this.bundle, id)
      if (this.cache.size >= 24) this.cache.delete(this.cache.keys().next().value!)
      this.cache.set(key, frame)
      return frame
    }
    const rect = manifest.frames[id]
    if (!rect) throw new Error('A complete portrait frame is missing.')
    this.context.clearRect(0, 0, ...this.nativeSize)
    // Exactly one full asset draw. No face masks, feature overlays, interpolation,
    // procedural breathing, scaling or other modifications on this path.
    if (!image) throw new Error('The complete portrait image could not load.')
    this.context.drawImage(image, ...rect, 0, 0, ...this.nativeSize)
    const frame = this.context.getImageData(0, 0, ...this.nativeSize)
    if (this.cache.size >= 24) this.cache.delete(this.cache.keys().next().value!)
    this.cache.set(key, frame)
    return frame
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.cache.clear()
    this.canvas.width = this.canvas.height = 0
    this.output.width = this.output.height = 0
  }
}
