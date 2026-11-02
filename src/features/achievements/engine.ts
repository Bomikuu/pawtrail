import 'server-only'
import { randomUUID } from 'node:crypto'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import { emptyWorkflow } from '@/lib/server/workflow-store'
import { achievementCatalog, masteryTiers } from './catalog'
import type { AchievementOverview, AchievementStore } from './schemas'

export function achievementStore(draft: DemoDraft): AchievementStore {
  draft.workflow ??= emptyWorkflow()
  return (draft.workflow.achievements ??= {
    claims: [],
    activities: [],
    proofs: [],
    showcases: [],
  })
}
export function manilaDay(value: string) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value))
  return ['year', 'month', 'day']
    .map((key) => parts.find((part) => part.type === key)!.value)
    .join('-')
}
function longestStreak(days: string[]) {
  const numbers = [...new Set(days)]
    .map((day) => Date.parse(day + 'T00:00:00Z') / 86400000)
    .sort((a, b) => a - b)
  let best = 0,
    run = 0,
    prior = -Infinity
  for (const day of numbers) {
    run = day === prior + 1 ? run + 1 : 1
    best = Math.max(best, run)
    prior = day
  }
  return best
}
function published(d: DemoDraft, kind: string, id: string) {
  const metadata = d.moderation.subjects.find(
    (s) => s.ref.kind === kind && s.ref.id === id,
  )
  if (metadata && metadata.state !== 'published') return false
  const row =
    kind === 'animal'
      ? d.data.animals.find((r) => r.id === id)
      : kind === 'post'
        ? d.data.posts.find((r) => r.id === id)
        : kind === 'mission'
          ? d.data.missions.find((r) => r.id === id)
          : kind === 'fundraiser'
            ? d.data.fundraisers.find((r) => r.id === id)
            : kind === 'event'
              ? d.data.events.find((r) => r.id === id)
              : kind === 'user'
                ? d.data.users.find((r) => r.id === id)
                : undefined
  return !!row && (!('moderation' in row) || row.moderation === 'published')
}
export function achievementBalance(d: DemoDraft, userId: string) {
  return d.data.kibbleEntries
    .filter((e) => e.userId === userId)
    .reduce((sum, e) => sum + e.amount, 0)
}
export function achievementOverview(
  d: DemoDraft,
  userId: string,
  now: string,
): AchievementOverview {
  const store = achievementStore(d)
  const user = d.data.users.find((u) => u.id === userId)!
  const missions = d.data.participations.filter(
    (p) =>
      p.volunteerId === userId &&
      p.state === 'approved' &&
      p.reviewerId !== userId &&
      published(d, 'mission', p.missionId),
  )
  const missionRows = missions.flatMap((p) =>
    d.data.missions.filter((m) => m.id === p.missionId),
  )
  const sightings = d.data.sightings.filter(
    (s) =>
      s.reporterId === userId &&
      s.moderation === 'published' &&
      published(d, 'animal', s.animalId),
  )
  const posts = d.data.posts.filter(
    (p) =>
      p.authorId === userId &&
      p.moderation === 'published' &&
      published(d, 'post', p.id),
  )
  const campaignIds = new Set(
    d.data.contributions
      .filter((c) => c.contributorId === userId)
      .map((c) => c.campaignId),
  )
  const campaigns = d.data.fundraisers.filter(
    (c) =>
      campaignIds.has(c.id) &&
      ['active', 'completed', 'closed'].includes(c.state) &&
      published(d, 'fundraiser', c.id),
  )
  const activity = store.activities.filter((a) => a.userId === userId)
  const proofs = store.proofs.filter(
    (p) =>
      p.userId === userId &&
      p.state === 'approved' &&
      p.reviewerId !== userId &&
      (p.ref.kind !== 'post' || posts.some((post) => post.id === p.ref.id)),
  )
  const proofCount = (id: string) =>
    new Set(proofs.filter((p) => p.badgeId === id).map((p) => p.dedupKey)).size
  const daysForAnimal = (id: string) => {
    const groups = new Map<string, Set<string>>()
    for (const p of proofs.filter((p) => p.badgeId === id)) {
      const set = groups.get(p.ref.id) ?? new Set()
      set.add(manilaDay(p.occurredAt))
      groups.set(p.ref.id, set)
    }
    return Math.max(0, ...[...groups.values()].map((set) => set.size))
  }
  const approvedAnimals = new Set(
    missionRows.flatMap((m) => (m.animalId ? [m.animalId] : [])),
  )
  const areaAnimals = new Map<string, Set<string>>()
  for (const animal of d.data.animals.filter(
    (a) =>
      approvedAnimals.has(a.id) || sightings.some((s) => s.animalId === a.id),
  )) {
    const set = areaAnimals.get(animal.location.areaId) ?? new Set()
    set.add(animal.id)
    areaAnimals.set(animal.location.areaId, set)
  }
  const ranked = d.data.users
    .filter(
      (u) =>
        u.settings.discoverable &&
        u.settings.showContributions &&
        published(d, 'user', u.id),
    )
    .sort(
      (a, b) =>
        achievementBalance(d, b.id) - achievementBalance(d, a.id) ||
        d.data.participations.filter(
          (p) => p.volunteerId === b.id && p.state === 'approved',
        ).length -
          d.data.participations.filter(
            (p) => p.volunteerId === a.id && p.state === 'approved',
          ).length ||
        a.id.localeCompare(b.id),
    )
  const membershipDays = Math.max(
    0,
    Math.floor((Date.parse(now) - Date.parse(user.createdAt)) / 86400000),
  )
  const activeClaims = store.claims.filter(
    (c) => c.userId === userId && c.state === 'active',
  )
  // Participations are persisted in join order, including equal server timestamps.
  const reviewed = d.data.participations.filter(
    (p) =>
      p.volunteerId === userId && ['approved', 'rejected'].includes(p.state),
  )
  let missionStreak = 0,
    bestMissionStreak = 0
  for (const p of reviewed) {
    missionStreak = missions.some((m) => m.id === p.id) ? missionStreak + 1 : 0
    bestMissionStreak = Math.max(bestMissionStreak, missionStreak)
  }
  const metrics: Record<string, number> = {
    'first-sighting': sightings.length,
    'first-help': missions.length,
    'top-pawpal':
      missions.length &&
      achievementBalance(d, userId) > 0 &&
      ranked.slice(0, 3).some((u) => u.id === userId)
        ? 1
        : 0,
    'fundraiser-supporter': campaigns.length,
    'shelter-supporter': new Set([
      ...missionRows.flatMap((m) => (m.shelterId ? [m.shelterId] : [])),
      ...campaigns.flatMap((c) => (c.shelterId ? [c.shelterId] : [])),
    ]).size,
    'care-companion': daysForAnimal('care-companion'),
    explorer: new Set(
      activity.filter((a) => a.kind === 'discovery').map((a) => a.ref?.id),
    ).size,
    'community-storyteller': posts.length,
    'animal-guardian': approvedAnimals.size + proofCount('rescue-ally'),
    'horde-helper':
      missionRows.filter((m) => m.hordeId).length +
      campaigns.filter((c) => c.hordeId).length,
    'event-participant': new Set(
      d.data.rsvps
        .filter(
          (r) =>
            r.userId === userId &&
            d.data.events.some(
              (e) =>
                e.id === r.eventId &&
                e.state === 'scheduled' &&
                published(d, 'event', e.id),
            ),
        )
        .map((r) => r.eventId),
    ).size,
    'mission-complete': missions.length,
    'green-paw':
      Number(missions.length >= 10) + Number(approvedAnimals.size >= 3),
    'true-pawpal':
      Number(missions.length >= 20) +
      Number(posts.length >= 10) +
      Number(sightings.length >= 5),
    'daily-pawpal': longestStreak(
      activity
        .filter((a) => a.kind === 'daily')
        .map((a) => manilaDay(a.createdAt)),
    ),
    'keen-spotter': sightings.length,
    'paw-photographer': new Set(
      posts.flatMap((p) =>
        p.media
          .filter((image) => {
            const stored = d.media.find((media) => media.asset.id === image.id)
            return !stored || stored.approved
          })
          .map((m) => m.id),
      ),
    ).size,
    'area-guardian': Math.max(
      0,
      ...[...areaAnimals.values()].map((set) => set.size),
    ),
    'generous-donor': campaigns.length,
    advocate: new Set(
      activity
        .filter((a) => a.kind === 'share')
        .map((a) => a.ref?.kind + ':' + a.ref?.id),
    ).size,
    'mission-streak': bestMissionStreak,
    'paw-legacy':
      Number(membershipDays >= 30) +
      Number(
        activeClaims.filter((c) => c.badgeId !== 'paw-legacy').length >= 20,
      ),
    'mission-leader': missions.length,
    'horde-friend': missionRows.filter((m) => m.hordeId).length,
    'medical-supporter': campaigns.filter((c) => c.category === 'medical')
      .length,
    'recovery-partner': daysForAnimal('recovery-partner'),
    'sighting-streak': longestStreak(
      sightings.map((s) => manilaDay(s.observedAt)),
    ),
    'adoption-supporter': d.workflow!.applications.filter(
      (a) =>
        a.applicantId === userId &&
        (['submitted', 'needs_information', 'approved', 'rejected'].includes(
          a.status,
        ) ||
          (a.history ?? []).some((h) => h.status === 'submitted')),
    ).length,
    volunteer: d.data.participations.filter(
      (p) => p.volunteerId === userId && published(d, 'mission', p.missionId),
    ).length,
    'kindness-explorer': new Set(
      proofs
        .filter((p) => p.badgeId === 'kindness-explorer')
        .map((p) => p.ref.id),
    ).size,
    'kibble-saver': Math.max(0, achievementBalance(d, userId)),
    'pawtrail-supporter': membershipDays,
  }
  const multi: Record<
    string,
    { label: string; current: number; target: number }[]
  > = {
    'green-paw': [
      { label: 'Approved missions', current: missions.length, target: 10 },
      {
        label: 'Different animals helped',
        current: approvedAnimals.size,
        target: 3,
      },
    ],
    'true-pawpal': [
      { label: 'Approved missions', current: missions.length, target: 20 },
      { label: 'Published posts', current: posts.length, target: 10 },
      { label: 'Approved sightings', current: sightings.length, target: 5 },
    ],
    'paw-legacy': [
      { label: 'Membership days', current: membershipDays, target: 30 },
      {
        label: 'Other unlocked badges',
        current: activeClaims.filter((c) => c.badgeId !== 'paw-legacy').length,
        target: 20,
      },
    ],
  }
  const items = achievementCatalog.map((badge) => {
    const claim = activeClaims.find((c) => c.badgeId === badge.id)
    const pastClaim = store.claims.find(
      (c) => c.userId === userId && c.badgeId === badge.id,
    )
    const metric = metrics[badge.id] ?? proofCount(badge.id)
    const current =
      claim && badge.historical ? Math.max(badge.target, metric) : metric
    return {
      id: badge.id,
      current,
      target: badge.target,
      percent: Math.min(100, Math.floor((current / badge.target) * 100)),
      state: claim
        ? ('unlocked' as const)
        : current >= badge.target
          ? ('ready' as const)
          : pastClaim
            ? ('revoked' as const)
            : ('locked' as const),
      claimedAt: claim?.claimedAt ?? null,
      rewardKibble: badge.rewardKibble,
      criteria: multi[badge.id] ?? [
        { label: badge.unit, current, target: badge.target },
      ],
    }
  })
  const unlocked = activeClaims.length
  const tier = [...masteryTiers]
    .reverse()
    .find((tier) => unlocked >= tier.count)!
  const showcase = store.showcases.find((s) => s.userId === userId)
  return {
    items,
    summary: {
      unlocked,
      total: achievementCatalog.length,
      tier: tier.name,
      nextMilestone:
        masteryTiers.find((tier) => tier.count > unlocked)?.count ?? null,
      kibbleEarned: Math.max(
        0,
        d.data.kibbleEntries
          .filter(
            (e) =>
              e.userId === userId &&
              ['achievement_awarded', 'achievement_reversed'].includes(
                e.reason,
              ),
          )
          .reduce((sum, e) => sum + e.amount, 0),
      ),
    },
    showcase: {
      badgeIds: showcase?.badgeIds ?? [],
      showMastery: showcase?.showMastery ?? false,
    },
    pendingProofs: store.proofs.filter(
      (p) => p.userId === userId && p.state === 'pending',
    ).length,
    checkedInToday: activity.some(
      (a) => a.kind === 'daily' && manilaDay(a.createdAt) === manilaDay(now),
    ),
  }
}

