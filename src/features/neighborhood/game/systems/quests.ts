import { QUESTS } from '../data'
import type { GameEvent, Progress, QuestDefinition, QuestState } from '../types'
export function questKey(q: QuestDefinition, p: Progress) {
  return q.category === 'daily' ? `${q.id}@${p.day}` : q.id
}
export function questState(p: Progress, q: QuestDefinition): QuestState {
  if (
    q.relationship &&
    (p.relationships[q.relationship.npc] ?? 0) < q.relationship.minimum
  )
    return 'locked'
  if (q.prerequisites?.some((id) => p.quests[id]?.state !== 'claimed'))
    return 'locked'
  if (q.category === 'event' && p.day % 7 !== 0 && !p.quests[q.id])
    return 'locked'
  return p.quests[questKey(q, p)]?.state ?? 'available'
}
export function acceptQuest(p: Progress, id: string): Progress {
  const q = QUESTS.find((q) => q.id === id)
  if (!q || questState(p, q) !== 'available') return p
  return {
    ...p,
    trackedQuest: id,
    quests: {
      ...p.quests,
      [questKey(q, p)]: {
        state: 'active',
        counts: q.objectives.map(() => 0),
        unique: q.objectives.map(() => []),
        day: p.day,
      },
    },
  }
}
export function advanceQuests(p: Progress, event: GameEvent): Progress {
  let quests = { ...p.quests },
    changed = false
  for (const q of QUESTS) {
    const key = questKey(q, p),
      progress = quests[key]
    if (!progress || progress.state !== 'active') continue
    const counts = [...progress.counts],
      unique = progress.unique.map((ids) => [...ids])
    const first = q.objectives.findIndex((o, i) => counts[i] < (o.count ?? 1))
    for (let i = 0; i < q.objectives.length; i++) {
      const o = q.objectives[i]
      if (q.ordered && i !== first) continue
      if (
        counts[i] >= (o.count ?? 1) ||
        o.type !== event.type ||
        (o.target && o.target !== event.target)
      )
        continue
      if (o.targets && !o.targets.includes(event.target)) continue
      const token = event.unique ?? event.target
      if (o.unique && unique[i].includes(token)) continue
      counts[i] = Math.min(o.count ?? 1, counts[i] + (event.amount ?? 1))
      if (o.unique) unique[i].push(token)
    }
    const complete = q.objectives.every((o, i) => counts[i] >= (o.count ?? 1))
    if (counts.some((n, i) => n !== progress.counts[i])) {
      quests[key] = {
        ...progress,
        counts,
        unique,
        state: complete ? 'completed' : 'active',
      }
      changed = true
    }
  }
  return changed ? { ...p, quests } : p
}
export function claimQuest(p: Progress, id: string): Progress {
  const q = QUESTS.find((q) => q.id === id)
  if (!q || questState(p, q) !== 'completed') return p
  const key = questKey(q, p),
    unlock = q.unlocks ?? ([q.unlock].filter(Boolean) as string[])
  return {
    ...p,
    kibble: p.kibble + q.reward,
    totalEarned: p.totalEarned + q.reward,
    xp: p.xp + q.xp,
    quests: { ...p.quests, [key]: { ...p.quests[key], state: 'claimed' } },
    unlocks: [...new Set([...p.unlocks, ...unlock])],
    badges: [...new Set([...p.badges, ...(q.badge ? [q.badge] : [])])],
  }
}
/** Persistent discoveries/care can satisfy later objectives; return conversations still require a new event. */
export function reconcileFacts(p: Progress): Progress {
  let next = p
  for (const q of QUESTS) {
    if (q.category === 'daily') continue
    const key = questKey(q, next)
    let qp = next.quests[key]
    if (!qp || qp.state !== 'active') continue
    const counts = [...qp.counts]
    for (let i = 0; i < q.objectives.length; i++) {
      const o = q.objectives[i]
      if (counts[i] >= (o.count ?? 1)) continue
      const target = o.target
      const known =
        !!target &&
        (o.type === 'area'
          ? next.areas.includes(target)
          : o.type === 'upgrade'
            ? next.upgrades.includes(target)
            : o.type === 'rescue'
              ? next.rescued.includes(target)
              : o.type === 'collect'
                ? target === 'foodBowl'
                  ? next.inventory.foodBowl > 0
                    : next.completed.includes('found-item:' + target) || (next.satchel?.[target] ?? 0) > 0 || next.completed.includes('pickup:' + target) ||
                    next.completed.some((k) =>
                      k.startsWith('supplies:' + target + ':'),
                    )
                : o.type === 'feed' ||
                    o.type === 'pet' ||
                    o.type === 'observe' ||
                    o.type === 'water'
                  ? next.completed.includes(target + ':' + o.type)
                  : o.type === 'interact'
                    ? next.completed.includes('event:interact:' + target)
                    : false)
      if (known) counts[i] = o.count ?? 1
      else if (q.ordered) break
    }
    if (counts.some((n, i) => n !== qp.counts[i])) {
      qp = {
        ...qp,
        counts,
        state: q.objectives.every((o, i) => counts[i] >= (o.count ?? 1))
          ? 'completed'
          : 'active',
      }
      next = { ...next, quests: { ...next.quests, [key]: qp } }
    }
  }
  return next
}
