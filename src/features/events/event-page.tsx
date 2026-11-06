import { AnimatedNumber } from '@/components/shared/animated-number'
import { ProfileLink } from '@/features/users/profile-link'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarCheck,
  Clock3,
  Info,
  Map,
  MapPin,
  MessageCircle,
  PawPrint,
  Pencil,
  Users,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { Discussion } from '@/features/community/discussion'
import { ReportDialog } from '@/features/community/report-dialog'
import { FollowButton } from '@/features/users/follow-button'
import { ProfileBanner } from '@/features/users/profile-banner'
import { PublicJsonLd } from '@/lib/seo/public-json-ld'
import { getServerApi } from '@/lib/api/server'
import { TIME_ZONE } from '@/lib/api/clock'
import {
  publicRecord,
  queryValue,
  type SearchParams,
} from '@/features/workflows/server'
import { EventRsvp, EventShare } from './event-controls'
import { eventCoverId, eventMapHref, eventSchedule } from './presentation'
import type { EventDetail } from './types'

function AttendeePreview({
  event,
  path,
}: {
  event: EventDetail
  path: string
}) {
  return (
    <section
      className={
        'event-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] p-5.5 [border:1px_solid_var(--border)] rounded-2xl bg-card min-w-0 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:[margin:0_0_1rem] [&_h2]:font-[900] [&_h2]:text-[length:1.375rem] [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:w-6.5 [&_h2_>_svg]:h-6.5 [&_h2_>_svg]:shrink-0 [&_p]:[margin:0.75rem_0] [&_p]:text-sm max-[85rem]:p-4.5 max-[40rem]:[&_h2]:text-xl event-attendees-preview'
      }
      aria-labelledby="event-attendees-title"
    >
      <div
        className={
          'event-panel-heading flex items-center justify-between [gap:0.25rem_0.75rem] flex-wrap mb-3.5 [&_h2]:m-0 [&_>_span]:text-[0.8125rem] [&_>_span]:tabular-nums'
        }
      >
        <h2 id="event-attendees-title">
          <Users aria-hidden="true" /> Attendees
        </h2>
        <span>
          {event.attendanceCount} of {event.capacity}
        </span>
      </div>
      {event.attendees.length ? (
        <div
          className={
            'event-attendee-faces flex flex-wrap items-center gap-2 [&_a]:inline-flex [&_a]:rounded-full'
          }
        >
          {event.attendees.slice(0, 4).map((person) => (
            <ProfileLink
              key={person.id}
              username={person.username}
              aria-label={`View ${person.displayName}’s profile`}
              title={person.displayName}
            >
              <CommunityAvatar
                name={person.displayName}
                image={person.avatar}
                userId={person.id}
              />
            </ProfileLink>
          ))}
          {event.publicAttendeeCount > 4 && (
            <Link
              className={
                'event-more-attendees w-13 h-13 items-center justify-center bg-[#fff1de] [font-weight:750] text-foreground'
              }
              href={`${path}?section=attendees#event-content`}
              aria-label={`See ${event.publicAttendeeCount} public attendee profiles`}
            >
              +{event.publicAttendeeCount - 4}
            </Link>
          )}
        </div>
      ) : (
        <p>
          {event.attendanceCount
            ? 'Attendee profiles are not shared publicly.'
            : 'Be the first to make room for a good cause.'}
        </p>
      )}
      <Link
        className={
          'event-text-link inline-flex items-center gap-2 min-h-11 text-[color:var(--teal)] text-sm [font-weight:650] [text-underline-offset:0.2em] [.event-attendees-preview_&]:mt-1.5'
        }
        href={`${path}?section=attendees#event-content`}
      >
        Meet the community <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </section>
  )
}

