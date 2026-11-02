import type { z } from 'zod'
import type * as schemas from './schemas'
export type HordeSummary = z.infer<typeof schemas.hordeSummarySchema>
export type HordeProfile = z.infer<typeof schemas.hordeProfileSchema>
