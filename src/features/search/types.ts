import type { z } from 'zod'
import type * as schemas from './schemas'
export type SearchQuery = z.input<typeof schemas.searchQuerySchema>
export type SearchResults = z.infer<typeof schemas.searchResultsSchema>
