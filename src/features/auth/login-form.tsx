'use client'

import { useState } from 'react'
import {
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  PawPrint,
} from 'lucide-react'
import { LoadingButton } from '@/components/shared/loading-button'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { AuthBrand } from './auth-brand'
import { GoogleLoginButton } from './google-login-button'
import { useAuthForm } from './use-auth-form'

export function LoginForm({ returnTo }: { returnTo: string | null }) {
  const { session, form, message, destination, perform } = useAuthForm(
    'login',
    returnTo,
  )
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [recoveryOpen, setRecoveryOpen] = useState(false)
  const [personasOpen, setPersonasOpen] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const busy = isSubmitting || session.pending || googlePending

  return (
    <section className="mx-auto w-full max-w-md" aria-labelledby="auth-title">
      <Card className="gap-0 rounded-[1.75rem] border-[#ede3d9] bg-card py-8 shadow-[0_12px_45px_-20px_rgba(115,65,27,0.18)] dark:border-border dark:shadow-none">
        <CardHeader className="gap-0 px-6 sm:px-9">
          <AuthBrand className="mx-auto text-[1.625rem] [&>svg]:size-8" />
          <h1
            id="auth-title"
            className="mt-6 font-heading text-[2rem] font-semibold leading-tight tracking-[-0.02em]"
          >
            Welcome back!
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Log in to continue helping animals in your community.
          </p>
        </CardHeader>
        <CardContent className="mt-6 px-6 sm:px-9">
          <form
            noValidate
            onSubmit={handleSubmit((values) =>
              perform(() => session.login(values)),
            )}
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.7}
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    disabled={busy}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="h-12 rounded-xl bg-transparent pr-3 pl-11 text-base shadow-none md:text-sm"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.7}
                  />
                  <Input
                    id="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    disabled={busy}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? 'password-error' : undefined
                    }
                    className="h-12 rounded-xl bg-transparent pr-12 pl-11 text-base shadow-none md:text-sm"
                    {...register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-0.5 right-0.5 size-11 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label={
                      passwordVisible ? 'Hide password' : 'Show password'
                    }
                    aria-pressed={passwordVisible}
                    disabled={busy}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? (
                      <EyeOff aria-hidden="true" className="size-[1.125rem]" />
                    ) : (
                      <Eye aria-hidden="true" className="size-[1.125rem]" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-1 flex justify-end">
              <Button
                type="button"
                variant="link"
                className="min-h-10 px-0 text-xs font-medium text-[#b94c12] dark:text-primary"
                aria-expanded={recoveryOpen}
                aria-controls="password-recovery"
                onClick={() => setRecoveryOpen((open) => !open)}
              >
                Forgot password?
              </Button>
            </div>
            {recoveryOpen && (
              <p
                id="password-recovery"
                role="status"
                className="mb-4 text-sm leading-relaxed text-muted-foreground"
              >
                {session.session.demo
                  ? 'Passwords aren’t checked in this demo. Use a made-up password or choose a sample profile below.'
                  : 'Password reset isn’t available yet. If you joined with Google, use Continue with Google below.'}
              </p>
            )}
            {message && (
              <p
                role="alert"
                className="mb-4 text-sm leading-relaxed text-destructive"
              >
                {message}
              </p>
            )}
            <LoadingButton
              type="submit"
              loading={isSubmitting || session.pending}
              disabled={busy}
              className="h-12 w-full rounded-xl text-sm font-semibold shadow-none"
            >
              <PawPrint aria-hidden="true" className="size-5" />
              {session.session.demo ? 'Log in to demo' : 'Log in'}
            </LoadingButton>
          </form>
          <div className="my-4 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleLoginButton
            demo={session.session.demo}
            disabled={busy}
            onPendingChange={setGooglePending}
            onSignIn={(input) => perform(() => session.loginWithGoogle(input))}
          />
          <div className="mt-5 text-center">
            <p className="text-xs text-muted-foreground">New to PawTrail?</p>
            <ButtonLink
              href={`/register?returnTo=${encodeURIComponent(destination)}`}
              variant="outline"
              className="mt-3 h-11 w-full rounded-xl border-input bg-transparent text-sm font-medium text-foreground shadow-none"
            >
              Create an account
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
      {session.session.demo && (
        <div className="mt-5 px-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p className="text-xs leading-relaxed">
              You’re exploring a demo. Use a made-up email and password.
              Passwords aren’t saved or checked; no real account is created.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="mt-2 h-10 gap-2 px-0 text-xs font-medium hover:bg-transparent hover:text-foreground"
            aria-expanded={personasOpen}
            aria-controls="demo-personas"
            disabled={busy}
            onClick={() => setPersonasOpen((open) => !open)}
          >
            Try a sample profile
            <ChevronDown
              aria-hidden="true"
              className={`size-3.5 ${personasOpen ? 'rotate-180' : ''}`}
            />
          </Button>
          {personasOpen && (
            <div
              id="demo-personas"
              className="mt-2 grid gap-2"
              aria-label="Sample personas"
            >
              {(
                [
                  ['user-6', 'Sample member'],
                  ['user-1', 'Sample shelter staff'],
                  ['user-20', 'Sample moderator'],
                ] as const
              ).map(([id, label]) => (
                <LoadingButton
                  key={id}
                  type="button"
                  variant="outline"
                  className="h-10 rounded-lg bg-card text-xs"
                  disabled={busy}
                  onClick={() => perform(() => session.selectDemoActor(id))}
                >
                  {label}
                </LoadingButton>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
