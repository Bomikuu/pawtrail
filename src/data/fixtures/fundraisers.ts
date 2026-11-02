import 'server-only'
import { samplePhotos } from './photos'
import { campaignDetailSchema } from '@/features/fundraising/schemas'
import { contributions } from './activity'
import { base, ids, location, verification } from './shared'
export const fundraisers = ids('campaign', 10).map((id, i) =>
  campaignDetailSchema.parse({
    ...base(id),
    slug: `sample-care-${i + 1}`,
    title: `Sample animal care fund ${i + 1}`,
    category: 'food',
    urgency: i === 0 ? 'high' : 'normal',
    state: 'active',
    currency: 'PHP',
    goalMinor: 100000,
    raisedMinor: contributions
      .filter((entry) => entry.campaignId === id)
      .reduce((sum, entry) => sum + entry.amountMinor, 0),
    organizerId: `user-${(i % 5) + 1}`,
    shelterId: `shelter-${(i % 5) + 1}`,
    animalId: `animal-${i + 1}`,
    location,
    photo: samplePhotos[i] ?? null,
    verification,
    story:
      'Illustrative fundraising story. Contributions are simulated; no money is transferred.',
    gallery: [],
    updates: [
      {
        ...base(`campaign-update-${i + 1}`),
        campaignId: id,
        authorId: `user-${(i % 5) + 1}`,
        text: 'Sample food delivery update',
        media: [],
      },
    ],
    expenses: [],
    balanceMinor: contributions
      .filter((entry) => entry.campaignId === id)
      .reduce((sum, entry) => sum + entry.amountMinor, 0),
    supporterCount: contributions.filter((entry) => entry.campaignId === id)
      .length,
    payoutStatus: 'demo_no_payout',
    version: 1,
  }),
)
