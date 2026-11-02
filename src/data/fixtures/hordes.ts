import 'server-only'
import { hordeProfileSchema } from '@/features/hordes/schemas'
import { base, ids, related } from './shared'
import { sightings } from './activity'
import {
  hordeNames,
  sampleLocation,
  sampleAnimalPhoto,
  samplePast,
} from './scenarios'
export const hordes = ids('horde', 5).map((id, i) =>
  hordeProfileSchema.parse({
    ...base(id),
    createdAt: samplePast(55 + i),
    slug: `poblacion-paws-${i + 1}`,
    name: `Sample ${hordeNames[i]}`,
    description: `A fictional care circle in ${sampleLocation(i).neighborhood}. Neighbors coordinate sightings, feeding, water and shelter support for four familiar animals. Sample activity is illustrative.`,
    location: sampleLocation(i),
    photo: sampleAnimalPhoto(i),
    animalIds: related('animal', 20, i),
    sightingIds: sightings.filter((s) => s.hordeId === id).map((s) => s.id),
    postIds: related('post', 105, i),
    fundraiserIds: related('campaign', 25, i),
    missionIds: related('mission', 30, i),
    contributorIds: related('user', 20, i),
  }),
)
