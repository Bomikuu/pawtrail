'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/** Only page content changes; navigation, drafts outside the page and the app frame stay stable. */
export function RouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="route-transition">
      {children}
    </div>
  )
}
