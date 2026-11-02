import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderSession } from '../layout/helpers'
import { NotificationList } from '@/features/notifications/notification-list'
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  markRead: vi.fn(),
  unreadCount: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({ notifications: mocks }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))
const notification = {
  id: 'n1',
  recipientId: 'sample-member',
  kind: 'comment',
  message: 'A reviewed comment was added to your story.',
  ref: { kind: 'post', id: 'post-1' },
  destinationHref: '/community/post-1',
  createdAt: '2026-11-02T00:00:00+08:00',
  readAt: null,
  provenance: { kind: 'demo', label: 'Sample activity' },
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({
    items: [notification],
    count: 1,
    nextCursor: null,
  })
  mocks.markRead.mockResolvedValue(undefined)
  mocks.unreadCount.mockResolvedValue(1)
})
describe('activity interface', () => {
  it('shows unread state, safe deep link and reconciles mark read', async () => {
    renderSession(<NotificationList />)
    expect(
      await screen.findByRole('link', { name: 'Open activity' }),
    ).toHaveAttribute('href', '/community/post-1')
    expect(screen.getByText('Unread')).toBeInTheDocument()
    mocks.list.mockResolvedValue({
      items: [{ ...notification, readAt: notification.createdAt }],
      count: 1,
      nextCursor: null,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }))
    await waitFor(() => expect(mocks.markRead).toHaveBeenCalledWith(['n1']))
    expect(await screen.findByText('Read')).toBeInTheDocument()
  })
  it('keeps failed read retryable and explains unavailable destinations', async () => {
    mocks.list.mockResolvedValue({
      items: [{ ...notification, ref: null, destinationHref: null }],
      count: 1,
      nextCursor: null,
    })
    mocks.markRead.mockRejectedValueOnce(new Error('offline'))
    renderSession(<NotificationList />)
    expect(
      await screen.findByText('Activity destination unavailable.'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark as read' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t mark activity as read',
    )
    expect(screen.getByRole('button', { name: 'Mark as read' })).toBeEnabled()
    expect(
      screen.queryByRole('link', { name: 'Open activity' }),
    ).not.toBeInTheDocument()
  })
})
it('opening an unread destination also marks that owned activity read', async () => {
  renderSession(<NotificationList />)
  const link = await screen.findByRole('link', { name: 'Open activity' })
  link.addEventListener('click', (event) => event.preventDefault())
  fireEvent.click(link)
  await waitFor(() => expect(mocks.markRead).toHaveBeenCalledWith(['n1']))
})
