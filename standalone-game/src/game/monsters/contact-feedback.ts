import type { HitImpactKind } from '../feedback/hit-impact'
import type { BossCombatEvent } from './encounter'

/** A miss, blocked attempt, cast animation or status message is not enemy contact. */
export function contactSpriteFor(event: BossCombatEvent): { kind: HitImpactKind; color: string } | null {
  if (event.kind !== 'damage' || !Number.isFinite(event.amount) || event.amount <= 0) return null
  if (event.target === 'boss') return { kind: event.weak ? 'weak' : 'slash', color: '#ffffff' }
  const fire = event.attack === 'riftfire-rain' || event.attack === 'violet-exhalation' || event.attack === 'seal-rupture'
  return { kind: fire ? 'fire' : 'slash', color: fire ? '#ffffff' : '#ff8174' }
}
