import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { navigatePlay } from '@/game/play-navigation'
import type { AmberComparisonController, AmberComparisonOptions, AmberRepresentation } from '@/game/runtime/amber-representation-scene'
import baked from '../../../assets/actor-appearances/amber-parts-baked-v1/manifest.json'
import detail from '@/game/runtime/amber-detail-manifest.json'
import anime from '@/game/runtime/amber-anime-manifest.json'

const modes: { id: AmberRepresentation; label: string; description: string }[] = [
  { id: 'anime-3d', label: 'Anime Amber 3D', description: 'New slender proportions, a continuous sculpted face, tapered hair, articulated fingers and UV-mapped cloth, leather and brass. Live geometry with idle, walk and run. Drag to inspect every angle.' },
  { id: 'full-3d', label: 'Full 3D', description: 'Live geometry with lighting and smooth rendering. Amber’s original painted face and outfit details remain.' },
  { id: 'painted-3d', label: '3D + 2D', description: 'The same painted 3D rig rendered into native pixels, using the existing game palette and outline finish.' },
  { id: 'native-2d', label: 'Native 2D', description: 'Authored 2D sprites only: two idle poses and six stride poses per direction. No 3D rendering in this mode.' },
  { id: 'parts-baked', label: 'Parts model → 2D', description: 'Choose HD sprites to retain facial detail, or the original native pixels. Animation playback loads one selected sprite version.' },
  { id: 'parts-live', label: 'Parts model 3D', description: 'The detailed Blender model rendered live. Face detail and camera zoom preserve the higher-resolution face texture. Drag to inspect or scroll to zoom.' },
]
const directions = [{ id: 'down', label: 'Front' }, { id: 'left', label: 'Left' }, { id: 'up', label: 'Back' }, { id: 'right', label: 'Right' }] as const

