import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import {
  context,
  workflows,
  stamp,
  found,
  fail,
  version,
  manage,
  registerSubject,
  areaLocation,
  page,
  attachments,
  filterScope,
  orderedPage,
} from '@/lib/server/workflow-context'
import { currentUser } from '@/features/users/service'
import {
  publicSnapshot,
  reconcilePublicMedia,
} from '@/features/moderation/service'
import { toPublicSupporter } from '@/lib/server/projections'
import { listQuerySchema } from '@/lib/api/schemas'
import { notify } from '@/features/notifications/service'
import { postSchema } from '@/features/community/schemas'
import * as s from './schemas'

export function campaignTotals(d: DemoDraft, id: string) {
  const row = found(d.data.fundraisers.find((f) => f.id === id))
  const contributions = d.data.contributions.filter((c) => c.campaignId === id)
  const raisedMinor = contributions.reduce((n, c) => n + c.amountMinor, 0)
  const corrected = new Set(
    row.expenses.flatMap((e) => (e.correctsEntryId ? [e.correctsEntryId] : [])),
  )
  const spent = row.expenses
    .filter((e) => !corrected.has(e.id))
    .reduce((n, e) => n + e.amountMinor, 0)
  const updates = row.updates.flatMap((u) => {
    if (!u.publicationPostId) return [u]
    const post = d.data.posts.find(
      (p) =>
        p.id === u.publicationPostId &&
        p.authorId === u.authorId &&
        p.moderation === 'published' &&
        p.refs.some((r) => r.kind === 'fundraiser' && r.id === id),
    )
    return post ? [{ ...u, text: post.text, media: post.media }] : []
  })
  return s.campaignDetailSchema.parse({
    ...row,
    updates,
    raisedMinor,
    balanceMinor: raisedMinor - spent,
    supporterCount: new Set(contributions.map((c) => c.contributorId)).size,
  })
}
export function installFundraising(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.fundraisers.list = (input) => {
    const q = s.campaignFiltersSchema.parse(input)
    return read((d) => {
      const rank = { critical: 0, high: 1, normal: 2 }
      const rows = publicSnapshot(d)
        .fundraisers.map((f) => campaignTotals(d, f.id))
        .filter(
          (f) =>
            (!q.category || f.category === q.category) &&
            (!q.state || f.state === q.state) &&
            (!q.urgency || f.urgency === q.urgency) &&
            (!q.areaId || f.location.areaId === q.areaId) &&
            (!q.nearlyFunded ||
              (f.state === 'active' &&
                f.raisedMinor >= f.goalMinor * 0.8 &&
                f.raisedMinor < f.goalMinor)),
        )
      if (q.sort === 'urgent')
        rows.sort(
          (a, b) =>
            rank[a.urgency] - rank[b.urgency] || a.id.localeCompare(b.id),
        )
      return q.sort === 'urgent'
        ? orderedPage(
            rows
              .filter(
                (r) =>
                  !q.q ||
                  `${r.title} ${r.story}`
                    .toLowerCase()
                    .includes(q.q.toLowerCase()),
              )
              .map((f) => s.campaignSummarySchema.parse(f)),
            q,
            `fundraisers:urgent:${filterScope(q)}`,
          )
        : page(
            rows.map((f) => s.campaignSummarySchema.parse(f)),
            q,
            `fundraisers:${filterScope(q)}`,
          )
    })
  }
  api.fundraisers.get = (slug) =>
    read((d) => {
      const row = found(
        d.data.fundraisers.find((f) => f.slug === slug || f.id === slug),
      )
      if (!publicSnapshot(d).fundraisers.some((f) => f.id === row.id)) {
        const u = d.data.users.find((u) => u.id === d.auth.actorId)
        if (
          !u ||
          (row.organizerId !== u.id &&
            !(
              u.roles.includes('shelter_staff') &&
              u.shelterIds.includes(row.shelterId ?? '')
            ))
        )
          fail('Campaign not found', 404)
      }
      return campaignTotals(d, row.id)
    })
  api.fundraisers.supporters = (id, input) => {
    const q = listQuerySchema.parse(input)
    return read((d) => {
      found(publicSnapshot(d).fundraisers.find((f) => f.id === id))
      return page(
        d.data.contributions
          .filter((c) => c.campaignId === id)
          .map((c) =>
            toPublicSupporter(
              c,
              d.data.users.find((u) => u.id === c.contributorId),
            ),
          ),
        q,
        `supporters:${id}`,
      )
    })
  }
  api.fundraisers.simulateDonation = (id, input, options) => {
    const p = s.demoDonationInputSchema.parse(input)
    return write(
      'fundraisers.simulateDonation',
      { id, ...p },
      options,
      async (d, u, now) => {
        const f = found(
          publicSnapshot(d).fundraisers.find(
            (f) => f.id === id && f.state === 'active',
          ),
        )
        const raised = campaignTotals(d, id).raisedMinor + p.amountMinor
        if (!Number.isSafeInteger(raised))
          fail('The resulting amount is too large.')
        const row = s.demoContributionSchema.parse({
          ...stamp(now),
          ...p,
          campaignId: id,
          contributorId: u.id,
          currency: 'PHP',
          simulated: true,
        })
        d.data.contributions.push(row)
        const animal = d.data.animals.find((a) => a.id === f.animalId)
        if (animal && !p.anonymous && !animal.helperIds.includes(u.id))
          animal.helperIds.push(u.id)
        const live = found(d.data.fundraisers.find((r) => r.id === id)),
          totals = campaignTotals(d, id)
        Object.assign(live, {
          raisedMinor: totals.raisedMinor,
          balanceMinor: totals.balanceMinor,
          supporterCount: totals.supporterCount,
        })
        await notify({
          draft: d,
          recipientId: f.organizerId,
          kind: 'fundraiser',
          ref: { kind: 'fundraiser', id },
          now,
        })
        return row
      },
    )
  }
  api.fundraisers.drafts = (input) => {
    const q = listQuerySchema.parse(input)
    return read((d) =>
      page(
        workflows(d)
          .campaignDrafts.filter((r) => r.actorId === currentUser(d).id)
          .map((r) => ({
            id: r.id,
            createdAt: r.createdAt,
            provenance: { kind: 'demo' as const, label: 'Private demo draft' },
            title: r.values.title ?? 'Untitled fundraiser',
            version: r.version,
          })),
        q,
        `campaign-drafts:${d.auth.actorId}`,
      ),
    )
  }
  api.fundraisers.draft = (id) =>
    read((d) => {
      const r = found(
        workflows(d).campaignDrafts.find(
          (r) => r.id === id && r.actorId === currentUser(d).id,
        ),
      )
      return { id: r.id, expectedVersion: r.version, values: r.values }
    })
  api.fundraisers.saveDraft = (input, options) => {
    const p = s.campaignDraftSchema.parse(input)
    return write('fundraisers.saveDraft', p, options, (d, u, now) => {
      attachments(d, p.values.mediaIds ?? [], 'public_image')
      attachments(d, p.values.privateEvidenceIds ?? [], 'private_evidence')
      let r = p.id
        ? found(
            workflows(d).campaignDrafts.find(
              (r) => r.id === p.id && r.actorId === u.id,
            ),
          )
        : undefined
      if (r) {
        version(r, p.expectedVersion)
        r.values = p.values
        r.version++
      } else {
        r = {
          id: stamp(now).id,
          actorId: u.id,
          createdAt: now,
          version: 1,
          values: p.values,
        }
        workflows(d).campaignDrafts.push(r)
      }
      return { id: r.id, expectedVersion: r.version, values: r.values }
    })
  }
  api.fundraisers.create = (input, options) => {
    const p = s.campaignInputSchema.parse(input)
    return write('fundraisers.create', p, options, (d, u, now) => {
      if (p.shelterId) manage(u, '', p.shelterId)
      if (p.animalId)
        found(publicSnapshot(d).animals.find((a) => a.id === p.animalId))
      if (p.hordeId)
        found(publicSnapshot(d).hordes.find((h) => h.id === p.hordeId))
      if (p.budget.reduce((n, r) => n + r.amountMinor, 0) > p.goalMinor)
        fail('Estimated budget entries must not exceed the stated goal.')
      if (p.draftId)
        version(
          found(
            workflows(d).campaignDrafts.find(
              (r) => r.id === p.draftId && r.actorId === u.id,
            ),
          ),
          p.expectedVersion,
        )
      const base = stamp(now)
      const row = s.campaignDetailSchema.parse({
        ...base,
        slug: `campaign-${base.id.slice(0, 8)}`,
        title: p.title,
        story: p.story,
        category: p.category,
        urgency: p.urgency,
        goalMinor: p.goalMinor,
        currency: p.currency,
        animalId: p.animalId,
        shelterId: p.shelterId,
        location: areaLocation(d, p.location.areaId),
        organizerId: u.id,
        state: 'pending_review',
        raisedMinor: 0,
        balanceMinor: 0,
        supporterCount: 0,
        photo: null,
        gallery: [],
        updates: [],
        expenses: [],
        payoutStatus: 'demo_no_payout',
        version: 1,
        verification: {
          status: 'unverified',
          label: 'Awaiting independent review',
          evidenceRefs: [],
        },
      })
      d.data.fundraisers.push(row)
      row.hordeId = p.hordeId
      row.budget = p.budget
      row.timeline = p.timeline
      registerSubject(
        d,
        { kind: 'fundraiser', id: row.id },
        [u.id],
        p.privateEvidenceIds,
        p.mediaIds,
        'pending',
        1,
      )
      if (p.draftId)
        workflows(d).campaignDrafts = workflows(d).campaignDrafts.filter(
          (r) => r.id !== p.draftId,
        )
      if (p.animalId)
        found(
          d.data.animals.find((a) => a.id === p.animalId),
        ).fundraiserIds.push(row.id)
      if (p.hordeId)
        found(d.data.hordes.find((h) => h.id === p.hordeId)).fundraiserIds.push(
          row.id,
        )
      return row
    })
  }
  api.fundraisers.update = (id, input, options) => {
    const p = s.campaignUpdateInputSchema.parse(input)
    return write('fundraisers.update', { id, ...p }, options, (d, u) => {
      const f = found(d.data.fundraisers.find((f) => f.id === id))
      manage(u, f.organizerId, f.shelterId)
      version(f, p.expectedVersion)
      if (['completed', 'closed'].includes(f.state))
        fail('This campaign is closed.', 409)
      if (
        (f.state === 'active' ||
          d.data.contributions.some((c) => c.campaignId === id)) &&
        ((p.goalMinor !== undefined && p.goalMinor !== f.goalMinor) ||
          (p.animalId !== undefined && p.animalId !== f.animalId) ||
          (p.shelterId !== undefined && p.shelterId !== f.shelterId) ||
          (p.category && p.category !== f.category) ||
          (p.currency && p.currency !== f.currency))
      )
        fail(
          'Funding goal and beneficiary are immutable after publication or support. Create a new reviewed campaign.',
          409,
        )
      const metadata = d.moderation.subjects.find(
        (s) => s.ref.kind === 'fundraiser' && s.ref.id === id,
      )
      const old = f.gallery.map((m) => m.id)
      if (
        (f.state === 'active' ||
          d.data.contributions.some((c) => c.campaignId === id)) &&
        p.hordeId !== undefined &&
        p.hordeId !== f.hordeId
      )
        fail('A supported campaign cannot change its Horde beneficiary.', 409)
      if (p.hordeId !== undefined) f.hordeId = p.hordeId
      if (p.budget) f.budget = p.budget
      if (p.timeline !== undefined) f.timeline = p.timeline
      for (const k of [
        'title',
        'story',
        'urgency',
        'goalMinor',
        'animalId',
        'shelterId',
        'category',
      ] as const)
        if (p[k] !== undefined) Object.assign(f, { [k]: p[k] })
      f.version++
      f.state = 'pending_review'
      if (p.mediaIds !== undefined) {
        f.photo = null
        f.gallery = []
      }
      f.verification = {
        status: 'unverified',
        label: 'Changed; awaiting independent review',
        evidenceRefs: [],
      }
      registerSubject(
        d,
        { kind: 'fundraiser', id },
        [f.organizerId],
        p.privateEvidenceIds ?? metadata?.evidenceIds ?? [],
        p.mediaIds ?? metadata?.photoIds ?? [],
        'pending',
        f.version,
      )
      reconcilePublicMedia(d, old)
      return campaignTotals(d, id)
    })
  }
  api.fundraisers.addUpdate = (id, input, options) => {
    const p = s.campaignStoryUpdateInputSchema.parse(input)
    return write(
      'fundraisers.addUpdate',
      { id, ...p },
      options,
      async (d, u, now) => {
        const f = found(d.data.fundraisers.find((f) => f.id === id))
        manage(u, f.organizerId, f.shelterId)
        if (f.state !== 'active')
          fail('Only active campaigns accept updates.', 409)
        let publicationPostId: string | null = null
        if (p.mediaIds.length) {
          if (p.text.length > 2000)
            fail('Photo updates support up to 2,000 characters.')
          attachments(d, p.mediaIds, 'public_image')
          const post = postSchema.parse({
            ...stamp(now),
            authorId: u.id,
            text: p.text,
            type: 'help',
            refs: [
              { kind: 'fundraiser', id },
              ...(f.animalId &&
              publicSnapshot(d).animals.some((a) => a.id === f.animalId)
                ? [{ kind: 'animal', id: f.animalId }]
                : []),
              ...(f.hordeId &&
              publicSnapshot(d).hordes.some((h) => h.id === f.hordeId)
                ? [{ kind: 'horde', id: f.hordeId }]
                : []),
            ],
            media: [],
            moderation: 'pending',
            reactionCount: 0,
            commentCount: 0,
            version: 1,
          })
          d.data.posts.push(post)
          d.community.attachments.push({
            postId: post.id,
            mediaIds: p.mediaIds,
          })
          publicationPostId = post.id
        }
        const row = s.campaignStoryUpdateSchema.parse({
          ...stamp(now),
          campaignId: id,
          authorId: u.id,
          text: p.text,
          media: [],
          publicationPostId,
        })
        f.updates.push(row)
        f.version++
        if (!publicationPostId)
          for (const recipientId of new Set(
            d.data.contributions
              .filter((c) => c.campaignId === id)
              .map((c) => c.contributorId),
          ))
            await notify({
              draft: d,
              recipientId,
              kind: 'fundraiser',
              ref: { kind: 'fundraiser', id },
              now,
            })
        return row
      },
    )
  }
  api.fundraisers.addExpense = (id, input, options) => {
    const p = s.expenseInputSchema.parse(input)
    return write(
      'fundraisers.addExpense',
      { id, ...p },
      options,
      (d, u, now) => {
        const f = found(d.data.fundraisers.find((f) => f.id === id))
        manage(u, f.organizerId, f.shelterId)
        if (f.state !== 'active')
          fail('Only active campaigns accept expenses.', 409)
        const original = p.correctsEntryId
          ? found(f.expenses.find((e) => e.id === p.correctsEntryId))
          : null
        if (
          original &&
          f.expenses.some((e) => e.correctsEntryId === original.id)
        )
          fail('Correct the latest entry in this correction chain.', 409)
        if (
          p.amountMinor >
          campaignTotals(d, id).balanceMinor + (original?.amountMinor ?? 0)
        )
          fail('Recorded spending cannot exceed simulated available funds.')
        attachments(d, p.receiptIds, 'private_evidence')
        const row = s.expenseEntrySchema.parse({
          ...stamp(now),
          ...p,
          correctsEntryId: p.correctsEntryId ?? null,
          campaignId: id,
          authorId: u.id,
        })
        f.expenses.push(row)
        workflows(d).expenseReceipts.push({
          expenseId: row.id,
          campaignId: id,
          mediaIds: p.receiptIds,
        })
        for (const m of d.media.filter((m) =>
          p.receiptIds.includes(m.asset.id),
        ))
          m.shelterId = f.shelterId
        f.version++
        f.balanceMinor = campaignTotals(d, id).balanceMinor
        return row
      },
    )
  }
  api.fundraisers.close = (id, options) =>
    write('fundraisers.close', { id }, options, async (d, u, now) => {
      const f = found(d.data.fundraisers.find((f) => f.id === id))
      manage(u, f.organizerId, f.shelterId)
      if (f.state !== 'active')
        fail('Only an active campaign can be closed.', 409)
      f.state = 'closed'
      f.version++
      for (const recipientId of new Set(
        d.data.contributions
          .filter((c) => c.campaignId === id)
          .map((c) => c.contributorId),
      ))
        await notify({
          draft: d,
          recipientId,
          kind: 'fundraiser',
          ref: { kind: 'fundraiser', id },
          now,
        })
      return campaignTotals(d, id)
    })
  api.fundraisers.dashboard = () =>
    read((d) => {
      const u = currentUser(d),
        campaigns = d.data.fundraisers
          .filter(
            (f) =>
              f.organizerId === u.id ||
              (u.roles.includes('shelter_staff') &&
                u.shelterIds.includes(f.shelterId ?? '')),
          )
          .map((f) => campaignTotals(d, f.id))
      return {
        receipts: workflows(d)
          .expenseReceipts.filter((r) =>
            campaigns.some((f) => f.id === r.campaignId),
          )
          .map((r) => ({ expenseId: r.expenseId, mediaIds: r.mediaIds })),
        campaigns: campaigns.map((f) => s.campaignSummarySchema.parse(f)),
        contributionCount: d.data.contributions.filter((c) =>
          campaigns.some((f) => f.id === c.campaignId),
        ).length,
        totalRaisedMinor: campaigns.reduce((n, f) => n + f.raisedMinor, 0),
      }
    })
}
