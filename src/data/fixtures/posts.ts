import 'server-only'
import { postSchema } from '@/features/community/schemas'
import { base, ids } from './shared'
import { animalNames, hordeNames, sampleAnimalPhoto } from './scenarios'
const storyTypes = [
  'rescue',
  'adoption',
  'feeding',
  'photo',
  'sighting',
  'help',
  'story',
] as const
const updates = [
  (name: string) =>
    `We checked in on ${name} during the neighborhood care round. The next step is a quiet resting spot and a coordinated supply drop.`,
  (name: string) =>
    `${name} is ready for a thoughtful introduction. Read their needs, talk with the sample shelter, and take the adoption process one step at a time.`,
  (name: string) =>
    `Fresh bowls and a tidy feeding corner for ${name} today. We logged what was offered so the next volunteer can pick up where we left off.`,
  (name: string) =>
    `A little portrait break with ${name}. Share the small moments that help neighbors recognize the animals in their care circle.`,
  (name: string) =>
    `Spotted ${name} near the familiar community route. The sighting is logged with a general neighborhood location so helpers can coordinate responsibly.`,
  (name: string) =>
    `${name}’s care circle could use a hand sorting blankets and preparing a welcome kit. The linked mission has the next steps and evidence requirements.`,
  (name: string) =>
    `${name} took their time getting comfortable with the group. Patient company can make a neighborhood feel a little kinder.`,
]
export const posts = ids('post', 105).map((id, i) => {
  const animalIndex = i % 20
  const author = i < 100 ? (i % 20) + 1 : 6
  const typeIndex = i % storyTypes.length
  return postSchema.parse({
    ...base(id),
    createdAt: new Date(
      Date.parse(base(id).createdAt) - (i + 1) * 3600000,
    ).toISOString(),
    authorId: `user-${author}`,
    text: `Sample community story · ${updates[typeIndex]!(animalNames[animalIndex]!)} ${hordeNames[animalIndex % 5]} is an illustrative care group; no real activity is claimed.`,
    type: storyTypes[typeIndex],
    media: [sampleAnimalPhoto(animalIndex)],
    refs: [
      { kind: 'animal', id: `animal-${animalIndex + 1}` },
      { kind: 'horde', id: `horde-${(animalIndex % 5) + 1}` },
      { kind: 'shelter', id: `shelter-${(animalIndex % 5) + 1}` },
      ...(storyTypes[typeIndex] === 'help'
        ? [{ kind: 'mission', id: `mission-${animalIndex + 1}` }]
        : []),
      ...(storyTypes[typeIndex] === 'rescue'
        ? [{ kind: 'fundraiser', id: `campaign-${animalIndex + 1}` }]
        : []),
    ],
    moderation: 'published',
    reactionCount: 3 + (i % 5),
    commentCount: 2,
    version: 1,
  })
})
