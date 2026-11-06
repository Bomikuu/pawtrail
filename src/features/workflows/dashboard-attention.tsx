import 'server-only'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
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
    <div
      className={
        'dashboard-priorities grid grid-cols-[minmax(0,_1.4fr)_minmax(16rem,_1fr)] gap-4 mb-6 max-[76rem]:grid-cols-1'
      }
    >
      <section
        className={
          'attention-panel min-w-0 bg-card [border:1px_solid_var(--social-line)] rounded-2xl p-5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:font-[850] [&_h2]:text-xl [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_0.75rem] [&_h2_>_svg]:text-[color:var(--teal)] max-[48rem]:p-4 [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
        }
        aria-labelledby="attention-heading"
      >
        <h2 id="attention-heading">Needs your attention</h2>
        {tasks.length ? (
          <ul
            className={
              'attention-list m-0 p-0 list-none [&_li]:flex [&_li]:items-center [&_li]:gap-3 [&_li]:[padding:0.875rem_0] [&_li]:[border-top:1px_solid_var(--social-line)] [&_li_>_svg]:text-[color:var(--teal)] [&_li_>_svg]:shrink-0 [&_li_>_div]:[flex:1] [&_li_>_div]:min-w-0 [&_a]:text-[length:0.9375rem] [&_a]:[font-weight:650] [&_a]:[text-underline-offset:0.2em] [&_p]:text-[0.8125rem] [&_p]:[line-height:1.5] [&_p]:[margin:0.25rem_0_0] [&_p]:text-muted-foreground max-[48rem]:[&_li]:gap-2 max-[48rem]:[&_li_>_svg]:hidden'
            }
          >
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
                <span
                  className={
                    'attention-count font-[850] text-xl leading-[1.2] font-heading tabular-nums'
                  }
                >
                  {task.count ?? '—'}
                </span>
                <Link
                  href={task.href}
                  className={
                    'attention-open grid [place-items:center] min-w-11 min-h-11 rounded-full [&:hover]:bg-[#edf6f2]'
                  }
                  aria-label={task.label}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={
              'attention-clear flex flex-wrap gap-3 items-center pt-2 [&_img]:w-24 [&_img]:h-auto [&_p]:[flex:1_1_12rem] [&_p]:text-[length:0.9375rem] [&_p]:text-muted-foreground'
            }
          >
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
      <section
        className={
          'attention-panel min-w-0 bg-card [border:1px_solid_var(--social-line)] rounded-2xl p-5 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2 [&_h2]:font-[850] [&_h2]:text-xl [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_0.75rem] [&_h2_>_svg]:text-[color:var(--teal)] max-[48rem]:p-4 [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
        }
        aria-labelledby="upcoming-heading"
      >
        <h2 id="upcoming-heading">
          <CalendarDays size={21} aria-hidden="true" /> Coming up
        </h2>
        {upcoming === null ? (
          <p>
            Your calendar couldn’t load.{' '}
            <Link href="/dashboard/events">Open your events to try again.</Link>
          </p>
        ) : upcoming.length ? (
          <ul
            className={
              'upcoming-list m-0 p-0 list-none [&_li]:grid [&_li]:gap-1 [&_li]:[padding:0.875rem_0] [&_li]:[border-top:1px_solid_var(--social-line)] [&_time]:text-xs [&_time]:text-muted-foreground [&_a]:[font-weight:650] [&_a]:[text-underline-offset:0.2em] [&_small]:text-xs [&_small]:text-muted-foreground'
            }
          >
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
