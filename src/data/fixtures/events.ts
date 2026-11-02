import 'server-only'
import { eventDetailSchema } from '@/features/events/schemas'
import { rsvps } from './activity'
import { base, ids } from './shared'
import { sampleLocation } from './scenarios'
const gatheringNames = [
  'Neighborhood feeding-kit day',
  'Community cat care circle',
  'Meet the shelter volunteers',
  'Adoption introduction afternoon',
  'Kindness in the park',
]
export const events = ids('event', 5).map((id, i) =>
  eventDetailSchema.parse({
    ...base(id),
    slug: `sample-gathering-${i + 1}`,
    title: `Sample: ${gatheringNames[i]}`,
    description: `A fictional gathering for ${gatheringNames[i]!.toLowerCase()}. Meet the sample care circle, compare supply lists and learn the next steps for helping animals. No real event is scheduled; the venue and attendance are illustrative.`,
    startsAt: `2026-11-${10 + i}T09:00:00+08:00`,
    endsAt: `2026-11-${10 + i}T12:00:00+08:00`,
    venue: {
      name: 'Sample public gathering venue',
      address: `Illustrative venue in ${sampleLocation(i).neighborhood}`,
      latitude: sampleLocation(i).latitude,
      longitude: sampleLocation(i).longitude,
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
