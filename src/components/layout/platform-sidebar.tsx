'use client'
import Link from 'next/link'
import { ProfileLink } from '@/features/users/profile-link'
import {
  ArrowUpRight,
  LayoutDashboard,
  SquarePen,
  Bookmark,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { mainDestinations, extraDestinations } from './navigation'
import { NavItem } from './nav-item'

export function PlatformSidebar({
  readyRoutes,
}: {
  readyRoutes: ReadonlySet<string>
}) {
  const { session } = useSession()
  const community = mainDestinations.find((item) => item.href === '/community')!
  const destinations = [
    community,
    ...mainDestinations.filter((item) => item !== community),
  ]
  return (
    <>
      <nav aria-label="Platform navigation">
        <ul>
          {destinations.map((item) => (
            <li key={item.href}>
              <NavItem destination={item} readyRoutes={readyRoutes} />
            </li>
          ))}
        </ul>
      </nav>
      <nav aria-label="More in your community" className="secondary-nav">
        <ul>
          {extraDestinations.map((item) => (
            <li key={item.href}>
              <NavItem destination={item} readyRoutes={readyRoutes} />
            </li>
          ))}
          {session.actor && (
            <li>
              <NavItem
                destination={{
                  label: 'Saved',
                  href: '/dashboard/saved',
                  icon: Bookmark,
                  protected: true,
                }}
                readyRoutes={readyRoutes}
              />
            </li>
          )}
        </ul>
      </nav>
      <ButtonLink
        className="sidebar-post"
        href={
          session.actor ? '/community/create' : loginPath('/community/create')
        }
      >
        <SquarePen size={19} aria-hidden="true" />
        Create a post
      </ButtonLink>
      <div className="sidebar-community-note">
        <img
          src="/images/pawtrail/community-friends.webp"
          alt=""
          width={264}
          height={122}
          loading="lazy"
        />
        <p>A little care goes a long way.</p>
        <Link href="/missions">
          Find a way to help <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
      <Link
        className="workspace-switch"
        href={session.actor ? '/dashboard' : loginPath('/dashboard')}
      >
        <LayoutDashboard size={19} aria-hidden="true" />
        <span>Management dashboard</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
      {session.actor && (
        <ProfileLink
          username={session.actor.username}
          className="sidebar-account"
        >
          <CommunityAvatar
            name={session.actor.displayName}
            image={session.actor.avatar}
            userId={session.actor.id}
            small
          />
          <span>
            <strong>{session.actor.displayName}</strong>
            <small>@{session.actor.username}</small>
          </span>
        </ProfileLink>
      )}
    </>
  )
}
