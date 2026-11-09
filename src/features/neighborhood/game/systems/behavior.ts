import abilityRules from '../abilities/definitions.json'
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
  gentle = false,
): Behavior {
  if (
    profile.personality === 'shy' &&
    trust < 20 &&
    distance < (gentle ? 40 : 85) &&
    (running && !gentle || distance < (gentle ? 22 : 45))
  )
    return 'avoid'
  if (phase === 'night' && distance > 65) return 'sleep'
  if (profile.species === 'dog' && fed && trust >= 20 && distance < 180)
    return 'follow'
  if (distance < 100 && trust >= 12) return 'approach'
  return roll < 0.6 ? 'wander' : roll < 0.85 ? 'idle' : 'sleep'
}
export function movementVector(x: number, y: number, running = false, override?:number) {
  const length = Math.hypot(x, y),speed=typeof override==='number'&&Number.isFinite(override)?Math.max(0,Math.min(override,abilityRules.abilities.rescue_dash.speed)):running?abilityRules.runSpeed:abilityRules.walkSpeed
  return length
    ? {
        x: (x / length) * speed,
        y: (y / length) * speed,
      }
    : { x: 0, y: 0 }
}
