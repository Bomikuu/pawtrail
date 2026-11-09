import { describe, expect, it, vi } from 'vitest'
import { seed } from '@/data/fixtures'
import { toPublicAnimal, toPublicUser } from '@/lib/server/projections'

vi.mock('server-only', () => ({}))

describe('public allowlists', () => {
  it('never spreads private or unknown fields into public animal records', () => {
    const privateAnimal = {
      ...seed.animals[0],
      exactLatitude: 7.012345,
      exactLongitude: 125.123456,
      applicantAnswers: { email: 'private@example.invalid' },
      unknownFutureSecret: 'secret',
      location: { ...seed.animals[0].location, exactLatitude: 7.01 },
    }
    const output = toPublicAnimal(privateAnimal)
    expect(output).not.toHaveProperty('exactLatitude')
    expect(output).not.toHaveProperty('exactLongitude')
    expect(output).not.toHaveProperty('applicantAnswers')
    expect(output).not.toHaveProperty('unknownFutureSecret')
    expect(output.location).not.toHaveProperty('exactLatitude')
  })
  it('rejects invalid public geometry and enforces profile privacy', () => {
    expect(() =>
      toPublicAnimal({
        ...seed.animals[0],
        location: { ...seed.animals[0].location, approximateRadiusMeters: 10 },
      }),
    ).toThrow()
    const hidden = {
      ...seed.users[0],
      settings: { ...seed.users[0].settings, discoverable: false },
    }
    expect(() => toPublicUser(hidden)).toThrow()
    expect(toPublicUser(seed.users[0])).not.toHaveProperty('email')
    expect(toPublicUser(seed.users[0])).not.toHaveProperty('settings')
  })
})

it('redacts contribution identity and voluntary profile fields', async () => {
  const { toPublicSupporter } = await import('@/lib/server/projections')
  const user = {
    ...seed.users[0],
    settings: {
      discoverable: true,
      showLocation: false,
      showContributions: false,
      publicAttendance: false,
    },
  }
  expect(toPublicUser(user)).toMatchObject({
    location: null,
    contributionCount: null,
  })
  const supporter = toPublicSupporter(
    { ...seed.contributions[0], anonymous: false },
    user,
  )
  expect(supporter.userId).toBeNull()
  expect(supporter.displayName).toBe('Anonymous helper')
  expect(supporter).not.toHaveProperty('contributorId')
  expect(() =>
    toPublicAnimal({ ...seed.animals[0], moderation: 'pending' }),
  ).toThrow()
})
