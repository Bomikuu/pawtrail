import type { z } from 'zod'
import type { communityStatisticsSchema } from '@/features/discovery/schemas'
import type { MedicalFilters, MedicalInput, MedicalUpdate, MedicalRecord, MedicalPage } from '@/features/medical/schemas'
import type {
  AnimalActivityPage,
  AnimalActivityFilters,
} from '@/features/animals/activity-schemas'
import type {
  Id,
  ListQuery,
  Page,
  ResourceRef,
  RequestOptions,
} from '@/types/common'
import type {
  GoogleLoginInput,
  LoginInput,
  RegisterInput,
  Session,
} from '@/features/auth/types'
import type {
  AchievementOverview,
  AchievementProof,
  AchievementProofInput,
  AchievementReviewInput,
  AchievementRecordInput,
  AchievementShowcaseInput,
  AchievementProofFilters,
} from '@/features/achievements/schemas'
import type { MediaAsset, MediaUpload } from '@/features/media/types'
import type {
  AnimalFilters,
  AnimalProfile,
  AnimalReportInput,
  AnimalSummary,
  AnimalUpdateInput,
} from '@/features/animals/types'
import type {
  Comment,
  CommentInput,
  Post,
  PostFilters,
  PostInput,
} from '@/features/community/types'
import type { Follow, FollowFilters } from '@/features/follows/types'
import type {
  DashboardSummary,
  PrivacySettings,
  PrivateUser,
  ProfileInput,
  PublicProfile,
  ProfilePreview,
  PublicIdentityQuery,
  PublicIdentities,
} from '@/features/users/types'
import type { Notification } from '@/features/notifications/types'
import type {
  ModerationDecision,
  ModerationFilters,
  ModerationItem,
  Report,
  ReportInput,
} from '@/features/moderation/types'
import type {
  Sighting,
  SightingFilters,
  SightingInput,
} from '@/features/sightings/types'
import type {
  DiscoveryQuery,
  DiscoveryResult,
  GeoArea,
} from '@/features/discovery/types'
import type { HordeProfile, HordeSummary } from '@/features/hordes/types'
import type { SearchQuery, SearchResults } from '@/features/search/types'
import type {
  AdoptionApplication,
  AdoptionApplicationDraft,
  AdoptionApplicationInput,
  AdoptionApplicationSummary,
  AdoptionCandidate,
  AdoptionFilters,
  AdoptionPreferences,
  ApplicationFilters,
  ApplicationReviewInput,
} from '@/features/adoption/types'
import type {
  SupportPledge,
  CampaignDetail,
  CampaignDraft,
  CampaignDraftSummary,
  CampaignFilters,
  CampaignInput,
  CampaignStoryUpdate,
  CampaignStoryUpdateInput,
  CampaignSummary,
  CampaignUpdateInput,
  DemoContribution,
  DemoDonationInput,
  ExpenseEntry,
  ExpenseInput,
  FundraisingDashboard,
  PublicSupporter,
} from '@/features/fundraising/types'
import type {
  MissionDetail,
  MissionEvidenceInput,
  MissionFilters,
  MissionInput,
  MissionParticipation,
  MissionReviewInput,
  MissionSummary,
  ParticipationFilters,
} from '@/features/missions/types'
import type {
  KibbleEntry,
  KibbleWallet,
  LeaderboardPage,
  LeaderboardQuery,
  LeaderboardPeriod,
} from '@/features/kibble/types'
import type {
  ShelterDashboard,
  ShelterProfile,
  ShelterSummary,
} from '@/features/shelters/types'
import type {
  EventDetail,
  EventFilters,
  EventInput,
  EventSummary,
} from '@/features/events/types'

