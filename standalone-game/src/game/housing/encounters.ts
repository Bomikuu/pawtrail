import {
  preloadActors,
  registerActors,
  animalTexture,
  playAnimal,
  configureAnimal,
} from "../runtime/actors";
import Phaser from "phaser";
import { immersionPreferences } from "../immersion-preferences";
import native from "./encounter-animations.json";
import { gameStore, publish } from "../store";
import { homes, patch } from "./client";
import { furniture } from "./geometry";
import { worldPoint, type Navigation } from "./spatial";
import type { PlatformAnimal } from "../platform";
import type { Point } from "./types";
const anchors = [
  [15, 23],
  [19, 17],
  [32, 16],
  [51, 10],
  [53, 27],
  [57, 30],
  [24, 29],
  [58, 12],
];
export function preloadEncounters(scene: Phaser.Scene) {
  preloadActors(scene);
}
type Encounter = {
  animal: PlatformAnimal;
  sprite: Phaser.GameObjects.Sprite;
  label: Phaser.GameObjects.Text;
  sheet: string;
  home: Point;
  path: Point[];
  until: number;
  state: string;
  elevation: number;
  surface?: {
    id: string;
    point: Point;
    elevation: number;
    exit: Point;
    base: number;
  };
  jump?: {
    from: Point;
    to: Point;
    fromZ: number;
    toZ: number;
    start: number;
    descending: boolean;
  };
};
/** Cosmetic shared-world encounters. None of these virtual coordinates or poses are sighting evidence. */
export class CommunityEncounters {
  private actors: Encounter[] = [];
  private version = "";
  constructor(private scene: Phaser.Scene) {
    registerActors(scene);
  }
  sync() {
    const h = homes.get().data?.house,
      realm = homes.get().data?.player.sample;
    const animals = h?.id.startsWith("system:hub")
      ? gameStore
          .getSnapshot()
          .platformAnimals.filter((a) =>
            realm ? a.provenance.kind !== "real" : a.provenance.kind === "real",
          )
          .slice(0, anchors.length)
      : [];
    const version = h?.roomId + ":" + JSON.stringify(animals);
    if (version === this.version) return;
    this.version = version;
    this.destroy();
    animals.forEach((animal, index) => {
      const sheet =
        animal.sprite in native.sheets
          ? animal.sprite
          : animal.species === "dog"
            ? "brown_aspin"
            : "orange_tabby";
      const [x, y] = anchors[index],
        sprite = this.scene.add
          .sprite(x * 32 + 16, y * 32 + 28, animalTexture(sheet))
          .setOrigin(0.5, 28 / 32)
          .setDepth(y * 32 + 28)
          .setInteractive({ useHandCursor: true });
      configureAnimal(sprite, sheet);
      const label = this.scene.add
        .text(sprite.x, sprite.y + 5, animal.name, {
          fontFamily: "Saira Condensed",
          fontSize: "10px",
          color: "#503b29",
          backgroundColor: "#fff4dc",
          padding: { x: 4, y: 3 },
        })
        .setOrigin(0.5, 0)
        .setDepth(sprite.y + 1);
      sprite.on(
        "pointerdown",
        (
          _: unknown,
          __: unknown,
          ___: unknown,
          e: Phaser.Types.Input.EventData,
        ) => {
          e.stopPropagation();
          this.menu(animal.id);
        },
      );
      this.actors.push({
        animal,
        sprite,
        label,
        sheet,
        home: { x: sprite.x, y: sprite.y },
        path: [],
        until: 0,
        state: index % 3 ? "idle" : "sit",
        elevation: 0,
      });
    });
  }
  near(x: number, y: number) {
    return this.actors
      .filter((a) => Math.hypot(a.sprite.x - x, a.sprite.y - y) < 65)
      .sort(
        (a, b) =>
          Math.hypot(a.sprite.x - x, a.sprite.y - y) -
          Math.hypot(b.sprite.x - x, b.sprite.y - y),
      )[0];
  }
  target(id: string) {
    return this.actors.find((a) => a.animal.id === id);
  }
  menu(id: string) {
    const a = this.target(id);
    if (!a || homes.get().decoration) return;
    a.path = [];
    a.state = "idle";
    a.until = this.scene.time.now + 15000;
    patch({
      interactionMenu: {
        target: "encounter:" + id,
        label: a.animal.name,
        actions: [
          { id: "profile", label: "View animal profile" },
          { id: "pet", label: "Pet gently in the game" },
          { id: "play", label: "Play in the game" },
        ],
      },
    });
  }
  react(id: string, action: string) {
    const a = this.target(id);
    if (a) {
      a.state = action === "pet" ? "petted" : "happy";
      a.until = this.scene.time.now + 4000;
      a.path = [];
    }
  }
  open(id: string) {
    if (homes.get().decoration) return;
    publish({ platformAnimalRequest: id, dialogue: null });
  }
  step(x: number, y: number, time: number, delta: number, nav?: Navigation) {
    for (let i = 0; i < this.actors.length; i++) {
      const a = this.actors[i];
      let p = { x: a.sprite.x, y: a.sprite.y + a.elevation },
        z = a.elevation;
      if (a.jump) {
        const j = a.jump,
          t = Math.min(1, (time - j.start) / 700);
        p = {
          x: j.from.x + (j.to.x - j.from.x) * t,
          y: j.from.y + (j.to.y - j.from.y) * t,
        };
        z =
          j.fromZ +
          (j.toZ - j.fromZ) * t +
          (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
          immersionPreferences.get().reducedEffects
            ? 0
            : Math.sin(t * Math.PI) * 10);
        if (t >= 1) {
          a.jump = undefined;
          a.state = j.descending ? "idle" : "sleep";
          a.until = time + 10000;
          if (j.descending) a.surface = undefined;
        }
      } else if (a.path.length) {
        const q = a.path[0],
          dx = q.x - p.x,
          dy = q.y - p.y,
          d = Math.hypot(dx, dy),
          step = Math.min(d, (24 * Math.min(delta, 40)) / 1000);
        if (d < 1) a.path.shift();
        else {
          p.x += (dx / d) * step;
          p.y += (dy / d) * step;
          a.state =
            "walk_" +
            (Math.abs(dx) > Math.abs(dy)
              ? dx < 0
                ? "left"
                : "right"
              : dy < 0
                ? "up"
                : "down");
        }
        if (!a.path.length && a.surface && !a.elevation) {
          a.jump = {
            from: p,
            to: a.surface.point,
            fromZ: 0,
            toZ: a.surface.elevation,
            start: time,
            descending: false,
          };
          a.state = "sit";
        }
      } else if (time > a.until && nav) {
        a.until = time + 6500 + i * 800;
        if (a.surface && a.elevation) {
          const q = nav.nearest(a.surface.exit);
          if (q)
            a.jump = {
              from: p,
              to: q,
              fromZ: a.elevation,
              toZ: 0,
              start: time,
              descending: true,
            };
        } else {
          a.state = ["idle", "sit", "sleep", "happy"][
            (Math.floor(time / 9000) + i) % 4
          ];
          const piece = homes
            .get()
            .data?.house.activeLayout.find(
              (piece) =>
                furniture[piece.item].geometry.surfaces.length &&
                Math.hypot(piece.x * 32 - p.x, piece.y * 32 - p.y) < 120 &&
                !this.actors.some(
                  (other) =>
                    other !== a && other.surface?.id.startsWith(piece.id + "/"),
                ),
            );
          if (piece && a.animal.species === "cat" && i % 2 === 0) {
            const surface = furniture[piece.item].geometry.surfaces[0],
              exit = nav.nearest(worldPoint(piece, surface.approach), 16);
            if (exit) {
              a.path = nav.path(p, exit);
              if (a.path.length)
                a.surface = {
                  id: piece.id + "/" + surface.id,
                  point: worldPoint(piece, surface.point),
                  elevation: surface.elevation,
                  exit,
                  base: piece.y * 32 + 34,
                };
            }
          } else if (i % 3 !== Math.floor(time / 6500) % 3) {
            const q = nav.nearest(
              {
                x: a.home.x + Math.sin(time / 9000 + i) * 48,
                y: a.home.y + Math.cos(time / 11000 + i) * 40,
              },
              24,
            );
            if (q) a.path = nav.path(p, q);
          }
        }
      }
      a.elevation = z;
      a.sprite.setPosition(p.x, p.y - z).setDepth(a.surface?.base ?? p.y);
      playAnimal(this.scene, a.sprite, a.sheet, a.state);
      a.label
        .setPosition(a.sprite.x, a.sprite.y + 5)
        .setScale(1 / this.scene.cameras.main.zoom)
        .setDepth(a.sprite.depth + 1)
        .setVisible(Math.hypot(a.sprite.x - x, a.sprite.y - y) < 150);
    }
  }
  destroy() {
    this.actors.forEach((a) => {
      if (a.sprite.scene) a.sprite.destroy();
      if (a.label.scene) a.label.destroy();
    });
    this.actors = [];
  }
}
