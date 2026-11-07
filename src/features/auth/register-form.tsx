'use client'

import { useState } from 'react'
import {
  AtSign,
  Building2,
  Eye,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  PawPrint,
  ShieldCheck,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { NavigationLink } from '@/components/layout/navigation-link'
import { LoadingButton } from '@/components/shared/loading-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AuthBrand } from './auth-brand'
import { RegistrationAvatarPicker } from './registration-avatar-picker'
import { useAuthForm } from './use-auth-form'
import type { RegisterInput } from './types'

const fields = [
  {
    name: 'displayName',
    label: 'Display name',
    placeholder: 'e.g. Miku',
    icon: UserRound,
    autoComplete: 'name',
  },
  {
    name: 'username',
    label: 'Username',
    placeholder: 'e.g. mikudev',
    icon: AtSign,
    autoComplete: 'username',
  },
  {
    name: 'email',
    label: 'Email address',
    placeholder: 'you@example.com',
    icon: Mail,
    autoComplete: 'email',
  },
  {
    name: 'password',
    label: 'Password',
    placeholder: 'Create a password',
    icon: LockKeyhole,
    autoComplete: 'new-password',
  },
] as const

export function RegisterForm({ returnTo }: { returnTo: string | null }) {
  const { session, form, message, destination, perform } = useAuthForm('register', returnTo)
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [guidelinesOpen, setGuidelinesOpen] = useState(false)
  const avatarId = watch('avatarId')
  const busy = isSubmitting || session.pending

  return (
    <section className="w-full min-w-0" aria-labelledby="registration-title">
      <div className="mb-6 flex justify-center">
        <AuthBrand className="text-[1.625rem] [&>svg]:size-8" />
      </div>
      <Card className="gap-0 rounded-[1.75rem] border-[#ede3d9] bg-card py-7 shadow-[0_12px_45px_-20px_rgba(115,65,27,0.18)] sm:py-9 dark:border-border dark:shadow-none">
        <CardHeader className="gap-2 px-5 sm:px-9">
          <h1 id="registration-title" className="font-heading text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] sm:text-[2rem]">
            Create your PawTrail account
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Start helping animals and be part of the community.
          </p>
        </CardHeader>
        <CardContent className="mt-7 px-5 sm:px-9">
          <form
            noValidate
            onSubmit={handleSubmit((values) =>
              perform(() => session.register(values as RegisterInput)),
            )}
          >
            <RegistrationAvatarPicker
              value={avatarId}
              disabled={busy}
              onChange={(id) => setValue('avatarId', id, {
                shouldDirty: true,
                shouldValidate: true,
              })}
            />
            <Input type="hidden" {...register('avatarId')} />
            {errors.avatarId && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {errors.avatarId.message}
              </p>
            )}
            <div className="mt-7 grid gap-x-5 gap-y-5 sm:grid-cols-2">
              {fields.map(({ name, label, placeholder, icon: Icon, autoComplete }) => (
                <div key={name} className="grid min-w-0 content-start gap-2">
                  <label htmlFor={name} className="text-sm font-medium">
                    {label}{' '}
                    <span aria-hidden="true" className="text-[#b94c12] dark:text-primary">*</span>
                  </label>
                  <div className="relative">
                    <Icon
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 left-3.5 size-[1.125rem] -translate-y-1/2 text-muted-foreground"
                      strokeWidth={1.7}
                    />
                    <Input
                      id={name}
                      type={
                        name === 'password'
                          ? passwordVisible ? 'text' : 'password'
                          : name === 'email' ? 'email' : 'text'
                      }
                      autoComplete={autoComplete}
                      placeholder={placeholder}
                      required
                      disabled={busy}
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${name}-error` : name === 'username' ? 'username-help' : undefined}
                      className={`h-12 rounded-xl bg-transparent pl-11 text-base shadow-none md:text-sm ${name === 'password' ? 'pr-12' : 'pr-3'}`}
                      {...register(name)}
                    />
                    {name === 'password' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={busy}
                        className="absolute top-0.5 right-0.5 size-11 rounded-lg text-muted-foreground hover:text-foreground"
                        aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                        aria-pressed={passwordVisible}
                        onClick={() => setPasswordVisible((visible) => !visible)}
                      >
                        {passwordVisible
                          ? <EyeOff aria-hidden="true" className="size-[1.125rem]" />
                          : <Eye aria-hidden="true" className="size-[1.125rem]" />}
                      </Button>
                    )}
                  </div>
                  {errors[name] && (
                    <p id={`${name}-error`} className="text-sm text-destructive">
                      {errors[name]?.message}
                    </p>
                  )}
                  {name === 'username' && !errors.username && (
                    <p id="username-help" className="text-xs text-muted-foreground">
                      3–40 letters, numbers, underscores, or hyphens.
                    </p>
                  )}
                </div>
              ))}
            </div>
            <fieldset className="mt-6 min-w-0 border-0 p-0">
              <legend className="mb-2 text-sm font-medium">Account type</legend>
              <RadioGroup value="member" aria-label="Account type" className="grid gap-3 sm:grid-cols-2" disabled={busy}>
                <label htmlFor="account-member" className="flex cursor-pointer items-center gap-3 rounded-xl border border-primary bg-primary/5 p-3.5">
                  <UsersRound aria-hidden="true" className="size-6 shrink-0 text-[#bf5215] dark:text-primary" strokeWidth={1.7} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Community member</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      Report, support, and join activities.
                    </span>
                  </span>
                  <RadioGroupItem id="account-member" value="member" aria-label="Community member" className="size-5 border-primary" />
                </label>
                <label htmlFor="account-shelter" className="flex cursor-not-allowed items-center gap-3 rounded-xl border border-border bg-muted/25 p-3.5">
                  <Building2 aria-hidden="true" className="size-6 shrink-0 text-muted-foreground" strokeWidth={1.7} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-muted-foreground">Shelter / organization</span>
                    <span id="shelter-account-help" className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                      Access is assigned by your organization.
                    </span>
                  </span>
                  <RadioGroupItem id="account-shelter" value="shelter" disabled aria-label="Shelter or organization" aria-describedby="shelter-account-help" className="size-5" />
                </label>
              </RadioGroup>
            </fieldset>
            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff4e8] p-4 dark:bg-primary/5">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[#bc5519] dark:text-primary" strokeWidth={1.7} />
              <div className="min-w-0">
                <h2 className="font-heading text-base font-semibold">Community guidelines</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Help keep PawTrail safe, respectful, and animal-friendly.
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto min-h-8 px-0 py-1 text-xs font-medium text-[color:var(--teal)]"
                  aria-expanded={guidelinesOpen}
                  aria-controls="registration-guidelines"
                  onClick={() => setGuidelinesOpen((open) => !open)}
                >
                  {guidelinesOpen ? 'Hide community guidelines' : 'Read community guidelines'}
                </Button>
                {guidelinesOpen && (
                  <ul id="registration-guidelines" className="mt-2 grid list-disc gap-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                    <li>Be kind to people and animals.</li>
                    <li>Share accurate sightings and helpful, respectful updates.</li>
                    <li>Protect private locations and personal information.</li>
                    <li>Use the report action to flag concerning content.</li>
                  </ul>
                )}
              </div>
            </div>
            {message && (
              <p role="alert" className="mt-5 text-sm leading-relaxed text-destructive">{message}</p>
            )}
            <LoadingButton type="submit" loading={busy} disabled={busy} className="mt-6 h-12 w-full rounded-xl text-sm font-semibold shadow-none">
              <PawPrint aria-hidden="true" className="size-5" />
              {session.session.demo ? 'Create demo profile' : 'Create account'}
            </LoadingButton>
            <p className="mt-5 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <NavigationLink href={`/login?returnTo=${encodeURIComponent(destination)}`} className="font-medium text-[color:var(--teal)] hover:underline">
                Sign in
              </NavigationLink>
            </p>
          </form>
        </CardContent>
      </Card>
      {session.session.demo && (
        <div className="mx-auto mt-5 flex max-w-xl items-start justify-center gap-2 px-2 text-xs leading-relaxed text-muted-foreground">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>This is a demo. Use a made-up email and password. Passwords aren’t saved or checked, and no real account is created.</p>
        </div>
      )}
    </section>
  )
}
