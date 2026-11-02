import 'server-only'
import { hordeProfileSchema } from '@/features/hordes/schemas'
import { base, ids, location, related } from './shared'
export const hordes = ids('horde', 5).map((id, i) =>
  hordeProfileSchema.parse({
    ...base(id),
    slug: `poblacion-paws-${i + 1}`,
    name: `Sample Poblacion Paws ${i + 1}`,
    description: 'Illustrative neighborhood animal group',
    location,
    photo: null,
    animalIds: related('animal', 20, i),
    sightingIds: related('sighting', 20, i),
    postIds: related('post', 10, i),
    fundraiserIds: related('campaign', 10, i),
    missionIds: related('mission', 10, i),
    contributorIds: related('user', 20, i),
  }),
)
