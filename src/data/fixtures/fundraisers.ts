import 'server-only'
import { campaignDetailSchema } from '@/features/fundraising/schemas'
import { contributions } from './activity'
import { base, ids, verification } from './shared'
import {
  animalNames,
  sampleAnimalPhoto,
  sampleLocation,
  samplePast,
} from './scenarios'
const needs = [
  'Food & feeding kits',
  'Veterinary care support',
  'Safe transport supplies',
  'Shelter bedding & bowls',
  'Neighborhood water stations',
]
const categories = [
  'food',
  'medical',
  'rescue',
  'shelter',
  'community',
] as const
export const fundraisers = ids('campaign', 25).map((id, i) => {
  const support = contributions.filter((entry) => entry.campaignId === id)
  const raised = support.reduce((sum, entry) => sum + entry.amountMinor, 0)
  const goal = i === 18 ? Math.max(raised, 100) : 120000 + (i % 4) * 50000
  const spent = Math.min(raised, 5000 + (i % 3) * 2500)
  return campaignDetailSchema.parse({
    ...base(id),
    createdAt: samplePast(10 + (i % 7)),
    slug: `sample-care-${i + 1}`,
    title: `Sample: ${needs[i % 5]} for ${animalNames[i % 20]}`,
    category: categories[i % 5],
    urgency: i % 6 === 0 ? 'high' : 'normal',
    state: i === 18 ? 'completed' : i === 19 ? 'closed' : 'active',
    currency: 'PHP',
    goalMinor: goal,
    raisedMinor: raised,
    organizerId: `user-${i < 10 ? (i % 5) + 1 : i - 4}`,
    shelterId: `shelter-${(i % 5) + 1}`,
    animalId: `animal-${(i % 20) + 1}`,
    hordeId: `horde-${(i % 5) + 1}`,
    location: sampleLocation(i),
    photo: sampleAnimalPhoto(i),
    verification,
    story: `This fictional campaign illustrates ${needs[i % 5]!.toLowerCase()} for ${animalNames[i % 20]} and their neighborhood care circle. The budget, updates and expense ledger show how transparent support works. Every contribution is simulated; no money is transferred and no medical outcome is asserted.`,
    budget: [
      {
        description: 'Sample care supplies',
        amountMinor: Math.floor(goal * 0.7),
      },
      {
        description: 'Sample transport and coordination supplies',
        amountMinor: goal - Math.floor(goal * 0.7),
      },
    ],
    timeline:
      'Illustrative November care plan: gather supplies, coordinate with helpers and publish an itemized update.',
    gallery: [],
    updates: [0, 1].map((round) => ({
      ...base(`campaign-update-${i + 1}-${round + 1}`),
      createdAt: samplePast(round + 1, 15),
      campaignId: id,
      authorId: `user-${i < 10 ? (i % 5) + 1 : i - 4}`,
      text: round
        ? 'Sample progress update: the care circle has checked the supply list and next handover.'
        : 'Sample transparency update: this ledger records simulated supply costs only. No real purchase or payment occurred.',
      media: [],
    })),
    expenses: spent
      ? [
          {
            ...base(`sample-expense-${i + 1}`),
            createdAt: samplePast(1, 16),
            campaignId: id,
            amountMinor: spent,
            description:
              'Illustrative care-supply expense; no real purchase or receipt.',
            correctsEntryId: null,
            authorId: `user-${i < 10 ? (i % 5) + 1 : i - 4}`,
          },
        ]
      : [],
    balanceMinor: raised - spent,
    supporterCount: new Set(support.map((s) => s.contributorId)).size,
    payoutStatus: 'demo_no_payout',
    version: 1,
  })
})
