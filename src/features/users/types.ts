import type { z } from 'zod'
import type * as schemas from './schemas'
export type PrivacySettings = z.infer<typeof schemas.privacySettingsSchema>
export type PublicUser = z.infer<typeof schemas.publicUserSchema>
export type PrivateUser = z.infer<typeof schemas.privateUserSchema>
export type ProfileInput = z.infer<typeof schemas.profileInputSchema>
export type DashboardSummary = z.infer<typeof schemas.dashboardSummarySchema>

export type PublicProfile = z.infer<typeof schemas.publicProfileSchema>
export type PublicIdentity = z.infer<typeof schemas.publicIdentitySchema>
export type PublicIdentityQuery = z.input<
  typeof schemas.publicIdentityQuerySchema
>
export type PublicIdentities = z.infer<typeof schemas.publicIdentitiesSchema>
