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
  const groups = [
    {
      label: 'Workspace',
      items: dashboardDestinations.filter(
        (item) =>
          !item.role &&
          ![
            '/dashboard/profile',
            '/dashboard/settings',
            '/dashboard/notifications',
            '/dashboard/kibble',
            '/dashboard/achievements',
            '/dashboard/saved',
          ].includes(item.href),
      ),
    },
    {
      label: 'Your account',
      items: dashboardDestinations.filter((item) =>
        [
          '/dashboard/profile',
          '/dashboard/settings',
          '/dashboard/notifications',
          '/dashboard/kibble',
          '/dashboard/achievements',
          '/dashboard/saved',
        ].includes(item.href),
      ),
    },
    {
      label: 'Organization',
      items: dashboardDestinations.filter(
        (item) => item.role && session.roles.includes(item.role),
      ),
    },
  ]
  return (
    <nav aria-label="Your dashboard" className="dashboard-nav">
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section className="management-nav-group" key={group.label}>
            <h2>{group.label}</h2>
            <ul>
              {group.items.map((item) => (
                <li key={item.href}>
                  <NavItem
                    destination={item}
                    readyRoutes={readyRoutes}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </nav>
  )
}
