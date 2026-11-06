'use client'

import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import {
  CalendarCheck,
  Check,
  CircleCheck,
  PawPrint,
  Share2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { demoClock, systemClock } from '@/lib/api/clock'
import type { EventDetail } from './types'

export function EventRsvp({
  event,
  scope,
}: {
  event: EventDetail
  scope: string
}) {
  const { session, pending: changing } = useSession()
  const [saved, setSaved] = useState(event)
  const [pending, setPending] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const busy = useRef(false)
  const receipt = useRef<{ attending: boolean; key: string } | null>(null)
  const router = useRouter()
  const queries = useQueryClient()
  const full = saved.attendanceCount >= saved.capacity
  const closed = !saved.rsvpOpen
  const ended =
    Date.parse(saved.endsAt) <=
    (session.demo ? demoClock : systemClock).now().getTime()
  const closedMessage =
    saved.state === 'cancelled'
      ? 'This event has been cancelled.'
      : ended
        ? 'This event has ended.'
        : 'RSVPs are not available right now.'
  const matchingSession = scope === session.cacheScope
  const locked = pending || refreshing || changing || !matchingSession
  const path = `/events/${encodeURIComponent(saved.slug)}`
  useEffect(() => {
    if (!changing && !matchingSession) router.refresh()
  }, [changing, matchingSession, router])
  async function respond(attending: boolean) {
    if (busy.current || locked) return
    busy.current = true
    setPending(true)
    setError('')
    setMessage('')
    const attempt =
      receipt.current?.attending === attending
        ? receipt.current
        : { attending, key: crypto.randomUUID() }
    receipt.current = attempt
    try {
      const result = await getBrowserApi().events.setRsvp(saved.id, attending, {
        idempotencyKey: attempt.key,
      })
      setSaved(result)
      receipt.current = null
      setMessage(
        attending ? 'Your place is reserved.' : 'Your RSVP has been withdrawn.',
      )
      await queries.invalidateQueries()
      startTransition(() => router.refresh())
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Your RSVP could not be saved. Try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  if (!matchingSession || changing)
    return (
      <section
        className={
          'event-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] p-5.5 [border:1px_solid_var(--border)] rounded-2xl bg-card min-w-0 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:[margin:0_0_1rem] [&_h2]:font-[900] [&_h2]:text-[length:1.375rem] [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:w-6.5 [&_h2_>_svg]:h-6.5 [&_h2_>_svg]:shrink-0 [&_p]:[margin:0.75rem_0] [&_p]:text-sm max-[85rem]:p-4.5 max-[40rem]:[&_h2]:text-xl event-rsvp bg-[#fff1e5] border-[#f4deca] relative overflow-hidden [&_>_:not(.event-rsvp-paw)]:relative max-[64rem]:[grid-column:1_/_-1]'
        }
      >
        <h2>
          <CalendarCheck aria-hidden="true" /> Your RSVP
        </h2>
        <p role="status">Updating your event RSVP…</p>
      </section>
    )
  return (
    <section
      className={
        'event-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] p-5.5 [border:1px_solid_var(--border)] rounded-2xl bg-card min-w-0 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2.5 [&_h2]:[margin:0_0_1rem] [&_h2]:font-[900] [&_h2]:text-[length:1.375rem] [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:w-6.5 [&_h2_>_svg]:h-6.5 [&_h2_>_svg]:shrink-0 [&_p]:[margin:0.75rem_0] [&_p]:text-sm max-[85rem]:p-4.5 max-[40rem]:[&_h2]:text-xl event-rsvp bg-[#fff1e5] border-[#f4deca] relative overflow-hidden [&_>_:not(.event-rsvp-paw)]:relative max-[64rem]:[grid-column:1_/_-1]'
      }
      aria-labelledby="event-rsvp-title"
      aria-busy={locked}
    >
      <PawPrint
        className={
          'event-rsvp-paw absolute top-4 right-4 text-[#f9d7b6] [transform:rotate(12deg)] pointer-events-none'
        }
        size={78}
        aria-hidden="true"
      />
      <h2 id="event-rsvp-title">
        <CalendarCheck aria-hidden="true" /> Your RSVP
      </h2>
      {saved.viewerAttending ? (
        <p
          className={
            'event-rsvp-confirmed [.event-rsvp_&]:inline-flex [.event-rsvp_&]:items-center [.event-rsvp_&]:gap-2 [.event-rsvp_&]:bg-[#e5f4d6] [.event-rsvp_&]:text-[#275e19] [.event-rsvp_&]:[font-weight:650] [.event-rsvp_&]:rounded-[2rem] [.event-rsvp_&]:[padding:0.5rem_0.75rem] [.event-rsvp_&]:[margin:0_0_0.75rem] [&_svg]:shrink-0'
          }
        >
          <CircleCheck size={19} aria-hidden="true" /> You’re going to this
          event!
        </p>
      ) : (
        <p>
          {closed
            ? closedMessage
            : full
              ? 'All places are currently reserved.'
              : 'A little time together can make a difference.'}
        </p>
      )}
      {saved.viewerAttending && closed && (
        <p>{closedMessage} You can still withdraw your RSVP.</p>
      )}
      <div
        className={
          'event-rsvp-actions flex gap-2.5 flex-wrap mt-2 [&_>_[data-slot=button]]:[flex:1_1_auto] [&_>_[data-slot=button]]:rounded-[2rem] [&_[data-slot=button][aria-pressed=true]:disabled]:opacity-[1] [&_[data-slot=button][aria-pressed=true]:disabled]:bg-[#e5f4d6] [&_[data-slot=button][aria-pressed=true]:disabled]:text-[#275e19] [&_[data-slot=button][aria-pressed=true]:disabled]:border-[#aac995] max-[40rem]:flex-col'
        }
      >
        {session.actor ? (
          <>
            <Button
              disabled={locked || closed || full || saved.viewerAttending}
              aria-pressed={saved.viewerAttending}
              onClick={() => void respond(true)}
            >
              <Check size={20} aria-hidden="true" />{' '}
              {pending
                ? 'Saving…'
                : saved.viewerAttending
                  ? 'Going'
                  : 'Join this event'}
            </Button>
            {saved.viewerAttending && (
              <Button
                variant="outline"
                disabled={locked}
                onClick={() => void respond(false)}
              >
                <X size={18} aria-hidden="true" /> Withdraw RSVP
              </Button>
            )}
          </>
        ) : !closed && !full ? (
          <ButtonLink href={loginPath(path)}>Sign in to RSVP</ButtonLink>
        ) : null}
      </div>
      <p
        className={
          'event-rsvp-places [.event-rsvp_&]:text-xs [.event-rsvp_&]:text-[#765338] [.event-rsvp_&]:[margin:0.875rem_0_0] [.event-rsvp_&]:tabular-nums'
        }
      >
        {saved.attendanceCount} of {saved.capacity} places reserved
        {!closed && !full
          ? ` · ${saved.capacity - saved.attendanceCount} available`
          : ''}
      </p>
      {error && (
        <p
          className={'field-error m-0 text-foreground font-semibold'}
          role="alert"
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}

export function EventShare({ slug, title }: { slug: string; title: string }) {
  const [url, setUrl] = useState('')
  const [pending, setPending] = useState(false)
  const id = useId()
  async function share() {
    setPending(true)
    const href = new URL(
      `/events/${encodeURIComponent(slug)}`,
      window.location.origin,
    ).href
    try {
      if (navigator.share) {
        try {
          await navigator.share({ title, url: href })
          return
        } catch (reason) {
          if (reason instanceof Error && reason.name === 'AbortError') return
        }
      }
      if (!navigator.clipboard) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(href)
      toast.success('Event link copied')
    } catch {
      setUrl(href)
    } finally {
      setPending(false)
    }
  }
  return (
    <div className={'event-share relative'}>
      <Button
        variant="outline"
        disabled={pending}
        onClick={() => void share()}
        aria-label="Share this event"
        title="Share this event"
      >
        <Share2 size={20} aria-hidden="true" />
      </Button>
      {url && (
        <div
          className={
            'event-share-fallback absolute right-0 [z-index:5] w-[min(19rem,_75vw)] mt-2 p-4 bg-card [border:1px_solid_var(--border)] rounded-xl [&_label]:block [&_label]:mb-2 [&_label]:text-[0.8125rem]'
          }
        >
          <label htmlFor={id}>Copy the event link</label>
          <Input
            id={id}
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </div>
  )
}
