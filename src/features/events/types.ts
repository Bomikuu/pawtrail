import type { z } from 'zod'
import type * as schemas from './schemas'
export type EventInput = z.infer<typeof schemas.eventInputSchema>
export type EventSummary = z.infer<typeof schemas.eventSummarySchema>
export type EventDetail = z.infer<typeof schemas.eventDetailSchema>
export type EventFilters = z.input<typeof schemas.eventFiltersSchema>
