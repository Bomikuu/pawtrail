'use client'
import type { ReactNode } from 'react'
import { usePageNavigation } from './page-navigation'
import { cn } from '@/lib/utils'
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
    <div className={'navigation-region min-w-0 grid gap-5'}>
      {pending && fallback}
      <div
        className={cn(
          'navigation-region-content grid min-w-0 gap-5 [&[hidden]]:hidden [&:has([data-page-loading])]:animate-none',
          pending
            ? 'animate-none'
            : 'motion-safe:animate-[page-arrival_180ms_var(--motion-ease)]',
        )}
        hidden={!!pending}
        aria-busy={!!pending}
      >
        {children}
      </div>
    </div>
  )
}
