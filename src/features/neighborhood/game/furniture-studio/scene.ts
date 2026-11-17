import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createFurniture, furnitureCamera, type CouchStyle } from '../furniture/model'
import { PixelFinish } from '../actor-rig/pixel-renderer'
import { furnitureOutline } from '../furniture/pixel-outline'
import type { ModelPaintEvent, ModelPaintOptions } from '../skin-studio/painting'
import type { FurnitureAsset } from './catalog'
import type { FurnitureCanvases, FurnitureSurface } from './textures'
import { SofaPalette, SOFA_PALETTE_VIEWS } from '../furniture/sofa-palette'

/** Local models/materials only; the installed game catalog is never mutated. */
export class FurnitureStudioScene {
  readonly canvases: FurnitureCanvases = {}
  readonly surfaces: FurnitureSurface[] = []
  readonly display = document.createElement('canvas')
  private sofaPalette?: SofaPalette
  private coloredSprite?: HTMLCanvasElement
  private renderer?: T.WebGLRenderer
  private world = new T.Scene()
  private camera = furnitureCamera()
  private controls?: OrbitControls
  private model?: ReturnType<typeof createFurniture>
  private maps = new Map<string, T.CanvasTexture>()
  private originalPixels = new Map<string, Uint8ClampedArray>()
  private materials = new Set<T.Material>()
  private bindings = new Map<T.Mesh, string[]>()
  private observer?: ResizeObserver
  private visibility?: IntersectionObserver
  private events = new AbortController()
  private raf = 0
  private active = true
  private disposed = false
  private failed = false
  private dirty = true
  private previous = 0
  private elapsed = 0
  private lastRender = 0
  private playing = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  private facing = 0
  private paintOptions: ModelPaintOptions = { mode: 'orbit', tool: 'brush', brush: 1, readOnly: false }
  private pointer: number | null = null
  private temporaryOrbit = false
  private lastPointer: { x: number; y: number } | null = null
  private orbitStart: { x: number; y: number } | null = null
  private finish?: PixelFinish
  private readback = document.createElement('canvas')
  private overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  private rings = [document.createElementNS('http://www.w3.org/2000/svg', 'ellipse'), document.createElementNS('http://www.w3.org/2000/svg', 'ellipse')]

  static async create(host: HTMLElement, asset: FurnitureAsset, style: CouchStyle | undefined,
    onPick: (id: string, x: number, y: number) => void, onPaint: (event: ModelPaintEvent) => void,
    isCurrent: () => boolean, onError: (reason: unknown) => void) {
    let image: HTMLImageElement | undefined
    if (!asset.definition) {
      image = new Image()
      image.src = asset.file
      await image.decode()
      if (image.naturalWidth !== asset.width || image.naturalHeight !== asset.height)
        throw new Error('The sprite dimensions differ from the catalog. Refresh its asset metadata before editing.')
    }
    if (!isCurrent()) return null
    const scene = new FurnitureStudioScene(host, asset, onPick, onPaint, onError)
    try {
      if (asset.id === 'sofa') {
        const files = [...new Set(Object.values(SOFA_PALETTE_VIEWS).flatMap(view => [view.file, view.foreground]))]
        const images = new Map(await Promise.all(files.map(async file => {
          const source = new Image(); source.src = file; await source.decode(); return [file, source] as const
        })))
        if (!isCurrent()) { scene.dispose(); return null }
        scene.sofaPalette = new SofaPalette(images); scene.coloredSprite = document.createElement('canvas')
      }
      scene.initialize(style, image); scene.update(); return scene
    }
    catch (error) { scene.dispose(); throw error }
  }

  private constructor(private host: HTMLElement, readonly asset: FurnitureAsset,
    private onPick: (id: string, x: number, y: number) => void, private onPaint: (event: ModelPaintEvent) => void,
    private onError: (reason: unknown) => void) {}

