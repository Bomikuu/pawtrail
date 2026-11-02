import 'server-only'
import type { PawTrailApi } from './contracts'
import { getApiConfig } from './config'
import { createMockApi } from './adapters/mock'
import { createDjangoApi } from './adapters/django'
/** A fresh service per request; F4 will resolve server-owned session context here. */
export async function getServerApi(): Promise<PawTrailApi> {
  const config = getApiConfig()
  return config.mode === 'mock'
    ? createMockApi()
    : createDjangoApi(config.djangoOrigin)
}
