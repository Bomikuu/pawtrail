'use client'
import { createContext, useContext, useState, type FormEvent, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Camera, History, LoaderCircle, ShieldCheck, LogOut, PawPrint, ArrowRight, RefreshCw } from 'lucide-react'
import { z } from 'zod'
import type { Session } from '@/features/auth/types'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { captureRequest } from './api'
import { captureSessionSchema, captureStatusSchema } from './schemas'
import { RealKibbleBalance } from './real-wallet'

type Actor = NonNullable<Session['actor']>
const CaptureContext = createContext<{ actor: Actor; status: z.infer<typeof captureStatusSchema> } | null>(null)
export function useCaptureIdentity() {
  const value = useContext(CaptureContext)
  if (!value) throw new Error('Capture workspace is required')
  return value
}
export function CaptureWorkspace({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const session = useQuery({ queryKey: ['capture', 'session'], queryFn: ({ signal }) => captureRequest('auth/session', captureSessionSchema, { signal }), retry: false })
  const status = useQuery({ queryKey: ['capture', 'status'], queryFn: ({ signal }) => captureRequest('status', captureStatusSchema, { signal }), retry: false })
  const [logoutError, setLogoutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  async function logout() {
    setSigningOut(true)
    setLogoutError('')
    try {
      await captureRequest('auth/logout', z.undefined(), { method: 'POST' })
      client.removeQueries({ queryKey: ['capture'] })
      await session.refetch()
    } catch (error) { setLogoutError(error instanceof Error ? error.message : 'Sign-out failed. Try again.') }
    finally { setSigningOut(false) }
  }
  return <div className="mx-auto w-full max-w-[1120px] space-y-7 px-3 py-5 sm:px-6 sm:py-8">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="flex flex-wrap items-center gap-2">
        <ButtonLink href="/spot" variant="ghost"><Camera className="size-4" />Spot an animal</ButtonLink>
        <ButtonLink href="/spot/history" variant="ghost"><History className="size-4" />My encounters</ButtonLink>
        {session.data?.roles.includes('moderator') && <ButtonLink href="/spot/review" variant="ghost"><ShieldCheck className="size-4" />Identity review</ButtonLink>}
        {session.data?.roles.includes('moderator') && <ButtonLink href="/spot/setup" variant="ghost"><PawPrint className="size-4" />Identification setup</ButtonLink>}
        {session.data?.actor && <RealKibbleBalance key={session.data.actor.id} actorId={session.data.actor.id} />}
      </div>
      {session.data?.actor && <div className="flex items-center gap-2 text-sm"><span className="max-w-40 truncate">{session.data.actor.displayName}</span><Button variant="ghost" size="icon" aria-label="Sign out of real sightings" disabled={signingOut} onClick={() => void logout()}>{signingOut ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <LogOut className="size-4" />}</Button></div>}
    </div>
    {logoutError && <p role="alert" className="text-sm text-destructive">{logoutError}</p>}
    {session.isPending || status.isPending ? <div aria-label="Loading your capture workspace" aria-busy="true" className="space-y-5"><Skeleton className="h-10 w-64" /><Skeleton className="aspect-[4/3] max-h-[450px] w-full rounded-2xl" /></div>
      : session.error || status.error ? <Card><CardContent className="space-y-4"><PawPrint className="size-9 text-primary" /><h1 className="text-2xl font-bold">Real sightings are temporarily unavailable</h1><p className="max-w-prose text-muted-foreground">{(session.error ?? status.error)?.message}</p><Button onClick={() => { void session.refetch(); void status.refetch() }}><RefreshCw className="size-4" />Reconnect</Button></CardContent></Card>
      : !session.data?.actor ? <CaptureAuth onSignedIn={(value) => client.setQueryData(['capture', 'session'], value)} />
      : status.data ? <CaptureContext.Provider value={{ actor: session.data.actor, status: status.data }}><div key={session.data.actor.id}>{children}</div></CaptureContext.Provider> : null}
    <p className="max-w-prose text-xs leading-relaxed text-muted-foreground"><ShieldCheck className="me-1 inline size-3.5" />Real animal encounters use a real account and private evidence. The sample community account and game progress are separate. Exact capture coordinates stay private.</p>
  </div>
}

function CaptureAuth({ onSignedIn }: { onSignedIn(value: Session): void }) {
  const [register, setRegister] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setPending(true)
    setError('')
    try {
      const value = await captureRequest('auth/' + (register ? 'register' : 'login'), captureSessionSchema, {
        method: 'POST', body: Object.fromEntries(form.entries()),
      })
      onSignedIn(value)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Sign-in failed. Try again.') }
    finally { setPending(false) }
  }
  return <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
    <div className="space-y-5 py-3"><Camera className="size-10 text-primary" /><h1 className="max-w-[16ch] text-3xl font-bold leading-tight sm:text-4xl">A familiar face. A new chapter.</h1><p className="max-w-prose text-lg leading-relaxed text-muted-foreground">Photograph a cat or dog. Find out who they might be, add a helpful sighting, or start their story.</p><ol className="space-y-4 text-sm"><li className="flex gap-3"><Camera className="mt-0.5 size-5 shrink-0 text-primary" />Take a clear photo, with an optional private location.</li><li className="flex gap-3"><PawPrint className="mt-0.5 size-5 shrink-0 text-primary" />Compare existing animals by appearance and recent reported areas.</li><li className="flex gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />Keep uncertain identities open for independent review.</li></ol></div>
    <Card><CardContent><h2 className="mb-2 text-xl font-bold">{register ? 'Create your real sightings account' : 'Sign in to real sightings'}</h2><p className="mb-5 text-sm text-muted-foreground">Sample logins do not create real animal records.</p><form onSubmit={submit} className="space-y-4">
      {register && <><label className="grid gap-2 text-sm" htmlFor="capture-display-name">Your name<Input id="capture-display-name" name="displayName" required maxLength={100} autoComplete="name" disabled={pending} /></label><label className="grid gap-2 text-sm" htmlFor="capture-username">Username<Input id="capture-username" name="username" required minLength={3} maxLength={40} pattern="[a-zA-Z0-9_-]+" autoComplete="username" disabled={pending} /></label></>}
      <label className="grid gap-2 text-sm" htmlFor="capture-email">Email<Input id="capture-email" name="email" type="email" required autoComplete="email" disabled={pending} /></label>
      <label className="grid gap-2 text-sm" htmlFor="capture-password">Password<Input id="capture-password" name="password" type="password" required minLength={register ? 8 : 1} autoComplete={register ? 'new-password' : 'current-password'} disabled={pending} /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <ArrowRight className="size-4" />}{pending ? 'Connecting…' : register ? 'Create account' : 'Sign in'}</Button>
      <Button type="button" variant="ghost" disabled={pending} className="w-full" onClick={() => { setRegister(!register); setError('') }}>{register ? 'Already registered? Sign in' : 'New here? Create an account'}</Button>
    </form></CardContent></Card>
  </div>
}