  private initialize(style?: CouchStyle, image?: HTMLImageElement) {
    const frame = this.asset.definition?.frame ?? this.asset
    this.display.width = this.readback.width = frame.width
    this.display.height = this.readback.height = frame.height
    this.display.className = 'block shrink-0 touch-none [image-rendering:pixelated]'
    this.display.tabIndex = 0
    this.display.setAttribute('role', 'img')
    this.display.setAttribute('aria-label', this.asset.definition
      ? `${this.asset.label} live 3D preview. Drag to orbit; Paint mode edits its mapped surfaces.`
      : `${this.asset.label} live 2D sprite preview`)
    if (this.asset.definition && style) {
      this.model = createFurniture(this.asset.definition, style)
      this.bindMaterials()
      this.world.add(this.model.root)
      this.finish = new PixelFinish(this.model.palette)
      this.renderer = new T.WebGLRenderer({ alpha: true, antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false, powerPreference: 'low-power' })
      this.renderer.setPixelRatio(1)
      this.renderer.setSize(frame.width, frame.height, false)
      this.renderer.outputColorSpace = T.SRGBColorSpace
      this.renderer.toneMapping = T.NoToneMapping
      this.renderer.domElement.addEventListener('webglcontextlost', () => {
        if (!this.disposed) {
          this.failed = true
          cancelAnimationFrame(this.raf)
          this.onError(new Error('The 3D preview lost its graphics context. Retry to reopen this item.'))
        }
      }, { signal: this.events.signal })
      this.camera.copy(furnitureCamera(0, this.asset.definition))
      this.controls = new OrbitControls(this.camera, this.display)
      this.controls.enablePan = false
      this.controls.enableDamping = true
      this.controls.enableZoom = true
      this.controls.minZoom = .5
      this.controls.maxZoom = 3
      this.controls.touches.TWO = T.TOUCH.DOLLY_ROTATE
      this.controls.minPolarAngle = .12
      this.controls.maxPolarAngle = Math.PI * .85
      this.controls.mouseButtons.RIGHT = T.MOUSE.ROTATE
      this.controls.addEventListener('change', () => { this.dirty = true })
      this.paintEvents()
    } else if (image) {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      canvas.getContext('2d')!.drawImage(image, 0, 0)
      this.canvases.sprite = canvas
      this.surfaces.push({ id: 'sprite', label: 'Original sprite', width: canvas.width, height: canvas.height, meshes: [], kind: 'sprite' })
    }
    this.host.append(this.display)
    this.overlay.classList.add('pointer-events-none', 'absolute', 'inset-0', 'size-full', 'overflow-hidden')
    this.overlay.setAttribute('aria-hidden', 'true')
    this.rings.forEach((ring, index) => {
      ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', index ? '#ffffff' : '#171717')
      ring.setAttribute('stroke-width', index ? '1' : '3'); ring.setAttribute('vector-effect', 'non-scaling-stroke')
      this.overlay.append(ring)
    })
    this.overlay.style.display = 'none'
    this.host.append(this.overlay)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(this.host)
    this.visibility = new IntersectionObserver(([entry]) => { this.active = entry.isIntersecting; this.resume() })
    this.visibility.observe(this.host)
    document.addEventListener('visibilitychange', this.resume, { signal: this.events.signal })
    this.resize(); this.resume()
  }

