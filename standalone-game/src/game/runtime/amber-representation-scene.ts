import type * as Three from 'three'
import type { Rig } from '../actor-rig/rigs'
import type { PixelFinish } from '../actor-rig/pixel-finish'
import native from '../../../assets/actor-appearances/amber-native-2d-v1/manifest.json'
import baked from '../../../assets/actor-appearances/amber-parts-baked-v1/manifest.json'
import anime from './amber-anime-manifest.json'

export type AmberRepresentation = 'full-3d' | 'painted-3d' | 'native-2d' | 'parts-baked' | 'parts-live' | 'anime-3d'
export type AmberComparisonOptions = { action: 'idle' | 'walk' | 'run'; direction: 'down' | 'left' | 'up' | 'right'; paused: boolean; zoom: number; speed: number; focus?: 'body' | 'face'; bakeQuality?: 'hd' | 'native' }
export type AmberComparisonController = { restart(): void; resetCamera?(): void; dispose(): void }

function loadImage(url: string, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const clean = () => { image.onload = null; image.onerror = null; signal.removeEventListener('abort', abort) }
    const abort = () => { clean(); image.src = ''; reject(new DOMException('Preview cancelled', 'AbortError')) }
    image.onload = () => { clean(); resolve(image) }
    image.onerror = () => { clean(); reject(new Error('Amber’s sprite atlas could not load. Retry the preview.')) }
    if (signal.aborted) { abort(); return }
    signal.addEventListener('abort', abort, { once: true }); image.src = url
  })
}

