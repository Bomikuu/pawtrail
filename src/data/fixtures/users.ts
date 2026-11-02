import 'server-only'
import { privateUserSchema } from '@/features/users/schemas'
import { base, ids, location } from './shared'
export const users = ids('user', 20).map((id, i) =>
  privateUserSchema.parse({
    ...base(id),
    username: `sample-helper-${i + 1}`,
    displayName: `Sample Helper ${i + 1}`,
    bio: 'Illustrative community helper profile',
    avatar: null,
    location,
    contributionCount: 1,
    email: `helper-${i + 1}@example.invalid`,
    settings: {
      discoverable: true,
      showLocation: true,
      showContributions: true,
    },
    roles:
      i < 5
        ? ['member', 'shelter_staff']
        : i === 19
          ? ['member', 'moderator']
          : ['member'],
    shelterIds: i < 5 ? [`shelter-${i + 1}`] : [],
  }),
)
