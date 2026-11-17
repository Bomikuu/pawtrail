import type { GroundPoint } from './vaelrith'

export const RIFTFIRE = {
  count: 8, tileSize: .6, columns: 4, rows: 4, frames: 16,
  frameWidth: 64, frameHeight: 96, frameMs: 1000 / 15,
  url: '/pawtrail-game/monsters/vaelrith-riftbound/effects/riftfire-v1/fire-atlas.png',
} as const

/** Partial shuffle: fixed work and no repeated tiles, even with a constant RNG. */
export function chooseFireTiles(random: () => number = Math.random): GroundPoint[] {
  const available: GroundPoint[] = []
  for (let row = 0; row < 12; row++) for (let col = 0; col < 23; col++) {
    available.push({ x: Math.round((-6.6 + col * .6) * 10) / 10, z: Math.round((2 + row * .6) * 10) / 10 })
  }
  for (let index = 0; index < RIFTFIRE.count; index++) {
    const value = random(), fraction = Number.isFinite(value) ? Math.max(0, Math.min(.999999999, value)) : 0
    const selected = index + Math.floor(fraction * (available.length - index))
    ;[available[index], available[selected]] = [available[selected], available[index]]
  }
  return available.slice(0, RIFTFIRE.count)
}

export function inFireTile(point: GroundPoint, tiles: readonly GroundPoint[]) {
  return tiles.some(tile => Math.abs(point.x - tile.x) <= RIFTFIRE.tileSize / 2 + 1e-8 && Math.abs(point.z - tile.z) <= RIFTFIRE.tileSize / 2 + 1e-8)
}

/** Authored intro, eight-frame sustained loop, then authored four-frame decay. */
export function fireFrame(age: number, duration: number, offset = 0, reducedMotion = false) {
  if (age < 0 || age >= duration) return -1
  if (reducedMotion) return 6
  const transition = RIFTFIRE.frameMs * 4
  if (age < transition) return Math.min(3, Math.floor(age / RIFTFIRE.frameMs + 1e-8))
  if (age >= duration - transition) return 12 + Math.min(3, Math.floor((age - duration + transition) / RIFTFIRE.frameMs + 1e-8))
  return 4 + (Math.floor((age - transition) / RIFTFIRE.frameMs + 1e-8) + offset) % 8
}
