import { ANIMALS } from '../data'
import type { AnimalMemory, CareAction, Progress } from '../types'
export const CARE = {
  feed: { reward: 5, trust: 8, item: 'food' },
  pet: { reward: 3, trust: 6, item: null },
  water: { reward: 4, trust: 5, item: 'water' },
  observe: { reward: 1, trust: 3, item: null },
  play: { reward: 4, trust: 6, item: null },
  check: { reward: 1, trust: 2, item: null },
  photo: { reward: 2, trust: 0, item: null },
  rescue: { reward: 25, trust: 0, item: 'firstAid' },
} as const
export function memory(p: Progress, id: string): AnimalMemory {
  return (
    p.animals[id] ?? {
      trust: ANIMALS.find((a) => a.id === id)?.trust ?? 0,
      lastCare: {},
      history: [],
      metDay: p.day,
      location: p.position.scene,
    }
  )
}
export function careDone(p: Progress, id: string, action: CareAction) {
  return memory(p, id).lastCare[action] === p.day
}
export function careReason(action: CareAction, id: string, p: Progress) {
  const profile = ANIMALS.find((a) => a.id === id)
  if (!profile) return 'This animal is unavailable.'
  if (p.rescued.includes(id) && action === 'rescue')
    return 'Already safe at the shelter.'
  if (careDone(p, id, action))
    return 'Let them rest. Try again on the next game day.'
  if (action === 'pet' && memory(p, id).trust < 12)
    return 'Let this shy neighbor get to know you. Observe, offer food or water first.'
  if (action === 'play' && memory(p, id).trust < 15)
    return 'Build a little trust before inviting play.'
  if (action === 'photo' && !p.unlocks.includes('camera'))
    return 'Finish Welcome to PawTrail to unlock your camera.'
  if (action === 'rescue' && !profile.rescuable)
    return 'This neighbor can stay with their familiar care circle.'
  if (
    action === 'rescue' &&
    (memory(p, id).trust < 30 || !p.completed.includes(id + ':feed'))
  )
    return 'Reach 30 trust and offer a meal before coordinating a rescue.'
  if (
    action === 'rescue' &&
    id === 'cloud' &&
    p.quests['missing-kitten']?.state !== 'active'
  )
    return 'Talk to Jo and follow the missing-kitten quest first.'
  const item = CARE[action].item
  if (item && p.inventory[item] < 1)
    return 'Collect more supplies or visit the neighborhood shop.'
  return null
}
export function careProgress(
  p: Progress,
  action: CareAction,
  id: string,
): Progress {
  if (careReason(action, id, p)) return p
  const a = memory(p, id),
    rule = CARE[action]
  return {
    ...p,
    kibble: p.kibble + rule.reward,
    totalEarned: p.totalEarned + rule.reward,
    xp: p.xp + rule.trust + 2,
    inventory: {
      ...p.inventory,
      ...(rule.item ? { [rule.item]: p.inventory[rule.item] - 1 } : {}),
    },
    animals: {
      ...p.animals,
      [id]: {
        ...a,
        trust: Math.min(100, a.trust + rule.trust),
        lastCare: { ...a.lastCare, [action]: p.day },
        history: [`Day ${p.day}: ${action}`, ...a.history].slice(0, 20),
      },
    },
    completed: [...new Set([...p.completed, id + ':' + action])],
    rescued: action === 'rescue' ? [...new Set([...p.rescued, id])] : p.rescued,
  }
}
export function interactionAllowed(
  player: { x: number; y: number },
  target: { x: number; y: number },
  range = 68,
) {
  return (
    Number.isFinite(player.x) &&
    Number.isFinite(player.y) &&
    Math.hypot(player.x - target.x, player.y - target.y) <= range
  )
}
