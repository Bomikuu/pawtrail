import type { z } from 'zod'
import type * as schemas from './schemas'
export type GeoArea = z.infer<typeof schemas.geoAreaSchema>
export type DiscoveryQuery = z.input<typeof schemas.discoveryQuerySchema>
export type DiscoveryResult = z.infer<typeof schemas.discoveryResultSchema>
