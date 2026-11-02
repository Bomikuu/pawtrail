import { expect, it, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { PostComposer } from '@/features/community/post-composer'
import { renderSession } from '../layout/helpers'
const state = vi.hoisted(() => ({ create: vi.fn() }))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({ community: { create: state.create } }),
}))
it('preserves text after failure, disables duplicates and reuses the retry key', async () => {
  state.create.mockRejectedValueOnce(new Error('Connection lost'))
  renderSession(<PostComposer options={[]} />)
  fireEvent.change(screen.getByLabelText('Your update'), {
    target: { value: 'Milo is resting today' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Your update')).toHaveValue(
    'Milo is resting today',
  )
  const firstKey = state.create.mock.calls[0][1].idempotencyKey
  state.create.mockImplementationOnce(() => new Promise(() => {}))
  fireEvent.click(screen.getByRole('button', { name: 'Submit for review' }))
  await waitFor(() => expect(state.create).toHaveBeenCalledTimes(2))
  expect(state.create.mock.calls[1][1].idempotencyKey).toBe(firstKey)
  expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled()
})
it('requires selected photos to finish uploading and keeps them when details collapse', async () => {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        return 'blob:test-photo'
      }
      static revokeObjectURL() {}
    },
  )
  renderSession(<PostComposer options={[]} />)
  fireEvent.change(screen.getByLabelText('Your update'), {
    target: { value: 'Photo story' },
  })
  fireEvent.click(
    screen.getByRole('button', { name: 'Photos & story details' }),
  )
  fireEvent.change(
    screen.getByLabelText('Attachments', { selector: 'input' }),
    {
      target: {
        files: [new File(['image'], 'cat.png', { type: 'image/png' })],
      },
    },
  )
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Submit for review' }),
    ).toBeDisabled(),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Photos & story details' }),
  )
  fireEvent.click(
    screen.getByRole('button', { name: 'Photos & story details' }),
  )
  expect(screen.getByLabelText('Description for cat.png')).toBeVisible()
})
