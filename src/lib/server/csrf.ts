import 'server-only'
import { ApiError } from '@/lib/api/errors'
export function assertSameOrigin(request: Request): void {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return
  if (
    request.headers.get('origin') !== new URL(request.url).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    throw new ApiError('FORBIDDEN', 'A same-origin request is required', 403)
  }
}
