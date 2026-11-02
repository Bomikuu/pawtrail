import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  PawPrint,
  Plus,
  Users,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
import { StatusBadge } from '@/components/shared/status-badge'
import { ProfileBanner } from '@/features/users/profile-banner'
import { Empty, FilterForm, NextPage } from '@/features/workflows/catalog'
import { queryValue, type SearchParams } from '@/features/workflows/server'
import { getServerApi } from '@/lib/api/server'
import { demoClock, systemClock, LOCALE, TIME_ZONE } from '@/lib/api/clock'
import { eventCoverId, eventDate, eventTime } from './presentation'

export async function EventListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const q = queryValue(params.q)
  const state =
    params.state === 'scheduled' || params.state === 'cancelled'
      ? params.state
      : undefined
  const api = await getServerApi()
  const [rows, session] = await Promise.all([
    api.events.list({ q, state, cursor: queryValue(params.cursor) }),
    api.auth.session(),
  ])
  const now = (session.demo ? demoClock : systemClock).now().getTime()
  const canOrganize = session.roles.some(
    (role) => role === 'shelter_staff' || role === 'moderator',
  )
  return (
    <div className="events-directory">
      <header className="events-directory-heading">
        <div>
          <h1>Good things happen together.</h1>
          <p>
            Meet your neighbors. Make time for animals. Find your next community
            gathering.
          </p>
        </div>
        {canOrganize && (
          <ButtonLink href="/dashboard/events/create">
            <Plus size={18} aria-hidden="true" /> Organize an event
          </ButtonLink>
        )}
      </header>
      <div className="events-directory-banner">
        <ProfileBanner id="coast" />
        <div>
          <PawPrint size={26} aria-hidden="true" />
          <strong>A little time. A lasting difference.</strong>
          <span>Community care starts with showing up.</span>
        </div>
      </div>
      <div className="events-directory-toolbar">
        <FilterForm
          q={q}
          fields={[
            {
              name: 'state',
              label: 'Event status',
              type: 'select',
              value: state ?? '',
              options: [
                { value: '', label: 'All events' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'cancelled', label: 'Cancelled' },
              ],
            },
          ]}
        />
        <p>
          {rows.count} {rows.count === 1 ? 'gathering' : 'gatherings'}
          {q ? ` matching “${q}”` : ' to discover'}
        </p>
      </div>
      {rows.items.length ? (
        <ul className="events-card-grid">
          {rows.items.map((event) => {
            const ended = Date.parse(event.endsAt) <= now
            const closed = event.state === 'cancelled' || ended
            const full = event.attendanceCount >= event.capacity
            const label =
              event.state === 'cancelled'
                ? 'Cancelled'
                : ended
                  ? 'Ended'
                  : full
                    ? 'Fully reserved'
                    : 'Community event'
            return (
              <li key={event.id}>
                <article className="event-discovery-card">
                  <div className="event-card-cover">
                    <ProfileBanner id={eventCoverId(event.id)} preview />
                    <span className="event-date-tile">
                      <span>
                        {new Intl.DateTimeFormat(LOCALE, {
                          month: 'short',
                          timeZone: TIME_ZONE,
                        }).format(new Date(event.startsAt))}
                      </span>
                      <strong>
                        {new Intl.DateTimeFormat(LOCALE, {
                          day: 'numeric',
                          timeZone: TIME_ZONE,
                        }).format(new Date(event.startsAt))}
                      </strong>
                    </span>
                  </div>
                  <div className="event-card-body">
                    <StatusBadge tone={closed ? 'neutral' : 'success'}>
                      {label}
                    </StatusBadge>
                    <h2>
                      <Link href={`/events/${encodeURIComponent(event.slug)}`}>
                        {event.title}
                        <ArrowRight size={20} aria-hidden="true" />
                      </Link>
                    </h2>
                    <p>
                      <CalendarDays size={17} aria-hidden="true" />
                      <time dateTime={event.startsAt}>
                        {eventDate(event.startsAt)} ·{' '}
                        {eventTime(event.startsAt)}
                      </time>
                    </p>
                    <p>
                      <MapPin size={17} aria-hidden="true" />
                      <span>{event.venue.name}</span>
                    </p>
                    <div className="event-card-footer">
                      <span>
                        <Users size={17} aria-hidden="true" />{' '}
                        {event.attendanceCount} attending
                      </span>
                      <span>
                        {closed
                          ? 'RSVPs closed'
                          : full
                            ? 'No places left'
                            : `${event.capacity - event.attendanceCount} places left`}
                      </span>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : (
        <Empty>
          No events match this search. Try another phrase or choose All events.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} params={{ q, state }} />
    </div>
  )
}
