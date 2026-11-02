import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import {
  context,
  stamp,
  found,
  fail,
  version,
  manage,
  page,
  areaLocation,
  attachments,
} from '@/lib/server/workflow-context'
import { currentUser } from '@/features/users/service'
import { publicSnapshot } from '@/features/moderation/service'
import { kibbleEntrySchema } from '@/features/kibble/schemas'
import { notify } from '@/features/notifications/service'
import * as s from './schemas'

export function installMissions(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.missions.list = (input) => {
    const q = s.missionFiltersSchema.parse(input)
    return read((d) =>
      page(
        publicSnapshot(d)
          .missions.filter(
            (m) =>
              (!q.kind || m.kind === q.kind) &&
              (!q.urgency || m.urgency === q.urgency) &&
              (!q.areaId || m.location.areaId === q.areaId),
          )
          .map((m) => s.missionSummarySchema.parse(m)),
        q,
        `missions:${q.kind ?? ''}:${q.urgency ?? ''}:${q.areaId ?? ''}`,
      ),
    )
  }
  api.missions.get = (slug) =>
    read((d) =>
      s.missionDetailSchema.parse(
        found(
          publicSnapshot(d).missions.find(
            (m) => m.slug === slug || m.id === slug,
          ),
        ),
      ),
    )
  api.missions.create = (input, options) => {
    const p = s.missionInputSchema.parse(input)
    return write('missions.create', p, options, (d, u, now) => {
      if (!u.roles.includes('shelter_staff') && !u.roles.includes('moderator'))
        fail('A shelter organizer or moderator must create missions.', 403)
      if (p.shelterId) manage(u, '', p.shelterId)
      if (p.animalId)
        found(publicSnapshot(d).animals.find((a) => a.id === p.animalId))
      if (p.hordeId)
        found(publicSnapshot(d).hordes.find((h) => h.id === p.hordeId))
      if (Date.parse(p.deadline) <= Date.parse(now))
        fail('Choose a future deadline.')
      const base = stamp(now)
      const row = s.missionDetailSchema.parse({
        ...p,
        ...base,
        slug: `mission-${base.id.slice(0, 8)}`,
        organizerId: u.id,
        state: 'open',
        location: areaLocation(d, p.location.areaId),
        version: 1,
      })
      d.data.missions.push(row)
      if (p.animalId)
        found(d.data.animals.find((a) => a.id === p.animalId)).missionIds.push(
          row.id,
        )
      if (p.hordeId)
        found(d.data.hordes.find((h) => h.id === p.hordeId)).missionIds.push(
          row.id,
        )
      return row
    })
  }
  api.missions.participations = (input) => {
    const q = s.participationFiltersSchema.parse(input)
    return read((d) => {
      const u = currentUser(d)
      return page(
        d.data.participations
          .filter((p) => {
            const m = d.data.missions.find((m) => m.id === p.missionId)
            const scoped =
              q.scope === 'organization'
                ? m &&
                  (m.organizerId === u.id ||
                    (u.roles.includes('shelter_staff') &&
                      u.shelterIds.includes(m.shelterId ?? '')))
                : p.volunteerId === u.id
            return (
              scoped &&
              (!q.missionId || p.missionId === q.missionId) &&
              (!q.state || p.state === q.state)
            )
          })
          .map((p) => s.missionParticipationSchema.parse(p)),
        q,
        `participations:${u.id}:${q.scope ?? 'mine'}:${q.state ?? ''}`,
      )
    })
  }
  api.missions.accept = (missionId, options) =>
    write('missions.accept', { missionId }, options, (d, u, now) => {
      const m = found(
        publicSnapshot(d).missions.find(
          (m) => m.id === missionId && m.state === 'open',
        ),
      )
      if (
        m.organizerId === u.id ||
        (m.shelterId && u.shelterIds.includes(m.shelterId))
      )
        fail('Organizers cannot earn rewards for their own missions.', 403)
      if (Date.parse(m.deadline) <= Date.parse(now))
        fail('This mission has passed its deadline.', 409)
      const prior = d.data.participations.find(
        (p) => p.missionId === missionId && p.volunteerId === u.id,
      )
      if (prior) return prior
      const row = s.missionParticipationSchema.parse({
        ...stamp(now),
        missionId,
        volunteerId: u.id,
        state: 'accepted',
        evidence: null,
        reviewerId: null,
        reviewReason: null,
        version: 1,
      })
      d.data.participations.push(row)
      return row
    })
  api.missions.submit = (id, input, options) => {
    const p = s.missionEvidenceInputSchema.parse(input)
    return write(
      'missions.submit',
      { id, ...p },
      options,
      async (d, u, now) => {
        const row = found(
          d.data.participations.find(
            (r) => r.id === id && r.volunteerId === u.id,
          ),
        )
        version(row, p.expectedVersion)
        if (
          !['accepted', 'rejected'].includes(row.state) ||
          d.data.kibbleEntries.some(
            (e) => e.contributionId === id && e.reason === 'mission_reversed',
          )
        )
          fail('Evidence cannot be changed in this state.', 409)
        const m = found(
          publicSnapshot(d).missions.find(
            (m) => m.id === row.missionId && m.state === 'open',
          ),
        )
        if (Date.parse(m.deadline) <= Date.parse(now))
          fail('The mission deadline has passed.', 409)
        attachments(d, p.mediaIds, 'private_evidence')
        // Grant only the responsible organization access to submitted evidence, never the public.
        for (const media of d.media.filter((m) =>
          p.mediaIds.includes(m.asset.id),
        ))
          media.shelterId = m.shelterId
        row.evidence = p
        row.state = 'submitted'
        row.version++
        await notify({
          draft: d,
          recipientId: m.organizerId,
          kind: 'mission',
          ref: { kind: 'mission', id: m.id },
          now,
        })
        return row
      },
    )
  }
  api.missions.review = (id, input, options) => {
    const p = s.missionReviewInputSchema.parse(input)
    return write(
      'missions.review',
      { id, ...p },
      options,
      async (d, u, now) => {
        const row = found(d.data.participations.find((r) => r.id === id)),
          m = found(d.data.missions.find((m) => m.id === row.missionId))
        manage(u, m.organizerId, m.shelterId)
        version(row, p.expectedVersion)
        if (row.volunteerId === u.id)
          fail('Independent review is required.', 403)
        const reversing = row.state === 'approved' && p.decision === 'rejected'
        if (row.state !== 'submitted' && !reversing)
          fail(
            'Only submitted evidence or a prior approval can be reviewed.',
            409,
          )
        if (p.decision === 'approved' && !row.evidence?.text.trim())
          fail('Evidence is required before approval.')
        row.state = p.decision
        row.reviewedAt = now
        row.reviewerId = u.id
        row.reviewReason = p.reason
        row.version++
        const reason = reversing ? 'mission_reversed' : 'mission_approved'
        if (
          (p.decision === 'approved' || reversing) &&
          !d.data.kibbleEntries.some(
            (e) => e.contributionId === id && e.reason === reason,
          )
        ) {
          const amount = reversing
            ? -d.data.kibbleEntries
                .filter((e) => e.contributionId === id)
                .reduce((n, e) => n + e.amount, 0)
            : m.rewardKibble
          if (amount)
            d.data.kibbleEntries.push(
              kibbleEntrySchema.parse({
                ...stamp(now),
                userId: row.volunteerId,
                amount,
                reason,
                contributionId: id,
                description: reversing
                  ? `Reversed: ${p.reason}`
                  : `Evidence approved: ${m.title}`,
              }),
            )
        }
        const animal = d.data.animals.find((a) => a.id === m.animalId)
        if (
          animal &&
          p.decision === 'approved' &&
          !animal.helperIds.includes(row.volunteerId)
        )
          animal.helperIds.push(row.volunteerId)
        await notify({
          draft: d,
          recipientId: row.volunteerId,
          kind: 'mission',
          ref: { kind: 'mission', id: m.id },
          now,
        })
        return row
      },
    )
  }
}
