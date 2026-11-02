import 'server-only'
import { ApiError } from '@/lib/api/errors'

function requestOrigin(request: Request): string | null {
  const url = new URL(request.url)
  const host = request.headers.get('host')
  if (!host) return url.origin

  // NextURL normalizes loopback hosts to localhost. The browser's Host keeps
  // the actual authority, including its port. Do not trust forwarded headers.
  if (/[\s,/@\\?#]/.test(host)) return null
  try {
    return new URL(`${url.protocol}//${host}`).origin
  } catch {
    return null
  }
}

export function assertSameOrigin(request: Request): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return
  const origin = request.headers.get('origin')
  if (
    !origin ||
    origin !== requestOrigin(request) ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    throw new ApiError('FORBIDDEN', 'A same-origin request is required', 403)
  }
}
