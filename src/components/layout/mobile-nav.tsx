'use client'
import { CreateMenu } from './create-menu'
import { NavItem } from './nav-item'
import {
  mainDestinations,
  profileDestination,
  READY_ROUTES,
} from './navigation'
export function MobileNav({
  readyRoutes = READY_ROUTES,
}: {
  readyRoutes?: ReadonlySet<string>
}) {
  const items = [
    mainDestinations[0],
    mainDestinations[1],
    null,
    mainDestinations[4],
    profileDestination,
  ]
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <ul>
        {items.map((item) => (
          <li key={item?.href ?? 'create'} data-testid="mobile-destination">
            {item ? (
              <NavItem destination={item} readyRoutes={readyRoutes} compact />
            ) : (
              <CreateMenu readyRoutes={readyRoutes} mobile />
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
