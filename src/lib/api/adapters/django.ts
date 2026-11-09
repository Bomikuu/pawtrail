import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { PawTrailApi } from '../contracts'
import type { request } from '../http'
import { createApiClient } from '../client'
import { fromDjango, toDjango } from '../serialization'
import { ApiError, checkCancelled } from '../errors'
import { parseResponse } from '../validation'
import {
  readRealSession,
  writeRealSession,
  assertRealSessionConfiguration,
  type Tokens,
} from '@/lib/server/real-session'
const refreshFlights = new Map<string, Promise<Tokens>>()
const tokenResponse = z.object({
  access: z.string().min(1),
  refresh: z.string().optional(),
})
const errorBody = z
  .object({
    code: z.string().optional(),
    message: z.string().optional(),
    detail: z.string().optional(),
  })
  .passthrough()
async function upstreamError(response: Response): Promise<never> {
  const value = errorBody.safeParse(await response.json().catch(() => null))
  throw new ApiError(
    value.success ? (value.data.code ?? 'UPSTREAM_ERROR') : 'UPSTREAM_ERROR',
    value.success
      ? (value.data.message ??
          value.data.detail ??
          'The backend could not complete this request.')
      : 'The backend returned an unreadable error.',
    response.status,
  )
}
function endpoint(origin: string, path: string) {
  const base = new URL(origin.endsWith('/') ? origin : origin + '/')
  const url = new URL(path.replace(/^\//, ''), base)
  if (
    url.origin !== base.origin ||
    !url.pathname.startsWith(base.pathname) ||
    url.username ||
    url.password
  )
    throw new ApiError('INVALID_UPSTREAM', 'Invalid backend path', 500)
  return url
}
function fingerprint(url: URL) {
  const q = new URLSearchParams(url.search)
  q.delete('cursor')
  q.delete('page')
  q.delete('offset')
  q.sort()
  return createHash('sha256').update(`${url.pathname}?${q}`).digest('hex')
}
export function createDjangoApi(
  origin: string,
  {
    allowCookieWrites = false,
    forceRefresh = false,
    googleRedirectUri,
  }: {
    allowCookieWrites?: boolean
    forceRefresh?: boolean
    googleRedirectUri?: string
  } = {},
): PawTrailApi {
  let tokensPromise: Promise<Tokens | null> | undefined
  const tokens = () => (tokensPromise ??= readRealSession())
  async function refresh(signal?: AbortSignal) {
    const prior = await tokens()
    if (!prior)
      throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
    const id = createHash('sha256').update(prior.refresh).digest('hex')
    let flight = refreshFlights.get(id)
    if (!flight) {
      flight = (async () => {
        const response = await fetch(endpoint(origin, '/auth/refresh'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: prior.refresh }),
          cache: 'no-store',
          redirect: 'error',
          signal: AbortSignal.timeout(15000),
        })
        if (!response.ok) return upstreamError(response)
        const p = tokenResponse.parse(await response.json())
        return {
          access: p.access,
          refresh: p.refresh ?? prior.refresh,
          scope: prior.scope,
        }
      })().finally(() => refreshFlights.delete(id))
      refreshFlights.set(id, flight)
    }
    const next = await flight
    checkCancelled(signal)
    tokensPromise = Promise.resolve(next)
    if (allowCookieWrites) await writeRealSession(next)
    return next
  }
  const transport: typeof request = async (
    method,
    path,
    schema,
    query,
    body,
    options,
  ) => {
    checkCancelled(options?.signal)
    if (path.startsWith('/demo/') || path.endsWith('/demo-contributions'))
      throw new ApiError(
        'DEMO_ONLY',
        'Demonstration operations are unavailable in real mode',
        403,
      )
    const upstreamPath =
      path.startsWith('/animals') || (path === '/sightings' && method === 'GET')
        ? '/social' + path
        : path
    const url = endpoint(origin, upstreamPath)
    const params = toDjango(query ?? {}) as Record<string, unknown>
    for (const [k, v] of Object.entries(params))
      if (v !== undefined && k !== 'cursor')
        url.searchParams.set(
          k,
          typeof v === 'object' ? JSON.stringify(v) : String(v),
        )
    const cursor = (query as { cursor?: string } | undefined)?.cursor
    if (cursor) {
      try {
        const p = z
          .object({
            scope: z.string(),
            paging: z.record(z.string(), z.string()),
          })
          .parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')))
        if (
          p.scope !== fingerprint(url) ||
          Object.keys(p.paging).some(
            (k) => !['page', 'cursor', 'offset'].includes(k),
          )
        )
          throw new Error()
        for (const [k, v] of Object.entries(p.paging))
          url.searchParams.set(k, v)
      } catch {
        throw new ApiError(
          'INVALID_CURSOR',
          'This page cursor does not belong to this search',
          400,
        )
      }
    }
    const signingIn = [
      '/auth/login',
      '/auth/register',
      '/auth/google',
    ].includes(path)
    if (signingIn) assertRealSessionConfiguration()
    if (path === '/auth/google' && (!allowCookieWrites || !googleRedirectUri))
      throw new ApiError(
        'CONFIGURATION_ERROR',
        'Google sign-in requires a same-origin browser request',
        500,
      )
    let credentials = await tokens()
    if (forceRefresh && path === '/auth/session' && credentials)
      credentials = await refresh(options?.signal)
    if (path === '/auth/session' && !credentials)
      return parseResponse(schema, {
        actor: null,
        roles: [],
        demo: false,
        mode: 'real',
        cacheScope: 'anonymous:real',
        expiresAt: null,
      })
    const headers = new Headers({ Accept: 'application/json' })
    if (options?.idempotencyKey)
      headers.set('Idempotency-Key', options.idempotencyKey)
    let payload: BodyInit | undefined
    if (body !== undefined) {
      if (
        body &&
        typeof body === 'object' &&
        'file' in body &&
        body.file instanceof Blob
      ) {
        const form = new FormData()
        for (const [k, v] of Object.entries(body)) {
          const encoded = Object.keys(toDjango({ [k]: null }) as object)[0]
          if (v instanceof Blob)
            form.set(
              encoded,
              v,
              (body as { filename?: string }).filename ?? 'attachment',
            )
          else if (v !== undefined) form.set(encoded, String(v))
        }
        payload = form
      } else {
        headers.set('Content-Type', 'application/json')
        payload = JSON.stringify(
          path === '/auth/google'
            ? { ...(toDjango(body) as object), redirect_uri: googleRedirectUri }
            : toDjango(body),
        )
      }
    }
    const send = () => {
      if (credentials)
        headers.set('Authorization', `Bearer ${credentials.access}`)
      return fetch(url, {
        method,
        headers,
        body: payload,
        signal: options?.signal
          ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
        cache: 'no-store',
        redirect: 'error',
      })
    }
    let response = await send()
    if (
      response.status === 401 &&
      credentials &&
      allowCookieWrites &&
      !signingIn &&
      path !== '/auth/logout'
    ) {
      try {
        credentials = await refresh(options?.signal)
        response = await send()
      } catch (e) {
        if (allowCookieWrites) await writeRealSession(null)
        throw e
      }
    }
    if (!response.ok) {
      if (response.status === 401 && allowCookieWrites)
        await writeRealSession(null)
      return upstreamError(response)
    }
    if (response.status === 204) return parseResponse(schema, undefined)
    const raw: unknown = await response.json().catch(() => {
      throw new ApiError(
        'INVALID_RESPONSE',
        'The backend returned invalid JSON',
        502,
      )
    })
    let value = fromDjango(raw)
    let pendingCredentials: Tokens | undefined
    if (signingIn) {
      const r = raw as Record<string, unknown>,
        t = parseResponse(tokenResponse, r)
      const next = {
        access: t.access,
        refresh: t.refresh ?? '',
        scope: randomUUID(),
      }
      if (!next.refresh)
        throw new ApiError(
          'INVALID_RESPONSE',
          'The backend must return refresh and access credentials on sign-in',
          502,
        )
      pendingCredentials = next
      tokensPromise = Promise.resolve(next)
      value = fromDjango(r.session ?? r)
    }
    if (value && typeof value === 'object' && 'results' in value) {
      const p = value as {
        results: unknown
        count: number
        next: string | null
        previous?: string | null
      }
      let nextCursor: string | null = null
      if (p.next) {
        const next = new URL(p.next, url)
        if (next.origin !== url.origin || next.pathname !== url.pathname)
          throw new ApiError(
            'INVALID_PAGINATION',
            'The backend returned an unsafe pagination URL',
            502,
          )
        const paging = Object.fromEntries(
          [...next.searchParams].filter(([k]) =>
            ['page', 'cursor', 'offset'].includes(k),
          ),
        )
        if (!Object.keys(paging).length)
          throw new ApiError(
            'INVALID_PAGINATION',
            'The backend returned no usable pagination state',
            502,
          )
        nextCursor = Buffer.from(
          JSON.stringify({ scope: fingerprint(url), paging }),
        ).toString('base64url')
      }
      let previousCursor: string | null = null
      if (p.previous) {
        const previous = new URL(p.previous, url)
        if (
          previous.origin !== url.origin ||
          previous.pathname !== url.pathname
        )
          throw new ApiError(
            'INVALID_PAGINATION',
            'Unsafe previous-page URL',
            502,
          )
        const paging = Object.fromEntries(
          [...previous.searchParams].filter(([k]) =>
            ['page', 'cursor', 'offset'].includes(k),
          ),
        )
        previousCursor = Buffer.from(
          JSON.stringify({ scope: fingerprint(url), paging }),
        ).toString('base64url')
      }
      value = {
        ...value,
        items: p.results,
        count: p.count,
        nextCursor,
        previousCursor,
      }
    }
    if (path.startsWith('/auth/') && value && typeof value === 'object')
      value = {
        ...value,
        mode: 'real',
        demo: false,
        cacheScope: (await tokens())?.scope ?? 'anonymous:real',
      }
    const validated = parseResponse(schema, value)
    if (pendingCredentials && allowCookieWrites)
      await writeRealSession(pendingCredentials)
    return validated
  }
  const api = createApiClient(transport),
    logout = api.auth.logout
  const session = api.auth.session
  api.auth.session = async (options) => {
    try {
      return await session(options)
    } catch (e) {
      if (e instanceof ApiError && e.status === 401)
        return {
          actor: null,
          roles: [],
          demo: false,
          mode: 'real',
          cacheScope: 'anonymous:real',
          expiresAt: null,
        }
      throw e
    }
  }
  api.auth.logout = async (options) => {
    try {
      await logout(options)
    } finally {
      tokensPromise = Promise.resolve(null)
      if (allowCookieWrites) await writeRealSession(null)
    }
  }
  api.auth.selectDemoActor = async () => {
    throw new ApiError(
      'DEMO_ONLY',
      'Sample actors are disabled in real mode',
      403,
    )
  }
  return api
}
export function refreshDjangoSession(origin: string) {
  return createDjangoApi(origin, {
    allowCookieWrites: true,
    forceRefresh: true,
  }).auth.session()
}
export async function djangoMedia(
  origin: string,
  path: string,
  signal?: AbortSignal,
) {
  if (!/^\/media\/[A-Za-z0-9-]{1,120}\/(?:public|content)$/.test(path))
    throw new ApiError('NOT_FOUND', 'Media not found', 404)
  const credentials = await readRealSession(),
    headers = new Headers()
  if (credentials) headers.set('Authorization', `Bearer ${credentials.access}`)
  const response = await fetch(endpoint(origin, path), {
    headers,
    signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
      : AbortSignal.timeout(15000),
    redirect: 'error',
    cache: 'no-store',
  })
  if (!response.ok) return upstreamError(response)
  const mime = response.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase()
  if (
    !mime ||
    !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mime)
  )
    throw new ApiError(
      'INVALID_MEDIA',
      'The backend returned an unsupported media type',
      502,
    )
  if (Number(response.headers.get('content-length')) > 10 * 1024 * 1024)
    throw new ApiError(
      'INVALID_MEDIA',
      'The media exceeds the attachment size limit',
      502,
    )
  const result = new Headers({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
    'X-Robots-Tag': 'noindex, nofollow',
  })
  for (const key of ['content-type', 'content-disposition', 'content-length']) {
    const value = response.headers.get(key)
    if (value) result.set(key, value)
  }
  if (mime === 'application/pdf')
    result.set('Content-Disposition', 'attachment; filename="evidence.pdf"')
  let bytes = 0
  const body = response.body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        bytes += chunk.byteLength
        if (bytes > 10 * 1024 * 1024)
          throw new Error('Attachment size limit exceeded')
        controller.enqueue(chunk)
      },
    }),
  )
  return new Response(body, { status: response.status, headers: result })
}
