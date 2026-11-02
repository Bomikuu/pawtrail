export const DEMO_NOW = '2026-11-02T00:00:00+08:00'
export const LOCALE = 'en-PH'
export const TIME_ZONE = 'Asia/Manila'
export interface Clock {
  now(): Date
}
export const demoClock: Clock = { now: () => new Date(DEMO_NOW) }
export const systemClock: Clock = { now: () => new Date() }
