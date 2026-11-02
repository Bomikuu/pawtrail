import { queryKeys } from './keys'
export type DomainEvent = {
  kind:
    | 'animal'
    | 'sighting'
    | 'community'
    | 'application'
    | 'fundraiser'
    | 'mission'
    | 'event'
    | 'privacy'
    | 'session'
  id?: string
}
export function affectedQueries(event: DomainEvent, scope: string) {
  const related: Record<DomainEvent['kind'], string[]> = {
    animal: ['animals', 'community', 'discovery', 'adoption', 'users'],
    sighting: ['animals', 'sightings', 'discovery', 'users'],
    community: ['community', 'animals', 'users', 'notifications'],
    application: ['adoption', 'animals', 'users', 'dashboard', 'notifications'],
    fundraiser: [
      'fundraisers',
      'animals',
      'users',
      'dashboard',
      'notifications',
    ],
    mission: [
      'missions',
      'animals',
      'users',
      'dashboard',
      'kibble',
      'leaderboard',
      'notifications',
    ],
    event: ['events', 'shelters', 'dashboard', 'notifications'],
    privacy: ['users', 'community', 'animals', 'leaderboard', 'search'],
    session: [],
  }
  return related[event.kind].map((domain) => queryKeys(scope).all(domain))
}
