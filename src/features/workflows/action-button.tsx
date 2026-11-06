'use client'
import { useRef, useState, type ReactNode } from 'react'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
import { useQueryClient } from '@tanstack/react-query'
import { LoadingButton as Button } from '@/components/shared/loading-button'
import { getBrowserApi } from '@/lib/api/client'
export function ActionButton({
  action,
  id,
  active = false,
  children,
}: {
  action: 'interest' | 'mission' | 'rsvp' | 'withdraw' | 'close'
  id: string
  active?: boolean
  children: ReactNode
}) {
  const [pending, setPending] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('')
  const router = useRouter(),
    queries = useQueryClient(),
    receipt = useRef<string | null>(null)
  async function act() {
    if (pending) return
    setPending(true)
    setError('')
    const api = getBrowserApi(),
      options = { idempotencyKey: (receipt.current ??= crypto.randomUUID()) }
    try {
      if (action === 'interest')
        await api.adoption.setInterest(id, !active, options)
      if (action === 'mission') {
        await api.missions.accept(id, options)
        router.push('/dashboard/missions')
      }
      if (action === 'rsvp') await api.events.setRsvp(id, !active, options)
      if (action === 'withdraw') await api.adoption.withdraw(id, options)
      if (action === 'close') await api.fundraisers.close(id, options)
      await queries.invalidateQueries()
      router.refresh()
      setMessage('Saved.')
      receipt.current = null
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Try again.')
    } finally {
      setPending(false)
    }
  }
  return (
    <div>
      <Button loading={pending} disabled={pending} onClick={() => void act()}>
        {pending ? 'Saving…' : children}
      </Button>
      {error && (
        <p
          role="alert"
          className={'field-error m-0 text-foreground font-semibold'}
        >
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  )
}
