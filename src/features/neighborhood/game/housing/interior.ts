import Phaser from "phaser";
import { floorPlan, type FloorId } from "./presets";
import { structureArt } from "./room-art";
import { enter, homes } from "./client";
import type { House } from "./types";
export function nearStair(h: House, x: number, y: number) {
  return floorPlan(h.interiorPreset, h.zone)?.stairs.find(
    (s) =>
      Math.hypot(x - (s.landing[0] * 32 + 16), y - (s.landing[1] * 32 + 16)) <
      72,
  );
}
export function changeFloor(h: House, to: FloorId) {
  void enter(h.id + (to === "interior" ? "" : "|" + to), "stairs");
}
export function drawInterior(scene: Phaser.Scene, h: House) {
  const f = floorPlan(h.interiorPreset, h.zone);
  if (!f) return;
  const paints = new Map<number, Phaser.GameObjects.Graphics>();
  for (const art of structureArt(f, h.wallpaper)) {
    if (art.kind === "rect") {
      let paint = paints.get(art.depth);
      if (!paint) {
        paint = scene.add.graphics().setDepth(art.depth).setData("wall", true);
        paints.set(art.depth, paint);
      }
      paint.fillStyle(art.color).fillRect(art.x, art.y, art.width, art.height);
    } else
      scene.add
        .image(art.x, art.y, art.texture)
        .setOrigin(...art.origin)
        .setDepth(art.depth)
        .setData("wall", true);
  }
  for (const stair of f.stairs) {
    const down = h.zone === "upstairs";
    const label = down
      ? "Ground floor"
      : "Up to " +
        (h.floors.find((f) => f.id === stair.to)?.label.toLowerCase() ||
          "upstairs");
    scene.add
      .text(stair.landing[0] * 32 + 16, stair.landing[1] * 32 + 23, label, {
        fontFamily: "Saira Condensed",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#493527",
        backgroundColor: "#fff3d9",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5, 0)
      .setScale(1 / scene.cameras.main.zoom)
      .setDepth(2000)
      .setData("wall", true)
      .setData("nameplate", true)
      .setInteractive({ useHandCursor: true })
      .on(
        "pointerdown",
        (
          _: unknown,
          __: unknown,
          ___: unknown,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();
          if (!homes.get().decoration)
            window.dispatchEvent(
              new CustomEvent("pawtrail:approach-target", {
                detail: {
                  x: stair.landing[0] * 32 + 16,
                  y: stair.landing[1] * 32 + 16,
                  label: label,
                  run: () => changeFloor(h, stair.to),
                },
              }),
            );
        },
      );
  }
  if (f.door) {
    const exit = scene.add
      .text(f.door[0] * 32, (f.height - 1) * 32 + 12, "Your yard", {
        fontFamily: "Saira Condensed",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#493527",
        backgroundColor: "#fff3d9",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5)
      .setDepth(f.height * 32 + 1)
      .setScale(1 / scene.cameras.main.zoom)
      .setData("wall", true)
      .setData("nameplate", true)
      .setInteractive({ useHandCursor: true });
    exit.on(
      "pointerdown",
      (
        _: unknown,
        __: unknown,
        ___: unknown,
        event: Phaser.Types.Input.EventData,
      ) => {
        event.stopPropagation();
        if (!homes.get().decoration)
          window.dispatchEvent(
            new CustomEvent("pawtrail:approach-target", {
              detail: {
                x: f.door![0] * 32 + 16,
                y: (f.height - 2) * 32 + 16,
                label: "Enter your yard",
                run: () => void enter(h.id + "|yard"),
              },
            }),
          );
      },
    );
  }
}