export default function AmberRepresentationComparison() {
  const host = useRef<HTMLDivElement>(null), controller = useRef<AmberComparisonController | null>(null)
  const [mode, setMode] = useState<AmberRepresentation>(() => modes.find(row => row.id === new URLSearchParams(location.search).get('mode'))?.id ?? 'painted-3d')
  const [options, setOptions] = useState<AmberComparisonOptions>(() => {
    const query = new URLSearchParams(location.search), face = query.get('focus') === 'face'
    return { action: 'idle', direction: face ? 'down' : mode === 'anime-3d' ? 'left' : 'down', paused: matchMedia('(prefers-reduced-motion: reduce)').matches, zoom: 4, speed: 1, focus: face ? 'face' : 'body', bakeQuality: 'hd' }
  })
  const [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState(''), [attempt, setAttempt] = useState(0), [notice, setNotice] = useState('')
  const current = useRef(options); current.current = options
  const selected = modes.find(row => row.id === mode)!
  useEffect(() => {
    if (!loaded || !host.current) return
    if (mode === 'parts-baked' && options.bakeQuality === 'hd' && detail.status !== 'ready') { setLoaded(false); setReady(false); return }
    let cancelled = false, mounted: AmberComparisonController | null = null
    const target = host.current, abort = new AbortController()
    setReady(false); setError('')
    import('@/game/runtime/amber-representation-scene')
      .then(module => { abort.signal.throwIfAborted(); return module.mountAmberRepresentation(target, mode, () => current.current, message => { if (!cancelled) { setError(message); setReady(false) } }, abort.signal, message => { if (!cancelled) setNotice(message) }) })
      .then(value => { if (cancelled) value.dispose(); else { mounted = value; controller.current = value; setReady(true) } })
      .catch(failure => { if (!cancelled) setError(failure instanceof Error ? failure.message : 'Amber’s comparison could not load. Retry the preview.') })
    return () => { cancelled = true; abort.abort(); mounted?.dispose(); if (controller.current === mounted) controller.current = null }
  }, [loaded, mode, attempt, options.bakeQuality, detail.status])
  const patch = (value: Partial<AmberComparisonOptions>) => { setOptions(old => ({ ...old, ...value })); setNotice('') }
  const unload = () => { setLoaded(false); setReady(false); setError(''); setNotice('Preview unloaded.') }
  const detailed = mode === 'anime-3d' || mode === 'parts-live' || mode === 'parts-baked' && options.bakeQuality === 'hd'
  const live = mode === 'anime-3d' || mode === 'parts-live'
  const hdPending = mode === 'parts-baked' && options.bakeQuality === 'hd' && detail.status !== 'ready'
  const selectMode = (value: AmberRepresentation) => {
    if (mode === value) return
    unload(); setMode(value); setOptions(old => ({ ...old, focus: 'body', zoom: 4, direction: value === 'anime-3d' ? 'left' : 'down' }))
    const url = new URL(location.href); url.searchParams.set('mode', value); url.searchParams.delete('focus'); history.replaceState(history.state, '', url)
    setNotice('Mode changed. Load the selected version to compare from the start.')
  }
  return <PlayShell>
    <PlayHeader location="Amber comparison" details="Live 3D · native 2D · baked 2D" balance={null} scope="local">
      <Button variant="outline" size="sm" onClick={() => navigatePlay('explore')}><ArrowLeft />Back to game</Button>
    </PlayHeader>
    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div><h1 className="font-heading text-3xl font-bold sm:text-4xl">Amber’s rendering comparison</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Compare live 3D, painted pixel renders, native 2D artwork and sprites baked from a new model built in parts. One version loads at a time.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Amber representation">{modes.map(row => <Button key={row.id} variant={mode === row.id ? 'secondary' : 'outline'} aria-pressed={mode === row.id} onClick={() => selectMode(row.id)}>{row.label}</Button>)}</div>
        <p className="min-h-10 max-w-3xl text-sm text-muted-foreground">{selected.description}</p>
        {mode === 'parts-baked' && <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Baked image detail">{(['hd', 'native'] as const).map(quality => <Button key={quality} size="sm" variant={options.bakeQuality === quality ? 'secondary' : 'outline'} aria-pressed={options.bakeQuality === quality} onClick={() => { if (options.bakeQuality !== quality) { unload(); patch({ bakeQuality: quality, focus: 'body', zoom: 4 }) } }}>{quality === 'hd' ? 'HD detail · 256 × 320' : 'Native pixels · 64 × 80'}</Button>)}</div>}
        {hdPending && <p role="status" className="text-sm text-muted-foreground">The HD animation bake is running. Parts model 3D and Native pixels are available now.</p>}
        <section className="overflow-hidden rounded-md border bg-card" aria-label="Amber motion comparison">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3"><h2 className="font-heading text-xl font-bold">{selected.label}</h2><span className="text-xs text-muted-foreground">Same display scale · shared cycle timing · {detailed ? 'detail rendering' : mode === 'full-3d' ? 'live 3D rendering' : 'native pixel rendering'}</span></div>
          <div className="relative flex min-h-[390px] items-center justify-center overflow-auto bg-muted/35 p-4 sm:min-h-[450px]">
            <div ref={host} className="flex min-h-80 items-center justify-center" />
            {!loaded && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6"><img src="/pawtrail-game/actor-studio/references/amber-outrider.webp" alt="Amber’s approved appearance reference" width={120} height={200} className="h-48 w-28 object-contain" /><Button disabled={hdPending} onClick={() => { setLoaded(true); setNotice('') }}>{hdPending ? <LoaderCircle className="animate-spin motion-reduce:animate-none" /> : <Play />}{hdPending ? 'HD bake in progress' : 'Load ' + selected.label}</Button><p className="max-w-md text-center text-xs text-muted-foreground">Changing modes unloads the current preview and resets its animation clock.</p></div>}
            {loaded && !ready && !error && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-background/90"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />Loading {selected.label}…</div>}
            {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center"><p className="max-w-md text-sm">{error}</p><Button variant="outline" onClick={() => { setError(''); setAttempt(value => value + 1) }}>Retry preview</Button></div>}
          </div>
          <div className="space-y-3 border-t p-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Common animation">{(['idle', 'walk', 'run'] as const).map(action => <Button key={action} size="sm" disabled={!ready} variant={options.action === action ? 'secondary' : 'outline'} aria-pressed={options.action === action} onClick={() => patch({ action })}>{action === 'idle' ? 'Idle' : action === 'walk' ? 'Walk' : 'Run'}</Button>)}</div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Facing direction">{directions.map(row => <Button key={row.id} size="sm" disabled={!ready} variant={options.direction === row.id ? 'secondary' : 'outline'} aria-pressed={options.direction === row.id} onClick={() => patch({ direction: row.id })}>{row.label}</Button>)}</div>
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={!ready} onClick={() => patch({ paused: !options.paused })}>{options.paused ? <Play /> : <Pause />}{options.paused ? 'Play' : 'Pause'}</Button><Button variant="outline" size="sm" disabled={!ready} onClick={() => { controller.current?.restart(); setNotice('Animation restarted from the first pose.') }}><RotateCcw />Restart</Button>{live && <Button variant="outline" size="sm" disabled={!ready} onClick={() => { controller.current?.resetCamera?.(); setNotice('Camera reset to the selected view.') }}>Reset camera</Button>}{loaded && <Button variant="ghost" size="sm" onClick={unload}>Unload</Button>}</div>
            {detailed && <div className="flex flex-wrap gap-2" role="group" aria-label="Detail focus"><Button size="sm" variant={options.focus === 'body' ? 'secondary' : 'outline'} disabled={!ready} aria-pressed={options.focus === 'body'} onClick={() => patch({ focus: 'body' })}>Full body</Button><Button size="sm" variant={options.focus === 'face' ? 'secondary' : 'outline'} disabled={!ready} aria-pressed={options.focus === 'face'} onClick={() => patch({ focus: 'face', direction: 'down' })}>Face detail</Button></div>}
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Comparison size"><span className="mr-1 text-xs text-muted-foreground">Zoom</span>{(detailed ? [2, 4, 6, 8] : [3, 4, 5, 6]).map(zoom => <Button key={zoom} variant={options.zoom === zoom ? 'secondary' : 'outline'} size="sm" disabled={!ready} aria-pressed={options.zoom === zoom} onClick={() => patch({ zoom })}>{zoom}×</Button>)}</div>
            {detailed && <p className="text-xs text-muted-foreground">{live ? 'Zoom re-renders the model. Drag to orbit and scroll to zoom. Direction buttons restore the camera to that view.' : 'HD retains more pixels; enlarging a sprite still has a detail limit. Use a live 3D mode for a closer view.'}</p>}
            <p role="status" aria-live="polite" className="min-h-4 text-xs text-muted-foreground">{error ? 'Preview stopped.' : notice || (ready ? `${options.paused ? 'Paused' : 'Playing'} · ${options.action} · ${directions.find(row => row.id === options.direction)?.label}` : 'Choose a mode and load its preview.')}</p>
          </div>
        </section>
        {mode === 'anime-3d' && <details className="rounded-md border bg-card p-4"><summary className="cursor-pointer font-heading text-xl font-semibold">Inspect the new anime model</summary><div className="mt-4 space-y-4"><p className="max-w-3xl text-sm text-muted-foreground">{anime.triangles.toLocaleString()} triangles · {anime.joints} joints · {anime.parts} editable source parts · {anime.materials} material batches. {(anime.sourceModelBytes / 1048576).toFixed(1)} MiB animated GLB. Cloth, leather and hair use a {anime.textures.materialAtlas[0]} px material atlas; the continuous face and geometry AO each use 1024 px maps.</p><img src={anime.sourceViews} width={2304} height={960} loading="lazy" alt="Actual new Amber 3D model rendered from front, left and back" className="mx-auto w-full max-w-3xl rounded-md bg-muted/35 object-contain" /><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" asChild><a href={anime.sourceModel} download="amber-anime.glb">Download animated model</a></Button><Button variant="outline" size="sm" asChild><a href={anime.reference} target="_blank" rel="noreferrer">View modeling reference</a></Button></div><p className="text-xs text-muted-foreground">Hand-authored Blender geometry guided by generated artwork. Albedo, normal, roughness, metallic and geometry AO are embedded. Appearance and browser acceptance are pending review.</p></div></details>}
        {(mode === 'parts-baked' || mode === 'parts-live') && <details className="rounded-md border bg-card p-4"><summary className="cursor-pointer font-heading text-xl font-semibold">Inspect the source model</summary><div className="mt-4 space-y-4"><p className="max-w-3xl text-sm text-muted-foreground">{baked.partCount} editable parts · {baked.frames} baked frames. Reference-guided Blender mesh authoring with painted facial features; it is not AI mesh generation.</p><img src={detailed ? detail.sourceViews : baked.sourceViews} width={detailed ? 1536 : 768} height={detailed ? 640 : 320} loading="lazy" alt="Actual Blender renders of Amber from front, left and back" className="mx-auto w-full max-w-3xl rounded-md bg-muted/35 object-contain" /><Button variant="outline" size="sm" asChild><a href={detailed ? detail.sourceModel : baked.sourceModel} download="amber-parts.glb">Download animated 3D source</a></Button><p className="text-xs text-muted-foreground">{mode === 'parts-live' ? 'This mode renders the GLB live.' : options.bakeQuality === 'hd' ? `HD loads one clip at a time: at most ${(detail.maximumDecodedClipBytes / 1048576).toFixed(1)} MiB of decoded sprite pixels, before browser overhead.` : `Native playback uses ${(baked.bytes / 1024).toFixed(1)} KiB on disk and ${(baked.decodedAtlasBytes / 1048576).toFixed(2)} MiB of decoded pixels.`} Appearance and live acceptance remain pending review.</p></div></details>}
        <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">This is a silent, local motion study. Native 2D reuses its six stride drawings at a faster cadence for Run; Parts model → 2D has separate walk and run animation. The four cardinal views are supported in every mode. These comparisons cover idle, walk and run, not the full actor interaction library. Amber’s game roster, saves and creator remain unchanged. In-game and visual acceptance are pending.</p>
      </div>
    </main>
  </PlayShell>
}
