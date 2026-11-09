import { useSyncExternalStore } from "react";
import {
  Armchair,
  Droplets,
  Eye,
  HandHeart,
  Lightbulb,
  LoaderCircle,
  PawPrint,
  Sprout,
  Utensils,
  X,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { homes, scene, patch } from "@/features/neighborhood/game/housing/client";
import { furniture } from "@/features/neighborhood/game/housing/geometry";
import { animalPlaceholder } from "@/features/neighborhood/game/animal-placeholder";
import {
  InteractionAction,
  InteractionDialog,
  InteractionPortrait,
} from "../shared/interaction-card";
import { LivingPortrait } from "../shared/living-portrait";
const icons: Record<string, typeof Eye> = {
  sit: Armchair,
  rest: Armchair,
  pet: HandHeart,
  feed: Utensils,
  fill_food: Utensils,
  water: Droplets,
  fill_water: Droplets,
  water_plant: Sprout,
  toggle_light: Lightbulb,
  encourage_climb: PawPrint,
  play: PawPrint,
};
export function InteractionHud() {
  const state = useSyncExternalStore(homes.subscribe, homes.get, homes.get),
    menu = state.interactionMenu,
    active = state.interaction;
  const petId = menu?.target.startsWith("pet:")
    ? menu.target.slice(4)
    : undefined;
  const pet = petId
    ? state.pets.find((animal) => animal.id === petId)
    : undefined;
  const placement = state.data?.house.activeLayout.find(
    (item) => item.id === menu?.target,
  );
  const object = placement ? furniture[placement.item] : undefined;
  const portrait = pet
    ? (pet.profile.photo?.url ??
      animalPlaceholder(pet.profile.species, pet.sprite))
    : object?.file;
  return (
    <>
      {menu && (
        <InteractionDialog
          open
          onClose={() => patch({ interactionMenu: null })}
          title={menu.label}
          subtitle={
            pet
              ? "Your animal care circle · Virtual care"
              : "Make yourself at home"
          }
          portrait={
            <InteractionPortrait>
              {pet ? <LivingPortrait identity={pet.sprite} name={menu.label} fallback={portrait} /> : portrait ? (
                <img
                  src={portrait}
                  alt={pet ? `${menu.label} portrait` : menu.label}
                  className="size-full object-contain [image-rendering:pixelated]"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = pet
                      ? (animalPlaceholder(pet.profile.species, pet.sprite) ??
                        "/pawtrail-game/discovery/cat-placeholder-v1.webp")
                      : "/pawtrail-game/game-assets/portraits/paw_indicator_0.png";
                  }}
                />
              ) : (
                <PawPrint className="m-auto size-16 text-[#86582f]" />
              )}
            </InteractionPortrait>
          }
          actions={menu.actions.map((action) => {
            const Icon = icons[action.id] ?? Eye;
            const perform = () =>
              scene({
                type: "object-action",
                target: menu.target,
                action: action.id,
              });
            return action.id === "inspect" || action.id === "profile" ? (
              <Button
                key={action.id}
                data-action
                variant="outline"
                className="min-h-11 rounded-md border-[#bc8751] bg-[#fff7e9] text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]"
                onClick={perform}
              >
                <Icon className="size-4" />
                {action.label}
              </Button>
            ) : (
              <InteractionAction
                key={action.id}
                data-action
                className="min-h-12 px-3 text-sm sm:min-h-14 sm:px-4 sm:text-base"
                onClick={perform}
              >
                <Icon className="size-5" />
                {action.label}
              </InteractionAction>
            );
          })}
        >
          <p className="text-base leading-relaxed font-medium sm:text-lg">
            {pet
              ? `Spend a little time with ${menu.label}. Offer a meal, fresh water, or a gentle moment together.`
              : `Take a moment with the ${menu.label.toLowerCase()}. Choose what you’d like to do.`}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-[#805d3c]">
            Your rescuer will walk to an open side before starting. Press Esc to
            close.
          </p>
        </InteractionDialog>
      )}
      {active && !menu && (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-28 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 items-center gap-3 rounded-md border bg-background px-4 py-3 text-sm shadow-lg"
        >
          {active.phase === "complete" ? (
            <PawPrint className="size-4 shrink-0 text-primary" />
          ) : (
            <LoaderCircle className="size-4 shrink-0 motion-safe:animate-spin" />
          )}
          <span>
            <span className="block font-semibold">{active.label}</span>
            <span className="text-xs text-muted-foreground">
              {active.phase === "approach"
                ? "Walking over…"
                : active.phase === "align"
                  ? "Getting into place…"
                  : active.phase === "complete"
                    ? active.held
                      ? "Move or press Esc to stand."
                      : "All done."
                    : "Taking a moment…"}
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 rounded-md"
            aria-label="Cancel action or stand up"
            onClick={() => scene({ type: "cancel-action" })}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}
      {typeof window !== "undefined" &&
        new URLSearchParams(window.location.search).has("geometry") && (
          <Button
            variant={state.debugGeometry ? "default" : "outline"}
            size="sm"
            className="absolute bottom-44 right-3 z-30 rounded-md"
            onClick={() =>
              scene({ type: "debug-geometry", enabled: !state.debugGeometry })
            }
          >
            <Bug className="size-4" />
            Collision geometry
          </Button>
        )}
    </>
  );
}
