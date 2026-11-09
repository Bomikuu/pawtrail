import {
  CalendarDays,
  Camera,
  Flag,
  FlaskConical,
  Heart,
  Paintbrush,
  PawPrint,
  Ruler,
  Sparkles,
  UserRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type {
  EntityKind,
  MapAnimal,
  MapEntity,
} from '@/features/neighborhood/game/discovery/types'
import type { PlatformAnimalDetail } from '@/features/neighborhood/game/platform'
import { entityIcons } from './markers'
import { formatAnimalAge } from '@/features/neighborhood/game/discovery/animal-labels'

export function IconBadge({
  icon: Icon,
  label,
  className = '',
}: {
  icon: LucideIcon
  label: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={
        'gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-foreground ' +
        className
      }
    >
      <Icon className="size-3 shrink-0" />
      {label}
    </Badge>
  )
}
const singular: Record<EntityKind, string> = {
  animal: 'Animal',
  home: 'Home',
  shelter: 'Shelter',
  hub: 'Community',
  horde: 'Horde',
  help: 'Help request',
  urgent: 'Urgent help',
  incident: 'Welfare report',
  event: 'Event',
}
export function KindBadge({ kind }: { kind: EntityKind }) {
  return <IconBadge icon={entityIcons[kind]} label={singular[kind]} />
}
export function SampleBadge() {
  return (
    <IconBadge
      icon={FlaskConical}
      label="Illustrative sample"
      className="bg-secondary/60"
    />
  )
}
export function AnimalCharacteristics({
  animal,
  detail,
}: {
  animal: MapAnimal
  detail?: PlatformAnimalDetail | null
}) {
  const age = detail?.ageMonths ?? animal.ageMonths,
    coat = detail?.appearance?.trim() || animal.coat
  const facts = [
    {
      label: 'Age',
      value: formatAnimalAge(age) ?? 'Not recorded',
      icon: CalendarDays,
    },
    {
      label: 'Gender',
      value: detail?.gender ?? animal.gender ?? 'Not recorded',
      icon: UserRound,
    },
    {
      label: 'Size',
      value: detail?.size ?? animal.size ?? 'Not recorded',
      icon: Ruler,
    },
    {
      label: 'Coat & markings',
      value: coat || 'Not recorded',
      icon: Paintbrush,
    },
  ]
  const characteristics = [
    ...new Set([
      ...(detail?.characteristics ?? animal.characteristics ?? []),
      ...(detail?.personality ?? animal.personality ?? []),
    ]),
  ]
  return (
    <section className="space-y-3" aria-label="Animal characteristics">
      <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
        <PawPrint className="size-4" />
        Animal characteristics
      </h3>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-y py-3 text-xs">
        {facts.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className={label === 'Coat & markings' ? 'col-span-2' : ''}
          >
            <dt className="flex items-center gap-1.5 text-muted-foreground">
              <Icon className="size-3.5" />
              {label}
            </dt>
            <dd className="mt-1 leading-relaxed font-medium text-foreground">
              {value.replaceAll('_', ' ')}
            </dd>
          </div>
        ))}
      </dl>
      {characteristics.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {characteristics.slice(0, 8).map((trait, i) => (
            <IconBadge
              key={trait}
              icon={i % 2 ? Heart : Sparkles}
              label={trait}
            />
          ))}
        </div>
      )}
    </section>
  )
}
export type AnimalReportKind = 'sighting' | 'concern'
export function AnimalReportActions({
  entity,
  onReport,
}: {
  entity: MapEntity
  onReport: (entity: MapEntity, kind: AnimalReportKind) => void
}) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Report about this animal"
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md text-foreground"
        onClick={() => onReport(entity, 'sighting')}
      >
        <Camera className="size-3.5" />
        Create sighting
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-md text-foreground"
        onClick={() => onReport(entity, 'concern')}
      >
        <Flag className="size-3.5" />
        Report concern
      </Button>
    </div>
  )
}
export function DiscoveryFilter({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? 'default' : 'outline'}
      size="sm"
      aria-pressed={active}
      className={
        'h-8 gap-1.5 rounded-md px-2.5 text-xs shadow-md ' +
        (active ? '' : 'bg-card text-foreground dark:bg-card')
      }
      onClick={onClick}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {label}
      <Badge
        variant="secondary"
        className="min-w-5 justify-center rounded-sm px-1 py-0 text-[10px] tabular-nums"
      >
        {count}
      </Badge>
    </Button>
  )
}
