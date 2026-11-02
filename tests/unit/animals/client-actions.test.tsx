import { beforeEach, expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { ProfileActions } from '@/features/animals/profile-actions'
import { renderSession, guest } from '../layout/helpers'
const state = vi.hoisted(() => ({
  save: vi.fn(),
  get: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: state.refresh }),
}))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({ animals: { setSaved: state.save, get: state.get } }),
}))
beforeEach(() => {
  state.save.mockReset()
  state.refresh.mockReset()
  state.get.mockResolvedValue({ viewerSaved: true })
})
const actions = (
  <ProfileActions
    id="animal-1"
    slug="milo"
    name="Milo"
    initialSaved={false}
    viewerScope="layout-test"
    url="https://pawtrail.example/pets/milo"
    adoptable
  />
)
it('rolls back optimistic saved state and exposes retry after rejection', async () => {
  state.save.mockRejectedValueOnce(new Error('offline'))
  renderSession(actions)
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect(screen.getByRole('button', { name: 'Saving…' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  await screen.findByRole('alert')
  expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(state.refresh).not.toHaveBeenCalled()
  state.save.mockResolvedValueOnce(undefined)
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(state.refresh).toHaveBeenCalledOnce())
  expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
it('gates saving behind validated login return path for guests', () => {
  renderSession(actions, guest)
  expect(screen.getByRole('link', { name: 'Sign in to save' })).toHaveAttribute(
    'href',
    '/login?returnTo=%2Fpets%2Fmilo',
  )
  expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
})
it('never reuses another session’s server saved flag', async () => {
  let resolve!: (value: { viewerSaved: boolean }) => void
  state.get.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done
    }),
  )
  renderSession(
    <ProfileActions
      id="animal-1"
      slug="milo"
      name="Milo"
      initialSaved={true}
      viewerScope="previous-session"
      url="https://pawtrail.example/pets/milo"
      adoptable
    />,
  )
  expect(
    screen.queryByRole('button', { name: 'Saved' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Loading saved state…' }),
  ).toBeDisabled()
  resolve({ viewerSaved: false })
  await screen.findByRole('button', { name: 'Save' })
  expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
