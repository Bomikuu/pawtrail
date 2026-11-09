import { attentionRank, entityAttention, type HelpPrompt } from './attention'
import { clusterAnimalTargets } from './members'
import type { MapAnimal, MapEntity, Point } from './types'

/** Published animal alerts remain visible independently of nearby prompt dismissal. */
export function animalAttentionQuests(entities: MapEntity[]): HelpPrompt[] {
  return clusterAnimalTargets(entities)
    .flatMap((entity) => {
      const attention = entityAttention(entity)
      return attention
        ? [
            {
              entity,
              attention,
              distance: null,
              animalName: entity.animal?.name,
            },
          ]
        : []
    })
    .sort(
      (a, b) =>
        attentionRank(b.attention) - attentionRank(a.attention) ||
        a.entity.name.localeCompare(b.entity.name) ||
        a.entity.id.localeCompare(b.entity.id),
    )
}

export type MapQuest = {
  id: string
  title: string
  href: string
  priority: string
  area: string
  coordinates: Point
  available: boolean
  animal: MapAnimal | null
  participation: 'accepted' | 'submitted' | 'approved' | 'rejected' | null
}
export type MapQuestLog = {
  items: MapQuest[]
  authenticated: boolean
  total: number
  progress: { joined: number; approved: number; submitted: number }
  unavailable: number
}

/** Milestones reflect saved participation states, not welfare or reward estimates. */
export function questProgress(state: MapQuest['participation']) {
  switch (state) {
    case 'accepted':
      return { completed: 1, label: 'Joined · submit your proof' }
    case 'submitted':
      return { completed: 2, label: 'Proof submitted · awaiting review' }
    case 'approved':
      return { completed: 3, label: 'Approved · quest complete' }
    case 'rejected':
      return { completed: 1, label: 'Changes requested · update your proof' }
    default:
      return { completed: 0, label: 'Not started' }
  }
}

export const QUEST_FILTERS = ['all', 'attention', 'adoption', 'mine'] as const
export type QuestFilter = (typeof QUEST_FILTERS)[number]
export type MapQuestEntry =
  | {
      kind: 'animal'
      id: string
      entity: MapEntity
      attention: HelpPrompt | null
      adoptable: boolean
    }
  | { kind: 'mission'; id: string; quest: MapQuest }
  | { kind: 'alert'; id: string; prompt: HelpPrompt }

/** One animal row per published identity, including shared-place members. */
export function mapQuestEntries(
  entities: MapEntity[],
  attentions: HelpPrompt[],
  log: MapQuestLog | null,
  currentAttention?: HelpPrompt | null,
): MapQuestEntry[] {
  const alerts = new Map(
    attentions.map((prompt) => [prompt.entity.animal?.id, prompt]),
  )
  const animals: MapQuestEntry[] = clusterAnimalTargets(entities).flatMap(
    (entity) => {
      const attention = alerts.get(entity.animal!.id) ?? null
      const adoptable = entity.animal?.adoptable === true
      return attention || adoptable
        ? [
            {
              kind: 'animal' as const,
              id: 'animal:' + entity.animal!.id,
              entity,
              attention,
              adoptable,
            },
          ]
        : []
    },
  )
  const missions: MapQuestEntry[] = (log?.items ?? []).map((quest) => ({
    kind: 'mission',
    id: 'mission:' + quest.id,
    quest,
  }))
  const extra: MapQuestEntry[] =
    currentAttention &&
    !attentions.some(
      (prompt) =>
        prompt.attention.key === currentAttention.attention.key ||
        prompt.entity.id === currentAttention.entity.id,
    ) &&
    !log?.items.some(
      (quest) =>
        quest.id === currentAttention.entity.help?.id ||
        currentAttention.attention.sourceId === 'help:mission:' + quest.id,
    )
      ? [
          {
            kind: 'alert',
            id: 'alert:' + currentAttention.attention.key,
            prompt: currentAttention,
          },
        ]
      : []
  const rank = (entry: MapQuestEntry) =>
    entry.kind === 'animal'
      ? (entry.attention ? attentionRank(entry.attention.attention) * 10 : 0) +
        Number(entry.adoptable)
      : entry.kind === 'alert'
        ? attentionRank(entry.prompt.attention) * 10
        : Number(
            entry.quest.available &&
              ['high', 'critical'].includes(entry.quest.priority),
          ) *
            10 +
          Number(!!entry.quest.participation) * 4
  return [...animals, ...missions, ...extra].sort((a, b) => rank(b) - rank(a))
}
export function matchesQuestFilter(entry: MapQuestEntry, filter: QuestFilter) {
  if (filter === 'all') return true
  if (filter === 'mine')
    return entry.kind === 'mission' && !!entry.quest.participation
  if (filter === 'adoption') return entry.kind === 'animal' && entry.adoptable
  return (
    entry.kind === 'alert' ||
    (entry.kind === 'animal'
      ? !!entry.attention
      : entry.quest.available &&
        ['high', 'critical'].includes(entry.quest.priority))
  )
}
