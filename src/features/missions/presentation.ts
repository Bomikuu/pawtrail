import type { MissionSummary } from './types'

export function missionStatus(mission: MissionSummary, now: number) {
  if (mission.state === 'closed')
    return { label: 'Closed', tone: 'neutral' as const, actionable: false }
  if (Date.parse(mission.deadline) <= now)
    return { label: 'Expired', tone: 'neutral' as const, actionable: false }
  if (mission.urgency === 'critical' || mission.urgency === 'high')
    return {
      label: 'Urgent · open',
      tone: 'warning' as const,
      actionable: true,
    }
  return { label: 'Open', tone: 'success' as const, actionable: true }
}

/** Filter and order before pagination so every page honors the selected care status. */
export function orderMissions(
  missions: MissionSummary[],
  query: { status?: string; sort?: string; q?: string },
  now: number,
) {
  const search = query.q?.trim().toLocaleLowerCase('en-PH')
  const rows = missions.filter((mission) => {
    const status = missionStatus(mission, now)
    return (
      (!search ||
        `${mission.title} ${mission.location.neighborhood}`
          .toLocaleLowerCase('en-PH')
          .includes(search)) &&
      (!query.status ||
        query.status === 'all' ||
        (query.status === 'open' && status.actionable) ||
        (query.status === 'urgent' &&
          status.actionable &&
          mission.urgency !== 'normal') ||
        (query.status === 'expired' && status.label === 'Expired') ||
        (query.status === 'closed' && mission.state === 'closed'))
    )
  })
  const urgency = { critical: 0, high: 1, normal: 2 }
  return rows.sort((a, b) => {
    if (query.sort === 'priority') {
      const available =
        Number(!missionStatus(a, now).actionable) -
        Number(!missionStatus(b, now).actionable)
      if (available) return available
      const priority = urgency[a.urgency] - urgency[b.urgency]
      if (priority) return priority
    }
    if (query.sort === 'deadline' || query.sort === 'priority') {
      const deadline = Date.parse(a.deadline) - Date.parse(b.deadline)
      if (deadline) return deadline
    }
    return (
      Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
      a.id.localeCompare(b.id)
    )
  })
}
