import { ChevronRight, Flag, House, MapPin, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { questProgress, type MapQuestEntry } from '@/game/discovery/quests'
import { distanceLabel, metersBetween } from '@/game/discovery/geo'
import type { HelpPrompt } from '@/game/discovery/attention'
import type { Point } from '@/game/discovery/types'
import { EntityFace } from './markers'
import { DiscoveryAvatar } from './discovery-avatar'

const rowClass =
  'grid h-auto w-full grid-cols-[2.75rem_minmax(0,1fr)_auto] items-center gap-3 whitespace-normal rounded-lg border bg-card p-3 text-left text-foreground shadow-none transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
const stateLabels = {
  accepted: 'Joined',
  submitted: 'Awaiting review',
  approved: 'Approved',
  rejected: 'Changes requested',
}
function Area({
  area,
  coordinates,
  origin,
}: {
  area: string
  coordinates: Point
  origin?: Point | null
}) {
  return (
    <span className="mt-1 flex items-start gap-1 text-xs font-normal leading-relaxed text-muted-foreground">
      <MapPin aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
      <span>
        {area || 'Public area not recorded'}
        {origin && (
          <span
            className="block"
            title="Straight-line distance to a published approximate area"
          >
            Approx. {distanceLabel(metersBetween(origin, coordinates))} away ·
            straight line
          </span>
        )}
      </span>
    </span>
  )
}
function Status({
  label,
  urgent = false,
  adoption = false,
}: {
  label: string
  urgent?: boolean
  adoption?: boolean
}) {
  const Icon = adoption ? House : urgent ? TriangleAlert : Flag
  return (
    <Badge
      variant="outline"
      className={
        'max-w-32 items-start gap-1 whitespace-normal rounded-md text-left text-[11px] leading-snug ' +
        (urgent
          ? 'border-destructive/20 bg-destructive/10 text-destructive'
          : adoption
            ? 'border-primary/20 bg-primary/5 text-foreground'
            : 'text-foreground')
      }
    >
      <Icon aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
      {label}
    </Badge>
  )
}
export function QuestRow({
  entry,
  origin,
  onAttention,
  onChoose,
}: {
  entry: MapQuestEntry
  origin?: Point | null
  onAttention: (prompt: HelpPrompt) => void
  onChoose: (id: string) => void
}) {
  if (entry.kind === 'animal' || entry.kind === 'alert') {
    const entity = entry.kind === 'animal' ? entry.entity : entry.prompt.entity
    const attention = entry.kind === 'animal' ? entry.attention : entry.prompt
    const adoptable = entry.kind === 'animal' && entry.adoptable
    return (
      <li>
        <Button
          type="button"
          variant="outline"
          className={rowClass}
          onClick={() =>
            attention ? onAttention(attention) : onChoose(entity.id)
          }
        >
          <EntityFace entity={entity} className="size-11" />
          <span className="min-w-0">
            <span className="block font-heading text-lg font-bold leading-tight">
              {entity.animal?.name ?? entity.name}
            </span>
            <Area
              area={entity.area}
              coordinates={entity.coordinates}
              origin={origin}
            />
          </span>
          <span className="flex max-w-36 items-center gap-1.5">
            <span className="flex flex-col items-start gap-1">
              {attention && (
                <Status
                  label={attention.attention.label}
                  urgent={attention.attention.level === 'urgent'}
                />
              )}
              {adoptable && <Status label="For adoption" adoption />}
            </span>
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          </span>
        </Button>
      </li>
    )
  }
  const { quest } = entry
  const progress = questProgress(quest.participation)
  return (
    <li>
      <a href={quest.href} className={rowClass}>
        <DiscoveryAvatar
          kind="help"
          src={quest.animal?.photo?.url}
          alt={quest.title}
          className="size-11"
        />
        <span className="min-w-0">
          <span className="block font-heading text-lg font-bold leading-tight">
            {quest.title}
          </span>
          {quest.animal && (
            <span className="mt-1 block text-xs text-muted-foreground">
              For {quest.animal.name}
            </span>
          )}
          <Area
            area={quest.area}
            coordinates={quest.coordinates}
            origin={origin}
          />
        </span>
        <span className="flex max-w-36 items-center gap-1.5">
          <Status
            label={
              quest.participation
                ? stateLabels[quest.participation]
                : !quest.available
                  ? 'Closed'
                  : ['critical', 'high'].includes(quest.priority)
                    ? 'Needs help'
                    : 'Open quest'
            }
            urgent={
              !quest.participation &&
              quest.available &&
              ['critical', 'high'].includes(quest.priority)
            }
          />
          <ChevronRight
            aria-hidden="true"
            className="size-3.5 shrink-0 text-muted-foreground"
          />
        </span>
        {quest.participation && (
          <span className="col-span-2 col-start-2 block space-y-1.5">
            <span className="flex justify-between gap-2 text-[11px] text-muted-foreground">
              <span>
                {progress.label}
                {!quest.available && quest.participation !== 'approved'
                  ? ' · Quest closed'
                  : ''}
              </span>
              <span className="shrink-0 tabular-nums">
                {progress.completed}/3
              </span>
            </span>
            <Progress
              className="h-1"
              value={(progress.completed / 3) * 100}
              aria-label={'Saved progress for ' + quest.title}
              aria-valuetext={`${progress.completed} of 3 milestones. ${progress.label}`}
            />
          </span>
        )}
      </a>
    </li>
  )
}
