import { describe, expect, it } from 'vitest'
import { discoveryCandidates } from '@/features/neighborhood/game/discovery/members'
import { composition } from '@/features/neighborhood/game/discovery/geo'
import {
  ENTITY_KINDS,
  type MapEntity,
} from '@/features/neighborhood/game/discovery/types'

const shelter: MapEntity = {
  id: 'shelter:care-house',
  kind: 'shelter',
  name: 'Care house',
  description: 'A published care space',
  area: 'Community area',
  coordinates: [125.62, 7.1],
  locationLabel: 'Published approximate place location',
  sample: false,
  membership: {
    animals: [
      { id: 'cat', name: 'Cat', species: 'cat' },
      { id: 'dog', name: 'Dog', species: 'dog' },
    ],
  },
}

describe('animal map layer', () => {
  it('keeps the all-places view grouped while counting its member animals', () => {
    const places = [shelter]
    expect(discoveryCandidates(places, ENTITY_KINDS)).toBe(places)
    expect(composition(places).animals).toBe(2)
  })

  it('finds member animals in the animal layer at their shared place location', () => {
    const animals = discoveryCandidates([shelter], ['animal']).filter(
      (e) => e.kind === 'animal',
    )
    expect(animals.map((e) => e.animal?.id)).toEqual(['cat', 'dog'])
    for (const animal of animals) {
      expect(animal.coordinates).toBe(shelter.coordinates)
      expect(animal.animal?.associationName).toBe(shelter.name)
      expect(animal.locationLabel).toContain('Shared place location')
    }
  })

  it('deduplicates animals shared across places and preserves a direct animal record', () => {
    const direct: MapEntity = {
      ...shelter,
      id: 'animal:cat',
      kind: 'animal',
      membership: undefined,
      animal: { id: 'cat', name: 'Cat', species: 'cat' },
    }
    const other: MapEntity = {
      ...shelter,
      id: 'horde:care-circle',
      kind: 'horde',
    }
    const animals = discoveryCandidates(
      [shelter, other, direct],
      ['animal', 'event'],
    ).filter((e) => e.kind === 'animal')
    expect(animals).toHaveLength(2)
    expect(animals.find((e) => e.animal?.id === 'cat')).toBe(direct)
  })
})
