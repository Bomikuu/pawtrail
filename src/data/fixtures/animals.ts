import 'server-only'
import {
  animalNames,
  sampleAnimalPhoto,
  sampleLocation,
  samplePast,
} from './scenarios'
import { profileBannerIds } from '@/features/users/banner-presets'
import { animalRecordSchema } from '@/features/animals/schemas'
import { base, ids, verification } from './shared'
export const animals = animalNames.map((name, index) =>
  animalRecordSchema.parse({
    ...base(`animal-${index + 1}`),
    createdAt: samplePast(45 + index),
    bannerId: profileBannerIds[index % profileBannerIds.length],
    slug: name.toLowerCase(),
    name,
    species: index % 2 ? 'cat' : 'dog',
    ageMonths: 12 + index * 2,
    gender: index % 2 ? 'female' : 'male',
    size: index % 2 ? 'small' : 'medium',
    adoptable: index < 15,
    status:
      index >= 18
        ? 'adopted'
        : index === 17
          ? 'missing'
          : index >= 15
            ? 'owned'
            : index % 3 === 0
              ? 'community'
              : 'sheltered',
    location: sampleLocation(index),
    photo: sampleAnimalPhoto(index),
    shelterId: `shelter-${(index % 5) + 1}`,
    hordeId: `horde-${(index % 5) + 1}`,
    verification,
    description: `Meet ${name}, a fictional ${index % 2 ? 'cat' : 'dog'} cared for by the ${sampleLocation(index).neighborhood} sample community. ${index < 15 ? 'Their care circle is looking for a patient home and regular neighborhood support.' : index >= 18 ? 'This sample profile illustrates an animal settling into an adoptive home.' : 'Neighbors share sightings and helpful updates here.'} Stock imagery is illustrative.`,
    appearance:
      index === 0
        ? 'Brown and white coat; stock photograph is illustrative'
        : index === 1
          ? 'Cat at a window; stock photograph is illustrative'
          : index % 2
            ? 'Short fur with tabby markings'
            : 'Short brown and white fur',
    observedCondition:
      'Sample observation: alert during a community visit. No medical diagnosis.',
    personality:
      index % 3 === 0
        ? ['playful', 'sociable']
        : index % 3 === 1
          ? ['calm', 'gentle']
          : ['curious', 'independent'],
    behavior:
      index % 2
        ? ['prefers calm introductions', 'enjoys a sunny resting spot']
        : ['enjoys gentle walks', 'responds to patient handling'],
    characteristics: index === 0 ? ['medium-length coat'] : ['short coat'],
    badges: ['Sample animal'],
    gallery: [],
    needs: {
      suitableHomeTypes: ['apartment', 'house'],
      energy: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'low' : 'medium',
      requiresExperiencedHandler: false,
      compatiblePetTypes: ['dog', 'cat'],
      incompatiblePetTypes: [],
    },
    postIds: Array.from(
      { length: 5 },
      (_, round) => `post-${index + 1 + round * 20}`,
    ),
    sightingIds: Array.from(
      { length: 5 },
      (_, round) =>
        `sighting-${((index - round * 3 + 20) % 20) + 1 + round * 20}`,
    ),
    fundraiserIds: [`campaign-${index + 1}`],
    missionIds: [
      `mission-${index + 1}`,
      ...(index < 10 ? [`mission-${index + 21}`] : []),
    ],
    helperIds: [ids('user', 20)[index]],
    version: 1,
    ownerId: `user-${(index % 5) + 1}`,
    moderation: 'published',
    privateNotes: 'Synthetic internal sample note',
  }),
)
