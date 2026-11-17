import type { PortraitSubject } from './portrait-source'
import { defaultPortraitView, type PortraitView } from './portrait-state'
import { SPEAKER_PORTRAITS } from '../characters'
import { defaultAppearance } from './appearance'
import { gameAppearance } from './game-appearances'
import { authoredActorPortrait } from './authored-actor-portrait'

/** Dialogue artwork stays 2D. Gameplay actors and archived 3D authoring are separate. */
export const PORTRAIT_STYLE = 'original-layered-2d-v1'
export const PORTRAIT_SIZE = 288 // Integer 3× / 2× native 96 / 144 px artwork.
export const PORTRAIT_FPS = 12
export const PORTRAIT_FRAMES = 96
export type DialoguePortraitRenderer = {
  assetSource?: 'illustrated' | 'authored' | 'prototype'
  nativeSize?: [number, number]
  contentBounds?: [number, number, number, number]
  displayRendering?: 'smooth'|'pixelated'
  frame(index: number, view?: PortraitView): ImageData
  dispose(): void
}
type Patch = { source: [number, number, number, number]; target: [number, number, number, number] }
type Manifest = {
  version: number; id: string; kind: 'actor' | 'cat'; base: string; atlas: string; mask: string
  size: [number, number]; eyeCenters: [number, number][]
  layers: { eyes: Record<string, Patch>; mouth: Record<string, Patch> }
}
type Bundle = { manifest: Manifest; base: HTMLImageElement; atlas: HTMLImageElement }
const folder = '/pawtrail-game/game-assets/dialogue-portraits/layered-v1/'
const bundles = new Map<string, Promise<Bundle>>()
const images = new Map<string, Promise<HTMLImageElement>>()
function loadImage(url: string) {
  const found = images.get(url); if (found) return found
  const promise = (async () => { const image = new Image(); image.src = url; await image.decode(); return image })()
  images.set(url, promise)
  void promise.catch(() => { if (images.get(url) === promise) images.delete(url) })
  if (images.size > 32) images.delete(images.keys().next().value!)
  return promise
}
function loadBundle(id: string) {
  const found = bundles.get(id); if (found) return found
  const promise = (async () => {
    const response = await fetch(folder + id + '.json')
    if (!response.ok) throw new Error('Portrait artwork unavailable.')
    const manifest: Manifest = await response.json()
    if (manifest.version !== 1 || manifest.id !== id) throw new Error('Unsupported portrait artwork.')
    const [base, atlas] = await Promise.all([loadImage(manifest.base), loadImage(manifest.atlas)])
    return { manifest, base, atlas }
  })()
  bundles.set(id, promise)
  void promise.catch(() => { if (bundles.get(id) === promise) bundles.delete(id) })
  if (bundles.size > 12) bundles.delete(bundles.keys().next().value!)
  return promise
}
const rgb = (hex: string) => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16))
function nearestCoat(color: string) {
  const palette = { orange: '#e69a45', black: '#343333', white: '#f0e9df', gray: '#96928d', cream: '#d9bd8f', brown: '#926143' }
  const input = rgb(color)
  return Object.entries(palette).sort((a,b) => {
    const distance = (hex: string) => rgb(hex).reduce((sum,c,i) => sum + (c - input[i]) ** 2, 0)
    return distance(a[1]) - distance(b[1])
  })[0][0]
}
function choose(subject: PortraitSubject, identity?: string) {
  if (subject.kind === 'cat') {
    const aliases: Record<string,string> = { orange_tabby:'orange', 'orange-tabby':'orange', black_cat:'black', 'black-cat':'black', white_cat:'white', 'white-cat':'white', gray_cat:'gray', gray_tabby:'gray', 'gray-tabby':'gray', siamese:'cream', siamese_cat:'cream', calico:'orange', calico_cat:'orange' }
    return { id: 'cat-' + (identity && aliases[identity] || nearestCoat(subject.appearance.colors.orange)), tint: false }
  }
  if (subject.preset === 'maya') return { id: 'maya', tint: false }
  if (identity && SPEAKER_PORTRAITS[identity]) {
    const original = gameAppearance(identity)?.appearance
    const roles = ['hair','skin','jacket','shirt'] as const
    const changed = original && (roles.some(role => subject.appearance.colors[role] !== original.colors[role]) || subject.appearance.face.leftEye !== original.face.leftEye || subject.appearance.face.rightEye !== original.face.rightEye)
    return { id: identity, tint: Boolean(changed) }
  }
  const a = subject.appearance
  const id = a.accessories.glasses ? (a.parts.hair === 'spiky' ? 'male-violet-volunteer' : 'glasses-rescuer')
    : a.parts.hair === 'long' ? 'maya' : a.parts.hair === 'spiky' || a.parts.hair === 'hero-spikes' ? 'male-red-gardener' : 'trail-rescuer'
  return { id, tint: true }
}
function surface(width: number, height: number) {
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Portrait canvas unavailable.')
  context.imageSmoothingEnabled = false
  return { canvas, context }
}

