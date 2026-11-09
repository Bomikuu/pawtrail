import Phaser from "phaser";
import {
  companions,
  combinedAnimals,
  patchCompanions,
  refreshCompanions,
  animalCommand,
  companionPositions,
  tickLocalNeeds,
  setVisibleLocalAnimals,
  travelLocalCompanions,
  saveLocalCompanionPositions,
  type Companion,
} from "./store";
import {
  animalTexture,
  configureAnimal,
  playAnimal,
  moveActor,
} from "../runtime/actors";
import { companionRequest } from "../housing/client";
import { gameStore } from "../store";
import { reactionAnimation, reactionDuration } from "../reactions";
import type { Navigation } from "../housing/spatial";
import { InteractionController } from "../housing/interactions";
import { audio } from "../systems/audio";
import type { Point } from "../housing/types";
type Actor = {
  sprite: Phaser.GameObjects.Sprite;
  owned: boolean;
  path: Point[];
  commandAt: number;
  nextPlan: number;
  lastTarget?: Point;
};
export class CompanionRuntime {
  private reacting = new Map<string, { until: number; action: string }>();
  private actors = new Map<string, Actor>();
  private room = "";
  private abort?: AbortController;
  private timer?: ReturnType<typeof setInterval>;
  private disposed = false;
  private nextSend = 0;
  private sending = false;
  private marker?: Phaser.GameObjects.Graphics;
  private breadcrumb: Point[] = [];
  private nextNeeds = 0;
  private onEmote = (event: Event) => {
    const detail = (event as CustomEvent<{id: string; emote: string}>).detail;
    if (!detail || !['sad','happy','angry','dance','float','sleepy','tired','surprised','play','laughing','sick','car'].includes(detail.emote) || this.disposed) return;
    const animal = combinedAnimals().find(a => a.id === detail.id);
    if (!animal || !['orange_tabby','orange-tabby'].includes(animal.sprite) || animal.room !== this.room || (animal.owner !== 'local' && animal.owner !== companions.get().player)) return;
    const target = this.actors.get(animal.id)?.sprite ?? this.bindings().get(animal.id);
    if (!target) return;
    const action = reactionAnimation(detail.emote), until = this.scene.time.now + reactionDuration(detail.emote);
    target.setData('modelEmoteAction', action).setData('modelEmoteUntil', until).setData('modelEmoteLock', true);
    this.reacting.set(animal.id, { action, until });
  };
  constructor(
    private scene: Phaser.Scene,
    private player: () => Phaser.GameObjects.Sprite,
    private navigation: () => Navigation | undefined,
    private bindings: () => Map<string, Phaser.GameObjects.Sprite> = () =>
      new Map(),
  ) { window.addEventListener('pawtrail:animal-emote', this.onEmote); }
  setRoom(room: string) {
    if (this.room === room) return;
    this.room = room;
    travelLocalCompanions(room);
    this.breadcrumb = [];
    this.abort?.abort();
    if (this.timer) clearInterval(this.timer);
    this.abort = new AbortController();
    patchCompanions({ room, moveTarget: null, status: "loading" });
    const signal = this.abort.signal;
    const refresh = async () => {
      await refreshCompanions(room, signal);
      if (signal.aborted || this.disposed) return;
      for (const a of companions
        .get()
        .animals.filter(
          (a) =>
            a.following === companions.get().player &&
            a.room !== room &&
            a.command.mode !== "stay",
        )) {
        const q = this.navigation()?.nearest({
          x: this.player().x + 24,
          y: this.player().y + 24,
        });
        if (q) await animalCommand("travel", a.id, [q.x, q.y]);
      }
    };
    void refresh();
    this.timer = setInterval(() => void refresh(), 10000);
  }
  click(point: Point) {
    const id = companions.get().moveTarget;
    if (!id) return false;
    const nav = this.navigation(),
      a = this.actors.get(id),
      origin = a?.sprite ?? companionPositions.get(id);
    if (!nav?.clear(point) || (origin && !nav.path(origin, point).length)) {
      patchCompanions({
        error: "That place is blocked or unreachable. Choose an open spot.",
      });
      return true;
    }
    void animalCommand("move", id, [point.x, point.y]);
    return true;
  }
  controls(id: string) {
    return (
      this.actors.has(id) ||
      (this.reacting.get(id)?.until ?? 0) > this.scene.time.now
    );
  }
  care(
    id: string,
    action: "feed" | "water" | "pet",
    controller: InteractionController,
  ) {
    const animal = combinedAnimals().find((a) => a.id === id),
      target =
        this.actors.get(id)?.sprite ??
        this.bindings().get(id) ??
        companionPositions.get(id),
      nav = this.navigation();
    if (!animal || !target || !nav) {
      patchCompanions({
        error: "Meet this animal in its current space first.",
      });
      return;
    }
    const point = nav.nearest({ x: target.x, y: target.y + 30 }, 24);
    if (!point) {
      patchCompanions({ error: "This animal needs an open approach." });
      return;
    }
    controller.start(
      {
        target: "companion:" + id,
        label:
          (action === "feed"
            ? "Offer food to "
            : action === "water"
              ? "Bring water to "
              : "Pet ") + animal.profile.name,
        action,
        point,
        lookAt: target,
        path: nav.path(this.player(), point),
        duration: 1200,
        local: true,
        onComplete: async () => {
          const current =
            this.actors.get(id)?.sprite ??
            this.bindings().get(id) ??
            companionPositions.get(id);
          if (
            !current ||
            Math.hypot(
              current.x - this.player().x,
              current.y - this.player().y,
            ) > 80
          ) {
            patchCompanions({
              error:
                "This animal moved away. Approach it again before offering care.",
            });
            return;
          }
          const ok = await animalCommand(action, id, [
            this.player().x,
            this.player().y,
          ]);
          if (!ok) return false;
          this.reacting.set(id, {
            until: this.scene.time.now + 2500,
            action:
              action === "feed" ? "eat" : action === "water" ? "drink" : "pet",
          });
          audio.effect(
            action === "feed" ? "feed" : action === "water" ? "water" : "pet",
          );
          return true;
        },
      },
      this.scene.time.now,
    );
  }
  step(time: number, delta: number) {
    if (this.disposed) return;
    const p = this.player(),
      nav = this.navigation();
    if (!nav) return;
    if (!this.marker) this.marker = this.scene.add.graphics().setDepth(22000);
    this.marker.clear();
    if (companions.get().moveTarget) {
      const pointer = this.scene.input.activePointer,
        q = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y),
        valid = nav.clear(q);
      this.marker
        .lineStyle(2, valid ? 0x568c49 : 0xc54735, 0.9)
        .strokeCircle(q.x, q.y, 10);
      this.marker
        .lineBetween(q.x - 4, q.y, q.x + 4, q.y)
        .lineBetween(q.x, q.y - 4, q.x, q.y + 4);
    }
    if (time > this.nextNeeds) {
      this.nextNeeds = time + 20000;
      tickLocalNeeds();
    }
    const last = this.breadcrumb.at(-1);
    if (!last || Math.hypot(last.x - p.x, last.y - p.y) > 8) {
      this.breadcrumb.push({ x: p.x, y: p.y });
      if (this.breadcrumb.length > 200) this.breadcrumb.shift();
    }
    const localState = gameStore.getSnapshot().progress.gameAnimals;
    for (const [id, sprite] of this.bindings()) {
      const a = localState?.[id.replace("local:", "")],
        away = !!a?.companion && a.room !== this.room;
      sprite.setVisible(!away);
      const body = (sprite as Phaser.Physics.Arcade.Sprite).body;
      if (body) body.enable = !away;
    }
    const active = combinedAnimals().filter(
        (a) =>
          a.room === this.room &&
          a.following &&
          (a.source === "local" || a.following === companions.get().player),
      ),
      wanted = new Set(active.map((a) => a.id)),
      bindings = this.bindings();
    for (const [id, actor] of this.actors)
      if (!wanted.has(id)) {
        if (actor.owned) actor.sprite.destroy();
        this.actors.delete(id);
        companionPositions.delete(id);
      }
    active.forEach((a, index) => {
      let actor = this.actors.get(a.id);
      if (!actor) {
        const bound = bindings.get(a.id),
          position =
            a.position && a.room === this.room
              ? { x: a.position.x, y: a.position.y }
              : { x: p.x + (index + 1) * 16, y: p.y + 30 },
          q = nav.nearest(position, 64);
        if (!q) return;
        const sprite =
          bound ??
          this.scene.add
            .sprite(q.x, q.y, animalTexture(a.sprite))
            .setInteractive({ useHandCursor: true });
        sprite.setVisible(true);
        const body = (sprite as Phaser.Physics.Arcade.Sprite).body;
        if (body) body.enable = true;
        configureAnimal(sprite, a.sprite);
        if (!bound)
          sprite.on(
            "pointerdown",
            (
              _: unknown,
              __: unknown,
              ___: unknown,
              event: Phaser.Types.Input.EventData,
            ) => {
              event.stopPropagation();
              patchCompanions({ selected: a.id });
            },
          );
        actor = { sprite, owned: !bound, path: [], commandAt: 0, nextPlan: 0 };
        this.actors.set(a.id, actor);
      }
      const sprite = actor.sprite,
        mode = a.command.mode ?? "follow";
      let target: Point | undefined;
      if (mode === "move" && a.command.point)
        target = { x: a.command.point[0], y: a.command.point[1] };
      else if (mode !== "stay" && mode !== "home")
        target =
          this.breadcrumb[Math.max(0, this.breadcrumb.length - 5 - index * 5)];
      if (target && time > actor.nextPlan) {
        actor.nextPlan = time + 500;
        const distance = Math.hypot(target.x - sprite.x, target.y - sprite.y);
        if (
          distance > 20 &&
          (actor.commandAt !== (a.command.at ?? 0) ||
            !actor.lastTarget ||
            Math.hypot(
              target.x - actor.lastTarget.x,
              target.y - actor.lastTarget.y,
            ) > 16 ||
            !actor.path.length)
        ) {
          const goal = nav.nearest(target, 24);
          if (goal) {
            actor.path = nav.path(sprite, goal);
            actor.lastTarget = goal;
            actor.commandAt = a.command.at ?? 0;
          }
        }
      }
      if (mode === "stay") actor.path = [];
      const crowded = [...this.actors.values()].some(
        (other) =>
          other !== actor &&
          Math.hypot(other.sprite.x - sprite.x, other.sprite.y - sprite.y) <
            12 &&
          other.sprite.y > sprite.y,
      );
      const reaction = this.reacting.get(a.id);
      if (reaction && time < reaction.until) {
        actor.path = [];
        playAnimal(this.scene, sprite, a.sprite, reaction.action);
        return;
      }
      const result = moveActor(
        sprite,
        { x: 0, y: 0 },
        crowded ? [] : actor.path,
        delta,
        nav,
      );
      sprite.setDepth(sprite.y);
      playAnimal(
        this.scene,
        sprite,
        a.sprite,
        result.moving ? "walk_" + result.direction : "idle",
      );
      companionPositions.set(a.id, { x: sprite.x, y: sprite.y });
    });
    for (const [id, reaction] of this.reacting) {
      const bound = bindings.get(id);
      if (bound && time < reaction.until) {
        (bound as Phaser.Physics.Arcade.Sprite).setVelocity?.(0, 0);
        const animal = combinedAnimals().find((a) => a.id === id);
        if (animal)
          playAnimal(this.scene, bound, animal.sprite, reaction.action);
      } else if (time >= reaction.until) this.reacting.delete(id);
    }
    if (
      time > this.nextSend &&
      !this.sending &&
      companions.get().status === "ready"
    ) {
      this.nextSend = time + 2000;
      const positions = active
        .filter((a) => a.source !== "local" && a.room === this.room)
        .map((a) => ({
          id: a.id,
          point: [
            companionPositions.get(a.id)?.x ?? p.x,
            companionPositions.get(a.id)?.y ?? p.y,
          ],
        }));
      if (positions.length) {
        this.sending = true;
        void companionRequest({
          action: "positions",
          room: this.room,
          positions,
        })
          .catch(() => {})
          .finally(() => {
            this.sending = false;
          });
      }
    }
  }
  locate(id: string) {
    const animal = combinedAnimals().find((a) => a.id === id);
    if (animal && animal.room !== this.room) {
      patchCompanions({ error: "This animal is in another game space." });
      return;
    }
    const position = this.actors.get(id)?.sprite ?? companionPositions.get(id);
    if (position) {
      this.scene.cameras.main.pan(position.x, position.y, 200);
      this.scene.time.delayedCall(1000, () => {
        if (this.player()?.scene)
          this.scene.cameras.main.startFollow(this.player(), true, 0.15, 0.15);
      });
    }
  }
  destroy() {
    window.removeEventListener('pawtrail:animal-emote', this.onEmote);
    saveLocalCompanionPositions(
      Object.fromEntries(
        [...this.actors]
          .filter(([id]) => id.startsWith("local:"))
          .map(([id, a]) => [id, { x: a.sprite.x, y: a.sprite.y }]),
      ),
    );
    this.marker?.destroy();
    this.marker = undefined;
    this.disposed = true;
    this.abort?.abort();
    if (this.timer) clearInterval(this.timer);
    for (const a of this.actors.values())
      if (a.owned && a.sprite.scene) a.sprite.destroy();
    this.actors.clear();
    setVisibleLocalAnimals([]);
  }
}
