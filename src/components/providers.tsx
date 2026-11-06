'use client'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query'
import { SessionProvider, useSession } from '@/features/auth/session-provider'
import type { Session } from '@/features/auth/types'
import type { PawTrailApi } from '@/lib/api/contracts'
import { PageNavigationProvider } from '@/components/layout/page-navigation'
export function scopedHydrationState(
  state: DehydratedState | undefined,
  scope: string,
): DehydratedState | undefined {
  return (
    state && {
      mutations: [],
      queries: state.queries.filter(
        (query) =>
          query.queryKey[0] === 'pawtrail' && query.queryKey[1] === scope,
      ),
    }
  )
}
function Hydration({
  children,
  state,
}: {
  children: ReactNode
  state?: DehydratedState
}) {
  const { session } = useSession()
  return (
    <HydrationBoundary state={scopedHydrationState(state, session.cacheScope)}>
      {children}
    </HydrationBoundary>
  )
}
export function Providers({
  initialSession,
  api,
  children,
  dehydratedState,
}: {
  initialSession: Session
  api?: PawTrailApi
  children: ReactNode
  dehydratedState?: DehydratedState
}) {
  return (
    <SessionProvider
      key={initialSession.cacheScope}
      initialSession={initialSession}
      api={api}
    >
      <PageNavigationProvider>
        <Hydration state={dehydratedState}>{children}</Hydration>
        <Toaster />
      </PageNavigationProvider>
    </SessionProvider>
  )
}
