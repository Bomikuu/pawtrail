import { expect, it, vi } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import { AppShell } from '@/components/layout/app-shell'
import { renderSession } from '../layout/helpers'
const state = vi.hoisted(() => ({
  count: vi.fn().mockResolvedValue(3),
  list: vi.fn().mockResolvedValue({ items: [], count: 0, nextCursor: null }),
}))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({
    notifications: { unreadCount: state.count, list: state.list },
  }),
}))
vi.mock('next/navigation', () => ({ usePathname: () => '/community' }))
it('loads real unread values in the shell and exposes the recent activity menu', async () => {
  renderSession(
    <AppShell>
      <p>Community</p>
    </AppShell>,
  )
  expect(
    await screen.findByRole('link', { name: 'Notifications, 3 unread' }),
  ).toHaveAttribute('href', '/dashboard/notifications')
  expect(state.count).toHaveBeenCalled()
  fireEvent.pointerDown(
    screen.getByRole('button', { name: 'Open recent notifications' }),
    { button: 0, ctrlKey: false, pointerType: 'mouse' },
  )
  expect(
    await screen.findByText('No activity notifications yet.'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('menuitem', { name: 'View all activity' }),
  ).toHaveAttribute('href', '/dashboard/notifications')
})
it('clears the previous actor unread value while a new session loads', async () => {
  const { Providers } = await import('@/components/providers')
  const { member } = await import('../layout/helpers')
  const { useSession } = await import('@/features/auth/session-provider')
  const { createUnimplementedApi } = await import('@/lib/api/unimplemented')
  const { Button } = await import('@/components/ui/button')
  const { render, waitFor } = await import('@testing-library/react')
  const api = createUnimplementedApi()
  api.auth.selectDemoActor = async () => ({
    ...member,
    actor: { ...member.actor!, id: 'next-actor' },
    cacheScope: 'next-owner',
  })
  let resolve!: (value: number) => void
  state.count
    .mockReset()
    .mockResolvedValueOnce(3)
    .mockImplementationOnce(
      () =>
        new Promise<number>((done) => {
          resolve = done
        }),
    )
  function Switch() {
    const { selectDemoActor } = useSession()
    return (
      <Button onClick={() => void selectDemoActor('next-actor')}>
        Switch account
      </Button>
    )
  }
  render(
    <Providers initialSession={member} api={api}>
      <AppShell>
        <Switch />
      </AppShell>
    </Providers>,
  )
  expect(
    await screen.findByRole('link', { name: 'Notifications, 3 unread' }),
  ).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Switch account' }))
  await waitFor(() =>
    expect(
      screen.queryByRole('link', { name: 'Notifications, 3 unread' }),
    ).not.toBeInTheDocument(),
  )
  expect(
    await screen.findByRole('link', {
      name: 'Notifications, Unread count unavailable',
    }),
  ).toBeInTheDocument()
  resolve(0)
  expect(
    await screen.findByRole('link', { name: 'Notifications, 0 unread' }),
  ).toBeInTheDocument()
})