/** One selected presentation. Native 2D never creates a rig or WebGL renderer. */
export async function mountAmberRepresentation(host: HTMLElement, mode: AmberRepresentation, read: () => AmberComparisonOptions, failed: (message: string) => void, signal: AbortSignal, notify: (message: string) => void = () => {}): Promise<AmberComparisonController> {
  if (mode === 'parts-baked' && read().bakeQuality !== 'native') return (await import('./amber-hd-baked')).mountAmberHD(host, read, failed, signal, notify)
  if (mode === 'parts-live') return (await import('./amber-parts-live')).mountAmberPartsLive(host, read, failed, signal)
  if (mode === 'anime-3d') return (await import('./amber-parts-live')).mountAmberPartsLive(host, read, failed, signal, { ...anime, label: 'Amber anime 3D model', shadows: true })
  const canvas = document.createElement('canvas'), raw = document.createElement('canvas')
  const sheet = mode === 'parts-baked' ? baked : native
  const density = mode === 'full-3d' ? 4 : 1
  canvas.width = sheet.frameWidth * density; canvas.height = sheet.frameHeight * density
  canvas.style.imageRendering = mode === 'full-3d' ? 'auto' : 'pixelated'
  canvas.className = 'block shrink-0'
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `Amber ${mode} animation comparison`)
  const output = canvas.getContext('2d')!
  let renderer: Three.WebGLRenderer | undefined, rig: Rig | undefined, scene: Three.Scene | undefined, camera: Three.Camera | undefined
  let finish: PixelFinish | undefined, frameOutput: ImageData | undefined, image: HTMLImageElement | undefined
  let disposeActor: ((rig: Rig) => void) | undefined
  let rawContext: CanvasRenderingContext2D | undefined
  let disposed = false, raf = 0, previous = 0, rendered = -Infinity, elapsed = 0, lastSignature = ''
  const dispose = () => {
    if (disposed) return
    disposed = true; cancelAnimationFrame(raf)
    if (rig) disposeActor?.(rig)
    renderer?.dispose(); renderer?.forceContextLoss(); canvas.remove()
    image = undefined; finish = undefined; frameOutput = undefined
  }
  try {
    if (mode === 'native-2d' || mode === 'parts-baked') image = await loadImage(sheet.url, signal)
    else {
      const [T, models, state, rigTools, stage, pixels] = await Promise.all([
        import('three'), import('../creator/preview-models'), import('../creator/state'),
        import('../actor-rig/rigs'), import('../actor-rig/pixel-stage'), import('../actor-rig/pixel-finish'),
      ])
      signal.throwIfAborted(); await models.prepareCreatorModel('amber'); signal.throwIfAborted()
      const appearance = state.creatorTemplates.find(row => row.id === 'amber-outrider')!.appearance
      disposeActor = rigTools.disposeRig
      rig = models.creatorModelFactory('amber')!(appearance)
      scene = new T.Scene(); scene.add(rig.root); camera = stage.createActorCamera()
      if (mode === 'full-3d') {
        // Identity maps (especially eyes/face) remain textures on real geometry.
        // Transfer their ownership to one lit material per original material.
        const replacements = new Map<Three.Material, Three.MeshStandardMaterial>()
        const lit = (original: Three.Material) => {
          let material = replacements.get(original)
          if (!material) {
            const source = original as Three.MeshBasicMaterial
            material = new T.MeshStandardMaterial({ color: source.color?.clone() ?? new T.Color('#ffffff'), map: source.map ?? null, vertexColors: source.vertexColors, side: source.side, transparent: source.transparent, opacity: source.opacity, alphaTest: source.alphaTest, roughness: .76, metalness: 0 })
            replacements.set(original, material)
          }
          return material
        }
        rig.root.traverse(node => { if (node instanceof T.Mesh) node.material = Array.isArray(node.material) ? node.material.map(lit) : lit(node.material) })
        replacements.forEach((_value, original) => original.dispose())
        scene.add(new T.AmbientLight('#e9e1f2', .9))
        const light = new T.DirectionalLight('#fff0d2', 2.4); light.position.set(-40, 65, 70); scene.add(light)
        scene.add(new T.HemisphereLight('#d7dbf6', '#5b4141', .6))
      }
      renderer = new T.WebGLRenderer({ alpha: true, antialias: mode === 'full-3d', preserveDrawingBuffer: true, powerPreference: 'low-power' })
      stage.configureActorRenderer(renderer); renderer.setSize(canvas.width, canvas.height, false)
      if (mode === 'full-3d') { renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1 }
      else {
        finish = new pixels.PixelFinish(rigTools.appearancePalette(appearance))
        raw.width = native.frameWidth; raw.height = native.frameHeight
        rawContext = raw.getContext('2d', { willReadFrequently: true })!
        frameOutput = new ImageData(native.frameWidth, native.frameHeight)
      }
    }
    signal.throwIfAborted(); host.append(canvas)
    const tick = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(tick)
      if (document.hidden) { previous = 0; return }
      const options = read(), dt = previous ? Math.min(50, now - previous) : 0; previous = now
      if (!options.paused) elapsed += dt * options.speed
      const bakedClip = baked.clips[options.action][options.direction]
      const duration = mode === 'parts-baked' ? bakedClip.durationMs : options.action === 'idle' ? 2500 : options.action === 'walk' ? 800 : 500
      const phase = elapsed % duration / duration
      const sample = mode === 'parts-baked' ? Math.floor(phase * bakedClip.frames) : options.action === 'idle' ? (phase > .86 && phase < .91 ? 1 : 0) : Math.floor(phase * native.strideFrames)
      const signature = [options.action, options.direction, options.paused, options.zoom, image ? sample : Math.floor(elapsed / (1000 / 30))].join(':')
      if (signature === lastSignature || now - rendered < 1000 / 30) return
      lastSignature = signature; rendered = now
      canvas.style.width = sheet.frameWidth * options.zoom + 'px'; canvas.style.height = sheet.frameHeight * options.zoom + 'px'
      try {
        output.clearRect(0, 0, canvas.width, canvas.height)
        output.save(); output.scale(density, density)
        output.fillStyle = 'rgba(52, 39, 31, .2)'; output.beginPath(); output.ellipse(native.groundPixel.x, native.groundPixel.y + 1, 8.5, 2, 0, 0, Math.PI * 2); output.fill(); output.restore()
        output.imageSmoothingEnabled = mode === 'full-3d'
        if (image) {
          const frame = mode === 'parts-baked' ? bakedClip.start + sample : native.directions.indexOf(options.direction) * native.columns + (options.action === 'idle' ? sample : native.idleFrames + sample)
          output.drawImage(image, frame % sheet.columns * sheet.frameWidth, Math.floor(frame / sheet.columns) * sheet.frameHeight, sheet.frameWidth, sheet.frameHeight, 0, 0, canvas.width, canvas.height)
        } else if (rig && renderer && scene && camera) {
          rig.pose(options.action, phase, { locomotionPhase: phase, gait: options.action === 'run' ? 'run' : 'walk', secondaryMotion: { phase: elapsed % 2400 / 2400, locomotion: options.action === 'idle' ? 0 : options.action === 'run' ? 1.25 : 1 } })
          rig.root.rotation.y = -['down', 'left', 'up', 'right'].indexOf(options.direction) * Math.PI / 2
          renderer.render(scene, camera)
          if (finish && rawContext && frameOutput) {
            rawContext.clearRect(0, 0, raw.width, raw.height); rawContext.drawImage(renderer.domElement, 0, 0)
            finish.finishInto(rawContext.getImageData(0, 0, raw.width, raw.height), frameOutput, 1, true)
            rawContext.putImageData(frameOutput, 0, 0); output.drawImage(raw, 0, 0)
          } else output.drawImage(renderer.domElement, 0, 0)
        }
      } catch (error) { dispose(); failed(error instanceof Error ? error.message : 'Amber’s comparison stopped. Retry the preview.') }
    }
    raf = requestAnimationFrame(tick)
    return { restart() { elapsed = 0; lastSignature = ''; rendered = -Infinity }, dispose }
  } catch (error) { dispose(); throw error }
}
