import 'server-only'
import type { PawTrailApi } from '../contracts'
import { createUnimplementedApi } from '../unimplemented'
/** I1 owns upstream serialization, refresh, pagination, and HTTP conformance. */
export function createDjangoApi(_origin: string): PawTrailApi {
  return createUnimplementedApi()
}
