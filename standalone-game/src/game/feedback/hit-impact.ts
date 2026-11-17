import type { FeedbackPoint } from './visual-feedback'

export type HitImpactKind = 'slash' | 'weak' | 'fire'
export const HIT_IMPACT = {
  url: '/pawtrail-game/effects/hit-impact-v1/impact-atlas.png',
  frameWidth: 64, frameHeight: 64, columns: 4, rows: 6, capacity: 12,
  clips: {
    slash: { firstFrame: 0, frames: 8, duration: 1000 / 3, size: 1 },
    weak: { firstFrame: 8, frames: 8, duration: 375, size: 1.3 },
    fire: { firstFrame: 16, frames: 8, duration: 1000 * 5 / 12, size: 1.1 },
  },
} as const
export type HitImpactRequest = { kind: HitImpactKind; position: FeedbackPoint; unit: number; color?: string; reducedMotion?: boolean }
export type HitImpactSlot = { active: boolean; serial: number; kind: HitImpactKind; position: FeedbackPoint; unit: number; color: string; age: number; duration: number; reducedMotion: boolean }

/** Fixed slots and full generated frames; no geometry/material allocation per hit. */
export class HitImpactPool {
  readonly slots: HitImpactSlot[] = Array.from({ length: HIT_IMPACT.capacity }, () => ({ active: false, serial: 0, kind: 'slash', position: { x: 0, y: 0, z: 0 }, unit: 1, color: '#ffffff', age: 0, duration: 0, reducedMotion: false }))
  private serial = 0
  get pending() { return this.slots.some(slot => slot.active) }
  spawn(request: HitImpactRequest) {
    if (!Object.values(request.position).every(Number.isFinite) || !Number.isFinite(request.unit) || request.unit <= 0) return
    let slot = this.slots.find(candidate => !candidate.active)
    if (!slot) slot = this.slots.reduce((oldest, candidate) => candidate.serial < oldest.serial ? candidate : oldest)
    slot.active = true; slot.serial = ++this.serial; slot.kind = request.kind
    Object.assign(slot.position, request.position); slot.unit = request.unit; slot.color = request.color ?? '#ffffff'
    slot.age = 0; slot.reducedMotion = !!request.reducedMotion
    slot.duration = slot.reducedMotion ? 140 : HIT_IMPACT.clips[slot.kind].duration
    return slot
  }
  frame(slot: HitImpactSlot) {
    if (!slot.active) return -1
    const clip = HIT_IMPACT.clips[slot.kind]
    const index = slot.reducedMotion ? 2 : Math.min(clip.frames - 1, Math.floor(slot.age / slot.duration * clip.frames + 1e-8))
    return clip.firstFrame + index
  }
  advance(delta: number) {
    if (!Number.isFinite(delta) || delta < 0) return
    for (const slot of this.slots) if (slot.active) { slot.age += delta; if (slot.age >= slot.duration) slot.active = false }
  }
  clear() { for (const slot of this.slots) slot.active = false }
}
