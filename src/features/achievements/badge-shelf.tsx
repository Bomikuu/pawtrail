import { Progress } from '@/components/ui/progress'
import { findBadge } from './catalog'
import type { AchievementSummary } from './schemas'

export function MasteryPanel({ summary }: { summary: AchievementSummary }) {
  return (
    <section
      className={
        'mastery-panel flex items-center gap-6 [padding:1.25rem_1.5rem] [border:1px_solid_var(--social-line)] rounded-xl bg-card [margin:1.5rem_0] [&_>_img]:[flex:0_0_5rem] [&_>_img]:w-20 [&_>_img]:h-20 [&_>_img]:object-contain [&_>_img]:[mix-blend-mode:multiply] max-[40rem]:p-4 max-[40rem]:gap-3.5 max-[40rem]:[&_>_img]:w-14 max-[40rem]:[&_>_img]:h-14 max-[40rem]:[&_>_img]:[flex-basis:3.5rem] [.pawpal-profile_&]:mt-4 [.pawpal-profile_&]:p-3 [.pawpal-profile_&_>_img]:w-12 [.pawpal-profile_&_>_img]:h-12 [.pawpal-profile_&_h2]:text-base [.pawpal-profile_&_h2]:[margin:0_0_0.25rem] [.pawpal-profile_&_p]:text-xs'
      }
      aria-label="Achievement mastery"
    >
      <img
        src="/images/badges/paw-legacy.webp"
        width={192}
        height={192}
        alt=""
        loading="lazy"
      />
      <div
        className={
          'mastery-details min-w-0 [flex:1] [&_h2]:text-[length:1.375rem] [&_h2]:[margin:0_0_0.375rem] [&_>_p]:text-[0.8125rem] [&_>_p]:[margin:0.375rem_0_0.75rem] [&_>_p]:text-muted-foreground max-[40rem]:[&_h2]:text-lg max-[40rem]:[&_>_p]:text-xs'
        }
      >
        <h2>{summary.tier}</h2>
        <p>
          {summary.unlocked} of {summary.total} badges unlocked{' '}
          <span aria-hidden="true">·</span>{' '}
          {summary.kibbleEarned.toLocaleString('en-PH')} achievement Kibble
        </p>
        <Progress
          value={(100 * summary.unlocked) / Math.max(1, summary.total)}
          max={100}
          aria-label={
            summary.unlocked + ' of ' + summary.total + ' badges unlocked'
          }
        />
        <p
          className={
            'mastery-next [.mastery-details_&]:text-xs [.mastery-details_&]:[margin:0.5rem_0_0]'
          }
        >
          {summary.nextMilestone
            ? 'Next mastery milestone: ' +
              summary.nextMilestone +
              ' unlocked badges.'
            : 'You have reached the highest mastery tier.'}
        </p>
      </div>
    </section>
  )
}
export function BadgeShelf({
  badges,
  selectedBadge,
}: {
  badges: { id: string; label: string }[]
  selectedBadge?: string
}) {
  return (
    <ul
      className={
        'profile-badge-shelf grid grid-cols-[repeat(auto-fit,_minmax(7.5rem,_1fr))] gap-4 list-none p-0 [margin:1.5rem_0] [&_li]:flex [&_li]:flex-col [&_li]:items-center [&_li]:gap-1.5 [&_li]:text-center [&_li]:p-3 [&_li]:min-w-0 [&_li]:[scroll-margin-top:8rem] [&_li]:rounded-xl [&_img]:w-24 [&_img]:h-24 [&_img]:max-w-full [&_img]:object-contain [&_img]:[mix-blend-mode:multiply] [&_strong]:font-[800] [&_strong]:text-[length:0.9375rem] [&_strong]:leading-[1.3] [&_strong]:font-heading [&_span]:text-[0.6875rem] [&_span]:text-muted-foreground [&_details]:text-xs [&_summary]:text-[color:var(--teal)] [&_summary]:cursor-pointer [&_summary]:min-h-11 [&_summary]:[align-content:center] max-[40rem]:grid-cols-2 max-[40rem]:gap-2 [.pawpal-profile_&]:grid-cols-[repeat(auto-fit,_minmax(5.5rem,_1fr))] [.pawpal-profile_&]:gap-3 [.pawpal-profile_&]:m-0 [.pawpal-profile_&_>_li]:bg-[transparent] [.pawpal-profile_&_>_li]:[border:0] [.pawpal-profile_&_>_li]:p-1 [.pawpal-profile_&_img]:w-17 [.pawpal-profile_&_img]:h-17 [.pawpal-profile_&_strong]:text-xs [.pawpal-profile_&_>_li_>_span]:text-[0.625rem] [.pawpal-profile_&_summary]:text-[0.6875rem] [&_details[open]]:text-left [&_details[open]_p]:[line-height:1.6] [&:has(.badge-selected)]:grid-cols-[repeat(auto-fit,_minmax(9rem,_1fr))]'
      }
      aria-label="Showcased achievement badges"
    >
      {badges.map((badge) => {
        const definition = findBadge(badge.id)
        return (
          <li
            key={badge.id}
            id={`badge-${badge.id}`}
            className={
              selectedBadge === badge.id
                ? 'badge-selected [.profile-badge-shelf_&]:bg-[#fff0df] [.profile-badge-shelf_&]:[outline:2px_solid_var(--teal)] [.profile-badge-shelf_&]:[outline-offset:2px] [.profile-badge-shelf_&]:[grid-column:span_2] max-[48rem]:[.profile-badge-shelf_&]:[grid-column:1_/_-1]'
                : undefined
            }
          >
            {definition && (
              <img
                src={definition.image}
                width={192}
                height={192}
                alt=""
                loading="lazy"
              />
            )}
            <strong>{badge.label}</strong>
            {definition && (
              <>
                <span>{definition.rewardKibble} Kibble · one-time reward</span>
                <details open={selectedBadge === badge.id || undefined}>
                  <summary>How to earn</summary>
                  <p>{definition.rule}</p>
                  <p>
                    Shared by this member as an unlocked achievement. Kibble is
                    a non-cash reward.
                  </p>
                </details>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
