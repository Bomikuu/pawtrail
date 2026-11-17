import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowDown, ArrowRight, ArrowUp, Flame, Focus, Heart, LoaderCircle, Pause, Play, RotateCcw, Shield, ShieldOff, Swords, Volume2, VolumeX, Wind } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { PlayHeader, PlayShell } from './shared/play-chrome'
import { CharacterIcon } from './shared/character-icon'
import { navigatePlay, navigateMonsterStudio, navigateHydraArena, navigateSerpentArena, navigateReaperArena, navigateDeityArena, navigateRobotArena } from '@/game/play-navigation'
import { ARENA_DEFINITIONS } from '@/game/monsters/arena-definitions'
import type { ArenaDefinition, ArenaVariant } from '@/game/monsters/arena-contract'
import { familyMember, familyArena, familyForVariant } from '@/game/monsters/family-catalog'
import { MonsterFamilyRoster } from './monster-family-roster'
import { MonsterFamilyPortrait } from './monster-family-portrait'
import { RobotObjectives } from './robot-objectives'
import type { HydraScene, HydraSceneReport } from '@/game/monsters/hydra-scene'
const arenaNavigation = { hydra: navigateHydraArena, serpent: navigateSerpentArena, reaper: navigateReaperArena, deity: navigateDeityArena, robot:navigateRobotArena }

