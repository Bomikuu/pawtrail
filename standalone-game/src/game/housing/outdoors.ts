import Phaser from "phaser";
import art from "./community-art.json";
import { COMMUNITY } from "./community";
import { enter, homes, patch, travelToPlaces } from "./client";
import { furniture } from "./geometry";
import type { House } from "./types";
import { ContactEffects } from '../furniture/contacts'

type Target = { x: number; y: number; label: string; run: () => void };
const panel = (name: string) =>
  window.dispatchEvent(
    new CustomEvent("pawtrail:home-panel", { detail: name }),
  );
const explore = (care = false) =>
  window.location.assign(
    (window.location.pathname === "/" ? "/" : "/play") +
      "?" +
      (care ? "scene=shelter" : "explore=1") +
      (new URLSearchParams(window.location.search).get("demo") === "1"
        ? "&demo=1"
        : ""),
  );
export function preloadCommunity(scene: Phaser.Scene) {
  for (const [key, sprite] of Object.entries(art.sprites))
    scene.load.image("out:" + key, sprite.file);
}
/** Reusable native sprites and ground rectangles. No painted-map backdrop. */
export class Outdoors {
  private contact = new ContactEffects()
  private softPlants: Phaser.GameObjects.Image[] = []
  private objects: Phaser.GameObjects.GameObject[] = [];
  private canopies: Phaser.GameObjects.Image[] = [];
  private targets: Target[] = [];
  constructor(private scene: Phaser.Scene) {}
  destroy() {
    this.objects.forEach((o) => {
      if (o.scene) o.destroy();
    });
    this.objects = [];
    this.canopies = [];
    this.targets = [];
    this.contact.reset()
    this.softPlants = []
  }
  private ground(x: number, y: number, w: number, h: number, frame: number) {
    const o = this.scene.add
      .tileSprite(x * 32, y * 32, w * 32, h * 32, "grass", frame)
      .setOrigin(0)
      .setDepth(-90);
    this.objects.push(o);
    return o;
  }
  private image(key: string, x: number, y: number) {
    const o = this.scene.add.image(x, y, key).setOrigin(0.5, 1).setDepth(y);
    this.objects.push(o);
    return o;
  }
  private label(text: string, x: number, y: number) {
    const o = this.scene.add
      .text(x, y, text.length > 30 ? text.slice(0, 29) + "…" : text, {
        fontFamily: "Saira Condensed",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#493527",
        backgroundColor: "#fff4d9",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5, 0)
      .setDepth(y + 1);
    o.setScale(1 / this.scene.cameras.main.zoom);
    this.objects.push(o);
    return o;
  }
  private target(x: number, y: number, label: string, run: () => void) {
    this.targets.push({ x, y, label, run });
    // A click gives the same proximity requirement as E; no teleports across the map.
    return (
      _: unknown,
      __: unknown,
      ___: unknown,
      event: Phaser.Types.Input.EventData,
    ) => {
      event.stopPropagation();
      if (homes.get().decoration) return;
      window.dispatchEvent(
        new CustomEvent("pawtrail:approach-target", {
          detail: { x, y, label, run },
        }),
      );
    };
  }
  render(h: House) {
    this.destroy();
    const hub = h.id.startsWith("system:hub");
    if (hub) {
      for (const [x, y, w, ht] of COMMUNITY.paths)
        this.ground(x, y, w, ht, y === 49 ? 11 : 9);
      this.ground(0, 52, 80, 4, 12);
      this.ground(38, 52, 4, 4, 11);
      for (const [x, y, w, ht] of COMMUNITY.water) this.ground(x, y, w, ht, 17);
      for (const o of COMMUNITY.objects) {
        if (o.asset === "bench") continue;
        const key = o.asset === "board" ? "community-board" : "out:" + o.asset;
        const sprite = this.image(key, o.x * 32, o.y * 32);
        const run = () => {
          if (o.action === "travel") travelToPlaces();
          else if (o.action === "board") panel("board");
          else if (
            o.action === "shelter" ||
            o.action === "clinic" ||
            o.action === "care"
          )
            explore(true);
          else if (o.action === "pet-shop") panel("care-shop");
          else if (o.action === "supplies") panel("inventory");
          else if (o.action === "workshop") panel("garden-shop");
          else if (o.action === "rest")
            window.dispatchEvent(new Event("pawtrail:community-rest"));
        };
        sprite
          .setInteractive({ useHandCursor: true })
          .on(
            "pointerdown",
            this.target(
              o.x * 32,
              (o.id === "jeepney" ? 52.5 : o.y + 1) * 32,
              o.label,
              run,
            ),
          );
        if (o.id !== "fountain" && o.id !== "jeepney")
          this.label(o.label.split(" · ")[0], o.x * 32, o.y * 32 + 5);
      }
      const [cx, cy, cw, ch] = COMMUNITY.courtyard;
      for (let x = cx; x < cx + cw; x++)
        for (const y of [cy, cy + ch - 1])
          if (y === cy || (x !== cx + 2 && x !== cx + 3))
            this.image("out:fence", x * 32 + 16, y * 32 + 32);
      for (let y = cy + 1; y < cy + ch - 1; y++)
        for (const x of [cx, cx + cw - 1])
          this.image("out:fence", x * 32 + 16, y * 32 + 32);
      this.ground(cx + 1, cy + 1, cw - 2, ch - 2, 1);
      this.image(
        "f:table",
        COMMUNITY.picnic.table[0] * 32,
        COMMUNITY.picnic.table[1] * 32,
      );
      for (const [x, y] of COMMUNITY.picnic.benches) {
        this.image("out:bench", x * 32, y * 32);
        this.target(x * 32, (y + 1) * 32, "Picnic bench", () =>
          window.dispatchEvent(new Event("pawtrail:community-rest")),
        );
      }
      for (const [x, y] of COMMUNITY.trees)
        this.canopies.push(this.image("out:tree", x * 32, y * 32));
      for (const [x, y] of COMMUNITY.plants) {
        this.canopies.push(this.image("out:banana", x * 32, y * 32));
        const bush = this.image('out:bush', x * 32 + 40, y * 32 + 24)
        const id = 'bush:' + x + ',' + y
        bush.setData('contactId', id)
        this.softPlants.push(bush)
        this.contact.sensors.push({ id, kind: 'bush', bounds: { x: bush.x - 14, y: bush.y - 12, width: 28, height: 18 } })
      }
      COMMUNITY.plots.forEach(([x, y], slot) => {
        const plot = h.plots?.find((p) => p.slot === slot);
        this.ground(x, y, 14, 14, 1);
        this.ground(x + 6, y + 6, 2, 8, 8);
        this.fence(x, y);
        const preset = plot?.exterior || "starter-house";
        this.image("out:" + preset, (x + 7) * 32, (y + 6) * 32);
        for (const p of plot?.yardLayout || []) {
          const d = furniture[p.item];
          if (!d) continue;
          this.image("f:" + p.item, (x + p.x) * 32 + 16, (y + p.y) * 32 + 32)
            .setOrigin(d.anchor[0] / d.width, d.anchor[1] / d.height)
            .setAngle(p.rotation)
            .setDepth(d.blocking ? (y + p.y) * 32 + 32 : -50);
        }
        const label = this.label(
          plot?.name || "Unassigned plot",
          (x + 7) * 32,
          (y + 14) * 32 + 2,
        );
        const run = () => {
          if (plot?.available && plot.owner)
            void enter(plot.owner.id + "|yard");
          else
            patch({
              notice:
                plot?.name === "Private property"
                  ? "This property is private. An invitation is needed."
                  : "This plot has not been assigned yet.",
            });
        };
        const hint = this.target(
          (x + 7) * 32,
          (y + 14) * 32 + 16,
          plot?.available
            ? "Enter " + plot.name
            : plot?.name || "Unassigned plot",
          run,
        );
        label.setInteractive({ useHandCursor: true }).on("pointerdown", hint);
      });
      // North-south greenway remains four uninterrupted tiles wide.
      this.label("Paw Plaza", 40 * 32, 20 * 32);
      this.label("Pocket Park", 14 * 32, 4 * 32);
      this.label("Care Hub", 40 * 32, 3 * 32);
      this.label("Market Lane", 68 * 32, 4 * 32);
      this.label("Home Lane · block " + (h.block + 1), 40 * 32, 33 * 32);
      if (h.block > 0)
        this.target(
          40 * 32,
          49 * 32,
          "Previous home block",
          () =>
            void enter(
              "system:hub:" +
                (homes.get().data?.player.sample ? "demo" : "real") +
                (h.block > 1 ? ":block:" + (h.block - 1) : ""),
            ),
        );
    } else {
      this.ground(6, 6, 2, 7, 8);
      this.fence(0, 0);
      this.image("out:" + h.exterior, 7 * 32, 6 * 32);
      this.label(h.name, 7 * 32, 40);
      this.target(
        7 * 32,
        6 * 32 + 24,
        "Enter the house",
        () => void enter(h.id),
      );
      this.target(
        7 * 32,
        13 * 32 - 8,
        "Return to Home Lane",
        () =>
          void enter(
            "system:hub:" +
              (h.owner.sample ? "demo" : "real") +
              (h.communityBlock ? ":block:" + h.communityBlock : ""),
          ),
      );
    }
  }
  private fence(x: number, y: number) {
    // Open two-tile gate at the south edge; no decorative hedge across the route.
    for (let i = 0; i < 14; i++)
      for (const edge of [0, 13])
        if (edge === 0 || i < 6 || i > 7)
          this.image("out:fence", (x + i) * 32 + 16, (y + edge) * 32 + 32);
    for (let i = 1; i < 13; i++)
      for (const edge of [0, 13])
        this.image("out:fence", (x + edge) * 32 + 16, (y + i) * 32 + 32);
  }
  setZoom(zoom: number) {
    for (const object of this.objects)
      if (object instanceof Phaser.GameObjects.Text) object.setScale(1 / zoom);
  }
  near(x: number, y: number) {
    return this.targets
      .filter((t) => Math.hypot(x - t.x, y - t.y) < 82)
      .sort(
        (a, b) => Math.hypot(x - a.x, y - a.y) - Math.hypot(x - b.x, y - b.y),
      )[0];
  }
  step(x: number, y: number, running = false, reduced = false) {
    const now = performance.now()
    this.contact.observe('local', { x, y }, running, false, false, now)
    for (const bush of this.softPlants) bush.setAngle(this.contact.sway(bush.getData('contactId'), now, reduced) * 7)
    for (const tree of this.canopies)
      tree.setAlpha(
        Math.abs(x - tree.x) < 40 && y > tree.y - tree.height && y < tree.y
          ? 0.45
          : 1,
      );
  }
}
