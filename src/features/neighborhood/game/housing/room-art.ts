import { rectangleCells, type FloorPlan } from "./presets";
import { roomShellRects } from "./room-shell";
import { worldRect } from "./spatial";
import { furniture, furnitureAt } from "./geometry";
import type { Placement } from "./types";

export type RoomImage = {
  foreground?: { texture: string; file: string };
  kind: "image";
  texture: string;
  file: string;
  x: number;
  y: number;
  origin: [number, number];
  depth: number;
  rotation?: number;
};
export type RoomRect = {
  kind: "rect";
  color: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
};
export type RoomArt = RoomImage | RoomRect;
export const ROOM_WINDOW =
  "/assets/game/housing/furniture/reference-v3/bamboo-window.png";

/** One native-coordinate composition for the playable room and its Settings preview. */
export function structureArt(f: FloorPlan, wallpaper: string): RoomArt[] {
  const art: RoomArt[] = roomShellRects(
    f.width,
    f.height,
    wallpaper,
    f.door?.[0] ?? null,
  ).map(([color, x, y, width, height]) => ({
    kind: "rect" as const,
    color,
    x,
    y,
    width,
    height,
    depth: -15,
  }));
  const tile = (x: number, y: number, part: string, north = false) =>
    art.push({
      kind: "image",
      texture: `wall:${wallpaper}:${part}`,
      file: `/assets/game/housing/tilesets/${wallpaper}-${part}-modular-v2.png`,
      x: x * 32 + 16,
      y: north ? 48 : y * 32 + 16,
      origin: [0.5, 0.5],
      depth: north ? -10 : y * 32 + 32,
    });
  for (let x = 0; x < f.width; x++) {
    tile(x, 0, "north", true);
  }
  for (const wall of f.walls) {
    const cells = rectangleCells(wall.rect);
    wall.gaps.forEach((g) => rectangleCells(g).forEach((k) => cells.delete(k)));
    for (const cell of cells) {
      const [x, y] = cell.split(",").map(Number);
      const rx = x * 32,
        ry = y * 32,
        depth = ry + 32;
      const rect = (
        color: number,
        px: number,
        py: number,
        width: number,
        height: number,
      ) =>
        art.push({ kind: "rect", color, x: px, y: py, width, height, depth });
      if (wall.rect[2] === 1) {
        rect(0x4d3425, rx + 4, ry, 24, 32);
        rect(0xa66b3d, rx + 7, ry, 18, 32);
        rect(0xf2dec0, rx + 10, ry, 12, 32);
        rect(0xe2b674, rx + 7, ry, 2, 32);
        const above = cells.has(x + "," + (y - 1)),
          below = cells.has(x + "," + (y + 1));
        if (!above) {
          rect(0x4d3425, rx + 2, ry, 28, 5);
          rect(0xe2b674, rx + 4, ry, 24, 2);
        }
        if (!below) {
          rect(0x4d3425, rx + 2, ry + 27, 28, 5);
          rect(0xe2b674, rx + 4, ry + 27, 24, 2);
        }
      } else {
        rect(0x4d3425, rx, ry, 32, 32);
        rect(0xa66b3d, rx, ry + 2, 32, 28);
        rect(0xf2dec0, rx, ry + 6, 32, 17);
        rect(0xe2b674, rx, ry + 2, 32, 2);
        rect(0x6b422b, rx, ry + 25, 32, 5);
      }
    }
  }
  for (const fixture of f.fixtures ?? []) {
    const def = furniture[fixture.item];
    if (!def && fixture.item !== "window") continue;
    art.push({
      kind: "image",
      texture: fixture.item === "window" ? "room-window" : "f:" + fixture.item,
      file: def?.file ?? ROOM_WINDOW,
      x: fixture.x * 32 + 16,
      y: fixture.y * 32 + 32,
      origin: [0.5, 1],
      depth: fixture.y * 32 + 33,
    });
  }
  for (const stair of f.stairs) {
    const [tx, ty, tw, th] = stair.rect,
      x = tx * 32,
      y = ty * 32,
      w = tw * 32,
      h = th * 32;
    const down = stair.to === "interior";
    const rect = (
      color: number,
      rx: number,
      ry: number,
      width: number,
      height: number,
    ) =>
      art.push({
        kind: "rect",
        color,
        x: rx,
        y: ry,
        width,
        height,
        depth: y + h,
      });
    rect(0x4b2e20, x, y, w, h);
    rect(down ? 0x281b17 : 0x704628, x + 8, y + 5, w - 16, h - 10);
    for (let i = 0; i < Math.floor((h - 12) / 16); i++) {
      const sy = y + 8 + i * 16,
        dark = down && i < 2;
      rect(dark ? 0x543824 : 0xa66a36, x + 10, sy, w - 20, 13);
      rect(dark ? 0x755032 : 0xe0ac63, x + 10, sy, w - 20, 3);
      rect(0x624025, x + 10, sy + 12, w - 20, 3);
    }
    for (const bx of [x + 2, x + w - 8]) {
      rect(0x966031, bx, y + 4, 6, h - 8);
      rect(0xe1b673, bx, y + 4, 2, h - 8);
      for (const by of [y + 4, y + h - 12]) rect(0xc58a45, bx - 2, by, 10, 10);
    }
  }
  return art;
}

export function furnitureArt(p: Placement): RoomImage | undefined {
  const base = furniture[p.item],
    variant = base?.orientationVariants?.[String(p.rotation)],
    def = base?.renderedViews ? furnitureAt(p) : variant ? furniture[variant] : base;
  if (!def) return;
  return {
    kind: "image",
    texture: base?.renderedViews ? `f:${p.item}:${p.style ?? base.defaultStyle}:${p.rotation}` : "f:" + (variant ?? p.item),
    ...(def.frontFile ? { foreground: { texture: `f:${p.item}:${p.style ?? base.defaultStyle}:${p.rotation}:front`, file: def.frontFile } } : {}),
    file: def.file,
    x: p.x * 32 + 16,
    y: p.y * 32 + 32,
    origin: [def.anchor[0] / def.width, def.anchor[1] / def.height],
    depth: p.item === 'garden-bush' ? p.y * 32 + 32 : def.blocking
      ? Math.max(
          ...def.geometry.ground.map((r) => {
            const b = worldRect(p, r);
            return b.y + b.height;
          }),
        )
      : -50,
    rotation: variant || base?.renderedViews ? 0 : p.rotation,
  };
}
