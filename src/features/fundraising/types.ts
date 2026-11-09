import type { z } from 'zod'
import type * as schemas from './schemas'
export type CampaignSummary = z.infer<typeof schemas.campaignSummarySchema>
export type CampaignStoryUpdateInput = z.infer<
  typeof schemas.campaignStoryUpdateInputSchema
>
export type CampaignStoryUpdate = z.infer<
  typeof schemas.campaignStoryUpdateSchema
>
export type ExpenseInput = z.input<typeof schemas.expenseInputSchema>
export type ExpenseEntry = z.infer<typeof schemas.expenseEntrySchema>
export type CampaignDetail = z.infer<typeof schemas.campaignDetailSchema>
export type CampaignInput = z.input<typeof schemas.campaignInputSchema>
export type CampaignUpdateInput = z.infer<
  typeof schemas.campaignUpdateInputSchema
>
export type CampaignDraft = z.infer<typeof schemas.campaignDraftSchema>
export type CampaignDraftSummary = z.infer<
  typeof schemas.campaignDraftSummarySchema
>
export type CampaignFilters = z.input<typeof schemas.campaignFiltersSchema>
export type DemoDonationInput = z.infer<typeof schemas.demoDonationInputSchema>
export type DemoContribution = z.infer<typeof schemas.demoContributionSchema>
export type PublicSupporter = z.infer<typeof schemas.publicSupporterSchema>
export type FundraisingDashboard = z.infer<
  typeof schemas.fundraisingDashboardSchema
>

export type SupportPledge = z.infer<typeof schemas.supportPledgeSchema>
