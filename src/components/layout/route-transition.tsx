'use client'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

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
      className={
        'route-transition [&_>_p]:max-w-[70ch] min-w-0 [animation:page-arrival_200ms_var(--motion-ease)] [&[hidden]]:hidden [&:has(>_.page-loading)]:[animation:none] motion-reduce:[animation:none]'
      }
      hidden={hidden}
    >
      {children}
    </div>
  )
}
