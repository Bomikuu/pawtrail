import { ArrowUpRight, ChevronRight, TriangleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { distanceLabel } from '@/features/neighborhood/game/discovery/geo'
import type { HelpPrompt } from '@/features/neighborhood/game/discovery/attention'
import { AnimalFace } from './markers'
import { DiscoveryAvatar } from './discovery-avatar'
import { panelMotion, useRetainedPanel } from './panel-motion'

function heading(prompt: HelpPrompt) {
  const { entity, attention, animalName } = prompt
  if (attention.sourceKind === 'missing')
    return `${animalName ?? entity.name} is missing`
  if (attention.label === 'Concern under review')
    return animalName
      ? `A concern about ${animalName} is under review`
      : 'A nearby concern is under review'
  if (attention.sourceKind === 'incident' || attention.sourceKind === 'welfare')
    return animalName
      ? `${animalName} has a reported welfare concern`
      : 'A nearby welfare concern needs attention'
  return animalName
    ? `${animalName} needs your help`
    : 'A nearby request needs your help'
}
export function AnimalHelpPrompt({
  prompt,
  count,
  onOpen,
  onNext,
  onDismiss,
  hiddenOnMobile,
  hasCenter,
}: {
  prompt: HelpPrompt | null
  count: number
  onOpen: (prompt: HelpPrompt) => void
  onNext: (prompt: HelpPrompt) => void
  onDismiss: (prompt: HelpPrompt) => void
  hiddenOnMobile: boolean
  hasCenter: boolean
}) {
  const retained = useRetainedPanel(prompt)
  const p = retained.value
  if (!p) return null
  const animal =
    p.entity.animal ??
    (p.entity.membership?.animals.length === 1
      ? p.entity.membership.animals[0]
      : null)
  const urgent = p.attention.level === 'urgent'
  return (
    <Card
      data-state={retained.exiting ? 'closed' : 'open'}
      inert={retained.exiting}
      aria-hidden={retained.exiting}
      aria-label="Nearby animal help alert"
      className={
        'absolute bottom-36 @min-[56rem]:bottom-5 [@media(max-height:540px)]:bottom-3 left-1/2 z-30 w-[min(30rem,calc(100%-2rem))] -translate-x-1/2 max-h-[60%] overflow-y-auto gap-0 rounded-2xl border bg-card p-3 shadow-lg ' +
        (hiddenOnMobile ? 'hidden lg:block ' : '') +
        panelMotion
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            'grid size-12 shrink-0 place-items-center rounded-full ' +
            (urgent ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-900')
          }
        >
          {animal ? (
            <AnimalFace animal={animal} className="size-12" />
          ) : (
            <DiscoveryAvatar
              kind={p.entity.kind}
              src={p.entity.photo?.url}
              alt={p.entity.name}
              className="size-12"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                'gap-1 text-[10px] ' +
                (urgent
                  ? 'border-red-300 text-red-800 dark:text-red-200'
                  : 'border-amber-400 text-amber-900 dark:text-amber-200')
              }
            >
              <TriangleAlert className="size-3" />
              {p.attention.label}
            </Badge>
            {p.entity.sample && (
              <Badge variant="secondary" className="text-[10px]">
                Illustrative sample
              </Badge>
            )}
          </div>
          <h2
            className="text-sm font-extrabold leading-snug text-foreground"
            role="status"
            aria-live="polite"
          >
            {heading(p)}
          </h2>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {p.attention.detail}
          </p>
          {hasCenter && p.distance !== null && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              About {distanceLabel(p.distance)} from this area’s center
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-mr-1 -mt-1 size-8 shrink-0 rounded-md text-foreground"
          aria-label="Dismiss help prompts for this area"
          onClick={() => onDismiss(p)}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
        <p className="text-[10px] text-muted-foreground">
          {p.entity.sample
            ? 'Practice alert · no real emergency'
            : p.attention.sourceKind === 'incident' ||
                p.attention.sourceKind === 'welfare'
              ? 'Read the published report before acting'
              : 'Open the details to see ways to help'}
        </p>
        <div className="flex items-center gap-1">
          {count > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-foreground"
              onClick={() => onNext(p)}
              aria-label="Show the next nearby help alert"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            className="h-8 rounded-md px-3 text-xs"
            onClick={() => onOpen(p)}
          >
            Check it out
            <ArrowUpRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
