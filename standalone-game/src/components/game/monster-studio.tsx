import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Focus, LoaderCircle, Pause, Play, RotateCcw, Shield, Skull, Swords, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { CharacterIcon } from './shared/character-icon'
import { MonsterFamilyRoster } from './monster-family-roster'
import { IllustrationPreview } from './shared/illustration-preview'
import { navigatePlay, navigateHydraArena } from '@/game/play-navigation'
import { ATTACKS, VAELRITH, healthBars, type AttackId } from '@/game/monsters/vaelrith'
import type { MonsterScene, MonsterSceneReport } from '@/game/monsters/scene'
import type { MonsterRepresentation } from '@/game/monsters/presentation'

const vaelrithIllustration = {
  name: 'Vaelrith',
  folder: '/pawtrail-game/monsters/vaelrith-riftbound/illustration-v3-calm-f5b4575b2e0c',
  nativeSize: [384, 256] as const,
  style: 'Refined cel',
  motion: 'Head and neck counter-sway · throat breathing',
}

const initial: MonsterSceneReport = { hp: VAELRITH.maxHp, playerHp: 100, phase: 'bound', running: false, defeated: false, cast: null, window: 'idle', progress: 0, log: ['Local encounter rehearsal.'], cooldowns: {}, playerHeight: 0, weaponCooldown: 0, ultimateCooldown: 0, feedback: '' }
const expressions = ['Watchful', 'Threatening', 'Hurt']
const comparisonModes: { id: MonsterRepresentation; query: string; label: string; description: string }[] = [
  { id: 'layered-2d', query: '2d', label: 'Layered 2D', description: 'Illustrated heads and flexible neck layers · fixed camera, scroll to zoom.' },
  { id: 'volume-3d', query: '3d', label: 'Painted 3D', description: 'Original textured geometry with pixel finishing · drag to orbit, scroll to zoom.' },
  { id: 'full-3d', query: 'full-3d', label: 'Full 3D', description: 'Solid materials, light-driven shading and shadows, no pixel filter · drag to orbit, scroll to zoom.' },
]

function Artwork({ expression = 0, playing = true }: { expression?: number; playing?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const output = canvas.current, image = new Image(), query = matchMedia('(prefers-reduced-motion: reduce)'), controller = new AbortController()
    if (!output) return
    let timer = 0, cancelled = false, render = () => {}
    setError('')
    const sync = () => { window.clearTimeout(timer); render() }
    const load = async () => {
      const response = await fetch(VAELRITH.assets + 'manifest.json?motion=calm-v2', { signal: controller.signal })
      if (!response.ok) throw Error('The portrait data could not load.')
      const { portrait } = await response.json() as { portrait: { file: string; frame: [number, number]; grid: [number, number]; expressions: Record<string, number[]>; idlePerformance: { sequence: number[]; durationsMs: number[] } } }
      const [width, height] = portrait.frame, [columns, rows] = portrait.grid
      const frames = portrait.expressions[expressions[expression].toLowerCase()], timing = portrait.idlePerformance
      if (!frames?.length || !timing?.sequence?.length || timing.sequence.length !== timing.durationsMs.length
        || timing.sequence.some(i => !Number.isInteger(i) || i < 0 || i >= frames.length)
        || frames.some(i => !Number.isInteger(i) || i < 0 || i >= columns * rows)
        || timing.durationsMs.some(ms => !Number.isFinite(ms) || ms <= 0)) throw Error('The portrait timing is unavailable.')
      image.src = VAELRITH.assets + portrait.file
      await image.decode()
      if (cancelled) return
      if (image.naturalWidth !== width * columns || image.naturalHeight !== height * rows) throw Error('The portrait sheet could not load.')
      output.width = width; output.height = height
      const context = output.getContext('2d')!
      context.imageSmoothingEnabled = false
      const start = performance.now(), cycle = timing.durationsMs.reduce((sum,ms) => sum + ms,0)
      render = () => {
        if (cancelled || document.hidden) return
        let phase = query.matches || !playing ? 0 : (performance.now() - start) % cycle, step = 0
        while (step < timing.sequence.length - 1 && phase >= timing.durationsMs[step]) { phase -= timing.durationsMs[step]; step++ }
        const index = frames[timing.sequence[step]]
        context.clearRect(0,0,width,height)
        context.drawImage(image,index % columns * width,Math.floor(index / columns) * height,width,height,0,0,width,height)
        if (playing && !query.matches) timer = window.setTimeout(render,Math.max(1,timing.durationsMs[step]-phase))
      }
      render()
    }
    document.addEventListener('visibilitychange',sync); query.addEventListener('change',sync)
    void load().catch(failure => { if (!cancelled) setError(failure instanceof Error ? failure.message : 'The portrait could not load.') })
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); document.removeEventListener('visibilitychange',sync); query.removeEventListener('change',sync) }
  }, [expression, playing])
  return <div className="space-y-2"><canvas ref={canvas} width={128} height={128} role="img" aria-label={`Vaelrith ${expressions[expression].toLowerCase()} animated portrait`} className="size-64 shrink-0 [image-rendering:pixelated]" />{error && <p role="alert" className="max-w-64 text-center text-xs text-destructive">{error}</p>}</div>
}

