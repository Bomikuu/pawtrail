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
    <nav
      aria-label="Your dashboard"
      className={
        'dashboard-nav [&_ul]:m-0 [&_ul]:p-0 [&_ul]:list-none [.app-sidebar_&]:mt-6 [.app-sidebar_&]:pt-6 [.app-sidebar_&]:[border-top:1px_solid_var(--border)] [.management-shell_.app-sidebar_&]:m-0 [.management-shell_.app-sidebar_&]:p-0 [.management-shell_.app-sidebar_&]:[border:0]'
      }
    >
      {groups
        .filter((group) => group.items.length)
        .map((group) => (
          <section
            className={
              'management-nav-group mb-5 [&_h2]:font-[600] [&_h2]:text-xs [&_h2]:leading-[1.4] [&_h2]:font-sans [&_h2]:text-muted-foreground [&_h2]:[margin:0_0.875rem_0.5rem]'
            }
            key={group.label}
          >
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
