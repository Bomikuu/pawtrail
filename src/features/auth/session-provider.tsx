'use client'
import {
  createContext,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getBrowserApi } from '@/lib/api/client'
import { ApiError } from '@/lib/api/errors'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { Actor, LoginInput, RegisterInput, Session } from './types'
import { sessionSchema } from './schemas'
export async function clearSessionCache(client: QueryClient) {
  await client.cancelQueries()
  client.clear()
  if (typeof sessionStorage !== 'undefined') {
    for (const key of Object.keys(sessionStorage))
      if (key.startsWith('pawtrail:draft:')) sessionStorage.removeItem(key)
  }
}
export const createSessionQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: false },
      mutations: { retry: false },
    },
  })
interface SessionContext {
  session: Session
  pending: boolean
  login(input: LoginInput): Promise<Session>
  register(input: RegisterInput): Promise<Session>
  selectDemoActor(id: string): Promise<Session>
  logout(): Promise<void>
  updateIdentity(
    profile: Pick<Actor, 'id' | 'displayName' | 'avatar'>,
    scope: string,
  ): void
}
const Context = createContext<SessionContext | null>(null)
export function SessionProvider({
  initialSession,
  api: suppliedApi,
  children,
}: {
  initialSession: Session
  api?: PawTrailApi
  children: ReactNode
}) {
  const [session, setSession] = useState(initialSession)
  const [client, setClient] = useState(createSessionQueryClient)
  const [pending, setPending] = useState(false)
  const busy = useRef(false)
  const api = suppliedApi ?? getBrowserApi()
  async function change(operation: () => Promise<Session>) {
    if (busy.current)
      throw new ApiError(
        'CONFLICT',
        'A session change is already in progress',
        409,
      )
    busy.current = true
    setPending(true)
    try {
      await clearSessionCache(client)
      const next = sessionSchema.parse(await operation())
      setClient(createSessionQueryClient())
      setSession(next)
      return next
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <Context.Provider
      value={{
        session,
        pending,
        updateIdentity: (profile, scope) => {
          setSession((current) =>
            current.cacheScope === scope && current.actor?.id === profile.id
              ? {
                  ...current,
                  actor: {
                    ...current.actor,
                    displayName: profile.displayName,
                    avatar: profile.avatar,
                  },
                }
              : current,
          )
        },
        login: (input) => change(() => api.auth.login(input)),
        register: (input) => change(() => api.auth.register(input)),
        selectDemoActor: (id) => {
          if (!session.demo)
            return Promise.reject(
              new ApiError('DEMO_ONLY', 'Demo mode is required', 403),
            )
          return change(() => api.auth.selectDemoActor(id))
        },
        logout: async () => {
          await change(async () => {
            // Prepare the next identity before logout so no fallible reconciliation
            // can restore private observers after the server has signed out.
            const signedOut: Session = {
              actor: null,
              roles: [],
              demo: session.demo,
              mode: session.mode,
              cacheScope: `anonymous:${crypto.randomUUID()}`,
              expiresAt: null,
            }
            await api.auth.logout()
            return signedOut
          })
        },
      }}
    >
      <QueryClientProvider key={session.cacheScope} client={client}>
        {pending && <p role="status">Updating your session…</p>}
        <div hidden={pending}>{children}</div>
      </QueryClientProvider>
    </Context.Provider>
  )
}
export function useSession() {
  const context = useContext(Context)
  if (!context) throw new Error('SessionProvider is required')
  return context
}
