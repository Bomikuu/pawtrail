import type { Progress } from '../types'
export type DayPhase = 'morning' | 'afternoon' | 'evening' | 'night'
export function dayPhase(minute: number): DayPhase {
  return minute >= 360 && minute < 720
    ? 'morning'
    : minute >= 720 && minute < 1020
      ? 'afternoon'
      : minute >= 1020 && minute < 1200
        ? 'evening'
        : 'night'
}
export function advanceTime(p: Progress, minutes: number): Progress {
  const total = p.minute + Math.max(0, Math.floor(minutes))
  return { ...p, minute: total % 1440, day: p.day + Math.floor(total / 1440) }
}
export function clockLabel(minute: number) {
  const h = Math.floor(minute / 60)
  return `${h % 12 || 12}:${String(minute % 60).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
export function lighting(minute: number) {
  const keys = [
    [0, 0x28375c, 0.4],
    [330, 0x28375c, 0.24],
    [450, 0xf4c877, 0.06],
    [660, 0xf4c877, 0],
    [960, 0xe8a25f, 0.04],
    [1050, 0xe89558, 0.15],
    [1170, 0x28375c, 0.3],
    [1260, 0x28375c, 0.4],
    [1440, 0x28375c, 0.4],
  ]
  const end = keys.findIndex((k) => k[0] >= minute),
    b = keys[Math.max(1, end)],
    a = keys[Math.max(0, end - 1)],
    t = Math.max(0, Math.min(1, (minute - a[0]) / (b[0] - a[0])))
  const channel = (shift: number) =>
    Math.round(((a[1] >> shift) & 255) * (1 - t) + ((b[1] >> shift) & 255) * t)
  return {
    color: (channel(16) << 16) | (channel(8) << 8) | channel(0),
    alpha: a[2] + (b[2] - a[2]) * t,
  }
}
