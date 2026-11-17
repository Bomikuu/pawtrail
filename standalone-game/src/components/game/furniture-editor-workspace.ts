import { useEffect, useRef, useState } from 'react'
import { furnitureAssets, furnitureDraftKey } from '@/game/furniture-studio/catalog'
import { copySurface, furniturePackage, parseFurniturePackage, restoreFurniturePackage, FURNITURE_SAVE_PREFIX, type FurnitureCanvases, type FurnitureSurface } from '@/game/furniture-studio/textures'
import type { FurnitureStudioScene } from '@/game/furniture-studio/scene'
import { floodFill, stampRound, type ModelPaintEvent, type PaintTool } from '@/game/skin-studio/painting'
import { readSofaColor, saveSofaColor } from '@/game/furniture/sofa-color-preference'
import { SOFA_DEFAULT_COLOR } from '@/game/furniture/palette-color'

type History = { undo: ImageData[]; redo: ImageData[] }
type Session = {
  scene: FurnitureStudioScene
  key: string
  originals: FurnitureCanvases
  history: Record<string, History>
  dirty: boolean
}
type Draft = { canvases: FurnitureCanvases; dirty: boolean }
// Keep device-session work across editor → comparison/setup → editor navigation.
const sessionDrafts = new Map<string, Draft>()

