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
    <nav
      className={
        'mobile-nav fixed inset-x-0 bottom-0 z-40 border-t bg-card px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] md:hidden'
      }
      aria-label="Mobile navigation"
    >
      <ul className="m-0 grid list-none grid-cols-5 items-stretch p-0">
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
