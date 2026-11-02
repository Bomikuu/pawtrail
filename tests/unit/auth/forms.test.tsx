import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { Providers } from '@/components/providers'
import { LoginForm } from '@/features/auth/login-form'
import { RegisterForm } from '@/features/auth/register-form'
import { createUnimplementedApi } from '@/lib/api/unimplemented'
import type { Session } from '@/features/auth/types'
const { replace, refresh } = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh }) }))
const session: Session = {
  actor: null,
  roles: [],
  demo: false,
  mode: 'real',
  cacheScope: 'anon',
  expiresAt: null,
}
it('labels inputs and exposes inline validation errors without submitting', async () => {
  render(
    <Providers initialSession={session}>
      <LoginForm returnTo="//evil.test" />
    </Providers>,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    ),
  )
  expect(screen.getByLabelText('Password')).toHaveAttribute(
    'aria-describedby',
    'password-error',
  )
  expect(
    screen.queryByRole('button', { name: /Sample member/ }),
  ).not.toBeInTheDocument()
})
it('validates registration, submits real contract, and uses a safe return path', async () => {
  const api = createUnimplementedApi()
  api.auth.register = vi.fn(async () => ({
    ...session,
    cacheScope: 'signed-in',
    actor: {
      id: 'new',
      username: 'new-helper',
      displayName: 'New Helper',
      roles: ['member'] as ['member'],
      shelterIds: [],
    },
    roles: ['member'] as ['member'],
  }))
  render(
    <Providers initialSession={session} api={api}>
      <RegisterForm returnTo="https://evil.test" />
    </Providers>,
  )
  for (const [label, value] of [
    ['Display name', 'New Helper'],
    ['Username', 'new-helper'],
    ['Email', 'new@example.invalid'],
    ['Password', 'test-value'],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }))
  await waitFor(() => expect(api.auth.register).toHaveBeenCalled())
  expect(replace).toHaveBeenCalledWith('/community')
})
it('shows server field errors and connection recovery without navigating', async () => {
  const { ApiError } = await import('@/lib/api/errors')
  const api = createUnimplementedApi()
  api.auth.login = vi.fn(async () => {
    throw new ApiError(
      'VALIDATION_ERROR',
      'Check your email and try again',
      400,
      { email: ['This email cannot sign in'] },
    )
  })
  render(
    <Providers initialSession={session} api={api}>
      <LoginForm returnTo="/dashboard" />
    </Providers>,
  )
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.invalid' },
  })
  fireEvent.change(screen.getByLabelText('Password'), {
    target: { value: 'test-value' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Check your email and try again',
  )
  expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  expect(replace).not.toHaveBeenCalled()
})