export function useFurnitureEditor() {
  const [assetId, setAssetId] = useState(() => {
    const id = new URLSearchParams(window.location.search).get('asset')
    return furnitureAssets.find(asset => asset.id === id)?.id ?? 'studio-couch'
  })
  const asset = furnitureAssets.find(asset => asset.id === assetId)!
  const [styleId, setStyleId] = useState(asset.definition?.styles[0].id ?? 'sprite')
  const style = asset.definition?.styles.find(style => style.id === styleId) ?? asset.definition?.styles[0]
  const host = useRef<HTMLDivElement>(null), session = useRef<Session | null>(null)
  const drafts = useRef(sessionDrafts), generation = useRef(0), importRequest = useRef(0)
  const [surfaces, setSurfaces] = useState<FurnitureSurface[]>([]), [part, setPart] = useState('')
  const [ready, setReady] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('Choose an item, then a surface to paint.')
  const [revision, setRevision] = useState(0), [dirty, setDirty] = useState(false), [retry, setRetry] = useState(0)
  const [upholsteryColor, setUpholstery] = useState<string | undefined>()
  const [tool, setTool] = useState<PaintTool>('brush'), [color, setColor] = useState('#c84a35'), [brush, setBrush] = useState(1)
  const [modelMode, setModelMode] = useState<'orbit' | 'paint'>('orbit'), [original, setOriginal] = useState(false)
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null), [facing, setFacing] = useState(0)
  const paintRef = useRef<(event: ModelPaintEvent) => void>(() => {})
  const touched = useRef(new Set<string>()), filled = useRef(new Set<string>())
  const settings = useRef({ tool, color, brush, original, ready })
  settings.current = { tool, color, brush, original, ready }

  const remember = () => {
    const current = session.current
    if (!current) return
    drafts.current.set(current.key, { canvases: Object.fromEntries(Object.entries(current.scene.canvases).map(([id, canvas]) => [id, copySurface(canvas)])), dirty: current.dirty })
  }
  useEffect(() => {
    const target = host.current
    if (!target) return
    const ticket = ++generation.current
    let cancelled = false, instance: FurnitureStudioScene | null = null
    const isCurrent = () => !cancelled && generation.current === ticket
    setReady(false); setDirty(false); setError(''); setSurfaces([]); setPart(''); setOriginal(false); setCursor(null); setFacing(0); setUpholstery(undefined)
    touched.current.clear(); filled.current.clear(); session.current = null
    import('@/game/furniture-studio/scene').then(async ({ FurnitureStudioScene }) => {
      instance = await FurnitureStudioScene.create(target, asset, style, (id, x, y) => {
        setPart(id); setCursor({ x, y }); setOriginal(false)
        setNotice('Selected the surface under the pointer.')
      }, event => paintRef.current(event), isCurrent, reason => {
        if (isCurrent()) {
          setReady(false)
          setError(reason instanceof Error ? reason.message : 'The model preview was interrupted. Retry to reopen it.')
        }
      })
      if (!instance || !isCurrent()) { instance?.dispose(); return }
      const key = furnitureDraftKey(asset, styleId), canvases = instance.canvases
      const originals = Object.fromEntries(Object.entries(canvases).map(([id, canvas]) => [id, copySurface(canvas)]))
      const cached = drafts.current.get(key)
      if (cached) for (const [id, canvas] of Object.entries(canvases)) {
        const previous = cached.canvases[id]
        if (!previous || previous.width !== canvas.width || previous.height !== canvas.height) continue
        const context = canvas.getContext('2d')!
        context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(previous, 0, 0)
      }
      session.current = { scene: instance, key, originals, dirty: cached?.dirty ?? false,
        history: Object.fromEntries(instance.surfaces.map(row => [row.id, { undo: [], redo: [] }])) }
      instance.update()
      if (asset.id === 'sofa') { const color = readSofaColor(); instance.setUpholsteryColor(color); setUpholstery(color) }
      setSurfaces(instance.surfaces); setPart(instance.surfaces[0]?.id ?? ''); setDirty(cached?.dirty ?? false)
      setRevision(value => value + 1); setReady(true)
      setNotice(cached ? 'Restored this item’s session draft.' : asset.definition ? 'Paint a texture or click the model to select its surface.' : 'This item uses a 2D sprite. Its original artwork is editable here.')
    }).catch(reason => {
      instance?.dispose()
      if (isCurrent()) { session.current = null; setError(reason instanceof Error ? reason.message : 'The furniture could not load. Choose another item or retry.') }
    })
    return () => {
      cancelled = true; importRequest.current++
      if (session.current?.scene === instance) { remember(); session.current = null }
      instance?.dispose()
    }
  }, [asset.id, styleId, retry])
  useEffect(() => { session.current?.scene.setPlaying(playing) }, [playing, ready])
  useEffect(() => {
    session.current?.scene.setPaintOptions({ mode: modelMode, tool, brush, readOnly: original })
  }, [modelMode, tool, brush, original, ready])

  const selectAsset = (id: string) => {
    if (id === assetId) return
    remember(); session.current?.scene.cancelPaint()
    const next = furnitureAssets.find(row => row.id === id)
    if (!next) return
    setAssetId(id); setStyleId(next.definition?.styles[0].id ?? 'sprite')
    const url = new URL(window.location.href); url.searchParams.set('asset', id)
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
  const selectStyle = (id: string) => {
    if (id === styleId) return
    remember(); session.current?.scene.cancelPaint(); setStyleId(id)
  }
  const selectPart = (id: string) => { session.current?.scene.cancelPaint(); setPart(id); setOriginal(false); setCursor(null) }
  const changed = (ids: Iterable<string>) => {
    const current = session.current
    if (!current) return
    for (const id of ids) current.scene.update(id)
    current.dirty = true; setDirty(true); setRevision(value => value + 1); setNotice('Unsaved texture changes')
  }
  const snapshot = (id: string) => {
    const current = session.current!, canvas = current.scene.canvases[id], history = current.history[id]
    history.undo.push(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height))
    if (history.undo.length > 24) history.undo.shift()
    history.redo = []
  }
  paintRef.current = event => {
    if (event.phase === 'end') { touched.current.clear(); filled.current.clear(); return }
    if (event.phase === 'start') { touched.current.clear(); filled.current.clear() }
    const current = session.current, s = settings.current
    if (!current || !s.ready || s.original) return
    const updated = new Set<string>()
    for (const hit of event.hits) {
      const canvas = current.scene.canvases[hit.part]
      if (!canvas || hit.x < 0 || hit.y < 0 || hit.x >= canvas.width || hit.y >= canvas.height) continue
      setPart(hit.part); setCursor({ x: hit.x, y: hit.y })
      if (s.tool === 'pick') {
        const pixel = current.scene.surface(hit.part).getContext('2d')!.getImageData(hit.x, hit.y, 1, 1).data
        if (pixel[3]) setColor('#' + [0, 1, 2].map(offset => pixel[offset].toString(16).padStart(2, '0')).join(''))
        continue
      }
      if (s.tool === 'fill' && filled.current.has(hit.part)) continue
      if (!touched.current.has(hit.part)) { snapshot(hit.part); touched.current.add(hit.part) }
      if (s.tool === 'fill') { floodFill(canvas, hit.x, hit.y, s.color); filled.current.add(hit.part) }
      else stampRound(canvas, current.originals[hit.part], hit.x, hit.y, s.brush, s.tool === 'eraser' ? null : s.color)
      updated.add(hit.part)
    }
    if (updated.size) changed(updated)
  }
  const paint = (event: ModelPaintEvent) => paintRef.current(event)
  const undo = (redo = false) => {
    const current = session.current, canvas = current?.scene.canvases[part], history = current?.history[part]
    if (!current || !canvas || !history) return
    current.scene.cancelPaint()
    const from = redo ? history.redo : history.undo, to = redo ? history.undo : history.redo, pixels = from.pop()
    if (!pixels) return
    const context = canvas.getContext('2d')!
    to.push(context.getImageData(0, 0, canvas.width, canvas.height)); context.putImageData(pixels, 0, 0)
    setOriginal(false); changed([part])
  }
  const reset = () => {
    const current = session.current, canvas = current?.scene.canvases[part]
    if (!current || !canvas) return
    current.scene.cancelPaint(); snapshot(part)
    const context = canvas.getContext('2d')!
    context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(current.originals[part], 0, 0)
    setOriginal(false); changed([part])
  }
  const guarded = async (operation: () => void | Promise<void>) => {
    try { setError(''); await operation() }
    catch (reason) {
      setError(reason instanceof DOMException && reason.name === 'QuotaExceededError'
        ? 'Device storage is full. Export a texture package to keep your work.'
        : reason instanceof Error ? reason.message : 'The operation failed. Try again or export your work.')
    }
  }
  const makePackage = () => {
    if (!session.current || !ready) throw new Error('Wait for the selected furniture to load.')
    return furniturePackage(asset, styleId, session.current.scene.canvases, upholsteryColor)
  }
  const save = () => guarded(() => {
    localStorage.setItem(FURNITURE_SAVE_PREFIX + furnitureDraftKey(asset, styleId), JSON.stringify(makePackage()))
    session.current!.dirty = false; setDirty(false); remember(); setNotice('Saved on this device. The live game is unchanged.')
  })
  const recolor = (value: string) => guarded(() => {
    const current = session.current
    if (!current || !ready || asset.id !== 'sofa') return
    const color = saveSofaColor(value)
    current.scene.setUpholsteryColor(color); setUpholstery(color); setOriginal(false)
    setRevision(value => value + 1)
    setNotice('Upholstery color saved on this device for new sofas. Existing sofas keep their own saved colors.')
  })
  const loadPackage = (text: string) => guarded(async () => {
    const current = session.current
    if (!current || !ready) throw new Error('Wait for the selected furniture to load.')
    const value = parseFurniturePackage(text, asset, styleId), request = ++importRequest.current
    current.scene.cancelPaint()
    const active = () => session.current === current && importRequest.current === request
    if (!await restoreFurniturePackage(value, current.scene.canvases, active)) return
    if (asset.id === 'sofa') {
      const color = saveSofaColor(value.upholsteryColor ?? SOFA_DEFAULT_COLOR)
      current.scene.setUpholsteryColor(color); setUpholstery(color)
    }
    current.history = Object.fromEntries(current.scene.surfaces.map(row => [row.id, { undo: [], redo: [] }]))
    setOriginal(false); changed(Object.keys(current.scene.canvases)); setNotice('Loaded the texture package. Save locally to keep it.')
  })
  const loadSaved = () => guarded(async () => {
    const value = localStorage.getItem(FURNITURE_SAVE_PREFIX + furnitureDraftKey(asset, styleId))
    if (!value) throw new Error('No saved texture package for this item and style yet.')
    await loadPackage(value)
  })
  const importImage = (file?: File) => guarded(async () => {
    if (!file) return
    if (!['image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Choose a PNG or WebP under 2 MB.')
    const current = session.current, id = part, canvas = current?.scene.canvases[id], request = ++importRequest.current
    if (!current || !canvas) throw new Error('Choose a surface first.')
    const url = URL.createObjectURL(file)
    try {
      const image = new Image(); image.src = url; await image.decode()
      if (session.current !== current || importRequest.current !== request) return
      if (image.naturalWidth !== canvas.width || image.naturalHeight !== canvas.height)
        throw new Error(`Use a ${canvas.width} × ${canvas.height} image for this surface.`)
      current.scene.cancelPaint(); snapshot(id)
      const context = canvas.getContext('2d')!
      context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0)
      setOriginal(false); changed([id])
    } finally { URL.revokeObjectURL(url) }
  })
  const rotate = () => { const value = session.current?.scene.rotate(); if (value !== undefined) setFacing(value) }
  const view = (value: number) => { session.current?.scene.view(value); setFacing(value) }
  const spec = surfaces.find(row => row.id === part)
  const sheet = session.current?.scene.surface(part)
  const history = session.current?.history[part]
  return { asset, assetId, style, styleId, selectAsset, selectStyle, host, surfaces, part, spec, sheet, selectPart,
    ready, retry: () => setRetry(value => value + 1), error, setError, notice, setNotice, revision, dirty,
    tool, setTool, color, setColor, brush, setBrush, modelMode, setModelMode, original, setOriginal,
    upholsteryColor, recolor,
    playing, setPlaying, cursor, setCursor, facing, rotate, view, paint, undo, reset, save, loadSaved, loadPackage, makePackage, importImage, guarded,
    canUndo: !!history?.undo.length, canRedo: !!history?.redo.length, session }
}
