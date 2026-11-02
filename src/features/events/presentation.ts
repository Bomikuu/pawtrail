import { LOCALE, TIME_ZONE } from '@/lib/api/clock'
import type { EventSummary } from './types'

/** A stable decorative default from the supplied collection, not an event photo. */
export function eventCoverId(id: string) {
  const covers = ['meadow', 'garden', 'explorer', 'home', 'coast'] as const
  const seed = Array.from(id).reduce(
    (sum, letter) => sum + letter.charCodeAt(0),
    0,
  )
  return covers[seed % covers.length]
}

export function eventDate(value: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'medium',
    timeZone: TIME_ZONE,
  }).format(new Date(value))
}

export function eventTime(value: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TIME_ZONE,
  }).format(new Date(value))
}

export function eventSchedule(
  event: Pick<EventSummary, 'startsAt' | 'endsAt'>,
) {
  const sameDay = eventDate(event.startsAt) === eventDate(event.endsAt)
  return `${eventDate(event.startsAt)}, ${eventTime(event.startsAt)} – ${sameDay ? '' : `${eventDate(event.endsAt)}, `}${eventTime(event.endsAt)}`
}

export function eventMapHref(event: EventSummary) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue.latitude},${event.venue.longitude}`)}`
}
