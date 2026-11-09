import 'server-only'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { join } from 'node:path'
import { z } from 'zod'
import { sessionSchema } from '@/features/auth/schemas'
import { assertSameOrigin } from './csrf'
import { readRealSession, writeRealSession, type Tokens } from './real-session'
import { ApiError, normalizeError } from '@/lib/api/errors'

const allowed: Record<string, RegExp[]> = {
  GET: [/^status$/, /^auth\/session$/, /^kibble\/(wallet|ledger)$/, /^identity\/setup$/, /^observations$/, /^observations\/[a-f0-9-]{36}$/, /^observations\/[a-f0-9-]{36}\/analysis$/, /^moderation\/animal-identities$/, /^animals$/, /^animals\/[a-f0-9-]{36}$/, /^animals\/[a-f0-9-]{36}\/references$/, /^media\/[a-f0-9-]{36}\/(content|public)$/],
  POST: [/^auth\/(login|register|logout)$/, /^identity\/calibrations$/, /^identity\/policies\/[0-9]+\/activation$/, /^media$/, /^captures$/, /^captures\/[a-f0-9-]{36}\/observations$/, /^observations\/[a-f0-9-]{36}\/(analysis|selection|submit)$/, /^moderation\/animal-identities\/[a-f0-9-]{36}\/decision$/, /^animals\/[a-f0-9-]{36}\/references$/],
  DELETE: [/^animals\/[a-f0-9-]{36}\/references\/[a-f0-9-]{36}$/],
}
const tokenSchema = z.object({ access: z.string().min(1), refresh: z.string().min(1), session: sessionSchema })
const refreshSchema = z.object({ access: z.string().min(1), refresh: z.string().min(1).optional() })
const refreshFlights = new Map<string, Promise<Tokens>>()
const anonymousSession = { actor: null, roles: [], demo: false, mode: 'real', cacheScope: 'capture-anonymous', expiresAt: null }

function connection() {
  const real = process.env.NEXT_PUBLIC_USE_MOCK_API === 'false'
  const origin = process.env.PAWTRAIL_CAPTURE_API_BASE_URL ?? (real ? process.env.DJANGO_API_BASE_URL : process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:8002/api/v1' : undefined)
  if (!origin) throw new ApiError('CAPTURE_NOT_CONFIGURED', 'Real capture is not configured on this server.', 503)
  const url = new URL(origin)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
    throw new ApiError('CAPTURE_NOT_CONFIGURED', 'The capture backend address is invalid.', 503)
  let secret = process.env.SESSION_SECRET
  if (!real) {
    secret = process.env.CAPTURE_SESSION_SECRET ?? secret
    if (!secret && process.env.NODE_ENV !== 'production') {
      const folder = join(process.cwd(), '.pawtrail')
      mkdirSync(folder, { recursive: true, mode: 0o700 })
      const file = join(folder, 'capture-session-secret')
      try { writeFileSync(file, randomBytes(48).toString('hex'), { flag: 'wx', mode: 0o600 }) }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error }
      secret = readFileSync(file, 'utf8').trim()
    }
  }
  if (!secret || secret.length < 32) throw new ApiError('CAPTURE_NOT_CONFIGURED', 'Capture sign-in requires a private session secret.', 503)
  return { origin: url.toString().replace(/\/$/, ''), cookie: real ? 'pawtrail_session' : 'pawtrail_capture_session', secret }
}

async function boundedBody(request: Request) {
  if (!request.body) return undefined
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 12 * 1024 * 1024) { await reader.cancel(); throw new ApiError('UPLOAD_TOO_LARGE', 'Choose a photo up to 10 MiB.', 413) }
    chunks.push(value)
  }
  return new Uint8Array(Buffer.concat(chunks))
}

