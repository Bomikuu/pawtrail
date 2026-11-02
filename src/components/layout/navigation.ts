import {
  Compass,
  Heart,
  HandCoins,
  HandHeart,
  MessagesSquare,
  Trophy,
  MapPin,
  House,
  CalendarDays,
  UserRound,
  LayoutDashboard,
  PawPrint,
  Bookmark,
  Bell,
  Cookie,
  Settings,
  ShieldCheck,
  Building2,
  ClipboardList,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Session } from '@/features/auth/types'
import { loginPath } from '@/features/auth/return-path'
import { isRouteReady } from '@/lib/route-readiness'
export type Destination = {
  label: string
  href: string
  icon: LucideIcon
  protected?: boolean
  role?: 'shelter_staff' | 'moderator'
}
/** Register an exact pathname or explicit dynamic page pattern only after its route ships. Never enable a whole prefix. */
export const READY_ROUTES: ReadonlySet<string> = new Set([
  '/',
  '/login',
  '/register',
  '/pets/[slug]',
])
export const mainDestinations: Destination[] = [
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Adopt', href: '/adopt', icon: Heart },
  { label: 'Fundraisers', href: '/fundraisers', icon: HandCoins },
  { label: 'Missions', href: '/missions', icon: HandHeart },
  { label: 'Community', href: '/community', icon: MessagesSquare },
  { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
]
export const extraDestinations: Destination[] = [
  { label: 'Hordes', href: '/hordes', icon: PawPrint },
  { label: 'Shelters', href: '/shelters', icon: House },
  { label: 'Events', href: '/events', icon: CalendarDays },
]
export const profileDestination: Destination = {
  label: 'Profile',
  href: '/dashboard/profile',
  icon: UserRound,
  protected: true,
}
export const dashboardDestinations: Destination[] = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  profileDestination,
  { label: 'My animals', href: '/dashboard/animals', icon: PawPrint },
  { label: 'My sightings', href: '/dashboard/sightings', icon: MapPin },
  { label: 'My adoptions', href: '/dashboard/adoptions', icon: Heart },
  { label: 'My fundraisers', href: '/dashboard/fundraisers', icon: HandCoins },
  { label: 'My missions', href: '/dashboard/missions', icon: HandHeart },
  { label: 'My events', href: '/dashboard/events', icon: CalendarDays },
  { label: 'Saved', href: '/dashboard/saved', icon: Bookmark },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { label: 'Kibble', href: '/dashboard/kibble', icon: Cookie },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  {
    label: 'Shelter management',
    href: '/dashboard/shelter',
    icon: Building2,
    role: 'shelter_staff',
  },
  {
    label: 'Shelter applications',
    href: '/dashboard/shelter/applications',
    icon: ClipboardList,
    role: 'shelter_staff',
  },
  {
    label: 'Moderation',
    href: '/dashboard/moderation',
    icon: ShieldCheck,
    role: 'moderator',
  },
].map((destination) => ({ ...destination, protected: true })) as Destination[]
export function destinationHref(
  destination: Destination,
  session: Session,
  readyRoutes: ReadonlySet<string>,
): string | null {
  if (!isRouteReady(destination.href, readyRoutes)) return null
  if (destination.role && !session.roles.includes(destination.role)) return null
  return destination.protected && !session.actor
    ? loginPath(destination.href)
    : destination.href
}
export function isCurrentDestination(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== '/dashboard' && pathname.startsWith(`${href}/`))
  )
}
