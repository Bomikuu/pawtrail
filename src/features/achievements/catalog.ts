import definitions from '../../../backend/social/achievement_catalog.json'

export type BadgeDefinition = {
  id: string
  title: string
  target: number
  rewardKibble: number
  category: string
  unit: string
  rule: string
  href: string
  image: string
  proofContext?:
    'animal' | 'horde' | 'event' | 'post' | 'friend' | 'campaign' | 'shelter'
  historical?: boolean
}

/** One-time, non-cash milestone rewards. All conditions are evaluated on the server. */
export const achievementCatalog: readonly BadgeDefinition[] =
  definitions.badges as readonly BadgeDefinition[]

export const findBadge = (id: string) =>
  achievementCatalog.find((badge) => badge.id === id)
export const masteryTiers = definitions.tiers as readonly {
  name: string
  count: number
}[]
