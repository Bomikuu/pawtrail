import 'server-only'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FilePenLine,
  HeartHandshake,
} from 'lucide-react'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { Actor } from '@/features/auth/types'
import { ButtonLink } from '@/components/ui/button-link'
import { date, Empty } from './catalog'

export async function DashboardAttention({
  api,
  actor,
  now,
}: {
  api: PawTrailApi
  actor: Actor
  now: string
}) {
  const staff = actor.roles.includes('shelter_staff')
  const organizer = staff || actor.roles.includes('moderator')
  const [
    accepted,
    rejected,
    applications,
    evidence,
    shelterApplications,
    events,
  ] = await Promise.allSettled([
    api.missions.participations({ scope: 'mine', state: 'accepted', limit: 1 }),
    api.missions.participations({ scope: 'mine', state: 'rejected', limit: 1 }),
    api.adoption.applications({
      scope: 'mine',
      status: 'needs_information',
      limit: 1,
    }),
    organizer
      ? api.missions.participations({
          scope: 'organization',
          state: 'submitted',
          limit: 1,
        })
      : Promise.resolve(null),
    staff
      ? api.adoption.applications({
          scope: 'shelter',
          status: 'submitted',
          limit: 1,
        })
      : Promise.resolve(null),
    api.events.list({
      scope: 'mine',
      state: 'scheduled',
      from: now,
      sort: 'soonest',
      limit: 3,
    }),
  ])
  const count = (result: PromiseSettledResult<{ count: number } | null>) =>
    result.status === 'fulfilled' ? (result.value?.count ?? 0) : null
  const tasks = [
    {
      label: 'Mission evidence to submit',
      count: count(accepted),
      href: '/dashboard/missions?state=accepted#my-mission-activity',
      icon: HeartHandshake,
      hint: 'Complete the care task, then share private evidence.',
    },
    {
      label: 'Evidence that needs changes',
      count: count(rejected),
      href: '/dashboard/missions?state=rejected#my-mission-activity',
      icon: FilePenLine,
      hint: 'Read the reviewer’s notes before resubmitting.',
    },
    {
      label: 'Applications needing information',
      count: count(applications),
      href: '/dashboard/adoptions?status=needs_information',
      icon: FilePenLine,
      hint: 'Add the information requested by the shelter.',
    },
    ...(organizer
      ? [
          {
            label: 'Evidence waiting for your review',
            count: count(evidence),
            href: '/dashboard/missions?reviewState=submitted#mission-review',
            icon: ClipboardCheck,
            hint: 'Review contributions before awarding Kibble.',
          },
        ]
      : []),
    ...(staff
      ? [
          {
            label: 'Adoption applications to review',
            count: count(shelterApplications),
            href: '/dashboard/shelter/applications?status=submitted',
            icon: ClipboardCheck,
            hint: 'Give each applicant a clear next step.',
          },
        ]
      : []),
  ].filter((task) => task.count !== 0)
  const upcoming =
    events.status === 'fulfilled'
      ? [...events.value.items]
          .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
          .slice(0, 3)
      : null
  return (
    <div className="dashboard-priorities">
      <section className="attention-panel" aria-labelledby="attention-heading">
        <h2 id="attention-heading">Needs your attention</h2>
        {tasks.length ? (
          <ul className="attention-list">
            {tasks.map((task) => (
              <li key={task.href}>
                <task.icon size={21} aria-hidden="true" />
                <div>
                  <Link href={task.href}>{task.label}</Link>
                  <p>
                    {task.count === null
                      ? 'This count is unavailable. Open the workspace to try again.'
                      : task.hint}
                  </p>
                </div>
                <span className="attention-count">{task.count ?? '—'}</span>
                <Link
                  href={task.href}
                  className="attention-open"
                  aria-label={task.label}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="attention-clear">
            <img
              src="/images/pawtrail/caught-up.webp"
              width={120}
              height={60}
              alt=""
            />
            <p>
              You’re caught up. New requests and review tasks will appear here.
            </p>
            <ButtonLink href="/missions" variant="outline">
              Find a way to help
            </ButtonLink>
          </div>
        )}
      </section>
      <section className="attention-panel" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading">
          <CalendarDays size={21} aria-hidden="true" /> Coming up
        </h2>
        {upcoming === null ? (
          <p>
            Your calendar couldn’t load.{' '}
            <Link href="/dashboard/events">Open your events to try again.</Link>
          </p>
        ) : upcoming.length ? (
          <ul className="upcoming-list">
            {upcoming.map((event) => (
              <li key={event.id}>
                <time dateTime={event.startsAt}>{date(event.startsAt)}</time>
                <Link href={`/events/${event.slug}`}>{event.title}</Link>
                <small>{event.venue.name}</small>
              </li>
            ))}
          </ul>
        ) : (
          <Empty href="/events" label="Find a gathering">
            No upcoming gatherings in your calendar.
          </Empty>
        )}
      </section>
    </div>
  )
}
