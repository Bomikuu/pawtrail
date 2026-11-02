import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderSession, member, guest } from '../layout/helpers'
import { FollowButton } from '@/features/users/follow-button'
import { PublicProfile } from '@/features/users/public-profile'
import { createMockApi } from '@/lib/api/adapters/mock'
vi.mock('server-only', () => ({}))
const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  set: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
  usePathname: () => '/community',
}))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({ follows: { list: mocks.list, set: mocks.set } }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.list.mockResolvedValue({ items: [], count: 0, nextCursor: null })
  mocks.set.mockResolvedValue(undefined)
})
describe('profile and follow interfaces', () => {
  it('guest follow preserves sign in return and self follow is absent', () => {
    const first = renderSession(
      <FollowButton
        target={{ kind: 'animal', id: 'animal-1' }}
        name="Milo"
        returnTo="/pets/milo"
      />,
      guest,
    )
    expect(
      screen.getByRole('link', { name: 'Sign in to follow Milo' }),
    ).toHaveAttribute('href', '/login?returnTo=%2Fpets%2Fmilo')
    first.unmount()
    renderSession(
      <FollowButton
        target={{ kind: 'user', id: member.actor!.id }}
        name="You"
        returnTo="/users/you"
      />,
    )
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
  it('updates follow state, refreshes public SSR and preserves retry after error', async () => {
    mocks.set.mockRejectedValueOnce(new Error('offline'))
    renderSession(
      <FollowButton
        target={{ kind: 'animal', id: 'animal-1' }}
        name="Milo"
        returnTo="/pets/milo"
      />,
    )
    const action = await screen.findByRole('button', { name: 'Follow Milo' })
    await waitFor(() => expect(action).toBeEnabled())
    fireEvent.click(action)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Couldn’t update following',
    )
    mocks.list.mockResolvedValue({
      items: [{ target: { kind: 'animal', id: 'animal-1' } }],
      nextCursor: null,
      count: 1,
    })
    fireEvent.click(action)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Unfollow Milo' }),
      ).toHaveAttribute('aria-pressed', 'true'),
    )
    expect(mocks.refresh).toHaveBeenCalled()
  })
  it('renders public identity, derived summaries and honest level/badge empty state', async () => {
    const profile = await createMockApi().users.get('sample-helper-2')
    renderSession(<PublicProfile profile={profile} />, guest)
    expect(
      screen.getByRole('heading', { level: 1, name: profile.displayName }),
    ).toBeInTheDocument()
    expect(screen.getByText('Level is not available yet.')).toBeInTheDocument()
    expect(
      screen.getByText('No earned badges recorded yet.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Animals helped' }),
    ).toBeInTheDocument()
  })
})
