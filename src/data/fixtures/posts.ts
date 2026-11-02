import 'server-only'
import { samplePhotos } from './photos'
import { postSchema } from '@/features/community/schemas'
import { base, ids } from './shared'
export const posts = ids('post', 10).map((id, i) =>
  postSchema.parse({
    ...base(id),
    authorId: `user-${i + 1}`,
    text:
      [
        'Sample rescue story: Milo’s care circle is planning food and a quiet place to rest. This is a fictional example of coordinating help.',
        'Sample adoption story: Luna’s profile helps a potential adopter learn about her needs before expressing interest. No adoption has taken place.',
        'Sample community achievement: a feeding mission shows how reviewed contributions earn non-cash Kibble in the demo.',
      ][i] ??
      (i % 3 === 2
        ? 'Sample community achievement: volunteers practice logging a reviewed feeding mission in the demo. No real activity is claimed.'
        : `Sample update ${i + 1}: sharing an animal’s story with the community.`),
    type: 'story',
    media: samplePhotos[i] ? [samplePhotos[i]] : [],
    refs: [
      { kind: 'animal', id: `animal-${i + 1}` },
      { kind: 'horde', id: `horde-${(i % 5) + 1}` },
      { kind: 'shelter', id: `shelter-${(i % 5) + 1}` },
    ],
    moderation: 'published',
    reactionCount: 0,
    commentCount: 1,
    version: 1,
  }),
)
