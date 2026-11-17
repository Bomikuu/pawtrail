import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Armchair, Box, Brush, Crosshair, Download, Eraser, Eye, Grid2X2, Info, Keyboard, Minus, MoreHorizontal, Orbit, PaintBucket, Paintbrush, PanelLeft, Pause, Pipette, Play, Plus, Redo2, RotateCcw, RotateCw, Save, Scan, Search, Upload, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { furnitureAssets, furnitureCategories, furnitureModelCount } from '@/features/neighborhood/game/furniture-studio/catalog'
import { copySurface, textureZooms } from '@/features/neighborhood/game/furniture-studio/textures'
import { drawCheckerboard, downloadFile } from '@/features/neighborhood/game/skin-studio/textures'
import { brushSizes, type PaintTool } from '@/features/neighborhood/game/skin-studio/painting'
import { useFurnitureEditor } from './furniture-editor-workspace'
import { SofaColorControl } from './sofa-color-control'

const swatches = ['#898a4a', '#656238', '#f2e3c5', '#bf7852', '#8f4b3a', '#ce9148', '#713810', '#003e38', '#008e81', '#24d5c9', '#fff0d1', '#38271e']
const tools: { id: PaintTool; label: string; Icon: typeof Brush }[] = [
  { id: 'brush', label: 'Brush (B)', Icon: Brush }, { id: 'eraser', label: 'Restore original pixels (E)', Icon: Eraser },
  { id: 'pick', label: 'Pick color (I)', Icon: Pipette }, { id: 'fill', label: 'Fill connected color (G)', Icon: PaintBucket },
]
function IconAction({ label, Icon, onClick, active, disabled = false }: { label: string; Icon: typeof Brush; onClick: () => void; active?: boolean; disabled?: boolean }) {
  return <Tooltip><TooltipTrigger asChild><Button variant={active ? 'secondary' : 'ghost'} size="icon" className="size-9 shrink-0 sm:size-8" aria-label={label} aria-pressed={active} disabled={disabled} onClick={onClick}><Icon className="size-4" /></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>
}
function goTo(view: 'furniture-setup' | 'comparison', id: string) {
  const query = new URLSearchParams({ asset: id })
  query.set(view === 'comparison' ? 'compare' : 'preview', view === 'comparison' ? 'furniture' : view)
  if(view==='comparison'&&['sofa','wooden-door','sofa-sage','sofa-terracotta','sofa-cream','three-seat-sofa'].includes(id))query.set('representation','sprite')
  window.history.pushState(null, '', window.location.pathname + '?' + query)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export default function FurnitureEditor() {
  const w = useFurnitureEditor()
  const [pane, setPane] = useState<'assets' | 'paint' | 'model'>('paint')
  const [search, setSearch] = useState(''), [category, setCategory] = useState('all')
  const [zoom, setZoom] = useState(4), [fit, setFit] = useState(true), [grid, setGrid] = useState(true), [uv, setUv] = useState(false)
  const [hex, setHex] = useState(w.color), [details, setDetails] = useState<'surface' | 'help' | null>(null), [hover, setHover] = useState(false)
  const area = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null)
  const imageFile = useRef<HTMLInputElement>(null), packageFile = useRef<HTMLInputElement>(null)
  const stroke = useRef<{ pointer: number; x: number; y: number; part: string } | null>(null)
  const guides = useRef(new Map<string, HTMLCanvasElement>())
  const zoomAnchor = useRef<{ x: number; y: number; clientX: number; clientY: number; zoom: number } | null>(null)
  const width = w.sheet?.width ?? 96, height = w.sheet?.height ?? 64
  const visible = furnitureAssets.filter(asset => (category === 'all' || category === 'models' && !!asset.definition || category === asset.category)
    && `${asset.label} ${asset.id} ${asset.category}`.toLowerCase().includes(search.toLowerCase().trim()))
  const basename = `pawtrail-${w.assetId}-${w.styleId}`

  const endStroke = () => {
    const pointer = stroke.current?.pointer
    stroke.current = null; w.paint({ phase: 'end', hits: [] })
    if (pointer !== undefined && canvas.current?.hasPointerCapture(pointer)) canvas.current.releasePointerCapture(pointer)
  }
  useEffect(() => { setHex(w.color) }, [w.color])
  useEffect(() => { stroke.current = null; setFit(true); guides.current.clear() }, [w.assetId, w.styleId, w.part])
  useEffect(() => {
    const target = area.current
    if (!target || !fit || !w.ready) return
    let stopped = false
    const resize = () => {
      if (stopped || !target.clientWidth || !target.clientHeight) return
      const maximum = Math.min((target.clientWidth - 32) / width, (target.clientHeight - 32) / height)
      setZoom([...textureZooms].reverse().find(value => value <= maximum) ?? 1)
      target.scrollTo({ left: 0, top: 0 })
    }
    const observer = new ResizeObserver(resize); observer.observe(target); resize()
    return () => { stopped = true; observer.disconnect() }
  }, [fit, width, height, w.ready, pane])
  useEffect(() => {
    const element = canvas.current, source = w.original ? w.session.current?.originals[w.part] : w.sheet
    if (!element || !source) return
    element.width = width * zoom; element.height = height * zoom
    const context = element.getContext('2d')!
    context.imageSmoothingEnabled = false
    drawCheckerboard(context, element.width, element.height, 8 * zoom)
    context.drawImage(source, 0, 0, element.width, element.height)
    if (grid && zoom >= 4) {
      context.strokeStyle = '#ffffff20'; context.lineWidth = 1; context.beginPath()
      for (let x = 0; x <= width; x++) { context.moveTo(x * zoom + .5, 0); context.lineTo(x * zoom + .5, element.height) }
      for (let y = 0; y <= height; y++) { context.moveTo(0, y * zoom + .5); context.lineTo(element.width, y * zoom + .5) }
      context.stroke()
    }
    if (uv && w.asset.definition && w.spec?.kind === 'texture') {
      if (!guides.current.has(w.part)) {
        const guide = document.createElement('canvas'); guide.width = width; guide.height = height
        w.session.current?.scene.drawUV(w.part, guide.getContext('2d')!); guides.current.set(w.part, guide)
      }
      context.drawImage(guides.current.get(w.part)!, 0, 0, element.width, element.height)
    }
    if (hover && w.cursor && !w.original) {
      if (w.tool === 'brush' || w.tool === 'eraser') {
        const parity = w.brush % 2 ? .5 : 0
        context.beginPath(); context.arc((w.cursor.x + parity) * zoom, (w.cursor.y + parity) * zoom, w.brush * zoom / 2, 0, Math.PI * 2)
        context.strokeStyle = '#171717'; context.lineWidth = 3; context.stroke(); context.strokeStyle = '#ffffff'; context.lineWidth = 1; context.stroke()
      } else { context.strokeStyle = '#ffffff'; context.lineWidth = 1; context.strokeRect(w.cursor.x * zoom + .5, w.cursor.y * zoom + .5, zoom - 1, zoom - 1) }
    }
    const anchor = zoomAnchor.current
    if (anchor && anchor.zoom === zoom && area.current) {
      const rect = element.getBoundingClientRect()
      area.current.scrollLeft += rect.left + anchor.x * zoom - anchor.clientX
      area.current.scrollTop += rect.top + anchor.y * zoom - anchor.clientY
      zoomAnchor.current = null
    }
  }, [w.sheet, w.revision, w.part, w.original, w.ready, zoom, width, height, grid, uv, w.cursor, hover, w.brush, w.tool])
  useEffect(() => {
    const target = area.current
    if (!target) return
    let delta = 0
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault(); event.stopPropagation()
      delta += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? target.clientHeight : 1)
      if (Math.abs(delta) < 25) return
      const next = textureZooms[Math.max(0, Math.min(textureZooms.length - 1, textureZooms.indexOf(zoom) + (delta < 0 ? 1 : -1)))]
      delta = 0; stroke.current = null
      if (next === zoom || !canvas.current) return
      const rect = canvas.current.getBoundingClientRect()
      zoomAnchor.current = { x: (event.clientX - rect.left) / zoom, y: (event.clientY - rect.top) / zoom, clientX: event.clientX, clientY: event.clientY, zoom: next }
      setFit(false); setZoom(next)
    }
    target.addEventListener('wheel', wheel, { passive: false })
    return () => target.removeEventListener('wheel', wheel)
  }, [zoom])
  useEffect(() => {
    const release = (event: globalThis.KeyboardEvent) => { if (event.code === 'Space') w.session.current?.scene.setTemporaryOrbit(false) }
    const blur = () => { stroke.current = null; w.session.current?.scene.setTemporaryOrbit(false) }
    window.addEventListener('keyup', release); window.addEventListener('blur', blur)
    return () => { window.removeEventListener('keyup', release); window.removeEventListener('blur', blur) }
  }, [])
  const point = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: Math.floor((event.clientX - rect.left) / zoom), y: Math.floor((event.clientY - rect.top) / zoom) }
  }
  const down = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0 || !w.ready || w.original || stroke.current) return
    event.preventDefault(); event.currentTarget.focus({ preventScroll: true })
    const p = point(event)
    stroke.current = { pointer: event.pointerId, ...p, part: w.part }
    event.currentTarget.setPointerCapture(event.pointerId)
    w.paint({ phase: 'start', hits: [{ ...p, part: w.part }] })
  }
  const move = (event: PointerEvent<HTMLCanvasElement>) => {
    const p = point(event)
    w.setCursor(p.x >= 0 && p.y >= 0 && p.x < width && p.y < height ? p : null)
    const previous = stroke.current
    if (!previous || previous.pointer !== event.pointerId || previous.part !== w.part) return
    const steps = Math.min(1024, Math.max(1, Math.ceil(Math.hypot(p.x - previous.x, p.y - previous.y))))
    w.paint({ phase: 'move', hits: Array.from({ length: steps }, (_, i) => ({ part: w.part, x: Math.round(previous.x + (p.x - previous.x) * (i + 1) / steps), y: Math.round(previous.y + (p.y - previous.y) * (i + 1) / steps) })) })
    stroke.current = { ...previous, ...p }
  }
  const changeZoom = (direction: number) => { endStroke(); setFit(false); setZoom(textureZooms[Math.max(0, Math.min(textureZooms.length - 1, textureZooms.indexOf(zoom) + direction))]) }
  const exportSurface = (source = w.sheet, suffix = '') => { if (source) downloadFile(`${basename}-${w.part}${suffix}.png`, source.toDataURL('image/png')) }
  const exportUv = () => {
    const source = w.session.current?.originals[w.part]
    if (!source) return
    const output = copySurface(source); w.session.current?.scene.drawUV(w.part, output.getContext('2d')!); exportSurface(output, '-uv-reference')
  }
  const keyDown = (event: KeyboardEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"],[role="combobox"],[role="dialog"],[role="menu"]') || details) return
    const key = event.key.toLowerCase(), modifier = event.ctrlKey || event.metaKey
    if (modifier && key === 'z') { event.preventDefault(); endStroke(); w.undo(event.shiftKey); return }
    if (modifier && key === 'y') { event.preventDefault(); endStroke(); w.undo(true); return }
    if (modifier && key === 's') { event.preventDefault(); if (w.ready) void w.save(); return }
    if (event.code === 'Space' && w.host.current?.contains(event.target as Node)) { event.preventDefault(); w.session.current?.scene.setTemporaryOrbit(true); return }
    if (key === '+' || key === '=' || key === '-') {
      event.preventDefault()
      if (w.asset.definition && w.host.current?.contains(event.target as Node)) w.session.current?.scene.zoomBy(key === '-' ? 1 / 1.2 : 1.2)
      else changeZoom(key === '-' ? -1 : 1)
      return
    }
    if (modifier || event.altKey) return
    const toolKeys: Partial<Record<string, PaintTool>> = { b: 'brush', e: 'eraser', i: 'pick', g: 'fill' }
    const selected = toolKeys[key]
    if (selected) { event.preventDefault(); endStroke(); w.setTool(selected) }
    else if (key === 'p' || key === 'v') { event.preventDefault(); w.setModelMode(key === 'p' ? 'paint' : 'orbit') }
    else if (key === 'f') { event.preventDefault(); setFit(true) }
    else if (key === '[' || key === ']') { event.preventDefault(); w.setBrush(brushSizes[Math.max(0, Math.min(brushSizes.length - 1, brushSizes.indexOf(w.brush) + (key === '[' ? -1 : 1)))]) }
    else if (key === '?') { event.preventDefault(); setDetails('help') }
    else if (key === 'escape') { endStroke(); w.session.current?.scene.setTemporaryOrbit(false) }
  }

  return <PlayShell>
    <PlayHeader location="Furniture editor" details="Local workspace" balance={null} scope="local">
      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm" disabled={!w.asset.definition&&!['sofa','wooden-door','sofa-sage','sofa-terracotta','sofa-cream','three-seat-sofa'].includes(w.assetId)} aria-label="Preview furniture interactions" onClick={() => goTo('comparison', w.assetId)}><Armchair className="size-4" /><span className="hidden sm:inline">Interaction preview</span></Button></TooltipTrigger><TooltipContent>View installed furniture and its contacts. Texture drafts stay in the editor.</TooltipContent></Tooltip>
    </PlayHeader>
    <main onKeyDown={keyDown} className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="min-w-0"><h1 className="truncate font-heading text-xl font-semibold">{w.asset.label}</h1><p className="text-xs text-muted-foreground">{w.asset.category} · {w.asset.definition ? 'Authored 3D model' : '2D sprite'}{w.dirty ? ' · Unsaved' : ''}</p></div>
        <div className="flex shrink-0 items-center gap-1.5">
          <IconAction label="Keyboard shortcuts (?)" Icon={Keyboard} onClick={() => setDetails('help')} />
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm">Files<MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="pawtrail-game">
            <DropdownMenuItem disabled={!w.ready} onSelect={() => packageFile.current?.click()}><Upload className="size-4" />Load texture package</DropdownMenuItem>
            <DropdownMenuItem disabled={!w.ready} onSelect={() => void w.loadSaved()}><Save className="size-4" />Load saved item</DropdownMenuItem>
            <DropdownMenuItem disabled={!w.ready} onSelect={() => void w.guarded(() => { downloadFile(`${basename}-textures.json`, new Blob([JSON.stringify(w.makePackage())], { type: 'application/json' })) })}><Download className="size-4" />Export texture package</DropdownMenuItem>
            <DropdownMenuSeparator /><DropdownMenuItem disabled={!w.asset.definition} onSelect={() => goTo('furniture-setup', w.assetId)}><Box className="size-4" />Model setup & construction</DropdownMenuItem>
          </DropdownMenuContent></DropdownMenu>
          <Button size="sm" disabled={!w.ready} onClick={() => void w.save()}><Save className="size-4" /><span className="hidden sm:inline">Save locally</span><span className="sm:hidden">Save</span></Button>
        </div>
      </header>
      {w.error && <div role="alert" className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"><p className="min-w-0 flex-1 text-destructive">{w.error}</p><Button size="sm" variant="outline" onClick={() => w.ready ? w.setError('') : w.retry()}>{w.ready ? 'Dismiss' : 'Retry'}</Button></div>}
      <nav aria-label="Furniture editor panels" className="flex shrink-0 gap-1 border-b px-2 py-1.5 lg:hidden">{([{ id: 'assets', label: 'Assets', Icon: PanelLeft }, { id: 'paint', label: 'Paint', Icon: Paintbrush }, { id: 'model', label: w.asset.definition ? 'Model' : 'Preview', Icon: Box }] as const).map(({ id, label, Icon }) => <Button key={id} variant={pane === id ? 'secondary' : 'ghost'} size="sm" aria-pressed={pane === id} aria-controls={'furniture-' + id} className="flex-1" onClick={() => setPane(id)}><Icon className="size-4" />{label}</Button>)}</nav>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[232px_minmax(0,1fr)_288px] 2xl:grid-cols-[264px_minmax(0,1fr)_352px]">
        <aside id="furniture-assets" aria-label="Furniture asset library" className={`${pane === 'assets' ? 'flex' : 'hidden'} min-h-0 flex-col overflow-hidden bg-muted/20 lg:flex lg:border-r`}>
          <div className="shrink-0 space-y-2 border-b p-3"><div className="flex items-center justify-between"><h2 className="font-heading text-lg font-semibold">Assets</h2><span className="text-xs tabular-nums text-muted-foreground">{visible.length}/{furnitureAssets.length}</span></div>
            <Select value={category} onValueChange={setCategory}><SelectTrigger className="h-8 w-full" aria-label="Filter furniture assets"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All furniture</SelectItem><SelectItem value="models">3D models ({furnitureModelCount})</SelectItem>{furnitureCategories.map(value => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select>
            <div className="relative"><Search className="pointer-events-none absolute left-2 top-2 size-4 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find furniture…" aria-label="Find furniture" className="h-8 pl-8" /></div>
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2">{visible.map(item => <Button key={item.id} variant={item.id === w.assetId ? 'secondary' : 'ghost'} aria-pressed={item.id === w.assetId} className="h-auto w-full justify-start gap-2 px-2 py-2 text-left" onClick={() => { endStroke(); w.selectAsset(item.id); setPane('paint') }}>
            <img src={item.file} width={item.width} height={item.height} alt="" loading="lazy" className="size-10 shrink-0 object-contain [image-rendering:pixelated]" />
            <span className="min-w-0 flex-1"><span className="block truncate">{item.label}</span><span className="block text-xs font-normal text-muted-foreground">{item.definition ? '3D model' : `${item.width} × ${item.height} sprite`}</span></span>{item.id === w.assetId && <Crosshair className="size-3.5 shrink-0" />}
          </Button>)}{!visible.length && <div className="space-y-2 p-2 text-sm text-muted-foreground"><p>No matching furniture.</p><Button size="sm" variant="outline" onClick={() => { setSearch(''); setCategory('all') }}>Show all assets</Button></div>}</div>
          <p className="shrink-0 border-t px-3 py-2 text-xs leading-relaxed text-muted-foreground">{furnitureModelCount} authored models · {furnitureAssets.length - furnitureModelCount} painted sprites</p>
        </aside>
        <section id="furniture-paint" aria-label="Furniture texture canvas" className={`${pane === 'paint' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col overflow-hidden lg:flex`}>
          <div className="flex shrink-0 flex-wrap items-center gap-1 border-b px-2 py-1.5">
            {tools.map(({ id, label, Icon }) => <IconAction key={id} label={label} Icon={Icon} active={w.tool === id} disabled={!w.ready || w.original} onClick={() => { endStroke(); w.setTool(id) }} />)}
            <span className="mx-1 h-5 w-px bg-border" />
            <Input type="color" aria-label="Paint color" value={w.color} onChange={event => w.setColor(event.target.value)} className="size-8 shrink-0 p-1" />
            <Input aria-label="Paint hex color" value={hex} maxLength={7} onChange={event => { setHex(event.target.value); if (/^#[a-f0-9]{6}$/i.test(event.target.value)) w.setColor(event.target.value) }} onBlur={() => setHex(w.color)} className="h-8 w-20 px-2 text-xs" />
            <Select value={String(w.brush)} onValueChange={value => w.setBrush(Number(value))}><SelectTrigger aria-label="Brush size" className="h-8 w-20"><SelectValue /></SelectTrigger><SelectContent>{brushSizes.map(size => <SelectItem key={size} value={String(size)}>{size} px</SelectItem>)}</SelectContent></Select>
            <div className="ml-auto flex"><IconAction label="Undo (Ctrl+Z)" Icon={Undo2} disabled={!w.ready || !w.canUndo} onClick={() => { endStroke(); w.undo() }} /><IconAction label="Redo (Ctrl+Shift+Z)" Icon={Redo2} disabled={!w.ready || !w.canRedo} onClick={() => { endStroke(); w.undo(true) }} /></div>
          </div>
          <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
            <Select value={w.part || undefined} disabled={!w.ready} onValueChange={value => { endStroke(); w.selectPart(value) }}><SelectTrigger aria-label="Texture surface" className="h-8 min-w-0 flex-1"><SelectValue placeholder="Loading surfaces…" /></SelectTrigger><SelectContent>{w.surfaces.map(row => <SelectItem key={row.id} value={row.id}>{row.label}</SelectItem>)}</SelectContent></Select>
            <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{width} × {height}</span>
            <IconAction label="Show original surface" Icon={Eye} active={w.original} disabled={!w.ready} onClick={() => { endStroke(); w.setOriginal(!w.original) }} />
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-8" aria-label="Surface actions" disabled={!w.ready}><MoreHorizontal className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="pawtrail-game">
              <DropdownMenuItem onSelect={() => imageFile.current?.click()}><Upload className="size-4" />Import native image</DropdownMenuItem><DropdownMenuItem onSelect={() => exportSurface()}><Download className="size-4" />Export surface PNG</DropdownMenuItem><DropdownMenuItem onSelect={() => exportSurface(w.session.current?.originals[w.part], '-original')}><Download className="size-4" />Download original template</DropdownMenuItem><DropdownMenuItem disabled={!w.asset.definition || w.spec?.kind !== 'texture'} onSelect={exportUv}><Grid2X2 className="size-4" />Download UV reference</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={w.reset}><RotateCcw className="size-4" />Reset this surface</DropdownMenuItem><DropdownMenuItem onSelect={() => setDetails('surface')}><Info className="size-4" />Where this texture is used</DropdownMenuItem>
            </DropdownMenuContent></DropdownMenu>
          </div>
          <div ref={area} className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain bg-muted/35">
            {!w.ready ? <div role="status" className="grid h-full min-h-40 place-items-center px-6 text-center text-sm text-muted-foreground">{w.error ? 'Choose another asset or use Retry.' : 'Opening furniture surfaces…'}</div> : <div className="flex min-h-full w-max min-w-full items-center justify-center p-4"><canvas ref={canvas} tabIndex={0} role="img" aria-label={`${w.spec?.label ?? 'Furniture'} editable native texture`} aria-describedby="furniture-paint-help" onPointerDown={down} onPointerMove={move} onPointerUp={endStroke} onPointerCancel={endStroke} onLostPointerCapture={endStroke} onPointerEnter={() => setHover(true)} onPointerLeave={() => { setHover(false); w.setCursor(null) }} className="block shrink-0 touch-none cursor-crosshair outline-none focus-visible:ring-2 focus-visible:ring-ring [image-rendering:pixelated]" style={{ width: width * zoom, height: height * zoom }} /></div>}
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-t px-2 py-1.5">
            <div className="flex"><IconAction label="Pixel grid" Icon={Grid2X2} active={grid} onClick={() => setGrid(!grid)} /><IconAction label="UV edges" Icon={Scan} active={uv} disabled={!w.asset.definition || w.spec?.kind !== 'texture'} onClick={() => setUv(!uv)} /></div>
            <div className="flex items-center gap-1"><Button variant={fit ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setFit(true)}>Fit</Button><IconAction label="Zoom texture out" Icon={Minus} disabled={zoom === textureZooms[0]} onClick={() => changeZoom(-1)} /><span className="w-10 text-center text-xs tabular-nums">{zoom}×</span><IconAction label="Zoom texture in" Icon={Plus} disabled={zoom === textureZooms[textureZooms.length - 1]} onClick={() => changeZoom(1)} /></div>
          </div>
        </section>
        <aside id="furniture-model" aria-label="Live furniture preview" className={`${pane === 'model' ? 'flex' : 'hidden'} min-h-0 min-w-0 flex-col overflow-hidden lg:flex lg:border-l`}>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2"><h2 className="font-heading text-lg font-semibold">{w.asset.definition ? 'Live model' : 'Sprite preview'}</h2><span className="text-xs text-muted-foreground">{w.asset.definition || w.upholsteryColor !== undefined ? `${w.facing}°` : '2D'}</span></div>
          {w.asset.definition && <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b p-2"><div className="flex"><Button variant={w.modelMode === 'orbit' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => w.setModelMode('orbit')} aria-pressed={w.modelMode === 'orbit'}><Orbit className="size-4" />Orbit</Button><Button variant={w.modelMode === 'paint' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => w.setModelMode('paint')} aria-pressed={w.modelMode === 'paint'}><Brush className="size-4" />Paint</Button></div><IconAction label={w.playing ? 'Pause furniture animation' : 'Play furniture animation'} Icon={w.playing ? Pause : Play} disabled={!w.ready} onClick={() => w.setPlaying(!w.playing)} /></div>}
          <div className="relative min-h-24 flex-1 overflow-hidden bg-secondary/35">
            <div ref={w.host} className="relative flex size-full min-h-0 items-center justify-center overflow-auto" />
            {(w.asset.definition || w.upholsteryColor !== undefined) && <Button variant="outline" size="icon" disabled={!w.ready} onClick={w.rotate} aria-label="Rotate furniture clockwise" className="absolute left-1/2 top-2 z-10 size-9 -translate-x-1/2 rounded-full bg-background shadow-sm"><RotateCw className="size-4" /></Button>}
          </div>
          {w.asset.definition && <div className="flex shrink-0 items-center justify-between gap-1 border-y px-2 py-1.5"><div className="flex">{[0, 90, 180, 270].map(value => <Button key={value} variant={w.facing === value ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2 text-xs" disabled={!w.ready} onClick={() => w.view(value)}>{value}°</Button>)}</div><div className="flex"><IconAction label="Zoom model out" Icon={Minus} disabled={!w.ready} onClick={() => w.session.current?.scene.zoomBy(1 / 1.2)} /><IconAction label="Zoom model in" Icon={Plus} disabled={!w.ready} onClick={() => w.session.current?.scene.zoomBy(1.2)} /></div></div>}
          <div className="max-h-[38%] shrink-0 space-y-3 overflow-y-auto p-3">
            {w.upholsteryColor !== undefined && <>
              <div className="flex gap-1" aria-label="Sofa view">{[0, 90, 180, 270].map(value => <Button key={value} variant={w.facing === value ? 'secondary' : 'ghost'} size="sm" disabled={!w.ready} aria-pressed={w.facing === value} onClick={() => w.view(value)}>{value}°</Button>)}</div>
              <SofaColorControl color={w.upholsteryColor} onChange={value => void w.recolor(value)} disabled={!w.ready} description="Saved on this device for new sofas. Existing sofas keep their own saved colors." />
            </>}
            {w.asset.definition && <label className="block text-xs font-medium">Material style<Select value={w.styleId} onValueChange={w.selectStyle}><SelectTrigger className="mt-1 h-8 w-full" aria-label="Furniture material style"><SelectValue /></SelectTrigger><SelectContent>{w.asset.definition.styles.map(style => <SelectItem key={style.id} value={style.id}>{style.label}</SelectItem>)}</SelectContent></Select></label>}
            <div><h3 className="mb-2 text-xs font-medium">Paint palette</h3><div className="flex flex-wrap gap-1">{swatches.map(value => <Button key={value} variant="outline" size="icon" className="size-7 p-1" aria-label={`Paint ${value}`} aria-pressed={w.color.toLowerCase() === value} onClick={() => w.setColor(value)}><span className="size-full rounded-sm border border-foreground/15" style={{ backgroundColor: value }} /></Button>)}</div></div>
            <p id="furniture-paint-help" className="text-xs leading-relaxed text-muted-foreground">{w.asset.definition ? 'Paint here or on the model. Shared textures update every part that uses them. Shape and interaction points stay with the model.' : ['sofa','wooden-door','sofa-sage','sofa-terracotta','sofa-cream','three-seat-sofa'].includes(w.assetId) ? 'Edit the native artwork here. Open Interaction preview to inspect authored views, states and actor contacts.' : 'Edit the original 2D artwork here. This item uses its front view; additional rotation views can be authored as sprites.'}</p>
          </div>
        </aside>
      </div>
      <footer className="flex shrink-0 items-center justify-between gap-3 border-t px-3 py-1.5 text-xs text-muted-foreground"><p role="status" className="min-w-0 truncate">{w.notice}</p><span className="hidden shrink-0 sm:inline">{w.cursor ? `${w.cursor.x}, ${w.cursor.y} · ` : ''}Local textures only</span></footer>
      <Input ref={imageFile} type="file" accept="image/png,image/webp" className="hidden" aria-label="Import surface image" onChange={event => { void w.importImage(event.target.files?.[0]); event.target.value = '' }} />
      <Input ref={packageFile} type="file" accept="application/json,.json" className="hidden" aria-label="Import furniture package" onChange={event => { const file = event.target.files?.[0]; if (file) void w.guarded(async () => { if (file.size > 8 * 1024 * 1024) throw new Error('Choose a package under 8 MB.'); await w.loadPackage(await file.text()) }); event.target.value = '' }} />
    </main>
    <Sheet open={details !== null} onOpenChange={open => { if (!open) setDetails(null) }}><SheetContent className="pawtrail-game overflow-y-auto"><SheetHeader><SheetTitle>{details === 'help' ? 'Furniture editor shortcuts' : w.spec?.label}</SheetTitle><SheetDescription>{details === 'help' ? 'Work with native pixels, then inspect the live model.' : 'The original model keeps its geometry and texture mapping.'}</SheetDescription></SheetHeader><div className="space-y-4 px-4 pb-6 text-sm leading-relaxed">
      {details === 'help' ? <><dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">{[['B / E / I / G', 'Brush / restore original / pick color / fill'], ['[ / ]', 'Smaller / larger brush'], ['P / V', 'Paint model / orbit model'], ['Space + drag', 'Orbit temporarily over the model'], ['Ctrl/Cmd + scroll', 'Zoom the canvas or model under the pointer'], ['+ / −', 'Zoom the focused work area'], ['F', 'Fit the texture canvas'], ['Ctrl/Cmd + Z', 'Undo the selected surface'], ['Ctrl/Cmd + Shift + Z', 'Redo the selected surface'], ['Ctrl/Cmd + S', 'Save this item and style locally'], ['Esc', 'End the current paint stroke']].map(([key, description]) => <div key={key} className="contents"><dt className="font-medium">{key}</dt><dd className="text-muted-foreground">{description}</dd></div>)}</dl><p className="text-muted-foreground">Each item and material style keeps its own session draft. Save locally to keep it after a reload, or export a texture package. Imports must match the selected item, style and native dimensions.</p></> : <><p>{w.spec?.kind === 'sprite' ? 'This is the original painted sprite, not a texture applied to invented 3D geometry.' : w.spec?.kind === 'color' ? 'This 1 × 1 surface controls a solid material color. Parts sharing that color update together.' : 'These parts share this actual model texture. Its original size, UVs, transparency and sampler settings are preserved.'}</p><p className="text-muted-foreground">{w.spec?.width} × {w.spec?.height} pixels</p>{!!w.spec?.meshes.length && <ul className="space-y-1 text-muted-foreground">{w.spec.meshes.map(name => <li key={name}>{name}</li>)}</ul>}<p className="break-all text-xs text-muted-foreground">Source: {w.asset.definition?.reference ?? w.asset.file}</p></>}
    </div></SheetContent></Sheet>
  </PlayShell>
}
