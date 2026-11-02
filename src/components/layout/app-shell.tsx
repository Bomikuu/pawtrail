'use client'
import { useUnreadCount } from '@/features/notifications/queries'
import { useQuery } from '@tanstack/react-query'
import { getBrowserApi } from '@/lib/api/client'
import { queryKeys } from '@/lib/api/keys'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from '@/features/auth/session-provider'
import { DemoBanner } from '@/components/shared/demo-banner'
import { Header } from './header'
import { MobileNav } from './mobile-nav'
import { DashboardNav } from './dashboard-nav'
import { NavItem } from './nav-item'
import { mainDestinations, extraDestinations, READY_ROUTES } from './navigation'
export function AppShell({
  children,
  rightRail,
  readyRoutes = READY_ROUTES,
  unreadCount,
  kibbleBalance,
}: {
  children: ReactNode
  rightRail?: ReactNode
  readyRoutes?: ReadonlySet<string>
  unreadCount?: number
  kibbleBalance?: number
}) {
  const { session } = useSession()
  const pathname = usePathname()
  const unread = useUnreadCount(readyRoutes.has('/dashboard/notifications'))
  const wallet = useQuery({
    queryKey: queryKeys(session.cacheScope).detail('kibble', 'wallet'),
    queryFn: ({ signal }) => getBrowserApi().kibble.wallet({ signal }),
    enabled: !!session.actor && readyRoutes.has('/dashboard/kibble'),
  })
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header
        readyRoutes={readyRoutes}
        unreadCount={unreadCount ?? (unread.isError ? undefined : unread.data)}
        kibbleBalance={kibbleBalance ?? wallet.data?.balance}
      />
      {session.demo && <DemoBanner />}
      <div className={`app-columns${rightRail ? ' has-right-rail' : ''}`}>
        <aside className="app-sidebar">
          <nav aria-label="Main navigation">
            <ul>
              {mainDestinations.map((item) => (
                <li key={item.href}>
                  <NavItem destination={item} readyRoutes={readyRoutes} />
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="More ways to help" className="secondary-nav">
            <ul>
              {extraDestinations.map((item) => (
                <li key={item.href}>
                  <NavItem destination={item} readyRoutes={readyRoutes} />
                </li>
              ))}
            </ul>
          </nav>
          {pathname.startsWith('/dashboard') && (
            <DashboardNav readyRoutes={readyRoutes} />
          )}
        </aside>
        <main id="main-content" tabIndex={-1} className="app-content">
          {children}
        </main>
        {rightRail && (
          <aside aria-label="Nearby help and adoption" className="context-rail">
            {rightRail}
          </aside>
        )}
      </div>
      <MobileNav readyRoutes={readyRoutes} />
    </div>
  )
}
