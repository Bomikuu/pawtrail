import { useEffect, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Footprints,
  Home,
  MapPin,
  MousePointer2,
  PawPrint,
  Utensils,
  X,
  Heart,
  ExternalLink,
  Smile,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  companions,
  combinedAnimals,
  animalCommand,
  startMove,
  reorderAnimals,
  patchCompanions,
  type Companion,
} from "@/features/neighborhood/game/companions/store";
import { gameStore, publish } from "@/features/neighborhood/game/store";
import { homes } from "@/features/neighborhood/game/housing/client";
import { animalPlaceholder } from "@/features/neighborhood/game/animal-placeholder";
import { navigatePlay } from "@/features/neighborhood/game/play-navigation";
import { PlayerPortrait } from "./player-portrait";
const emit = (name: string, detail: unknown) =>
  window.dispatchEvent(new CustomEvent(name, { detail }));
function Portrait({ animal }: { animal: Companion }) {
  return (
    <img
      src={
        animal.profile.photo?.url ??
        animalPlaceholder(animal.profile.species, animal.sprite) ??
        "/pawtrail-game/discovery/cat-placeholder-v1.webp"
      }
      alt=""
      className="size-full rounded-full object-cover"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src =
          animalPlaceholder(animal.profile.species, animal.sprite) ??
          "/pawtrail-game/discovery/cat-placeholder-v1.webp";
      }}
    />
  );
}
export function AnimalTray() {
  const state = useSyncExternalStore(
      companions.subscribe,
      companions.get,
      companions.get,
    ),
    housing = useSyncExternalStore(homes.subscribe, homes.get, homes.get);
  const selectedAppearance = useSyncExternalStore(gameStore.subscribe,
    () => gameStore.getSnapshot().progress.appearance ?? 'rescuer',
    () => 'rescuer');
  const [rosterOpen, setRosterOpen] = useState(false);
  useEffect(() => {
    const cancel = (event: KeyboardEvent) => {
      if (event.key === "Escape" && companions.get().moveTarget) {
        event.preventDefault();
        event.stopPropagation();
        patchCompanions({ moveTarget: null });
      }
    };
    window.addEventListener("keydown", cancel, true);
    return () => window.removeEventListener("keydown", cancel, true);
  }, []);
  if (housing.decoration || housing.photoMode || housing.interaction)
    return null;
  const all = combinedAnimals(),
    present = all.filter((a) => a.room === state.room),
    ordered = [...present].sort((a, b) => {
      const ai = state.order.indexOf(a.id),
        bi = state.order.indexOf(b.id);
      return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
    });
  const movePortrait = (id: string, direction: number) => {
    const order = ordered.map((a) => a.id),
      index = order.indexOf(id),
      next = Math.max(0, Math.min(order.length - 1, index + direction));
    order.splice(index, 1);
    order.splice(next, 0, id);
    void reorderAnimals(order);
  };
  const item = (animal: Companion) => {
    const own = animal.owner === "local" || animal.owner === state.player,
      here = animal.room === state.room,
      needsAttention = animal.needs.food < 30 || animal.needs.water < 30;
    return (
      <DropdownMenu key={animal.id}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={
              "relative size-14 shrink-0 rounded-full border-2 bg-secondary p-0.5 shadow-sm " +
              (state.selected === animal.id
                ? "border-primary"
                : needsAttention
                  ? "border-amber-600"
                  : "border-background")
            }
            aria-label={
              animal.profile.name +
              (needsAttention ? " needs game care" : "") +
              (animal.following ? " · accompanying you" : "")
            }
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData(
                "application/pawtrail-animal",
                animal.id,
              )
            }
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const id = event.dataTransfer.getData(
                  "application/pawtrail-animal",
                ),
                order = ordered.map((a) => a.id),
                from = order.indexOf(id),
                to = order.indexOf(animal.id);
              if (from >= 0 && to >= 0) {
                order.splice(from, 1);
                order.splice(to, 0, id);
                void reorderAnimals(order);
              }
            }}
            onClick={() => patchCompanions({ selected: animal.id })}
          >
            <Portrait animal={animal} />
            {animal.following && (
              <span className="absolute -bottom-1 -right-1 rounded-full border bg-background p-0.5">
                <Footprints className="size-3 text-primary" />
              </span>
            )}
            {needsAttention && (
              <span className="absolute -left-1 -top-1 rounded-full bg-amber-100 p-1 text-amber-900">
                {animal.needs.water < 30 ? (
                  <Droplets className="size-3" />
                ) : (
                  <Utensils className="size-3" />
                )}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          className="pawtrail-game w-72 text-foreground"
        >
          <div className="space-y-3 p-3">
            <div>
              <p className="font-heading text-xl font-bold">
                {animal.profile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {animal.source === "local"
                  ? "Local story animal"
                  : animal.following
                    ? "Visiting companion"
                    : "Animal in this house"}{" "}
                · Virtual game needs
              </p>
            </div>
            {(["food", "water"] as const).map((kind) => (
              <div key={kind}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="flex items-center gap-1">
                    {kind === "food" ? (
                      <Utensils className="size-3" />
                    ) : (
                      <Droplets className="size-3" />
                    )}
                    {kind === "food" ? "Food" : "Water"}
                    {animal.needs[kind] < 30 ? " needed" : ""}
                  </span>
                  <span className="tabular-nums">
                    {Math.round(animal.needs[kind])}%
                  </span>
                </div>
                <Progress value={animal.needs[kind]} className="h-1.5" />
              </div>
            ))}
          </div>
          <DropdownMenuItem
            disabled={!own || !here || state.busy}
            onSelect={() => void animalCommand("follow", animal.id)}
          >
            <Footprints className="size-4" />
            Follow me
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!own || !here || state.busy}
            onSelect={() => void animalCommand("stay", animal.id)}
          >
            <PawPrint className="size-4" />
            Stay here
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!own || !here || state.busy}
            onSelect={() => {
              if (animal.source === "local" && !animal.following)
                void animalCommand("follow", animal.id).then(() =>
                  startMove(animal.id),
                );
              else startMove(animal.id);
            }}
          >
            <MousePointer2 className="size-4" />
            Move to a spot…
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!own || !here || state.busy}
            onSelect={() => {
              startMove(animal.id);
              emit("pawtrail:animal-come", animal.id);
            }}
          >
            <MapPin className="size-4" />
            Come here
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!animal.following || !own || state.busy}
            onSelect={() => void animalCommand("home", animal.id)}
          >
            <Home className="size-4" />
            Return home
          </DropdownMenuItem>
          {(["feed", "water", "pet"] as const).map((action) => (
            <DropdownMenuItem
              key={action}
              disabled={!here || state.busy}
              onSelect={() =>
                emit("pawtrail:animal-care", { id: animal.id, action })
              }
            >
              {action === "feed" ? (
                <Utensils className="size-4" />
              ) : action === "water" ? (
                <Droplets className="size-4" />
              ) : (
                <Heart className="size-4" />
              )}
              {action === "feed"
                ? "Offer food"
                : action === "water"
                  ? "Offer water"
                  : "Pet gently"}
            </DropdownMenuItem>
          ))}
          {['orange_tabby','orange-tabby'].includes(animal.sprite) && <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!own || !here || state.busy}>
              <Smile className="size-4" />Game emote
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="pawtrail-game max-h-[min(480px,var(--radix-dropdown-menu-content-available-height))] w-56 overflow-y-auto text-foreground">
              <p className="px-2 py-1.5 text-xs text-muted-foreground">Cosmetic preview on this device</p>
              {([['sad','Sad / cry'],['happy','Happy jump'],['laughing','Laugh'],['sick','Sick'],['angry','Angry'],['surprised','Surprised'],['play','Play with yarn'],['dance','Disco dance'],['float','Float on a cloud'],['car','Car rooftop ride'],['sleepy','Sleep · Zzz'],['tired','Tired']] as const).map(([id,label]) => (
                <DropdownMenuItem key={id} onSelect={() => emit('pawtrail:animal-emote', { id: animal.id, emote: id })}>
                  <img src={'/pawtrail-game/game-assets/emote-fx-v3/'+id+'.png'} width={32} height={32} alt="" className="size-8 [image-rendering:pixelated]" />{label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>}
          <DropdownMenuItem onSelect={() => navigatePlay("world", "care-shop")}>
            <Utensils className="size-4" />
            Care supplies shop
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => emit("pawtrail:locate-animal", animal.id)}
          >
            <MapPin className="size-4" />
            Locate animal
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() =>
              animal.source === "local"
                ? navigatePlay("explore", "journal")
                : publish({
                    platformAnimalRequest: animal.profile.id ?? animal.id,
                  })
            }
          >
            <ExternalLink className="size-4" />
            Open{" "}
            {animal.source === "local" ? "story journal" : "animal profile"}
          </DropdownMenuItem>
          <div className="flex gap-1 border-t p-1">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 rounded-md text-xs"
              onClick={() => movePortrait(animal.id, -1)}
            >
              <ArrowLeft className="size-3" />
              Portrait left
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 rounded-md text-xs"
              onClick={() => movePortrait(animal.id, 1)}
            >
              Portrait right
              <ArrowRight className="size-3" />
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
  return (
    <>
      <section
        className="absolute bottom-36 left-3 z-20 max-w-[calc(100%-1.5rem)] rounded-lg border bg-background/95 p-2 shadow-md md:bottom-4 md:left-4"
        aria-label={
          state.room.startsWith("story:")
            ? "Animal companions"
            : "Animals in this house"
        }
      >
        <PlayerPortrait
          appearance={state.room.startsWith('story:') ? selectedAppearance : housing.data?.player.appearance ?? selectedAppearance}
          name={housing.data?.player.name}
          local={state.room.startsWith('story:')}
        />
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold">
            <PawPrint className="size-3.5 text-primary" />
            {state.room.startsWith("story:")
              ? "Your animal friends"
              : "Animals here"}{" "}
            <span className="text-muted-foreground">{present.length}</span>
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 rounded-md px-1 text-[10px]"
            onClick={() => setRosterOpen(true)}
          >
            Roster
          </Button>
        </div>
        <div className="flex items-center gap-1.5">
          {ordered.slice(0, 4).map(item)}
          {ordered.length > 4 && (
            <Button
              variant="outline"
              className="size-12 rounded-full"
              onClick={() => setRosterOpen(true)}
            >
              +{ordered.length - 4}
            </Button>
          )}
          {!present.length && (
            <p className="max-w-44 text-xs text-muted-foreground">
              Meet a cat in Explore or bring a companion from your house.
            </p>
          )}
        </div>
        {state.moveTarget && (
          <div className="mt-2 flex max-w-64 items-center gap-2 border-t pt-2 text-xs">
            <MousePointer2 className="size-4 shrink-0" />
            <span>Choose an open spot. Escape cancels.</span>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 shrink-0 rounded-md"
              onClick={() => patchCompanions({ moveTarget: null })}
              aria-label="Cancel animal move"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
        {state.error && (
          <div
            role="alert"
            className="mt-2 flex max-w-72 gap-2 border-t pt-2 text-xs text-destructive"
          >
            <span>{state.error}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 shrink-0"
              onClick={() => patchCompanions({ error: "" })}
              aria-label="Dismiss animal message"
            >
              <X className="size-3" />
            </Button>
          </div>
        )}
      </section>
      <Dialog open={rosterOpen} onOpenChange={setRosterOpen}>
        <DialogContent className="pawtrail-game max-h-[80dvh] overflow-y-auto text-foreground sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Your animal circle</DialogTitle>
            <DialogDescription>
              Residents and companions keep their own identities. Food and water
              are virtual game needs.
            </DialogDescription>
          </DialogHeader>
          {all.length ? (
            <div className="space-y-2">
              {all.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <div className="size-12 shrink-0 overflow-hidden rounded-full bg-secondary">
                    <Portrait animal={a} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{a.profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.room === state.room
                        ? "Here now"
                        : a.following
                          ? "Accompanying you"
                          : "At home or another game space"}{" "}
                      · Food {Math.round(a.needs.food)}% · Water{" "}
                      {Math.round(a.needs.water)}%
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={a.room !== state.room}
                    onClick={() => {
                      setRosterOpen(false);
                      emit("pawtrail:locate-animal", a.id);
                    }}
                  >
                    Locate
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <img
                src="/pawtrail-game/discovery/cat-placeholder-v1.webp"
                alt=""
                className="mx-auto mb-3 size-24 object-contain"
              />
              <p className="text-sm text-muted-foreground">
                Your animal circle is waiting to grow.
              </p>
              <Button
                className="mt-4 rounded-md"
                onClick={() => {
                  setRosterOpen(false);
                  navigatePlay("explore");
                }}
              >
                Meet animals in Explore
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
