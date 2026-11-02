import 'server-only'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import { publicSnapshot } from '@/features/moderation/service'
import { publicAchievementShowcase } from '@/features/achievements/engine'
import { personAvatar } from '@/features/users/avatar-presets'
import { orderedPage } from '@/lib/server/workflow-context'
import { manilaDay } from '@/features/achievements/engine'
import {
  leaderboardPageSchema,
  type LeaderboardFilters,
  type LeaderboardPeriod,
} from './schemas'

/** One public projection supplies the podium, totals and paginated recognition rows. */
export function communityLeaderboard(
  d: DemoDraft,
  period: LeaderboardPeriod,
  q: LeaderboardFilters,
  now: string,
) {
  const data = publicSnapshot(d)
  const today = manilaDay(now)
  const day = Date.parse(today + 'T00:00:00Z') / 86400000
  const weekStart = day - ((new Date(day * 86400000).getUTCDay() + 6) % 7)
  const inPeriod = (value: string | null | undefined) => {
    if (!value) return period === 'all'
    if (Date.parse(value) > Date.parse(now)) return false
    if (period === 'all') return true
    const date = manilaDay(value)
    return period === 'month'
      ? date.slice(0, 7) === today.slice(0, 7)
      : Date.parse(date + 'T00:00:00Z') / 86400000 >= weekStart
  }
  const visibleMissions = new Map(data.missions.map((m) => [m.id, m]))
  const visibleCampaigns = new Set(
    data.fundraisers
      .filter((c) => ['active', 'completed', 'closed'].includes(c.state))
      .map((c) => c.id),
  )
  const visibleAnimals = new Set(data.animals.map((a) => a.id))
  const supportedAnimals = new Set<string>()
  const rows = data.users
    .filter((u) => u.settings.discoverable && u.settings.showContributions)
    .map((u) => {
      const missions = d.data.participations.filter((p) => {
        const approvedAt =
          p.reviewedAt ??
          d.data.kibbleEntries.find(
            (e) => e.contributionId === p.id && e.reason === 'mission_approved',
          )?.createdAt
        return (
          p.volunteerId === u.id &&
          p.state === 'approved' &&
          !!p.reviewerId &&
          p.reviewerId !== u.id &&
          visibleMissions.has(p.missionId) &&
          inPeriod(approvedAt)
        )
      })
      for (const participation of missions) {
        const animalId = visibleMissions.get(participation.missionId)?.animalId
        if (animalId && visibleAnimals.has(animalId))
          supportedAnimals.add(animalId)
      }
      const sightings = data.sightings.filter(
        (s) => s.reporterId === u.id && inPeriod(s.createdAt),
      ).length
      const fundraisers = new Set(
        d.data.contributions
          .filter(
            (c) =>
              !c.anonymous &&
              c.contributorId === u.id &&
              visibleCampaigns.has(c.campaignId) &&
              inPeriod(c.createdAt),
          )
          .map((c) => c.campaignId),
      ).size
      const lifetimeKibble = Math.max(
        0,
        d.data.kibbleEntries
          .filter((e) => e.userId === u.id)
          .reduce((sum, e) => sum + e.amount, 0),
      )
      const kibble = Math.max(
        0,
        d.data.kibbleEntries
          .filter((e) => e.userId === u.id && inPeriod(e.createdAt))
          .reduce((sum, e) => sum + e.amount, 0),
      )
      const showcase = publicAchievementShowcase(d, u.id, now)
      return {
        id: u.id,
        userId: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: personAvatar(u.avatar, u.id),
        level: 1 + Math.floor(lifetimeKibble / 100),
        kibble,
        rank: 1,
        contributions: { missions: missions.length, sightings, fundraisers },
        badges: showcase.badges,
        mastery: showcase.mastery,
        provenance: u.provenance,
      }
    })
    .filter(
      (r) => r.kibble > 0 || Object.values(r.contributions).some((n) => n > 0),
    )
  const summary = {
    activeHelpers: rows.length,
    kibbleEarned: rows.reduce((sum, r) => sum + r.kibble, 0),
    contributions: rows.reduce(
      (sum, r) =>
        sum +
        r.contributions.missions +
        r.contributions.sightings +
        r.contributions.fundraisers,
      0,
    ),
    animalsHelped: supportedAnimals.size,
  }
  const metric = (r: (typeof rows)[number]) =>
    q.category === 'missions'
      ? r.contributions.missions
      : q.category === 'sightings'
        ? r.contributions.sightings
        : q.category === 'fundraisers'
          ? r.contributions.fundraisers
          : r.kibble
  const ranked = rows
    .filter((r) => q.category === 'all' || metric(r) > 0)
    .sort(
      (a, b) =>
        metric(b) - metric(a) ||
        b.contributions.missions - a.contributions.missions ||
        a.userId.localeCompare(b.userId),
    )
  ranked.forEach((r, i) => {
    r.rank = i + 1
  })
  const matching = ranked.filter(
    (r) =>
      !q.q ||
      (r.displayName + ' ' + r.username)
        .toLowerCase()
        .includes(q.q.toLowerCase()),
  )
  const scope = `leaderboard:${period}:${q.category}:${q.q ?? ''}:${today}`
  const result = orderedPage(matching, q, scope)
  const offset = result.items.length
    ? matching.findIndex((r) => r.id === result.items[0].id)
    : 0
  const previous = offset > q.limit ? matching[offset - q.limit - 1] : undefined
  return leaderboardPageSchema.parse({
    ...result,
    podium: ranked.slice(0, 3),
    summary,
    offset,
    previousCursor: previous
      ? Buffer.from(JSON.stringify([scope, previous.id])).toString('base64url')
      : null,
  })
}
