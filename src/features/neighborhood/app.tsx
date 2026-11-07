'use client'
import HomesApp from '@/features/neighborhood/components/game/housing/app'
import './game/theme.css'
import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  lazy,
  Suspense,
  type ReactNode,
} from 'react'
import {
  Home,
  Backpack,
  BookOpen,
  Check,
  CircleHelp,
  Compass,
  Expand,
  Leaf,
  MapPin,
  Map as MapIcon,
  Camera,
  Sun,
  Moon,
  Volume2,
  Minus,
  Pause,
  PawPrint,
  Plus,
  RotateCw,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GameCanvas } from '@/features/neighborhood/components/game/game-canvas'
import { TouchControls } from '@/features/neighborhood/components/game/touch-controls'
import { ContextActions } from '@/features/neighborhood/components/game/context-actions'
import { PlatformAnimals } from '@/features/neighborhood/components/game/platform-animals'
import type { PlatformBridge } from '@/features/neighborhood/game/platform'
import { GamePanels, type Panel } from '@/features/neighborhood/components/game/panels'
import { gameStore, publish, questDone, send } from '@/features/neighborhood/game/store'
import { QUESTS } from '@/features/neighborhood/game/types'
import { questState, questKey } from '@/features/neighborhood/game/systems/quests'
import { clockLabel, dayPhase } from '@/features/neighborhood/game/systems/time'
import { audio } from '@/features/neighborhood/game/systems/audio'
import { MissionTracker, localMissions } from '@/features/neighborhood/components/game/immersion/missions'
import { track } from '@/features/neighborhood/game/store'
import { worldConditions, weatherLabel } from '@/features/neighborhood/game/immersion-data'
const CommunityMap = lazy(() => import('@/features/neighborhood/components/game/community/app'))
function GameApp({ platform }: { platform?: PlatformBridge }) {
  const [visitingShelter, setVisitingShelter] = useState<import('@/features/neighborhood/game/community').CommunityPlace | null>(null)
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('shelterId')
    if (!id || !platform?.places) return
    const abort = new AbortController()
    platform.places(abort.signal).then((places) => {
      if (!abort.signal.aborted) setVisitingShelter(places.find((place) => place.entry.kind === 'shelter' && place.entry.shelterId === id) ?? null)
    }).catch(() => {})
    return () => abort.abort()
  }, [platform])
  useEffect(() => {
    document.body.dataset.pawtrailGame = 'true'
    return () => {
      delete document.body.dataset.pawtrailGame
    }
  }, [])
  const state = useSyncExternalStore(gameStore.subscribe, gameStore.getSnapshot)
  const [panel, setPanel] = useState<Panel>(null),
    [attempt, setAttempt] = useState(0)
  const [toast, setToast] = useState('')
  const [trackerOpen,setTrackerOpen]=useState(false)
  const previous = useRef({
    notice: state.notice,
    badges: state.progress.badges.length,
  })
  useEffect(() => {
    const unlocked = state.progress.badges.length > previous.current.badges
    const changed = state.notice !== previous.current.notice
    previous.current = {
      notice: state.notice,
      badges: state.progress.badges.length,
    }
    if (!unlocked && !changed) return
    if (unlocked) audio.effect('achievement')
    setToast(
      unlocked
        ? 'Achievement unlocked: ' + state.progress.badges.at(-1)
        : state.notice,
    )
    const timer = setTimeout(() => setToast(''), 4500)
    return () => clearTimeout(timer)
  }, [state.notice, state.progress.badges.length])
  const paused = !!panel || !!state.dialogue || !!state.platformAnimalRequest || trackerOpen
  useEffect(() => {
    if (state.phase === 'ready') send({ type: 'pause', paused })
  }, [paused, state.phase])
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        ['Escape', 'j', 'J', 'i', 'I', 'm', 'M'].includes(event.key) &&
        !event.defaultPrevented &&
        !panel &&
        !state.dialogue &&
        !state.platformAnimalRequest &&
        state.phase === 'ready'
      ) {
        event.preventDefault()
        setPanel(
          event.key.toLowerCase() === 'j'
            ? 'journal'
            : event.key.toLowerCase() === 'i'
              ? 'bag'
              : event.key.toLowerCase() === 'm'
                ? 'map'
                : 'pause',
        )
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panel, state.dialogue, state.phase, state.platformAnimalRequest])
  const done = QUESTS.filter(
    (q) => q.category === 'main' && questDone(state.progress, q.id),
  ).length
  const active =
    QUESTS.find(
      (q) =>
        q.id === state.progress.trackedQuest &&
        questState(state.progress, q) === 'active',
    ) ??
    QUESTS.find((q) => questState(state.progress, q) === 'active') ??
    QUESTS.find(
      (q) =>
        q.category === 'main' && questState(state.progress, q) === 'available',
    )
  const objective = active?.objectives.find(
    (o, i) =>
      (state.progress.quests[questKey(active, state.progress)]?.counts[i] ??
        0) < (o.count ?? 1),
  )
  useEffect(() => {
    const gesture = () => {
      void audio.unlock()
    }
    window.addEventListener('pointerdown', gesture, { once: true })
    window.addEventListener('keydown', gesture, { once: true })
    return () => {
      window.removeEventListener('pointerdown', gesture)
      window.removeEventListener('keydown', gesture)
      audio.dispose()
    }
  }, [])
  useEffect(() => {
    const latest = state.progress.activities[0]
    if (
      latest &&
      ['quest', 'accept', 'upgrade', 'collect', 'discover'].includes(
        latest.kind,
      )
    )
      audio.effect(latest.kind)
  }, [state.progress.activities[0]?.id])
  useEffect(() => {
    const requested = state.panelRequest
    if (requested) {
      setPanel(requested as Panel)
      publish({ panelRequest: null })
    }
  }, [state.panelRequest])
  const iconButton = (
    label: string,
    Icon: typeof Backpack,
    action: () => void,
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 rounded-lg md:size-10"
          aria-label={label}
          disabled={state.phase !== 'ready'}
          onClick={action}
        >
          <Icon className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
  const fullscreen = () => {
    if (document.fullscreenElement)
      void document
        .exitFullscreen()
        .catch(() =>
          publish({ notice: 'Fullscreen is unavailable in this browser.' }),
        )
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() =>
          publish({ notice: 'Fullscreen is unavailable in this browser.' }),
        )
  }
  return (
    <TooltipProvider delayDuration={150}>
      <div
        className="pawtrail-game flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground"
        style={
          {
            '--background': '#fff8ed',
            '--foreground': '#38271e',
            '--card': '#fffcf5',
            '--primary': '#a54922',
            '--primary-foreground': '#fffaf2',
            '--muted-foreground': '#756657',
          } as React.CSSProperties
        }
      >
        <header className="relative z-20 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <img
              src="/pawtrail-game/game-assets/portraits/rescuer.png"
              width="32"
              height="32"
              alt=""
              className="size-8 [image-rendering:pixelated]"
            />
            <div>
              <h1 className="font-heading text-xl font-black leading-none max-[420px]:sr-only md:text-2xl">
                Paw<span className="text-primary">Trail</span>
              </h1>
              <p className="mt-1 hidden text-[10px] text-muted-foreground lg:block">
                A little care goes a long way.
              </p>
            </div>
          </div>
          <p className="hidden items-center gap-2 text-sm font-medium text-muted-foreground md:flex">
            <MapPin className="size-4" />
            {state.scene === 'shelter'
              ? visitingShelter ? visitingShelter.name + ' · virtual visit' : 'PawTrail shelter'
              : 'Sampaguita neighborhood'}
            <span className="ml-3 flex items-center gap-1.5 text-xs">
              {dayPhase(state.progress.minute) === 'night' ? (
                <Moon className="size-3.5" />
              ) : (
                <Sun className="size-3.5 text-primary" />
              )}
              {clockLabel(state.progress.minute)} · Day {state.progress.day} · {weatherLabel(worldConditions(state.progress.day*1440+state.progress.minute).weather)}
            </span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            <Button asChild variant="outline" size="sm" className="size-9 p-0 sm:w-auto sm:px-3"><a href={(window.location.pathname === '/' ? '/' : '/play') + '?map=community'} onClick={() => send({ type: 'pause', paused: true })} aria-label="Open community map"><MapPin className="size-4" /><span className="hidden sm:inline">Explore places</span></a></Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="size-9 p-0 sm:w-auto sm:px-3"
            >
              <a href="/play?home=me" aria-label="Go Home">
                <Home className="size-4" />
                <span className="hidden sm:inline">Go Home</span>
              </a>
            </Button>
            <PlatformAnimals
              bridge={platform}
              request={state.platformAnimalRequest}
            />
            <div className="mr-1 flex items-center gap-1 rounded-full bg-[#f4e4bc] px-2 py-1.5 md:mr-3 md:px-3">
              <img
                src="/pawtrail-game/game-assets/portraits/kibble_coin_0.png"
                width="24"
                height="24"
                alt=""
                className="size-6 [image-rendering:pixelated]"
              />
              <span
                className="text-sm font-extrabold tabular-nums"
                aria-label={state.progress.kibble + ' Kibble'}
              >
                {state.progress.kibble}
              </span>
              <span className="hidden text-xs sm:inline">Kibble</span>
            </div>
            {iconButton('Pause', Pause, () => setPanel('pause'))}
            {window.location.pathname.startsWith('/play') && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden lg:inline-flex"
              >
                <a href="/community">Community</a>
              </Button>
            )}
          </div>
        </header>
        <main
          className="relative min-h-0 flex-1 overflow-hidden"
          aria-label="Explore the PawTrail neighborhood"
        >
          <GameCanvas attempt={attempt} />
          {toast && state.phase === 'ready' && (
            <div
              key={toast}
              className="pointer-events-none absolute right-16 top-4 z-20 max-w-[min(20rem,calc(100%-5rem))] rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-md animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none"
              aria-hidden="true"
            >
              {toast}
            </div>
          )}
          {state.phase === 'ready' && (
            <>
              <MissionTracker onModalChange={setTrackerOpen} missions={localMissions(state.progress)} pinned={state.progress.trackedQuest} onPin={track} onDetails={()=>setPanel('board')} onGuide={(target)=>send({type:'guide',target})} />
              <div className="absolute right-4 top-4 z-10 flex flex-col gap-1 rounded-xl border border-[#d5c5a8] bg-card p-1 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Zoom in"
                  onClick={() => send({ type: 'zoom', amount: 1 })}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  aria-label="Zoom out"
                  onClick={() => send({ type: 'zoom', amount: -1 })}
                >
                  <Minus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden size-8 md:inline-flex"
                  aria-label="Toggle fullscreen"
                  onClick={fullscreen}
                >
                  <Expand className="size-4" />
                </Button>
              </div>
              <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden max-w-56 rounded-lg border bg-card px-3 py-2 text-[10px] leading-relaxed text-muted-foreground lg:block">
                <p>
                  <kbd>WASD</kbd> / arrows to walk · <kbd>E</kbd> to interact
                </p>
                <p>Click a clear spot to walk there.</p>
                <p className="mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="size-3" />
                  {state.save === 'saved'
                    ? 'Saved on this device'
                    : 'Saving unavailable — export from Pause'}
                </p>
              </div>
              <ContextActions state={state} />
              <TouchControls disabled={paused || state.busy} />
            </>
          )}
          {state.phase === 'loading' && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-background">
              <div className="w-[min(20rem,calc(100%-3rem))] text-center">
                <img
                  src="/pawtrail-game/game-assets/portraits/rescuer.png"
                  alt=""
                  className="mx-auto mb-5 h-24 w-16 [image-rendering:pixelated]"
                />
                <h2 className="font-heading text-2xl font-extrabold">
                  A neighborhood of little stories.
                </h2>
                <p className="mb-5 mt-2 text-sm text-muted-foreground">
                  Preparing the paths and waking the paws…
                </p>
                <Progress value={state.load * 100} />
                <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <PawPrint className="size-4 motion-safe:animate-pulse" />
                  {Math.round(state.load * 100)}% ready to explore
                </p>
              </div>
            </div>
          )}
          {state.phase === 'error' && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-background p-6">
              <div className="max-w-sm text-center">
                <PawPrint className="mx-auto mb-4 size-10 text-primary" />
                <h2 className="text-2xl font-extrabold">
                  The path needs a moment.
                </h2>
                <p
                  className="my-4 text-sm leading-relaxed text-muted-foreground"
                  role="alert"
                >
                  {state.error}
                </p>
                <Button onClick={() => setAttempt((n) => n + 1)}>
                  <RotateCw className="size-4" />
                  Try the neighborhood again
                </Button>
              </div>
            </div>
          )}
        </main>
        <nav className="z-20 flex shrink-0 items-center justify-center gap-1 overflow-x-auto border-t bg-background px-2 py-1" aria-label="Exploration controls">
          {iconButton('Inventory',Backpack,()=>setPanel('bag'))}
          {iconButton('Community board',BookOpen,()=>setPanel('board'))}
          {iconButton('Quest journal',Compass,()=>setPanel('journal'))}
          {iconButton('World map',MapIcon,()=>setPanel('map'))}
          {iconButton('Cat Soundboard',PawPrint,()=>setPanel('soundboard'))}
          {iconButton('Settings',Pause,()=>setPanel('pause'))}
          {iconButton('Help',CircleHelp,()=>setPanel('help'))}
        </nav>
        <footer className="relative z-20 flex min-h-8 shrink-0 items-center justify-between gap-3 border-t bg-background px-3 py-1.5 text-[10px] md:px-5">
          <p className="min-w-0 truncate" role="status" aria-live="polite">
            {state.notice}
          </p>
          <span className="hidden shrink-0 text-muted-foreground sm:inline">
            Local prototype · non-cash Kibble
          </span>
        </footer>
        <GamePanels
          panel={panel}
          setPanel={setPanel}
          state={state}
          closeDialogue={() => publish({ dialogue: null })}
        />
      </div>
    </TooltipProvider>
  )
}
class GameErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <div className="grid min-h-dvh place-items-center bg-background p-6">
        <div className="max-w-sm text-center">
          <h1 className="text-2xl font-extrabold">
            Let’s find the path again.
          </h1>
          <p className="my-4 text-muted-foreground">
            The game encountered a problem. Your last saved progress stays on
            this device.
          </p>
          <Button onClick={() => window.location.reload()}>
            Reload PawTrail
          </Button>
        </div>
      </div>
    ) : (
      this.props.children
    )
  }
}
export default function App({ platform }: { platform?: PlatformBridge }) {
  if (new URLSearchParams(window.location.search).get('map') === 'community')
    return <GameErrorBoundary><Suspense fallback={<div className="grid h-dvh place-items-center bg-background text-sm" role="status">Opening the community map…</div>}><CommunityMap platform={platform} /></Suspense></GameErrorBoundary>
  if (new URLSearchParams(window.location.search).has('home'))
    return (
      <GameErrorBoundary>
        <HomesApp />
      </GameErrorBoundary>
    )
  return (
    <GameErrorBoundary>
      <GameApp platform={platform} />
    </GameErrorBoundary>
  )
}
