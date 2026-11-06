import { Progress } from '@/components/ui/progress'
import { findBadge } from './catalog'
import type { AchievementSummary } from './schemas'

export function MasteryPanel({ summary }: { summary: AchievementSummary }) {
  return (
    <section className="mastery-panel" aria-label="Achievement mastery">
      <img
        src="/images/badges/paw-legacy.webp"
        width={192}
        height={192}
        alt=""
        loading="lazy"
      />
      <div className="mastery-details">
        <h2>{summary.tier}</h2>
        <p>
          {summary.unlocked} of {summary.total} badges unlocked{' '}
          <span aria-hidden="true">·</span>{' '}
          {summary.kibbleEarned.toLocaleString('en-PH')} achievement Kibble
        </p>
        <Progress
          value={summary.unlocked}
          max={summary.total}
          aria-label={
            summary.unlocked + ' of ' + summary.total + ' badges unlocked'
          }
        />
        <p className="mastery-next">
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
      className="profile-badge-shelf"
      aria-label="Showcased achievement badges"
    >
      {badges.map((badge) => {
        const definition = findBadge(badge.id)
        return (
          <li
            key={badge.id}
            id={`badge-${badge.id}`}
            className={
              selectedBadge === badge.id ? 'badge-selected' : undefined
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
