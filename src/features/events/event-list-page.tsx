import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ParticipantFaces } from '@/components/shared/social-card'
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
    <div className={'events-directory w-full min-w-0 text-foreground'}>
      <header
        className={
          'events-directory-heading flex items-center justify-between gap-6 mb-6 [.app-content_&_h1]:[font:900_clamp(1.75rem,_2.5vw,_2.375rem)/1.2_var(--font-heading)] [.app-content_&_h1]:[margin:0_0_0.625rem] [.app-content_&_h1]:[letter-spacing:-0.02em] [&_p]:m-0 [&_p]:text-muted-foreground [&_p]:max-w-[65ch] [&_>_[data-slot=button]]:shrink-0 max-[64rem]:items-start max-[64rem]:flex-col max-[64rem]:gap-4'
        }
      >
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
      <div
        className={
          'events-directory-banner grid grid-cols-[1fr_1.15fr] overflow-hidden rounded-2xl bg-[#fff3df] mb-7 [&_>_img]:[grid-column:2] [&_>_img]:[grid-row:1] [&_>_img]:min-h-44 [&_>_img]:max-h-52 [&_>_div]:[grid-column:1] [&_>_div]:[grid-row:1] [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:justify-center [&_>_div]:items-start [&_>_div]:gap-2 [&_>_div]:[padding:1.5rem_2rem] [&_svg]:text-[#b95308] [&_strong]:[font:900_clamp(1.25rem,_2vw,_1.75rem)/1.2_var(--font-heading)] [&_span]:text-sm [&_span]:text-[#765338] max-[40rem]:grid-cols-1 max-[40rem]:[&_>_img]:[grid-column:1] max-[40rem]:[&_>_img]:[grid-row:1] max-[40rem]:[&_>_img]:min-h-0 max-[40rem]:[&_>_img]:max-h-none max-[40rem]:[&_>_img]:h-auto max-[40rem]:[&_>_img]:[aspect-ratio:752_/_218] max-[40rem]:[&_>_div]:[grid-row:2] max-[40rem]:[&_>_div]:p-5 max-[40rem]:[&_svg]:hidden'
        }
      >
        <ProfileBanner id="coast" />
        <div>
          <PawPrint size={26} aria-hidden="true" />
          <strong>A little time. A lasting difference.</strong>
          <span>Community care starts with showing up.</span>
        </div>
      </div>
      <div
        className={
          'events-directory-toolbar mb-4 [&_>_p]:[margin:1rem_0_0] [&_>_p]:text-muted-foreground [&_>_p]:text-[0.8125rem]'
        }
      >
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
        <ul
          className={
            'events-card-grid grid grid-cols-3 list-none m-0 p-0 gap-5 [&_>_li]:min-w-0 max-[85rem]:grid-cols-2 max-[40rem]:grid-cols-1'
          }
        >
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
                <article
                  className={
                    'event-discovery-card [border:1px_solid_var(--border)] rounded-2xl overflow-hidden bg-card h-full flex flex-col'
                  }
                >
                  <div
                    className={
                      'event-card-cover h-36 relative overflow-hidden bg-[#e3f1d1] max-[40rem]:h-auto max-[40rem]:[aspect-ratio:752_/_218]'
                    }
                  >
                    <ProfileBanner id={eventCoverId(event.id)} preview />
                    <span
                      className={
                        'event-date-tile absolute left-4 top-4 flex flex-col items-center justify-center w-13 min-h-14 rounded-xl bg-[#fffcf7] text-foreground tabular-nums [&_>_span]:text-[0.6875rem] [&_>_span]:uppercase [&_>_span]:font-bold [&_>_span]:text-[#9a4211] [&_>_strong]:font-[900] [&_>_strong]:text-2xl [&_>_strong]:leading-[1.2] [&_>_strong]:font-heading'
                      }
                    >
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
                  <div
                    className={
                      'event-card-body p-4.5 flex flex-col items-start [flex:1] [&_h2]:font-[850] [&_h2]:text-xl [&_h2]:leading-[1.25] [&_h2]:font-heading [&_h2]:[margin:0.75rem_0] [&_h2]:w-full [&_h2_a]:flex [&_h2_a]:items-center [&_h2_a]:justify-between [&_h2_a]:gap-3 [&_h2_a]:text-foreground [&_h2_a]:min-h-11 [&_h2_a]:[overflow-wrap:anywhere] [&_h2_svg]:text-[color:var(--teal)] [&_h2_svg]:shrink-0 [&_h2_a:hover]:text-[color:var(--teal)] [&_>_p]:flex [&_>_p]:items-start [&_>_p]:gap-2 [&_>_p]:[margin:0.375rem_0] [&_>_p]:text-[0.8125rem] [&_>_p]:text-muted-foreground [&_>_p_svg]:shrink-0 [&_>_p_svg]:mt-0.5 [&_>_p_svg]:text-[#9a4211]'
                    }
                  >
                    <ParticipantFaces
                      people={event.attendees}
                      count={event.publicAttendeeCount}
                      href={`/events/${encodeURIComponent(event.slug)}?section=attendees#event-content`}
                      label="Public attendees"
                    />
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
                    <div
                      className={
                        'event-card-footer flex justify-between items-center flex-wrap w-full gap-2 mt-auto pt-5 text-xs tabular-nums [&_>_span:first-child]:flex [&_>_span:first-child]:items-center [&_>_span:first-child]:gap-1.5 [&_>_span:first-child]:[font-weight:650] [&_>_span:last-child]:text-[color:var(--teal)]'
                      }
                    >
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
