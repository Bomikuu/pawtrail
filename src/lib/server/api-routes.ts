import { communityStatisticsSchema } from '@/features/discovery/schemas'
import { medicalRoutes } from '@/features/medical/api-routes'
import 'server-only'
import { z } from 'zod'
import {
  idSchema,
  listQuerySchema,
  resourceRefSchema,
  pageSchema,
} from '@/lib/api/schemas'
import * as auth from '@/features/auth/schemas'
import * as media from '@/features/media/schemas'
import * as animals from '@/features/animals/schemas'
import * as animalActivity from '@/features/animals/activity-schemas'
import * as community from '@/features/community/schemas'
import * as follows from '@/features/follows/schemas'
import * as users from '@/features/users/schemas'
import * as achievements from '@/features/achievements/schemas'
import * as notifications from '@/features/notifications/schemas'
import * as moderation from '@/features/moderation/schemas'
import * as sightings from '@/features/sightings/schemas'
import * as discovery from '@/features/discovery/schemas'
import * as hordes from '@/features/hordes/schemas'
import * as search from '@/features/search/schemas'
import * as adoption from '@/features/adoption/schemas'
import * as fundraising from '@/features/fundraising/schemas'
import * as missions from '@/features/missions/schemas'
import * as kibble from '@/features/kibble/schemas'
import * as shelters from '@/features/shelters/schemas'
import * as events from '@/features/events/schemas'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { RequestOptions } from '@/types/common'
import { parseInput, parseResponse } from '@/lib/api/validation'
export interface ApiRoute {
  method: string
  path: string
  invoke(
    api: PawTrailApi,
    params: Record<string, string>,
    query: Record<string, unknown>,
    body: unknown,
    options: RequestOptions,
  ): Promise<unknown>
}
export const apiRoutes: ApiRoute[] = [
  ...medicalRoutes,
  { method: 'GET', path: '/discovery/community-stats', invoke: async (api, _p, _q, _body, options) => parseResponse(communityStatisticsSchema, await api.discovery.communityStats(options)) },
  {
    method: 'GET',
    path: '/users/:username/preview',
    invoke: async (api, params, _query, _body, options) =>
      parseResponse(
        users.profilePreviewSchema,
        await api.users.preview(params.username, options),
      ),
  },
  {
    method: 'GET',
    path: '/users/identities/batch',
    invoke: async (api, _params, query, _body, options) =>
      parseResponse(
        users.publicIdentitiesSchema,
        await api.users.identities(
          parseInput(users.publicIdentityQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/achievements',
    invoke: async (api, _p, _q, _b, options) =>
      parseResponse(
        achievements.achievementOverviewSchema,
        await api.achievements.overview(options),
      ),
  },
  {
    method: 'POST',
    path: '/me/achievements/claim',
    invoke: async (api, _p, _q, body, options) =>
      parseResponse(
        achievements.achievementOverviewSchema,
        await api.achievements.claim(
          parseInput(z.object({ badgeId: idSchema }), body).badgeId,
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/me/achievements/showcase',
    invoke: async (api, _p, _q, body, options) =>
      parseResponse(
        achievements.achievementOverviewSchema,
        await api.achievements.showcase(
          parseInput(achievements.achievementShowcaseInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/me/achievements/activity',
    invoke: async (api, _p, _q, body, options) =>
      parseResponse(
        achievements.achievementOverviewSchema,
        await api.achievements.record(
          parseInput(achievements.achievementRecordInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/achievement-proofs',
    invoke: async (api, _p, query, _b, options) =>
      parseResponse(
        pageSchema(achievements.achievementProofSchema),
        await api.achievements.proofs(
          parseInput(achievements.achievementProofFiltersSchema, {
            ...query,
            scope: 'mine',
          }),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/me/achievement-proofs',
    invoke: async (api, _p, _q, body, options) =>
      parseResponse(
        achievements.achievementProofSchema,
        await api.achievements.submitProof(
          parseInput(achievements.achievementProofInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/moderation/achievement-proofs',
    invoke: async (api, _p, query, _b, options) =>
      parseResponse(
        pageSchema(achievements.achievementProofSchema),
        await api.achievements.proofs(
          parseInput(achievements.achievementProofFiltersSchema, {
            ...query,
            scope: 'review',
          }),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/moderation/achievement-proofs/:id/review',
    invoke: async (api, params, _q, body, options) =>
      parseResponse(
        achievements.achievementProofSchema,
        await api.achievements.review(
          parseInput(achievements.achievementReviewInputSchema, {
            ...parseInput(z.record(z.string(), z.unknown()), body),
            id: params.id,
          }),
          options,
        ),
      ),
  },

  {
    method: 'GET',
    path: '/me/profile',
    invoke: async (api, _p, _q, _b, options) =>
      parseResponse(users.privateUserSchema, await api.users.me(options)),
  },
  {
    method: 'GET',
    path: '/auth/session',
    invoke: async (api, params, query, body, options) =>
      parseResponse(auth.sessionSchema, await api.auth.session(options)),
  },
  {
    method: 'POST',
    path: '/auth/login',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        auth.sessionSchema,
        await api.auth.login(parseInput(auth.loginInputSchema, body), options),
      ),
  },
  {
    method: 'POST',
    path: '/auth/google',
    invoke: async (api, _params, _query, body, options) =>
      parseResponse(
        auth.sessionSchema,
        await api.auth.loginWithGoogle(
          parseInput(auth.googleLoginInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/auth/register',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        auth.sessionSchema,
        await api.auth.register(
          parseInput(auth.registerInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/auth/logout',
    invoke: async (api, params, query, body, options) =>
      parseResponse(z.undefined(), await api.auth.logout(options)),
  },
  {
    method: 'POST',
    path: '/demo/actor',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        auth.sessionSchema,
        await api.auth.selectDemoActor(
          parseInput(z.object({ actorId: idSchema }), body).actorId,
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/media',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        media.mediaAssetSchema,
        await api.media.upload(
          parseInput(media.mediaUploadSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'DELETE',
    path: '/media/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.media.remove(parseInput(idSchema, params['id']), options),
      ),
  },
  {
    method: 'GET',
    path: '/animals',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(animals.animalSummarySchema),
        await api.animals.list(
          parseInput(animals.animalFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/animals/:slug/activity',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        animalActivity.animalActivityPageSchema,
        await api.animals.activity(
          parseInput(z.string(), params['slug']),
          parseInput(animalActivity.animalActivityFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/animals/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        animals.animalProfileSchema,
        await api.animals.get(parseInput(z.string(), params['slug']), options),
      ),
  },
  {
    method: 'POST',
    path: '/animals/reports',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        animals.animalProfileSchema,
        await api.animals.report(
          parseInput(animals.animalReportInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/animals/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        animals.animalProfileSchema,
        await api.animals.update(
          parseInput(idSchema, params['id']),
          parseInput(animals.animalUpdateInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/animals/:id/saved',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.animals.setSaved(
          parseInput(idSchema, params['id']),
          parseInput(z.object({ saved: z.boolean() }), body).saved,
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/community/posts',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(community.postViewSchema),
        await api.community.list(
          parseInput(community.postFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/community/posts/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        community.postViewSchema,
        await api.community.get(parseInput(idSchema, params['id']), options),
      ),
  },
  {
    method: 'POST',
    path: '/community/posts',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        community.postViewSchema,
        await api.community.create(
          parseInput(community.postInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/community/posts/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        community.postViewSchema,
        await api.community.update(
          parseInput(idSchema, params['id']),
          parseInput(community.postUpdateInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'DELETE',
    path: '/community/posts/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.community.remove(parseInput(idSchema, params['id']), options),
      ),
  },
  {
    method: 'PUT',
    path: '/community/posts/:id/reaction',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        community.postViewSchema,
        await api.community.setReaction(
          parseInput(idSchema, params['id']),
          parseInput(z.object({ active: z.boolean() }), body).active,
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/community/posts/:id/saved',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.community.setSaved(
          parseInput(idSchema, params['id']),
          parseInput(z.object({ saved: z.boolean() }), body).saved,
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/discussions/:kind/:id/comments',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(community.commentSchema),
        await api.community.comments(
          parseInput(resourceRefSchema, { kind: params.kind, id: params.id }),
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/discussions/:kind/:id/comments',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        community.commentSchema,
        await api.community.comment(
          parseInput(resourceRefSchema, { kind: params.kind, id: params.id }),
          parseInput(community.commentInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/follows/:kind/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.follows.set(
          parseInput(
            z.object({ kind: z.enum(['user', 'animal']), id: idSchema }),
            { kind: params.kind, id: params.id },
          ),
          parseInput(z.object({ active: z.boolean() }), body).active,
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/follows',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(follows.followSchema),
        await api.follows.list(
          parseInput(follows.followFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/users/:username',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        users.publicProfileSchema,
        await api.users.get(
          parseInput(z.string(), params['username']),
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/me/profile',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        users.privateUserSchema,
        await api.users.update(
          parseInput(users.profileInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/settings',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        users.privacySettingsSchema,
        await api.users.settings(options),
      ),
  },
  {
    method: 'PATCH',
    path: '/me/settings',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        users.privacySettingsSchema,
        await api.users.updateSettings(
          parseInput(users.privacySettingsSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/summary',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        users.dashboardSummarySchema,
        await api.users.summary(options),
      ),
  },
  {
    method: 'GET',
    path: '/me/notifications',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(notifications.notificationViewSchema),
        await api.notifications.list(
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/me/notifications/read',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.notifications.markRead(
          parseInput(z.object({ ids: z.array(idSchema) }), body).ids,
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/notifications/unread-count',
    invoke: async (api, params, query, body, options) =>
      parseResponse(z.number(), await api.notifications.unreadCount(options)),
  },
  {
    method: 'POST',
    path: '/reports',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        moderation.reportSchema,
        await api.moderation.report(
          parseInput(moderation.reportInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/moderation',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(moderation.moderationItemSchema),
        await api.moderation.queue(
          parseInput(moderation.moderationFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/moderation/:id/review',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        moderation.moderationItemSchema,
        await api.moderation.review(
          parseInput(moderation.moderationDecisionSchema, {
            ...parseInput(z.record(z.string(), z.unknown()), body),
            id: params['id'],
          }),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/sightings',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(sightings.sightingSchema),
        await api.sightings.list(
          parseInput(sightings.sightingFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/sightings',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        sightings.sightingSchema,
        await api.sightings.create(
          parseInput(sightings.sightingInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/discovery/areas',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.array(discovery.geoAreaSchema),
        await api.discovery.searchAreas(
          parseInput(z.string(), query['q']),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/discovery/nearby',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        discovery.discoveryResultSchema,
        await api.discovery.nearby(
          parseInput(discovery.discoveryQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/hordes',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(hordes.hordeSummarySchema),
        await api.hordes.list(parseInput(listQuerySchema, query), options),
      ),
  },
  {
    method: 'GET',
    path: '/hordes/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        hordes.hordeProfileSchema,
        await api.hordes.get(parseInput(z.string(), params['slug']), options),
      ),
  },
  {
    method: 'GET',
    path: '/search',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        search.searchResultsSchema,
        await api.search.query(
          parseInput(search.searchQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/adoption/preferences',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionPreferencesSchema,
        await api.adoption.preferences(options),
      ),
  },
  {
    method: 'PUT',
    path: '/adoption/preferences',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionPreferencesSchema,
        await api.adoption.savePreferences(
          parseInput(adoption.adoptionPreferencesSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/adoption/candidates',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(adoption.adoptionCandidateSchema),
        await api.adoption.discover(
          parseInput(adoption.adoptionFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/adoption/interested/:animalId',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        z.undefined(),
        await api.adoption.setInterest(
          parseInput(idSchema, params['animalId']),
          parseInput(z.object({ interested: z.boolean() }), body).interested,
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/adoption/interested',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(adoption.adoptionCandidateSchema),
        await api.adoption.interested(
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/adoption/drafts/:animalId',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationDraftSchema,
        await api.adoption.saveDraft(
          parseInput(adoption.adoptionApplicationDraftSchema, {
            ...parseInput(z.record(z.string(), z.unknown()), body),
            animalId: params['animalId'],
          }),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/adoption/applications',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationSchema,
        await api.adoption.apply(
          parseInput(adoption.adoptionApplicationInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/adoption/applications',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(adoption.adoptionApplicationSummarySchema),
        await api.adoption.applications(
          parseInput(adoption.applicationFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/adoption/applications/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationSchema,
        await api.adoption.application(
          parseInput(idSchema, params['id']),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/adoption/applications/:id/withdraw',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationSchema,
        await api.adoption.withdraw(
          parseInput(idSchema, params['id']),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/adoption/applications/:id/resubmit',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationSchema,
        await api.adoption.resubmit(
          parseInput(idSchema, params['id']),
          parseInput(adoption.adoptionApplicationInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/adoption/applications/:id/review',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        adoption.adoptionApplicationSchema,
        await api.adoption.review(
          parseInput(idSchema, params['id']),
          parseInput(adoption.applicationReviewInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/fundraisers',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(fundraising.campaignSummarySchema),
        await api.fundraisers.list(
          parseInput(fundraising.campaignFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/fundraisers/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDetailSchema,
        await api.fundraisers.get(
          parseInput(z.string(), params['slug']),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/fundraisers/drafts',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(fundraising.campaignDraftSummarySchema),
        await api.fundraisers.drafts(
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/fundraisers/drafts/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDraftSchema,
        await api.fundraisers.draft(
          parseInput(idSchema, params['id']),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/fundraisers/drafts',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDraftSchema,
        await api.fundraisers.saveDraft(
          parseInput(fundraising.campaignDraftSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDetailSchema,
        await api.fundraisers.create(
          parseInput(fundraising.campaignInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/fundraisers/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDetailSchema,
        await api.fundraisers.update(
          parseInput(idSchema, params['id']),
          parseInput(fundraising.campaignUpdateInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers/:id/updates',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignStoryUpdateSchema,
        await api.fundraisers.addUpdate(
          parseInput(idSchema, params['id']),
          parseInput(fundraising.campaignStoryUpdateInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers/:id/expenses',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.expenseEntrySchema,
        await api.fundraisers.addExpense(
          parseInput(idSchema, params['id']),
          parseInput(fundraising.expenseInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers/:id/close',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.campaignDetailSchema,
        await api.fundraisers.close(
          parseInput(idSchema, params['id']),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers/:id/pledges',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.supportPledgeSchema,
        await api.fundraisers.pledge(
          parseInput(idSchema, params['id']),
          parseInput(fundraising.demoDonationInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/fundraisers/:id/demo-contributions',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.demoContributionSchema,
        await api.fundraisers.simulateDonation(
          parseInput(idSchema, params['id']),
          parseInput(fundraising.demoDonationInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/fundraisers/:id/supporters',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(fundraising.publicSupporterSchema),
        await api.fundraisers.supporters(
          parseInput(idSchema, params['id']),
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/fundraising',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        fundraising.fundraisingDashboardSchema,
        await api.fundraisers.dashboard(options),
      ),
  },
  {
    method: 'GET',
    path: '/missions',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(missions.missionSummarySchema),
        await api.missions.list(
          parseInput(missions.missionFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/missions/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        missions.missionDetailSchema,
        await api.missions.get(parseInput(z.string(), params['slug']), options),
      ),
  },
  {
    method: 'POST',
    path: '/missions',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        missions.missionDetailSchema,
        await api.missions.create(
          parseInput(missions.missionInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/mission-participations',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(missions.missionParticipationSchema),
        await api.missions.participations(
          parseInput(missions.participationFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/missions/:missionId/accept',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        missions.missionParticipationSchema,
        await api.missions.accept(
          parseInput(idSchema, params['missionId']),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/mission-participations/:participationId/evidence',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        missions.missionParticipationSchema,
        await api.missions.submit(
          parseInput(idSchema, params['participationId']),
          parseInput(missions.missionEvidenceInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'POST',
    path: '/mission-participations/:participationId/review',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        missions.missionParticipationSchema,
        await api.missions.review(
          parseInput(idSchema, params['participationId']),
          parseInput(missions.missionReviewInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/me/kibble',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        kibble.kibbleWalletSchema,
        await api.kibble.wallet(options),
      ),
  },
  {
    method: 'GET',
    path: '/me/kibble/transactions',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(kibble.kibbleEntrySchema),
        await api.kibble.transactions(
          parseInput(listQuerySchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/leaderboard',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        kibble.leaderboardPageSchema,
        await api.kibble.leaderboard(
          parseInput(kibble.leaderboardPeriodSchema, query['period'] ?? 'all'),
          parseInput(kibble.leaderboardFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/shelters',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(shelters.shelterSummarySchema),
        await api.shelters.list(parseInput(listQuerySchema, query), options),
      ),
  },
  {
    method: 'GET',
    path: '/shelters/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        shelters.shelterProfileSchema,
        await api.shelters.get(parseInput(z.string(), params['slug']), options),
      ),
  },
  {
    method: 'GET',
    path: '/shelters/:id/dashboard',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        shelters.shelterDashboardSchema,
        await api.shelters.dashboard(
          parseInput(idSchema, params['id']),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/events',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        pageSchema(events.eventSummarySchema),
        await api.events.list(
          parseInput(events.eventFiltersSchema, query),
          options,
        ),
      ),
  },
  {
    method: 'GET',
    path: '/events/:slug',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        events.eventDetailSchema,
        await api.events.get(parseInput(z.string(), params['slug']), options),
      ),
  },
  {
    method: 'POST',
    path: '/events',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        events.eventDetailSchema,
        await api.events.create(
          parseInput(events.eventInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PATCH',
    path: '/events/:id',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        events.eventDetailSchema,
        await api.events.update(
          parseInput(idSchema, params['id']),
          parseInput(events.eventInputSchema, body),
          options,
        ),
      ),
  },
  {
    method: 'PUT',
    path: '/events/:id/rsvp',
    invoke: async (api, params, query, body, options) =>
      parseResponse(
        events.eventDetailSchema,
        await api.events.setRsvp(
          parseInput(idSchema, params['id']),
          parseInput(z.object({ attending: z.boolean() }), body).attending,
          options,
        ),
      ),
  },
]
