import { DataState } from '@/components/shared/data-state'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { ButtonLink } from '@/components/ui/button-link'
import { isRouteReady } from '@/lib/route-readiness'
import { READY_ROUTES } from '@/components/layout/navigation'
export function MarketingDestination({
  href,
  children,
  readyRoutes = READY_ROUTES,
  action = false,
  secondary = false,
}: {
  href: string
  children: string
  readyRoutes?: ReadonlySet<string>
  action?: boolean
  secondary?: boolean
}) {
  if (!isRouteReady(href, readyRoutes))
    return (
      <span
        className={
          action
            ? 'marketing-unavailable marketing-action-unavailable'
            : 'marketing-unavailable'
        }
        aria-disabled="true"
        aria-label={`${children} — Coming soon`}
      >
        <span>{children}</span>
        <small>Coming soon</small>
      </span>
    )
  return action ? (
    <ButtonLink href={href} variant={secondary ? 'outline' : 'default'}>
      {children}
    </ButtonLink>
  ) : (
    <Link href={href}>{children}</Link>
  )
}
export type MarketingRoutes = { readyRoutes?: ReadonlySet<string> }
export function PreviewFrame({
  state,
  empty,
  error,
  children,
}: {
  state: 'ready' | 'empty' | 'error'
  empty: string
  error: string
  children: ReactNode
}) {
  if (state === 'ready') return children
  return (
    <div className="marketing-preview-state">
      <DataState
        state={state}
        emptyTitle={empty}
        emptyDescription="You can still explore the section below."
        errorMessage={error}
      />
      {state === 'error' && (
        <ButtonAnchor href="/" variant="outline">
          Reload previews
        </ButtonAnchor>
      )}
    </div>
  )
}
