import { ApiError } from './errors'
export type ApiConfig =
  { mode: 'mock' } | { mode: 'real'; djangoOrigin: string }
export function getApiConfig(
  env: { NEXT_PUBLIC_USE_MOCK_API?: string; DJANGO_API_BASE_URL?: string } = {
    NEXT_PUBLIC_USE_MOCK_API: process.env.NEXT_PUBLIC_USE_MOCK_API,
    DJANGO_API_BASE_URL: process.env.DJANGO_API_BASE_URL,
  },
): ApiConfig {
  if (env.NEXT_PUBLIC_USE_MOCK_API === 'true') return { mode: 'mock' }
  if (
    env.NEXT_PUBLIC_USE_MOCK_API !== undefined &&
    env.NEXT_PUBLIC_USE_MOCK_API !== 'false'
  )
    throw new ApiError(
      'CONFIGURATION_ERROR',
      'Explicit API mode is required',
      500,
    )
  try {
    const url = new URL(
      env.DJANGO_API_BASE_URL ??
        (process.env.NODE_ENV !== 'production'
          ? 'http://127.0.0.1:8002/api/v1'
          : ''),
    )
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error()
    return { mode: 'real', djangoOrigin: url.toString().replace(/\/$/, '') }
  } catch {
    throw new ApiError(
      'CONFIGURATION_ERROR',
      'Real mode requires a valid Django API origin',
      500,
    )
  }
}
