import 'server-only'
import { missionDetailSchema } from '@/features/missions/schemas'
import { base, ids } from './shared'
import { animalNames, careTasks, sampleLocation, samplePast } from './scenarios'
export const missions = ids('mission', 30).map((id, i) =>
  missionDetailSchema.parse({
    ...base(id),
    createdAt: samplePast(15 + (i % 5)),
    slug: `sample-help-${i + 1}`,
    title: `Sample: ${careTasks[i % careTasks.length]} for ${animalNames[i % 20]}`,
    kind: i % 3 === 1 ? 'quest' : 'mission',
    urgency: i % 7 === 0 ? 'high' : 'normal',
    state: i >= 23 && i < 26 ? 'closed' : 'open',
    deadline:
      i >= 23 && i < 26
        ? '2026-11-01T17:00:00+08:00'
        : `2026-11-${String(10 + (i % 15)).padStart(2, '0')}T17:00:00+08:00`,
    rewardKibble: 50,
    location: sampleLocation(i),
    animalId: `animal-${(i % 20) + 1}`,
    hordeId: `horde-${(i % 5) + 1}`,
    shelterId: `shelter-${(i % 5) + 1}`,
    organizerId: `user-${(i % 5) + 1}`,
    description: `Fictional sample mission: ${careTasks[i % careTasks.length]!.toLowerCase()}. Coordinate with the responsible shelter, follow the care checklist and submit a clear account of what was done. This demonstrates the mission workflow; no real assignment is available.`,
    evidenceRequirements: [
      'Describe the task completed and when it happened.',
      'Record the supplies or handover involved; avoid private addresses.',
      'An independent responsible organizer reviews the contribution.',
    ],
    version: 1,
  }),
)
