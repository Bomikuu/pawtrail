import { afterEach, expect, it, vi } from 'vitest'
import { walkingRoute } from '@/features/neighborhood/game/discovery/directions'
import type { Point } from '@/features/neighborhood/game/discovery/types'

const origin: Point = [125.59177437792232, 7.052780880144439]
const destination: Point = [125.5894, 7.0541]
function response(overrides: Record<string, unknown> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        coordinates: [
          [125.591783, 7.052813],
          [125.589483, 7.05412],
        ],
        origin,
        destination,
        distanceMeters: 408,
        durationSeconds: 339.284,
        profile: 'walking',
        steps: [],
        ...overrides,
      }),
    }),
  )
}
afterEach(() => vi.unstubAllGlobals())

it('keeps small road-access gaps separate from the mapped distance and time', async () => {
  response()
  const route = await walkingRoute(
    origin,
    destination,
    new AbortController().signal,
  )
  expect(route.distanceMeters).toBe(408)
  expect(route.durationSeconds).toBe(339.284)
  expect(route.accessDistanceMeters.origin).toBeCloseTo(3.7, 1)
  expect(route.accessDistanceMeters.destination).toBeCloseTo(9.43, 1)
})

it('rejects a response for a different destination', async () => {
  response({ destination: [125.6228, 7.105] })
  await expect(
    walkingRoute(origin, destination, new AbortController().signal),
  ).rejects.toThrow('incomplete')
})

it('rejects a path that stops too far from the animal despite matching request metadata', async () => {
  response({ coordinates: [origin, [125.6, 7.06]] })
  await expect(
    walkingRoute(origin, destination, new AbortController().signal),
  ).rejects.toThrow('too far')
})

it('does not accept another travel mode as a walking route', async () => {
  response({ profile: 'driving' })
  await expect(
    walkingRoute(origin, destination, new AbortController().signal),
  ).rejects.toThrow('incomplete')
})
