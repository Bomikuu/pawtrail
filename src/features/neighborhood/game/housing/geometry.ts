import raw from "./catalog.json";
import { worldRect, visualBounds, intersects, Navigation } from "./spatial";
import { floorPlan } from "./presets";
import { fixedCells, reservedCells, type Zone } from "./community";
import type { Furniture, Placement } from "./types";
export const catalogue = raw as unknown as {
  items: Furniture[];
  players: Record<
    string,
    {
      file: string;
      rows: Record<string, number>;
      frameWidth: number;
      frameHeight: number;
      columns: number;
      animations: Record<
        string,
        { row: number; frames: number; fps: number; anchor: number[] }
      >;
    }
  >;
  cats: Record<
    string,
    {
      file: string;
      frameWidth: number;
      frameHeight: number;
      columns: number;
      animations: Record<string, number[][]>;
    }
  >;
  effects: Record<string, { file: string; frames: number }>;
};
export const furniture = Object.fromEntries(
  catalogue.items.map((i) => [i.id, i]),
);
/** Native model facings supply their own projected contacts; never spin those pixels. */
export function furnitureAt(p: Placement) {
  const base = furniture[p.item]
  if (!base?.renderedViews) return base
  const view = base.renderedViews[String(p.rotation)]
  const style = base.styles?.find(style => style.id === (p.style ?? base.defaultStyle)) ?? base.styles?.[0]
  return { ...base, ...view, ...style?.views[String(p.rotation)] }
}
export function occupied(p: Placement) {
  const d = furnitureAt(p),
    result: string[] = [];
  if (!d?.blocking) return result;
  const r = worldRect(p, d.footprint),
    { x: left, y: top, width: w, height: h } = r;
  for (let x = Math.floor(left / 32); x < Math.ceil((left + w) / 32); x++)
    for (let y = Math.floor(top / 32); y < Math.ceil((top + h) / 32); y++)
      result.push(x + "," + y);
  return result;
}
export function solids(
  layout: Placement[],
  hub = false,
  zone: Zone = "interior",
  preset = "studio",
) {
  const floor = floorPlan(preset, zone),
    [width, height] = hub
      ? [80, 56]
      : zone === "yard"
        ? [14, 14]
        : [floor?.width || 24, floor?.height || 18];
  const set = fixedCells(zone, hub, preset);
  for (let x = 0; x < width; x++)
    for (let y = 0; y < height; y++)
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1)
        set.add(x + "," + y);
  layout.forEach((p) => occupied(p).forEach((key) => set.add(key)));
  return set;
}
export function placementReason(
  p: Placement,
  layout: Placement[],
  zone: Zone = "interior",
  preset = "studio",
) {
  const floor = floorPlan(preset, zone),
    [width, height] =
      zone === "yard" ? [14, 14] : [floor?.width || 24, floor?.height || 18],
    d = furnitureAt(p);
  if (!d || !d.zones?.includes(zone === "upstairs" ? "interior" : zone))
    return "This piece belongs in the other space.";
  if (p.x < 1 || p.x > width - 2 || p.y < 2 || p.y > height - 2)
    return "Keep the piece inside this space.";
  const art = visualBounds(p);
  if (
    art.x < 0 ||
    art.y < 0 ||
    art.x + art.width > width * 32 ||
    art.y + art.height > height * 32
  )
    return "The whole piece must fit inside this space.";
  const fixed = fixedCells(zone, false, preset),
    reserved = reservedCells(zone, preset);
  const rectangles = [...fixed, ...reserved].map((k) => {
    const [x, y] = k.split(",").map(Number);
    return { x: x * 32, y: y * 32, width: 32, height: 32 };
  });
  const placed = layout.filter((a) => a.id !== p.id);
  for (const a of placed)
    for (const r of furnitureAt(a).geometry.placement)
      rectangles.push(worldRect(a, r));
  if (
    d.geometry.placement.some((r) =>
      rectangles.some((other) => intersects(worldRect(p, r), other)),
    )
  )
    return "Keep the entrance route and other pieces clear.";
  const proposed = [...placed, p],
    nav = new Navigation(proposed, false, zone, preset);
  const spawn = zone === "yard" ? [6, 12] : (floor?.spawn ?? [12, 16]),
    origin = { x: spawn[0] * 32 + 16, y: spawn[1] * 32 + 16 };
  // Validate connected clearance with the same foot body used while walking.
  const start = nav.nearest(origin, 24);
  if (!start) return "Keep the entrance clear.";
  const queue = [Math.floor(start.x / 8) + "," + Math.floor(start.y / 8)],
    walk = new Set(queue);
  for (let n = 0; n < queue.length; n++) {
    const [x, y] = queue[n].split(",").map(Number);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const xx = x + dx,
        yy = y + dy,
        k = xx + "," + yy;
      if (
        xx < 4 ||
        yy < 4 ||
        xx >= width * 4 - 4 ||
        yy >= height * 4 - 4 ||
        walk.has(k) ||
        nav.blocked.has(k)
      )
        continue;
      walk.add(k);
      queue.push(k);
    }
  }
  if (walk.size < (zone === "yard" ? 65 : 90) * 16)
    return "Leave enough connected walking space.";
  const inWalk = (x: number, y: number) =>
    walk.has(Math.floor(x / 8) + "," + Math.floor(y / 8));
  if (
    [...reserved].some((k) => {
      const [x, y] = k.split(",").map(Number);
      return !inWalk(x * 32 + 16, y * 32 + 16);
    })
  )
    return "Keep a continuous entrance route.";
  for (const piece of proposed) {
    const approach = nav.approach(piece, start);
    if (!approach || !inWalk(approach.point.x, approach.point.y))
      return "Leave a reachable approach to every piece.";
  }
  return "";
}
export function valid(
  p: Placement,
  layout: Placement[],
  zone: Zone = "interior",
  preset = "studio",
) {
  return !placementReason(p, layout, zone, preset);
}

/** Pointer previews use cheap bounds/overlap checks; connectivity is validated on commit and by Django. */
export function previewValid(
  p: Placement,
  layout: Placement[],
  zone: Zone = "interior",
  preset = "studio",
) {
  const d = furnitureAt(p),
    f = floorPlan(preset, zone),
    width = zone === "yard" ? 14 : (f?.width ?? 24),
    height = zone === "yard" ? 14 : (f?.height ?? 18);
  if (
    !d ||
    !d.zones.includes(zone === "upstairs" ? "interior" : zone) ||
    p.x < 1 ||
    p.y < 2 ||
    p.x > width - 2 ||
    p.y > height - 2
  )
    return false;
  const art = visualBounds(p);
  if (
    art.x < 0 ||
    art.y < 0 ||
    art.x + art.width > width * 32 ||
    art.y + art.height > height * 32
  )
    return false;
  const fixed = [
    ...fixedCells(zone, false, preset),
    ...reservedCells(zone, preset),
  ].map((k) => {
    const [x, y] = k.split(",").map(Number);
    return { x: x * 32, y: y * 32, width: 32, height: 32 };
  });
  for (const piece of layout)
    if (piece.id !== p.id)
      for (const r of furnitureAt(piece).geometry.placement)
        fixed.push(worldRect(piece, r));
  return d.geometry.placement.every(
    (r) => !fixed.some((b) => intersects(worldRect(p, r), b)),
  );
}