  private bindMaterials() {
    const textures = new Map<T.Texture, string>(), colors = new Map<string, string>()
    this.model!.root.traverse(object => {
      if (!(object instanceof T.Mesh)) return
      const ids: string[] = []
      const bind = (source: T.Material) => {
        const original = source as T.MeshBasicMaterial, texture = original.map
        const color = original.color?.getHexString() ?? 'ffffff'
        let id = texture ? textures.get(texture) : colors.get(color)
        if (!id) {
          id = texture ? `texture-${textures.size + 1}` : `color-${color}`
          const canvas = document.createElement('canvas'), data = texture?.image
          if (data) {
            canvas.width = data.width; canvas.height = data.height
            if (!canvas.width || !canvas.height || canvas.width > 1024 || canvas.height > 1024)
              throw new Error('A furniture texture has unsupported dimensions.')
            if (data.data) {
              if (!(data.data instanceof Uint8Array || data.data instanceof Uint8ClampedArray) || data.data.length !== canvas.width * canvas.height * 4)
                throw new Error('This texture format needs a native RGBA export before editing.')
              canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data.data), canvas.width, canvas.height), 0, 0)
            } else canvas.getContext('2d')!.drawImage(data as CanvasImageSource, 0, 0)
          } else {
            canvas.width = canvas.height = 1
            canvas.getContext('2d')!.fillStyle = '#' + color
            canvas.getContext('2d')!.fillRect(0, 0, 1, 1)
          }
          const map = new T.CanvasTexture(canvas)
          // Do not clone a DataTexture class around a canvas: WebGL would still expect image.data.
          if (texture) { map.copy(texture); map.source = new T.Source(canvas) }
          map.colorSpace = T.SRGBColorSpace
          map.magFilter = map.minFilter = T.NearestFilter
          map.generateMipmaps = false
          map.needsUpdate = true
          this.maps.set(id, map); this.canvases[id] = canvas
          this.originalPixels.set(id, canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data)
          this.surfaces.push({ id, label: texture ? object.name || `Texture ${textures.size + 1}` : `Solid color · #${color}`,
            width: canvas.width, height: canvas.height, meshes: [], kind: texture ? 'texture' : 'color' })
          if (texture) textures.set(texture, id); else colors.set(color, id)
        }
        ids.push(id)
        const row = this.surfaces.find(row => row.id === id)!
        if (!row.meshes.includes(object.name)) row.meshes.push(object.name || 'Unnamed surface')
        const copy = original.clone()
        copy.map = this.maps.get(id)!
        if (!texture) copy.color.set('#ffffff')
        this.materials.add(copy)
        return copy
      }
      object.material = Array.isArray(object.material) ? object.material.map(bind) : bind(object.material)
      this.bindings.set(object, ids)
    })
  }

  private pick(x: number, y: number) {
    if (!this.model) return null
    const rect = this.display.getBoundingClientRect()
    if (!rect.width || !rect.height || x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null
    this.camera.updateMatrixWorld(true); this.model.root.updateMatrixWorld(true)
    const ray = new T.Raycaster()
    ray.setFromCamera(new T.Vector2((x - rect.left) / rect.width * 2 - 1, 1 - (y - rect.top) / rect.height * 2), this.camera)
    for (const intersection of ray.intersectObject(this.model.root, true)) {
      let node: T.Object3D | null = intersection.object, visible = true
      while (node) { if (!node.visible) visible = false; node = node.parent }
      if (!visible) continue
      const mesh = intersection.object as T.Mesh, slot = intersection.face?.materialIndex ?? 0
      const id = this.bindings.get(mesh)?.[slot]
      if (!id || !intersection.uv) continue
      const uv = intersection.uv.clone(), map = this.maps.get(id)!, canvas = this.canvases[id]
      map.updateMatrix(); map.transformUv(uv)
      const hit = { part: id, x: T.MathUtils.clamp(Math.floor(uv.x * canvas.width), 0, canvas.width - 1), y: T.MathUtils.clamp(Math.floor(uv.y * canvas.height), 0, canvas.height - 1) }
      const material = (Array.isArray(mesh.material) ? mesh.material[slot] : mesh.material) as T.MeshBasicMaterial
      if (material.alphaTest && canvas.getContext('2d')!.getImageData(hit.x, hit.y, 1, 1).data[3] / 255 < material.alphaTest) continue
      return { hit, intersection, uv }
    }
    return null
  }

  private paintEvents() {
    const options = { signal: this.events.signal, capture: true }
    this.display.addEventListener('contextmenu', event => event.preventDefault(), options)
    this.display.addEventListener('wheel', event => {
      event.stopImmediatePropagation()
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault(); this.zoomBy(Math.exp(-T.MathUtils.clamp(event.deltaY, -120, 120) * .006))
    }, { ...options, passive: false })
    this.display.addEventListener('pointerdown', event => {
      this.display.focus({ preventScroll: true })
      if (this.pointer !== null) { event.stopImmediatePropagation(); return }
      if (event.button === 0 && this.paintOptions.mode === 'paint' && !this.temporaryOrbit) {
        event.preventDefault(); event.stopImmediatePropagation()
        if (this.paintOptions.readOnly) return
        const target = this.pick(event.clientX, event.clientY)
        if (!target) return
        this.pointer = event.pointerId; this.lastPointer = { x: event.clientX, y: event.clientY }
        this.controls!.enabled = false; this.display.setPointerCapture(event.pointerId)
        this.onPaint({ phase: 'start', hits: [target.hit] })
      } else this.orbitStart = { x: event.clientX, y: event.clientY }
    }, options)
    this.display.addEventListener('pointermove', event => {
      if (this.pointer === event.pointerId) {
        event.preventDefault(); event.stopImmediatePropagation()
        const before = this.lastPointer!, steps = Math.min(128, Math.max(1, Math.ceil(Math.hypot(event.clientX - before.x, event.clientY - before.y))))
        const hits: ModelPaintEvent['hits'] = [], seen = new Set<string>()
        for (let index = 1; index <= steps; index++) {
          const target = this.pick(before.x + (event.clientX - before.x) * index / steps, before.y + (event.clientY - before.y) * index / steps)
          if (target) { const key = `${target.hit.part}:${target.hit.x}:${target.hit.y}`; if (!seen.has(key)) { seen.add(key); hits.push(target.hit) } }
        }
        this.lastPointer = { x: event.clientX, y: event.clientY }
        if (hits.length) this.onPaint({ phase: 'move', hits })
      }
      const target = this.pick(event.clientX, event.clientY)
      if (target && this.paintOptions.mode === 'paint' && !this.paintOptions.readOnly && !this.temporaryOrbit) this.showBrush(target, event.clientX, event.clientY)
      else this.hideBrush()
    }, options)
    this.display.addEventListener('pointerup', event => {
      if (this.pointer === event.pointerId) { event.stopImmediatePropagation(); this.cancelPaint(); return }
      if (event.button === 0 && this.orbitStart && Math.hypot(event.clientX - this.orbitStart.x, event.clientY - this.orbitStart.y) < 5) {
        const target = this.pick(event.clientX, event.clientY)
        if (target) this.onPick(target.hit.part, target.hit.x, target.hit.y)
      }
      this.orbitStart = null
    }, options)
    this.display.addEventListener('pointercancel', () => this.cancelPaint(), options)
    this.display.addEventListener('lostpointercapture', () => this.cancelPaint(), options)
    this.display.addEventListener('pointerleave', () => this.hideBrush(), options)
    window.addEventListener('blur', () => this.setTemporaryOrbit(false), options)
  }

  private showBrush(target: NonNullable<ReturnType<FurnitureStudioScene['pick']>>, x: number, y: number) {
    if (this.paintOptions.tool === 'pick' || this.paintOptions.tool === 'fill') { this.hideBrush(); return }
    const { intersection, hit, uv } = target, mesh = intersection.object as T.Mesh, face = intersection.face!
    const points = mesh.geometry.getAttribute('position'), coords = mesh.geometry.getAttribute('uv'), canvas = this.canvases[hit.part]
    const rect = this.display.getBoundingClientRect(), host = this.host.getBoundingClientRect()
    const [a, b, c] = [face.a, face.b, face.c].map(index => {
      const p = new T.Vector3().fromBufferAttribute(points, index).applyMatrix4(mesh.matrixWorld).project(this.camera)
      const q = new T.Vector2(coords.getX(index), coords.getY(index)); this.maps.get(hit.part)!.transformUv(q)
      return { x: p.x * rect.width / 2, y: -p.y * rect.height / 2, u: q.x * canvas.width, v: q.y * canvas.height }
    })
    const du = b.u - a.u, dv = b.v - a.v, eu = c.u - a.u, ev = c.v - a.v, det = du * ev - eu * dv
    if (Math.abs(det) < 1e-6) { this.hideBrush(); return }
    const j00 = ((b.x - a.x) * ev - (c.x - a.x) * dv) / det, j10 = ((b.y - a.y) * ev - (c.y - a.y) * dv) / det
    const j01 = ((c.x - a.x) * du - (b.x - a.x) * eu) / det, j11 = ((c.y - a.y) * du - (b.y - a.y) * eu) / det
    const parity = this.paintOptions.brush % 2 ? .5 : 0, dx = hit.x + parity - uv.x * canvas.width, dy = hit.y + parity - uv.y * canvas.height
    for (const ring of this.rings) {
      ring.setAttribute('rx', String(this.paintOptions.brush / 2)); ring.setAttribute('ry', String(this.paintOptions.brush / 2))
      ring.setAttribute('transform', `matrix(${j00} ${j10} ${j01} ${j11} ${x - host.left + j00 * dx + j01 * dy} ${y - host.top + j10 * dx + j11 * dy})`)
    }
    this.overlay.style.display = 'block'; this.display.style.cursor = 'none'
  }
  private hideBrush() { this.overlay.style.display = 'none'; this.display.style.cursor = this.paintOptions.mode === 'paint' ? 'crosshair' : 'grab' }
  setPaintOptions(options: ModelPaintOptions) { this.cancelPaint(); this.paintOptions = options; this.hideBrush() }
  setTemporaryOrbit(active: boolean) { this.cancelPaint(); this.temporaryOrbit = active }
  cancelPaint() {
    const pointer = this.pointer
    this.pointer = null; this.lastPointer = null; this.hideBrush()
    if (this.controls) this.controls.enabled = true
    if (pointer !== null) {
      if (this.display.hasPointerCapture(pointer)) this.display.releasePointerCapture(pointer)
      this.onPaint({ phase: 'end', hits: [] })
    }
  }
  update(id?: string) {
    if (this.sofaPalette && this.coloredSprite) this.sofaPalette.recolorSurface(SOFA_PALETTE_VIEWS['0'].file, this.canvases.sprite, this.coloredSprite)
    for (const [key, map] of this.maps) if (!id || key === id) map.needsUpdate = true
    if (this.model && (!this.model.preservePaint || this.asset.definition?.model === 'couch')) {
      const colors = new Set<string>(this.model.palette)
      const limit = colors.size + 128
      for (const [key, canvas] of Object.entries(this.canvases)) {
        const data = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
        const baseline = this.originalPixels.get(key)!
        for (let index = 0; index < data.length && colors.size < limit; index += 4)
          if (data[index + 3] && [0, 1, 2].some(offset => data[index + offset] !== baseline[index + offset]))
            colors.add('#' + [0, 1, 2].map(offset => data[index + offset].toString(16).padStart(2, '0')).join(''))
      }
      this.finish = new PixelFinish([...colors])
    }
    this.dirty = true
  }
  drawUV(id: string, context: CanvasRenderingContext2D) {
    const canvas = this.canvases[id], map = this.maps.get(id)
    if (!canvas || !map) return
    map.updateMatrix(); context.save(); context.strokeStyle = '#ffd56b'; context.lineWidth = .5; context.globalAlpha = .65; context.beginPath()
    for (const [mesh, ids] of this.bindings) {
      if (!ids.includes(id)) continue
      const geometry = mesh.geometry, uv = geometry.getAttribute('uv'), indices = geometry.index
      if (!uv) continue
      for (let start = 0; start < (indices?.count ?? uv.count); start += 3) {
        const group = geometry.groups.find(row => start >= row.start && start < row.start + row.count)
        if (ids[group?.materialIndex ?? 0] !== id) continue
        for (let corner = 0; corner < 4; corner++) {
          const vertex = indices ? indices.getX(start + corner % 3) : start + corner % 3
          const point = new T.Vector2(uv.getX(vertex), uv.getY(vertex)); map.transformUv(point)
          if (!corner) context.moveTo(point.x * canvas.width, point.y * canvas.height)
          else context.lineTo(point.x * canvas.width, point.y * canvas.height)
        }
      }
    }
    context.stroke(); context.restore()
  }
  setPlaying(playing: boolean) { this.playing = playing; if (!playing) this.elapsed = 0; this.dirty = true }
  surface(id: string) { return id === 'sprite' && this.coloredSprite ? this.coloredSprite : this.canvases[id] }
  setUpholsteryColor(color: string) { this.sofaPalette?.setColor(color); this.update() }
  view(facing = 0) {
    if (this.sofaPalette) { this.facing = facing; this.dirty = true; return }
    if (!this.model) return
    this.cancelPaint(); this.facing = facing
    this.model.root.rotation.y = -facing * Math.PI / 180
    this.camera.copy(furnitureCamera(facing, this.asset.definition)); this.camera.updateProjectionMatrix()
    this.controls!.target.set(0, 0, 0); this.controls!.update(); this.dirty = true
  }
  rotate() { this.view((this.facing + 90) % 360); return this.facing }
  zoomBy(factor: number) { this.cancelPaint(); this.camera.zoom = T.MathUtils.clamp(this.camera.zoom * factor, .5, 3); this.camera.updateProjectionMatrix(); this.dirty = true }
  private resize() {
    if (this.disposed) return
    const scale = Math.max(1, Math.floor(Math.min(this.host.clientWidth / this.display.width, this.host.clientHeight / this.display.height)))
    this.display.style.width = this.display.width * scale + 'px'; this.display.style.height = this.display.height * scale + 'px'
    this.overlay.setAttribute('viewBox', `0 0 ${this.host.clientWidth} ${this.host.clientHeight}`); this.hideBrush(); this.dirty = true
  }
  private resume = () => {
    cancelAnimationFrame(this.raf); this.previous = 0
    if (this.disposed || this.failed || !this.active || document.hidden) return
    const tick = (now: number) => {
      if (this.playing && this.pointer === null && this.previous) this.elapsed += Math.min(100, now - this.previous) / 1000
      this.previous = now
      if (this.pointer === null) this.controls?.update()
      try {
        if ((this.dirty || this.model && this.playing) && now - this.lastRender >= 80) {
          this.lastRender = now
          const context = this.display.getContext('2d')!
          context.clearRect(0, 0, this.display.width, this.display.height)
          if (this.renderer && this.model) {
            const phase = Math.floor((this.elapsed % 4) / 4 * 9) / 9
            this.model.animate(phase, this.playing ? Math.sin(this.elapsed * 3) * .6 : 0)
            this.renderer.render(this.world, this.camera)
            const read = this.readback.getContext('2d', { willReadFrequently: true })!
            read.clearRect(0, 0, this.display.width, this.display.height); read.drawImage(this.renderer.domElement, 0, 0)
            const pixels = read.getImageData(0, 0, this.display.width, this.display.height)
            context.putImageData(this.model.preservePaint && this.asset.definition?.model !== 'couch' ? furnitureOutline(pixels) : this.finish!.finish(pixels), 0, 0)
          } else if (this.sofaPalette && this.facing) {
            const view = SOFA_PALETTE_VIEWS[String(this.facing) as keyof typeof SOFA_PALETTE_VIEWS]
            context.drawImage(this.sofaPalette.image(view.file)!, 0, 0)
          } else context.drawImage(this.surface('sprite'), 0, 0)
          this.dirty = false
        }
      } catch (reason) {
        this.failed = true
        this.onError(reason)
        return
      }
      this.raf = requestAnimationFrame(tick)
    }
    this.raf = requestAnimationFrame(tick)
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true; cancelAnimationFrame(this.raf); this.events.abort(); this.observer?.disconnect(); this.visibility?.disconnect()
    this.controls?.dispose(); this.model?.dispose()
    this.sofaPalette?.dispose()
    for (const map of this.maps.values()) map.dispose()
    for (const material of this.materials) material.dispose()
    this.renderer?.dispose(); this.display.remove(); this.overlay.remove()
  }
}
