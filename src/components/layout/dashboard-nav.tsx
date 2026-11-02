'use client'
import { useSession } from '@/features/auth/session-provider'
import { dashboardDestinations, READY_ROUTES } from './navigation'
import { NavItem } from './nav-item'
export function DashboardNav({
  readyRoutes = READY_ROUTES,
  onNavigate,
}: {
  readyRoutes?: ReadonlySet<string>
  onNavigate?: () => void
}) {
  const { session } = useSession()
  return (
    <nav aria-label="Your dashboard" className="dashboard-nav">
      <ul>
        {dashboardDestinations
          .filter((item) => !item.role || session.roles.includes(item.role))
          .map((item) => (
            <li key={item.href}>
              <NavItem
                destination={item}
                readyRoutes={readyRoutes}
                onNavigate={onNavigate}
              />
            </li>
          ))}
      </ul>
    </nav>
  )
}
