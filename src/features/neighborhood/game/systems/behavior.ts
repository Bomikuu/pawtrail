import type { AnimalProfile } from '../types'
import type { DayPhase } from './time'
export type Behavior =
  'idle' | 'wander' | 'sleep' | 'approach' | 'avoid' | 'follow'
export function chooseBehavior(
  profile: AnimalProfile,
  trust: number,
  phase: DayPhase,
  distance: number,
  running: boolean,
  fed: boolean,
  roll = Math.random(),
): Behavior {
  if (
    profile.personality === 'shy' &&
    trust < 20 &&
    distance < 85 &&
    (running || distance < 45)
  )
    return 'avoid'
  if (phase === 'night' && distance > 65) return 'sleep'
  if (profile.species === 'dog' && fed && trust >= 20 && distance < 180)
    return 'follow'
  if (distance < 100 && trust >= 12) return 'approach'
  return roll < 0.6 ? 'wander' : roll < 0.85 ? 'idle' : 'sleep'
}
export function movementVector(x: number, y: number, running = false) {
  const length = Math.hypot(x, y)
  return length
    ? {
        x: (x / length) * (running ? 155 : 105),
        y: (y / length) * (running ? 155 : 105),
      }
    : { x: 0, y: 0 }
}
