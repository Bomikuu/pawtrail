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
      className="event-panel event-attendees-preview"
      aria-labelledby="event-attendees-title"
    >
      <div className="event-panel-heading">
        <h2 id="event-attendees-title">
          <Users aria-hidden="true" /> Attendees
        </h2>
        <span>
          {event.attendanceCount} of {event.capacity}
        </span>
      </div>
      {event.attendees.length ? (
        <div className="event-attendee-faces">
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
              className="event-more-attendees"
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
        className="event-text-link"
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
      <p className="event-section-note">
        {event.attendanceCount} attending. Only people who share their
        contributions publicly are listed.
      </p>
      {event.attendees.length ? (
        <ul className="event-attendee-list">
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
        <div className="event-quiet-state">
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
        <p className="event-section-note">
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
    <div className="event-page">
      <PublicJsonLd
        name={event.title}
        description={event.description}
        path={path}
      />
      <Link className="event-back" href="/events">
        <ArrowLeft size={16} aria-hidden="true" /> All community events
      </Link>
      <div className="event-detail-grid">
        <header className="event-intro">
          <div className="event-cover">
            <ProfileBanner id={eventCoverId(event.id)} />
          </div>
          <div className="event-title-tools">
            <StatusBadge
              tone={event.state === 'cancelled' ? 'error' : 'neutral'}
            >
              <CalendarDays size={16} aria-hidden="true" />{' '}
              {event.state === 'cancelled'
                ? 'Cancelled event'
                : 'Community event'}
            </StatusBadge>
            <div className="event-tools">
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
          <div className="event-meta">
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
          <p className="event-description">{event.description}</p>
          <dl className="event-stats">
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
            <div className={event.viewerAttending ? 'event-stat-going' : ''}>
              <dt>
                <CalendarCheck aria-hidden="true" />
                Your RSVP
              </dt>
              <dd>{event.viewerAttending ? 'Going' : 'Not reserved'}</dd>
            </div>
          </dl>
        </header>
        <aside
          className="event-sidebar"
          aria-label="RSVP and event information"
        >
          <EventRsvp
            key={`${event.id}:${session.cacheScope}:${event.version}:${event.viewerAttending}:${event.attendanceCount}`}
            event={event}
            scope={session.cacheScope}
          />
          <AttendeePreview event={event} path={path} />
          <section
            className="event-panel event-details-panel"
            aria-labelledby="event-details-title"
          >
            <h2 id="event-details-title">
              <CalendarDays aria-hidden="true" /> Event details
            </h2>
            <dl className="event-facts">
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
            className="event-panel event-host"
            aria-labelledby="event-host-title"
          >
            <h2 id="event-host-title">
              <PawPrint aria-hidden="true" /> Hosted by
            </h2>
            {event.host ? (
              <>
                <Link className="event-host-identity" href={event.host.href}>
                  {event.host.kind === 'user' ? (
                    <CommunityAvatar
                      name={event.host.name}
                      image={event.host.avatar}
                      userId={event.host.id}
                    />
                  ) : (
                    <span className="event-host-mark">
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
        <div className="event-community" id="event-content">
          <nav className="event-section-nav" aria-label="Event sections">
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
            className="event-section-body"
            aria-labelledby="event-section-title"
            key={section}
          >
            {section === 'discussion' ? (
              <>
                <div className="event-conversation-heading">
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
                <p className="event-long-description">{event.description}</p>
                <h3>Where we’ll meet</h3>
                <p>
                  <strong>{event.venue.name}</strong>
                  <br />
                  {event.venue.address}
                </p>
                <p className="event-section-note">
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
