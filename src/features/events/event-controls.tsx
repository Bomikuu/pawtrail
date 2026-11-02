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
import { toast } from '@/components/ui/sonner'
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
      <section className="event-panel event-rsvp">
        <h2>
          <CalendarCheck aria-hidden="true" /> Your RSVP
        </h2>
        <p role="status">Updating your event RSVP…</p>
      </section>
    )
  return (
    <section
      className="event-panel event-rsvp"
      aria-labelledby="event-rsvp-title"
      aria-busy={locked}
    >
      <PawPrint className="event-rsvp-paw" size={78} aria-hidden="true" />
      <h2 id="event-rsvp-title">
        <CalendarCheck aria-hidden="true" /> Your RSVP
      </h2>
      {saved.viewerAttending ? (
        <p className="event-rsvp-confirmed">
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
      <div className="event-rsvp-actions">
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
      <p className="event-rsvp-places">
        {saved.attendanceCount} of {saved.capacity} places reserved
        {!closed && !full
          ? ` · ${saved.capacity - saved.attendanceCount} available`
          : ''}
      </p>
      {error && (
        <p className="field-error" role="alert">
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
    <div className="event-share">
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
        <div className="event-share-fallback">
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
