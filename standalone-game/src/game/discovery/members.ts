import type { EntityKind, MapAnimal, MapEntity } from './types'

/** Members share their parent's published location. Avatar offsets are display-only. */
export function memberEntity(parent: MapEntity, animal: MapAnimal): MapEntity {
  return {
    id: `member:${parent.id}:${animal.id}`,
    kind: 'animal',
    name: animal.name,
    description: `${animal.name} is publicly associated with ${parent.name}. The animal circle shows that membership, not a separate live location.`,
    area: parent.area,
    coordinates: parent.coordinates,
    locationLabel: 'Shared place location · avatar offset is for display only',
    sample: parent.sample,
    demo: parent.demo,
    photo: animal.photo,
    profileHref: animal.profileHref,
    attention: animal.attention,
    animal: {
      ...animal,
      associationId: parent.id,
      associationName: parent.name,
    },
  }
}
export function membershipEntities(entities: MapEntity[]) {
  return entities
    .filter((e) => ['home', 'shelter', 'hub', 'horde'].includes(e.kind))
    .flatMap((e) =>
      (e.membership?.animals ?? []).map((animal) => memberEntity(e, animal)),
    )
}

/** A shared animal selection belongs to its actual parent marker, never a nearby pin. */
export function markerHasSelection(entity: MapEntity, selectedId?: string) {
  return (
    !!selectedId &&
    (entity.id === selectedId ||
      (entity.membership?.animals ?? []).some(
        (animal) => selectedId === `member:${entity.id}:${animal.id}`,
      ))
  )
}
/** Animal-only layers keep membership discoverable at the published place. */
export function discoveryCandidates(
  entities: MapEntity[],
  layers: EntityKind[],
) {
  if (
    !layers.includes('animal') ||
    layers.some((kind) => ['home', 'shelter', 'hub', 'horde'].includes(kind))
  )
    return entities
  const animals = new Set<string>()
  return [...entities, ...membershipEntities(entities)].filter((entity) => {
    if (!entity.animal) return true
    if (animals.has(entity.animal.id)) return false
    animals.add(entity.animal.id)
    return true
  })
}
export function clusterAnimalTargets(entities: MapEntity[]) {
  const targets = new Map<string, MapEntity>()
  for (const e of entities) {
    if (e.animal && !targets.has(e.animal.id)) targets.set(e.animal.id, e)
    if (['home', 'shelter', 'hub', 'horde'].includes(e.kind))
      for (const animal of e.membership?.animals ?? []) {
        if (!targets.has(animal.id))
          targets.set(animal.id, memberEntity(e, animal))
      }
  }
  return [...targets.values()]
}