/** Append corrections in the same transaction as a source change; never rewrite earned history. */
export function reconcileAchievementRewards(d: DemoDraft, now: string) {
  const store = d.workflow?.achievements
  if (!store?.claims.some((c) => c.state === 'active')) return
  for (let pass = 0; pass < achievementCatalog.length; pass++) {
    let changed = false
    for (const userId of new Set(
      store.claims.filter((c) => c.state === 'active').map((c) => c.userId),
    )) {
      if (!d.data.users.some((u) => u.id === userId)) continue
      const overview = achievementOverview(d, userId, now)
      for (const claim of store.claims.filter(
        (c) => c.userId === userId && c.state === 'active',
      )) {
        const badge = achievementCatalog.find((b) => b.id === claim.badgeId)
        const progress = overview.items.find((p) => p.id === claim.badgeId)
        if (
          !badge ||
          badge.historical ||
          !progress ||
          progress.current >= progress.target
        )
          continue
        claim.state = 'revoked'
        claim.version++
        changed = true
        d.data.kibbleEntries.push({
          id: randomUUID(),
          createdAt: now,
          provenance: {
            kind: 'demo',
            label: 'Local demonstration — no real-world action',
          },
          userId,
          amount: -claim.rewardKibble,
          reason: 'achievement_reversed',
          contributionId: claim.id,
          description:
            'Achievement correction: ' +
            badge.title +
            ' no longer meets its reviewed requirements.',
        })
      }
    }
    if (!changed) break
  }
}
export function publicAchievementShowcase(
  d: DemoDraft,
  userId: string,
  now: string,
) {
  const user = d.data.users.find((u) => u.id === userId)
  if (!user?.settings.discoverable || !user.settings.showContributions)
    return { badges: [], mastery: null }
  const overview = achievementOverview(d, userId, now)
  return {
    badges: overview.items
      .filter(
        (item) =>
          item.state === 'unlocked' &&
          overview.showcase.badgeIds.includes(item.id),
      )
      .map((item) => ({
        id: item.id,
        label: achievementCatalog.find((b) => b.id === item.id)!.title,
      })),
    mastery: overview.showcase.showMastery ? overview.summary : null,
  }
}
