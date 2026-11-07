import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react'
import {
  ArrowLeft,
  BookHeart,
  BookOpen,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Heart,
  Home,
  LoaderCircle,
  Map,
  MessageCircle,
  PawPrint,
  Settings2,
  Smile,
  Sofa,
  Users,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  homes,
  action,
  editStart,
  enter,
  patch,
  scene,
  stop,
} from '@/features/neighborhood/game/housing/client'
import { audio } from '@/features/neighborhood/game/systems/audio'
import { SocialPanel } from './social'
import { PetsPanel } from './pets'
import { DecorationPanel } from './decoration'
import { HomePanels, type HomePanel } from './panels'
import { TouchControls } from '@/features/neighborhood/components/game/touch-controls'
import type { Person } from '@/features/neighborhood/game/housing/types'
import { MissionList, homeMissions } from '@/features/neighborhood/components/game/immersion/missions'
import { clockLabel } from '@/features/neighborhood/game/systems/time'
import { weatherLabel } from '@/features/neighborhood/game/immersion-data'
function HomeCanvas() {
  const host = useRef<HTMLDivElement>(null),
    [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false,
      game:
        | ReturnType<(typeof import('@/features/neighborhood/game/housing/scene'))['createHomeGame']>
        | undefined
    import('@/features/neighborhood/game/housing/scene')
      .then(({ createHomeGame }) => {
        if (!cancelled && host.current) {
          game = createHomeGame(host.current)
          game.events.once('homes-ready', () => setReady(true))
          game.events.once('destroy', () => setReady(false))
        }
      })
      .catch(() =>
        patch({
          status: 'error',
          error: 'The home renderer could not load. Reload PawTrail to retry.',
        }),
      )
    return () => {
      cancelled = true
      game?.destroy(true)
    }
  }, [])
  return (
    <>
      <div
        ref={host}
        className="absolute inset-0 overflow-hidden"
        aria-label="Interactive PawTrail home. WASD or arrows to walk. E to interact. Enter opens chat."
      />
      {!ready && (
        <div className="absolute inset-0 z-20 grid place-items-center bg-background">
          <div className="text-center">
            <PawPrint className="mx-auto mb-3 size-8 motion-safe:animate-pulse" />
            <p className="text-sm font-bold">Opening the door…</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Preparing your home’s pixel details.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
export default function HomesApp() {
  const state = useSyncExternalStore(homes.subscribe, homes.get),
    [panel, setPanel] = useState<HomePanel>(null),
    [left, setLeft] = useState(true),
    [right, setRight] = useState(true),
    [rightTab, setRightTab] = useState<'pets'|'missions'>('pets'),
    [mobile, setMobile] = useState<'social' | 'pets' | 'decoration' | null>(
      null,
    ),
    [socialTab, setSocialTab] = useState('friends'),
    [photoCountdown, setPhotoCountdown] = useState(false)
  useEffect(() => {
    document.body.dataset.pawtrailGame = 'true'
    const home = new URLSearchParams(window.location.search).get('home') || 'me'
    void enter(home)
    const visit = (event: Event) =>
      void enter((event as CustomEvent<string>).detail)
    window.addEventListener('pawtrail:home-visit', visit)
    const openPanel=(event:Event)=>setPanel((event as CustomEvent<HomePanel>).detail)
    window.addEventListener('pawtrail:home-panel',openPanel)
    const invitations = () => {
      setLeft(true)
      setSocialTab('invites')
      if (window.innerWidth < 1024) setMobile('social')
    }
    window.addEventListener('pawtrail:home-invites', invitations)
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches(
          'input,textarea,button,a,[role=tab],[role=switch],[role=slider],[contenteditable=true]',
        )
      )
        return
      if (homes.get().decoration) return
      if(event.key.toLowerCase()==='i'){event.preventDefault();setPanel('inventory')}
      if(event.key.toLowerCase()==='j'){event.preventDefault();setPanel('board')}
      if (event.key === 'Enter' && !event.defaultPrevented) {
        event.preventDefault()
        setLeft(true)
        setMobile('social')
        setSocialTab('chat')
        window.dispatchEvent(new Event('pawtrail:focus-chat'))
      }
      if (event.key.toLowerCase() === 'q' && !event.defaultPrevented)
        setPanel('emotes')
    }
    const unlock = () => void audio.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', keyboard)
    return () => {
      stop()
      audio.dispose()
      delete document.body.dataset.pawtrailGame
      window.removeEventListener('pawtrail:home-visit', visit)
      window.removeEventListener('pawtrail:home-panel',openPanel)
      window.removeEventListener('pawtrail:home-invites', invitations)
      window.removeEventListener('keydown', keyboard)
      window.removeEventListener('pointerdown', unlock)
    }
  }, [])
  useEffect(() => {
    if (state.chatWith) {
      setLeft(true)
      setSocialTab('chat')
      if (window.innerWidth < 1024) setMobile('social')
    }
  }, [state.chatWith])
  useEffect(() => {
    if (state.selectedPet) {
      setRight(true)
      if (window.innerWidth < 1024) setMobile('pets')
    }
  }, [state.selectedPet])
  useEffect(() => {
    if (state.selectedPlayer) setPanel('person')
  }, [state.selectedPlayer])
  useEffect(() => {
    if (state.decoration) {
      setLeft(true)
      if (window.innerWidth < 1024) setMobile('decoration')
    } else if (mobile === 'decoration') setMobile(null)
  }, [state.decoration])
  const takePhoto = () => {
    patch({ photoMode: true })
    setMobile(null)
    setPanel(null)
    setPhotoCountdown(true)
    setTimeout(() => {
      scene({ type: 'photo' })
      setPhotoCountdown(false)
    }, 250)
  }
  const icon = (
    label: string,
    Icon: typeof Home,
    onClick: () => void,
    disabled = false,
  ) => (
    <Tooltip key={label}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 flex-col gap-0.5 rounded-xl px-3 text-[10px] md:h-12"
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
  const data = state.data,
    house = data?.house,
    me = data?.player,
    isOwner = house?.id === me?.id
  const social = (
    <SocialPanel state={state} tab={socialTab} setTab={setSocialTab} />
  )
  return (
    <TooltipProvider delayDuration={150}>
      <div className="pawtrail-game flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
        {!state.photoMode && (
          <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 md:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Button
                asChild
                size="icon"
                variant="ghost"
                aria-label="Return to exploration"
              >
                <a href="/play">
                  <ArrowLeft className="size-4" />
                </a>
              </Button>
              <div className="min-w-0">
                <h1 className="truncate font-heading text-base font-extrabold md:text-lg">
                  {house?.name || 'PawTrail Homes'}
                </h1>
                <p className="hidden text-[10px] text-muted-foreground sm:block">
                  A little care makes a house a home.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {data?.world&&<span className="hidden text-xs text-muted-foreground md:inline">{clockLabel(Math.floor(data.world.minute))} · {weatherLabel(data.world.weather)}</span>}
              {me?.sample && (
                <Badge
                  variant="secondary"
                  className="hidden text-[10px] sm:inline-flex"
                >
                  Sample community
                </Badge>
              )}
              <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-xs font-bold tabular-nums">
                <Coins className="size-3.5 text-primary" />
                {me?.wallet ?? '—'}
                <span className="hidden md:inline">game Kibble</span>
              </span>
              <span className="sr-only" role="status">
                {state.status}
              </span>
              {state.status === 'online' ? (
                <Wifi
                  className="size-4 text-emerald-700"
                  aria-label="Live connection"
                />
              ) : (
                <WifiOff
                  className="size-4 text-muted-foreground"
                  aria-label="Disconnected"
                />
              )}
            </div>
          </header>
        )}
        <div className="flex min-h-0 flex-1">
          {data && !state.photoMode && left && (
            <aside
              className="hidden w-72 shrink-0 overflow-hidden border-r bg-card lg:block"
              aria-label={
                state.decoration ? 'Furniture inventory' : 'Social panel'
              }
            >
              {state.decoration ? <DecorationPanel state={state} /> : social}
            </aside>
          )}
          <main
            className="relative min-w-0 flex-1 overflow-hidden bg-[#ead7b5]"
            aria-label="Home world"
          >
            {data && <HomeCanvas />}
            {data && !state.photoMode && (
              <>
                <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="hidden size-8 border shadow-sm lg:inline-flex"
                      aria-label={
                        left ? 'Collapse social panel' : 'Open social panel'
                      }
                      onClick={() => setLeft(!left)}
                    >
                      {left ? (
                        <ChevronLeft className="size-4" />
                      ) : (
                        <ChevronRight className="size-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 border text-xs shadow-sm"
                      onClick={() => setPanel('guestbook')}
                    >
                      <BookHeart className="size-3.5" />
                      <span className="hidden sm:inline">Guestbook</span>
                    </Button>
                    {!isOwner && !house?.id.startsWith('system:hub') && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="size-8 border shadow-sm"
                        aria-label="Favorite this house"
                        onClick={() => action({ type: 'favorite' })}
                      >
                        <Heart
                          className={
                            'size-3.5 ' +
                            (me?.favorites.includes(house!.id)
                              ? 'fill-current text-primary'
                              : '')
                          }
                        />
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 gap-1.5 border text-xs shadow-sm"
                    onClick={() => {
                      setRight(!right)
                      if (window.innerWidth < 1024) setMobile('pets')
                    }}
                  >
                    <PawPrint className="size-3.5" />
                    {state.pets.length}
                    <span className="hidden sm:inline">residents</span>
                  </Button>
                </div>
                <TouchControls
                  disabled={
                    state.status !== 'online' ||
                    state.decoration ||
                    !!panel ||
                    !!mobile
                  }
                  onMove={(x, y) => scene({ type: 'move', x, y })}
                  onInteract={() => scene({ type: 'interact' })}
                />
                <div className="pointer-events-none absolute bottom-4 left-4 hidden rounded-lg border bg-card px-3 py-2 text-[10px] leading-relaxed text-muted-foreground lg:block">
                  <p>WASD / arrows to walk · E to interact</p>
                  <p>Enter to chat · Q for reactions</p>
                </div>
              </>
            )}
            {(state.status === 'loading' || state.status === 'connecting') &&
              !data && (
                <div className="absolute inset-0 grid place-items-center bg-background p-6">
                  <div className="text-center">
                    <PawPrint className="mx-auto mb-4 size-10 text-primary motion-safe:animate-pulse" />
                    <h2 className="font-heading text-2xl font-extrabold">
                      A place to call yours.
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Opening your PawTrail home…
                    </p>
                  </div>
                </div>
              )}
            {state.status === 'reconnecting' && (
              <div
                className="absolute inset-0 z-30 grid place-items-center bg-background/80 p-6"
                role="status"
              >
                <div className="max-w-sm rounded-2xl border bg-card p-5 text-center shadow-md">
                  <LoaderCircle className="mx-auto mb-3 size-7 motion-safe:animate-spin" />
                  <h2 className="font-bold">Finding our way back…</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Movement and saving pause until the live room reconnects.
                    Your saved home is safe.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => void enter(state.data?.house.id || 'me')}
                  >
                    Reconnect now
                  </Button>
                </div>
              </div>
            )}
            {state.status === 'error' && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-background p-6">
                <div className="max-w-sm text-center">
                  <Home className="mx-auto mb-4 size-10 text-primary" />
                  <h2 className="font-heading text-2xl font-extrabold">
                    The door needs a moment.
                  </h2>
                  <p
                    className="my-4 text-sm leading-relaxed text-muted-foreground"
                    role="alert"
                  >
                    {state.error}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button onClick={() => void enter('me')}>
                      Open my home
                    </Button>
                    <Button asChild variant="outline">
                      <a href="/login?returnTo=%2Fplay%3Fhome%3Dme">Sign in</a>
                    </Button>
                    <Button asChild variant="ghost">
                      <a href="/play">Back to exploration</a>
                    </Button>
                  </div>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Homes needs the housing service on port 8001. Start it with
                    npm run dev:homes.
                  </p>
                </div>
              </div>
            )}
            {state.photoMode && (
              <div className="absolute inset-x-4 bottom-4 z-30 flex items-center justify-center gap-2">
                <span className="rounded-lg bg-background px-3 py-2 text-sm">
                  {photoCountdown ? 'Capturing your moment…' : 'Photo mode'}
                </span>
                <Button
                  variant="outline"
                  onClick={() => patch({ photoMode: false })}
                >
                  Leave photo mode
                </Button>
              </div>
            )}
          </main>
          {data && !state.photoMode && right && (
            <aside
              className="hidden w-72 shrink-0 overflow-y-auto border-l bg-card lg:block"
              aria-label="Resident pet directory"
            >
              <div className="sticky top-0 z-10 flex gap-1 border-b bg-card p-2"><Button size="sm" variant={rightTab==='pets'?'default':'ghost'} className="flex-1" onClick={()=>setRightTab('pets')}>Pets</Button><Button size="sm" variant={rightTab==='missions'?'default':'ghost'} className="flex-1" onClick={()=>setRightTab('missions')}>Missions</Button></div>
              {rightTab==='pets'?<PetsPanel state={state}/>:<div className="p-4"><MissionList missions={homeMissions(data)} pinned={data.player.facts.find((f)=>f.startsWith('mission-pin:'))?.slice(12)} onPin={(target)=>action({type:'mission-pin',target})} onDetails={()=>setPanel('board')} /></div>}
            </aside>
          )}
        </div>
        {!state.photoMode && (
          <>
            <footer className="relative z-20 shrink-0 border-t bg-background">
              <nav
                className="flex items-center justify-center gap-0.5 overflow-x-auto px-2 py-1"
                aria-label="Home controls"
              >
                {icon('Home', Home, () => void enter('me'))}
                {icon(
                  'Friends',
                  Users,
                  () => {
                    setLeft(true)
                    setMobile('social')
                    setSocialTab('friends')
                    action({ type: 'fact', target: 'friends-panel' })
                  },
                  !data,
                )}
                {icon(
                  'Chat',
                  MessageCircle,
                  () => {
                    setLeft(true)
                    setMobile('social')
                    setSocialTab('chat')
                    patch({ unread: 0 })
                  },
                  !data,
                )}
                {icon(
                  'Decorate',
                  Sofa,
                  editStart,
                  !house?.canDecorate || state.status !== 'online',
                )}
                {icon('Journal', BookOpen, () => setPanel('quests'), !data)}
                {icon('Backpack', BookHeart, () => setPanel('inventory'), !data)}
                {icon('Missions', BookOpen, () => {setRightTab('missions');setRight(true);if(window.innerWidth<1024)setPanel('board')}, !data)}
                {icon('Cat sounds', PawPrint, () => setPanel('soundboard'), state.status!=='online')}
                {icon(
                  'React',
                  Smile,
                  () => setPanel('emotes'),
                  state.status !== 'online',
                )}
                {icon(
                  'Photo',
                  Camera,
                  takePhoto,
                  !data || state.status !== 'online',
                )}
                {icon('Album', BookHeart, () => setPanel('photos'), !data)}
                {icon('Outside', Map, () => void enter('system:hub'), !data)}
                {icon('Places', Map, () => { window.location.assign((window.location.pathname === '/' ? '/' : '/play') + '?map=community' + (new URLSearchParams(window.location.search).get('demo') === '1' ? '&demo=1' : '')) }, state.decoration)}
                {icon('Settings', Settings2, () => setPanel('settings'), !data)}
              </nav>
              <div className="flex min-h-7 items-center justify-between gap-3 border-t px-3 py-1 text-[10px]">
                <p className="truncate" role="status">
                  {state.notice}
                </p>
                <span className="hidden shrink-0 text-muted-foreground sm:inline">
                  Server-saved home · Virtual care & rewards
                </span>
              </div>
            </footer>
            {state.error && state.status !== 'error' && (
              <div
                className="absolute bottom-28 left-1/2 z-40 flex w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 items-start gap-3 rounded-xl border border-destructive/40 bg-card p-3 text-sm shadow-lg"
                role="alert"
              >
                <p className="flex-1">{state.error}</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  aria-label="Dismiss message"
                  onClick={() => patch({ error: '' })}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )}
            {data && (
              <HomePanels panel={panel} setPanel={setPanel} state={state} />
            )}
            {data && (
              <Dialog
                open={!!mobile && window.innerWidth < 1024}
                onOpenChange={(open) => {
                  if (!open) setMobile(null)
                }}
              >
                <DialogContent className="bottom-0 top-auto flex h-[min(80dvh,42rem)] max-h-[85dvh] translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-lg">
                  <DialogHeader className="sr-only">
                    <DialogTitle>
                      {mobile === 'pets'
                        ? 'Resident pets'
                        : mobile === 'decoration'
                          ? 'Decorate your home'
                          : 'Social panel'}
                    </DialogTitle>
                    <DialogDescription>
                      Keep your home world close while you connect.
                    </DialogDescription>
                  </DialogHeader>
                  {mobile === 'pets' ? (
                    <div className="overflow-y-auto">
                      <PetsPanel state={state} />
                    </div>
                  ) : mobile === 'decoration' ? (
                    <DecorationPanel state={state} />
                  ) : (
                    social
                  )}
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
