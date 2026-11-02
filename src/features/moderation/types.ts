import type { z } from 'zod'
import type * as schemas from './schemas'
export type ReportInput = z.infer<typeof schemas.reportInputSchema>
export type Report = z.infer<typeof schemas.reportSchema>
export type ModerationItem = z.infer<typeof schemas.moderationItemSchema>
export type ModerationFilters = z.input<typeof schemas.moderationFiltersSchema>
export type ModerationDecision = z.infer<
  typeof schemas.moderationDecisionSchema
>
export type ReportReason = z.infer<typeof schemas.reportReasonSchema>
export type ModerationStore = z.infer<typeof schemas.moderationStoreSchema>
