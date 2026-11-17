import { pinGameMission, pinnedCareMission } from "@/game/companions/missions";
import { AnimalTray } from "@/components/game/shared/animal-tray";
import { InteractionHud } from "@/components/game/housing/interaction-hud";
import {
  PlayShell,
  PlayHeader,
  PlayFooter,
  PlayLoading,
  PlayViewControls,
} from "@/components/game/shared/play-chrome";
import type { PlayControlActions } from "@/components/game/shared/play-controls";
import { navigatePlay, consumePlayAction } from "@/game/play-navigation";
import { PlayEntrance } from "@/components/game/play-entrance";
import HomesApp from "@/components/game/housing/app";
import "./game/theme.css";
import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  lazy,
  Suspense,
  type ReactNode,
} from "react";
import {
  Moon,
  Sun,
  PawPrint,
  RotateCw,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCanvas } from "@/components/game/game-canvas";
import { TouchControls } from "@/components/game/touch-controls";
import { ContextActions } from "@/components/game/context-actions";
import {
  PlatformAnimals,
  openAnimalDirectory,
} from "@/components/game/platform-animals";
import type { PlatformBridge } from "@/game/platform";
import { GamePanels, type Panel } from "@/components/game/panels";
import { gameStore, publish, send } from "@/game/store";
import { clockLabel, dayPhase } from "@/game/systems/time";
import { audio } from "@/game/systems/audio";
import {
  MissionTracker,
  localMissions,
} from "@/components/game/immersion/missions";
import { track } from "@/game/store";
import { worldConditions, weatherLabel } from "@/game/immersion-data";
const CommunityMap = lazy(() => import("@/components/game/community/app"));
const ActorComparison = lazy(() => import("@/components/game/actor-comparison"));
const StageEditor = lazy(() => import('@/components/game/stage-editor'))
const FloorAdventure = lazy(() => import('@/components/game/floor-adventure'))
const ItemStudio = lazy(() => import('@/components/game/item-studio/app'))
const MonsterStudio = lazy(() => import('@/components/game/monster-studio'))
const HydraStudio = lazy(() => import('@/components/game/hydra-studio'))
const SkinStudio = lazy(() => import('@/components/game/skin-studio'))
const ActorExplainer = lazy(() => import('@/components/game/actor-explainer'))
const AmberModelStudy = lazy(() => import('@/components/game/amber-model-study'))
const AmberRepresentationComparison = lazy(() => import('@/components/game/amber-representation-comparison'))
const AmberVolumeStudy = lazy(() => import('@/components/game/amber-volume-study'))
const YaeModelStudy = lazy(() => import('@/components/game/yae-model-study'))
const PortraitGallery = lazy(() => import('@/components/game/portrait-gallery'));
const FurnitureStudio = lazy(() => import('@/components/game/furniture-studio'))
const FurnitureEditor = lazy(() => import('@/components/game/furniture-editor'))
const FurnitureComparison = lazy(() => import('@/components/game/furniture-comparison'))
function GameApp({
  platform,
  routeSearch,
}: {
  platform?: PlatformBridge;
  routeSearch: string;
}) {
  const [visitingShelter, setVisitingShelter] = useState<
    import("@/game/community").CommunityPlace | null
  >(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("shelterId");
    if (!id || !platform?.places) return;
    const abort = new AbortController();
    platform
      .places(abort.signal)
      .then((places) => {
        if (!abort.signal.aborted)
          setVisitingShelter(
            places.find(
              (place) =>
                place.entry.kind === "shelter" && place.entry.shelterId === id,
            ) ?? null,
          );
      })
      .catch(() => {});
    return () => abort.abort();
  }, [platform]);
  const state = useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
  );
  const [panel, setPanel] = useState<Panel>(null),
    [attempt, setAttempt] = useState(0);
  const [toast, setToast] = useState("");
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const previous = useRef({
    notice: state.notice,
    badges: state.progress.badges.length,
  });
  useEffect(() => {
    const unlocked = state.progress.badges.length > previous.current.badges;
    const changed = state.notice !== previous.current.notice;
    previous.current = {
      notice: state.notice,
      badges: state.progress.badges.length,
    };
    if (!unlocked && !changed) return;
    if (unlocked) audio.effect("achievement");
    setToast(
      unlocked
        ? "Achievement unlocked: " + state.progress.badges.at(-1)
        : state.notice,
    );
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [state.notice, state.progress.badges.length]);
  const paused =
    !!panel ||
    !!state.dialogue ||
    !!state.platformAnimalRequest ||
    trackerOpen ||
    controlsOpen;
  useEffect(() => {
    if (state.phase === "ready") send({ type: "pause", paused });
  }, [paused, state.phase]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest(
          "input,textarea,button,a,[role=menu],[role=dialog],[contenteditable=true]",
        )
      )
        return;
      if (
        ["Escape", "j", "J", "i", "I", "m", "M", "q", "Q"].includes(
          event.key,
        ) &&
        !event.defaultPrevented &&
        !panel &&
        !controlsOpen &&
        !state.dialogue &&
        !state.platformAnimalRequest &&
        state.phase === "ready"
      ) {
        event.preventDefault();
        setPanel(
          event.key.toLowerCase() === "j"
            ? "journal"
            : event.key.toLowerCase() === "i"
              ? "bag"
              : event.key.toLowerCase() === "m"
                ? "map"
                : event.key.toLowerCase() === "q"
                  ? "reactions"
                  : "pause",
        );
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    panel,
    state.dialogue,
    state.phase,
    state.platformAnimalRequest,
    controlsOpen,
  ]);
  useEffect(() => {
    const gesture = () => {
      void audio.unlock();
    };
    window.addEventListener("pointerdown", gesture, { once: true });
    window.addEventListener("keydown", gesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", gesture);
      window.removeEventListener("keydown", gesture);
      audio.dispose();
    };
  }, []);
  useEffect(() => {
    const latest = state.progress.activities[0];
    if (
      latest &&
      ["quest", "accept", "upgrade", "collect", "discover"].includes(
        latest.kind,
      )
    )
      audio.effect(latest.kind);
  }, [state.progress.activities[0]?.id]);
  useEffect(() => {
    const requested = state.panelRequest;
    if (requested) {
      setPanel(requested as Panel);
      publish({ panelRequest: null });
    }
  }, [state.panelRequest]);
  useEffect(() => {
    const requested = new URLSearchParams(routeSearch).get("action");
    if (
      requested &&
      [
        "bag",
        "journal",
        "map",
        "photos",
        "board",
        "soundboard",
        "pause",
        "help",
        "reactions",
      ].includes(requested)
    ) {
      setPanel(requested as Panel);
      consumePlayAction();
    }
  }, [routeSearch]);
  const ready = state.phase === "ready";
  const panelAction = (value: Panel) => ({
    onSelect: () => setPanel(value),
    disabled: !ready,
    active: panel === value,
  });
  const controls: PlayControlActions = {
    explore: { onSelect: () => navigatePlay("explore"), active: true },
    home: { onSelect: () => navigatePlay("home") },
    animals: { onSelect: openAnimalDirectory, disabled: !platform },
    yard: { onSelect: () => navigatePlay("yard") },
    friends: { onSelect: () => navigatePlay("world", "friends") },
    chat: { onSelect: () => navigatePlay("world", "chat") },
    decorate: { onSelect: () => navigatePlay("home", "decorate") },
    journal: panelAction("journal"),
    inventory: panelAction("bag"),
    missions: panelAction("board"),
    soundboard: panelAction("soundboard"),
    reactions: panelAction("reactions"),
    photo: {
      onSelect: () => {
        setPanel(null);
        send({ type: "photo-scene" });
      },
      disabled: !ready,
    },
    album: panelAction("photos"),
    world: { onSelect: () => navigatePlay("world") },
    places: { onSelect: () => navigatePlay("places") },
    "story-map": panelAction("map"),
    settings: panelAction("pause"),
    help: panelAction("help"),
  };
  const fullscreen = () => {
    if (document.fullscreenElement)
      void document
        .exitFullscreen()
        .catch(() =>
          publish({ notice: "Fullscreen is unavailable in this browser." }),
        );
    else
      void document.documentElement
        .requestFullscreen?.()
        .catch(() =>
          publish({ notice: "Fullscreen is unavailable in this browser." }),
        );
  };
  return (
    <PlayShell>
      <PlayHeader
        location={
          state.scene === "shelter"
            ? visitingShelter
              ? visitingShelter.name + " · virtual visit"
              : "PawTrail shelter"
            : "Sampaguita neighborhood"
        }
        balance={state.progress.kibble}
        scope="local"
        onMenuOpenChange={setControlsOpen}
        details={
          <>
            <span className="flex items-center gap-1.5">
              {dayPhase(state.progress.minute) === "night" ? (
                <Moon className="size-3.5" />
              ) : (
                <Sun className="size-3.5" />
              )}
              {clockLabel(state.progress.minute)}
            </span>
            <span className="hidden xl:inline">
              Day {state.progress.day} ·{" "}
              {weatherLabel(
                worldConditions(
                  state.progress.day * 1440 + state.progress.minute,
                ).weather,
              )}
            </span>
          </>
        }
      >
        <PlatformAnimals
          bridge={platform}
          request={state.platformAnimalRequest}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-10 rounded-md"
          disabled={!ready}
          aria-label="Game settings"
          onClick={() => setPanel("pause")}
        >
          <Settings2 className="size-4" />
        </Button>
      </PlayHeader>
      <main
        className="relative min-h-0 flex-1 overflow-hidden"
        aria-label="Explore the PawTrail neighborhood"
      >
        <GameCanvas attempt={attempt} />
        {toast && state.phase === "ready" && (
          <div
            key={toast}
            className="pointer-events-none absolute right-16 top-4 z-20 max-w-[min(20rem,calc(100%-5rem))] rounded-xl border bg-card px-4 py-3 text-sm font-semibold shadow-md animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none"
            aria-hidden="true"
          >
            {toast}
          </div>
        )}
        {state.phase === "ready" && (
          <>
            <MissionTracker
              onModalChange={setTrackerOpen}
              missions={localMissions(state.progress)}
              pinned={pinnedCareMission() ?? state.progress.trackedQuest}
              onPin={(id) => pinGameMission(id, track)}
              onDetails={() => setPanel("board")}
              onGuide={(target) => send({ type: "guide", target })}
            />
            <PlayViewControls
              onZoomIn={() => send({ type: "zoom", amount: 1 })}
              onZoomOut={() => send({ type: "zoom", amount: -1 })}
              onFullscreen={fullscreen}
            />
            <AnimalTray />
            <InteractionHud />
            <ContextActions state={state} />
            <TouchControls disabled={paused || state.busy} />
          </>
        )}
        {state.phase === "loading" && (
          <PlayLoading progress={state.load * 100} />
        )}
        {state.phase === "error" && (
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
      <PlayFooter
        actions={controls}
        appearance={state.progress.appearance}
        notice={state.notice}
        saveLabel={
          state.save === "unavailable" ? "Local save unavailable" : "Local save"
        }
        onMenuOpenChange={setControlsOpen}
      />
      <GamePanels
        panel={panel}
        setPanel={setPanel}
        state={state}
        closeDialogue={() => publish({ dialogue: null })}
      />
    </PlayShell>
  );
}
class GameErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
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
    );
  }
}
export default function App({ platform }: { platform?: PlatformBridge }) {
  const [routeSearch, setRouteSearch] = useState(() => window.location.search);
  useEffect(() => {
    const update = () => setRouteSearch(window.location.search);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const query = new URLSearchParams(routeSearch);
  if(query.get('floor')==='neon-heights')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening Neon Heights adventure…"/>}><FloorAdventure key={query.get('slot')??'neon-local'}/></Suspense></GameErrorBoundary>
  if(query.get('compare')==='amber-representations')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening Amber representation comparison…"/>}><AmberRepresentationComparison/></Suspense></GameErrorBoundary>
  if(query.get('compare')==='amber')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening Amber model study…"/>}><AmberModelStudy/></Suspense></GameErrorBoundary>
  if(query.get('compare')==='amber-volume')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening Amber volume study…"/>}><AmberVolumeStudy/></Suspense></GameErrorBoundary>
  if(query.get('compare')==='yae')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening Yae Miko model study…"/>}><YaeModelStudy/></Suspense></GameErrorBoundary>
  if(query.get('preview')==='items')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening item studio…"/>}><ItemStudio/></Suspense></GameErrorBoundary>
  if (query.get('preview') === 'monsters') {
    const boss = query.get('boss') ?? '', creatureId = query.get('creature') || undefined
    const variant = ['kurogane','robot'].includes(boss) ? 'robot' : ['solvaris', 'deity'].includes(boss) ? 'deity' : ['vesper', 'reaper'].includes(boss) ? 'reaper' : boss === 'morvane' ? 'serpent' : 'hydra'
    const roaming = !!creatureId || ['kurogane','robot','solvaris', 'deity', 'vesper', 'reaper', 'morvane', 'kaedros'].includes(boss)
    return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening monster studio…"/>}>{roaming ? <HydraStudio key={creatureId ?? variant} variant={variant} creatureId={creatureId} /> : <MonsterStudio />}</Suspense></GameErrorBoundary>
  }
  if(query.get('preview')==='stage')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening stage editor…"/>}><StageEditor/></Suspense></GameErrorBoundary>
  if(query.get('preview')==='skin')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening texture studio…"/>}><SkinStudio/></Suspense></GameErrorBoundary>
  if(query.get('preview')==='anatomy')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening the character walkthrough…"/>}><ActorExplainer/></Suspense></GameErrorBoundary>
  if(query.get('preview')==='portraits')return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening 2D portrait studio…"/>}><PortraitGallery/></Suspense></GameErrorBoundary>;
  if (query.get('preview') === 'cats')
    return (
      <GameErrorBoundary>
        <Suspense fallback={<PlayLoading title="Opening cat creator…" />}>
          <ActorComparison preview cats />
        </Suspense>
      </GameErrorBoundary>
    );
  if (query.get('compare') === 'furniture') return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening furniture comparison…" />}><FurnitureComparison /></Suspense></GameErrorBoundary>
  if (query.get('preview') === 'furniture') return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening furniture editor…" />}><FurnitureEditor /></Suspense></GameErrorBoundary>
  if (query.get('preview') === 'furniture-setup') return <GameErrorBoundary><Suspense fallback={<PlayLoading title="Opening furniture setup…" />}><FurnitureStudio /></Suspense></GameErrorBoundary>
  if (query.get("preview") === "actors")
    return (
      <GameErrorBoundary>
        <Suspense fallback={<PlayLoading title="Opening character creator…" />}>
          <ActorComparison preview creator />
        </Suspense>
      </GameErrorBoundary>
    );
  if (query.get("compare") === "actors")
    return (
      <GameErrorBoundary>
        <Suspense fallback={<div role="status" className="grid h-dvh place-items-center bg-background text-sm">Opening the comparison field…</div>}>
          <ActorComparison />
        </Suspense>
      </GameErrorBoundary>
    );
  if (query.get("map") === "community")
    return (
      <GameErrorBoundary>
        <Suspense
          fallback={
            <div
              className="grid h-dvh place-items-center bg-background text-sm"
              role="status"
            >
              Opening the community map…
            </div>
          }
        >
          <CommunityMap platform={platform} />
        </Suspense>
      </GameErrorBoundary>
    );
  if (
    !query.has("home") &&
    !query.has("explore") &&
    !query.has("scene") &&
    !query.has("shelterId") &&
    !query.has("animalId") &&
    platform
  )
    return (
      <GameErrorBoundary>
        <PlayEntrance platform={platform} />
      </GameErrorBoundary>
    );
  const exploration =
    !query.has("home") &&
    (window.location.pathname === "/" ||
      query.has("explore") ||
      query.has("scene") ||
      query.has("shelterId") ||
      query.has("animalId"));
  return (
    <GameErrorBoundary>
      {exploration ? (
        <GameApp platform={platform} routeSearch={routeSearch} />
      ) : (
        <HomesApp platform={platform} routeSearch={routeSearch} />
      )}
    </GameErrorBoundary>
  );
}
