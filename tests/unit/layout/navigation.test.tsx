import { screen, within, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { AppShell } from '@/components/layout/app-shell'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { renderSession, guest, member } from './helpers'
vi.mock('next/navigation', () => ({ usePathname: () => '/community' }))
const ready = new Set([
  '/community',
  '/explore',
  '/adopt',
  '/fundraisers',
  '/missions',
  '/leaderboard',
  '/search',
  '/hordes',
  '/shelters',
  '/events',
  '/dashboard',
  '/dashboard/profile',
  '/dashboard/notifications',
  '/dashboard/kibble',
  '/dashboard/animals',
  '/dashboard/sightings',
  '/dashboard/adoptions',
  '/dashboard/fundraisers',
  '/dashboard/missions',
  '/dashboard/events',
  '/dashboard/saved',
  '/dashboard/settings',
  '/dashboard/shelter',
  '/dashboard/shelter/applications',
  '/dashboard/moderation',
])
it('provides desktop destinations, current page, supplied unread and non-cash Kibble, and sample labeling', () => {
  renderSession(
    <AppShell readyRoutes={ready} unreadCount={3} kibbleBalance={240}>
      <h1>Pet stories</h1>
    </AppShell>,
  )
  const desktop = within(
    screen.getByRole('navigation', { name: 'Main navigation' }),
  )
  for (const label of [
    'Explore',
    'Adopt',
    'Fundraisers',
    'Missions',
    'Community',
    'Leaderboard',
  ])
    expect(desktop.getByRole('link', { name: label })).toBeVisible()
  expect(desktop.getByRole('link', { name: 'Community' })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(screen.getByRole('link', { name: 'PawTrail home' })).toHaveAttribute(
    'href',
    '/community',
  )
  expect(
    screen.getByRole('link', { name: 'Notifications, 3 unread' }),
  ).toHaveAttribute('href', '/dashboard/notifications')
  expect(screen.getByText('240 Kibble')).toBeVisible()
  expect(screen.getByText(/non-cash rewards/i)).toBeVisible()
  expect(screen.getByText(/Sample community/)).toBeVisible()
  expect(screen.getByRole('main')).toHaveTextContent('Pet stories')
})
it('keeps the exact mobile order and gates unfinished routes without fabricated counts', () => {
  renderSession(
    <AppShell>
      <h1>Stories</h1>
    </AppShell>,
  )
  const mobile = screen.getByRole('navigation', { name: 'Mobile navigation' })
  expect(
    within(mobile)
      .getAllByTestId('mobile-destination')
      .map((item) => item.textContent),
  ).toEqual(['Explore', 'Adopt', 'Create', 'Community', 'Profile'])
  expect(within(mobile).queryByRole('link')).not.toBeInTheDocument()
  expect(screen.getByText('Unread count unavailable')).toBeVisible()
  expect(screen.getByText('Kibble balance unavailable')).toBeVisible()
  expect(screen.queryByText('0 Kibble')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('link', { name: 'PawTrail home' }),
  ).not.toBeInTheDocument()
})
it('opens the mobile drawer by keyboard, reaches extra routes, and restores focus', async () => {
  const user = userEvent.setup()
  renderSession(<AppShell readyRoutes={ready}>Stories</AppShell>)
  const trigger = screen.getByRole('button', { name: 'Open navigation' })
  trigger.focus()
  await user.keyboard('{Enter}')
  const dialog = await screen.findByRole('dialog', {
    name: 'More ways to help',
  })
  for (const label of [
    'Hordes',
    'Shelters',
    'Events',
    'Fundraisers',
    'Missions',
    'Leaderboard',
  ])
    expect(within(dialog).getByRole('link', { name: label })).toBeVisible()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
it('links ready protected destinations through sign-in and never leaks supplied private counts to guests', () => {
  renderSession(
    <AppShell readyRoutes={ready} unreadCount={9} kibbleBalance={700}>
      Stories
    </AppShell>,
    guest,
  )
  expect(
    within(
      screen.getByRole('navigation', { name: 'Mobile navigation' }),
    ).getByRole('link', { name: 'Profile' }),
  ).toHaveAttribute('href', '/login?returnTo=%2Fdashboard%2Fprofile')
  expect(screen.queryByText('700 Kibble')).not.toBeInTheDocument()
  expect(screen.queryByText('9 unread')).not.toBeInTheDocument()
})
it('offers all personal dashboard destinations and restricts staff and moderation destinations', () => {
  const { unmount } = renderSession(<DashboardNav readyRoutes={ready} />)
  for (const label of [
    'Overview',
    'Profile',
    'My animals',
    'My sightings',
    'My adoptions',
    'My fundraisers',
    'My missions',
    'My events',
    'Saved',
    'Notifications',
    'Kibble',
    'Settings',
  ])
    expect(screen.getByRole('link', { name: label })).toBeVisible()
  expect(screen.queryByText('Shelter management')).not.toBeInTheDocument()
  expect(screen.queryByText('Moderation')).not.toBeInTheDocument()
  unmount()
  renderSession(<DashboardNav readyRoutes={ready} />, {
    ...member,
    roles: ['shelter_staff', 'moderator'],
  })
  expect(
    screen.getByRole('link', { name: 'Shelter management' }),
  ).toHaveAttribute('href', '/dashboard/shelter')
  expect(
    screen.getByRole('link', { name: 'Shelter applications' }),
  ).toHaveAttribute('href', '/dashboard/shelter/applications')
  expect(screen.getByRole('link', { name: 'Moderation' })).toHaveAttribute(
    'href',
    '/dashboard/moderation',
  )
})
it('traps keyboard focus in the drawer until it is dismissed', async () => {
  const user = userEvent.setup()
  renderSession(<AppShell readyRoutes={ready}>Stories</AppShell>)
  await user.click(screen.getByRole('button', { name: 'Open navigation' }))
  const dialog = screen.getByRole('dialog', { name: 'More ways to help' })
  const close = within(dialog).getByRole('button', { name: 'Close navigation' })
  close.focus()
  await user.tab()
  expect(dialog).toContainElement(document.activeElement as HTMLElement)
  await user.tab({ shift: true })
  expect(close).toHaveFocus()
  await user.keyboard('{Escape}')
})
it('operates the account dropdown and restores focus to its trigger', async () => {
  const user = userEvent.setup()
  renderSession(<AppShell readyRoutes={ready}>Stories</AppShell>)
  const trigger = screen.getByRole('button', {
    name: 'Account for Sample Helper',
  })
  trigger.focus()
  await user.keyboard('{Enter}')
  expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
    'href',
    '/dashboard/profile',
  )
  expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
    'href',
    '/dashboard/settings',
  )
  expect(screen.getByRole('menuitem', { name: 'Sign out' })).toBeVisible()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
})
it('keeps real-mode content free of the sample banner and rejects invalid count values', () => {
  renderSession(
    <AppShell readyRoutes={ready} unreadCount={-1} kibbleBalance={Number.NaN}>
      Stories
    </AppShell>,
    { ...member, demo: false, mode: 'real' },
  )
  expect(screen.queryByText(/Sample community/)).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', {
      name: 'Notifications, Unread count unavailable',
    }),
  ).toBeVisible()
  expect(screen.getByText('Kibble balance unavailable')).toBeVisible()
})
