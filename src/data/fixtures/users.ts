import 'server-only'
import { privateUserSchema } from '@/features/users/schemas'
import { base, ids } from './shared'
import { avatarPresetImage } from '@/features/users/avatar-presets'
import { profileBannerIds } from '@/features/users/banner-presets'
import { memberBios, sampleLocation, samplePast } from './scenarios'
export const users = ids('user', 20).map((id, i) =>
  privateUserSchema.parse({
    ...base(id),
    createdAt: samplePast(60 + i * 7),
    bannerId: profileBannerIds[i % profileBannerIds.length],
    username: `sample-helper-${i + 1}`,
    displayName: `Sample Helper ${i + 1}`,
    bio:
      i === 19
        ? 'Sample community moderator reviewing reports and care evidence. All reviews are illustrative.'
        : memberBios[i < 10 ? i : 5 + (i % 5)],
    avatar: avatarPresetImage(
      `pawtrail-avatar-${String(i + 1).padStart(2, '0')}`,
    ),
    location: sampleLocation(i),
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
