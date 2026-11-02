'use client'
import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Check, Compass, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ButtonLink } from '@/components/ui/button-link'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
export function AchievementActivity({
  target,
  href,
  showShare = true,
}: {
  target: { kind: 'animal' | 'mission' | 'fundraiser'; id: string }
  href: string
  showShare?: boolean
}) {
  const { session, pending: changing } = useSession(),
    client = useQueryClient()
  const [discovered, setDiscovered] = useState(false),
    [pending, setPending] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [manual, setManual] = useState('')
  const busy = useRef(false)
  async function record(kind: 'discovery' | 'share') {
    if (busy.current) return
    busy.current = true
    setPending(true)
    setError('')
    setMessage('')
    try {
      if (kind === 'share') {
        const url = new URL(href, window.location.origin).href
        let shared = false
        if (navigator.share) {
          try {
            await navigator.share({ title: 'A PawTrail story', url })
            shared = true
          } catch (reason) {
            if (reason instanceof Error && reason.name === 'AbortError') return
          }
        }
        if (!shared) {
          try {
            await navigator.clipboard.writeText(url)
          } catch {
            setManual(url)
            setMessage(
              'Copy the link below. Progress is recorded only when the share or copy action succeeds.',
            )
            return
          }
        }
      }
      if (session.actor) {
        await getBrowserApi().achievements.record({ kind, ref: target })
        await client.invalidateQueries()
      }
      if (kind === 'discovery') {
        setDiscovered(true)
        setMessage('Saved to your discoveries. Each animal counts once.')
      } else
        setMessage(
          session.actor
            ? 'Story link shared. Each page counts once toward Advocate.'
            : 'Story link shared. Sign in to track achievements.',
        )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Progress could not sync. Try again.',
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <div className="achievement-activity">
      <div className="workflow-actions">
        {target.kind === 'animal' &&
          (session.actor ? (
            <Button
              variant="outline"
              disabled={pending || changing || discovered}
              onClick={() => void record('discovery')}
            >
              {discovered ? (
                <Check size={17} aria-hidden="true" />
              ) : (
                <Compass size={17} aria-hidden="true" />
              )}
              {discovered ? 'Discovery saved' : 'Mark discovered'}
            </Button>
          ) : (
            <ButtonLink href={loginPath(href)} variant="outline">
              Sign in to track discoveries
            </ButtonLink>
          ))}
        {showShare && (
          <Button
            variant="ghost"
            disabled={pending || changing}
            onClick={() => void record('share')}
          >
            <Share2 size={17} aria-hidden="true" />
            Share this story
          </Button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
      {manual && (
        <label>
          Story link
          <Input
            value={manual}
            readOnly
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
    </div>
  )
}
