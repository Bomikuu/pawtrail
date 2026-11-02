import 'server-only'
import type { Actor } from '@/features/auth/types'
import { readMedia } from './media/delivery'
import { MAX_UPLOAD_BYTES } from './media/validation'
import { requireActor } from './auth'
import { can } from './permissions'
import { assertSameOrigin } from './csrf'
import { handleDemoLifecycle, initializeAuthContext } from './demo/session'
import type { DemoRepository } from './demo/repository'
import type { PawTrailApi } from '@/lib/api/contracts'
import {
  ApiError,
  checkCancelled,
  normalizeError,
  notImplemented,
} from '@/lib/api/errors'
import { apiRoutes, type ApiRoute } from './api-routes'
export interface ApiContext {
  api: PawTrailApi
  mode: 'mock' | 'real'
  actor?: Actor | null
  demo?: { sessionId: string; repository: DemoRepository }
}
const reserved = [
  { method: 'POST', path: '/demo/session' },
  { method: 'POST', path: '/demo/reset' },
  { method: 'POST', path: '/auth/refresh' },
  { method: 'GET', path: '/media/:id/content' },
  { method: 'GET', path: '/media/:id/public' },
]
const routes: ApiRoute[] = [
  ...apiRoutes,
  ...reserved.map((route) => ({ ...route, invoke: notImplemented })),
].sort(
  (a, b) =>
    (a.path.match(/:/g)?.length ?? 0) - (b.path.match(/:/g)?.length ?? 0),
)
function match(pattern: string, path: string): Record<string, string> | null {
  const expected = pattern.split('/')
  const actual = path.split('/')
  if (expected.length !== actual.length) return null
  const params: Record<string, string> = {}
  for (let index = 0; index < expected.length; index++) {
    if (expected[index].startsWith(':')) {
      let value: string
      try {
        value = decodeURIComponent(actual[index])
      } catch {
        return null
      }
      if (!value || /[\/\\\u0000]/.test(value)) return null
      params[expected[index].slice(1)] = value
    } else if (expected[index] !== actual[index]) return null
  }
  return params
}
function readQuery(search: URLSearchParams): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  for (const [key, value] of search) {
    if (['limit', 'radiusMeters', 'latitude', 'longitude'].includes(key))
      query[key] = Number(value)
    else if (['adoptable', 'nearlyFunded', 'saved'].includes(key))
      query[key] = value === 'true' ? true : value === 'false' ? false : value
    else if (['preferences', 'bounds', 'kinds'].includes(key)) {
      try {
        query[key] = JSON.parse(value)
      } catch {
        throw new ApiError('VALIDATION_ERROR', 'Invalid query value', 400)
      }
    } else query[key] = value
  }
  return query
}
export async function dispatchApi(
  request: Request,
  context: ApiContext,
): Promise<Response> {
  const headers = new Headers({ 'Cache-Control': 'no-store' })
  try {
    checkCancelled(request.signal)
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/v1/'))
      throw new ApiError('NOT_FOUND', 'Endpoint not found', 404)
    const path = url.pathname.slice('/api/v1'.length)
    const first = routes.find((route) => match(route.path, path))
    if (!first) throw new ApiError('NOT_FOUND', 'Endpoint not found', 404)
    // An exact static route reserves its path, including its method restrictions.
    const candidates = routes.filter(
      (route) =>
        route.path === first.path ||
        route.path.replace(/:\w+/g, ':') === first.path.replace(/:\w+/g, ':'),
    )
    const route = candidates.find((route) => route.method === request.method)
    if (!route) {
      headers.set(
        'Allow',
        [...new Set(candidates.map((route) => route.method))].join(', '),
      )
      throw new ApiError('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
    }
    if (
      context.mode === 'real' &&
      (path.startsWith('/demo/') || path.endsWith('/demo-contributions'))
    )
      throw new ApiError(
        'DEMO_ONLY',
        'This operation is available only in demo mode',
        403,
      )
    assertSameOrigin(request)
    if (path === '/moderation' || path.startsWith('/moderation/')) {
      if (!can(requireActor(context), 'moderate'))
        throw new ApiError('FORBIDDEN', 'Moderator permission is required', 403)
    }
    if (path === '/demo/session' || path === '/demo/reset')
      return await handleDemoLifecycle(request, path, headers)
    if (
      route.method === 'GET' &&
      ['/media/:id/content', '/media/:id/public'].includes(route.path)
    ) {
      if (context.mode !== 'mock')
        throw new ApiError(
          'NOT_IMPLEMENTED',
          'Media delivery requires the real backend adapter',
          501,
        )
      if (!context.demo) throw new ApiError('NOT_FOUND', 'Media not found', 404)
      return await readMedia(
        context.demo.repository,
        match(route.path, path)!.id,
        route.path.endsWith('/public'),
      )
    }
    if (path === '/media' && request.method === 'POST') {
      requireActor(context)
      const length = Number(request.headers.get('content-length'))
      if (length > MAX_UPLOAD_BYTES + 65536)
        throw new ApiError('VALIDATION_ERROR', 'Upload is too large', 413)
      const reader = request.body?.getReader()
      if (!reader)
        throw new ApiError('VALIDATION_ERROR', 'Upload is required', 400)
      const chunks: Uint8Array[] = []
      let total = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > MAX_UPLOAD_BYTES + 65536) {
          await reader.cancel()
          throw new ApiError('VALIDATION_ERROR', 'Upload is too large', 413)
        }
        chunks.push(value)
      }
      request = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: Buffer.concat(chunks),
        signal: request.signal,
      })
    }
    let body: unknown
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      let form: FormData
      try {
        form = await request.formData()
      } catch {
        throw new ApiError('VALIDATION_ERROR', 'Invalid upload form', 400)
      }
      if (form.getAll('file').length !== 1 && path === '/media')
        throw new ApiError(
          'VALIDATION_ERROR',
          'Upload one attachment at a time',
          400,
        )
      body = {
        ...Object.fromEntries(form),
        sensitive: form.get('sensitive') === 'true',
      }
    } else if (request.body) {
      try {
        body = await request.json()
      } catch {
        throw new ApiError(
          'VALIDATION_ERROR',
          'Request body must be valid JSON',
          400,
        )
      }
    }
    if (
      context.mode === 'mock' &&
      !context.demo &&
      ['/auth/login', '/auth/register', '/demo/actor'].includes(path)
    )
      context = await initializeAuthContext(request, headers)
    const result = await route.invoke(
      context.api,
      match(route.path, path)!,
      readQuery(url.searchParams),
      body,
      {
        signal: request.signal,
        idempotencyKey: request.headers.get('idempotency-key') ?? undefined,
      },
    )
    checkCancelled(request.signal)
    return result === undefined
      ? new Response(null, { status: 204, headers })
      : Response.json(result, { headers })
  } catch (error) {
    const normalized = normalizeError(error)
    return Response.json(normalized.toJSON(), {
      status: normalized.status,
      headers,
    })
  }
}
