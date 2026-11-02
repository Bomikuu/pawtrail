import 'server-only'
import { z } from 'zod'
import type { FixtureSeed } from '@/data/fixtures'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from '@/lib/server/demo/repository'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import { snapshot, freshDocument } from '@/lib/server/demo/migrations'
import { publicResource, publicSnapshot } from '@/features/moderation/service'
import { projectPost } from '@/features/community/service'
import { notify } from '@/features/notifications/service'
import { followFiltersSchema, followSchema } from '@/features/follows/schemas'
import { parseInput, parseResponse } from '@/lib/api/validation'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { paginate } from '@/lib/api/pagination'
import { getApiConfig } from '@/lib/api/config'
import { toPublicAnimal, toPublicUser } from '@/lib/server/projections'
import { animalSummarySchema } from '@/features/animals/schemas'
import { publicProfileSchema } from './schemas'
export function currentUser(draft: DemoDraft) {
  const user = draft.data.users.find((u) => u.id === draft.auth.actorId)
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
  return user
}
export function fixtureDraft(data: FixtureSeed): DemoDraft {
  const draft = snapshot(freshDocument())
  draft.data = structuredClone(data)
  return draft
}
export function createUserService(
  data: FixtureSeed,
  repository?: DemoRepository,
): {
  get: PawTrailApi['users']['get']
  follows: PawTrailApi['follows']
} {
  const read = <T>(query: (draft: DemoDraft) => T) =>
    repository
      ? repository.read(query)
      : Promise.resolve(query(fixtureDraft(data)))
  return {
    async get(username, options) {
      checkCancelled(options?.signal)
      parseInput(z.string().min(1).max(120), username)
      return read((draft) => {
        const visible = publicSnapshot(draft)
        const user = visible.users.find((u) => u.username === username)
        if (!user) throw new ApiError('NOT_FOUND', 'Profile not found', 404)
        const profile = toPublicUser(user)
        if (!user.settings.showContributions)
          return parseResponse(publicProfileSchema, {
            ...profile,
            contributionCount: null,
            summary: null,
            level: null,
            badges: [],
            stories: [],
            animalsHelped: [],
          })
        const stories = visible.posts.filter((p) => p.authorId === user.id)
        const sightings = visible.sightings.filter(
          (s) => s.reporterId === user.id,
        )
        const missions = visible.participations.filter(
          (p) =>
            p.volunteerId === user.id &&
            p.state === 'approved' &&
            visible.missions.some((m) => m.id === p.missionId),
        )
        const donations = visible.contributions.filter(
          (c) =>
            c.contributorId === user.id &&
            !c.anonymous &&
            visible.fundraisers.some((f) => f.id === c.campaignId),
        )
        // Only these published, attributed contributions can establish an animal-help association.
        const animalIds = new Set([
          ...missions.flatMap((p) =>
            visible.missions
              .filter((m) => m.id === p.missionId)
              .flatMap((m) => (m.animalId ? [m.animalId] : [])),
          ),
          ...donations.flatMap((c) =>
            visible.fundraisers
              .filter((f) => f.id === c.campaignId)
              .flatMap((f) => (f.animalId ? [f.animalId] : [])),
          ),
        ])
        const summary = {
          stories: stories.length,
          sightings: sightings.length,
          missions: missions.length,
          donations: donations.length,
        }
        return parseResponse(publicProfileSchema, {
          ...profile,
          contributionCount:
            summary.stories +
            summary.sightings +
            summary.missions +
            summary.donations,
          summary,
          level: null,
          badges: [],
          animalsHelped: visible.animals
            .filter((a) => animalIds.has(a.id))
            .map((a) =>
              parseResponse(
                animalSummarySchema,
                toPublicAnimal(a, visible.users),
              ),
            ),
          stories: [...stories]
            .sort(
              (a, b) =>
                Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
                b.id.localeCompare(a.id),
            )
            .map((p) => projectPost(draft, p)),
        })
      })
    },
    follows: {
      async set(ref, active, options) {
        checkCancelled(options?.signal)
        const input = parseInput(
          z.object({ target: followSchema.shape.target, active: z.boolean() }),
          { target: ref, active },
        )
        if (getApiConfig().mode !== 'mock')
          throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
        if (!repository)
          throw new ApiError('UNAUTHENTICATED', 'Sign in to follow', 401)
        await repository.transact({
          name: 'follows.set',
          input,
          idempotencyKey: options?.idempotencyKey,
          async execute(draft, clock) {
            checkCancelled(options?.signal)
            const actor = currentUser(draft)
            if (input.target.kind === 'user' && input.target.id === actor.id)
              throw new ApiError(
                'VALIDATION_ERROR',
                'You cannot follow yourself',
                400,
              )
            if (input.active) publicResource(draft, input.target)
            const matches = (edge: DemoDraft['community']['follows'][number]) =>
              edge.actorId === actor.id &&
              edge.ref.kind === input.target.kind &&
              edge.ref.id === input.target.id
            const existing = draft.community.follows.find(matches)
            const existed = !!existing
            draft.community.follows = draft.community.follows.filter(
              (edge) => !matches(edge),
            )
            if (input.active) {
              draft.community.follows.push({
                actorId: actor.id,
                ref: input.target,
                createdAt: existing?.createdAt ?? clock.now().toISOString(),
              })
              if (!existed && input.target.kind === 'user')
                await notify({
                  draft,
                  recipientId: input.target.id,
                  kind: 'follow',
                  ref: actor.settings.discoverable
                    ? { kind: 'user', id: actor.id }
                    : null,
                  now: clock.now().toISOString(),
                })
            }
          },
        })
      },
      async list(filters, options) {
        checkCancelled(options?.signal)
        const query = parseInput(followFiltersSchema, filters)
        return read((draft) => {
          const actor = currentUser(draft)
          const rows = draft.community.follows
            .filter(
              (e) =>
                e.actorId === actor.id &&
                (!query.kind || e.ref.kind === query.kind),
            )
            .flatMap((edge) => {
              if (!['animal', 'user'].includes(edge.ref.kind)) return []
              try {
                const target = publicResource(draft, edge.ref).row
                if (
                  query.q &&
                  !(
                    'displayName' in target
                      ? target.displayName
                      : 'name' in target
                        ? target.name
                        : ''
                  )
                    .toLowerCase()
                    .includes(query.q.toLowerCase())
                )
                  return []
                return [
                  parseResponse(followSchema, {
                    id: `follow:${actor.id}:${edge.ref.kind}:${edge.ref.id}`,
                    createdAt: edge.createdAt,
                    provenance: { kind: 'demo', label: 'Illustrative follow' },
                    followerId: actor.id,
                    target: edge.ref,
                  }),
                ]
              } catch {
                return []
              }
            })
          return paginate(
            rows,
            query,
            `follows:${actor.id}:${query.kind ?? ''}:${query.q ?? ''}`,
          )
        })
      },
    },
  }
}
