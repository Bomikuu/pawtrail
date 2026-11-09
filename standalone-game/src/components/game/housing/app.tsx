import { AnimalTray } from "../shared/animal-tray";
import { isCharacterId } from "@/game/characters";
import {
  PlayShell,
  PlayHeader,
  PlayFooter,
  PlayLoading,
  PlayViewControls,
} from "@/components/game/shared/play-chrome";
import type { PlayControlActions } from "@/components/game/shared/play-controls";
import { navigatePlay, consumePlayAction } from "@/game/play-navigation";
import { InteractionHud } from "./interaction-hud";
import { loadGameFonts } from "@/game/font-loader";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  BookHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  LoaderCircle,
  PawPrint,
  Settings2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  homes,
  action,
  editStart,
  enter,
  retryEntry,
  entryReturnTo,
  patch,
  scene,
  stop,
  housingConnected,
  live,
} from "@/game/housing/client";
import {
  PlatformAnimals,
  openAnimalDirectory,
} from "@/components/game/platform-animals";
import type { PlatformBridge } from "@/game/platform";
import { gameStore, syncCharacterAppearance } from "@/game/store";
import { audio } from "@/game/systems/audio";
import { SocialPanel } from "./social";
import { PetsPanel } from "./pets";
import { DecorationEditor } from "./decoration-editor";
import { HomePanels, type HomePanel } from "./panels";
import { TouchControls } from "@/components/game/touch-controls";
import {
  MissionList,
  homeMissions,
} from "@/components/game/immersion/missions";
import { clockLabel } from "@/game/systems/time";
import { weatherLabel } from "@/game/immersion-data";
function HomeCanvas() {
  const host = useRef<HTMLDivElement>(null),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0),
    [renderError, setRenderError] = useState(""),
    assets = useSyncExternalStore(homes.subscribe, homes.get, homes.get).assets;
  useEffect(() => {
    setReady(false);
    setRenderError("");
    const failed = (event: Event) =>
      setRenderError(String((event as CustomEvent).detail));
    window.addEventListener("pawtrail:renderer-error", failed);
    let cancelled = false,
      release: (() => void) | undefined;
    Promise.all([import("@/game/runtime/session"), loadGameFonts()])
      .then(async ([{ mountWorld, resetWorldRenderer }]) => {
        if (cancelled || !host.current) return;
        if (attempt) resetWorldRenderer();
        const cleanup = await mountWorld(host.current, "Home", () => {
          if (!cancelled) {
            setReady(true);
            patch({ rendererReady: true });
          }
        });
        if (cancelled) cleanup();
        else release = cleanup;
      })
      .catch(() =>
        setRenderError(
          "The home renderer could not open. Retry with lighter graphics.",
        ),
      );
    return () => {
      cancelled = true;
      window.removeEventListener("pawtrail:renderer-error", failed);
      release?.();
      patch({ rendererReady: false });
    };
  }, [attempt]);
  return (
    <>
      <div
        ref={host}
        className="absolute inset-0 overflow-hidden"
        aria-label="Interactive PawTrail home. WASD or arrows to walk. E to interact. Enter opens chat."
      />
      {(!ready || renderError || assets?.error) && (
        <PlayLoading
          title={
            renderError || assets?.error
              ? "Let’s reopen your world"
              : "A neighborhood of little stories."
          }
          description={
            renderError ||
            assets?.error ||
            "Preparing your home’s pixel details…"
          }
          progress={
            renderError || assets?.error
              ? undefined
              : (assets?.progress ?? 0) * 100
          }
        >
          {(renderError || assets?.error) && (
            <Button
              className="mt-4 rounded-md"
              onClick={() => {
                sessionStorage.setItem("pawtrail:canvas-recovery", "1");
                patch({ assets: { progress: 0, error: "" } });
                setAttempt((n) => n + 1);
              }}
            >
              Retry with lighter graphics
            </Button>
          )}
        </PlayLoading>
      )}
      {ready && !renderError && <InteractionHud />}
    </>
  );
}
export default function HomesApp({
  platform,
  routeSearch = window.location.search,
}: {
  platform?: PlatformBridge;
  routeSearch?: string;
}) {
  const gameState = useSyncExternalStore(
    gameStore.subscribe,
    gameStore.getSnapshot,
  );
  const state = useSyncExternalStore(homes.subscribe, homes.get),
    [panel, setPanel] = useState<HomePanel>(null),
    [left, setLeft] = useState(false),
    [right, setRight] = useState(false),
    [rightTab, setRightTab] = useState<"pets" | "missions">("pets"),
    [mobile, setMobile] = useState<"social" | "pets" | "decoration" | null>(
      null,
    ),
    [socialTab, setSocialTab] = useState("friends"),
    [photoCountdown, setPhotoCountdown] = useState(false),
    [controlsOpen, setControlsOpen] = useState(false);
  const appliedAction = useRef("");
  const canvasOpened = useRef(false);
  const photoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const visit = (event: Event) =>
      void enter((event as CustomEvent<string>).detail);
    window.addEventListener("pawtrail:home-visit", visit);
    const openPanel = (event: Event) =>
      setPanel((event as CustomEvent<HomePanel>).detail);
    window.addEventListener("pawtrail:home-panel", openPanel);
    const invitations = () => {
      setLeft(true);
      setSocialTab("invites");
      if (window.innerWidth < 1024) setMobile("social");
    };
    window.addEventListener("pawtrail:home-invites", invitations);
    const keyboard = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.matches(
          "input,textarea,button,a,[role=tab],[role=switch],[role=slider],[contenteditable=true]",
        )
      )
        return;
      if (
        homes.get().decoration ||
        document.querySelector('[role="menu"],[role="dialog"]')
      )
        return;
      if (event.key.toLowerCase() === "i") {
        event.preventDefault();
        setPanel("inventory");
      }
      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        setPanel("quests");
      }
      if (event.key === "Enter" && !event.defaultPrevented) {
        event.preventDefault();
        setLeft(true);
        setMobile("social");
        setSocialTab("chat");
        window.dispatchEvent(new Event("pawtrail:focus-chat"));
      }
      if (event.key.toLowerCase() === "q" && !event.defaultPrevented)
        setPanel("emotes");
    };
    const unlock = () => void audio.unlock();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", keyboard);
    return () => {
      if (photoTimer.current) clearTimeout(photoTimer.current);
      stop();
      audio.dispose();
      window.removeEventListener("pawtrail:home-visit", visit);
      window.removeEventListener("pawtrail:home-panel", openPanel);
      window.removeEventListener("pawtrail:home-invites", invitations);
      window.removeEventListener("keydown", keyboard);
      window.removeEventListener("pointerdown", unlock);
    };
  }, []);
  useEffect(() => {
    setPanel(null);
    setMobile(null);
  }, [state.data?.house.roomId]);
  const requestedHome =
    new URLSearchParams(routeSearch).get("home") || "system:hub";
  useEffect(() => {
    const current = homes.get(),
      target = requestedHome.replace(
        /^me(?=\||$)/,
        current.data?.player.id ?? "me",
      );
    if (
      current.status === "online" &&
      housingConnected() &&
      (target === "system:hub"
        ? current.data?.house.id.startsWith("system:hub")
        : current.data?.house.roomId === target)
    )
      return;
    void enter(requestedHome);
  }, [requestedHome]);
  useEffect(() => {
    const data = state.data;
    if (
      !data ||
      state.status !== "online" ||
      appliedAction.current === routeSearch
    )
      return;
    const target = requestedHome.replace(/^me(?=\||$)/, data.player.id);
    if (
      target === "system:hub"
        ? !data.house.id.startsWith("system:hub")
        : data.house.roomId !== target
    )
      return;
    if (
      new URLSearchParams(routeSearch).get("action") === "decorate" &&
      !state.rendererReady
    )
      return;
    appliedAction.current = routeSearch;
    const requested = new URLSearchParams(routeSearch).get("action");
    if (requested === "chat" || requested === "friends") {
      setLeft(true);
      setSocialTab(requested);
      if (window.innerWidth < 1024) setMobile("social");
      if (requested === "chat") patch({ unread: 0 });
      else action({ type: "fact", target: "friends-panel" });
    } else if (requested === "decorate") editStart();
    else if (
      requested &&
      [
        "quests",
        "care-shop",
        "garden-shop",
        "inventory",
        "board",
        "soundboard",
        "emotes",
        "photos",
        "settings",
      ].includes(requested)
    )
      setPanel(requested as HomePanel);
    if (requested) consumePlayAction();
  }, [
    routeSearch,
    requestedHome,
    state.status,
    state.rendererReady,
    state.data?.house.roomId,
  ]);
  useEffect(() => {
    const current = homes.get(),
      data = current.data;
    if (current.status !== "online" || !data) return;
    const query = new URLSearchParams(window.location.search);
    const target = (query.get("home") || "system:hub").replace(
      /^me(?=\||$)/,
      data.player.id,
    );
    if (
      target === "system:hub"
        ? data.house.id.startsWith("system:hub")
        : data.house.roomId === target
    )
      return;
    const canonical =
      data.house.id === data.player.id
        ? "me" + data.house.roomId.slice(data.player.id.length)
        : data.house.roomId;
    query.set("home", canonical);
    window.history.replaceState(
      null,
      "",
      window.location.pathname + "?" + query.toString(),
    );
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [state.status, state.data?.house.roomId]);
  useEffect(() => {
    const me = state.data?.player;
    if (!me || state.status !== "online") return;
    const pending = localStorage.getItem("pawtrail:appearance:pending");
    if (pending && isCharacterId(pending) && pending !== me.appearance) {
      action({
        type: "profile",
        appearance: pending,
        visible: me.visible,
        quiet: me.quiet,
      });
      return;
    }
    if (pending === me.appearance)
      localStorage.removeItem("pawtrail:appearance:pending");
    if (isCharacterId(me.appearance)) syncCharacterAppearance(me.appearance);
  }, [state.status, state.data?.player.appearance]);
  useEffect(() => {
    if (state.chatWith) {
      setLeft(true);
      setSocialTab("chat");
      if (window.innerWidth < 1024) setMobile("social");
    }
  }, [state.chatWith]);
  useEffect(() => {
    if (state.selectedPet) {
      setRight(true);
      if (window.innerWidth < 1024) setMobile("pets");
    }
  }, [state.selectedPet]);
  useEffect(() => {
    if (state.selectedPlayer) setPanel("person");
  }, [state.selectedPlayer]);
  useEffect(() => {
    if (state.decoration) setMobile(null);
  }, [state.decoration]);
  const takePhoto = () => {
    patch({ photoMode: true });
    setMobile(null);
    setPanel(null);
    setPhotoCountdown(true);
    if (photoTimer.current) clearTimeout(photoTimer.current);
    photoTimer.current = setTimeout(() => {
      scene({ type: "photo" });
      setPhotoCountdown(false);
    }, 250);
  };
  const data = state.data,
    house = data?.house,
    me = data?.player,
    isOwner = house?.id === me?.id;
  if (data) canvasOpened.current = true;
  const social = (
    <SocialPanel state={state} tab={socialTab} setTab={setSocialTab} />
  );
  const ready = !!data && state.status === "online",
    leavingDisabled = state.decoration;
  const openSocial = (tab: string) => {
    setLeft(true);
    setSocialTab(tab);
    if (window.innerWidth < 1024) setMobile("social");
    if (tab === "chat") patch({ unread: 0 });
    else action({ type: "fact", target: "friends-panel" });
  };
  const panelAction = (value: HomePanel) => ({
    onSelect: () => setPanel(value),
    disabled: !data,
    active: panel === value,
  });
  const controls: PlayControlActions = {
    explore: {
      onSelect: () => navigatePlay("explore"),
      disabled: leavingDisabled,
    },
    home: {
      onSelect: () => navigatePlay("home"),
      disabled: leavingDisabled,
      active: isOwner && house?.zone === "interior",
    },
    animals: {
      onSelect: openAnimalDirectory,
      disabled: !platform || leavingDisabled,
    },
    yard: {
      onSelect: () => navigatePlay("yard"),
      disabled: leavingDisabled,
      active: isOwner && house?.zone === "yard",
    },
    friends: {
      onSelect: () => openSocial("friends"),
      disabled: !data,
      active: left && socialTab === "friends",
    },
    chat: {
      onSelect: () => openSocial("chat"),
      disabled: !ready,
      active: left && socialTab === "chat",
      badge: state.unread,
    },
    decorate: {
      onSelect: () => {
        if (!house?.canDecorate) {
          navigatePlay("home", "decorate");
          return;
        }
        if (state.decoration) {
          setLeft(true);
          if (window.innerWidth < 1024) setMobile("decoration");
        } else editStart();
      },
      disabled: !ready || !state.rendererReady,
      active: state.decoration,
    },
    journal: panelAction("quests"),
    inventory: panelAction("inventory"),
    missions: panelAction("board"),
    soundboard: { ...panelAction("soundboard"), disabled: !ready },
    reactions: { ...panelAction("emotes"), disabled: !ready },
    photo: { onSelect: takePhoto, disabled: !ready },
    album: panelAction("photos"),
    world: {
      onSelect: () => navigatePlay("world"),
      disabled: leavingDisabled,
      active: house?.id.startsWith("system:hub"),
    },
    places: {
      onSelect: () => navigatePlay("places"),
      disabled: leavingDisabled,
    },
    "story-map": {
      onSelect: () => navigatePlay("explore", "map"),
      disabled: leavingDisabled,
    },
    settings: panelAction("settings"),
    help: {
      onSelect: () => navigatePlay("explore", "help"),
      disabled: leavingDisabled,
    },
  };
  return (
    <PlayShell>
      {data && state.decoration && <DecorationEditor state={state} />}
      {!state.photoMode && (
        <PlayHeader
          location={house?.name || "Opening your PawTrail space…"}
          balance={me?.wallet ?? null}
          scope="server"
          disabledNavigation={state.decoration}
          onMenuOpenChange={setControlsOpen}
          details={
            <>
              <span>
                {data?.world ? clockLabel(Math.floor(data.world.minute)) : ""}
              </span>
              <span className="hidden xl:inline">
                {data?.world ? weatherLabel(data.world.weather) : ""}
              </span>
              {state.status === "online" ? (
                <Wifi
                  className="size-3.5 text-emerald-700"
                  aria-label="Live connection"
                />
              ) : (
                <WifiOff className="size-3.5" aria-label="Reconnecting" />
              )}
            </>
          }
        >
          <PlatformAnimals
            bridge={platform}
            request={gameState.platformAnimalRequest}
          />
          <Button
            variant="ghost"
            size="icon"
            className="size-10 rounded-md"
            disabled={!data}
            aria-label="Game settings"
            onClick={() => setPanel("settings")}
          >
            <Settings2 className="size-4" />
          </Button>
        </PlayHeader>
      )}
      <div className="relative min-h-0 flex-1">
        {data && !state.photoMode && left && !state.decoration && (
          <aside
            className="absolute left-3 top-16 z-20 hidden h-[min(36rem,calc(100%-5rem))] w-80 flex-col overflow-hidden rounded-2xl border bg-card shadow-xl lg:flex"
            aria-label={
              state.decoration ? "Furniture inventory" : "Social panel"
            }
          >
            <div className="flex shrink-0 items-center justify-between border-b px-3 py-2">
              <h2 className="text-xs font-bold">
                {state.decoration ? "Decorating" : "Your circle"}
              </h2>
              <Button
                size="icon"
                variant="ghost"
                className="size-7"
                aria-label="Close social drawer"
                onClick={() => setLeft(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1">{social}</div>
          </aside>
        )}
        <main
          className="absolute inset-0 overflow-hidden bg-[#ead7b5]"
          aria-label="Home world"
        >
          {canvasOpened.current && <HomeCanvas />}
          {data && !state.photoMode && (
            <>
              <div className="absolute left-3 right-3 top-3 z-10 flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="hidden size-8 border shadow-sm lg:inline-flex"
                    aria-label={
                      left ? "Collapse social panel" : "Open social panel"
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
                    onClick={() => setPanel("guestbook")}
                  >
                    <BookHeart className="size-3.5" />
                    <span className="hidden sm:inline">Guestbook</span>
                  </Button>
                  {house?.id.startsWith("system:hub") &&
                    house.blockCount > 1 && (
                      <div className="flex items-center gap-0.5 rounded-md border bg-card px-1 shadow-sm">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Previous home block"
                          disabled={!ready || house.block === 0}
                          onClick={() =>
                            void enter(
                              "system:hub:" +
                                (me?.sample ? "demo" : "real") +
                                (house.block > 1
                                  ? ":block:" + (house.block - 1)
                                  : ""),
                            )
                          }
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <span className="whitespace-nowrap text-[10px] tabular-nums">
                          Block {house.block + 1}/{house.blockCount}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label="Next home block"
                          disabled={
                            !ready || house.block + 1 >= house.blockCount
                          }
                          onClick={() =>
                            void enter(
                              "system:hub:" +
                                (me?.sample ? "demo" : "real") +
                                ":block:" +
                                (house.block + 1),
                            )
                          }
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    )}
                  {!isOwner && !house?.id.startsWith("system:hub") && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="size-8 border shadow-sm"
                      aria-label="Favorite this house"
                      onClick={() => action({ type: "favorite" })}
                    >
                      <Heart
                        className={
                          "size-3.5 " +
                          (me?.favorites.includes(house!.id)
                            ? "fill-current text-primary"
                            : "")
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
                    setRight(!right);
                    if (window.innerWidth < 1024) setMobile("pets");
                  }}
                >
                  <PawPrint className="size-3.5" />
                  {state.pets.length}
                  <span className="hidden sm:inline">residents</span>
                </Button>
              </div>
              {house && !house.id.startsWith("system:hub") && (
                <div
                  className="absolute left-1/2 top-14 z-10 flex max-w-[calc(100%-2rem)] -translate-x-1/2 gap-1 overflow-x-auto rounded-md border bg-background p-1 shadow-sm md:bottom-3 md:top-auto"
                  role="group"
                  aria-label="Property space"
                >
                  <Button
                    size="sm"
                    className="rounded-md text-xs"
                    variant={house.zone === "yard" ? "default" : "ghost"}
                    disabled={state.decoration}
                    onClick={() => void enter(house.id + "|yard")}
                  >
                    Yard
                  </Button>
                  {house.floors.map((floor) => (
                    <Button
                      key={floor.id}
                      size="sm"
                      className="rounded-md text-xs"
                      variant={house.zone === floor.id ? "default" : "ghost"}
                      disabled={state.decoration}
                      onClick={() =>
                        void enter(
                          house.id +
                            (floor.id === "interior" ? "" : "|" + floor.id),
                        )
                      }
                    >
                      {floor.label}
                    </Button>
                  ))}
                </div>
              )}
              <PlayViewControls
                onZoomIn={() => scene({ type: "zoom", mode: "in" })}
                onZoomOut={() => scene({ type: "zoom", mode: "out" })}
                onFit={() => scene({ type: "zoom", mode: "fit" })}
                onFill={() => scene({ type: "zoom", mode: "fill" })}
                className={right ? "lg:right-[21.75rem]" : ""}
              />
              <AnimalTray />
              <TouchControls
                disabled={
                  state.status !== "online" ||
                  state.decoration ||
                  !!panel ||
                  !!mobile ||
                  controlsOpen
                }
                onMove={(x, y) => scene({ type: "move", x, y })}
                onInteract={() => scene({ type: "interact" })}
              />
              <div className="pointer-events-none absolute bottom-24 left-4 hidden rounded-lg border bg-card px-3 py-2 text-[10px] leading-relaxed text-muted-foreground lg:block">
                <p>WASD / arrows to walk · E to interact</p>
                <p>Enter to chat · Q for reactions</p>
              </div>
            </>
          )}
          {(state.status === "loading" || state.status === "connecting") &&
            !data && (
              <PlayLoading description="Connecting to your PawTrail space…" />
            )}
          {state.status === "reconnecting" && (
            <div
              className="absolute inset-0 z-30 grid place-items-center bg-background/80 p-6"
              role="status"
            >
              <div className="max-w-sm rounded-2xl border bg-card p-5 text-center shadow-md">
                <LoaderCircle className="mx-auto mb-3 size-7 motion-safe:animate-spin" />
                <h2 className="font-bold">Finding our way back…</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Movement and saving pause until the live room reconnects. Your
                  saved home is safe.
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => void retryEntry()}
                >
                  Reconnect now
                </Button>
              </div>
            </div>
          )}
          {state.status === "error" && (
            <div className="absolute inset-0 z-30 grid place-items-center bg-background p-6">
              <div className="max-w-sm text-center">
                <Home className="mx-auto mb-4 size-10 text-primary" />
                <h2 className="font-heading text-2xl font-extrabold">
                  {state.failure === "auth"
                    ? "Sign in to enter this world"
                    : state.failure === "forbidden"
                      ? "This home is private"
                      : state.failure === "missing"
                        ? "This home is no longer available"
                        : "The world could not connect"}
                </h2>
                <p
                  className="my-4 text-sm leading-relaxed text-muted-foreground"
                  role="alert"
                >
                  {state.error}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {state.failure === "auth" ? (
                    <Button asChild>
                      <a
                        href={
                          platform?.loginHref(entryReturnTo()) ??
                          "/login?returnTo=" +
                            encodeURIComponent(entryReturnTo())
                        }
                      >
                        Sign in to continue
                      </a>
                    </Button>
                  ) : state.failure === "forbidden" ||
                    state.failure === "missing" ? (
                    <Button onClick={() => void enter("me")}>
                      Go to my home
                    </Button>
                  ) : (
                    <Button onClick={() => void retryEntry()}>
                      Try this destination again
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <a href="/play">Choose another destination</a>
                  </Button>
                  <Button asChild variant="ghost">
                    <a href="/play?explore=1">Story exploration</a>
                  </Button>
                </div>
              </div>
            </div>
          )}
          {state.photoMode && (
            <div className="absolute inset-x-4 bottom-4 z-30 flex items-center justify-center gap-2">
              <span className="rounded-lg bg-background px-3 py-2 text-sm">
                {photoCountdown ? "Capturing your moment…" : "Photo mode"}
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
            className="absolute right-3 top-16 z-20 hidden max-h-[min(34rem,calc(100%-5rem))] w-80 overflow-y-auto rounded-2xl border bg-card shadow-xl lg:block"
            aria-label="Resident pet directory"
          >
            <div className="sticky top-0 z-10 flex items-center gap-1 border-b bg-card p-2">
              <Button
                size="icon"
                variant="ghost"
                className="size-7 shrink-0"
                aria-label="Close resident drawer"
                onClick={() => setRight(false)}
              >
                <X className="size-3.5" />
              </Button>
              <Button
                size="sm"
                variant={rightTab === "pets" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setRightTab("pets")}
              >
                Pets
              </Button>
              <Button
                size="sm"
                variant={rightTab === "missions" ? "default" : "ghost"}
                className="flex-1"
                onClick={() => setRightTab("missions")}
              >
                Missions
              </Button>
            </div>
            {rightTab === "pets" ? (
              <PetsPanel state={state} />
            ) : (
              <div className="p-4">
                <MissionList
                  missions={homeMissions(data)}
                  pinned={data.player.facts
                    .find((f) => f.startsWith("mission-pin:"))
                    ?.slice(12)}
                  onPin={(target) => action({ type: "mission-pin", target })}
                  onDetails={() => setPanel("board")}
                />
              </div>
            )}
          </aside>
        )}
      </div>
      {!state.photoMode && (
        <>
          <PlayFooter
            actions={controls}
            appearance={state.data?.player.appearance ?? gameState.progress.appearance}
            notice={state.notice}
            saveLabel={
              state.status === "online"
                ? "Server save"
                : state.status === "error"
                  ? "Connection unavailable"
                  : "Connecting…"
            }
            onMenuOpenChange={setControlsOpen}
            onMeme={id => live({ type: 'player.meme', meme: id })}
          />
          {state.error && state.status !== "error" && (
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
                onClick={() => patch({ error: "" })}
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
              modal={mobile !== "decoration"}
              open={!!mobile && window.innerWidth < 1024}
              onOpenChange={(open) => {
                if (!open) setMobile(null);
              }}
            >
              <DialogContent
                className={
                  (mobile === "decoration"
                    ? "h-[46dvh] "
                    : "h-[min(80dvh,42rem)] ") +
                  "bottom-0 top-auto flex max-h-[85dvh] translate-y-0 flex-col gap-0 overflow-hidden rounded-t-2xl p-0 sm:max-w-lg"
                }
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>
                    {mobile === "pets"
                      ? "Resident pets"
                      : mobile === "decoration"
                        ? "Decorate your home"
                        : "Social panel"}
                  </DialogTitle>
                  <DialogDescription>
                    Keep your home world close while you connect.
                  </DialogDescription>
                </DialogHeader>
                {mobile === "pets" ? (
                  <div className="overflow-y-auto">
                    <PetsPanel state={state} />
                  </div>
                ) : mobile === "decoration" ? (
                  <div className="p-4 text-sm">
                    Use the live decoration editor.
                  </div>
                ) : (
                  social
                )}
              </DialogContent>
            </Dialog>
          )}
        </>
      )}
    </PlayShell>
  );
}
