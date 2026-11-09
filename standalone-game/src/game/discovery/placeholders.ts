import type { EntityKind } from './types'

/** Decorative category art only; never an animal identity or location reference. */
export type DiscoveryArtwork =
  'animals' | 'events' | 'home' | 'shelters' | 'groups' | 'help' | 'city'

const artwork: Record<EntityKind, DiscoveryArtwork> = {
  animal: 'animals',
  event: 'events',
  home: 'home',
  shelter: 'shelters',
  horde: 'groups',
  hub: 'city',
  help: 'help',
  urgent: 'help',
  incident: 'help',
}

export function discoveryPlaceholder(kind: EntityKind | DiscoveryArtwork) {
  const category = kind in artwork ? artwork[kind as EntityKind] : kind
  return `/pawtrail-game/discovery/map-${category}-v1.webp`
}
