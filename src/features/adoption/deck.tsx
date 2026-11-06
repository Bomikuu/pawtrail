'use client'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Heart, ArrowRight, RotateCcw } from 'lucide-react'
import type { AdoptionCandidate } from './types'
import { getBrowserApi } from '@/lib/api/client'
import { AnimalImage } from '@/components/shared/animal-image'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { ActionButton } from '@/features/workflows/action-button'

export function AdoptionDeck({
  candidates,
  signedIn,
  list = false,
}: {
  candidates: AdoptionCandidate[]
  signedIn: boolean
  list?: boolean
}) {
  const [index, setIndex] = useState(0),
    [pending, setPending] = useState(false),
    [error, setError] = useState('')
  const reducedMotion = useReducedMotion()
  const start = useRef<{ x: number; y: number } | null>(null),
    router = useRouter(),
    queries = useQueryClient()
  async function interested() {
    if (pending) return
    if (!signedIn) {
      router.push('/login?returnTo=%2Fadopt')
      return
    }
    setPending(true)
    setError('')
    try {
      await getBrowserApi().adoption.setInterest(
        candidates[index].animal.id,
        true,
      )
      await queries.invalidateQueries()
      setIndex((i) => i + 1)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Could not save interest. Try again.',
      )
    } finally {
      setPending(false)
    }
  }
  const cards = list ? candidates : candidates.slice(index, index + 1)
  if (!cards.length)
    return (
      <section className="journal-empty">
        <img
          src="/images/pawtrail/caught-up.webp"
          alt=""
          width={239}
          height={119}
          loading="lazy"
        />
        <h2>You’ve met this group</h2>
        <p>
          Your interested list keeps the animals you would like to learn more
          about.
        </p>
        <ButtonLink href="/adopt/interested">
          View interested animals
        </ButtonLink>
        <Button variant="outline" onClick={() => setIndex(0)}>
          <RotateCcw size={16} aria-hidden="true" /> Browse again
        </Button>
      </section>
    )
  return (
    <div className={list ? 'journal-grid' : 'adoption-deck'}>
      {!list && (
        <p aria-live="polite">
          Animal {index + 1} of {candidates.length}
        </p>
      )}
      <AnimatePresence initial={false} mode={list ? 'sync' : 'wait'}>
        {cards.map(({ animal: a, compatibility: c }) => (
          <motion.article
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 1 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15 }}
            key={a.id}
            className="adoption-story"
            tabIndex={list ? undefined : 0}
            aria-label={`${a.name}. Left arrow passes; right arrow saves interest.`}
            onKeyDown={(e) => {
              if (list || pending) return
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                setIndex((i) => i + 1)
              }
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                void interested()
              }
            }}
          >
            <div
              className="adoption-photo"
              style={{ touchAction: 'pan-y' }}
              onPointerDown={(e) => {
                start.current = { x: e.clientX, y: e.clientY }
                e.currentTarget.setPointerCapture(e.pointerId)
              }}
              onPointerCancel={() => {
                start.current = null
              }}
              onPointerUp={(e) => {
                if (list || pending || !start.current) return
                const dx = e.clientX - start.current.x,
                  dy = e.clientY - start.current.y
                start.current = null
                if (Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy)) {
                  if (dx > 0) void interested()
                  else setIndex((i) => i + 1)
                } else if (dy < -90 && Math.abs(dy) > Math.abs(dx)) {
                  router.push(`/pets/${a.slug}`)
                }
              }}
            >
              <AnimalImage image={a.photo} className="detail-cover" />
            </div>
            <div className="adoption-story-body">
              <h2>
                <Link href={`/pets/${a.slug}`}>{a.name}</Link>
              </h2>
              <p>
                {a.species} · {a.ageMonths} months · {a.size} ·{' '}
                {a.location.neighborhood}
              </p>
              <p>{a.description}</p>
              <p>{a.personality.join(' · ')}</p>
              <details>
                <summary>
                  {c.score === null
                    ? 'Set optional preferences to explore compatibility'
                    : `${c.score}% match across answered preferences`}
                </summary>
                <p>
                  Demonstration rules; this score never guarantees suitability
                  or approval.
                </p>
                {c.components.map((r) => (
                  <p key={r.dimension}>
                    <strong>{r.dimension}: </strong>
                    {r.explanation}
                  </p>
                ))}
                {c.advisories.map((r) => (
                  <p key={r}>{r}</p>
                ))}
              </details>
              <div className="workflow-actions">
                {list ? (
                  <ActionButton action="interest" id={a.id} active>
                    Remove interest
                  </ActionButton>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => setIndex((i) => i + 1)}
                    >
                      Pass for now <ArrowRight size={16} aria-hidden="true" />
                    </Button>
                    <Button
                      disabled={pending}
                      onClick={() => void interested()}
                    >
                      <Heart size={18} aria-hidden="true" />
                      {pending ? 'Saving…' : 'Interested'}
                    </Button>
                  </>
                )}
                <ButtonLink variant="outline" href={`/pets/${a.slug}`}>
                  Read their story
                </ButtonLink>
                {list && (
                  <ButtonLink href={`/adopt/applications/new?animalId=${a.id}`}>
                    Start an application
                  </ButtonLink>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </AnimatePresence>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
