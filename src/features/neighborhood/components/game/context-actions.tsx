import {
  ArrowRight,
  Backpack,
  Camera,
  Check,
  Droplets,
  Eye,
  Heart,
  MessageCircle,
  Search,
  Smile,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { careReason, publish, send } from "@/features/neighborhood/game/store";
import { memory, careDone } from "@/features/neighborhood/game/systems/care";
import type { GameSnapshot } from "@/features/neighborhood/game/types";
const actions = [
  ["feed", "Feed", Utensils],
  ["pet", "Pet", Heart],
  ["water", "Water", Droplets],
  ["rescue", "Rescue", Backpack],
  ["observe", "Observe", Eye],
  ["play", "Play", Smile],
  ["check", "Condition", Search],
  ["photo", "Photo", Camera],
] as const;
export function ContextActions({ state }: { state: GameSnapshot }) {
  const target = state.nearby;
  if (!target || state.paused) return null;
  const trust =
    target.kind === "animal" ? memory(state.progress, target.id).trust : 0;
  return (
    <section
      className="absolute inset-x-3 bottom-36 z-10 mx-auto max-w-xl rounded-2xl border border-[#d5c5a8] bg-card p-3 shadow-lg md:inset-x-auto md:bottom-5 md:left-1/2 md:w-[min(38rem,calc(100%-2rem))] md:-translate-x-1/2"
      aria-label={"Interact with " + target.name}
    >
      <div className="flex items-center gap-3">
        {(target.kind === "animal" || target.kind === "platform-animal") && (
          <img
            src={
              "/pawtrail-game/game-assets/portraits/" + target.sprite + ".png"
            }
            className="size-12 shrink-0 [image-rendering:pixelated]"
            alt=""
          />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="font-heading text-lg font-extrabold">{target.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {target.kind === "animal"
              ? state.busy
                ? "A little kindness in progress…"
                : `${target.state ?? "idle"} · ${trust}/100 trust`
              : target.kind === "npc"
                ? "A neighbor with a story to share."
                : target.kind === "platform-animal"
                  ? "Meet this animal on PawTrail · E / Space"
                  : "Press E / Space, or choose an action."}
          </p>
          {target.kind === "animal" && (
            <Progress value={trust} className="mt-2 h-1" />
          )}
        </div>
        {target.kind === "platform-animal" ? (
          <Button
            onClick={() =>
              publish({
                platformAnimalRequest: target.platformAnimalId ?? null,
                dialogue: null,
              })
            }
          >
            <Heart className="size-4" />
            Meet {target.name}
          </Button>
        ) : (
          target.kind !== "animal" && (
            <Button onClick={() => send({ type: "interact" })}>
              {target.kind === "npc" ? (
                <MessageCircle className="size-4" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {target.id === 'immersion:board' ? 'Open board' : target.kind === "npc"
                ? "Talk"
                : target.kind === "supplies" || target.kind === "pickup"
                  ? "Collect"
                  : target.kind === "exit"
                    ? "Leave"
                    : "Interact"}
            </Button>
          )
        )}
      </div>
      {target.kind === "animal" && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {actions
            .filter(([a]) => a !== "rescue" || target.rescuable)
            .map(([action, label, Icon], index) => {
              const reason = careReason(action, target.id),
                done = careDone(state.progress, target.id, action);
              return (
                <Tooltip key={action}>
                  <TooltipTrigger asChild>
                    <span
                      className="inline-flex"
                      tabIndex={reason ? 0 : undefined}
                    >
                      <Button
                        variant={action === "rescue" ? "default" : "outline"}
                        size="sm"
                        className="h-9 gap-1.5 px-2.5 text-xs"
                        disabled={!!reason || state.busy}
                        onClick={() =>
                          send({ type: "care", action, id: target.id })
                        }
                        aria-label={
                          label +
                          " " +
                          target.name +
                          (reason ? ". " + reason : "")
                        }
                      >
                        {done ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                        {label}
                        {index < 4 && (
                          <kbd className="hidden text-[9px] opacity-60 md:inline">
                            {index + 1}
                          </kbd>
                        )}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {reason ??
                      (action === "photo"
                        ? "Keep an actual in-game photograph"
                        : action === "check"
                          ? "Observe needs without giving medical advice"
                          : action === "rescue"
                            ? "30 trust, a meal, and a rescue kit"
                            : "Gentle care builds trust once each game day")}
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
      )}
    </section>
  );
}
