import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import {
  context,
  stamp,
  found,
  fail,
  version,
  manage,
  page,
  filterScope,
} from '@/lib/server/workflow-context'
import { currentUser } from '@/features/users/service'
import { publicSnapshot } from '@/features/moderation/service'
import { notify } from '@/features/notifications/service'
import { toPublicUser } from '@/lib/server/projections'
import { can } from '@/lib/server/permissions'
import { demoClock } from '@/lib/api/clock'
import * as s from './schemas'

export function installEvents(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  const detail = (d: DemoDraft, id: string) => {
    const row = found(d.data.events.find((e) => e.id === id || e.slug === id))
    const visible = publicSnapshot(d)
    const rsvps = d.data.rsvps.filter((r) => r.eventId === row.id)
    const attendeeIds = new Set(rsvps.map((r) => r.userId))
    const attendees = visible.users
      .filter((u) => attendeeIds.has(u.id) && u.settings.showContributions)
      .map((u) => s.eventAttendeeSchema.parse(toPublicUser(u)))
      .sort(
        (a, b) =>
          a.displayName.localeCompare(b.displayName) ||
          a.id.localeCompare(b.id),
      )
    const shelter = visible.shelters.find((s) => s.id === row.shelterId)
    const organizer = visible.users.find(
      (u) => u.id === row.organizerId && u.settings.showContributions,
    )
    const viewer = d.data.users.find((u) => u.id === d.auth.actorId)
    return s.eventDetailSchema.parse({
      ...row,
      attendanceCount: rsvps.length,
      viewerAttending: attendeeIds.has(d.auth.actorId ?? ''),
      viewerCanManage:
        !!viewer &&
        can(viewer, 'manage_resource', {
          ownerId: row.organizerId,
          shelterId: row.shelterId,
        }),
      rsvpOpen:
        row.state === 'scheduled' &&
        Date.parse(row.endsAt) > demoClock.now().getTime(),
      attendees: attendees.slice(0, 24),
      publicAttendeeCount: attendees.length,
      host: shelter
        ? {
            kind: 'shelter',
            id: shelter.id,
            name: shelter.name,
            href: `/shelters/${encodeURIComponent(shelter.slug)}`,
            avatar: null,
          }
        : organizer
          ? {
              kind: 'user',
              id: organizer.id,
              name: organizer.displayName,
              href: `/users/${encodeURIComponent(organizer.username)}`,
              avatar: toPublicUser(organizer).avatar,
            }
          : null,
    })
  }
  api.events.list = (input) => {
    const q = s.eventFiltersSchema.parse(input)
    return read((d) => {
      const u = q.scope === 'mine' ? currentUser(d) : null
      const visible = publicSnapshot(d)
      return page(
        visible.events
          .filter(
            (e) =>
              (!u ||
                e.organizerId === u.id ||
                d.data.rsvps.some(
                  (r) => r.userId === u.id && r.eventId === e.id,
                )) &&
              (!q.shelterId || e.shelterId === q.shelterId) &&
              (!q.state || e.state === q.state) &&
              (!q.from || Date.parse(e.startsAt) >= Date.parse(q.from)) &&
              (!q.to || Date.parse(e.startsAt) <= Date.parse(q.to)),
          )
          .map((e) => {
            const attendeeIds = new Set(
              d.data.rsvps
                .filter((r) => r.eventId === e.id)
                .map((r) => r.userId),
            )
            const attendees = visible.users
              .filter(
                (u) => attendeeIds.has(u.id) && u.settings.showContributions,
              )
              .map((u) => s.eventAttendeeSchema.parse(toPublicUser(u)))
            return s.eventSummarySchema.parse({
              ...e,
              attendees: attendees.slice(0, 4),
              publicAttendeeCount: attendees.length,
              attendanceCount: d.data.rsvps.filter((r) => r.eventId === e.id)
                .length,
            })
          }),
        q,
        `events:${u?.id ?? 'public'}:${filterScope(q)}`,
      )
    })
  }
  api.events.get = (slug) =>
    read((d) => {
      found(
        publicSnapshot(d).events.find((e) => e.id === slug || e.slug === slug),
      )
      return detail(d, slug)
    })
  api.events.create = (input, options) => {
    const p = s.eventInputSchema.parse(input)
    return write('events.create', p, options, (d, u, now) => {
      if (!u.roles.includes('shelter_staff') && !u.roles.includes('moderator'))
        fail('Only organization staff or moderators can organize events.', 403)
      if (p.shelterId) manage(u, '', p.shelterId)
      if (
        Date.parse(p.endsAt) <= Date.parse(p.startsAt) ||
        Date.parse(p.startsAt) <= Date.parse(now)
      )
        fail('Choose a future start and a later end time.')
      const base = stamp(now)
      d.data.events.push(
        s.eventDetailSchema.parse({
          ...base,
          ...p,
          organizerId: u.id,
          slug: `event-${base.id.slice(0, 8)}`,
          attendanceCount: 0,
          version: 1,
        }),
      )
      return detail(d, base.id)
    })
  }
  api.events.update = (id, input, options) => {
    const p = s.eventInputSchema.parse(input)
    return write('events.update', { id, ...p }, options, async (d, u, now) => {
      const row = found(d.data.events.find((e) => e.id === id))
      manage(u, row.organizerId, row.shelterId)
      version(row, p.expectedVersion)
      if (p.shelterId !== row.shelterId)
        fail('The organizing shelter cannot be changed.')
      if (Date.parse(p.endsAt) <= Date.parse(p.startsAt))
        fail('The event must end after it starts.')
      if (p.capacity < d.data.rsvps.filter((r) => r.eventId === id).length)
        fail('Capacity cannot fall below current RSVPs.', 409)
      Object.assign(row, p, { version: row.version + 1 })
      for (const recipientId of new Set(
        d.data.rsvps.filter((r) => r.eventId === id).map((r) => r.userId),
      ))
        await notify({
          draft: d,
          recipientId,
          kind: 'event',
          ref: { kind: 'event', id },
          now,
        })
      return detail(d, id)
    })
  }
  api.events.setRsvp = (id, attending, options) =>
    write('events.rsvp', { id, attending }, options, (d, u, now) => {
      const e = found(publicSnapshot(d).events.find((e) => e.id === id))
      const exists = d.data.rsvps.some(
        (r) => r.eventId === id && r.userId === u.id,
      )
      if (attending && !exists) {
        if (e.state !== 'scheduled' || Date.parse(e.endsAt) <= Date.parse(now))
          fail('This event is no longer accepting RSVPs.', 409)
        if (d.data.rsvps.filter((r) => r.eventId === id).length >= e.capacity)
          fail('This event is full.', 409)
        d.data.rsvps.push({ ...stamp(now), eventId: id, userId: u.id })
      }
      if (!attending)
        d.data.rsvps = d.data.rsvps.filter(
          (r) => r.eventId !== id || r.userId !== u.id,
        )
      return detail(d, id)
    })
}