export interface PawTrailApi {
  auth: {
    session(options?: RequestOptions): Promise<Session>
    login(input: LoginInput, options?: RequestOptions): Promise<Session>
    loginWithGoogle(
      input: GoogleLoginInput,
      options?: RequestOptions,
    ): Promise<Session>
    register(input: RegisterInput, options?: RequestOptions): Promise<Session>
    logout(options?: RequestOptions): Promise<void>
    selectDemoActor(actorId: Id, options?: RequestOptions): Promise<Session>
  }
  media: {
    upload(input: MediaUpload, options?: RequestOptions): Promise<MediaAsset>
    remove(id: Id, options?: RequestOptions): Promise<void>
  }
  medical: {
    list(animal: string, filters: MedicalFilters, options?: RequestOptions): Promise<MedicalPage>
    create(animal: string, input: MedicalInput, options?: RequestOptions): Promise<MedicalRecord>
    update(animal: string, id: string, input: MedicalUpdate, options?: RequestOptions): Promise<MedicalRecord>
  }
  animals: {
    list(
      filters: AnimalFilters,
      options?: RequestOptions,
    ): Promise<Page<AnimalSummary>>
    get(slug: string, options?: RequestOptions): Promise<AnimalProfile>
    activity(
      slug: string,
      query: AnimalActivityFilters,
      options?: RequestOptions,
    ): Promise<AnimalActivityPage>
    report(
      input: AnimalReportInput,
      options?: RequestOptions,
    ): Promise<AnimalProfile>
    update(
      id: Id,
      input: AnimalUpdateInput,
      options?: RequestOptions,
    ): Promise<AnimalProfile>
    setSaved(id: Id, saved: boolean, options?: RequestOptions): Promise<void>
  }
  community: {
    list(filters: PostFilters, options?: RequestOptions): Promise<Page<Post>>
    get(id: Id, options?: RequestOptions): Promise<Post>
    create(input: PostInput, options?: RequestOptions): Promise<Post>
    update(id: Id, input: PostInput, options?: RequestOptions): Promise<Post>
    remove(id: Id, options?: RequestOptions): Promise<void>
    setReaction(
      id: Id,
      active: boolean,
      options?: RequestOptions,
    ): Promise<Post>
    setSaved(id: Id, saved: boolean, options?: RequestOptions): Promise<void>
    comments(
      ref: ResourceRef,
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<Comment>>
    comment(
      ref: ResourceRef,
      input: CommentInput,
      options?: RequestOptions,
    ): Promise<Comment>
  }
  follows: {
    set(
      ref: ResourceRef,
      active: boolean,
      options?: RequestOptions,
    ): Promise<void>
    list(query: FollowFilters, options?: RequestOptions): Promise<Page<Follow>>
  }
  users: {
    identities(
      query: PublicIdentityQuery,
      options?: RequestOptions,
    ): Promise<PublicIdentities>
    me(options?: RequestOptions): Promise<PrivateUser>
    get(username: string, options?: RequestOptions): Promise<PublicProfile>
    preview(username: string, options?: RequestOptions): Promise<ProfilePreview>
    update(input: ProfileInput, options?: RequestOptions): Promise<PrivateUser>
    settings(options?: RequestOptions): Promise<PrivacySettings>
    updateSettings(
      input: PrivacySettings,
      options?: RequestOptions,
    ): Promise<PrivacySettings>
    summary(options?: RequestOptions): Promise<DashboardSummary>
  }
  achievements: {
    overview(options?: RequestOptions): Promise<AchievementOverview>
    claim(badgeId: Id, options?: RequestOptions): Promise<AchievementOverview>
    showcase(
      input: AchievementShowcaseInput,
      options?: RequestOptions,
    ): Promise<AchievementOverview>
    record(
      input: AchievementRecordInput,
      options?: RequestOptions,
    ): Promise<AchievementOverview>
    proofs(
      input: AchievementProofFilters,
      options?: RequestOptions,
    ): Promise<Page<AchievementProof>>
    submitProof(
      input: AchievementProofInput,
      options?: RequestOptions,
    ): Promise<AchievementProof>
    review(
      input: AchievementReviewInput,
      options?: RequestOptions,
    ): Promise<AchievementProof>
  }
  notifications: {
    list(
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<Notification>>
    markRead(ids: Id[], options?: RequestOptions): Promise<void>
    unreadCount(options?: RequestOptions): Promise<number>
  }
  moderation: {
    report(input: ReportInput, options?: RequestOptions): Promise<Report>
    queue(
      filters: ModerationFilters,
      options?: RequestOptions,
    ): Promise<Page<ModerationItem>>
    review(
      input: ModerationDecision,
      options?: RequestOptions,
    ): Promise<ModerationItem>
  }
  sightings: {
    list(
      filters: SightingFilters,
      options?: RequestOptions,
    ): Promise<Page<Sighting>>
    create(input: SightingInput, options?: RequestOptions): Promise<Sighting>
  }
  discovery: {
    communityStats(options?: RequestOptions): Promise<z.infer<typeof communityStatisticsSchema>>
    searchAreas(q: string, options?: RequestOptions): Promise<GeoArea[]>
    nearby(
      input: DiscoveryQuery,
      options?: RequestOptions,
    ): Promise<DiscoveryResult>
  }
  hordes: {
    list(
      filters: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<HordeSummary>>
    get(slug: string, options?: RequestOptions): Promise<HordeProfile>
  }
  search: {
    query(input: SearchQuery, options?: RequestOptions): Promise<SearchResults>
  }
  adoption: {
    preferences(options?: RequestOptions): Promise<AdoptionPreferences>
    savePreferences(
      input: AdoptionPreferences,
      options?: RequestOptions,
    ): Promise<AdoptionPreferences>
    discover(
      filters: AdoptionFilters,
      options?: RequestOptions,
    ): Promise<Page<AdoptionCandidate>>
    setInterest(
      animalId: Id,
      interested: boolean,
      options?: RequestOptions,
    ): Promise<void>
    interested(
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<AdoptionCandidate>>
    saveDraft(
      input: AdoptionApplicationDraft,
      options?: RequestOptions,
    ): Promise<AdoptionApplicationDraft>
    apply(
      input: AdoptionApplicationInput,
      options?: RequestOptions,
    ): Promise<AdoptionApplication>
    applications(
      filters: ApplicationFilters,
      options?: RequestOptions,
    ): Promise<Page<AdoptionApplicationSummary>>
    application(id: Id, options?: RequestOptions): Promise<AdoptionApplication>
    withdraw(id: Id, options?: RequestOptions): Promise<AdoptionApplication>
    resubmit(
      id: Id,
      input: AdoptionApplicationInput,
      options?: RequestOptions,
    ): Promise<AdoptionApplication>
    review(
      id: Id,
      input: ApplicationReviewInput,
      options?: RequestOptions,
    ): Promise<AdoptionApplication>
  }
  fundraisers: {
    list(
      filters: CampaignFilters,
      options?: RequestOptions,
    ): Promise<Page<CampaignSummary>>
    get(slug: string, options?: RequestOptions): Promise<CampaignDetail>
    drafts(
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<CampaignDraftSummary>>
    draft(id: Id, options?: RequestOptions): Promise<CampaignDraft>
    saveDraft(
      input: CampaignDraft,
      options?: RequestOptions,
    ): Promise<CampaignDraft>
    create(
      input: CampaignInput,
      options?: RequestOptions,
    ): Promise<CampaignDetail>
    update(
      id: Id,
      input: CampaignUpdateInput,
      options?: RequestOptions,
    ): Promise<CampaignDetail>
    addUpdate(
      id: Id,
      input: CampaignStoryUpdateInput,
      options?: RequestOptions,
    ): Promise<CampaignStoryUpdate>
    addExpense(
      id: Id,
      input: ExpenseInput,
      options?: RequestOptions,
    ): Promise<ExpenseEntry>
    close(id: Id, options?: RequestOptions): Promise<CampaignDetail>
    pledge(
      id: Id,
      input: DemoDonationInput,
      options?: RequestOptions,
    ): Promise<SupportPledge>
    simulateDonation(
      id: Id,
      input: DemoDonationInput,
      options?: RequestOptions,
    ): Promise<DemoContribution>
    supporters(
      id: Id,
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<PublicSupporter>>
    dashboard(options?: RequestOptions): Promise<FundraisingDashboard>
  }
  missions: {
    list(
      filters: MissionFilters,
      options?: RequestOptions,
    ): Promise<Page<MissionSummary>>
    get(slug: string, options?: RequestOptions): Promise<MissionDetail>
    create(
      input: MissionInput,
      options?: RequestOptions,
    ): Promise<MissionDetail>
    participations(
      filters: ParticipationFilters,
      options?: RequestOptions,
    ): Promise<Page<MissionParticipation>>
    accept(
      missionId: Id,
      options?: RequestOptions,
    ): Promise<MissionParticipation>
    submit(
      participationId: Id,
      input: MissionEvidenceInput,
      options?: RequestOptions,
    ): Promise<MissionParticipation>
    review(
      participationId: Id,
      input: MissionReviewInput,
      options?: RequestOptions,
    ): Promise<MissionParticipation>
  }
  kibble: {
    wallet(options?: RequestOptions): Promise<KibbleWallet>
    transactions(
      query: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<KibbleEntry>>
    leaderboard(
      period: LeaderboardPeriod,
      query: LeaderboardQuery,
      options?: RequestOptions,
    ): Promise<LeaderboardPage>
  }
  shelters: {
    list(
      filters: ListQuery,
      options?: RequestOptions,
    ): Promise<Page<ShelterSummary>>
    get(slug: string, options?: RequestOptions): Promise<ShelterProfile>
    dashboard(id: Id, options?: RequestOptions): Promise<ShelterDashboard>
  }
  events: {
    list(
      filters: EventFilters,
      options?: RequestOptions,
    ): Promise<Page<EventSummary>>
    get(slug: string, options?: RequestOptions): Promise<EventDetail>
    create(input: EventInput, options?: RequestOptions): Promise<EventDetail>
    update(
      id: Id,
      input: EventInput,
      options?: RequestOptions,
    ): Promise<EventDetail>
    setRsvp(
      id: Id,
      attending: boolean,
      options?: RequestOptions,
    ): Promise<EventDetail>
  }
}
