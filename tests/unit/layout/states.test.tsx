import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it, vi } from 'vitest'
import { DataState } from '@/components/shared/data-state'
import { Money, formatPHP } from '@/components/shared/money'
import { StatusBadge } from '@/components/shared/status-badge'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
it('renders loading, actionable empty and retryable error states without stale content', async () => {
  const user = userEvent.setup()
  const retry = vi.fn()
  const { rerender } = render(
    <DataState state="loading">Old records</DataState>,
  )
  expect(screen.getByRole('status')).toHaveAccessibleName('Loading items…')
  expect(screen.queryByText('Old records')).not.toBeInTheDocument()
  rerender(
    <DataState
      state="empty"
      emptyAction={<ButtonLink href="/explore">Explore animals</ButtonLink>}
    >
      Old records
    </DataState>,
  )
  expect(screen.getByRole('link', { name: 'Explore animals' })).toHaveAttribute(
    'href',
    '/explore',
  )
  rerender(
    <DataState state="error" retry={retry}>
      Old records
    </DataState>,
  )
  expect(screen.getByRole('alert')).toHaveTextContent(/couldn.t load/i)
  await user.click(screen.getByRole('button', { name: 'Try again' }))
  expect(retry).toHaveBeenCalledOnce()
  rerender(<DataState state="ready">Current records</DataState>)
  expect(screen.getByText('Current records')).toBeVisible()
})
it('uses integer-centavo PHP formatting and labels status in text', () => {
  render(
    <>
      <Money amount={123456} />
      <StatusBadge tone="success">Sample verified</StatusBadge>
    </>,
  )
  expect(screen.getByText(formatPHP(123456))).toBeVisible()
  expect(formatPHP(123456)).toMatch(/1,234\.56/)
  expect(() => formatPHP(1.2)).toThrow()
  expect(screen.getByText('Sample verified')).toBeVisible()
})
it('uses native anchors for document actions', () => {
  render(
    <ButtonAnchor href="https://example.invalid/help">Read help</ButtonAnchor>,
  )
  expect(screen.getByRole('link', { name: 'Read help' })).toHaveAttribute(
    'href',
    'https://example.invalid/help',
  )
})
it('protects confirmation, supports cancel focus restoration, and exposes failed attempts for recovery', async () => {
  const user = userEvent.setup()
  const onConfirm = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(undefined)
  render(
    <ConfirmDialog
      title="Remove saved animal?"
      description="You can save this animal again later."
      confirmLabel="Remove saved animal"
      onConfirm={onConfirm}
      trigger={<Button>Remove</Button>}
    />,
  )
  const trigger = screen.getByRole('button', { name: 'Remove' })
  await user.click(trigger)
  expect(screen.getByRole('alertdialog')).toHaveAccessibleName(
    'Remove saved animal?',
  )
  await user.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(onConfirm).not.toHaveBeenCalled()
  await user.click(trigger)
  await user.click(screen.getByRole('button', { name: 'Remove saved animal' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i)
  await user.click(screen.getByRole('button', { name: 'Remove saved animal' }))
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  )
  expect(onConfirm).toHaveBeenCalledTimes(2)
})
it('mounts an accessible Sonner announcement region', async () => {
  render(<Toaster />)
  toast('Saved to your sample collection')
  expect(
    await screen.findByText('Saved to your sample collection'),
  ).toBeVisible()
  expect(
    screen.getByRole('region', { name: /notifications/i }),
  ).toHaveAttribute('aria-live', 'polite')
  toast.dismiss()
})
it('prevents duplicate confirmations and escape dismissal while an action is pending', async () => {
  const user = userEvent.setup()
  let resolve!: () => void
  const onConfirm = vi.fn(
    () =>
      new Promise<void>((done) => {
        resolve = done
      }),
  )
  render(
    <ConfirmDialog
      title="Remove saved animal?"
      description="You can save it again later."
      confirmLabel="Confirm removal"
      onConfirm={onConfirm}
      trigger={<Button>Remove</Button>}
    />,
  )
  await user.click(screen.getByRole('button', { name: 'Remove' }))
  await user.click(screen.getByRole('button', { name: 'Confirm removal' }))
  expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  await user.keyboard('{Escape}')
  expect(screen.getByRole('alertdialog')).toBeVisible()
  expect(onConfirm).toHaveBeenCalledOnce()
  resolve()
  await waitFor(() =>
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument(),
  )
})
