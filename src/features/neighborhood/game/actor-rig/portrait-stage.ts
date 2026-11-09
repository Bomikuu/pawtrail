import * as T from 'three'

export const PORTRAIT_SIZE = 192
export const PORTRAIT_FPS = 12
export const PORTRAIT_FRAMES = 96
type Stage = { renderer: T.WebGLRenderer; context: CanvasRenderingContext2D; users: number }
let stage: Stage | undefined
let release: ReturnType<typeof setTimeout> | undefined
/** Human busts and cat portraits share one bounded off-screen GPU context. */
export function acquirePortraitStage() {
  clearTimeout(release)
  if (!stage) {
    const renderer = new T.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(1); renderer.setSize(PORTRAIT_SIZE, PORTRAIT_SIZE, false)
    renderer.setClearColor(0, 0); renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.NoToneMapping
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = PORTRAIT_SIZE
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) { renderer.dispose(); renderer.forceContextLoss(); throw new Error('Portrait rendering unavailable.') }
    stage = { renderer, context, users: 0 }
  }
  const shared = stage
  shared.users++
  let released = false
  return { ...shared, release() {
    if (released) return; released = true
    if (--shared.users === 0) release = setTimeout(() => {
      if (!shared.users) { shared.renderer.dispose(); shared.renderer.forceContextLoss(); if (stage === shared) stage = undefined }
    }, 1000)
  } }
}
