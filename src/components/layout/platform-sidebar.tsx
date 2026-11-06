'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
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
      <nav
        aria-label="More in your community"
        className={
          'secondary-nav mt-6 pt-6 [border-top:1px_solid_var(--border)] [.app-shell_&]:mt-3.5 [.app-shell_&]:pt-3.5 [.app-shell_&]:border-border'
        }
      >
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
        className={'sidebar-post mt-5 w-full rounded-xl'}
        href={
          session.actor ? '/community/create' : loginPath('/community/create')
        }
      >
        <SquarePen size={19} aria-hidden="true" />
        Create a post
      </ButtonLink>
      <div
        className={
          'sidebar-community-note [margin:1.5rem_0.75rem_1rem] [&_img]:w-36 [&_img]:h-auto [&_img]:block [&_img]:[mix-blend-mode:multiply] [&_p]:font-[800] [&_p]:text-base [&_p]:leading-[1.35] [&_p]:font-heading [&_p]:[margin:0.75rem_0_0.375rem] [&_a]:inline-flex [&_a]:gap-1.5 [&_a]:items-center [&_a]:text-[0.8125rem] [&_a]:no-underline'
        }
      >
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
        className={
          'workspace-switch flex items-center gap-2 text-[0.8125rem] [padding:0.875rem_0.75rem] mt-4 [border-top:1px_solid_var(--social-line)] text-muted-foreground no-underline [&:hover]:text-[color:var(--teal)] [&:hover]:bg-card [&_>_svg]:shrink-0'
        }
        href={session.actor ? '/dashboard' : loginPath('/dashboard')}
      >
        <LayoutDashboard size={19} aria-hidden="true" />
        <span>Management dashboard</span>
        <ArrowUpRight size={15} aria-hidden="true" />
      </Link>
      {session.actor && (
        <ProfileLink
          username={session.actor.username}
          className={
            'sidebar-account flex items-center gap-2.5 p-3 no-underline text-foreground rounded-[0.625rem] [&:hover]:bg-[#e9ecef] [&_strong]:block [&_strong]:[overflow-wrap:anywhere] [&_strong]:text-[0.8125rem] [&_small]:block [&_small]:[overflow-wrap:anywhere] [&_small]:text-xs [&_small]:text-muted-foreground'
          }
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