export default function MonsterStudio() {
  const host = useRef<HTMLDivElement>(null), scene = useRef<MonsterScene | null>(null)
  const [report, setReport] = useState(initial), [error, setError] = useState(''), [ready, setReady] = useState(false), [epoch, setEpoch] = useState(0)
  const [view, setView] = useState('encounter'), [muted, setMuted] = useState(false), [expression, setExpression] = useState(0), [artPlaying, setArtPlaying] = useState(true)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [representation, setRepresentation] = useState<MonsterRepresentation>(() => comparisonModes.find(mode => mode.query === new URLSearchParams(location.search).get('monsterView'))?.id ?? 'volume-3d')
  const selectedMode = comparisonModes.find(mode => mode.id === representation)!
  const muteRef = useRef(muted); muteRef.current = muted
  useEffect(() => {
    if (!previewLoaded || !host.current) return
    const target = host.current, controller = new AbortController(); let cancelled = false, mounted: MonsterScene | null = null
    setReady(false); setError('')
    import('@/game/monsters/scene').then(module => { controller.signal.throwIfAborted(); return module.MonsterScene.create(target, r => { if (!cancelled) setReport(r) }, message => { if (!cancelled) setError(message) }, controller.signal, representation) })
      .then(value => { if (cancelled) value.dispose(); else { mounted = value; scene.current = value; value.setMuted(muteRef.current); setReady(true) } })
      .catch(failure => { if (!cancelled) setError(failure instanceof Error ? failure.message : 'The creature preview could not load.') })
    return () => { cancelled = true; controller.abort(); mounted?.dispose(); if (scene.current === mounted) scene.current = null }
  }, [epoch, previewLoaded, representation])
  const unload = () => { scene.current?.pause(); setPreviewLoaded(false); setReady(false); setError(''); setReport(initial) }
  const selectRepresentation = (value: MonsterRepresentation) => {
    if (value === representation) return
    unload(); setRepresentation(value)
    const url = new URL(location.href); url.searchParams.set('monsterView', comparisonModes.find(mode => mode.id === value)!.query)
    history.replaceState(history.state, '', url)
  }
  const bars = healthBars(report.hp), status = report.defeated ? 'Defeated' : report.playerHp <= 0 ? 'Player down' : report.running ? report.window : 'Paused'
  const switchView = (value: string) => { scene.current?.pause(); setView(value) }
  return <PlayShell>
    <PlayHeader location="Monster studio" details="Vaelrith · local encounter" balance={null} scope="local">
      <Button variant="outline" size="sm" onClick={navigateHydraArena}>Kaedros · roaming hydra</Button>
      <Button variant="outline" size="sm" onClick={() => navigatePlay('explore')}><ArrowLeft />Back to game</Button>
    </PlayHeader>
    <main className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 xl:h-full xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-w-0 flex-col xl:min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-6">
            <div className="flex items-center gap-3"><CharacterIcon src={VAELRITH.assets + 'icon-framed.png'} active /><div><h1 className="font-heading text-3xl font-bold leading-none">{VAELRITH.name}<span className="ml-2 text-lg font-medium text-muted-foreground">{VAELRITH.title}</span></h1><p className="mt-1 text-sm text-muted-foreground">Three heads. One seal. One shared health pool.</p></div></div>
            <Button variant="ghost" size="icon" aria-label={muted ? 'Enable creature sounds' : 'Mute creature sounds'} aria-pressed={muted} onClick={() => { scene.current?.setMuted(!muted); setMuted(!muted) }}>{muted ? <VolumeX /> : <Volume2 />}</Button>
          </div>
          <MonsterFamilyRoster familyId="vaelrith" />
          <div className="border-b px-4 py-3 md:px-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1 text-sm"><span className="flex items-center gap-2 font-semibold"><Skull className="size-4" />{report.hp.toLocaleString()} / {VAELRITH.maxHp.toLocaleString()} HP</span><span className="tabular-nums text-muted-foreground">×{bars.remaining} bars · {bars.active.toLocaleString()} / {VAELRITH.hpPerBar.toLocaleString()}</span></div>
            <Progress value={bars.active / VAELRITH.hpPerBar * 100} aria-label="Current boss health bar" className="h-3 rounded-sm [&_[data-slot=progress-indicator]]:bg-violet-500" />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span className="capitalize">{report.phase} · {status}</span><span>Player · {report.playerHp} / 100 HP</span></div>
            <p role="status" aria-live="polite" aria-atomic="true" className="mt-2 min-h-4 text-xs font-medium text-foreground">{report.feedback || 'Confirmed hits show impact sprites and damage numbers on the affected target.'}</p>
          </div>
          {view === 'encounter' && <div className="space-y-2 border-b px-4 py-3 md:px-6">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Compare boss appearance">
              {comparisonModes.map(mode => <Button key={mode.id} size="sm" variant={representation === mode.id ? 'secondary' : 'outline'} aria-pressed={representation === mode.id} onClick={() => selectRepresentation(mode.id)}>{mode.label}</Button>)}
              <span className="text-xs text-muted-foreground">Same HP, attacks, player and hit feedback</span>
            </div>
            <p className="text-xs text-muted-foreground">{selectedMode.description} Switching unloads the current version and resets the encounter.</p>
          </div>}
          <div className="flex items-center justify-between gap-3 border-b px-4 py-2 md:px-6">
            <Tabs value={view} onValueChange={switchView}><TabsList variant="line" aria-label="Monster workspace"><TabsTrigger value="encounter">Encounter</TabsTrigger><TabsTrigger value="artwork">Artwork</TabsTrigger><TabsTrigger value="portrait">Portrait</TabsTrigger></TabsList></Tabs>
            {view === 'encounter' ? <Button variant="ghost" size="icon" aria-label="Restore camera view" onClick={() => scene.current?.view()}><Focus /></Button> : <Button variant="ghost" size="sm" onClick={() => setArtPlaying(!artPlaying)}>{artPlaying ? <Pause /> : <Play />}{artPlaying ? 'Pause art' : 'Play art'}</Button>}
          </div>
          <div className="relative flex min-h-[380px] flex-1 items-center justify-center overflow-auto bg-muted/35 p-2 md:min-h-[400px]">
            <div ref={host} className={view === 'encounter' ? 'flex h-full min-h-[360px] w-full items-center justify-center overflow-auto' : 'hidden'} />
            {!previewLoaded && view === 'encounter' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-auto p-4"><img src={VAELRITH.assets + 'poster.webp'} width={384} height={256} alt="Approved illustration of Vaelrith's three armored heads emerging from the sanctuary wall" className="h-64 w-96 shrink-0 object-contain [image-rendering:pixelated]" /><Button onClick={() => setPreviewLoaded(true)}><Play />Load {selectedMode.label} boss</Button><p className="max-w-sm text-center text-xs text-muted-foreground">Only the selected version loads. The player and arena stay in 3D. Full 3D uses the same creature rig with solid materials; hit and fire effects retain their sprites.</p></div>}
            {view === 'artwork' && <div className="w-full max-w-xl"><IllustrationPreview illustration={vaelrithIllustration} playing={artPlaying} /></div>}
            {view === 'portrait' && <div className="flex flex-col items-center gap-5"><Artwork expression={expression} playing={artPlaying} /><div className="flex gap-2">{expressions.map((name, i) => <Button key={name} variant={expression === i ? 'secondary' : 'ghost'} size="sm" aria-pressed={expression === i} onClick={() => setExpression(i)}>{name}</Button>)}</div></div>}
            {previewLoaded && !ready && !error && view === 'encounter' && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-background/90"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />Loading {selectedMode.label} boss and player…</div>}
            {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-6 text-center"><p className="max-w-md text-sm">{error}</p><Button variant="outline" onClick={() => setEpoch(e => e + 1)}><RotateCcw />Retry preview</Button></div>}
          </div>
          <div className="space-y-3 border-t px-4 py-3 md:px-6">
            <div className="flex flex-wrap gap-2">
              <Button disabled={!ready || !!error || report.defeated || report.playerHp <= 0 || view !== 'encounter'} onClick={() => report.running ? scene.current?.pause() : scene.current?.start()}>{report.running ? <Pause /> : <Play />}{report.running ? 'Pause encounter' : 'Start encounter'}</Button>
              <Button variant="outline" disabled={!ready} onClick={() => scene.current?.reset()}><RotateCcw />Reset</Button>
              {previewLoaded && <Button variant="ghost" onClick={unload}>Unload preview</Button>}
              <Button variant="outline" disabled={!report.running || report.weaponCooldown > 0} onClick={() => scene.current?.useWeapon('primary')}><Swords />Strike · J</Button>
              <Button variant="outline" disabled={!report.running || report.ultimateCooldown > 0} onClick={() => scene.current?.useWeapon('special')}>Ultimate · K</Button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-muted-foreground">WASD move · Shift run · J strike · K ultimate · Esc pause · {representation !== 'layered-2d' ? 'Drag to inspect' : 'Scroll to zoom'}<br />Amber stays at her actual model scale. Move close to a seal or a lowered, glowing throat.</p>
              <div className="grid grid-cols-3 gap-1" aria-label="Movement controls">{[[0,-1,ArrowUp,'Move forward'],[-1,0,ArrowLeft,'Move left'],[0,1,ArrowDown,'Move backward'],[1,0,ArrowRight,'Move right']].map(([x,z,Icon,label], i) => { const ControlIcon = Icon as typeof ArrowUp; return <Button key={String(label)} variant="outline" size="icon-sm" className={i === 0 ? 'col-start-2' : i === 1 ? 'col-start-1 row-start-2' : 'row-start-2'} disabled={!report.running} aria-label={String(label)} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); scene.current?.move(Number(x), Number(z)) }} onPointerUp={() => scene.current?.move(0,0)} onPointerCancel={() => scene.current?.move(0,0)} onLostPointerCapture={() => scene.current?.move(0,0)}><ControlIcon /></Button> })}</div>
            </div>
          </div>
        </section>
        <aside className="space-y-6 border-t bg-background p-5 xl:overflow-y-auto xl:border-l xl:border-t-0">
          <section><h2 className="font-heading text-xl font-bold">The broken sanctuary</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{VAELRITH.biography}</p></section>
          <section><h2 className="flex items-center gap-2 font-heading text-xl font-bold"><Shield className="size-4" />Weaknesses</h2><ul className="mt-2 space-y-3 text-sm"><li><strong>Exhausted throat</strong><p className="text-muted-foreground">After an attack, the committed head lowers into reach. A cyan floor ring marks the target: 2× damage, ignoring armor.</p></li><li><strong>Fractured seal</strong><p className="text-muted-foreground">Hit a socket crystal after Seal Rupture to stagger all heads for 2.2 seconds. Armored seals take half damage.</p></li></ul></section>
          <section><h2 className="font-heading text-xl font-bold">Attack rehearsal</h2><p className="mt-1 text-xs text-muted-foreground">Amber tiles warn; red tiles deal damage. Buttons request a move when the boss is ready.</p><div className="mt-3 space-y-2">{(Object.entries(ATTACKS) as [AttackId, typeof ATTACKS[AttackId]][]).map(([id, attack]) => { const cooldown = report.cooldowns[id] ?? 0, locked = id === 'seal-rupture' && report.phase !== 'riftstorm'; return <div key={id}><Button className="w-full justify-between" variant="outline" size="sm" disabled={!report.running || !!report.cast || report.window === 'stagger' || cooldown > 0 || locked} onClick={() => scene.current?.attack(id)}><span>{attack.name}</span><span className="text-xs text-muted-foreground">{locked ? 'Phase 3' : cooldown > 0 ? Math.ceil(cooldown / 1000) + 's' : attack.preparation / 1000 + 's tell'}</span></Button></div> })}</div>{report.cast && <p className="mt-2 text-xs capitalize text-muted-foreground">{ATTACKS[report.cast].name} · {report.window}</p>}</section>
          <section><h2 className="font-heading text-xl font-bold">Encounter log</h2><ol className="mt-2 space-y-2 text-xs text-muted-foreground">{report.log.map((entry, index) => <li key={index + entry}>{entry}</li>)}</ol></section>
          <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">Local fictional-combat comparison. No account inventory, community animals or Kibble are changed. Both versions use the same encounter rules. Runtime review is pending.</p>
        </aside>
      </div>
    </main>
  </PlayShell>
}
