'use client'
import { useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/errors'
import { loginInputSchema, registerInputSchema } from './schemas'
import type { RegisterInput } from './types'
import { useSession } from './session-provider'
import { validateReturnPath } from './return-path'
export function AuthForm({
  kind,
  returnTo,
}: {
  kind: 'login' | 'register'
  returnTo: string | null
}) {
  const session = useSession()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const registration = kind === 'register'
  // Optional registration fields keep the same form model while each endpoint validates its own contract.
  const schema = registration
    ? registerInputSchema
    : loginInputSchema.extend({
        username: registerInputSchema.shape.username.optional(),
        displayName: registerInputSchema.shape.displayName.optional(),
      })
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<{
    email: string
    password: string
    username?: string
    displayName?: string
  }>({ resolver: zodResolver(schema) })
  const destination = validateReturnPath(returnTo)
  function navigate() {
    router.replace(destination)
    router.refresh()
  }
  async function perform(operation: () => Promise<unknown>) {
    setMessage('')
    try {
      await operation()
      navigate()
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.fieldErrors ?? {}))
          if (['email', 'password', 'username', 'displayName'].includes(field))
            setError(
              field as keyof RegisterInput,
              { message: messages[0] },
              { shouldFocus: true },
            )
        setMessage(error.message)
      } else
        setMessage('Unable to connect. Try again when your connection returns.')
    }
  }
  const fields = registration
    ? (['displayName', 'username', 'email', 'password'] as const)
    : (['email', 'password'] as const)
  const labels = {
    displayName: 'Display name',
    username: 'Username',
    email: 'Email',
    password: 'Password',
  }
  return (
    <section
      className={
        'auth-surface max-w-120 [margin:0_auto] [&_h1]:text-[2rem] [&_h1]:[margin:0_0_1rem] [&_h2]:text-xl [&_h2]:[margin:0_0_0.75rem] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none]'
      }
      aria-labelledby="auth-title"
    >
      <h1 id="auth-title">
        {registration
          ? 'Join the PawTrail community'
          : 'Welcome back to PawTrail'}
      </h1>
      <p>
        {registration
          ? 'Make room for more animal stories in your day.'
          : 'Return to the animals and people you care about.'}
      </p>
      {session.session.demo && (
        <p
          className={'demo-notice [border-block:1px_solid_var(--border)] py-4'}
        >
          Demo authentication. Sample personas and new demo profiles stay in
          this browser’s isolated session. Use a made-up email and password.
          Passwords are not saved or checked; no real account is created.
        </p>
      )}
      <form
        noValidate
        onSubmit={handleSubmit((values) =>
          perform(() =>
            registration
              ? session.register(values as RegisterInput)
              : session.login(values),
          ),
        )}
        className={'auth-form grid gap-5 mt-8'}
      >
        {fields.map((field) => (
          <div
            className={'auth-field grid gap-2 [&_label]:font-semibold'}
            key={field}
          >
            <label htmlFor={field}>{labels[field]}</label>
            <Input
              id={field}
              type={
                field === 'password'
                  ? 'password'
                  : field === 'email'
                    ? 'email'
                    : 'text'
              }
              autoComplete={
                field === 'password'
                  ? registration
                    ? 'new-password'
                    : 'current-password'
                  : field === 'displayName'
                    ? 'name'
                    : field
              }
              aria-invalid={!!errors[field]}
              aria-describedby={errors[field] ? `${field}-error` : undefined}
              {...register(field)}
            />
            {errors[field] && (
              <p
                className={'field-error m-0 text-foreground font-semibold'}
                id={`${field}-error`}
              >
                {errors[field]?.message}
              </p>
            )}
          </div>
        ))}
        {message && (
          <p
            role="alert"
            className={'field-error m-0 text-foreground font-semibold'}
          >
            {message}
          </p>
        )}
        <Button
          type="submit"
          loading={isSubmitting || session.pending}
          disabled={isSubmitting || session.pending}
        >
          {isSubmitting
            ? 'Please wait…'
            : registration
              ? session.session.demo
                ? 'Create demo profile'
                : 'Create account'
              : session.session.demo
                ? 'Sign in to demo'
                : 'Sign in'}
        </Button>
      </form>
      {!registration && session.session.demo && (
        <div
          className={'demo-personas grid gap-3 mt-10'}
          aria-label="Sample personas"
        >
          <h2>Try a sample perspective</h2>
          {(
            [
              ['user-6', 'Sample member'],
              ['user-1', 'Sample shelter staff'],
              ['user-20', 'Sample moderator'],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              variant="outline"
              disabled={session.pending}
              onClick={() => perform(() => session.selectDemoActor(id))}
            >
              {label}
            </Button>
          ))}
        </div>
      )}
      <p className={'auth-alternative mt-8'}>
        {registration ? 'Already part of the community? ' : 'New to PawTrail? '}
        <Link
          href={`${registration ? '/login' : '/register'}?returnTo=${encodeURIComponent(destination)}`}
        >
          {registration ? 'Sign in' : 'Create an account'}
        </Link>
      </p>
    </section>
  )
}
export function LoginForm({ returnTo }: { returnTo: string | null }) {
  return <AuthForm kind="login" returnTo={returnTo} />
}
