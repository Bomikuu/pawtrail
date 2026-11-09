import { furniture, furnitureAt } from "./geometry";
import type { Placement, Point, Rect } from "./types";
import { fixedCells, type Zone } from "./community";
import { floorPlan } from "./presets";
export const NAV_STEP = 8;
export const FOOT = { halfWidth: 5, height: 6 };
export function rotatePoint(x: number, y: number, degrees: number): Point {
  switch (((degrees % 360) + 360) % 360) {
    case 90:
      return { x: -y, y: x };
    case 180:
      return { x: -x, y: -y };
    case 270:
      return { x: y, y: -x };
    default:
      return { x, y };
  }
}
export function worldPoint(p: Placement, point: number[]): Point {
  const a = furnitureAt(p).anchor,
    v = rotatePoint(
      point[0] - a[0],
      point[1] - a[1],
      furniture[p.item].renderedViews || furniture[p.item].orientationVariants?.[String(p.rotation)]
        ? 0
        : p.rotation,
    );
  return { x: p.x * 32 + 16 + v.x, y: p.y * 32 + 32 + v.y };
}
export function worldRect(p: Placement, r: number[]): Rect {
  const points = [
    [r[0], r[1]],
    [r[0] + r[2], r[1]],
    [r[0], r[1] + r[3]],
    [r[0] + r[2], r[1] + r[3]],
  ].map((a) => worldPoint(p, a));
  const x = Math.min(...points.map((p) => p.x)),
    y = Math.min(...points.map((p) => p.y));
  return {
    x,
    y,
    width: Math.max(...points.map((p) => p.x)) - x,
    height: Math.max(...points.map((p) => p.y)) - y,
  };
}
export const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;
export const footRect = (p: Point): Rect => ({
  x: p.x - FOOT.halfWidth,
  y: p.y - FOOT.height,
  width: FOOT.halfWidth * 2,
  height: FOOT.height,
});
export function colliders(p: Placement) {
  return (furnitureAt(p)?.geometry.ground ?? []).map((r) => worldRect(p, r));
}
export function visualBounds(p: Placement) {
  const d = furnitureAt(p);
  return worldRect(p, [0, 0, d.width, d.height]);
}
/** Built only on a layout/object-state change. Artwork dimensions never determine walking collision. */
export class Navigation {
  readonly blocked = new Set<string>();
  readonly rects: Rect[] = [];
  readonly width: number;
  readonly height: number;
  constructor(
    layout: Placement[],
    hub = false,
    zone: Zone = "interior",
    preset = "studio",
    states: Record<string, { open?: boolean }> = {},
    environment?: { width: number; height: number; rects: Rect[] },
  ) {
    const f = floorPlan(preset, zone);
    this.width =
      environment?.width ??
      (hub ? 80 : zone === "yard" ? 14 : (f?.width ?? 24)) * 32;
    this.height =
      environment?.height ??
      (hub ? 56 : zone === "yard" ? 14 : (f?.height ?? 18)) * 32;
    const fixed = environment
      ? new Set<string>()
      : fixedCells(zone, hub, preset);
    if (environment) this.rects.push(...environment.rects);
    for (let x = 0; x < this.width / 32; x++) {
      fixed.add(x + ",0");
      fixed.add(x + "," + (this.height / 32 - 1));
    }
    for (let y = 0; y < this.height / 32; y++) {
      fixed.add("0," + y);
      fixed.add(this.width / 32 - 1 + "," + y);
    }
    for (const cell of fixed) {
      const [x, y] = cell.split(",").map(Number);
      this.rects.push({ x: x * 32, y: y * 32, width: 32, height: 32 });
    }
    for (const p of layout)
      if (!states[p.id]?.open) this.rects.push(...colliders(p));
    for (const r of this.rects) {
      for (
        let x = Math.floor((r.x - FOOT.halfWidth) / NAV_STEP);
        x <= Math.floor((r.x + r.width + FOOT.halfWidth) / NAV_STEP);
        x++
      )
        for (
          let y = Math.floor(r.y / NAV_STEP);
          y <= Math.floor((r.y + r.height + FOOT.height) / NAV_STEP);
          y++
        )
          if (
            intersects(
              footRect({ x: x * NAV_STEP + 4, y: y * NAV_STEP + 4 }),
              r,
            )
          )
            this.blocked.add(x + "," + y);
    }
  }
  clear(p: Point) {
    return (
      p.x >= 37 &&
      p.y >= 38 &&
      p.x < this.width - 37 &&
      p.y < this.height - 32 &&
      !this.rects.some((r) => intersects(footRect(p), r))
    );
  }
  segment(a: Point, b: Point) {
    const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    for (let i = 1; i <= n; i++)
      if (
        !this.clear({
          x: a.x + ((b.x - a.x) * i) / n,
          y: a.y + ((b.y - a.y) * i) / n,
        })
      )
        return false;
    return true;
  }
  nearest(p: Point, radius = 64): Point | null {
    if (this.clear(p)) return p;
    for (let r = 8; r <= radius; r += 8)
      for (let i = 0; i < 16; i++) {
        const q = {
          x: p.x + Math.cos((i * Math.PI) / 8) * r,
          y: p.y + Math.sin((i * Math.PI) / 8) * r,
        };
        if (this.clear(q)) return q;
      }
    return null;
  }
  path(a: Point, b: Point): Point[] {
    const end = this.nearest(b, 40);
    if (!end) return [];
    if (this.segment(a, end)) return [end];
    const start = this.nearest(a, 32);
    if (!start) return [];
    const cols = this.width / 8,
      rows = this.height / 8;
    const nodeFor = (p: Point) => {
      const x = Math.floor(p.x / 8),
        y = Math.floor(p.y / 8);
      for (const radius of [0, 1, 2])
        for (let dy = -radius; dy <= radius; dy++)
          for (let dx = -radius; dx <= radius; dx++) {
            const xx = x + dx,
              yy = y + dy;
            if (
              xx < 4 ||
              yy < 4 ||
              xx >= cols - 4 ||
              yy >= rows - 4 ||
              this.blocked.has(xx + "," + yy)
            )
              continue;
            if (this.segment(p, { x: xx * 8 + 4, y: yy * 8 + 4 }))
              return yy * cols + xx;
          }
      return -1;
    };
    const first = nodeFor(start),
      goal = nodeFor(end);
    if (first < 0 || goal < 0) return [];
    const parents = new Int32Array(cols * rows).fill(-1),
      cost = new Float64Array(cols * rows).fill(Infinity),
      closed = new Uint8Array(cols * rows),
      heap: { node: number; priority: number }[] = [];
    const heuristic = (n: number) =>
      Math.abs((n % cols) - (goal % cols)) +
      Math.abs(Math.floor(n / cols) - Math.floor(goal / cols));
    const push = (node: number) => {
      const entry = { node, priority: cost[node] + heuristic(node) };
      heap.push(entry);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p].priority <= entry.priority) break;
        heap[i] = heap[p];
        i = p;
      }
      heap[i] = entry;
    };
    const pop = () => {
      const n = heap[0],
        tail = heap.pop()!;
      if (heap.length) {
        let i = 0;
        while (i * 2 + 1 < heap.length) {
          let c = i * 2 + 1;
          if (c + 1 < heap.length && heap[c + 1].priority < heap[c].priority)
            c++;
          if (tail.priority <= heap[c].priority) break;
          heap[i] = heap[c];
          i = c;
        }
        heap[i] = tail;
      }
      return n.node;
    };
    cost[first] = 0;
    push(first);
    while (heap.length) {
      const current = pop();
      if (closed[current]) continue;
      closed[current] = 1;
      if (current === goal) {
        const path: Point[] = [end];
        let n = current;
        while (n !== first) {
          path.push({ x: (n % cols) * 8 + 4, y: Math.floor(n / cols) * 8 + 4 });
          n = parents[n];
        }
        path.push({
          x: (first % cols) * 8 + 4,
          y: Math.floor(first / cols) * 8 + 4,
        });
        return path.reverse();
      }
      const x = current % cols,
        y = Math.floor(current / cols);
      for (const [dx, dy] of [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ]) {
        const xx = x + dx,
          yy = y + dy,
          n = yy * cols + xx;
        if (
          xx < 4 ||
          yy < 4 ||
          xx >= cols - 4 ||
          yy >= rows - 4 ||
          closed[n] ||
          this.blocked.has(xx + "," + yy) ||
          cost[current] + 1 >= cost[n]
        )
          continue;
        cost[n] = cost[current] + 1;
        parents[n] = current;
        push(n);
      }
    }
    return [];
  }

  approach(p: Placement, from: Point): { point: Point; path: Point[] } | null {
    const candidates = furnitureAt(p).geometry.approaches
      .map((a) => worldPoint(p, a))
      .sort(
        (a, b) =>
          Math.hypot(a.x - from.x, a.y - from.y) -
          Math.hypot(b.x - from.x, b.y - from.y),
      );
    for (const c of candidates) {
      const point = this.nearest(c, 16);
      if (!point) continue;
      const path = this.path(from, point);
      if (path.length || Math.hypot(from.x - point.x, from.y - point.y) < 4)
        return { point, path };
    }
    return null;
  }
}
