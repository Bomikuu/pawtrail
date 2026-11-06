'use client'
import { useUnreadCount } from '@/features/notifications/queries'
import { useQuery } from '@tanstack/react-query'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/features/auth/session-provider'
import { DemoBanner } from '@/components/shared/demo-banner'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { RouteTransition } from './route-transition'
import { DashboardNav } from './dashboard-nav'
import { PlatformSidebar } from './platform-sidebar'
import {
  dashboardDestinations,
  isCurrentDestination,
  READY_ROUTES,
} from './navigation'
export function AppShell({
  children,
  rightRail,
  readyRoutes = READY_ROUTES,
  unreadCount,
  kibbleBalance,
  variant = 'platform',
}: {
  children: ReactNode
  rightRail?: ReactNode
  readyRoutes?: ReadonlySet<string>
  unreadCount?: number
  kibbleBalance?: number
  variant?: 'platform' | 'management'
}) {
  const { session } = useSession()
  const pathname = usePathname()
  const management = variant === 'management'
  const current = dashboardDestinations.find((item) =>
    isCurrentDestination(pathname, item.href),
  )
  const unread = useUnreadCount(readyRoutes.has('/dashboard/notifications'))
  const wallet = useQuery({
    queryKey: queryKeys(session.cacheScope).detail('kibble', 'wallet'),
    queryFn: ({ signal }) => getBrowserApi().kibble.wallet({ signal }),
    enabled: !!session.actor && readyRoutes.has('/dashboard/kibble'),
  })
  return (
    <div
      className={
        'app-shell ' + (management ? 'management-shell' : 'platform-shell')
      }
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        variant={variant}
        readyRoutes={readyRoutes}
        unreadCount={unreadCount ?? (unread.isError ? undefined : unread.data)}
        kibbleBalance={kibbleBalance ?? wallet.data?.balance}
      />
      {session.demo && <DemoBanner />}
      <div className={`app-columns${rightRail ? ' has-right-rail' : ''}`}>
        <aside
          className="app-sidebar"
          aria-label={management ? 'Management workspace' : 'PawTrail platform'}
        >
          {management ? (
            <>
              <div className="workspace-heading">
                <strong>Your workspace</strong>
                <span>Manage your contributions</span>
              </div>
              <DashboardNav readyRoutes={readyRoutes} />
              <Link href="/community" className="workspace-switch">
                <ArrowLeft size={18} aria-hidden="true" />
                Back to the community
              </Link>
            </>
          ) : (
            <PlatformSidebar readyRoutes={readyRoutes} />
          )}
        </aside>
        <main
          id="main-content"
          tabIndex={-1}
          className={
            'app-content' +
            (pathname === '/community' ? ' community-content' : '')
          }
        >
          {management && (
            <nav className="workspace-breadcrumb" aria-label="Breadcrumb">
              <Link href="/dashboard">Management</Link>
              <span aria-hidden="true">/</span>
              <span>{current?.label ?? 'Record details'}</span>
            </nav>
          )}
          <RouteTransition>{children}</RouteTransition>
        </main>
        {rightRail && (
          <aside aria-label="Nearby help and adoption" className="context-rail">
            {rightRail}
          </aside>
        )}
      </div>
      <footer className="app-credits">
        <Link href="/photo-credits">Photo credits</Link>
      </footer>
      {!management && <MobileNav readyRoutes={readyRoutes} />}
    </div>
  )
}
