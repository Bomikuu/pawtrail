import 'server-only'
import { cookies } from 'next/headers'
import type { PawTrailApi } from './contracts'
import { getApiConfig } from './config'
import { createMockApi } from './adapters/mock'
import { createDjangoApi } from './adapters/django'
import { DEMO_COOKIE, demoDataDir } from '@/lib/server/demo/session'
import { openDemoRepository } from '@/lib/server/demo/repository'
/** Request-scoped reads only: session cookies are established by route handlers. */
export async function getServerApi(): Promise<PawTrailApi> {
  const config = getApiConfig()
  if (config.mode === 'real') return createDjangoApi(config.djangoOrigin)
  const sessionId = (await cookies()).get(DEMO_COOKIE)?.value
  if (!sessionId) return createMockApi()
  const repository = await openDemoRepository(sessionId, demoDataDir())
  return createMockApi(await repository.read((state) => state.data))
}
