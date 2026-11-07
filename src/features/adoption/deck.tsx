'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
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
      <section
        className={
          'journal-empty [padding:3rem_1.5rem] text-center [border:1px_dashed_#c9bcb0] rounded-2xl [margin:1.5rem_0] flex flex-col items-center gap-4 [&_p]:max-w-[55ch] [&_p]:m-0 [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:bg-card [.app-shell_&]:[padding:1.75rem_1.25rem] [.app-shell_&]:gap-3.5 [.app-shell_&]:[margin:1rem_0_1.5rem] [&_>_img]:w-40 [&_>_img]:max-w-[65%] [&_>_img]:h-auto [.app-shell_.attention-panel_&]:[border:0] [.app-shell_.attention-panel_&]:[padding:0.5rem_0] [.app-shell_.attention-panel_&]:m-0 [.app-shell_.attention-panel_&]:bg-[transparent] [.app-shell_.attention-panel_&_>_img]:w-24'
        }
      >
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
    <div
      className={
        list
          ? 'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
          : 'adoption-deck max-w-160 m-auto [.app-shell_&]:max-w-none [.app-shell_&]:m-0 [.app-shell_&_>_p]:text-[0.8125rem] [.app-shell_&_>_p]:text-muted-foreground [.app-shell_&_>_p]:[margin:0_0_0.75rem]'
      }
    >
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
            className={
              'adoption-story bg-card [border:1px_solid_#ede5d8] rounded-2xl overflow-hidden [margin:1rem_0] [&_h2]:font-heading [&_h2]:text-[2rem] [&_h2]:m-0 [&_details]:[padding:1rem_0] [&_details]:[border-block:1px_solid_#ede5d8] [&_details]:[margin:1rem_0] [&_summary]:cursor-pointer [&_summary]:text-[#0f766e] [&_summary]:font-semibold [.app-shell_.adoption-deck_&]:grid [.app-shell_.adoption-deck_&]:grid-cols-[minmax(17rem,_0.9fr)_minmax(0,_1fr)] [.app-shell_.adoption-deck_&]:m-0 [.app-shell_&_details]:my-3 [.app-shell_&_details]:py-2.5 max-[48rem]:[.app-shell_.adoption-deck_&]:grid-cols-1'
            }
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
              className={
                'adoption-photo [.adoption-deck_&]:min-w-0 [.adoption-deck_&]:bg-[#f0e8dc]'
              }
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
              <AnimalImage
                image={a.photo}
                className={
                  'detail-cover block w-full max-h-136 [aspect-ratio:4/3] object-cover rounded-2xl bg-[#f4eee4] [.adoption-story_&]:rounded-[0] [.adoption-story_&]:max-h-116 [.app-shell_.adoption-deck_&]:w-full [.app-shell_.adoption-deck_&]:h-full [.app-shell_.adoption-deck_&]:min-h-88 [.app-shell_.adoption-deck_&]:max-h-128 [.app-shell_.adoption-deck_&]:object-cover max-[48rem]:[.app-shell_.adoption-deck_&]:min-h-0 max-[48rem]:[.app-shell_.adoption-deck_&]:h-auto max-[48rem]:[.app-shell_.adoption-deck_&]:max-h-68 max-[48rem]:[.app-shell_.adoption-deck_&]:[aspect-ratio:4_/_3]'
                }
              />
            </div>
            <div
              className={
                'adoption-story-body p-6 [.app-shell_&]:p-5 [&_>_p]:text-[length:0.9375rem] [&_>_p]:[line-height:1.55] max-[48rem]:[.app-shell_&]:p-4'
              }
            >
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
              <div
                className={
                  'workflow-actions flex items-center gap-3 flex-wrap [margin:0.75rem_0] [.discovery-map_&_p]:m-0 [.discovery-map_&_p]:text-sm [.discovery-map_&_p]:text-muted-foreground max-[48rem]:[&_>_*]:max-w-full [.achievement-review-card_&]:mt-4 [.adoption-story_&]:gap-2.5 [.adoption-story_&_[data-slot=button]]:[flex:1_1_9rem]'
                }
              >
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
        <p
          role="alert"
          className={'field-error m-0 text-foreground font-semibold'}
        >
          {error}
        </p>
      )}
    </div>
  )
}
