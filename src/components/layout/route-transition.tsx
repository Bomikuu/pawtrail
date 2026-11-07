'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

/** Only page content changes; navigation, drafts outside the page and the app frame stay stable. */
export function RouteTransition({
  children,
  hidden = false,
}: {
  children: ReactNode
  hidden?: boolean
}) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className={cn(
        'route-transition min-w-0 [&_>_p]:max-w-[70ch] [&[hidden]]:hidden [&:has([data-page-loading])]:animate-none',
        hidden
          ? 'animate-none'
          : 'motion-safe:animate-[page-arrival_180ms_var(--motion-ease)]',
      )}
      hidden={hidden}
    >
      {children}
    </div>
  )
}
