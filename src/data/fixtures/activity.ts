import 'server-only'
import { sightingSchema } from '@/features/sightings/schemas'
import { commentRecordSchema } from '@/features/community/schemas'
import { demoContributionSchema } from '@/features/fundraising/schemas'
import { kibbleEntrySchema } from '@/features/kibble/schemas'
import { missionParticipationSchema } from '@/features/missions/schemas'
import { base, ids } from './shared'
import {
  animalNames,
  sampleAnimalPhoto,
  sampleLocation,
  samplePast,
} from './scenarios'
export const sightings = ids('sighting', 100).map((id, i) => {
  const round = Math.floor(i / 20)
  const animalIndex = ((i % 20) + round * 3) % 20
  return sightingSchema.parse({
    ...base(id),
    createdAt: samplePast(round + 1, 18),
    animalId: `animal-${animalIndex + 1}`,
    hordeId: `horde-${(animalIndex % 5) + 1}`,
    reporterId: `user-${(i % 20) + 1}`,
    observedAt: samplePast(round + 1, 17),
    location: sampleLocation(animalIndex),
    observation: `Sample sighting: ${animalNames[animalIndex]} was ${['resting in a shaded community spot', 'walking along the familiar feeding route', 'waiting calmly near a water station', 'visiting the community care corner', 'relaxing with the neighborhood care group'][round]}. Generalized location only; this is fictional activity.`,
    media: [sampleAnimalPhoto(animalIndex)],
    moderation: 'published',
  })
})
const commentTexts = [
  'Thanks for keeping the care circle updated. I can help prepare the next sample supply kit.',
  'A thoughtful update. The linked profile makes it easier to learn what kind of help is needed.',
  'The neighborhood team is checking the schedule before coordinating the next visit.',
  'Glad to see patient, practical care getting some attention. Thanks for sharing the details.',
]
export const comments = [
  ...ids('comment', 210).map((id, i) =>
    commentRecordSchema.parse({
      ...base(id),
      createdAt: new Date(
        Date.parse(base(id).createdAt) -
          ((i % 105) + 1) * 3600000 +
          (Math.floor(i / 105) + 1) * 900000,
      ).toISOString(),
      ref: { kind: 'post', id: `post-${(i % 105) + 1}` },
      authorId: `user-${((i * 7 + 3) % 20) + 1}`,
      text: `Sample conversation · ${commentTexts[i % commentTexts.length]}`,
      moderation: 'published',
    }),
  ),
  ...Array.from({ length: 20 }, (_, i) =>
    commentRecordSchema.parse({
      ...base(`sample-resource-comment-${i + 1}`),
      createdAt: samplePast(1, 12),
      ref: {
        kind:
          i < 5
            ? 'event'
            : i < 10
              ? 'horde'
              : i < 15
                ? 'mission'
                : 'fundraiser',
        id: `${i < 5 ? 'event' : i < 10 ? 'horde' : i < 15 ? 'mission' : 'campaign'}-${(i % 5) + 1}`,
      },
      authorId: `user-${i + 1}`,
      text: `Sample conversation · ${commentTexts[i % commentTexts.length]} No real gathering or contribution is implied.`,
      moderation: 'published',
    }),
  ),
]
export const contributions = [
  ...ids('contribution', 10).map((id, i) =>
    demoContributionSchema.parse({
      ...base(id),
      createdAt: samplePast(3 + (i % 4), 10),
      campaignId: `campaign-${i + 1}`,
      contributorId: `user-${i + 1}`,
      amountMinor: 10000,
      currency: 'PHP',
      message: 'Sample support — no money transferred',
      anonymous: i % 2 === 0,
      simulated: true,
    }),
  ),
  ...Array.from({ length: 60 }, (_, i) =>
    demoContributionSchema.parse({
      ...base(`sample-support-${i + 1}`),
      createdAt: samplePast((i % 6) + 1, 11),
      campaignId: `campaign-${(((i % 20) + Math.floor(i / 20) * 7) % 25) + 1}`,
      contributorId: `user-${(i % 20) + 1}`,
      amountMinor: [5000, 10000, 15000, 25000][i % 4],
      currency: 'PHP',
      message:
        'Illustrative contribution for supplies and care. No money was transferred.',
      anonymous: i % 7 === 0,
      simulated: true,
    }),
  ),
]
const originalParticipations = ids('participation', 10).map((id, i) =>
  missionParticipationSchema.parse({
    ...base(id),
    createdAt: samplePast(8, 8),
    reviewedAt: samplePast(6, 14),
    missionId: `mission-${i + 1}`,
    volunteerId: `user-${i + 6}`,
    state: 'approved',
    evidence: {
      text: 'Sample evidence: prepared the care kit and recorded the handover in this fictional mission.',
      mediaIds: [],
      expectedVersion: 1,
    },
    reviewerId: `user-${(i % 5) + 1}`,
    reviewReason:
      'Illustrative independent organizer review; no real work is claimed.',
    version: 2,
  }),
)
export const participations = [...originalParticipations]
for (let member = 1; member <= 20; member++) {
  const wanted =
    member === 6
      ? 20
      : member === 10
        ? 16
        : member === 11
          ? 14
          : 4 + ((member * 3) % 8)
  const existing = originalParticipations.filter(
    (p) => p.volunteerId === `user-${member}`,
  )
  const available = Array.from(
    { length: 30 },
    (_, i) => ((i + member * 3) % 30) + 1,
  ).filter(
    (n) =>
      n <= 25 &&
      ((n - 1) % 5) + 1 !== member &&
      !existing.some((p) => p.missionId === `mission-${n}`),
  )
  const approvedCount = Math.max(0, wanted - existing.length)
  available.slice(0, approvedCount + 2).forEach((mission, index) => {
    const state =
      index < approvedCount
        ? 'approved'
        : index === approvedCount
          ? 'submitted'
          : 'accepted'
    participations.push(
      missionParticipationSchema.parse({
        ...base(`sample-participation-${member}-${mission}`),
        createdAt: samplePast(7 + (index % 5), 8),
        reviewedAt:
          state === 'approved' ? samplePast(1 + (index % 5), 14) : null,
        missionId: `mission-${mission}`,
        volunteerId: `user-${member}`,
        state,
        evidence:
          state === 'accepted'
            ? null
            : {
                text: 'Fictional sample evidence: the care checklist was completed, supplies counted and the handover documented. No real-world activity is claimed.',
                mediaIds: [],
                expectedVersion: 1,
              },
        reviewerId:
          state === 'approved' ? `user-${((mission - 1) % 5) + 1}` : null,
        reviewReason:
          state === 'approved'
            ? 'Sample independent evidence review by the responsible organizer.'
            : null,
        version: state === 'approved' ? 3 : state === 'submitted' ? 2 : 1,
      }),
    )
  })
}
export const namingAwards = ids('user', 20).flatMap((userId, i) =>
  i >= 5 && i < 15
    ? []
    : [
        {
          ...base(`sample-naming-${i + 1}`),
          createdAt: samplePast(20),
          userId,
          animalId: `animal-${i + 1}`,
        },
      ],
)
export const kibbleEntries = [
  ...ids('kibble-entry', 20).map((id, i) =>
    kibbleEntrySchema.parse({
      ...base(id),
      createdAt: samplePast(i >= 5 && i < 15 ? 6 : 20, 14),
      userId: `user-${i + 1}`,
      amount: i >= 5 && i < 15 ? 50 : 10,
      reason: i >= 5 && i < 15 ? 'mission_approved' : 'sample_naming',
      contributionId:
        i >= 5 && i < 15 ? `participation-${i - 4}` : `sample-naming-${i + 1}`,
      description: 'Illustrative earned Kibble; non-cash sample ledger entry',
    }),
  ),
  ...participations
    .filter(
      (p) => p.id.startsWith('sample-participation-') && p.state === 'approved',
    )
    .map((p) =>
      kibbleEntrySchema.parse({
        ...base(`sample-kibble-${p.id}`),
        createdAt: p.reviewedAt,
        userId: p.volunteerId,
        amount: 50,
        reason: 'mission_approved',
        contributionId: p.id,
        description:
          'Sample independently approved mission reward — non-cash Kibble.',
      }),
    ),
]
export const rsvps = [
  ...ids('rsvp', 5).map((id, i) => ({
    ...base(id),
    eventId: `event-${i + 1}`,
    userId: `user-${i + 1}`,
  })),
  ...Array.from({ length: 35 }, (_, i) => ({
    ...base(`sample-rsvp-${i + 1}`),
    eventId: `event-${(i % 5) + 1}`,
    userId: `user-${(i % 5) + 6 + (Math.floor(i / 5) % 3) * 5}`,
  })),
].filter(
  (r, index, rows) =>
    rows.findIndex(
      (other) => other.eventId === r.eventId && other.userId === r.userId,
    ) === index,
)
