import 'server-only'
import {
  avatarPresetImage,
  personAvatar,
} from '@/features/users/avatar-presets'
import { randomUUID } from 'node:crypto'
import {
  actorSchema,
  loginInputSchema,
  registerInputSchema,
  sessionSchema,
} from '@/features/auth/schemas'
import type { Actor, Session } from '@/features/auth/types'
import type { ApiContext } from './api-registry'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { DemoRepository } from './demo/repository'
import type { DemoDraft } from './demo/transactions'
import { ApiError, checkCancelled } from '@/lib/api/errors'
import { parseInput } from '@/lib/api/validation'
import { getApiConfig } from '@/lib/api/config'
export function requireActor(context: ApiContext): Actor {
  if (!context.actor)
    throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
  return actorSchema.parse(context.actor)
}
export function anonymousSession(mode: 'mock' | 'real' = 'mock'): Session {
  return {
    actor: null,
    roles: [],
    demo: mode === 'mock',
    mode,
    cacheScope: `anonymous:${mode}`,
    expiresAt: null,
  }
}
function projectSession(draft: DemoDraft): Session {
  const record = draft.data.users.find((user) => user.id === draft.auth.actorId)
  const actor = record
    ? actorSchema.parse({
        ...record,
        avatar: personAvatar(record.avatar, record.id),
      })
    : null
  return sessionSchema.parse({
    actor,
    roles: actor?.roles ?? [],
    demo: true,
    mode: 'mock',
    cacheScope: draft.auth.cacheScope,
    expiresAt: null,
  })
}
export function createDemoAuth(
  repository?: DemoRepository,
): PawTrailApi['auth'] {
  function writable() {
    if (getApiConfig().mode !== 'mock')
      throw new ApiError('DEMO_ONLY', 'Demo mode is required', 403)
    if (!repository)
      throw new ApiError(
        'UNAUTHENTICATED',
        'Initialize a demo session first',
        401,
      )
    return repository
  }
  const select = async (id: string) =>
    writable().transact({
      name: 'auth.select',
      input: { actorId: id },
      execute(draft) {
        if (!draft.data.users.some((user) => user.id === id))
          throw new ApiError('NOT_FOUND', 'Demo persona not found', 404)
        draft.auth.actorId = id
        draft.auth.cacheScope = randomUUID()
        return projectSession(draft)
      },
    })
  return {
    async loginWithGoogle() {
      throw new ApiError(
        'GOOGLE_AUTH_UNAVAILABLE',
        'Google sign-in is unavailable in demo mode. Use a sample profile or demo email instead.',
        503,
      )
    },
    async session(options) {
      checkCancelled(options?.signal)
      return repository ? repository.read(projectSession) : anonymousSession()
    },
    async selectDemoActor(id, options) {
      checkCancelled(options?.signal)
      return select(id)
    },
    async login(input, options) {
      checkCancelled(options?.signal)
      const valid = parseInput(loginInputSchema, input)
      const userId = await writable().read(
        (draft) =>
          draft.data.users.find(
            (user) => user.email.toLowerCase() === valid.email.toLowerCase(),
          )?.id,
      )
      if (!userId)
        throw new ApiError(
          'INVALID_CREDENTIALS',
          'No demo profile uses that email. Choose a sample persona or create a demo profile.',
          401,
        )
      return select(userId)
    },
    async register(input, options) {
      checkCancelled(options?.signal)
      const valid = parseInput(registerInputSchema, input)
      // Password is intentionally absent from command input, state, and receipts.
      const profile = {
        email: valid.email.toLowerCase(),
        username: valid.username,
        displayName: valid.displayName,
      }
      const avatarId = valid.avatarId ?? null
      return writable().transact({
        name: 'auth.register',
        input: { ...profile, avatarId },
        execute(draft, clock) {
          if (
            draft.data.users.some(
              (user) =>
                user.email.toLowerCase() === profile.email ||
                user.username.toLowerCase() === profile.username.toLowerCase(),
            )
          )
            throw new ApiError(
              'CONFLICT',
              'That demo email or username is already in use',
              409,
            )
          const id = `demo-user-${randomUUID()}`
          draft.data.users.push({
            id,
            ...profile,
            createdAt: clock.now().toISOString(),
            provenance: { kind: 'demo', label: 'Demo community profile' },
            bio: '',
            bannerId: 'meadow',
            avatar: avatarId ? avatarPresetImage(avatarId) : null,
            location: null,
            contributionCount: 0,
            roles: ['member'],
            shelterIds: [],
            settings: {
              discoverable: false,
              showLocation: false,
              showContributions: false,
              publicAttendance: false,
            },
          })
          draft.auth.actorId = id
          draft.auth.cacheScope = randomUUID()
          return projectSession(draft)
        },
      })
    },
    async logout(options) {
      checkCancelled(options?.signal)
      if (!repository) return
      await writable().transact({
        name: 'auth.logout',
        input: null,
        execute(draft) {
          draft.auth.actorId = null
          draft.auth.cacheScope = randomUUID()
        },
      })
    },
  }
}
/** Request/session-scoped coordinator for I1 adapters. Credentials stay inside server callbacks. */
export function createRefreshCoordinator(adapter: {
  refresh(): Promise<void>
  logout(): Promise<void>
}) {
  let refresh: Promise<void> | undefined
  let generation = 0
  let ended = false
  let logout: Promise<void> | undefined
  const end = () => {
    ended = true
    return (logout ??= adapter.logout())
  }
  return {
    async run<T>(operation: () => Promise<T>): Promise<T> {
      if (ended)
        throw new ApiError('UNAUTHENTICATED', 'Sign in to continue', 401)
      const started = generation
      try {
        return await operation()
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) throw error
        if (ended) throw error
        try {
          if (started === generation) {
            refresh ??= adapter
              .refresh()
              .then(() => {
                generation++
              })
              .catch(async (failure) => {
                await end()
                throw failure
              })
              .finally(() => {
                refresh = undefined
              })
            await refresh
          }
          if (ended) throw error
          return await operation()
        } catch (failure) {
          if (failure instanceof ApiError && failure.status === 401) await end()
          throw failure
        }
      }
    },
  }
}
