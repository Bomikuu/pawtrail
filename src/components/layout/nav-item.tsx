'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LinkPending } from './link-pending'
import { useSession } from '@/features/auth/session-provider'
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
  const pathname = usePathname()
  const href = destinationHref(destination, session, readyRoutes)
  const Icon = destination.icon
  const content = (
    <>
      <Icon size={20} aria-hidden="true" />
      <span>{destination.label}</span>
    </>
  )
  if (!href)
    return (
      <span
        className="nav-item nav-unavailable"
        aria-disabled="true"
        aria-label={`${destination.label} — Coming soon`}
        title="Coming soon"
      >
        {content}
        {!compact && <small>Coming soon</small>}
      </span>
    )
  return (
    <Link
      href={href}
      className="nav-item"
      aria-label={destination.label}
      aria-current={
        isCurrentDestination(pathname, destination.href) ? 'page' : undefined
      }
      onClick={onNavigate}
    >
      {content}
      <LinkPending />
    </Link>
  )
}
