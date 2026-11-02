import 'server-only'
import { randomUUID } from 'node:crypto'
import type { FixtureSeed } from '@/data/fixtures'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import type {
  ResourceRef,
  ModerationState,
  RequestOptions,
} from '@/types/common'
import { actorSchema } from '@/features/auth/schemas'
import { commentInputSchema, commentSchema } from '@/features/community/schemas'
import { freshModeration } from '@/lib/server/demo/migrations'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { getApiConfig } from '@/lib/api/config'
import { listQuerySchema, resourceRefSchema } from '@/lib/api/schemas'
import { paginate } from '@/lib/api/pagination'
import { parseInput, parseResponse } from '@/lib/api/validation'
import { can } from '@/lib/server/permissions'
import { publicMedia } from '@/lib/server/media/delivery'
import {
  moderationDecisionSchema,
  moderationFiltersSchema,
  moderationItemSchema,
  reportInputSchema,
  reportSchema,
} from './schemas'
import type { ModerationItem } from './types'
const provenance = { kind: 'demo' as const, label: 'Illustrative demo review' }
const same = (a: ResourceRef, b: ResourceRef) =>
  a.kind === b.kind && a.id === b.id
const collections = {
  animal: 'animals',
  post: 'posts',
  shelter: 'shelters',
  fundraiser: 'fundraisers',
  horde: 'hordes',
  mission: 'missions',
  event: 'events',
  user: 'users',
} as const
function missing(): never {
  throw new ApiError('NOT_FOUND', 'Record not found', 404)
}
function denied(): never {
  throw new ApiError(
    'FORBIDDEN',
    'Independent authorized reviewer required',
    403,
  )
}
function invalid(message: string): never {
  throw new ApiError('VALIDATION_ERROR', message, 400)
}
function actor(draft: DemoDraft) {
  const user = draft.data.users.find((u) => u.id === draft.auth.actorId)
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
  return actorSchema.parse(user)
}
function moderator(draft: DemoDraft) {
  const user = actor(draft)
  if (!can(user, 'moderate')) denied()
  return user
}
function subject(draft: DemoDraft, ref: ResourceRef) {
  const row = draft.data[collections[ref.kind]].find((r) => r.id === ref.id)
  if (!row) return missing()
  const metadata = draft.moderation.subjects.find((s) => same(s.ref, ref))
  const state: ModerationState =
    'moderation' in row
      ? row.moderation
      : (metadata?.state ??
        (ref.kind === 'fundraiser' && 'state' in row
          ? ['active', 'completed', 'closed'].includes(row.state)
            ? 'published'
            : row.state === 'rejected'
              ? 'rejected'
              : 'pending'
          : 'published'))
  const creators =
    'authorId' in row
      ? [row.authorId]
      : 'ownerId' in row
        ? [row.ownerId]
        : 'organizerId' in row
          ? [row.organizerId]
          : ref.kind === 'user'
            ? [row.id]
            : (metadata?.creatorIds ?? [])
  return {
    row,
    metadata,
    state,
    creators: creators.filter((id): id is string => !!id),
    version: 'version' in row ? row.version : (metadata?.version ?? 1),
  }
}
/** Re-used by public projections and discussion guards. Unknown and withdrawn records fail closed. */
export function publicResource(draft: DemoDraft, ref: ResourceRef) {
  const result = subject(draft, ref)
  if (
    result.state !== 'published' ||
    ('settings' in result.row && !result.row.settings.discoverable)
  )
    missing()
  return result
}
function mayVerify(draft: DemoDraft, ref: ResourceRef) {
  const user = actor(draft)
  const { creators, row, metadata } = subject(draft, ref)
  if (
    !['animal', 'shelter', 'fundraiser'].includes(ref.kind) ||
    !creators.length ||
    !can(user, 'verify', { creatorId: creators[0] }) ||
    creators.includes(user.id)
  )
    return false
  if (ref.kind === 'shelter') {
    if (!metadata || !metadata.creatorIds.length) return false
    if (
      user.shelterIds.includes(ref.id) ||
      ('staffIds' in row && row.staffIds.includes(user.id))
    )
      return false
  }
  return true
}
/** Role is necessary but never sufficient: the image must belong to an active subject. */
export function mayReviewMedia(draft: DemoDraft, mediaId: string) {
  if (!draft.auth.actorId) return false
  const user = actor(draft)
  if (!can(user, 'moderate')) return false
  const media = draft.media.find((m) => m.asset.id === mediaId)
  if (!media?.attached) return false
  if (media.purpose === 'public_image')
    return draft.community.attachments.some(
      (a) =>
        a.mediaIds.includes(mediaId) &&
        draft.data.posts.some(
          (p) =>
            p.id === a.postId &&
            p.authorId === media.ownerId &&
            p.moderation === 'pending',
        ),
    )
  return draft.moderation.subjects.some(
    (s) =>
      s.evidenceIds.includes(mediaId) &&
      subject(draft, s.ref).state === 'published' &&
      mayVerify(draft, s.ref) &&
      (s.creatorIds.includes(media.ownerId) ||
        (s.ref.kind === 'shelter' && media.shelterId === s.ref.id)),
  )
}
function notify(
  draft: DemoDraft,
  recipientId: string,
  kind: 'comment' | 'moderation',
  ref: ResourceRef,
  message: string,
  now: string,
) {
  draft.moderation.notifications.push({
    id: randomUUID(),
    createdAt: now,
    provenance,
    recipientId,
    kind,
    ref,
    message,
    readAt: null,
  })
}
function commentView(draft: DemoDraft, row: FixtureSeed['comments'][number]) {
  const user = publicSnapshot(draft).users.find((u) => u.id === row.authorId)
  const visible = user?.settings.discoverable && user.settings.showContributions
  return parseResponse(commentSchema, {
    ...row,
    authorId: visible ? row.authorId : null,
    author: {
      displayName: visible ? user.displayName : 'Community member',
      username: visible ? user.username : null,
    },
    viewerOwns: row.authorId === draft.auth.actorId,
  })
}
function items(draft: DemoDraft): ModerationItem[] {
  const user = moderator(draft)
  const result: ModerationItem[] = []
  for (const kind of Object.keys(collections) as ResourceRef['kind'][]) {
    for (const row of draft.data[collections[kind]]) {
      const ref = { kind, id: row.id }
      const s = subject(draft, ref)
      const reports = draft.moderation.reports.filter((r) =>
        same(r.target, ref),
      )
      // Unsupported management domains appear only when explicitly reported.
      if (
        !['post', 'animal', 'shelter', 'fundraiser'].includes(kind) &&
        !reports.length
      )
        continue
      const mediaIds =
        kind === 'post' && s.state === 'pending'
          ? (draft.community.attachments.find((a) => a.postId === row.id)
              ?.mediaIds ?? [])
          : []
      const evidenceIds = mayVerify(draft, ref)
        ? (s.metadata?.evidenceIds ?? []).filter((id) =>
            mayReviewMedia(draft, id),
          )
        : []
      const media = [...mediaIds, ...evidenceIds].flatMap((id) => {
        const item = draft.media.find((m) => m.asset.id === id)
        return item && !item.approved && mayReviewMedia(draft, id)
          ? [{ ...item.asset, sensitive: item.sensitive }]
          : []
      })
      const common = {
        createdAt: row.createdAt,
        provenance: row.provenance,
        ref,
        creatorId: s.creators[0] ?? null,
        state: s.state,
        version: s.version,
        reportCount: reports.length,
        reports: reports.map((r) => ({ reason: r.reason, details: r.details })),
        title:
          'name' in row
            ? row.name
            : 'title' in row
              ? row.title
              : kind === 'post'
                ? 'Community story'
                : 'Community profile',
        text:
          'text' in row
            ? row.text
            : 'description' in row
              ? row.description
              : 'story' in row
                ? row.story
                : '',
        publicImages:
          'gallery' in row
            ? row.gallery
            : 'media' in row
              ? row.media
              : 'photo' in row && row.photo
                ? [row.photo]
                : [],
        media,
        evidenceIds,
        canVerify: mayVerify(draft, ref),
        verification: 'verification' in row ? row.verification : null,
      }
      result.push(
        parseResponse(moderationItemSchema, {
          ...common,
          id: `publication:${kind}:${row.id}`,
          kind: 'publication',
        }),
      )
      if (['animal', 'shelter', 'fundraiser'].includes(kind))
        result.push(
          parseResponse(moderationItemSchema, {
            ...common,
            id: `verification:${kind}:${row.id}`,
            kind: 'verification',
          }),
        )
    }
  }
  for (const row of draft.data.comments) {
    let parent
    try {
      parent = publicResource(draft, row.ref)
    } catch {
      continue
    }
    if (!parent || !user) continue
    result.push(
      parseResponse(moderationItemSchema, {
        id: `publication:comment:${row.id}`,
        createdAt: row.createdAt,
        provenance: row.provenance,
        ref: row.ref,
        commentId: row.id,
        creatorId: row.authorId,
        kind: 'publication',
        state: row.moderation,
        version: row.version,
        reportCount: 0,
        reports: [],
        title: 'Discussion comment',
        text: row.text,
        publicImages: [],
        media: [],
        evidenceIds: [],
        canVerify: false,
        verification: null,
      }),
    )
  }
  return result
}
function publishPostPhotos(draft: DemoDraft, id: string) {
  const post = draft.data.posts.find((p) => p.id === id)!
  const ids =
    draft.community.attachments.find((a) => a.postId === id)?.mediaIds ??
    post.media.map((image) => image.id)
  post.media = ids.flatMap((mediaId) => {
    const existing = post.media.find((m) => m.id === mediaId)
    const item = draft.media.find((m) => m.asset.id === mediaId)
    if (!item) {
      if (existing) return [existing]
      return missing()
    }
    if (
      item.ownerId !== post.authorId ||
      !item.attached ||
      item.purpose !== 'public_image' ||
      item.asset.mimeType === 'application/pdf'
    )
      invalid(
        'Only attached public-eligible author photographs may be published',
      )
    item.approved = true
    item.asset.visibility = 'public'
    item.asset.url = `/api/v1/media/${mediaId}/public`
    return [publicMedia(item)]
  })
}
export function postMediaIds(draft: DemoDraft, id: string): string[] {
  return [
    ...(draft.community.attachments.find((a) => a.postId === id)?.mediaIds ??
      []),
    ...(draft.data.posts
      .find((post) => post.id === id)
      ?.media.map((image) => image.id) ?? []),
  ]
}
/** Reconcile after changing references, on the same draft as the content mutation. */
export function reconcilePublicMedia(draft: DemoDraft, ids: string[]) {
  const publicData = publicSnapshot(draft)
  for (const mediaId of new Set(ids)) {
    const referenced = (value: unknown): boolean => {
      if (Array.isArray(value)) return value.some(referenced)
      if (!value || typeof value !== 'object') return false
      const row = value as Record<string, unknown>
      return (
        (row.id === mediaId && row.url === `/api/v1/media/${mediaId}/public`) ||
        Object.values(row).some(referenced)
      )
    }
    if (referenced(publicData)) continue
    const item = draft.media.find((m) => m.asset.id === mediaId)
    if (item) {
      item.approved = false
      item.asset.visibility = 'private'
      item.asset.url = `/api/v1/media/${mediaId}/content`
    }
  }
}
export function createModerationService(
  snapshot: FixtureSeed,
  repository?: DemoRepository,
) {
  const anonymous: DemoDraft = {
    data: snapshot,
    auth: { actorId: null, cacheScope: 'anonymous' },
    media: [],
    community: { follows: [], reactions: [], saved: [], attachments: [] },
    savedAnimals: [],
    moderation: freshModeration(),
  }
  const read = <T>(fn: (draft: DemoDraft) => T) =>
    repository ? repository.read(fn) : Promise.resolve(fn(anonymous))
  async function command<T>(
    name: string,
    input: unknown,
    options: RequestOptions | undefined,
    fn: (draft: DemoDraft, now: string) => T,
  ) {
    checkCancelled(options?.signal)
    if (getApiConfig().mode !== 'mock') denied()
    if (!repository)
      throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
    return repository.transact({
      name,
      input,
      idempotencyKey: options?.idempotencyKey,
      execute(draft, clock) {
        checkCancelled(options?.signal)
        actor(draft)
        return fn(draft, clock.now().toISOString())
      },
    })
  }
  const community: Pick<PawTrailApi['community'], 'comments' | 'comment'> = {
    async comments(ref, query, options) {
      checkCancelled(options?.signal)
      const target = parseInput(resourceRefSchema, ref)
      const valid = parseInput(listQuerySchema, query)
      return read((draft) => {
        publicResource(draft, target)
        const rows = draft.data.comments.filter(
          (c) =>
            same(c.ref, target) &&
            (c.moderation === 'published' ||
              (c.moderation !== 'removed' &&
                c.authorId === draft.auth.actorId)) &&
            (!valid.q || c.text.toLowerCase().includes(valid.q.toLowerCase())),
        )
        return paginate(
          rows.map((c) => commentView(draft, c)),
          valid,
          `comments:${draft.auth.cacheScope}:${target.kind}:${target.id}:${valid.q ?? ''}`,
        )
      })
    },
    async comment(ref, input, options) {
      const target = parseInput(resourceRefSchema, ref)
      const valid = parseInput(commentInputSchema, input)
      const id = await command(
        'community.comment',
        { ref: target, ...valid },
        options,
        (draft, now) => {
          if (!can(actor(draft), 'contribute')) denied()
          publicResource(draft, target)
          const row = {
            id: randomUUID(),
            createdAt: now,
            provenance: {
              kind: 'demo' as const,
              label: 'Demo community comment',
            },
            ref: target,
            authorId: draft.auth.actorId!,
            text: valid.text,
            moderation: 'pending' as const,
            version: 1,
          }
          draft.data.comments.push(row)
          return row.id
        },
      )
      return read((draft) => {
        publicResource(draft, target)
        const row = draft.data.comments.find(
          (c) =>
            c.id === id &&
            c.authorId === draft.auth.actorId &&
            c.moderation !== 'removed',
        )
        if (!row) return missing()
        return commentView(draft, row)
      })
    },
  }
  const moderation: PawTrailApi['moderation'] = {
    async report(input, options) {
      const valid = parseInput(reportInputSchema, input)
      const id = await command(
        'moderation.report',
        { ...valid, details: valid.details ?? '' },
        options,
        (draft, now) => {
          if (!can(actor(draft), 'contribute')) denied()
          publicResource(draft, valid.target)
          const report = {
            id: randomUUID(),
            createdAt: now,
            provenance,
            ...valid,
            details: valid.details ?? '',
            reporterId: draft.auth.actorId!,
          }
          draft.moderation.reports.push(report)
          for (const reviewer of draft.data.users.filter((user) =>
            user.roles.includes('moderator'),
          ))
            notify(
              draft,
              reviewer.id,
              'moderation',
              valid.target,
              'A new reported concern needs review.',
              now,
            )
          return report.id
        },
      )
      return read((draft) => {
        const report = draft.moderation.reports.find(
          (r) => r.id === id && r.reporterId === draft.auth.actorId,
        )
        if (!report) return missing()
        return parseResponse(reportSchema, report)
      })
    },
    async queue(filters, options) {
      checkCancelled(options?.signal)
      const valid = parseInput(moderationFiltersSchema, filters)
      return read((draft) =>
        paginate(
          items(draft).filter(
            (i) =>
              (!valid.state || i.state === valid.state) &&
              (!valid.kind || i.kind === valid.kind) &&
              (!valid.q ||
                `${i.title} ${i.text}`
                  .toLowerCase()
                  .includes(valid.q.toLowerCase())),
          ),
          valid,
          `moderation:${draft.auth.cacheScope}:${JSON.stringify({ state: valid.state, kind: valid.kind, q: valid.q })}`,
        ),
      )
    },
    async review(input, options) {
      const valid = parseInput(moderationDecisionSchema, input)
      await command('moderation.review', valid, options, (draft, now) => {
        const user = moderator(draft)
        const item = items(draft).find((i) => i.id === valid.id)
        if (!item) return missing()
        if (item.version !== valid.expectedVersion)
          throw new ApiError(
            'CONFLICT',
            'This record changed. Reload the review before deciding.',
            409,
          )
        const verifying = ['verify', 'revoke_verification'].includes(
          valid.action,
        )
        if (verifying !== (item.kind === 'verification'))
          invalid('Publication and verification require separate review items')
        if (verifying) {
          if (!mayVerify(draft, item.ref)) denied()
          if (item.state !== 'published')
            invalid('Publish the subject before verification review')
          if (
            !valid.evidenceRefs.length ||
            new Set(valid.evidenceRefs).size !== valid.evidenceRefs.length ||
            valid.evidenceRefs.some((id) => !item.evidenceIds.includes(id))
          )
            invalid('Choose attached, eligible subject evidence')
          const s = subject(draft, item.ref)
          if (!('verification' in s.row))
            invalid('This subject cannot be verified')
          s.row.verification = {
            status: valid.action === 'verify' ? 'illustrative' : 'unverified',
            label:
              valid.action === 'verify'
                ? 'Illustrative evidence review — demo only'
                : 'Verification revoked after review',
            evidenceRefs: [],
          }
        } else {
          if (valid.evidenceRefs.length)
            invalid('Publication does not confer verification')
          if (
            (valid.action === 'publish' || valid.action === 'reject') &&
            item.state !== 'pending'
          )
            invalid('Only pending content can be published or rejected')
          if (valid.action === 'remove' && item.state === 'removed')
            invalid('Content is already removed')
          const state =
            valid.action === 'publish'
              ? 'published'
              : valid.action === 'reject'
                ? 'rejected'
                : 'removed'
          if (item.commentId) {
            const comment = draft.data.comments.find(
              (c) => c.id === item.commentId,
            )!
            const before = comment.moderation
            comment.moderation = state
            comment.version++
            if (item.ref.kind === 'post') {
              const post = draft.data.posts.find((p) => p.id === item.ref.id)!
              post.commentCount = Math.max(
                0,
                post.commentCount +
                  Number(state === 'published') -
                  Number(before === 'published'),
              )
            }
            if (state === 'published')
              for (const owner of subject(draft, item.ref).creators)
                if (owner !== comment.authorId)
                  notify(
                    draft,
                    owner,
                    'comment',
                    item.ref,
                    'A reviewed comment was added to your story.',
                    now,
                  )
          } else {
            const s = subject(draft, item.ref)
            if ('moderation' in s.row) s.row.moderation = state
            if (item.ref.kind === 'fundraiser' && 'state' in s.row)
              s.row.state = state === 'published' ? 'active' : 'rejected'
            if (!s.metadata)
              draft.moderation.subjects.push({
                ref: item.ref,
                creatorIds: s.creators,
                evidenceIds: [],
                version: s.version,
                state,
              })
            else s.metadata.state = state
            if (item.ref.kind === 'post') {
              if (state === 'published') publishPostPhotos(draft, item.ref.id)
              else reconcilePublicMedia(draft, postMediaIds(draft, item.ref.id))
            }
          }
        }
        if (!item.commentId) {
          const s = subject(draft, item.ref)
          if ('version' in s.row) s.row.version++
          if (s.metadata) s.metadata.version = item.version + 1
        }
        const updated = items(draft).find((i) => i.id === item.id)!
        draft.moderation.audit.push({
          id: randomUUID(),
          createdAt: now,
          provenance,
          itemId: item.id,
          ref: item.ref,
          ...(item.commentId ? { commentId: item.commentId } : {}),
          reviewerId: user.id,
          action: valid.action,
          reason: valid.reason,
          evidenceRefs: valid.evidenceRefs,
          previousVersion: item.version,
          version: updated.version,
          previousState: item.state,
          state: updated.state,
        })
        if (item.creatorId)
          notify(
            draft,
            item.creatorId,
            'moderation',
            item.ref,
            `Review decision: ${valid.action.replaceAll('_', ' ')}. ${valid.reason}`,
            now,
          )
      })
      return read((draft) => {
        const result = items(draft).find((i) => i.id === valid.id)
        if (!result) return missing()
        return result
      })
    },
  }
  return { community, moderation }
}

