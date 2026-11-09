import {AbilityStatus} from './ability-status';
import { Progress } from "@/components/ui/progress";
import { useEffect, type ReactNode } from "react";
import {
  PawPrint,
  Plus,
  Minus,
  Minimize,
  Maximize,
  Expand,
  ChevronDown,
  Compass,
  Home,
  Map,
  MapPin,
  MoreHorizontal,
  Sprout,
  Columns2,
  UserRound,
  Armchair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { navigatePlay, navigateActorComparison, navigateActorPreview, navigateFurnitureCreator, navigateFurnitureComparison, type PlayDestination } from "@/features/neighborhood/game/play-navigation";
import { PLAY_CONTROLS, type PlayControlActions } from "./play-controls";
import { CatMemeWheel } from "./cat-meme-wheel";
import type { CatMemeId } from "@/features/neighborhood/game/cat-memes";

export function PlayShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.body.dataset.pawtrailGame = "true";
    return () => {
      delete document.body.dataset.pawtrailGame;
    };
  }, []);
  return (
    <TooltipProvider delayDuration={150}>
      <div className="pawtrail-game relative flex h-dvh w-full min-h-0 max-w-none flex-col overflow-hidden bg-background text-foreground">
        {children}
        <AbilityStatus/>
      </div>
    </TooltipProvider>
  );
}
const spaces: {
  destination: PlayDestination;
  label: string;
  Icon: typeof Home;
}[] = [
  { destination: "explore", label: "Explore the neighborhood", Icon: Compass },
  { destination: "home", label: "My house", Icon: Home },
  { destination: "yard", label: "My yard", Icon: Sprout },
  { destination: "world", label: "Shared community world", Icon: Map },
  { destination: "places", label: "Places map", Icon: MapPin },
];
export function PlayHeader({
  location,
  details,
  children,
  balance,
  scope,
  disabledNavigation = false,
  onMenuOpenChange,
}: {
  location: string;
  details?: ReactNode;
  children?: ReactNode;
  balance: number | null;
  scope: "local" | "server";
  disabledNavigation?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}) {
  return (
    <header className="relative z-30 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-2 md:h-16 md:px-5 md:py-0">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <img
          src="/pawtrail-game/game-assets/portraits/rescuer.png"
          width="32"
          height="32"
          alt=""
          className="size-8 shrink-0 [image-rendering:pixelated]"
        />
        <div className="hidden sm:block">
          <h1 className="font-heading text-xl font-black leading-none md:text-2xl">
            Paw<span className="text-primary">Trail</span>
          </h1>
          <p className="mt-1 hidden text-[10px] text-muted-foreground xl:block">
            A little care goes a long way.
          </p>
        </div>
      </div>
      <div className="mx-2 hidden min-w-0 flex-1 items-center gap-3 text-muted-foreground lg:flex">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{location}</span>
        </span>
        <div className="flex shrink-0 items-center gap-2 text-xs">
          {details}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 lg:flex-none">
        <DropdownMenu onOpenChange={onMenuOpenChange}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-10 shrink-0 gap-1.5 rounded-md px-2 text-foreground sm:px-3"
              disabled={disabledNavigation}
            >
              <Compass className="size-4" />
              <span className="hidden sm:inline">Your spaces</span>
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="pawtrail-game min-w-60 text-foreground"
          >
            {spaces.map(({ destination, label, Icon }) => (
              <DropdownMenuItem
                key={destination}
                className="min-h-11 text-foreground"
                onSelect={() => navigatePlay(destination)}
              >
                <Icon className="size-4" />
                {label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="min-h-11 text-foreground" onSelect={navigateActorComparison}>
              <Columns2 className="size-4" />Compare character styles
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-foreground" onSelect={navigateActorPreview}>
              <UserRound className="size-4" />Character creator
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-foreground" onSelect={navigateFurnitureCreator}><Armchair className="size-4" />Furniture creator</DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 text-foreground" onSelect={navigateFurnitureComparison}><Armchair className="size-4" />Furniture comparison</DropdownMenuItem>
            {window.location.pathname.startsWith("/play") && (
              <DropdownMenuItem asChild className="min-h-11 text-foreground">
                <a href="/community">Community feed</a>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        {children}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="ml-1 flex shrink-0 items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5 sm:px-3"
              tabIndex={0}
            >
              <img
                src="/pawtrail-game/game-assets/portraits/kibble_coin_0.png"
                width="24"
                height="24"
                alt=""
                className="size-6 [image-rendering:pixelated]"
              />
              <span
                className="text-sm font-extrabold tabular-nums"
                aria-label={`${balance ?? "Unavailable"} ${scope === "local" ? "local" : "server-saved"} Game Kibble, separate from verified community rewards`}
              >
                {balance ?? "—"}
              </span>
              <span className="hidden text-[10px] sm:inline">Game Kibble</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {scope === "local"
              ? "Exploration progress saved on this device"
              : "Housing progress saved by the game service"}
            . Separate from verified platform Kibble.
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
const mobileIds = new Set(["explore", "home", "animals", "inventory"]);
export function PlayFooter({
  actions,
  notice,
  saveLabel,
  onMenuOpenChange,
  onMeme,
  appearance,
}: {
  actions: PlayControlActions;
  notice: string;
  saveLabel: string;
  onMenuOpenChange?: (open: boolean) => void;
  onMeme?: (id: CatMemeId) => void;
  appearance?: string;
}) {
  const control = (item: (typeof PLAY_CONTROLS)[number]) => {
    const state = actions[item.id];
    return (
      <Tooltip key={item.id}>
        <TooltipTrigger asChild>
          <Button
            variant={state.active ? "secondary" : "ghost"}
            className="relative h-12 min-w-12 shrink-0 flex-col gap-0.5 rounded-md px-2 text-[10px] text-foreground"
            disabled={state.disabled}
            aria-label={
              item.label + (state.badge ? ` · ${state.badge} unread` : "")
            }
            aria-pressed={state.active || undefined}
            onClick={state.onSelect}
          >
            <item.Icon className="size-4" />
            <span>{item.label}</span>
            {!!state.badge && (
              <span className="absolute right-1 top-0.5 min-w-3.5 rounded-md bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {state.badge > 99 ? "99+" : state.badge}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{item.label}</TooltipContent>
      </Tooltip>
    );
  };
  return (
    <footer className="relative z-20 shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <nav
        className="flex justify-center overflow-x-auto px-2 py-1"
        aria-label="PawTrail game controls"
      >
        <div className="hidden items-center gap-0.5 xl:flex">
          {PLAY_CONTROLS.map(control)}
        </div>
        <div className="flex items-center gap-0.5 xl:hidden">
          {PLAY_CONTROLS.filter((item) => mobileIds.has(item.id)).map(control)}
          <DropdownMenu onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-12 min-w-12 shrink-0 flex-col gap-0.5 rounded-md px-2 text-[10px] text-foreground"
              >
                <MoreHorizontal className="size-4" />
                <span>More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="pawtrail-game max-h-[65dvh] min-w-56 overflow-y-auto text-foreground"
            >
              {PLAY_CONTROLS.filter((item) => !mobileIds.has(item.id)).map(
                (item) => (
                  <DropdownMenuItem
                    key={item.id}
                    disabled={actions[item.id].disabled}
                    onSelect={actions[item.id].onSelect}
                    className="min-h-11 text-foreground"
                  >
                    <item.Icon className="size-4" />
                    {item.label}
                    {!!actions[item.id].badge && (
                      <span className="ml-auto text-xs tabular-nums">
                        {actions[item.id].badge} unread
                      </span>
                    )}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CatMemeWheel disabled={actions.reactions.disabled} appearance={appearance} onOpenChange={onMenuOpenChange} onMeme={onMeme} />
      </nav>
      <div className="flex min-h-8 items-center justify-between gap-3 border-t px-3 py-1.5 text-[10px] md:px-5">
        <p className="min-w-0 truncate" role="status" aria-live="polite">
          {notice}
        </p>
        <span className="shrink-0 text-muted-foreground">
          {saveLabel}
          <span className="hidden sm:inline"> · Non-cash Game Kibble</span>
        </span>
      </div>
    </footer>
  );
}

export function PlayLoading({
  title = "A neighborhood of little stories.",
  description = "Preparing the paths and waking the paws…",
  progress,
  children,
}: {
  title?: string;
  description?: string;
  progress?: number;
  children?: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-background p-6">
      <div className="w-[min(20rem,calc(100%-1rem))] text-center">
        <img
          src="/pawtrail-game/game-assets/portraits/rescuer.png"
          alt=""
          className="mx-auto mb-5 h-24 w-16 [image-rendering:pixelated]"
        />
        <h2 className="font-heading text-2xl font-extrabold">{title}</h2>
        <p className="mb-5 mt-2 text-sm text-muted-foreground">{description}</p>
        {progress !== undefined && (
          <Progress value={Math.max(0, Math.min(100, progress))} />
        )}
        {!children && (
          <p
            role="status"
            className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <PawPrint className="size-4 motion-safe:animate-pulse" />
            {progress === undefined
              ? "Opening your space…"
              : Math.round(progress) + "% ready"}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
export function PlayViewControls({
  onZoomIn,
  onZoomOut,
  onFit,
  onFill,
  onFullscreen,
  className = "",
}: {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit?: () => void;
  onFill?: () => void;
  onFullscreen?: () => void;
  className?: string;
}) {
  const controls = [
    { label: "Zoom in", Icon: Plus, onSelect: onZoomIn },
    { label: "Zoom out", Icon: Minus, onSelect: onZoomOut },
    ...(onFit
      ? [{ label: "Fit the whole space", Icon: Minimize, onSelect: onFit }]
      : []),
    ...(onFill
      ? [{ label: "Fill the viewport", Icon: Maximize, onSelect: onFill }]
      : []),
    ...(onFullscreen
      ? [{ label: "Toggle fullscreen", Icon: Expand, onSelect: onFullscreen }]
      : []),
  ];
  return (
    <div
      className={
        "absolute right-4 top-20 z-10 flex flex-col gap-1 rounded-md border bg-card p-1 shadow-sm motion-safe:transition-[right] motion-safe:duration-150 " +
        className
      }
      role="group"
      aria-label="World view controls"
    >
      {controls.map(({ label, Icon, onSelect }) => (
        <Tooltip key={label}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-11 rounded-md"
              aria-label={label}
              onClick={onSelect}
            >
              <Icon className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">{label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
