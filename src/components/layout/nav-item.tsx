'use client'
import { NavigationLink } from './navigation-link'
import { usePathname } from 'next/navigation'
import { usePageNavigation } from './page-navigation'
import { useSession } from '@/features/auth/session-provider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  destinationHref,
  isCurrentDestination,
  type Destination,
} from './navigation'
export function NavItem({
  destination,
  readyRoutes,
  onNavigate,
  compact = false,
}: {
  destination: Destination
  readyRoutes: ReadonlySet<string>
  onNavigate?: () => void
  compact?: boolean
}) {
  const { session } = useSession()
  const actualPathname = usePathname()
  const navigation = usePageNavigation()
  const pathname = navigation?.pathname ?? actualPathname
  const href = destinationHref(destination, session, readyRoutes)
  const active = isCurrentDestination(pathname, destination.href)
  const Icon = destination.icon
  const content = (
    <>
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <span>{destination.label}</span>
    </>
  )
  if (!href)
    return (
      <span
        className="nav-item flex min-h-11 items-center gap-3 px-3 py-2 text-sm text-muted-foreground opacity-60"
        aria-disabled="true"
        aria-label={`${destination.label} — Coming soon`}
      >
        {content}
        {!compact && <small className="ms-auto text-xs">Coming soon</small>}
      </span>
    )
  return (
    <Button
      variant="ghost"
      asChild
      className={cn(
        'nav-item h-auto min-h-11 w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground',
        active && 'bg-accent font-semibold text-accent-foreground',
        compact &&
          'min-h-13 flex-col justify-center gap-1 px-1 text-[0.625rem]',
      )}
    >
      <NavigationLink
        href={href}
        activePath={destination.href}
        aria-label={destination.label}
        aria-current={active ? 'page' : undefined}
        onNavigate={onNavigate}
      >
        {content}
      </NavigationLink>
    </Button>
  )
}