/** Shared snapshot for all public list/detail/profile projections after a review. */
export function publicSnapshot(draft: DemoDraft): FixtureSeed {
  const data = structuredClone(draft.data)
  const visible = (ref: ResourceRef) => {
    try {
      publicResource(draft, ref)
      return true
    } catch {
      return false
    }
  }
  for (const kind of Object.keys(collections) as ResourceRef['kind'][]) {
    const key = collections[kind]
    const rows = data[key].filter((row) => visible({ kind, id: row.id }))
    Object.assign(data, { [key]: rows })
  }
  const fields = {
    postIds: 'post',
    animalIds: 'animal',
    fundraiserIds: 'fundraiser',
    missionIds: 'mission',
    eventIds: 'event',
  } as const
  for (const rows of Object.values(data))
    for (const row of rows)
      for (const [field, kind] of Object.entries(fields)) {
        if (field in row) {
          const record = row as unknown as Record<string, unknown>
          if (Array.isArray(record[field]))
            record[field] = (record[field] as string[]).filter((id) =>
              visible({ kind, id }),
            )
        }
      }
  data.sightings = data.sightings.filter(
    (s) =>
      (!s.animalId || visible({ kind: 'animal', id: s.animalId })) &&
      (!s.hordeId || visible({ kind: 'horde', id: s.hordeId })),
  )
  return data
}
