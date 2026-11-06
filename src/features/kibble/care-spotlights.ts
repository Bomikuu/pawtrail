import 'server-only'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import { publicSnapshot } from '@/features/moderation/service'
import { personAvatar } from '@/features/users/avatar-presets'

/** Recognition uses public, independently approved help; private evidence never leaves this projection. */
export function careSpotlights(draft: DemoDraft, now: string) {
  const visible = publicSnapshot(draft)
  const users = new Map(
    visible.users
      .filter(
        (user) => user.settings.discoverable && user.settings.showContributions,
      )
      .map((user) => [user.id, user]),
  )
  const missions = new Map(
    visible.missions.map((mission) => [mission.id, mission]),
  )
  const first = new Map<string, { id: string; at: string }>()
  const unknownHistory = new Set<string>()
  for (const participation of draft.data.participations) {
    if (
      participation.state !== 'approved' ||
      !participation.reviewerId ||
      participation.reviewerId === participation.volunteerId
    )
      continue
    const at =
      participation.reviewedAt ??
      draft.data.kibbleEntries.find(
        (entry) =>
          entry.contributionId === participation.id &&
          entry.reason === 'mission_approved',
      )?.createdAt
    if (!at) {
      unknownHistory.add(participation.volunteerId)
      continue
    }
    if (Date.parse(at) > Date.parse(now)) continue
    const previous = first.get(participation.volunteerId)
    if (
      !previous ||
      Date.parse(at) < Date.parse(previous.at) ||
      (at === previous.at && participation.id.localeCompare(previous.id) < 0)
    )
      first.set(participation.volunteerId, { id: participation.id, at })
  }
  const approved = draft.data.participations
    .flatMap((participation) => {
      const user = users.get(participation.volunteerId)
      const mission = missions.get(participation.missionId)
      const reviewedAt =
        participation.reviewedAt ??
        draft.data.kibbleEntries.find(
          (entry) =>
            entry.contributionId === participation.id &&
            entry.reason === 'mission_approved',
        )?.createdAt
      return user &&
        mission &&
        participation.state === 'approved' &&
        participation.reviewerId &&
        participation.reviewerId !== user.id &&
        reviewedAt &&
        Date.parse(reviewedAt) <= Date.parse(now)
        ? [{ participation, user, mission, reviewedAt }]
        : []
    })
    .sort(
      (a, b) =>
        Date.parse(a.reviewedAt) - Date.parse(b.reviewedAt) ||
        a.participation.id.localeCompare(b.participation.id),
    )
  const days = new Map<string, Set<string>>()
  for (const row of approved) {
    if (Date.parse(row.reviewedAt) >= Date.parse(now) - 30 * 86400000) {
      const dates = days.get(row.user.id) ?? new Set<string>()
      dates.add(
        new Date(Date.parse(row.reviewedAt) + 8 * 3600000)
          .toISOString()
          .slice(0, 10),
      )
      days.set(row.user.id, dates)
    }
  }
  const recent = approved
    .filter(
      (row) => Date.parse(row.reviewedAt) >= Date.parse(now) - 30 * 86400000,
    )
    .reverse()
  const isFirst = (userId: string, participationId: string) =>
    !unknownHistory.has(userId) && first.get(userId)?.id === participationId
  const candidates = recent.map((row) => ({
    id: row.participation.id,
    userId: row.user.id,
    displayName: row.user.displayName,
    username: row.user.username,
    avatar: personAvatar(row.user.avatar, row.user.id),
    label: isFirst(row.user.id, row.participation.id)
      ? 'First approved help'
      : (days.get(row.user.id)?.size ?? 0) >= 3
        ? 'Consistent care'
        : 'Recent approved help',
    description: isFirst(row.user.id, row.participation.id)
      ? 'Their first contribution with independently approved evidence.'
      : (days.get(row.user.id)?.size ?? 0) >= 3
        ? `Approved help on ${days.get(row.user.id)!.size} different days in the last 30 days.`
        : 'A practical act of care, independently reviewed.',
    missionTitle: row.mission.title,
    href: `/missions/${encodeURIComponent(row.mission.slug)}`,
    reviewedAt: row.reviewedAt,
  }))
  const selected: typeof candidates = []
  for (const label of [
    'First approved help',
    'Consistent care',
    'Recent approved help',
  ]) {
    const row = candidates.find(
      (candidate) =>
        candidate.label === label &&
        !selected.some((item) => item.userId === candidate.userId),
    )
    if (row) selected.push(row)
  }
  for (const row of candidates) {
    if (selected.length >= 3) break
    if (!selected.some((item) => item.userId === row.userId)) selected.push(row)
  }
  return selected.slice(0, 3)
}
