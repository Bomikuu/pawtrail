import type { z } from 'zod'
import type * as schemas from './schemas'
export type MissionSummary = z.infer<typeof schemas.missionSummarySchema>
export type MissionDetail = z.infer<typeof schemas.missionDetailSchema>
export type MissionInput = z.infer<typeof schemas.missionInputSchema>
export type MissionFilters = z.input<typeof schemas.missionFiltersSchema>
export type MissionEvidenceInput = z.infer<
  typeof schemas.missionEvidenceInputSchema
>
export type MissionReviewInput = z.infer<
  typeof schemas.missionReviewInputSchema
>
export type MissionParticipation = z.infer<
  typeof schemas.missionParticipationSchema
>
export type ParticipationFilters = z.input<
  typeof schemas.participationFiltersSchema
>
