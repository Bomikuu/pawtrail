import 'server-only'
import { publicAchievementShowcase } from '@/features/achievements/engine'
import { topTenRecognitionRanks } from '@/features/kibble/leaderboard-service'
import { demoClock } from '@/lib/api/clock'
import { personAvatar } from '@/features/users/avatar-presets'
import {
  postMediaIds,
  publicSnapshot,
  reconcilePublicMedia,
} from '@/features/moderation/service'
import { freshModeration } from '@/lib/server/demo/migrations'
import { applySamplePack } from '@/data/fixtures/sample-pack'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { FixtureSeed } from '@/data/fixtures'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import type { ResourceRef, RequestOptions } from '@/types/common'
import { actorSchema } from '@/features/auth/schemas'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { getApiConfig } from '@/lib/api/config'
import { idSchema } from '@/lib/api/schemas'
import { paginate } from '@/lib/api/pagination'
import { parseInput, parseResponse } from '@/lib/api/validation'
import { can } from '@/lib/server/permissions'
import { attachMedia } from '@/lib/server/media/storage'
import {
  postFiltersSchema,
  postInputSchema,
  postUpdateInputSchema,
  postViewSchema,
} from './schemas'
import type { Post, PostInput } from './types'

type StoredPost = FixtureSeed['posts'][number]
function actor(draft: DemoDraft) {
  const user = draft.data.users.find((user) => user.id === draft.auth.actorId)
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to contribute', 401)
  const result = actorSchema.parse(user)
  if (!can(result, 'contribute'))
    throw new ApiError('FORBIDDEN', 'A community account is required', 403)
  return result
}
function missing(): never {
  throw new ApiError('NOT_FOUND', 'Post or linked record not found', 404)
}
/** Only visible records can supply labels, routes, or approximate neighborhood context. */
export function linkedEntity(data: FixtureSeed, ref: ResourceRef) {
  const collections = {
    animal: data.animals,
    horde: data.hordes,
    fundraiser: data.fundraisers,
    mission: data.missions,
    shelter: data.shelters,
    event: data.events,
  }
  if (!(ref.kind in collections)) return null
  const rows = collections[ref.kind as keyof typeof collections]
  const row = rows.find((row) => row.id === ref.id)
  if (
    !row ||
    ('moderation' in row && row.moderation !== 'published') ||
    (ref.kind === 'fundraiser' &&
      'state' in row &&
      !['active', 'completed', 'closed'].includes(row.state))
  )
    return null
  const paths = {
    animal: 'pets',
    horde: 'hordes',
    fundraiser: 'fundraisers',
    mission: 'missions',
    shelter: 'shelters',
    event: 'events',
  }
  return {
    ref,
    title: 'name' in row ? row.name : row.title,
    href: `/${paths[ref.kind as keyof typeof paths]}/${encodeURIComponent(row.slug)}`,
    areaId: 'location' in row ? row.location.areaId : undefined,
  }
}
function visible(draft: DemoDraft, post: StoredPost) {
  if (post.moderation === 'removed') return false
  if (post.moderation === 'published' || post.authorId === draft.auth.actorId)
    return true
  const user = draft.data.users.find((user) => user.id === draft.auth.actorId)
  return !!user && can(actorSchema.parse(user), 'moderate')
}
/** Owner media is a separate private projection; public media always passes imageSchema. */
export function projectPost(
  draft: DemoDraft,
  row: StoredPost,
  recognitionRanks?: ReadonlyMap<string, number>,
): Post {
  if (!visible(draft, row)) missing()
  const owner = !!draft.auth.actorId && row.authorId === draft.auth.actorId
  const publicData = publicSnapshot(draft)
  const user = publicData.users.find((user) => user.id === row.authorId)
  const identifiable =
    !!user?.settings.discoverable && user.settings.showContributions
  const attachments =
    draft.community.attachments.find((item) => item.postId === row.id)
      ?.mediaIds ?? []
  const privateMedia =
    ['pending', 'rejected'].includes(row.moderation) && owner
      ? attachments.flatMap((id) => {
          const item = draft.media.find(
            (item) =>
              item.asset.id === id &&
              item.ownerId === draft.auth.actorId &&
              item.purpose === 'public_image',
          )
          return item && !item.approved
            ? [{ ...item.asset, sensitive: item.sensitive }]
            : []
        })
      : undefined
  const links = row.refs.flatMap((ref) => {
    const link = linkedEntity(publicData, ref)
    return link ? [link] : []
  })
  const participantIds = new Set(
    draft.data.comments
      .filter(
        (comment) =>
          comment.ref.kind === 'post' &&
          comment.ref.id === row.id &&
          comment.moderation === 'published',
      )
      .map((comment) => comment.authorId),
  )
  const participants = publicData.users
    .filter(
      (person) =>
        participantIds.has(person.id) &&
        person.settings.discoverable &&
        person.settings.showContributions,
    )
    .map((person) => ({
      id: person.id,
      username: person.username,
      displayName: person.displayName,
      avatar: personAvatar(person.avatar, person.id),
    }))
  return parseResponse(postViewSchema, {
    id: row.id,
    createdAt: row.createdAt,
    provenance: row.provenance,
    authorId: identifiable ? row.authorId : null,
    participants: participants.slice(0, 4),
    participantCount: participants.length,
    author: {
      badges: identifiable
        ? publicAchievementShowcase(
            draft,
            user!.id,
            demoClock.now().toISOString(),
          ).badges
        : [],
      leaderboardRank: identifiable
        ? ((
            recognitionRanks ??
            topTenRecognitionRanks(draft, demoClock.now().toISOString())
          ).get(user!.id) ?? null)
        : null,
      displayName: identifiable ? user!.displayName : 'Community member',
      username: identifiable ? user!.username : null,
      avatar: identifiable ? personAvatar(user!.avatar, user!.id) : null,
    },
    text: row.text,
    type: row.type,
    media: row.media.filter((image) => {
      const item = draft.media.find((item) => item.asset.id === image.id)
      return !item || item.approved
    }),
    refs: links.map((link) => link.ref),
    linkedEntities: links,
    moderation: row.moderation,
    reactionCount: row.reactionCount,
    commentCount: row.commentCount,
    version: row.version,
    viewerOwns: owner,
    viewerReacted: draft.community.reactions.some(
      (item) => item.postId === row.id && item.actorId === draft.auth.actorId,
    ),
    viewerSaved: draft.community.saved.some(
      (item) => item.postId === row.id && item.actorId === draft.auth.actorId,
    ),
    ...(privateMedia ? { ownerMedia: privateMedia } : {}),
  })
}
function validateContent(
  draft: DemoDraft,
  input: PostInput,
  existing?: StoredPost,
) {
  const publicData = publicSnapshot(draft)
  for (const ref of input.refs) if (!linkedEntity(publicData, ref)) missing()
  if (
    input.refs.some(
      (ref) => !['animal', 'horde', 'fundraiser', 'mission'].includes(ref.kind),
    )
  )
    throw new ApiError(
      'VALIDATION_ERROR',
      'Link an animal, Horde, fundraiser or mission',
      400,
    )
  if (new Set(input.mediaIds).size !== input.mediaIds.length)
    throw new ApiError('VALIDATION_ERROR', 'Choose different photos', 400)
  const uploaded: string[] = []
  for (const id of input.mediaIds) {
    if (existing?.media.some((image) => image.id === id)) continue
    const item = draft.media.find(
      (item) => item.asset.id === id && item.ownerId === draft.auth.actorId,
    )
    if (!item) missing()
    if (
      item.purpose !== 'public_image' ||
      item.asset.mimeType === 'application/pdf'
    )
      throw new ApiError(
        'VALIDATION_ERROR',
        'Only public-eligible photos can be attached',
        400,
      )
    uploaded.push(id)
  }
  attachMedia(draft, uploaded)
  return [
    ...(existing?.media.filter((image) => input.mediaIds.includes(image.id)) ??
      []),
    ...uploaded.flatMap((id) => {
      const item = draft.media.find((item) => item.asset.id === id)!
      return item.approved
        ? [
            {
              id,
              url: item.asset.url,
              alt: item.asset.alt,
              sensitive: item.sensitive,
              provenance: { kind: 'demo' as const, label: 'Demo photograph' },
            },
          ]
        : []
    }),
  ]
}
export function createCommunityService(
  snapshot: FixtureSeed,
  repository?: DemoRepository,
): Pick<
  PawTrailApi['community'],
  'list' | 'get' | 'create' | 'update' | 'remove' | 'setReaction' | 'setSaved'
