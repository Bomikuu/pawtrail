import 'server-only'
import { getApiConfig } from '@/lib/api/config'
import { readRealSession } from '@/lib/server/real-session'
import { refreshDjangoSession } from '@/lib/api/adapters/django'
import { ApiError } from '@/lib/api/errors'
export async function landingRequest(
  path: string,
  init: RequestInit = {},
  publicRead = false,
) {
  const config = getApiConfig()
  if (config.mode !== 'real')
    throw new ApiError(
      'UNAVAILABLE',
      'Landing pages require the real PawTrail service.',
      503,
    )
  const origin =
    process.env.PAWTRAIL_LANDING_API_BASE_URL ??
    (process.env.NODE_ENV === 'development'
      ? 'http://127.0.0.1:8003/api/v1'
      : config.djangoOrigin)
  const tokens = publicRead ? null : await readRealSession()
  const headers = new Headers(init.headers)
  if (tokens) headers.set('Authorization', 'Bearer ' + tokens.access)
  let response = await fetch(origin + '/landing-pages/' + path, {
    ...init,
    headers,
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  })
  if (response.status === 401 && tokens) {
    await refreshDjangoSession(config.djangoOrigin)
    const renewed = await readRealSession()
    if (renewed) headers.set('Authorization', 'Bearer ' + renewed.access)
    response = await fetch(origin + '/landing-pages/' + path, {
      ...init,
      headers,
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(20000),
    })
  }
  return response
}
