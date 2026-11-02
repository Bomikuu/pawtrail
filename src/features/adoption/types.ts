import type { z } from 'zod'
import type * as schemas from './schemas'
export type AdoptionPreferences = z.infer<
  typeof schemas.adoptionPreferencesSchema
>
export type AdoptionFilters = z.input<typeof schemas.adoptionFiltersSchema>
export type AdoptionCandidate = z.infer<typeof schemas.adoptionCandidateSchema>
export type ApplicationAnswers = z.infer<
  typeof schemas.applicationAnswersSchema
>
export type AdoptionApplicationDraft = z.infer<
  typeof schemas.adoptionApplicationDraftSchema
>
export type AdoptionApplicationInput = z.infer<
  typeof schemas.adoptionApplicationInputSchema
>
export type AdoptionApplicationSummary = z.infer<
  typeof schemas.adoptionApplicationSummarySchema
>
export type AdoptionApplication = z.infer<
  typeof schemas.adoptionApplicationSchema
>
export type ApplicationFilters = z.input<
  typeof schemas.applicationFiltersSchema
>
export type ApplicationReviewInput = z.infer<
  typeof schemas.applicationReviewInputSchema
>
