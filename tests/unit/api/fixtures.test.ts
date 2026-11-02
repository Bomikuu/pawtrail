import { describe, expect, it, vi } from 'vitest'
import { seed, validateSeed } from '@/data/fixtures'
import { demoClock, DEMO_NOW } from '@/lib/api/clock'

vi.mock('server-only', () => ({}))

describe('sample fixtures', () => {
  it('preserves exact sample counts and deterministic reference time', () => {
    expect([
      seed.animals.length,
      seed.hordes.length,
      seed.animals.filter((x) => x.adoptable).length,
      seed.fundraisers.length,
      seed.missions.length,
      seed.posts.length,
      seed.shelters.length,
      seed.events.length,
      seed.users.length,
    ]).toEqual([20, 5, 15, 10, 10, 10, 5, 5, 20])
    expect(demoClock.now().toISOString()).toBe(new Date(DEMO_NOW).toISOString())
  })
  it('resolves every declared relationship and labels sample provenance', () => {
    expect(() => validateSeed(seed)).not.toThrow()
    expect(seed.animals.every((x) => x.provenance.kind === 'sample')).toBe(true)
    expect(
      seed.animals.every((x) => x.location.approximateRadiusMeters >= 500),
    ).toBe(true)
    expect(
      seed.fundraisers.every(
        (x) => x.currency === 'PHP' && Number.isSafeInteger(x.goalMinor),
      ),
    ).toBe(true)
    expect(seed.sightings.length).toBeGreaterThan(0)
    expect(seed.kibbleEntries.length).toBeGreaterThan(0)
    expect(() =>
      validateSeed({
        ...seed,
        animals: [
          { ...seed.animals[0], shelterId: 'missing' },
          ...seed.animals.slice(1),
        ],
      }),
    ).toThrow()
  })
})

it('keeps sample totals consistent with activity and immutable reward sources', () => {
  for (const campaign of seed.fundraisers) {
    const donations = seed.contributions.filter(
      (row) => row.campaignId === campaign.id,
    )
    const received = donations.reduce(
      (total, row) => total + row.amountMinor,
      0,
    )
    expect(campaign.raisedMinor).toBe(received)
    expect(campaign.balanceMinor).toBe(
      received -
        campaign.expenses.reduce((total, row) => total + row.amountMinor, 0),
    )
    expect(campaign.supporterCount).toBe(donations.length)
  }
  expect(
    new Set(seed.kibbleEntries.map((row) => row.contributionId)).size,
  ).toBe(seed.kibbleEntries.length)
  for (const entry of seed.kibbleEntries.filter(
    (row) => row.reason === 'mission_approved',
  )) {
    const participation = seed.participations.find(
      (row) => row.id === entry.contributionId,
    )!
    expect(participation.state).toBe('approved')
    expect(participation.volunteerId).toBe(entry.userId)
    expect(
      seed.missions.find((row) => row.id === participation.missionId)
        ?.rewardKibble,
    ).toBe(entry.amount)
  }
  for (const event of seed.events)
    expect(event.attendanceCount).toBe(
      seed.rsvps.filter((row) => row.eventId === event.id).length,
    )
})
