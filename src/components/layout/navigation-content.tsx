'use client'
import type { ReactNode } from 'react'
import { usePageNavigation } from './page-navigation'
import { PageLoading } from './page-loading'
import { cn } from '@/lib/utils'

/** Landing, sign-in, and standalone pages have the same loading feedback as the app shell. */
export function NavigationContent({ children }: { children: ReactNode }) {
  const navigation = usePageNavigation()
  return (
    <>
      {navigation?.pending && <PageLoading pathname={navigation.pathname} />}
      <div
        className={cn(
          'standalone-navigation-content min-w-0 [&[hidden]]:hidden [&:has([data-page-loading])]:animate-none',
          navigation?.pending
            ? 'animate-none'
            : 'motion-safe:animate-[page-arrival_180ms_var(--motion-ease)]',
        )}
        hidden={navigation?.pending}
      >
        {children}
      </div>
    </>
  )
}
