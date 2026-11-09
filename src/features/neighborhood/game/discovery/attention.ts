import { metersBetween, withinBounds } from './geo'
import { memberEntity } from './members'
import type { MapAttention, MapEntity, Point, Proximity } from './types'

const weights = { urgent: 3, concern: 2, help: 1 }
export const attentionRank = (value?: MapAttention) =>
  value ? weights[value.level] : 0
const better = (a: MapAttention | undefined, b: MapAttention) =>
  !a ||
  attentionRank(b) > attentionRank(a) ||
  (attentionRank(b) === attentionRank(a) &&
    a.sourceKind === 'welfare' &&
    b.sourceKind !== 'welfare')
    ? b
    : a
const active = (
  value: MapAttention | undefined,
  now: number,
  sample: boolean,
) =>
  value && (!value.expiresAt || sample || Date.parse(value.expiresAt) > now)
    ? value
    : undefined

export function entityAttention(entity: MapEntity): MapAttention | undefined {
  let result = entity.attention
  if (entity.animal?.attention) result = better(result, entity.animal.attention)
  for (const animal of entity.membership?.animals ?? [])
    if (animal.attention) result = better(result, animal.attention)
  return result
}

/** Public evidence only. Location proximity alone never attributes a concern to an animal. */
export function withAttention(entities: MapEntity[], now: number): MapEntity[] {
  const animalAlerts = new Map<string, MapAttention>(),
    entityAlerts = new Map<string, MapAttention>()
  const putAnimal = (id: string, alert: MapAttention) =>
    animalAlerts.set(id, better(animalAlerts.get(id), alert))
  const putEntity = (id: string, alert: MapAttention) =>
    entityAlerts.set(id, better(entityAlerts.get(id), alert))
  for (const entity of entities) {
    const explicit = active(entity.attention, now, entity.sample)
    if (explicit) {
      putEntity(entity.id, explicit)
      if (entity.animal) putAnimal(entity.animal.id, explicit)
    }
    const own = active(entity.animal?.attention, now, entity.sample)
    if (entity.animal && own) putAnimal(entity.animal.id, own)
    for (const animal of entity.membership?.animals ?? []) {
      const a = active(animal.attention, now, entity.sample)
      if (a) putAnimal(animal.id, a)
      if (animal.status === 'missing')
        putAnimal(animal.id, {
          key: `animal:${animal.id}:missing`,
          level: 'concern',
          label: 'Missing animal',
          detail:
            'This public animal profile is marked missing. Check the latest profile and sighting information.',
          sourceId: ['home', 'shelter', 'hub', 'horde'].includes(entity.kind)
            ? memberEntity(entity, animal).id
            : entity.id,
          sourceKind: 'missing',
        })
    }
    if (
      entity.animal &&
      (entity.animal.status === 'missing' || entity.animal.needsHelp)
    ) {
      const missing = entity.animal.status === 'missing'
      putAnimal(entity.animal.id, {
        key: `animal:${entity.animal.id}:${missing ? 'missing' : 'help'}`,
        level: 'concern',
        label: missing ? 'Missing animal' : 'Help needed',
        detail: missing
          ? 'This public animal profile is marked missing. Check the latest profile and sighting information.'
          : 'This animal has a published help flag. Open its profile for current information.',
        sourceId: entity.id,
        sourceKind: missing ? 'missing' : 'help',
      })
    }
    let alert: MapAttention | undefined
    if (
      entity.help &&
      ['open', 'active'].includes(entity.help.status) &&
      (entity.sample || Date.parse(entity.help.expiresAt) > now)
    ) {
      const urgent = ['critical', 'high'].includes(entity.help.priority)
      alert = {
        key: `${entity.id}:${entity.help.status}:${entity.help.priority}:${entity.help.expiresAt}`,
        level: urgent ? 'urgent' : 'help',
        label: urgent ? 'Needs urgent help' : 'Help requested',
        detail: entity.name,
        sourceId: entity.id,
        sourceKind: 'help',
        expiresAt: entity.help.expiresAt,
      }
    }
    if (
      entity.incident &&
      ['corroborated', 'under_review'].includes(entity.incident.status)
    ) {
      const confirmed = entity.incident.status === 'corroborated'
      alert = {
        key: `${entity.id}:${entity.incident.version}:${entity.incident.status}`,
        level:
          confirmed && ['high', 'critical'].includes(entity.incident.severity)
            ? 'urgent'
            : 'concern',
        label: confirmed
          ? 'Corroborated welfare concern'
          : 'Concern under review',
        detail: confirmed
          ? 'A corroborated public concern remains unresolved. Open the approved summary for details.'
          : 'A report is under review. This is not a confirmed finding.',
        sourceId: entity.id,
        sourceKind: 'incident',
      }
    }
    if (alert) {
      putEntity(entity.id, alert)
      if (entity.subject?.kind === 'animal')
        putAnimal(entity.subject.id.replace(/^animal:/, ''), alert)
      else if (entity.subject) putEntity(entity.subject.id, alert)
      if (entity.help)
        for (const animal of entity.membership?.animals ?? [])
          putAnimal(animal.id, alert)
    }
    if (entity.welfare?.openConfirmed) {
      putEntity(entity.id, {
        key: `welfare:${entity.id}:${entity.welfare.openConfirmed}`,
        level: 'concern',
        label: 'Unresolved welfare concern',
        detail: `${entity.welfare.openConfirmed} corroborated public reports remain unresolved for this place.`,
        sourceId: entity.id,
        sourceKind: 'welfare',
      })
    } else if (entity.welfare?.underReview) {
      putEntity(entity.id, {
        key: `review:${entity.id}:${entity.welfare.underReview}`,
        level: 'concern',
        label: 'Concern under review',
        detail:
          'A public report is under review. This is not a confirmed finding.',
        sourceId: entity.id,
        sourceKind: 'welfare',
      })
    }
  }
  return entities.map((entity) => ({
    ...entity,
    attention: entityAlerts.get(entity.id),
    ...(entity.animal
      ? {
          animal: {
            ...entity.animal,
            attention: animalAlerts.get(entity.animal.id),
          },
        }
      : {}),
    ...(entity.membership
      ? {
          membership: {
            animals: entity.membership.animals.map((animal) => ({
              ...animal,
              attention: animalAlerts.get(animal.id),
            })),
          },
        }
      : {}),
  }))
}