function AttendeeList({ event }: { event: EventDetail }) {
  return (
    <>
      <h2>People coming together</h2>
      <p className={'event-section-note text-sm text-muted-foreground'}>
        {event.attendanceCount} attending. Only people who share their
        contributions publicly are listed.
      </p>
      {event.attendees.length ? (
        <ul
          className={
            'event-attendee-list [&_small]:block [&_small]:text-[0.8125rem] [&_small]:font-normal [&_small]:text-muted-foreground [&_small]:mt-1 grid grid-cols-2 p-0 [margin:1.25rem_0] list-none gap-3 [&_a]:flex [&_a]:items-center [&_a]:gap-3 [&_a]:p-4 [&_a]:[border:1px_solid_var(--border)] [&_a]:rounded-[0.875rem] [&_a]:bg-card [&_a]:text-foreground [&_a]:h-full [&_a]:[overflow-wrap:anywhere] [&_a_>_span:last-child]:min-w-0 max-[40rem]:grid-cols-1'
          }
        >
          {event.attendees.map((person) => (
            <li key={person.id}>
              <ProfileLink username={person.username}>
                <CommunityAvatar
                  name={person.displayName}
                  image={person.avatar}
                  userId={person.id}
                />
                <span>
                  <strong>{person.displayName}</strong>
                  <small>@{person.username}</small>
                </span>
              </ProfileLink>
            </li>
          ))}
        </ul>
      ) : (
        <div
          className={
            'event-quiet-state grid [justify-items:center] text-center [padding:2rem_1rem] mt-5 bg-[#fff9ef] rounded-2xl [&_>_svg]:text-[#b95308] [&_h3]:[margin:0.75rem_0_0] [&_p]:max-w-[40ch] [&_p]:text-sm'
          }
        >
          <Users size={32} aria-hidden="true" />
          <h3>
            {event.attendanceCount
              ? 'Respecting everyone’s privacy'
              : 'Good company starts with you'}
          </h3>
          <p>
            {event.attendanceCount
              ? 'No attendee profiles are shared publicly for this event.'
              : 'No one has reserved a place yet. Use Your RSVP to join.'}
          </p>
        </div>
      )}
      {event.publicAttendeeCount > event.attendees.length && (
        <p className={'event-section-note text-sm text-muted-foreground'}>
          Showing the first {event.attendees.length} of{' '}
          {event.publicAttendeeCount} public profiles.
        </p>
      )}
    </>
  )
}

