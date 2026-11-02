import type { z } from 'zod'
import type * as schemas from './schemas'
export type Sighting = z.infer<typeof schemas.sightingSchema>
export type SightingInput = z.infer<typeof schemas.sightingInputSchema>
export type PrivateSighting = z.infer<typeof schemas.privateSightingSchema>
export type SightingFilters = z.input<typeof schemas.sightingFiltersSchema>