export async function captureGateway(request: Request, path: string) {
  try {
    assertSameOrigin(request)
    if (!allowed[request.method]?.some((pattern) => pattern.test(path))) throw new ApiError('NOT_FOUND', 'Capture route not found.', 404)
    const config = connection()
    const upstreamPath = path === 'status' ? 'capture/status' : path
    const url = new URL(config.origin + '/' + upstreamPath)
    for (const [key, value] of new URL(request.url).searchParams) {
      if (['scope', 'limit', 'q', 'cursor'].includes(key)) url.searchParams.set(key, value)
    }
    let tokens = await readRealSession(config.cookie, config.secret)
    const headers = new Headers({ Accept: 'application/json' })
    const contentType = request.headers.get('content-type')
    if (contentType) headers.set('Content-Type', contentType)
    const idempotency = request.headers.get('idempotency-key')
    if (idempotency) headers.set('Idempotency-Key', idempotency.slice(0, 120))
    const body = await boundedBody(request)
    if (path === 'auth/session' && !tokens) return Response.json(anonymousSession, { headers: { 'Cache-Control': 'no-store' } })
    if (path === 'auth/logout') {
      if (tokens) {
        try {
          await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + tokens.access }, body: JSON.stringify({ refresh: tokens.refresh }), redirect: 'error', signal: AbortSignal.timeout(5000) })
        } catch { /* Local sign-out still completes if the backend cannot be reached. */ }
      }
      await writeRealSession(null, config.cookie, config.secret)
      return new Response(null, { status: 204 })
    }
    const send = () => {
      if (tokens) headers.set('Authorization', 'Bearer ' + tokens.access)
      return fetch(url, { method: request.method, headers, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000) })
    }
    let response = await send()
    if (response.status === 401 && tokens && !path.startsWith('auth/login') && !path.startsWith('auth/register')) {
      const refreshKey = tokens.scope + ':' + tokens.refresh
      let flight = refreshFlights.get(refreshKey)
      if (!flight) {
        const current = tokens
        flight = (async () => {
          const refreshed = await fetch(config.origin + '/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh: current.refresh }), redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(10000) })
          if (!refreshed.ok) throw new ApiError('UNAUTHENTICATED', 'Your capture session expired. Sign in again; your saved observations remain available.', 401)
          const value = refreshSchema.parse(await refreshed.json())
          return { access: value.access, refresh: value.refresh ?? current.refresh, scope: current.scope }
        })().finally(() => refreshFlights.delete(refreshKey))
        refreshFlights.set(refreshKey, flight)
      }
      tokens = await flight
      await writeRealSession(tokens, config.cookie, config.secret)
      response = await send()
    }
    if (path === 'auth/logout') {
      await writeRealSession(null, config.cookie, config.secret)
      return new Response(null, { status: 204 })
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      return Response.json({ code: data?.code ?? 'CAPTURE_REQUEST_FAILED', message: data?.message ?? 'The capture service could not complete this request.', status: response.status, ...(data?.fieldErrors ? { fieldErrors: data.fieldErrors } : {}) }, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
    }
    if (path === 'auth/login' || path === 'auth/register') {
      const result = tokenSchema.parse(await response.json())
      await writeRealSession({ access: result.access, refresh: result.refresh, scope: result.session.cacheScope }, config.cookie, config.secret)
      return Response.json(result.session, { headers: { 'Cache-Control': 'no-store' } })
    }
    if (path.startsWith('media/') && request.method === 'GET') {
      return new Response(response.body, { headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Content-Security-Policy': "default-src 'none'; sandbox" } })
    }
    return new Response(response.body, { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
  } catch (reason) {
    const error = reason instanceof ApiError ? reason : new ApiError('CAPTURE_UNAVAILABLE', 'The real capture backend is unavailable. Your selected photo has not been discarded.', 503)
    if (error.status === 401) {
      const config = connection()
      await writeRealSession(null, config.cookie, config.secret)
      if (path === 'auth/session') return Response.json(anonymousSession, { headers: { 'Cache-Control': 'no-store' } })
    }
    return Response.json(error.toJSON(), { status: error.status, headers: { 'Cache-Control': 'no-store' } })
  }
}
