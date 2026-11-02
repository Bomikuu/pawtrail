import 'server-only'
import { sightingSchema } from '@/features/sightings/schemas'
import { commentRecordSchema } from '@/features/community/schemas'
import { demoContributionSchema } from '@/features/fundraising/schemas'
import { kibbleEntrySchema } from '@/features/kibble/schemas'
import { missionParticipationSchema } from '@/features/missions/schemas'
import { base, ids, location } from './shared'
export const sightings = ids('sighting', 20).map((id, i) =>
  sightingSchema.parse({
    ...base(id),
    animalId: `animal-${i + 1}`,
    hordeId: `horde-${(i % 5) + 1}`,
    reporterId: `user-${i + 1}`,
    observedAt: '2026-11-01T18:00:00+08:00',
    location,
    observation: 'Sample observation during a neighborhood visit',
    media: [],
    moderation: 'published',
  }),
)
export const comments = ids('comment', 10).map((id, i) =>
  commentRecordSchema.parse({
    ...base(id),
    ref: { kind: 'post', id: `post-${i + 1}` },
    authorId: `user-${i + 1}`,
    text: 'Illustrative community comment',
    moderation: 'published',
  }),
)
export const contributions = ids('contribution', 10).map((id, i) =>
  demoContributionSchema.parse({
    ...base(id),
    campaignId: `campaign-${i + 1}`,
    contributorId: `user-${i + 1}`,
    amountMinor: 10000,
    currency: 'PHP',
    message: 'Sample support — no money transferred',
    anonymous: i % 2 === 0,
    simulated: true,
  }),
)
export const participations = ids('participation', 10).map((id, i) =>
  missionParticipationSchema.parse({
    ...base(id),
    missionId: `mission-${i + 1}`,
    volunteerId: `user-${i + 6}`,
    state: 'approved',
    evidence: {
      text: 'Illustrative completed feeding contribution',
      mediaIds: [],
      expectedVersion: 1,
    },
    reviewerId: `user-${(i % 5) + 1}`,
    reviewReason: 'Sample evidence review',
    version: 2,
  }),
)
export const kibbleEntries = ids('kibble-entry', 20).map((id, i) =>
  kibbleEntrySchema.parse({
    ...base(id),
    userId: `user-${i + 1}`,
    amount: i >= 5 && i < 15 ? 50 : 10,
    reason: i >= 5 && i < 15 ? 'mission_approved' : 'sample_naming',
    contributionId:
      i >= 5 && i < 15 ? `participation-${i - 4}` : `sample-naming-${i + 1}`,
    description: 'Illustrative earned Kibble; non-cash sample ledger entry',
  }),
)
export const namingAwards = ids('user', 20).flatMap((userId, i) =>
  i >= 5 && i < 15
    ? []
    : [
        {
          ...base(`sample-naming-${i + 1}`),
          userId,
          animalId: `animal-${i + 1}`,
        },
      ],
)
export const rsvps = ids('rsvp', 5).map((id, i) => ({
  ...base(id),
  eventId: `event-${i + 1}`,
  userId: `user-${i + 1}`,
}))
