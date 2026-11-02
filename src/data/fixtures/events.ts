import 'server-only'
import { eventDetailSchema } from '@/features/events/schemas'
import { rsvps } from './activity'
import { base, ids } from './shared'
export const events = ids('event', 5).map((id, i) =>
  eventDetailSchema.parse({
    ...base(id),
    slug: `sample-gathering-${i + 1}`,
    title: `Sample care gathering ${i + 1}`,
    description: 'Illustrative community event. No real event is scheduled.',
    startsAt: `2026-11-${10 + i}T09:00:00+08:00`,
    endsAt: `2026-11-${10 + i}T12:00:00+08:00`,
    venue: {
      name: 'Sample public gathering venue',
      address: 'Illustrative venue in Davao City',
      latitude: 7.073,
      longitude: 125.612,
      intentionallyPublic: true,
    },
    capacity: 30,
    attendanceCount: rsvps.filter((entry) => entry.eventId === id).length,
    shelterId: `shelter-${i + 1}`,
    state: 'scheduled',
    organizerId: `user-${i + 1}`,
    version: 1,
  }),
)
