import 'server-only'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { createMockApi } from '@/lib/api/adapters/mock'
import { createDjangoApi } from '@/lib/api/adapters/django'
import { getApiConfig } from '@/lib/api/config'
import { actorSchema } from '@/features/auth/schemas'
import { ApiError } from '@/lib/api/errors'
import type { ApiContext } from '@/lib/server/api-registry'
import {
  openDemoRepository,
  resetRepository,
  validateSessionId,
} from './repository'

export const DEMO_COOKIE = 'pawtrail_demo'
export const demoDataDir = () =>
  process.env.DEMO_DATA_DIR || resolve('.pawtrail/demo')
export function readDemoSessionId(cookie: string | null): string | undefined {
  const values = (cookie ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${DEMO_COOKIE}=`))
  if (!values.length) return undefined
  if (values.length !== 1)
    throw new ApiError('INVALID_DEMO_SESSION', 'Ambiguous demo session', 400)
  const id = values[0].slice(DEMO_COOKIE.length + 1)
  validateSessionId(id)
  return id
}
export async function resolveDemoContext(
  request: Request,
): Promise<ApiContext> {
  const config = getApiConfig()
  if (config.mode === 'real') {
    const api = createDjangoApi(config.djangoOrigin, {
      allowCookieWrites: true,
    })
    const authMutation = [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/logout',
    ].includes(new URL(request.url).pathname)
    const actor = authMutation ? null : (await api.auth.session()).actor
    return { api, actor, mode: 'real' }
  }
  const sessionId = readDemoSessionId(request.headers.get('cookie'))
  // Recovery routes must remain reachable even when the stored schema is incompatible.
  const lifecycle = ['/api/v1/demo/session', '/api/v1/demo/reset'].includes(
    new URL(request.url).pathname,
  )
  if (!sessionId || lifecycle) return { api: createMockApi(), mode: 'mock' }
  const repository = await openDemoRepository(sessionId, demoDataDir())
  const snapshot = await repository.read((state) => state)
  const user = snapshot.data.users.find(
    (user) => user.id === snapshot.auth.actorId,
  )
  const scopedRepository: typeof repository = {
    mediaRoot: repository.mediaRoot,
    read: (query) => repository.read(query),
    transact: (command) =>
      repository.transact({
        ...command,
        execute(draft, clock) {
          if (draft.auth.cacheScope !== snapshot.auth.cacheScope)
            throw new ApiError(
              'SESSION_CHANGED',
              'Your account changed. Reload before submitting.',
              401,
            )
          return command.execute(draft, clock)
        },
      }),
  }
  return {
    api: createMockApi(snapshot.data, scopedRepository),
    actor: user ? actorSchema.parse(user) : null,
    mode: 'mock',
    demo: { sessionId, repository },
  }
}
export async function resetDemoSession(sessionId: string): Promise<void> {
  if (getApiConfig().mode !== 'mock')
    throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
  if (process.env.DEMO_ALLOW_RESET !== 'true')
    throw new ApiError('FORBIDDEN', 'Demo reset is disabled on this host', 403)
  await resetRepository(sessionId, demoDataDir())
}
/** Called only after the registry validates the explicit route, method and Origin. */
export async function handleDemoLifecycle(
  request: Request,
  path: string,
  headers: Headers,
): Promise<Response> {
  const current = readDemoSessionId(request.headers.get('cookie'))
  if (path === '/demo/reset') {
    if (!current)
      throw new ApiError(
        'UNAUTHENTICATED',
        'Initialize a demo session first',
        401,
      )
    await resetDemoSession(current)
  } else {
    const sessionId = current ?? randomBytes(32).toString('hex')
    const repository = await openDemoRepository(sessionId, demoDataDir())
    await repository.transact({
      name: 'demo.initialize',
      input: null,
      execute: () => undefined,
    })
    headers.set(
      'Set-Cookie',
      `${DEMO_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
    )
  }
  return new Response(null, { status: 204, headers })
}

/** Initialize cookie-only demo auth at the BFF boundary after CSRF/body validation. */
export async function initializeAuthContext(
  request: Request,
  headers: Headers,
): Promise<ApiContext> {
  if (getApiConfig().mode !== 'mock')
    throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
  const sessionId =
    readDemoSessionId(request.headers.get('cookie')) ??
    randomBytes(32).toString('hex')
  const repository = await openDemoRepository(sessionId, demoDataDir())
  headers.set(
    'Set-Cookie',
    `${DEMO_COOKIE}=${sessionId}; Path=/; HttpOnly; SameSite=Lax${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`,
  )
  return {
    mode: 'mock',
    api: createMockApi(
      await repository.read((state) => state.data),
      repository,
    ),
    demo: { sessionId, repository },
  }
}
