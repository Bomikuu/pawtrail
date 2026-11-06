'use client'
import type { ReactNode } from 'react'
import { usePageNavigation } from './page-navigation'
import { PageLoading } from './page-loading'

/** Landing, sign-in, and standalone pages have the same loading feedback as the app shell. */
export function NavigationContent({ children }: { children: ReactNode }) {
  const navigation = usePageNavigation()
  return (
    <>
      {navigation?.pending && <PageLoading />}
      <div
        className={'standalone-navigation-content contents [&[hidden]]:hidden'}
        hidden={navigation?.pending}
      >
        {children}
      </div>
    </>
  )
}
