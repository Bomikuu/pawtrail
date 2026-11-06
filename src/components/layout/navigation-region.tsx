'use client'
import type { ReactNode } from 'react'
import { usePageNavigation } from './page-navigation'
export function NavigationRegion({
  region,
  fallback,
  children,
}: {
  region: string
  fallback: ReactNode
  children: ReactNode
}) {
  const navigation = usePageNavigation()
  const pending = navigation?.pending && navigation.region === region
  return (
    <div className="navigation-region">
      {pending && fallback}
      <div
        className="navigation-region-content"
        hidden={!!pending}
        aria-busy={!!pending}
      >
        {children}
      </div>
    </div>
  )
}
