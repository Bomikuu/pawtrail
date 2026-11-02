import 'server-only'
import { postSchema } from '@/features/community/schemas'
import { base, ids } from './shared'
export const posts = ids('post', 10).map((id, i) =>
  postSchema.parse({
    ...base(id),
    authorId: `user-${i + 1}`,
    text: `Sample update ${i + 1}: sharing an animal's story with the community.`,
    type: 'story',
    media: [],
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
