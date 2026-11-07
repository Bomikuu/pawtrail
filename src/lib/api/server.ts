import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import type { PawTrailApi } from './contracts'
import { getApiConfig } from './config'
import { createMockApi } from './adapters/mock'
import { createDjangoApi } from './adapters/django'
import { DEMO_COOKIE, demoDataDir } from '@/lib/server/demo/session'
import { openDemoRepository } from '@/lib/server/demo/repository'
async function createServerApi(): Promise<PawTrailApi> {
  const config = getApiConfig()
  if (config.mode === 'real') return createDjangoApi(config.djangoOrigin)
  const sessionId = (await cookies()).get(DEMO_COOKIE)?.value
  if (!sessionId) return createMockApi()
  const repository = await openDemoRepository(sessionId, demoDataDir())
  return createMockApi(await repository.read((state) => state.data), repository)
}

/** Read-only render scope: neither APIs nor identities are shared across requests. */
export const getServerApi = cache(async (): Promise<PawTrailApi> => {
  const api = await createServerApi()
  // Layout, route guard and page can all ask for the same identity in one render.
  api.auth.session = cache(api.auth.session)
  return api
})
