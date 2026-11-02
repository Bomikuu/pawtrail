import 'server-only'
import { shelterProfileSchema } from '@/features/shelters/schemas'
import { base, ids, location, related, verification } from './shared'
export const shelters = ids('shelter', 5).map((id, i) =>
  shelterProfileSchema.parse({
    ...base(id),
    slug: `sample-shelter-${i + 1}`,
    name: `Sample Davao Shelter ${i + 1}`,
    description:
      'Fictional sample organization, not a real rescue or endorsement',
    location,
    photo: null,
    verification,
    animalIds: related('animal', 20, i),
    fundraiserIds: related('campaign', 10, i),
    eventIds: [`event-${i + 1}`],
    postIds: related('post', 10, i),
    missionIds: related('mission', 10, i),
    staffIds: [`user-${i + 1}`],
  }),
)