export async function EventDetailPage({
  slug,
  searchParams,
}: {
  slug: string
  searchParams?: SearchParams
}) {
  const api = await getServerApi()
  const event = await publicRecord(() => api.events.get(slug))
  const session = await api.auth.session()
  const params: Awaited<SearchParams> = searchParams ? await searchParams : {}
  const selected = queryValue(params.section)
  const section =
    selected === 'about' || selected === 'attendees' ? selected : 'discussion'
  const path = `/events/${encodeURIComponent(event.slug)}`
  const tabs = [
    { id: 'discussion', title: 'Discussion', icon: MessageCircle },
    { id: 'about', title: 'About this event', icon: Info },
    { id: 'attendees', title: 'Attendees', icon: Users },
  ] as const
  return (
    <div className={'event-page w-full min-w-0 text-foreground'}>
      <PublicJsonLd
        name={event.title}
        description={event.description}
        path={path}
      />
      <Link
        className={
          'event-back inline-flex items-center gap-2 min-h-11 text-[color:var(--teal)] text-sm [font-weight:650] [text-underline-offset:0.2em] mb-2'
        }
        href="/events"
      >
        <ArrowLeft size={16} aria-hidden="true" /> All community events
      </Link>
      <div
        className={
          'event-detail-grid grid grid-cols-[minmax(0,_1.65fr)_minmax(19rem,_1fr)] items-start [gap:1.5rem_2rem] min-[110rem]:grid-cols-[minmax(0,_1fr)_minmax(22rem,_28rem)] max-[85rem]:gap-5 max-[64rem]:grid-cols-1'
        }
      >
        <header
          className={
            'event-intro [grid-column:1] min-w-0 [.app-content_&_h1]:[margin:0_0_1rem] [.app-content_&_h1]:[font:900_clamp(1.875rem,_3vw,_2.75rem)/1.15_var(--font-heading)] [.app-content_&_h1]:[letter-spacing:-0.025em] [.app-content_&_h1]:[overflow-wrap:anywhere] [.app-content_&_h1]:[text-wrap:balance] max-[64rem]:[grid-column:1] max-[64rem]:[grid-row:1]'
          }
        >
          <div
            className={
              'event-cover h-[clamp(8rem,_17vw,_14rem)] overflow-hidden rounded-[1.25rem] bg-[#e3f1d1] mb-5 min-[110rem]:h-60 max-[64rem]:h-[clamp(9rem,_23vw,_13rem)] max-[40rem]:rounded-[0.875rem]'
            }
          >
            <ProfileBanner id={eventCoverId(event.id)} />
          </div>
          <div
            className={
              'event-title-tools flex items-center justify-between gap-3 flex-wrap mb-2.5 [&_>_.status-error]:bg-[#fee2df] [&_>_.status-error]:text-[#9b2626]'
            }
          >
            <StatusBadge
              tone={event.state === 'cancelled' ? 'error' : 'neutral'}
            >
              <CalendarDays size={16} aria-hidden="true" />{' '}
              {event.state === 'cancelled'
                ? 'Cancelled event'
                : 'Community event'}
            </StatusBadge>
            <div
              className={
                'event-tools flex items-center justify-end gap-2 [&_[data-slot=button]]:p-2.5 [&_[data-slot=button]]:min-w-11 [&_[data-slot=button]]:bg-card'
              }
            >
              {event.viewerCanManage && (
                <ButtonLink
                  href={`/dashboard/events/${event.id}/edit`}
                  variant="outline"
                  aria-label="Edit this event"
                  title="Edit this event"
                >
                  <Pencil size={19} aria-hidden="true" />
                </ButtonLink>
              )}
              <EventShare slug={event.slug} title={event.title} />
              <ReportDialog
                target={{ kind: 'event', id: event.id }}
                returnTo={path}
                compact
              />
            </div>
          </div>
          <h1>{event.title}</h1>
          <div
            className={
              'event-meta flex flex-wrap [gap:1rem_1.5rem] text-[length:0.9375rem] font-semibold [&_>_span]:flex [&_>_span]:items-start [&_>_span]:gap-2.5 [&_>_span]:min-w-0 [&_svg]:shrink-0 [&_svg]:mt-0.5 [&_small]:block [&_small]:text-[0.8125rem] [&_small]:font-normal [&_small]:text-muted-foreground [&_small]:mt-1 max-[40rem]:text-sm'
            }
          >
            <span>
              <CalendarDays size={21} aria-hidden="true" />
              <span>
                <time dateTime={event.startsAt}>{eventSchedule(event)}</time>
                <small>{TIME_ZONE} · Philippine time</small>
              </span>
            </span>
            <span>
              <MapPin size={21} aria-hidden="true" />
              <span>
                {event.venue.name}
                <small>{event.venue.address}</small>
              </span>
            </span>
          </div>
          <p
            className={
              'event-description [margin:1.25rem_0] max-w-[70ch] [white-space:pre-line] [overflow-wrap:anywhere]'
            }
          >
            {event.description}
          </p>
          <dl
            className={
              'event-stats grid grid-cols-3 gap-3.5 [margin:1.5rem_0_0] tabular-nums [&_>_div]:relative [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:justify-center [&_>_div]:[padding:0.875rem_0.75rem_0.875rem_3.75rem] [&_>_div]:[border:1px_solid_#f0ddc4] [&_>_div]:rounded-2xl [&_>_div]:bg-[#fff7eb] [&_dt]:text-[0.8125rem] [&_dt]:[line-height:1.4] [&_dt_svg]:absolute [&_dt_svg]:left-4 [&_dt_svg]:top-[50%] [&_dt_svg]:[transform:translateY(-50%)] [&_dt_svg]:text-[#b95308] [&_dt_svg]:w-7 [&_dt_svg]:h-7 [&_dd]:[order:-1] [&_dd]:[margin:0_0_0.125rem] [&_dd]:font-[900] [&_dd]:text-[length:1.375rem] [&_dd]:leading-[1.25] [&_dd]:font-heading [&_dd]:[overflow-wrap:anywhere] max-[85rem]:gap-2 max-[85rem]:[&_>_div]:pl-11 max-[85rem]:[&_dt_svg]:left-2.5 max-[85rem]:[&_dt_svg]:w-6 max-[85rem]:[&_dt_svg]:h-6 max-[64rem]:[&_>_div]:pl-15 max-[64rem]:[&_dt_svg]:left-4 max-[64rem]:[&_dt_svg]:w-7 max-[64rem]:[&_dt_svg]:h-7 max-[40rem]:[&_>_div]:p-3 max-[40rem]:[&_dt_svg]:hidden max-[40rem]:[&_dd]:text-lg max-[40rem]:[&_dt]:text-xs'
            }
          >
            <div>
              <dt>
                <Users aria-hidden="true" />
                Capacity
              </dt>
              <dd>
                <AnimatedNumber value={event.capacity} />
              </dd>
            </div>
            <div>
              <dt>
                <PawPrint aria-hidden="true" />
                Attending
              </dt>
              <dd>
                <AnimatedNumber value={event.attendanceCount} />
              </dd>
            </div>
            <div
              className={
                event.viewerAttending
                  ? 'event-stat-going [.event-stats_>_&]:bg-[#eef7e3] [.event-stats_>_&]:border-[#dae9c8] [&_dt_svg]:text-[#377517]'
                  : ''
              }
            >
              <dt>
                <CalendarCheck aria-hidden="true" />
                Your RSVP
              </dt>
              <dd>{event.viewerAttending ? 'Going' : 'Not reserved'}</dd>
            </div>
          </dl>
        </header>
        <aside
          className={
            'event-sidebar [grid-column:2] [grid-row:1_/_span_2] grid gap-5 min-w-0 max-[64rem]:[grid-column:1] max-[64rem]:[grid-row:2] max-[64rem]:grid-cols-2 max-[40rem]:grid-cols-1'
          }
          aria-label="RSVP and event information"
        >
          <EventRsvp
            key={`${event.id}:${session.cacheScope}:${event.version}:${event.viewerAttending}:${event.attendanceCount}`}
            event={event}
            scope={session.cacheScope}
          />
          <AttendeePreview event={event} path={path} />
          <section
            className={
              'event-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] p-5.5 [border:1px_solid_var(--border)] rounded-2xl bg-card min-w-0 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:[margin:0_0_1rem] [&_h2]:font-[900] [&_h2]:text-[length:1.375rem] [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:w-6.5 [&_h2_>_svg]:h-6.5 [&_h2_>_svg]:shrink-0 [&_p]:[margin:0.75rem_0] [&_p]:text-sm max-[85rem]:p-4.5 max-[40rem]:[&_h2]:text-xl event-details-panel [&_>_[data-slot=button]]:w-full [&_>_[data-slot=button]]:text-[0.8125rem] [&_>_[data-slot=button]]:flex-wrap'
            }
            aria-labelledby="event-details-title"
          >
            <h2 id="event-details-title">
              <CalendarDays aria-hidden="true" /> Event details
            </h2>
            <dl
              className={
                'event-facts [&_small]:block [&_small]:text-[0.8125rem] [&_small]:font-normal [&_small]:text-muted-foreground [&_small]:mt-1 [margin:0_0_1rem] [&_>_div]:relative [&_>_div]:[padding:0.875rem_0_0.875rem_2.25rem] [&_>_div]:[border-bottom:1px_solid_var(--border)] [&_>_div:first-child]:pt-0 [&_dt]:text-[0.8125rem] [&_dt]:text-muted-foreground [&_dt_svg]:absolute [&_dt_svg]:left-0 [&_dt_svg]:mt-0.5 [&_dt_svg]:text-foreground [&_dd]:[margin:0.25rem_0_0] [&_dd]:text-[length:0.9375rem] [&_dd]:font-semibold'
              }
            >
              <div>
                <dt>
                  <Clock3 size={21} aria-hidden="true" />
                  Date & time
                </dt>
                <dd>
                  {eventSchedule(event)}
                  <small>{TIME_ZONE}</small>
                </dd>
              </div>
              <div>
                <dt>
                  <MapPin size={21} aria-hidden="true" />
                  Location
                </dt>
                <dd>
                  {event.venue.name}
                  <small>{event.venue.address}</small>
                </dd>
              </div>
            </dl>
            <ButtonAnchor
              variant="outline"
              href={eventMapHref(event)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Map size={19} aria-hidden="true" /> Open venue in Maps{' '}
              <ArrowRight size={16} aria-hidden="true" />
              <span className="sr-only"> (opens a new tab)</span>
            </ButtonAnchor>
          </section>
          <section
            className={
              'event-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] p-5.5 [border:1px_solid_var(--border)] rounded-2xl bg-card min-w-0 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:[margin:0_0_1rem] [&_h2]:font-[900] [&_h2]:text-[length:1.375rem] [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:w-6.5 [&_h2_>_svg]:h-6.5 [&_h2_>_svg]:shrink-0 [&_p]:[margin:0.75rem_0] [&_p]:text-sm max-[85rem]:p-4.5 max-[40rem]:[&_h2]:text-xl event-host [&_small]:block [&_small]:text-[0.8125rem] [&_small]:font-normal [&_small]:text-muted-foreground [&_small]:mt-1 max-[64rem]:[grid-column:1_/_-1]'
            }
            aria-labelledby="event-host-title"
          >
            <h2 id="event-host-title">
              <PawPrint aria-hidden="true" /> Hosted by
            </h2>
            {event.host ? (
              <>
                <Link
                  className={
                    'event-host-identity flex items-center gap-3 text-foreground [overflow-wrap:anywhere] [&_>_span:nth-child(2)]:[flex:1] [&_>_span:nth-child(2)]:min-w-0 [&_>_svg]:shrink-0 [&_>_svg]:text-[color:var(--teal)]'
                  }
                  href={event.host.href}
                >
                  {event.host.kind === 'user' ? (
                    <CommunityAvatar
                      name={event.host.name}
                      image={event.host.avatar}
                      userId={event.host.id}
                    />
                  ) : (
                    <span
                      className={
                        'event-host-mark grid [place-items:center] bg-[#fff1de] text-[#b95308] w-13 h-13 rounded-full shrink-0'
                      }
                    >
                      <PawPrint size={27} aria-hidden="true" />
                    </span>
                  )}
                  <span>
                    <strong>{event.host.name}</strong>
                    <small>
                      {event.host.kind === 'shelter'
                        ? 'Shelter & rescue community'
                        : 'Community organizer'}
                    </small>
                  </span>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                {event.host.kind === 'user' && (
                  <FollowButton
                    target={{ kind: 'user', id: event.host.id }}
                    name={event.host.name}
                    returnTo={path}
                    compact
                  />
                )}
              </>
            ) : (
              <p>The organizer’s public profile is unavailable.</p>
            )}
          </section>
        </aside>
        <div
          className={
            'event-community [grid-column:1] [grid-row:2] min-w-0 [scroll-margin-top:8rem] max-[64rem]:[grid-row:3]'
          }
          id="event-content"
        >
          <nav
            className={
              'event-section-nav flex [border-bottom:1px_solid_var(--border)] mb-6 [&_a]:flex [&_a]:[flex:1] [&_a]:justify-center [&_a]:items-center [&_a]:gap-2.5 [&_a]:min-h-13 [&_a]:[padding:0.75rem_0.375rem] [&_a]:[border-bottom:3px_solid_transparent] [&_a]:text-foreground [&_a]:[font-weight:650] [&_a]:text-sm [&_a[aria-current=page]]:text-[#a5410d] [&_a[aria-current=page]]:bg-[#fff4e9] [&_a[aria-current=page]]:[border-bottom-color:var(--primary)] [&_a[aria-current=page]]:rounded-[0.75rem_0.75rem_0_0] [&_a:hover]:bg-[#fff4e9] max-[40rem]:[&_a]:flex-col max-[40rem]:[&_a]:gap-1.5 max-[40rem]:[&_a]:text-xs max-[40rem]:[&_a]:min-h-16 max-[40rem]:[&_svg]:w-[18px] max-[40rem]:[&_svg]:h-[18px]'
            }
            aria-label="Event sections"
          >
            {tabs.map(({ id, title, icon: Icon }) => (
              <Link
                key={id}
                href={`${path}?section=${id}#event-content`}
                aria-current={section === id ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                {title}
              </Link>
            ))}
          </nav>
          <section
            className={
              'event-section-body min-w-0 [&_h2]:font-[900] [&_h2]:text-2xl [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_1rem] [&_h3]:font-[800] [&_h3]:text-lg [&_h3]:leading-[1.3] [&_h3]:font-heading [&_h3]:[margin:1.75rem_0_0.625rem] [&_>_p]:max-w-[70ch]'
            }
            aria-labelledby="event-section-title"
            key={section}
          >
            {section === 'discussion' ? (
              <>
                <div
                  className={
                    'event-conversation-heading flex items-center justify-between gap-3 flex-wrap mb-4 [&_h2]:m-0 [&_>_span]:text-xs [&_>_span]:text-muted-foreground'
                  }
                >
                  <h2 id="event-section-title">Community conversation</h2>
                  <span>Newest first</span>
                </div>
                <Discussion
                  target={{ kind: 'event', id: event.id }}
                  returnTo={path}
                  composerFirst
                  allowPhotos={false}
                />
              </>
            ) : section === 'about' ? (
              <>
                <h2 id="event-section-title">About this gathering</h2>
                <p
                  className={
                    'event-long-description [white-space:pre-line] [overflow-wrap:anywhere]'
                  }
                >
                  {event.description}
                </p>
                <h3>Where we’ll meet</h3>
                <p>
                  <strong>{event.venue.name}</strong>
                  <br />
                  {event.venue.address}
                </p>
                <p
                  className={'event-section-note text-sm text-muted-foreground'}
                >
                  This event venue and its coordinates are intentionally public.
                  Check the schedule and venue before making travel plans.
                </p>
                <ButtonAnchor
                  variant="outline"
                  href={eventMapHref(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin size={18} aria-hidden="true" /> View public venue in
                  Maps<span className="sr-only"> (opens a new tab)</span>
                </ButtonAnchor>
                <h3>A considerate community</h3>
                <p>
                  Keep the conversation kind, follow the organizer’s guidance,
                  and ask before bringing an animal. An RSVP reserves a place;
                  it does not confirm attendance or completed volunteer work.
                </p>
              </>
            ) : (
              <div aria-labelledby="event-section-title">
                <h2 id="event-section-title" className="sr-only">
                  Attendees
                </h2>
                <AttendeeList event={event} />
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
