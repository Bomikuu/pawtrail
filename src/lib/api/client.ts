import { animalActivityPageSchema } from '@/features/animals/activity-schemas'
import { z } from 'zod'
import { pageSchema } from '@/lib/api/schemas'
import * as auth from '@/features/auth/schemas'
import * as media from '@/features/media/schemas'
import * as animals from '@/features/animals/schemas'
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
import type { PawTrailApi } from './contracts'
import { request as browserRequest } from './http'
export function createApiClient(
  request: typeof browserRequest = browserRequest,
): PawTrailApi {
  return {
    auth: {
      session: (options) =>
        request(
          'GET',
          `/auth/session`,
          auth.sessionSchema,
          undefined,
          undefined,
          options,
        ),
      login: (input, options) =>
        request(
          'POST',
          `/auth/login`,
          auth.sessionSchema,
          undefined,
          input,
          options,
        ),
      register: (input, options) =>
        request(
          'POST',
          `/auth/register`,
          auth.sessionSchema,
          undefined,
          input,
          options,
        ),
      logout: (options) =>
        request(
          'POST',
          `/auth/logout`,
          z.undefined(),
          undefined,
          undefined,
          options,
        ),
      selectDemoActor: (actorId, options) =>
        request(
          'POST',
          `/demo/actor`,
          auth.sessionSchema,
          undefined,
          { actorId: actorId },
          options,
        ),
    },
    media: {
      upload: (input, options) =>
        request(
          'POST',
          `/media`,
          media.mediaAssetSchema,
          undefined,
          input,
          options,
        ),
      remove: (id, options) =>
        request(
          'DELETE',
          `/media/${encodeURIComponent(id)}`,
          z.undefined(),
          undefined,
          undefined,
          options,
        ),
    },
    animals: {
      activity: (slug, query, options) =>
        request(
          'GET',
          `/animals/${encodeURIComponent(slug)}/activity`,
          animalActivityPageSchema,
          query,
          undefined,
          options,
        ),
      list: (filters, options) =>
        request(
          'GET',
          `/animals`,
          pageSchema(animals.animalSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/animals/${encodeURIComponent(slug)}`,
          animals.animalProfileSchema,
          undefined,
          undefined,
          options,
        ),
      report: (input, options) =>
        request(
          'POST',
          `/animals/reports`,
          animals.animalProfileSchema,
          undefined,
          input,
          options,
        ),
      update: (id, input, options) =>
        request(
          'PATCH',
          `/animals/${encodeURIComponent(id)}`,
          animals.animalProfileSchema,
          undefined,
          input,
          options,
        ),
      setSaved: (id, saved, options) =>
        request(
          'PUT',
          `/animals/${encodeURIComponent(id)}/saved`,
          z.undefined(),
          undefined,
          { saved: saved },
          options,
        ),
    },
    community: {
      list: (filters, options) =>
        request(
          'GET',
          `/community/posts`,
          pageSchema(community.postViewSchema),
          filters,
          undefined,
          options,
        ),
      get: (id, options) =>
        request(
          'GET',
          `/community/posts/${encodeURIComponent(id)}`,
          community.postViewSchema,
          undefined,
          undefined,
          options,
        ),
      create: (input, options) =>
        request(
          'POST',
          `/community/posts`,
          community.postViewSchema,
          undefined,
          input,
          options,
        ),
      update: (id, input, options) =>
        request(
          'PATCH',
          `/community/posts/${encodeURIComponent(id)}`,
          community.postViewSchema,
          undefined,
          input,
          options,
        ),
      remove: (id, options) =>
        request(
          'DELETE',
          `/community/posts/${encodeURIComponent(id)}`,
          z.undefined(),
          undefined,
          undefined,
          options,
        ),
      setReaction: (id, active, options) =>
        request(
          'PUT',
          `/community/posts/${encodeURIComponent(id)}/reaction`,
          community.postViewSchema,
          undefined,
          { active: active },
          options,
        ),
      setSaved: (id, saved, options) =>
        request(
          'PUT',
          `/community/posts/${encodeURIComponent(id)}/saved`,
          z.undefined(),
          undefined,
          { saved: saved },
          options,
        ),
      comments: (ref, query, options) =>
        request(
          'GET',
          `/discussions/${encodeURIComponent(ref.kind)}/${encodeURIComponent(ref.id)}/comments`,
          pageSchema(community.commentSchema),
          query,
          undefined,
          options,
        ),
      comment: (ref, input, options) =>
        request(
          'POST',
          `/discussions/${encodeURIComponent(ref.kind)}/${encodeURIComponent(ref.id)}/comments`,
          community.commentSchema,
          undefined,
          input,
          options,
        ),
    },
    follows: {
      set: (ref, active, options) =>
        request(
          'PUT',
          `/follows/${encodeURIComponent(ref.kind)}/${encodeURIComponent(ref.id)}`,
          z.undefined(),
          undefined,
          { active: active },
          options,
        ),
      list: (query, options) =>
        request(
          'GET',
          `/follows`,
          pageSchema(follows.followSchema),
          query,
          undefined,
          options,
        ),
    },
    users: {
      identities: (query, options) =>
        request(
          'GET',
          '/users/identities/batch',
          users.publicIdentitiesSchema,
          users.publicIdentityQuerySchema.parse(query),
          undefined,
          options,
        ),
      me: (options) =>
        request(
          'GET',
          '/me/profile',
          users.privateUserSchema,
          undefined,
          undefined,
          options,
        ),
      get: (username, options) =>
        request(
          'GET',
          `/users/${encodeURIComponent(username)}`,
          users.publicProfileSchema,
          undefined,
          undefined,
          options,
        ),
      update: (input, options) =>
        request(
          'PATCH',
          `/me/profile`,
          users.privateUserSchema,
          undefined,
          input,
          options,
        ),
      settings: (options) =>
        request(
          'GET',
          `/me/settings`,
          users.privacySettingsSchema,
          undefined,
          undefined,
          options,
        ),
      updateSettings: (input, options) =>
        request(
          'PATCH',
          `/me/settings`,
          users.privacySettingsSchema,
          undefined,
          input,
          options,
        ),
      summary: (options) =>
        request(
          'GET',
          `/me/summary`,
          users.dashboardSummarySchema,
          undefined,
          undefined,
          options,
        ),
    },
    achievements: {
      overview: (options) =>
        request(
          'GET',
          '/me/achievements',
          achievements.achievementOverviewSchema,
          undefined,
          undefined,
          options,
        ),
      claim: (badgeId, options) =>
        request(
          'POST',
          '/me/achievements/claim',
          achievements.achievementOverviewSchema,
          undefined,
          { badgeId },
          options,
        ),
      showcase: (input, options) =>
        request(
          'PATCH',
          '/me/achievements/showcase',
          achievements.achievementOverviewSchema,
          undefined,
          input,
          options,
        ),
      record: (input, options) =>
        request(
          'POST',
          '/me/achievements/activity',
          achievements.achievementOverviewSchema,
          undefined,
          input,
          options,
        ),
      proofs: (input, options) =>
        request(
          'GET',
          input.scope === 'review'
            ? '/moderation/achievement-proofs'
            : '/me/achievement-proofs',
          pageSchema(achievements.achievementProofSchema),
          input,
          undefined,
          options,
        ),
      submitProof: (input, options) =>
        request(
          'POST',
          '/me/achievement-proofs',
          achievements.achievementProofSchema,
          undefined,
          input,
          options,
        ),
      review: (input, options) =>
        request(
          'POST',
          '/moderation/achievement-proofs/' +
            encodeURIComponent(input.id) +
            '/review',
          achievements.achievementProofSchema,
          undefined,
          input,
          options,
        ),
    },
    notifications: {
      list: (query, options) =>
        request(
          'GET',
          `/me/notifications`,
          pageSchema(notifications.notificationViewSchema),
          query,
          undefined,
          options,
        ),
      markRead: (ids, options) =>
        request(
          'POST',
          `/me/notifications/read`,
          z.undefined(),
          undefined,
          { ids: ids },
          options,
        ),
      unreadCount: (options) =>
        request(
          'GET',
          `/me/notifications/unread-count`,
          z.number(),
          undefined,
          undefined,
          options,
        ),
    },
    moderation: {
      report: (input, options) =>
        request(
          'POST',
          `/reports`,
          moderation.reportSchema,
          undefined,
          input,
          options,
        ),
      queue: (filters, options) =>
        request(
          'GET',
          `/moderation`,
          pageSchema(moderation.moderationItemSchema),
          filters,
          undefined,
          options,
        ),
      review: (input, options) =>
        request(
          'POST',
          `/moderation/${encodeURIComponent(input.id)}/review`,
          moderation.moderationItemSchema,
          undefined,
          input,
          options,
        ),
    },
    sightings: {
      list: (filters, options) =>
        request(
          'GET',
          `/sightings`,
          pageSchema(sightings.sightingSchema),
          filters,
          undefined,
          options,
        ),
      create: (input, options) =>
        request(
          'POST',
          `/sightings`,
          sightings.sightingSchema,
          undefined,
          input,
          options,
        ),
    },
    discovery: {
      searchAreas: (q, options) =>
        request(
          'GET',
          `/discovery/areas`,
          z.array(discovery.geoAreaSchema),
          { q },
          undefined,
          options,
        ),
      nearby: (input, options) =>
        request(
          'GET',
          `/discovery/nearby`,
          discovery.discoveryResultSchema,
          input,
          undefined,
          options,
        ),
    },
    hordes: {
      list: (filters, options) =>
        request(
          'GET',
          `/hordes`,
          pageSchema(hordes.hordeSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/hordes/${encodeURIComponent(slug)}`,
          hordes.hordeProfileSchema,
          undefined,
          undefined,
          options,
        ),
    },
    search: {
      query: (input, options) =>
        request(
          'GET',
          `/search`,
          search.searchResultsSchema,
          input,
          undefined,
          options,
        ),
    },
    adoption: {
      preferences: (options) =>
        request(
          'GET',
          `/adoption/preferences`,
          adoption.adoptionPreferencesSchema,
          undefined,
          undefined,
          options,
        ),
      savePreferences: (input, options) =>
        request(
          'PUT',
          `/adoption/preferences`,
          adoption.adoptionPreferencesSchema,
          undefined,
          input,
          options,
        ),
      discover: (filters, options) =>
        request(
          'GET',
          `/adoption/candidates`,
          pageSchema(adoption.adoptionCandidateSchema),
          filters,
          undefined,
          options,
        ),
      setInterest: (animalId, interested, options) =>
        request(
          'PUT',
          `/adoption/interested/${encodeURIComponent(animalId)}`,
          z.undefined(),
          undefined,
          { interested: interested },
          options,
        ),
      interested: (query, options) =>
        request(
          'GET',
          `/adoption/interested`,
          pageSchema(adoption.adoptionCandidateSchema),
          query,
          undefined,
          options,
        ),
      saveDraft: (input, options) =>
        request(
          'PUT',
          `/adoption/drafts/${encodeURIComponent(input.animalId)}`,
          adoption.adoptionApplicationDraftSchema,
          undefined,
          input,
          options,
        ),
      apply: (input, options) =>
        request(
          'POST',
          `/adoption/applications`,
          adoption.adoptionApplicationSchema,
          undefined,
          input,
          options,
        ),
      applications: (filters, options) =>
        request(
          'GET',
          `/adoption/applications`,
          pageSchema(adoption.adoptionApplicationSummarySchema),
          filters,
          undefined,
          options,
        ),
      application: (id, options) =>
        request(
          'GET',
          `/adoption/applications/${encodeURIComponent(id)}`,
          adoption.adoptionApplicationSchema,
          undefined,
          undefined,
          options,
        ),
      withdraw: (id, options) =>
        request(
          'POST',
          `/adoption/applications/${encodeURIComponent(id)}/withdraw`,
          adoption.adoptionApplicationSchema,
          undefined,
          undefined,
          options,
        ),
      resubmit: (id, input, options) =>
        request(
          'POST',
          `/adoption/applications/${encodeURIComponent(id)}/resubmit`,
          adoption.adoptionApplicationSchema,
          undefined,
          input,
          options,
        ),
      review: (id, input, options) =>
        request(
          'POST',
          `/adoption/applications/${encodeURIComponent(id)}/review`,
          adoption.adoptionApplicationSchema,
          undefined,
          input,
          options,
        ),
    },
    fundraisers: {
      list: (filters, options) =>
        request(
          'GET',
          `/fundraisers`,
          pageSchema(fundraising.campaignSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/fundraisers/${encodeURIComponent(slug)}`,
          fundraising.campaignDetailSchema,
          undefined,
          undefined,
          options,
        ),
      drafts: (query, options) =>
        request(
          'GET',
          `/fundraisers/drafts`,
          pageSchema(fundraising.campaignDraftSummarySchema),
          query,
          undefined,
          options,
        ),
      draft: (id, options) =>
        request(
          'GET',
          `/fundraisers/drafts/${encodeURIComponent(id)}`,
          fundraising.campaignDraftSchema,
          undefined,
          undefined,
          options,
        ),
      saveDraft: (input, options) =>
        request(
          'PUT',
          `/fundraisers/drafts`,
          fundraising.campaignDraftSchema,
          undefined,
          input,
          options,
        ),
      create: (input, options) =>
        request(
          'POST',
          `/fundraisers`,
          fundraising.campaignDetailSchema,
          undefined,
          input,
          options,
        ),
      update: (id, input, options) =>
        request(
          'PATCH',
          `/fundraisers/${encodeURIComponent(id)}`,
          fundraising.campaignDetailSchema,
          undefined,
          input,
          options,
        ),
      addUpdate: (id, input, options) =>
        request(
          'POST',
          `/fundraisers/${encodeURIComponent(id)}/updates`,
          fundraising.campaignStoryUpdateSchema,
          undefined,
          input,
          options,
        ),
      addExpense: (id, input, options) =>
        request(
          'POST',
          `/fundraisers/${encodeURIComponent(id)}/expenses`,
          fundraising.expenseEntrySchema,
          undefined,
          input,
          options,
        ),
      close: (id, options) =>
        request(
          'POST',
          `/fundraisers/${encodeURIComponent(id)}/close`,
          fundraising.campaignDetailSchema,
          undefined,
          undefined,
          options,
        ),
      simulateDonation: (id, input, options) =>
        request(
          'POST',
          `/fundraisers/${encodeURIComponent(id)}/demo-contributions`,
          fundraising.demoContributionSchema,
          undefined,
          input,
          options,
        ),
      supporters: (id, query, options) =>
        request(
          'GET',
          `/fundraisers/${encodeURIComponent(id)}/supporters`,
          pageSchema(fundraising.publicSupporterSchema),
          query,
          undefined,
          options,
        ),
      dashboard: (options) =>
        request(
          'GET',
          `/me/fundraising`,
          fundraising.fundraisingDashboardSchema,
          undefined,
          undefined,
          options,
        ),
    },
    missions: {
      list: (filters, options) =>
        request(
          'GET',
          `/missions`,
          pageSchema(missions.missionSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/missions/${encodeURIComponent(slug)}`,
          missions.missionDetailSchema,
          undefined,
          undefined,
          options,
        ),
      create: (input, options) =>
        request(
          'POST',
          `/missions`,
          missions.missionDetailSchema,
          undefined,
          input,
          options,
        ),
      participations: (filters, options) =>
        request(
          'GET',
          `/mission-participations`,
          pageSchema(missions.missionParticipationSchema),
          filters,
          undefined,
          options,
        ),
      accept: (missionId, options) =>
        request(
          'POST',
          `/missions/${encodeURIComponent(missionId)}/accept`,
          missions.missionParticipationSchema,
          undefined,
          undefined,
          options,
        ),
      submit: (participationId, input, options) =>
        request(
          'POST',
          `/mission-participations/${encodeURIComponent(participationId)}/evidence`,
          missions.missionParticipationSchema,
          undefined,
          input,
          options,
        ),
      review: (participationId, input, options) =>
        request(
          'POST',
          `/mission-participations/${encodeURIComponent(participationId)}/review`,
          missions.missionParticipationSchema,
          undefined,
          input,
          options,
        ),
    },
    kibble: {
      wallet: (options) =>
        request(
          'GET',
          `/me/kibble`,
          kibble.kibbleWalletSchema,
          undefined,
          undefined,
          options,
        ),
      transactions: (query, options) =>
        request(
          'GET',
          `/me/kibble/transactions`,
          pageSchema(kibble.kibbleEntrySchema),
          query,
          undefined,
          options,
        ),
      leaderboard: (period, query, options) =>
        request(
          'GET',
          `/leaderboard`,
          kibble.leaderboardPageSchema,
          { ...query, period },
          undefined,
          options,
        ),
    },
    shelters: {
      list: (filters, options) =>
        request(
          'GET',
          `/shelters`,
          pageSchema(shelters.shelterSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/shelters/${encodeURIComponent(slug)}`,
          shelters.shelterProfileSchema,
          undefined,
          undefined,
          options,
        ),
      dashboard: (id, options) =>
        request(
          'GET',
          `/shelters/${encodeURIComponent(id)}/dashboard`,
          shelters.shelterDashboardSchema,
          undefined,
          undefined,
          options,
        ),
    },
    events: {
      list: (filters, options) =>
        request(
          'GET',
          `/events`,
          pageSchema(events.eventSummarySchema),
          filters,
          undefined,
          options,
        ),
      get: (slug, options) =>
        request(
          'GET',
          `/events/${encodeURIComponent(slug)}`,
          events.eventDetailSchema,
          undefined,
          undefined,
          options,
        ),
      create: (input, options) =>
        request(
          'POST',
          `/events`,
          events.eventDetailSchema,
          undefined,
          input,
          options,
        ),
      update: (id, input, options) =>
        request(
          'PATCH',
          `/events/${encodeURIComponent(id)}`,
          events.eventDetailSchema,
          undefined,
          input,
          options,
        ),
      setRsvp: (id, attending, options) =>
        request(
          'PUT',
          `/events/${encodeURIComponent(id)}/rsvp`,
          events.eventDetailSchema,
          undefined,
          { attending: attending },
          options,
        ),
    },
  }
}
export function getBrowserApi(): PawTrailApi {
  return createApiClient()
}
