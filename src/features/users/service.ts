import 'server-only'
import { topTenRecognitionRanks } from '@/features/kibble/leaderboard-service'
import { publicAchievementShowcase } from '@/features/achievements/engine'
import { demoClock } from '@/lib/api/clock'
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
import { publicProfileSchema, profileActivitySchema } from './schemas'
export function currentUser(draft: DemoDraft) {
  const user = draft.data.users.find((u) => u.id === draft.auth.actorId)
  if (!user) throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
  return user
}
export function fixtureDraft(data: FixtureSeed): DemoDraft {
  return snapshot(freshDocument(), data)
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
        const user =
          visible.users.find((u) => u.username === username) ??
          visible.users.find((u) => u.id === username)
        if (!user) throw new ApiError('NOT_FOUND', 'Profile not found', 404)
        const profile = toPublicUser(user)
        if (!user.settings.showContributions)
          return parseResponse(publicProfileSchema, {
            ...profile,
            contributionCount: null,
            summary: null,
            leaderboardRank: null,
            level: null,
            badges: [],
            stories: [],
            animalsHelped: [],
          })
        const recognitionRanks = topTenRecognitionRanks(
          draft,
          demoClock.now().toISOString(),
        )
        const stories = visible.posts.filter((p) => p.authorId === user.id)
        const sightings = visible.sightings.filter(
          (s) => s.reporterId === user.id && s.moderation === 'published',
        )
        const missions = visible.participations.filter(
          (p) =>
            p.volunteerId === user.id &&
            p.state === 'approved' &&
            !!p.reviewerId &&
            p.reviewerId !== user.id &&
            visible.missions.some((m) => m.id === p.missionId),
        )
        const donations = visible.contributions.filter(
          (c) =>
            c.contributorId === user.id &&
            !c.anonymous &&
            visible.fundraisers.some(
              (f) =>
                f.id === c.campaignId &&
                ['active', 'completed', 'closed'].includes(f.state),
            ),
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
          donations: new Set(donations.map((donation) => donation.campaignId))
            .size,
        }
        const now = demoClock.now().toISOString()
        const kibbleEarned = Math.max(
          0,
          draft.data.kibbleEntries
            .filter((entry) => entry.userId === user.id)
            .reduce((sum, entry) => sum + entry.amount, 0),
        )
        const activity: z.infer<typeof profileActivitySchema>[] = []
        for (const sighting of sightings) {
          const animal = visible.animals.find(
            (animal) => animal.id === sighting.animalId,
          )
          if (animal)
            activity.push({
              id: sighting.id,
              kind: 'sighting',
              title: 'Sighting of ' + animal.name,
              description: sighting.observation,
              href: '/pets/' + encodeURIComponent(animal.slug),
              createdAt: sighting.observedAt,
            })
        }
        for (const participation of missions) {
          const mission = visible.missions.find(
            (mission) => mission.id === participation.missionId,
          )!
          const approvedAt =
            participation.reviewedAt ??
            draft.data.kibbleEntries.find(
              (entry) =>
                entry.contributionId === participation.id &&
                entry.reason === 'mission_approved',
            )?.createdAt ??
            participation.createdAt
          activity.push({
            id: participation.id,
            kind: 'mission',
            title: mission.title,
            description: 'Completed with independently approved evidence.',
            href: '/missions/' + encodeURIComponent(mission.slug),
            createdAt: approvedAt,
          })
        }
        const supportedCampaigns = new Set<string>()
        for (const donation of [...donations].sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt),
        )) {
          if (supportedCampaigns.has(donation.campaignId)) continue
          supportedCampaigns.add(donation.campaignId)
          const campaign = visible.fundraisers.find(
            (campaign) => campaign.id === donation.campaignId,
          )!
          activity.push({
            id: donation.id,
            kind: 'fundraiser',
            title: campaign.title,
            description: donation.simulated
              ? 'Demo fundraiser support — no money transferred.'
              : 'Public fundraiser support.',
            href: '/fundraisers/' + encodeURIComponent(campaign.slug),
            createdAt: donation.createdAt,
          })
        }
        return parseResponse(publicProfileSchema, {
          ...profile,
          contributionCount:
            summary.stories +
            summary.sightings +
            summary.missions +
            summary.donations,
          summary,
          activities: activity.sort(
            (a, b) =>
              b.createdAt.localeCompare(a.createdAt) ||
              a.id.localeCompare(b.id),
          ),
          impact: {
            kibbleEarned,
            eventsJoined: new Set(
              visible.rsvps
                .filter(
                  (rsvp) =>
                    rsvp.userId === user.id &&
                    visible.events.some(
                      (event) =>
                        event.id === rsvp.eventId &&
                        event.state !== 'cancelled',
                    ),
                )
                .map((rsvp) => rsvp.eventId),
            ).size,
            membershipDays: Math.max(
              0,
              Math.floor(
                (Date.parse(now) - Date.parse(user.createdAt)) / 86400000,
              ),
            ),
            levelProgress: kibbleEarned % 100,
          },
          leaderboardRank: recognitionRanks.get(user.id) ?? null,
          level: 1 + Math.floor(kibbleEarned / 100),
          ...publicAchievementShowcase(
            draft,
            user.id,
            demoClock.now().toISOString(),
          ),
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
            .map((p) => projectPost(draft, p, recognitionRanks)),
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