> {
  let anonymous: DemoDraft | undefined
  const read = <T>(query: (draft: DemoDraft) => T): Promise<T> => {
    if (repository) return repository.read(query)
    // Repository-backed sessions never consume this anonymous sample world.
    if (!anonymous) {
      anonymous = {
        moderation: freshModeration(),
        data: structuredClone(snapshot),
        auth: { actorId: null, cacheScope: 'anonymous' },
        media: [],
        savedAnimals: [],
        community: { follows: [], reactions: [], saved: [], attachments: [] },
      }
      applySamplePack(anonymous)
    }
    return Promise.resolve(query(anonymous))
  }
  function writable() {
    if (getApiConfig().mode !== 'mock')
      throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
    if (!repository)
      throw new ApiError('UNAUTHENTICATED', 'Sign in to contribute', 401)
    return repository
  }
  async function command<T>(
    name: string,
    input: unknown,
    options: RequestOptions | undefined,
    execute: (draft: DemoDraft, now: string) => T,
  ) {
    checkCancelled(options?.signal)
    return writable().transact({
      name: `community.${name}`,
      input,
      idempotencyKey: options?.idempotencyKey,
      execute(draft, clock) {
        checkCancelled(options?.signal)
        actor(draft)
        return execute(draft, clock.now().toISOString())
      },
    })
  }
  function owned(draft: DemoDraft, id: string) {
    const row = draft.data.posts.find(
      (row) => row.id === id && row.moderation !== 'removed',
    )
    if (!row || !visible(draft, row)) missing()
    if (row.authorId !== draft.auth.actorId)
      throw new ApiError(
        'FORBIDDEN',
        'Only the author can change this post',
        403,
      )
    return row
  }
  const get: PawTrailApi['community']['get'] = async (id, options) => {
    checkCancelled(options?.signal)
    parseInput(idSchema, id)
    return read((draft) => {
      const row = draft.data.posts.find(
        (row) => row.id === id && visible(draft, row),
      )
      if (!row) missing()
      return projectPost(draft, row)
    })
  }
  return {
    get,
    async list(filters, options) {
      checkCancelled(options?.signal)
      const query = parseInput(postFiltersSchema, filters)
      return read((draft) => {
        if (query.tab === 'following' || query.saved) actor(draft)
        if (query.tab === 'nearby' && !query.areaId)
          throw new ApiError(
            'VALIDATION_ERROR',
            'Choose a neighborhood to see nearby posts',
            400,
          )
        if (
          query.areaId &&
          !draft.data.areas.some((area) => area.id === query.areaId)
        )
          throw new ApiError(
            'VALIDATION_ERROR',
            'Choose an available neighborhood',
            400,
          )
        const publicData = publicSnapshot(draft)
        const recognitionRanks = topTenRecognitionRanks(
          draft,
          demoClock.now().toISOString(),
        )
        const rows = draft.data.posts
          .filter(
            (row) =>
              visible(draft, row) &&
              (!query.authorId ||
                (row.authorId === query.authorId &&
                  (row.authorId === draft.auth.actorId ||
                    publicData.users.some(
                      (user) =>
                        user.id === row.authorId &&
                        user.settings.discoverable &&
                        user.settings.showContributions,
                    )))) &&
              (!query.animalId ||
                row.refs.some(
                  (ref) =>
                    ref.kind === 'animal' &&
                    ref.id === query.animalId &&
                    !!linkedEntity(publicData, ref),
                )) &&
              (!query.hordeId ||
                row.refs.some(
                  (ref) =>
                    ref.kind === 'horde' &&
                    ref.id === query.hordeId &&
                    !!linkedEntity(publicData, ref),
                )) &&
              (!query.q ||
                row.text.toLowerCase().includes(query.q.toLowerCase())) &&
              (!query.saved ||
                draft.community.saved.some(
                  (item) =>
                    item.actorId === draft.auth.actorId &&
                    item.postId === row.id,
                )) &&
              (!query.areaId ||
                row.refs.some(
                  (ref) =>
                    linkedEntity(publicData, ref)?.areaId === query.areaId,
                )) &&
              (query.tab !== 'following' ||
                draft.community.follows.some(
                  (edge) =>
                    edge.actorId === draft.auth.actorId &&
                    ((edge.ref.kind === 'user' &&
                      edge.ref.id === row.authorId &&
                      publicData.users.some(
                        (user) =>
                          user.id === row.authorId &&
                          user.settings.discoverable &&
                          user.settings.showContributions,
                      )) ||
                      row.refs.some(
                        (ref) =>
                          ref.kind === edge.ref.kind &&
                          ref.id === edge.ref.id &&
                          !!linkedEntity(publicData, ref),
                      )),
                )),
          )
          .map((row) => projectPost(draft, row, recognitionRanks))
        const scope = JSON.stringify(
          Object.fromEntries(
            Object.entries(query)
              .filter(([key]) => !['cursor', 'limit'].includes(key))
              .sort(([a], [b]) => a.localeCompare(b)),
          ),
        )
        return paginate(
          rows,
          query,
          `posts:${draft.auth.actorId ?? 'anonymous'}:${scope}`,
        )
      })
    },
    async create(input, options) {
      const valid = parseInput(postInputSchema, input)
      const id = await command('create', valid, options, (draft, now) => {
        const media = validateContent(draft, valid)
        const row: StoredPost = {
          id: randomUUID(),
          authorId: draft.auth.actorId!,
          createdAt: now,
          provenance: { kind: 'demo', label: 'Demo community post' },
          text: valid.text,
          type: valid.type,
          refs: valid.refs,
          media,
          moderation: 'pending',
          reactionCount: 0,
          commentCount: 0,
          version: 1,
        }
        draft.data.posts.push(row)
        draft.community.attachments.push({
          postId: row.id,
          mediaIds: valid.mediaIds,
        })
        return row.id
      })
      return get(id, options)
    },
    async update(id, input, options) {
      parseInput(idSchema, id)
      const valid = parseInput(postUpdateInputSchema, input)
      await command('update', { id, ...valid }, options, (draft) => {
        const row = owned(draft, id)
        if (row.version !== valid.expectedVersion)
          throw new ApiError(
            'CONFLICT',
            'This post changed. Refresh before editing again.',
            409,
          )
        const previousMediaIds = postMediaIds(draft, id)
        const media = validateContent(draft, valid, row)
        Object.assign(row, {
          text: valid.text,
          type: valid.type,
          refs: valid.refs,
          media,
          moderation: 'pending',
          version: row.version + 1,
        })
        draft.community.attachments = draft.community.attachments.filter(
          (item) => item.postId !== id,
        )
        draft.community.attachments.push({
          postId: id,
          mediaIds: valid.mediaIds,
        })
        reconcilePublicMedia(draft, [
          ...previousMediaIds,
          ...postMediaIds(draft, id),
        ])
      })
      return get(id, options)
    },
    async remove(id, options) {
      parseInput(idSchema, id)
      await command('remove', { id }, options, (draft) => {
        const row = owned(draft, id)
        row.moderation = 'removed'
        row.version += 1
        reconcilePublicMedia(draft, postMediaIds(draft, id))
      })
    },
    async setReaction(id, active, options) {
      const valid = parseInput(
        z.object({ id: idSchema, active: z.boolean() }),
        { id, active },
      )
      await command('setReaction', valid, options, (draft) => {
        const row = draft.data.posts.find(
          (row) => row.id === id && row.moderation === 'published',
        )
        if (!row) missing()
        const before = draft.community.reactions.some(
          (item) => item.actorId === draft.auth.actorId && item.postId === id,
        )
        draft.community.reactions = draft.community.reactions.filter(
          (item) => item.actorId !== draft.auth.actorId || item.postId !== id,
        )
        if (active)
          draft.community.reactions.push({
            actorId: draft.auth.actorId!,
            postId: id,
          })
        row.reactionCount = Math.max(
          0,
          row.reactionCount + Number(active) - Number(before),
        )
      })
      return get(id, options)
    },
    async setSaved(id, saved, options) {
      const valid = parseInput(z.object({ id: idSchema, saved: z.boolean() }), {
        id,
        saved,
      })
      await command('setSaved', valid, options, (draft) => {
        if (
          !draft.data.posts.some((row) => row.id === id && visible(draft, row))
        )
          missing()
        draft.community.saved = draft.community.saved.filter(
          (item) => item.actorId !== draft.auth.actorId || item.postId !== id,
        )
        if (saved)
          draft.community.saved.push({
            actorId: draft.auth.actorId!,
            postId: id,
          })
      })
    },
  }
}

/** First-page public choices; domains own their full discovery and management workflows. */
export async function communityChoices(api: PawTrailApi) {
  const [animals, hordes, fundraisers, missions] = await Promise.all([
    api.animals.list({ limit: 50 }),
    api.hordes.list({ limit: 50 }),
    api.fundraisers.list({ limit: 50 }),
    api.missions.list({ limit: 50 }),
  ])
  return [
    ...animals.items.map((row) => ({
      ref: { kind: 'animal' as const, id: row.id },
      title: row.name,
      href: `/pets/${encodeURIComponent(row.slug)}`,
    })),
    ...hordes.items.map((row) => ({
      ref: { kind: 'horde' as const, id: row.id },
      title: row.name,
      href: `/hordes/${encodeURIComponent(row.slug)}`,
    })),
    ...fundraisers.items.map((row) => ({
      ref: { kind: 'fundraiser' as const, id: row.id },
      title: row.title,
      href: `/fundraisers/${encodeURIComponent(row.slug)}`,
    })),
    ...missions.items.map((row) => ({
      ref: { kind: 'mission' as const, id: row.id },
      title: row.title,
      href: `/missions/${encodeURIComponent(row.slug)}`,
    })),
  ]
}
