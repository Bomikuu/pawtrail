import { afterEach, expect, it, vi } from 'vitest'
import { requestPosition } from '@/features/neighborhood/game/discovery/geolocation'

afterEach(() => vi.useRealTimers())

it('offers manual selection when the permission prompt never answers and ignores late results', () => {
  vi.useFakeTimers()
  let success!: PositionCallback
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>(
    (callback) => {
      success = callback
    },
  )
  const onSuccess = vi.fn(),
    onUnavailable = vi.fn()
  requestPosition({ getCurrentPosition }, onSuccess, onUnavailable)
  vi.advanceTimersByTime(10_000)
  expect(onUnavailable).toHaveBeenCalledTimes(1)
  success({} as GeolocationPosition)
  expect(onSuccess).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})

it('handles denial immediately and cancels its fallback timer', () => {
  vi.useFakeTimers()
  const onUnavailable = vi.fn()
  const getCurrentPosition = vi.fn<Geolocation['getCurrentPosition']>(
    (_, failure) => {
      failure?.({} as GeolocationPositionError)
    },
  )
  requestPosition({ getCurrentPosition }, vi.fn(), onUnavailable)
  vi.advanceTimersByTime(20_000)
  expect(onUnavailable).toHaveBeenCalledTimes(1)
  expect(vi.getTimerCount()).toBe(0)
})
