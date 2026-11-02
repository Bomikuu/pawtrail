import 'server-only'
import { missionDetailSchema } from '@/features/missions/schemas'
import { base, ids, location } from './shared'
export const missions = ids('mission', 10).map((id, i) =>
  missionDetailSchema.parse({
    ...base(id),
    slug: `sample-help-${i + 1}`,
    title: `Sample community help ${i + 1}`,
    kind: i % 2 ? 'quest' : 'mission',
    urgency: 'normal',
    state: 'open',
    deadline: '2026-11-15T17:00:00+08:00',
    rewardKibble: 50,
    location,
    animalId: `animal-${i + 1}`,
    shelterId: `shelter-${(i % 5) + 1}`,
    organizerId: `user-${(i % 5) + 1}`,
    description: 'Illustrative feeding and welfare support request',
    evidenceRequirements: [
      'A plain-text account of the completed contribution',
    ],
    version: 1,
  }),
)
