import type { z } from 'zod'
import type * as schemas from './schemas'
export type AnimalHelper = z.infer<typeof schemas.animalHelperSchema>
export type AnimalNeeds = z.infer<typeof schemas.animalNeedsSchema>
export type AnimalSummary = z.infer<typeof schemas.animalSummarySchema>
export type AnimalProfile = z.infer<typeof schemas.animalProfileSchema>
export type AnimalRecord = z.infer<typeof schemas.animalRecordSchema>
export type AnimalFilters = z.input<typeof schemas.animalFiltersSchema>
export type AnimalReportInput = z.infer<typeof schemas.animalReportInputSchema>
export type AnimalUpdateInput = z.infer<typeof schemas.animalUpdateInputSchema>
