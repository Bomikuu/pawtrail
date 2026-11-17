import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import detail from './amber-detail-manifest.json'
import type { AmberComparisonController, AmberComparisonOptions } from './amber-representation-scene'

type LiveAsset = {
  sourceModel: string
  label?: string
  shadows?: boolean
  viewer?: { body: { height: number; target: number[]; offset: number[] }; face: { height: number; target: number[]; offset: number[] } }
}

/** Inspect the actual new GLB; camera zoom rerenders geometry, never a 64px sprite. */
export async function mountAmberPartsLive(host: HTMLElement, read: () => AmberComparisonOptions, failed: (message: string) => void, signal: AbortSignal, asset: LiveAsset = detail): Promise<AmberComparisonController> {
  let model: T.Group | undefined, renderer: T.WebGLRenderer | undefined, controls: OrbitControls | undefined, mixer: T.AnimationMixer | undefined
  let shadow: T.Mesh<T.BufferGeometry, T.MeshBasicMaterial | T.ShadowMaterial> | undefined
  let key: T.DirectionalLight | undefined
  let environment: T.WebGLRenderTarget | undefined
  let lost: ((event: Event) => void) | undefined
  let disposed = false, raf = 0, previous = 0, rendered = -Infinity, elapsed = 0, dirty = true, signature = '', actionName = ''
  const dispose = () => {
    if (disposed) return
    disposed = true; cancelAnimationFrame(raf); controls?.dispose(); mixer?.stopAllAction()
    if (model) {
      mixer?.uncacheRoot(model)
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>(), images = new Set<ImageBitmap>(), skeletons = new Set<T.Skeleton>()
      model.traverse(node => { if (node instanceof T.SkinnedMesh) skeletons.add(node.skeleton); if (node instanceof T.Mesh) { geometries.add(node.geometry); for (const material of Array.isArray(node.material) ? node.material : [node.material]) { materials.add(material); for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value) } } })
      geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose())
      textures.forEach(value => { if (typeof ImageBitmap !== 'undefined' && value.image instanceof ImageBitmap) images.add(value.image); value.dispose() }); images.forEach(value => value.close())
      skeletons.forEach(value => value.dispose())
    }
    if (lost) renderer?.domElement.removeEventListener('webglcontextlost', lost)
    environment?.dispose()
    renderer?.dispose(); renderer?.forceContextLoss(); renderer?.domElement.remove()
    shadow?.geometry.dispose(); shadow?.material.dispose()
    key?.shadow.map?.dispose()
  }
  try {
    const response = await fetch(asset.sourceModel, { signal })
    if (!response.ok) throw new Error('Amber’s detailed 3D model could not load. Retry the preview.')
    const gltf = await new GLTFLoader().parseAsync(await response.arrayBuffer(), '')
    model = gltf.scene; signal.throwIfAborted()
    const scene = new T.Scene(); scene.add(model)
    mixer = new T.AnimationMixer(model)
    const clips = new Map(gltf.animations.map(clip => [clip.name, clip]))
    const camera = new T.OrthographicCamera(-3.36, 3.36, 4.2, -4.2, .01, 100)
    renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
    renderer.setPixelRatio(1); renderer.setSize(512, 640, false); renderer.outputColorSpace = T.SRGBColorSpace
    renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2
    const canvas = renderer.domElement
    canvas.style.width = 64 * read().zoom + 'px'; canvas.style.height = 80 * read().zoom + 'px'
    canvas.style.imageRendering = 'auto'; canvas.className = 'block shrink-0 touch-none'
    canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${asset.label ?? 'Amber detailed 3D model'}. Drag to orbit, scroll to zoom.`)
    lost = event => { event.preventDefault(); dispose(); failed('The graphics connection was interrupted. Retry the 3D preview.') }
    canvas.addEventListener('webglcontextlost', lost)
    scene.add(new T.AmbientLight('#fff4e6', asset.shadows ? .75 : 1.1))
    key = new T.DirectionalLight('#fff0de', 2.3); key.position.set(-2, 3, 4); scene.add(key)
    scene.add(new T.HemisphereLight('#d4d8ee', '#6c4840', .65))
    if (asset.shadows) {
      // A small, shared image-based light source makes brass readable without
      // downloading an HDRI or introducing a postprocessing render loop.
      const room = new RoomEnvironment(), pmrem = new T.PMREMGenerator(renderer)
      try { environment = pmrem.fromScene(room, .04, .1, 10, { size: 64 }); scene.environment = environment.texture; scene.environmentIntensity = .4 }
      finally { room.dispose(); pmrem.dispose() }
      key.target.position.set(0, .9, 0); scene.add(key.target)
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap
      key.castShadow = true; key.shadow.mapSize.set(512, 512)
      Object.assign(key.shadow.camera, { left: -1.1, right: 1.1, top: 2, bottom: -.4, near: .1, far: 8 })
      key.shadow.bias = -.0002; key.shadow.normalBias = .004
      shadow = new T.Mesh(new T.PlaneGeometry(3, 3), new T.ShadowMaterial({ opacity: .2, depthWrite: false }))
      shadow.receiveShadow = true
      const maximum = Math.min(8, renderer.capabilities.getMaxAnisotropy())
      model.traverse(node => {
        if (!(node instanceof T.Mesh)) return
        node.castShadow = true; node.receiveShadow = true
        for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
          for (const value of Object.values(material)) if (value instanceof T.Texture) { value.anisotropy = maximum; value.needsUpdate = true }
        }
      })
    } else {
      shadow = new T.Mesh(new T.CircleGeometry(.35, 32), new T.MeshBasicMaterial({ color: '#49362e', transparent: true, opacity: .2, depthWrite: false }))
      shadow.scale.y = .5
    }
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = asset.shadows ? .001 : .015; scene.add(shadow)
    host.append(canvas)
    controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.minZoom = .5; controls.maxZoom = 5
    controls.addEventListener('change', () => { dirty = true })
    const setView = (options: AmberComparisonOptions) => {
      const face = options.focus === 'face', view = asset.viewer?.[face ? 'face' : 'body'], h = view?.height ?? (face ? 1.9 : 8.4)
      camera.left = -h * .4; camera.right = h * .4; camera.top = h / 2; camera.bottom = -h / 2
      camera.zoom = options.zoom / 4; camera.updateProjectionMatrix()
      const target = view?.target ?? [0, face ? 4.12 : 2.25, 0]
      const offset = view?.offset ?? [0, face ? 1.2 : 3.45, face ? 4 : 9]
      controls!.target.set(target[0], target[1], target[2])
      camera.position.set(target[0] + offset[0], target[1] + offset[1], target[2] + offset[2])
      camera.up.set(0, 1, 0)
      controls!.update(); dirty = true
    }
    setView(read())
    let focus = read().focus, zoom = read().zoom, direction = read().direction
    const tick = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(tick)
      if (document.hidden) { previous = 0; return }
      const options = read(), dt = previous ? Math.min(50, now - previous) : 0; previous = now
      if (!options.paused) elapsed += dt * options.speed
      const next = [options.action, options.direction, options.paused].join(':')
      if (signature !== next) { signature = next; dirty = true }
      if (focus !== options.focus || zoom !== options.zoom) { focus = options.focus; zoom = options.zoom; setView(options) }
      if (direction !== options.direction) { direction = options.direction; setView(options) }
      if (!dirty && (options.paused || now - rendered < 1000 / 30)) return
      try {
        if (actionName !== options.action) {
          const clip = clips.get(options.action)
          if (!clip) throw new Error(`The model has no ${options.action} animation.`)
          mixer!.stopAllAction(); mixer!.clipAction(clip).play(); actionName = options.action
        }
        mixer!.setTime(elapsed / 1000)
        model!.rotation.y = -['down', 'left', 'up', 'right'].indexOf(options.direction) * Math.PI / 2
        renderer!.render(scene, camera); dirty = false; rendered = now
      } catch (error) { dispose(); failed(error instanceof Error ? error.message : 'Amber’s 3D inspector stopped.') }
    }
    raf = requestAnimationFrame(tick)
    return { restart() { elapsed = 0; dirty = true }, resetCamera() { setView(read()) }, dispose }
  } catch (error) { dispose(); throw error }
}
