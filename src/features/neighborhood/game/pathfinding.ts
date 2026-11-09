import { Navigation } from "./housing/spatial";
import type { Rect } from "./housing/types";
const worlds = new WeakMap<
  Set<string>,
  {
    width: number;
    height: number;
    rects: Rect[];
    count: number;
    nav?: Navigation;
  }
>();
export function registerWorldGeometry(
  blocked: Set<string>,
  width: number,
  height: number,
  rects: Rect[],
) {
  worlds.set(blocked, { width, height, rects, count: -1 });
}
export function findPath(
  start: { x: number; y: number },
  end: { x: number; y: number },
  width: number,
  height: number,
  blocked: Set<string>,
) {
  const world = worlds.get(blocked);
  if (world) {
    if (!world.nav || world.count !== world.rects.length) {
      world.nav = new Navigation([], false, "interior", "studio", {}, world);
      world.count = world.rects.length;
    }
    return world.nav.path(start, end);
  }
  const key = (x: number, y: number) => x + "," + y;
  const sx = Math.max(1, Math.min(width - 2, Math.floor(start.x / 32))),
    sy = Math.max(1, Math.min(height - 2, Math.floor(start.y / 32)));
  let ex = Math.max(1, Math.min(width - 2, Math.floor(end.x / 32))),
    ey = Math.max(1, Math.min(height - 2, Math.floor(end.y / 32)));
  if (blocked.has(key(ex, ey))) {
    const originalX = ex,
      originalY = ey;
    let best = Infinity,
      found = false;
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++) {
        const x = originalX + dx,
          y = originalY + dy;
        if (
          x < 1 ||
          y < 1 ||
          x >= width - 1 ||
          y >= height - 1 ||
          blocked.has(key(x, y))
        )
          continue;
        const distance = dx * dx + dy * dy;
        if (distance < best) {
          best = distance;
          ex = x;
          ey = y;
          found = true;
        }
      }
    if (!found) return [];
  }
  const first = key(sx, sy),
    goal = key(ex, ey),
    queue = [[sx, sy]],
    came = new Map<string, string | null>([[first, null]]);
  for (let n = 0; n < queue.length && n < width * height; n++) {
    const [x, y] = queue[n],
      current = key(x, y);
    if (current === goal) {
      const path: { x: number; y: number }[] = [];
      let k: string | null = goal;
      while (k && k !== first) {
        const [px, py] = k.split(",").map(Number);
        path.unshift({ x: px * 32 + 16, y: py * 32 + 16 });
        k = came.get(k) ?? null;
      }
      return path;
    }
    for (const [dx, dy] of [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ]) {
      const xx = x + dx,
        yy = y + dy,
        k = key(xx, yy);
      if (
        xx < 1 ||
        yy < 1 ||
        xx >= width - 1 ||
        yy >= height - 1 ||
        blocked.has(k) ||
        came.has(k)
      )
        continue;
      came.set(k, current);
      queue.push([xx, yy]);
    }
  }
  return [];
}

export function worldNavigation(blocked: Set<string>) {
  const world = worlds.get(blocked);
  if (!world) return undefined;
  if (!world.nav || world.count !== world.rects.length) {
    world.nav = new Navigation([], false, "interior", "studio", {}, world);
    world.count = world.rects.length;
  }
  return world.nav;
}
