import type { AnimalProfile } from '@/features/animals/types'
import type { AdoptionCandidate, AdoptionPreferences } from './types'

export function scoreCompatibility(
  animal: AnimalProfile,
  p: AdoptionPreferences,
  approximateDistanceKm?: number,
): AdoptionCandidate['compatibility'] {
  const components: AdoptionCandidate['compatibility']['components'] = []
  const advisories: string[] = []
  const add = (
    dimension: (typeof components)[number]['dimension'],
    weight: number,
    score: number,
    explanation: string,
    evidence: string[],
  ) => components.push({ dimension, weight, score, explanation, evidence })
  const needs = animal.needs
  if (p.species)
    add(
      'species',
      20,
      Number(p.species === animal.species),
      `You selected ${p.species}; this animal is a ${animal.species}.`,
      [p.species, animal.species],
    )
  if (p.homeType && needs.suitableHomeTypes?.length)
    add(
      'home',
      20,
      Number(needs.suitableHomeTypes.includes(p.homeType)),
      `Your ${p.homeType} is ${needs.suitableHomeTypes.includes(p.homeType) ? '' : 'not '}listed among recorded suitable homes.`,
      [p.homeType, ...needs.suitableHomeTypes],
    )
  if (p.activity && needs.energy) {
    const scale = ['low', 'medium', 'high']
    add(
      'lifestyle',
      20,
      1 - Math.abs(scale.indexOf(p.activity) - scale.indexOf(needs.energy)) / 2,
      `Your activity is ${p.activity}; recorded energy is ${needs.energy}.`,
      [p.activity, needs.energy],
    )
  }
  if (p.experience && needs.requiresExperiencedHandler !== undefined)
    add(
      'experience',
      15,
      Number(
        !needs.requiresExperiencedHandler || p.experience === 'experienced',
      ),
      'Based on the recorded handler experience requirement.',
      [p.experience, String(needs.requiresExperiencedHandler)],
    )
  if (p.otherPets) {
    if (!p.otherPets.length)
      add('otherPets', 15, 1, 'You reported no other household pets.', [
        'No other pets',
      ])
    else if (p.otherPets.some((t) => needs.incompatiblePetTypes?.includes(t)))
      add(
        'otherPets',
        15,
        0,
        'A recorded incompatibility needs discussion with the shelter.',
        p.otherPets,
      )
    else if (p.otherPets.every((t) => needs.compatiblePetTypes?.includes(t)))
      add(
        'otherPets',
        15,
        1,
        'All household pet types have recorded compatibility.',
        p.otherPets,
      )
  }
  if (p.maxDistanceKm && approximateDistanceKm !== undefined)
    add(
      'distance',
      10,
      Number(approximateDistanceKm <= p.maxDistanceKm),
      `Approximately ${Math.round(approximateDistanceKm)} km between public area centers; your limit is ${p.maxDistanceKm} km.`,
      [String(approximateDistanceKm), String(p.maxDistanceKm)],
    )
  for (const c of components) if (!c.score) advisories.push(c.explanation)
  const answeredWeight = components.reduce((n, c) => n + c.weight, 0)
  return {
    score: answeredWeight
      ? Math.round(
          (100 * components.reduce((n, c) => n + c.weight * c.score, 0)) /
            answeredWeight,
        )
      : null,
    answeredWeight,
    components,
    advisories,
  }
}