const initial: HydraSceneReport = { hp: 0, playerHp: 100, running: false, enraged: false, window: 'idle', cast: null, progress: 0, fireCooldown: 0, stompCooldown: 0, log: ['Local fictional-combat arena.'], phaseElapsed: 9999, weak: false, feedback: '', weaponCooldown: 0, ultimateCooldown: 0, cooldowns: {} }
function HydraArtwork({ enraged, playing, definition }: { enraged: boolean; playing: boolean; definition: ArenaDefinition }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current!, context = canvas.getContext('2d')!, img = new Image(), reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0, cancelled = false, last = 0
    const draw = (time: number) => {
      if (cancelled) return
      if (time - last > 1000 / 24) {
        last = time; context.imageSmoothingEnabled = false; context.clearRect(0, 0, 384, 384)
        const breath = !playing || reduced.matches || document.hidden ? 0 : Math.sin(time / 450) * 1.2
        context.drawImage(img, 0, -breath, 384, 384 + breath)
      }
      if (playing && !reduced.matches) raf = requestAnimationFrame(draw)
    }
    img.onload = () => draw(performance.now() + 100); img.src = definition.assets + (enraged ? 'enraged.webp' : 'normal.webp')
    return () => { cancelled = true; cancelAnimationFrame(raf); img.onload = null }
  }, [enraged, playing, definition.assets])
  return <canvas ref={ref} width={384} height={384} role="img" aria-label={`${definition.name} ${enraged ? 'enraged' : 'normal'} breathing illustration`} className="mx-auto size-64 [image-rendering:pixelated]" />
}
/** Shared roaming-boss workspace; each entry supplies its own rig and simulation. */
export default function HydraStudio({ variant = 'hydra', creatureId }: { variant?: ArenaVariant; creatureId?: string }) {
  const selected = creatureId ? familyMember(creatureId) : null
  const definition = selected ? familyArena(selected.family, selected.creature) : ARENA_DEFINITIONS[variant]
  const colossus = variant === 'deity' && !selected
  const [following, setFollowing] = useState(false)
  const host = useRef<HTMLDivElement>(null), scene = useRef<HydraScene | null>(null)
  const [report, setReport] = useState(() => ({ ...initial, hp: definition.maxHp })), [loaded, setLoaded] = useState(false), [ready, setReady] = useState(false), [error, setError] = useState(''), [epoch, setEpoch] = useState(0), [muted, setMuted] = useState(false)
  const muteRef = useRef(muted); muteRef.current = muted
  useEffect(() => {
    if (!loaded || !host.current) return
    let cancelled = false, mounted: HydraScene | undefined; const controller = new AbortController()
    setReady(false); setError('')
    import('@/game/monsters/hydra-scene').then(module => module.HydraScene.create(host.current!, value => { if (!cancelled) setReport(value) }, message => { if (!cancelled) setError(message) }, controller.signal, variant, creatureId))
      .then(value => { if (cancelled) value.dispose(); else { mounted = value; scene.current = value; value.setMuted(muteRef.current); setReady(true) } })
      .catch(failure => { if (!cancelled) setError(failure instanceof Error ? failure.message : 'The boss could not load.') })
    return () => { cancelled = true; controller.abort(); mounted?.dispose(); if (scene.current === mounted) scene.current = null }
  }, [loaded, epoch, variant, creatureId])
  const bars = Math.ceil(report.hp / definition.hpPerBar), active = report.hp > 0 ? (report.hp - 1) % definition.hpPerBar + 1 : 0
  const status = report.hp <= 0 ? 'Defeated' : report.playerHp <= 0 ? 'Amber down' : report.running ? report.window : 'Paused'
  return <PlayShell>
    <PlayHeader location={selected ? selected.creature.tier === 'mini-boss' ? 'Mini-boss arena' : 'Monster arena' : 'Boss arena'} details={definition.name + " · local encounter"} balance={null} scope="local"><Button size="sm" variant="outline" onClick={() => navigatePlay('explore')}><ArrowLeft />Back to game</Button></PlayHeader>
    <main className="min-h-0 flex-1 overflow-auto">
      <div className="mx-auto grid max-w-[1600px] xl:h-full xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="flex min-w-0 flex-col xl:min-h-0">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="flex items-center gap-3"><CharacterIcon src={definition.assets + 'icon.png'} active /><div><h1 className="font-heading text-3xl font-bold leading-none">{definition.name}<span className="ml-2 text-base text-muted-foreground">{definition.title}</span></h1><p className="mt-1 text-xs text-muted-foreground">{definition.summary}</p></div></div>
            <div className="flex flex-wrap items-center gap-1">{(Object.keys(ARENA_DEFINITIONS) as ArenaVariant[]).filter(id => !!selected || id !== variant).map(id => <Button key={id} variant="outline" size="sm" onClick={arenaNavigation[id]}>{ARENA_DEFINITIONS[id].name}</Button>)}<Button variant="ghost" size="sm" onClick={navigateMonsterStudio}>Vaelrith</Button><Button variant="ghost" size="icon" aria-label={muted ? 'Enable sound' : 'Mute sound'} aria-pressed={muted} onClick={() => { setMuted(!muted); scene.current?.setMuted(!muted) }}>{muted ? <VolumeX /> : <Volume2 />}</Button></div>
          </header>
          <MonsterFamilyRoster familyId={selected?.family.id ?? familyForVariant[variant]} selectedId={creatureId} />
          <div className="space-y-2 border-b px-5 py-3">
            <div className="flex justify-between gap-2 text-sm"><strong className="flex items-center gap-2"><Heart className="size-4" />{report.hp.toLocaleString()} / {definition.maxHp.toLocaleString()} HP</strong><span className={report.enraged ? 'font-semibold text-red-700 dark:text-red-400' : 'text-muted-foreground'}>{report.enraged ? 'ENRAGED' : 'Watchful'} · {status}</span></div>
            <Progress value={report.hp / definition.maxHp * 100} aria-label="Boss total health" className="h-2 rounded-sm [&_[data-slot=progress-indicator]]:bg-emerald-600" />
            <div className="flex justify-between text-xs text-muted-foreground"><span>{bars} × {definition.hpPerBar} HP bars · {active} in current bar</span><span>Amber · {report.playerHp} / 100 HP</span></div>
            <Progress value={report.playerHp} aria-label="Amber health" className="h-1 rounded-sm [&_[data-slot=progress-indicator]]:bg-orange-500" />
            {report.components&&<p role="status" aria-label="Body shield state" className="flex items-center gap-2 text-xs font-semibold">{report.shielded?<Shield className="size-4 text-cyan-700"/>:<ShieldOff className="size-4 text-emerald-700"/>}{report.shielded?`${report.components.filter(f=>f.hp>0).length} / 4 funnels online · BODY SHIELDED`:'0 / 4 funnels online · SHIELD DOWN — BODY VULNERABLE'}</p>}
            <p role="status" aria-live="polite" className="min-h-4 text-xs">{report.feedback || 'Confirmed hits show contact sprites, applied damage and HP changes.'}</p>
          </div>
          <div className="relative flex min-h-[490px] flex-1 items-center justify-center overflow-auto" style={{ backgroundColor: definition.arena.backdrop }}>
            <div ref={host} className="flex h-full min-h-[480px] w-full items-center justify-center overflow-auto" />
            {!loaded && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-5"><HydraArtwork enraged={false} playing definition={definition} /><Button onClick={() => setLoaded(true)}><Play />Load {selected ? 'creature' : 'boss'} arena</Button><p className="max-w-sm text-center text-xs text-muted-foreground">Play as Amber with her actual model, shared movement and equipped sword. Scroll to zoom.</p></div>}
            {loaded && !ready && !error && <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 bg-background/95"><LoaderCircle className="size-5 animate-spin motion-reduce:animate-none" />Loading illustrated rig, Amber and hit effects…</div>}
            {error && <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/95 p-5"><p className="max-w-md text-center text-sm">{error}</p><Button onClick={() => setEpoch(n => n + 1)}>Retry arena</Button></div>}
            {report.enraged && report.running && report.phaseElapsed < 2600 && <div className="pointer-events-none absolute bottom-4 left-3 w-44 border-l-4 border-orange-400 bg-background/95 p-2 shadow-xl motion-safe:animate-in motion-safe:slide-in-from-left-8"><img src={definition.assets + 'enraged.webp'} alt={definition.name + " reveals its enraged form"} width={384} height={384} className="w-full [image-rendering:pixelated]" /><p className="font-heading text-xl font-bold text-red-700">{definition.phaseName}</p><p className="text-xs">{definition.phaseDescription}</p></div>}
          </div>
          <footer className="space-y-3 border-t px-5 py-3">
            <div className="flex flex-wrap gap-2"><Button disabled={!ready || !!error || report.hp <= 0 || report.playerHp <= 0} onClick={() => report.running ? scene.current?.pause() : scene.current?.start()}>{report.running ? <Pause /> : <Play />}{report.running ? 'Pause encounter' : 'Start encounter'}</Button><Button variant="outline" disabled={!ready} onClick={() => { scene.current?.reset(); if (colossus) { scene.current?.view(); setFollowing(false) } }}><RotateCcw />Reset</Button><Button variant="outline" disabled={!report.running || report.weaponCooldown > 0} onClick={() => scene.current?.useWeapon('primary')}><Swords />Strike · J</Button><Button variant="outline" disabled={!report.running || report.ultimateCooldown > 0} onClick={() => scene.current?.useWeapon('special')}>Ultimate · K</Button><Button variant="ghost" size="icon" aria-label="Reset camera" disabled={!ready} onClick={() => { scene.current?.view(); setFollowing(false) }}><Focus /></Button>{colossus && <Button variant="outline" disabled={!ready} aria-pressed={following} onClick={() => { scene.current?.followPlayer(!following); setFollowing(!following) }}><Focus />{following ? "Fit colossus" : "Follow Amber"}</Button>}</div>
            <div className="flex items-center justify-between gap-3"><p className="text-xs leading-relaxed text-muted-foreground">WASD / arrows move · Shift run · J strike · K ultimate · Esc pause<br />{definition.instructions}</p><div className="grid shrink-0 grid-cols-3 gap-1" aria-label="Touch movement">{[[0,-1,ArrowUp,'Move forward'],[-1,0,ArrowLeft,'Move left'],[0,1,ArrowDown,'Move backward'],[1,0,ArrowRight,'Move right']].map(([x,z,Icon,label], i) => { const I = Icon as typeof ArrowUp; return <Button key={String(label)} size="icon-sm" variant="outline" disabled={!report.running} className={i === 0 ? 'col-start-2' : i === 1 ? 'col-start-1 row-start-2' : 'row-start-2'} aria-label={String(label)} onPointerDown={event => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); scene.current?.move(Number(x), Number(z)) }} onPointerUp={() => scene.current?.move(0,0)} onLostPointerCapture={() => scene.current?.move(0,0)} onPointerCancel={() => scene.current?.move(0,0)}><I /></Button> })}</div></div>
          </footer>
        </section>
        <aside className="space-y-5 border-t bg-background p-5 xl:overflow-auto xl:border-l xl:border-t-0">
          <RobotObjectives report={report} bodyId={definition.id+':body'} target={id=>scene.current?.target(id)}/>
          <section><h2 className="font-heading text-xl font-bold">{report.enraged ? definition.enragedTitle : definition.normalTitle}</h2><HydraArtwork enraged={report.enraged} playing={report.running} definition={definition} /><p className="text-sm leading-relaxed text-muted-foreground">{definition.biography}</p>{(selected || colossus || variant==='robot') && <MonsterFamilyPortrait assets={definition.assets} state={report.portraitState ?? report.window} playing={report.running} enraged={report.enraged} />}{colossus && <p className="mt-3 rounded-md border p-3 text-xs text-muted-foreground">Largest authored silhouette: about 30× player height, 28× halo span. The ruler uses Amber’s unchanged world height. Wide view supports right-drag pan and wheel zoom.</p>}</section>
          <section className="space-y-2"><h2 className="flex items-center gap-2 font-heading text-xl font-bold"><Shield className="size-4" />Read the opening</h2><p className="text-sm text-muted-foreground">{definition.weakness}</p><div className="rounded-md border p-3 text-xs"><strong>{report.weak ? definition.opening : 'Wait for attack recovery'}</strong><p className="mt-1 text-muted-foreground">{definition.enrageAt > 0 ? `Enrage triggers once at ${Math.round(definition.enrageAt * 100)}% HP (${definition.maxHp * definition.enrageAt}). Reset restores normal form.` : 'Normal mob · one attack and a recovery opening. Reset restores full health.'}</p></div></section>
          <section className="space-y-3"><h2 className="font-heading text-xl font-bold">Attack rehearsal</h2>{definition.attacks.map((attack, index) => { const id = attack.id, cooldown = report.cooldowns[id] ?? 0; return <div key={id}><Button size="sm" variant="outline" className="w-full justify-between" disabled={!report.running || !!report.cast || report.window === 'enraging' || cooldown > 0} onClick={() => scene.current?.attack(id)}><span className="flex items-center gap-2">{index === 0 ? variant === 'hydra' ? <Flame /> : <Swords /> : <Wind />}{attack.name}</span>{cooldown > 0 && <span>{Math.ceil(cooldown / 1000)}s</span>}</Button><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{attack.description}</p></div> })}{definition.enrageAt > 0 && <><Button size="sm" variant="secondary" className="w-full" disabled={!ready || report.enraged || report.hp <= 0 || report.shielded === true} onClick={() => scene.current?.enrage()}><Flame />Rehearse low-HP enrage</Button><p className="text-xs text-muted-foreground">{report.components ? 'Destroy all funnels first. Rehearsal then sets body HP to 30%; it never bypasses the shield or revives funnels.' : 'Sets local boss HP to 30%; this is a phase rehearsal, not a damaging hit.'}</p></>}</section>
          <section><h2 className="font-heading text-xl font-bold">Encounter log</h2><ol className="mt-2 space-y-2 text-xs text-muted-foreground">{report.log.map((line, i) => <li key={line + i}>{line}</li>)}</ol></section>
          <p className="border-t pt-3 text-xs text-muted-foreground">Local fictional combat. No community animal, account inventory or verified Kibble is changed. {selected ? 'Fixed-view authored sprite poses' : 'Fixed-view layered art'}; scroll to zoom.</p>
        </aside>
      </div>
    </main>
  </PlayShell>
}
