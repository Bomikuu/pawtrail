import { ATTACKS, type AttackId } from './vaelrith'

export type BossMotion = { back: number; reach: number; lower: number; aimMix: number; sweepMix: number; sweepX: number; jaw: number; lift: number; pitch: number }
type MotionFrame = { time: number; pose: BossMotion }
export const BOSS_MOTION_FRAMES = 32
const smooth = (value: number) => { const p = Math.max(0, Math.min(1, value)); return p * p * (3 - 2 * p) }
const rest = (): BossMotion => ({ back: 0, reach: 0, lower: 0, aimMix: 0, sweepMix: 0, sweepX: 0, jaw: .27, lift: 0, pitch: 0 })
const channels = Object.keys(rest()) as (keyof BossMotion)[]

function authorPose(id: AttackId, time: number): BossMotion {
  const a = ATTACKS[id], pose = rest(), breath = id === 'violet-exhalation' || id === 'riftfire-rain' || id === 'seal-rupture'
  if (time <= a.preparation) {
    const p = time / a.preparation
    pose.back = -.2 * Math.sin(Math.PI * p); pose.pitch = -.08 * Math.sin(Math.PI * p)
    pose.jaw = .27 + .63 * smooth(p)
    if (id === 'rift-fang') pose.aimMix = .8 * smooth((p - .7) / .3)
    if (id === 'obsidian-sweep') { pose.sweepMix = smooth((p - .45) / .55); pose.sweepX = -6 }
    if (breath) pose.lift = .18 * smooth(p)
  } else if (time <= a.preparation + a.active) {
    const p = (time - a.preparation) / a.active
    pose.jaw = .9
    if (id === 'rift-fang') pose.aimMix = .8 + .2 * smooth(p / .35)
    if (id === 'obsidian-sweep') { pose.sweepMix = 1; pose.sweepX = -6 + 12 * smooth(p) }
    if (breath) { pose.lift = .18 + .035 * Math.sin(Math.PI * p); pose.reach = .15 * smooth(p) }
  } else {
    const p = (time - a.preparation - a.active) / a.recovery
    pose.lower = smooth(p / .25) * (1 - smooth((p - .7) / .3))
    pose.jaw = .9 - .18 * smooth(p / .18) - .45 * smooth((p - .7) / .3)
    if (id === 'rift-fang') pose.aimMix = 1 - smooth(p / .3)
    if (id === 'obsidian-sweep') { pose.sweepMix = 1 - smooth(p / .25); pose.sweepX = 6 }
    if (breath) { pose.lift = .18 * (1 - smooth(p / .25)); pose.reach = .15 * (1 - smooth(p / .25)) }
  }
  return pose
}

/** Small scalar timelines only: no per-frame geometry or bitmap caches. */
export const bossMotionClips = Object.fromEntries((Object.keys(ATTACKS) as AttackId[]).map(id => {
  const a = ATTACKS[id], times = [
    ...Array.from({ length: 12 }, (_, i) => a.preparation * i / 11),
    ...Array.from({ length: 8 }, (_, i) => a.preparation + a.active * (i + 1) / 8),
    ...Array.from({ length: 12 }, (_, i) => a.preparation + a.active + a.recovery * (i + 1) / 12),
  ]
  return [id, times.map(time => ({ time, pose: authorPose(id, time) }))]
})) as Record<AttackId, MotionFrame[]>

export function sampleBossMotion(id: AttackId | null, elapsed: number): BossMotion {
  if (!id) return rest()
  const frames = bossMotionClips[id], time = Number.isFinite(elapsed) ? elapsed : 0
  const upper = frames.findIndex(frame => frame.time >= time)
  if (upper === 0) return frames[0].pose
  if (upper < 0) return frames[frames.length - 1].pose
  const before = frames[upper - 1], after = frames[upper], p = (time - before.time) / (after.time - before.time)
  const pose = rest()
  for (const key of channels) pose[key] = before.pose[key] + (after.pose[key] - before.pose[key]) * p
  return pose
}
