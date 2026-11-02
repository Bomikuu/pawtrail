import type { z } from 'zod'
import type * as schemas from './schemas'
export type Follow = z.infer<typeof schemas.followSchema>
export type FollowFilters = z.input<typeof schemas.followFiltersSchema>