export async function createPortraitRenderer(subject: PortraitSubject, identity?: string): Promise<DialoguePortraitRenderer> {
  const collection = subject.kind === 'actor' ? authoredActorPortrait(subject.appearance) : undefined
  if (collection) {
    const { createPhotoPortraitRenderer } = await import('./photo-portrait-renderer')
    return createPhotoPortraitRenderer(collection)
  }
  const selection = choose(subject, identity), bundle = await loadBundle(selection.id)
  const renderer = new LayeredPortrait(bundle)
  if (selection.tint && subject.kind === 'actor') {
    try { await renderer.color(subject, selection.id) } catch { renderer.dispose(); throw new Error('Portrait color layers unavailable.') }
  }
  return renderer
}

class LayeredPortrait implements DialoguePortraitRenderer {
  readonly assetSource = 'illustrated' as const
  private native: ReturnType<typeof surface>
  private output = surface(PORTRAIT_SIZE, PORTRAIT_SIZE)
  private mask?: Uint8ClampedArray
  private tint?: { source: number[][]; target: number[][] }
  private cache = new Map<string, ImageData>()
  private disposed = false
  constructor(private bundle: Bundle) { this.native = surface(...bundle.manifest.size) }
  async color(subject: Extract<PortraitSubject,{kind:'actor'}>, id: string) {
    const mask = await loadImage(this.bundle.manifest.mask), { context } = this.native
    context.drawImage(mask, 0, 0); this.mask = context.getImageData(0, 0, ...this.bundle.manifest.size).data
    const original = gameAppearance(id === 'trail-rescuer' ? 'rescuer' : id)?.appearance ?? defaultAppearance()
    const roles = ['hair','skin','jacket','shirt'] as const
    this.tint = {
      source: [...roles.map(role => rgb(original.colors[role])),rgb(original.face.leftEye),rgb(original.face.rightEye)],
      target: [...roles.map(role => rgb(subject.appearance.colors[role])),rgb(subject.appearance.face.leftEye),rgb(subject.appearance.face.rightEye)]
    }
  }
  private paintColors(eyeState: string) {
    if (!this.mask || !this.tint) return
    const { context } = this.native, image = context.getImageData(0,0,...this.bundle.manifest.size)
    for (let i = 0; i < image.data.length; i += 4) {
      const role = this.mask[i] - 1
      if (role < 0 || role >= this.tint.source.length || image.data[i+3] < 240 || eyeState && role >= 4) continue
      const source = this.tint.source[role], target = this.tint.target[role]
      if (source.every((v,c) => v === target[c])) continue
      // Keep the authored value/texture; masks prevent tint leaking into contours.
      const light = image.data[i]*.299 + image.data[i+1]*.587 + image.data[i+2]*.114
      const reference = source[0]*.299 + source[1]*.587 + source[2]*.114
      const shade = Math.max(.4, Math.min(1.6, light / Math.max(1, reference)))
      target.forEach((value,c) => { image.data[i+c] = Math.min(255,Math.round(value*shade)) })
    }
    context.putImageData(image,0,0)
  }
  frame(index: number, view: PortraitView = defaultPortraitView) {
    if (this.disposed) throw new Error('Portrait has been closed.')
    index = ((Math.floor(index) % PORTRAIT_FRAMES) + PORTRAIT_FRAMES) % PORTRAIT_FRAMES
    const talking = view.talking || view.expression === 'talking'
    const blink = !view.steady && (index >= 26 && index <= 29 || index >= 68 && index <= 71)
    const eyes = view.expression === 'happy' ? 'happy' : blink ? ([26,29,68,71].includes(index) ? 'half' : 'closed') : ''
    const mouth = talking ? ['talk-a','','talk-o','happy','','talk-a'][Math.floor(index / 2) % 6]
      : view.expression === 'happy' ? 'happy' : view.expression === 'smile' ? 'smile' : ''
    const key = eyes + ':' + mouth, cached = this.cache.get(key); if (cached) return cached
    const { manifest, base, atlas } = this.bundle, { canvas, context } = this.native
    context.clearRect(0,0,canvas.width,canvas.height); context.drawImage(base,0,0)
    for (const [group,state] of [['eyes',eyes],['mouth',mouth]] as const) {
      const patch = manifest.layers[group][state]
      if (patch) context.drawImage(atlas,...patch.source,...patch.target)
    }
    this.paintColors(eyes)
    const output = this.output.context, scale = Math.floor(PORTRAIT_SIZE / Math.max(...manifest.size))
    const width=canvas.width*scale,height=canvas.height*scale
    output.clearRect(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE)
    output.drawImage(canvas,(PORTRAIT_SIZE-width)/2,PORTRAIT_SIZE-height,width,height)
    const result = output.getImageData(0,0,PORTRAIT_SIZE,PORTRAIT_SIZE)
    if (this.cache.size >= 12) this.cache.delete(this.cache.keys().next().value!)
    this.cache.set(key,result); return result
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; this.cache.clear(); this.mask = undefined; this.tint = undefined
    this.native.canvas.width = this.native.canvas.height = this.output.canvas.width = this.output.canvas.height = 0
  }
}
