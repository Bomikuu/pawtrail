import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import {
  context,
  found,
  fail,
  stamp,
  version,
  attachments,
  page,
  filterScope,
} from '@/lib/server/workflow-context'
import { currentUser } from '@/features/users/service'
import { publicResource } from '@/features/moderation/service'
import { demoClock } from '@/lib/api/clock'
import { findBadge } from './catalog'
import {
  achievementStore,
  achievementOverview,
  manilaDay,
  reconcileAchievementRewards,
} from './engine'
import * as s from './schemas'

export function installAchievements(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.achievements.overview = () =>
    read((d) =>
      s.achievementOverviewSchema.parse(
        achievementOverview(
          d,
          currentUser(d).id,
          demoClock.now().toISOString(),
        ),
      ),
    )
  api.achievements.claim = (badgeId, options) =>
    write('achievements.claim', { badgeId }, options, (d, u, now) => {
      const badge = found(findBadge(badgeId)),
        store = achievementStore(d)
      reconcileAchievementRewards(d, now)
      let row = store.claims.find(
        (c) => c.userId === u.id && c.badgeId === badgeId,
      )
      if (row?.state === 'active') return achievementOverview(d, u.id, now)
      const progress = found(
        achievementOverview(d, u.id, now).items.find(
          (item) => item.id === badgeId,
        ),
      )
      if (progress.current < badge.target)
        fail(
          'Complete the badge requirements before unlocking its reward.',
          409,
        )
      if (row) {
        row.state = 'active'
        row.claimedAt = now
        row.version++
      } else {
        row = {
          id: stamp(now).id,
          userId: u.id,
          badgeId,
          state: 'active',
          claimedAt: now,
          rewardKibble: badge.rewardKibble,
          version: 1,
        }
        store.claims.push(row)
      }
      d.data.kibbleEntries.push({
        ...stamp(now),
        userId: u.id,
        amount: row.rewardKibble,
        reason: 'achievement_awarded',
        contributionId: row.id,
        description: 'Achievement unlocked: ' + badge.title,
      })
      return s.achievementOverviewSchema.parse(
        achievementOverview(d, u.id, now),
      )
    })
  api.achievements.showcase = (input, options) => {
    const p = s.achievementShowcaseInputSchema.parse(input)
    return write('achievements.showcase', p, options, (d, u, now) => {
      const overview = achievementOverview(d, u.id, now)
      if (
        p.badgeIds.some(
          (id) =>
            !overview.items.some(
              (item) => item.id === id && item.state === 'unlocked',
            ),
        )
      )
        fail('Only unlocked badges can be shown on your profile.')
      const store = achievementStore(d),
        current = store.showcases.find((row) => row.userId === u.id)
      if (current) Object.assign(current, p)
      else store.showcases.push({ userId: u.id, ...p })
      return achievementOverview(d, u.id, now)
    })
  }
  api.achievements.record = (input, options) => {
    const p = s.achievementRecordInputSchema.parse(input)
    return write('achievements.record', p, options, (d, u, now) => {
      if (p.kind !== 'daily') {
        if (
          (p.kind === 'discovery' && p.ref.kind !== 'animal') ||
          (p.kind === 'share' &&
            !['animal', 'mission', 'fundraiser'].includes(p.ref.kind))
        )
          fail(
            'This activity does not qualify for discovery or sharing progress.',
          )
        publicResource(d, p.ref)
      }
      const store = achievementStore(d)
      const exists = store.activities.some(
        (a) =>
          a.userId === u.id &&
          a.kind === p.kind &&
          (p.kind === 'daily'
            ? manilaDay(a.createdAt) === manilaDay(now)
            : a.ref?.kind === p.ref.kind && a.ref.id === p.ref.id),
      )
      if (!exists)
        store.activities.push({
          id: stamp(now).id,
          userId: u.id,
          kind: p.kind,
          ref: p.kind === 'daily' ? null : p.ref,
          createdAt: now,
        })
      return achievementOverview(d, u.id, now)
    })
  }
  api.achievements.proofs = (input) => {
    const q = s.achievementProofFiltersSchema.parse(input)
    return read((d) => {
      const u = currentUser(d)
      if (q.scope === 'review' && !u.roles.includes('moderator'))
        fail('Moderator access is required for achievement evidence.', 403)
      return page(
        achievementStore(d)
          .proofs.filter(
            (p) =>
              (q.scope === 'review' || p.userId === u.id) &&
              (!q.state || p.state === q.state) &&
              (!q.badgeId || p.badgeId === q.badgeId),
          )
          .map((proof) => ({
            ...proof,
            submitterName:
              d.data.users.find((user) => user.id === proof.userId)
                ?.displayName ?? 'Member',
          })),
        q,
        'achievement-proofs:' + u.id + ':' + filterScope(q),
      )
    })
  }
  api.achievements.submitProof = (input, options) => {
    const p = s.achievementProofInputSchema.parse(input)
    return write('achievements.proof', p, options, (d, u, now) => {
      const badge = found(findBadge(p.badgeId)),
        store = achievementStore(d)
      if (!badge.proofContext)
        fail(
          'This badge uses recorded activity and does not accept manual evidence.',
        )
      if (
        Date.parse(p.occurredAt) > Date.parse(now) ||
        Date.parse(p.occurredAt) < Date.parse(u.createdAt)
      )
        fail(
          'Choose an activity date between joining PawTrail and the current server date.',
        )
      const ref = { ...p.ref }
      const expectedKind =
        badge.proofContext === 'friend'
          ? 'user'
          : badge.proofContext === 'campaign'
            ? 'fundraiser'
            : badge.proofContext
      if (ref.kind !== expectedKind)
        fail('Choose a relevant record for this badge.')
      if (ref.kind === 'user') {
        const friend = found(
          d.data.users.find(
            (candidate) =>
              candidate.username.toLowerCase() === ref.id.toLowerCase() ||
              candidate.id === ref.id,
          ),
        )
        if (friend.id === u.id)
          fail('A referral must identify a different person.')
        ref.id = friend.id
      }
      const subject = publicResource(d, ref)
      if (
        ref.kind === 'post' &&
        (!('authorId' in subject.row) || subject.row.authorId !== u.id)
      )
        fail('Choose your own published post.', 403)
      if (ref.kind === 'event') {
        const event = found(d.data.events.find((event) => event.id === ref.id))
        if (
          event.state === 'cancelled' ||
          Date.parse(event.endsAt) > Date.parse(now)
        )
          fail(
            'Attendance can be reviewed after a non-cancelled event has ended.',
          )
        if (
          Date.parse(p.occurredAt) < Date.parse(event.startsAt) ||
          Date.parse(p.occurredAt) > Date.parse(event.endsAt)
        )
          fail('The attendance time must fall within the event schedule.')
      }
      const dated = [
        'care-companion',
        'feeding-hero',
        'hydration-helper',
        'recovery-partner',
      ].includes(badge.id)
      const dedupKey =
        badge.id +
        ':' +
        ref.kind +
        ':' +
        ref.id +
        (dated ? ':' + manilaDay(p.occurredAt) : '')
      let row = p.id
        ? found(
            store.proofs.find(
              (proof) => proof.id === p.id && proof.userId === u.id,
            ),
          )
        : undefined
      if (row) {
        version(row, p.expectedVersion)
        if (row.state !== 'rejected' || row.badgeId !== p.badgeId)
          fail('Only your rejected evidence can be revised.', 409)
      }
      if (
        store.proofs.some(
          (proof) =>
            proof.userId === u.id &&
            proof.dedupKey === dedupKey &&
            proof.id !== row?.id,
        )
      )
        fail(
          'Evidence for this activity already exists. Revise the rejected submission or wait for its review.',
          409,
        )
      attachments(d, p.mediaIds, 'private_evidence')
      if (row)
        Object.assign(row, {
          ref,
          occurredAt: p.occurredAt,
          details: p.details,
          mediaIds: p.mediaIds,
          dedupKey,
          updatedAt: now,
          state: 'pending',
          reviewerId: null,
          reason: null,
          version: row.version + 1,
        })
      else {
        row = s.achievementProofSchema.parse({
          id: stamp(now).id,
          userId: u.id,
          badgeId: p.badgeId,
          ref,
          occurredAt: p.occurredAt,
          details: p.details,
          mediaIds: p.mediaIds,
          createdAt: now,
          updatedAt: now,
          dedupKey,
          state: 'pending',
          reviewerId: null,
          reason: null,
          version: 1,
        })
        store.proofs.push(row)
      }
      return row
    })
  }
  api.achievements.review = (input, options) => {
    const p = s.achievementReviewInputSchema.parse(input)
    return write('achievements.review', p, options, (d, u, now) => {
      if (!u.roles.includes('moderator'))
        fail('Moderator access is required.', 403)
      const store = achievementStore(d),
        row = found(store.proofs.find((proof) => proof.id === p.id))
      if (row.userId === u.id)
        fail('You cannot review your own achievement evidence.', 403)
      version(row, p.expectedVersion)
      if (
        row.state !== 'pending' &&
        !(row.state === 'approved' && p.decision === 'rejected')
      )
        fail('Only pending evidence or a prior approval can be reviewed.', 409)
      if (
        p.decision === 'approved' &&
        row.badgeId === 'community-builder' &&
        store.proofs.some(
          (proof) =>
            proof.id !== row.id &&
            proof.badgeId === row.badgeId &&
            proof.ref.id === row.ref.id &&
            proof.state === 'approved',
        )
      )
        fail(
          'This joined account has already been credited as a referral.',
          409,
        )
      row.state = p.decision
      row.reviewerId = u.id
      row.reason = p.reason
      row.version++
      row.updatedAt = now
      reconcileAchievementRewards(d, now)
      return row
    })
  }
}