export type HelpPrompt = {
  contextOnly?: boolean
  entity: MapEntity
  attention: MapAttention
  distance: number | null
  animalName?: string
}
export function nearbyHelpPrompts(
  entities: MapEntity[],
  proximity: Proximity | null,
  bounds: readonly number[] | null,
  dismissed: ReadonlySet<string>,
): HelpPrompt[] {
  if (!proximity && !bounds) return []
  const candidates: HelpPrompt[] = []
  const origin: Point | null =
    proximity?.center ??
    (bounds ? [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2] : null)
  for (const parent of entities) {
    if (
      proximity
        ? metersBetween(proximity.center, parent.coordinates) > proximity.radius
        : bounds && !withinBounds(parent, bounds)
    )
      continue
    const members = ['home', 'shelter', 'hub', 'horde'].includes(parent.kind)
      ? (parent.membership?.animals ?? []).map((a) => memberEntity(parent, a))
      : []
    for (const entity of [...members, parent]) {
      const attention = entityAttention(entity)
      if (
        !attention ||
        attention.level === 'help' ||
        dismissed.has(attention.key)
      )
        continue
      candidates.push({
        entity,
        attention,
        distance: origin ? metersBetween(origin, entity.coordinates) : null,
        animalName:
          entity.animal?.name ??
          (entity.help && entity.membership?.animals.length === 1
            ? entity.membership.animals[0].name
            : undefined),
      })
    }
  }
  candidates.sort(
    (a, b) =>
      Number(a.entity.sample) - Number(b.entity.sample) ||
      attentionRank(b.attention) - attentionRank(a.attention) ||
      Number(!!b.entity.animal) - Number(!!a.entity.animal) ||
      (a.distance ?? Infinity) - (b.distance ?? Infinity) ||
      a.attention.key.localeCompare(b.attention.key),
  )
  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    if (seen.has(candidate.attention.key)) return false
    seen.add(candidate.attention.key)
    return true
  })
}
