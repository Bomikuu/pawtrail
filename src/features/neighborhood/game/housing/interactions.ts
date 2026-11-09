import type { ActionPhase, Point, InteractionStatus } from "./types";
export type InteractionRequest = {
  target: string;
  label: string;
  action: string;
  point: Point;
  lookAt?: Point;
  path: Point[];
  duration: number;
  onComplete?: () => void | boolean | Promise<void | boolean>;
  supply?: string;
  held?: boolean;
  local?: boolean;
};
type Active = InteractionRequest & {
  id: string;
  phase: ActionPhase;
  since: number;
  sent: boolean;
  awaitingComplete?: boolean;
  finishing?: boolean;
  exit?: Point;
};
export const ACTION_LABELS: Record<string, string> = {
  inspect: "Take a look",
  sit: "Sit down",
  rest: "Rest here",
  fill_food: "Fill food bowl",
  fill_water: "Refill water",
  water_plant: "Water plant",
  care_aquarium: "Care for aquarium",
  toggle_light: "Switch light",
  toggle_door: "Open / close door",
  encourage_climb: "Invite a cat to climb",
  pet: "Pet gently",
  feed: "Offer food",
  water: "Offer water",
  play: "Play together",
  profile: "View animal profile",
};
/** No React updates per frame. The host owns simulation and renderer-specific poses. */
export class InteractionController {
  active: Active | null = null;
  constructor(
    private hooks: {
      status: (s: InteractionStatus) => void;
      now?: () => number;
      send: (e: Record<string, unknown>) => void;
      path: (p: Point[]) => void;
      face: (p: Point) => void;
      pose: (name: string) => void;
      recover: (exit?: Point) => void;
      message: (s: string) => void;
    },
  ) {}
  private phase(phase: ActionPhase, time: number) {
    if (!this.active) return;
    this.active.phase = phase;
    this.active.since = time;
    this.hooks.status({
      id: this.active.id,
      target: this.active.target,
      label: this.active.label,
      phase,
      held: this.active.held,
    });
  }
  start(request: InteractionRequest, time: number) {
    this.cancel();
    this.active = {
      ...request,
      id: crypto.randomUUID(),
      phase: "select",
      since: time,
      sent: false,
    };
    this.phase("select", time);
    this.hooks.path(request.path);
    this.phase("approach", time);
  }
  cancel(message = "") {
    const a = this.active;
    if (!a) return;
    if (a.sent && !a.local)
      this.hooks.send({ type: "interaction.cancel", actionId: a.id });
    this.phase("recover", performance.now());
    this.hooks.path([]);
    this.hooks.recover(a.exit);
    this.active = null;
    this.hooks.status(null);
    if (message) this.hooks.message(message);
  }
  step(time: number, position: Point, pathEmpty: boolean) {
    const a = this.active;
    if (!a) return;
    if (time - a.since > 20000 && a.phase !== "complete") {
      this.cancel("That action could not finish. Choose the target again.");
      return;
    }
    if (a.phase === "approach" && pathEmpty) {
      if (Math.hypot(position.x - a.point.x, position.y - a.point.y) > 16) {
        this.cancel("The way is blocked. Choose an open side.");
        return;
      }
      this.hooks.face(a.lookAt ?? a.point);
      this.phase("align", time);
    } else if (a.phase === "align" && time - a.since >= 100) {
      this.phase("perform", time);
      this.hooks.pose(
        (
          {
            sit: "sit",
            rest: "sleep",
            fill_food: "feed",
            fill_water: "refill_water",
            water_plant: "refill_water",
            care_aquarium: "clean",
            pet: "pet",
            feed: "feed",
            water: "refill_water",
            play: "play",
          } as Record<string, string>
        )[a.action] ?? "inspect_furniture",
      );
      if (!a.target.startsWith("pet:") && !a.local) {
        a.sent = true;
        this.hooks.send({
          type: "interaction.begin",
          actionId: a.id,
          target: a.target,
          action: a.action,
          ...(a.supply ? { supply: a.supply } : {}),
        });
      }
    } else if (a.phase === "perform" && time - a.since >= a.duration) {
      if (a.local) {
        if (a.finishing) return;
        a.finishing = true;
        const result = a.onComplete?.();
        if (result && typeof (result as Promise<unknown>).then === "function") {
          void Promise.resolve(result)
            .then((ok) => {
              if (this.active?.id !== a.id) return;
              if (ok === false) {
                this.cancel();
                return;
              }
              this.phase("complete", this.hooks.now?.() ?? time);
            })
            .catch(() => {
              if (this.active?.id === a.id)
                this.cancel("This action could not finish. Try again.");
            });
        } else if (result === false) this.cancel();
        else this.phase("complete", time);
        return;
      }
      if (a.target.startsWith("pet:")) {
        if (!a.sent) {
          a.sent = true;
          this.hooks.send({
            type: "pet.interact",
            actionId: a.id,
            pet: a.target.slice(4),
            action: a.action,
            ...(a.supply ? { supply: a.supply } : {}),
          });
        }
      } else if (a.sent && !a.awaitingComplete) {
        a.awaitingComplete = true;
        this.hooks.send({ type: "interaction.complete", actionId: a.id });
      }
    } else if (a.phase === "complete" && !a.held && time - a.since > 350) {
      this.active = null;
      this.hooks.status(null);
      this.hooks.recover();
    }
  }
  receive(event: Record<string, unknown>, time: number) {
    const a = this.active;
    if (!a || event.actionId !== a.id) return;
    if (event.type === "error") {
      this.cancel(String(event.text ?? "Try this action again."));
      return;
    }
    if (event.type === "interaction.started") {
      a.duration = Number(event.duration) * 1000;
      a.since = time;
      a.sent = true;
      if (Array.isArray(event.exit))
        a.exit = { x: Number(event.exit[0]), y: Number(event.exit[1]) };
    }
    if (
      event.type === "interaction.completed" ||
      event.type === "pet.updated"
    ) {
      a.held = a.action === "sit" || a.action === "rest";
      this.phase("complete", time);
      this.hooks.message(
        a.held
          ? "A quiet moment. Move or press Esc to stand."
          : a.action === "inspect"
            ? "You take a closer look."
            : "Care complete.",
      );
    }
    if (event.type === "interaction.released") {
      this.active = null;
      this.hooks.recover(a.exit);
      this.hooks.status(null);
    }
  }
  retarget(point: Point, path: Point[], lookAt: Point) {
    const a = this.active;
    if (!a || a.phase !== "approach") return;
    a.point = point;
    a.lookAt = lookAt;
    this.hooks.path(path);
  }
  get locksMovement() {
    return (
      !!this.active &&
      ["align", "perform", "complete"].includes(this.active.phase)
    );
  }
}
