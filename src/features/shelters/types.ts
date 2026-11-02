import type { z } from 'zod'
import type * as schemas from './schemas'
export type ShelterSummary = z.infer<typeof schemas.shelterSummarySchema>
export type ShelterProfile = z.infer<typeof schemas.shelterProfileSchema>
export type ShelterDashboard = z.infer<typeof schemas.shelterDashboardSchema>
