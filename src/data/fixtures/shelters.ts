import 'server-only'
import { shelterProfileSchema } from '@/features/shelters/schemas'
import { base, ids, related, verification } from './shared'
import { shelterNames, sampleLocation, samplePast } from './scenarios'
export const shelters = ids('shelter', 5).map((id, i) =>
  shelterProfileSchema.parse({
    ...base(id),
    createdAt: samplePast(100 + i),
    slug: `sample-shelter-${i + 1}`,
    name: `Sample ${shelterNames[i]}`,
    description:
      'Fictional sample organization, not a real rescue or endorsement',
    location: sampleLocation(i),
    photo: null,
    verification,
    animalIds: related('animal', 20, i),
    fundraiserIds: related('campaign', 25, i),
    eventIds: [`event-${i + 1}`],
    postIds: related('post', 105, i),
    missionIds: related('mission', 30, i),
    staffIds: [`user-${i + 1}`],
  }),
)
