import { useEffect, useState, type ReactNode } from 'react'
import {
  Home,
  HeartHandshake,
  Users,
  PawPrint,
  HandHelping,
  TriangleAlert,
  ShieldAlert,
  MapPin,
  UserRound,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { composition, membershipAnimals } from '@/features/neighborhood/game/discovery/geo'
import { clusterAnimalTargets, memberEntity } from '@/features/neighborhood/game/discovery/members'
import { DiscoveryAvatar } from './discovery-avatar'
import { animalPlaceholder } from '@/features/neighborhood/game/animal-placeholder'
import { attentionRank, entityAttention } from '@/features/neighborhood/game/discovery/attention'
import type {
  EntityKind,
  MapAnimal,
  MapEntity,
  MapAttention,
  UserPosition,
} from '@/features/neighborhood/game/discovery/types'
export const entityIcons = {
  home: Home,
  shelter: HeartHandshake,
  hub: Users,
  animal: PawPrint,
  horde: PawPrint,
  help: HandHelping,
  urgent: TriangleAlert,
  incident: ShieldAlert,
  event: CalendarDays,
}
const border: Record<EntityKind, string> = {
  home: 'border-green-700',
  shelter: 'border-violet-600',
  hub: 'border-emerald-700',
  animal: 'border-green-700',
  horde: 'border-green-700',
  help: 'border-amber-600',
  urgent: 'border-red-600',
  incident: 'border-amber-600',
  event: 'border-orange-600',
}
const alertBorder = (attention: MapAttention) =>
  attention.level === 'urgent'
    ? 'border-red-600'
    : attention.level === 'concern'
      ? 'border-amber-600'
      : 'border-teal-700'

const selectedMarkerClass =
  'z-30 scale-125 ring-4 ring-foreground ring-offset-2 ring-offset-card focus-visible:ring-4 focus-visible:ring-foreground'

export function AttentionRing({ attention }: { attention?: MapAttention }) {
  if (!attention) return null
  const urgent = attention.level === 'urgent',
    pulse = attention.level !== 'help'
  return (
    <>
      <span
        aria-hidden="true"
        className={
          'pointer-events-none absolute -inset-1 rounded-full border-2 ' +
          (urgent
            ? 'border-red-600/70'
            : attention.level === 'concern'
              ? 'border-amber-600/60'
              : 'border-teal-700/50')
        }
      />
      {pulse && (
        <span
          aria-hidden="true"
          className={
            'pointer-events-none absolute -inset-1 rounded-full border-2 motion-safe:animate-ping motion-safe:[animation-duration:2.8s] ' +
            (urgent ? 'border-red-500/50' : 'border-amber-500/40')
          }
        />
      )}
    </>
  )
}
function AttentionIcon({ attention }: { attention: MapAttention }) {
  const Icon = attention.level === 'help' ? HandHelping : TriangleAlert
  return (
    <span
      className={
        'pointer-events-none absolute -right-1 -bottom-1 z-10 grid size-5 place-items-center rounded-full border-2 border-card text-white ' +
        (attention.level === 'urgent'
          ? 'bg-red-700'
          : attention.level === 'concern'
            ? 'bg-amber-700'
            : 'bg-teal-700')
      }
      aria-label={attention.label}
      title={attention.label}
    >
      <Icon className="size-3" />
    </span>
  )
}
export function AnimalFace({
  animal,
  className = '',
}: {
  animal: MapAnimal
  className?: string
}) {
  const [fallbackFailed, setFallbackFailed] = useState(false)
  useEffect(
    () => setFallbackFailed(false),
    [
      animal.id,
      animal.photo?.url,
      animal.species,
      animal.coat,
      animal.characteristics,
    ],
  )
  const placeholder = animalPlaceholder(
    animal.species,
    animal.coat ?? animal.characteristics?.join(' ') ?? '',
  )
  return (
    <Avatar
      title={animal.name}
      className={'bg-secondary text-primary ' + className}
    >
      {animal.photo && (
        <AvatarImage
          src={animal.photo.url}
          alt={animal.name}
          className="object-cover"
        />
      )}
      <AvatarFallback className="rounded-[inherit] bg-secondary">
        {placeholder && !fallbackFailed ? (
          <img
            src={placeholder}
            alt={animal.name + ' · illustrated placeholder'}
            loading="lazy"
            className="size-full object-contain"
            onError={() => setFallbackFailed(true)}
          />
        ) : (
          <PawPrint aria-label={animal.name} className="m-auto size-2/3" />
        )}
      </AvatarFallback>
    </Avatar>
  )
}

export function EntityFace({
  entity,
  className,
}: {
  entity: MapEntity
  className?: string
}) {
  return entity.animal ? (
    <AnimalFace
      animal={{
        ...entity.animal,
        photo: entity.photo ?? entity.animal.photo,
      }}
      className={className}
    />
  ) : (
    <DiscoveryAvatar
      kind={entity.kind}
      src={entity.photo?.url}
      alt={entity.name}
      className={className}
    />
  )
}
function AnimalSatellites({
  targets,
  selectedId,
  onSelect,
  onHover,
  children,
}: {
  targets: MapEntity[]
  selectedId?: string
  onSelect: (id: string) => void
  onHover?: (entity: MapEntity | null) => void
  children: ReactNode
}) {
  const visible = [...targets]
    .sort(
      (a, b) =>
        attentionRank(entityAttention(b)) - attentionRank(entityAttention(a)),
    )
    .slice(0, 4)
  const active = targets.find((e) => e.id === selectedId)
  if (active && !visible.some((e) => e.id === active.id))
    visible[visible.length - 1] = active
  return (
    <div className="pointer-events-none relative grid size-14 place-items-center">
      {visible.length > 0 && (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -inset-16 size-[184px] overflow-visible"
          viewBox="-92 -92 184 184"
        >
          {visible.map((e, index) => {
            const angle = ((index * 90 - 135) * Math.PI) / 180
            return (
              <line
                key={e.id}
                x1="0"
                y1="0"
                x2={Math.cos(angle) * 61}
                y2={Math.sin(angle) * 61}
                className="stroke-primary/40"
                strokeWidth="1.5"
              />
            )
          })}
        </svg>
      )}
      <div className="pointer-events-auto">{children}</div>
      {visible.map((e, index) => {
        const angle = ((index * 90 - 135) * Math.PI) / 180
        const attention = entityAttention(e)
        return (
          <Button
            type="button"
            key={e.id}
            size="icon"
            variant="secondary"
            className={
              'pointer-events-auto absolute size-11 rounded-full border-2 bg-card p-0 shadow-sm transition-transform duration-150 motion-reduce:transition-none ' +
              (attention ? alertBorder(attention) : 'border-primary/60') +
              ' ' +
              (e.id === selectedId
                ? selectedMarkerClass
                : 'z-10 hover:z-20 hover:scale-110 focus-visible:z-20')
            }
            style={{
              left: `calc(50% + ${Math.cos(angle) * 61}px)`,
              top: `calc(50% + ${Math.sin(angle) * 61}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            title={`${e.sample ? 'Sample · ' : ''}${e.name}${e.animal?.associationName ? ' · member of ' + e.animal.associationName : ''}`}
            aria-label={`View ${e.sample ? 'sample ' : ''}${e.name}${e.animal?.associationName ? ', member of ' + e.animal.associationName : ''}${attention ? ', ' + attention.label : ''}`}
            aria-pressed={e.id === selectedId}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onSelect(e.id)
            }}
            onMouseEnter={() => onHover?.(e)}
            onMouseLeave={() => onHover?.(null)}
            onFocus={() => onHover?.(e)}
            onBlur={() => onHover?.(null)}
          >
            <AttentionRing attention={attention} />
            <AnimalFace animal={e.animal!} className="size-full" />
            {attention && <AttentionIcon attention={attention} />}
          </Button>
        )
      })}
    </div>
  )
}
export function EntityMarkerGroup({
  entity,
  selectedId,
  onSelect,
  onHover,
}: {
  entity: MapEntity
  selectedId?: string
  onSelect: (id: string) => void
  onHover?: (entity: MapEntity | null) => void
}) {
  const targets = ['home', 'shelter', 'hub', 'horde'].includes(entity.kind)
    ? (entity.membership?.animals ?? []).map((a) => memberEntity(entity, a))
    : []
  return (
    <AnimalSatellites
      targets={targets}
      selectedId={selectedId}
      onSelect={onSelect}
      onHover={onHover}
    >
      <EntityMarker
        entity={entity}
        selected={entity.id === selectedId}
        onSelect={() => onSelect(entity.id)}
        onHover={onHover}
      />
    </AnimalSatellites>
  )
}
export function GeographicMarkerGroup({
  entities,
  count,
  onSelect,
  onAnimalSelect,
  selectedId,
  onHover,
}: {
  entities: MapEntity[]
  count?: number
  onSelect: () => void
  onAnimalSelect: (id: string) => void
  selectedId?: string
  onHover?: (entity: MapEntity | null) => void
}) {
  return (
    <AnimalSatellites
      targets={clusterAnimalTargets(entities)}
      selectedId={selectedId}
      onSelect={onAnimalSelect}
      onHover={onHover}
    >
      <GeographicMarker entities={entities} count={count} onSelect={onSelect} />
    </AnimalSatellites>
  )
}
function Collage({
  animals,
  fallback = 'animal',
}: {
  animals: MapAnimal[]
  fallback?: EntityKind
}) {
  const photographed = animals
    .filter((animal) => !!animal.photo?.url)
    .slice(0, 4)
  return photographed.length ? (
    <span
      className={
        'grid size-full overflow-hidden rounded-full ' +
        (photographed.length > 1 ? 'grid-cols-2' : 'grid-cols-1')
      }
    >
      {photographed.map((a) => (
        <AnimalFace key={a.id} animal={a} className="size-full rounded-none" />
      ))}
    </span>
  ) : (
    <DiscoveryAvatar
      kind={fallback}
      alt="Shared animals"
      className="size-full"
    />
  )
}
export function EntityMarker({
  entity,
  selected,
  onSelect,
  onHover,
}: {
  entity: MapEntity
  selected?: boolean
  onSelect: () => void
  onHover?: (entity: MapEntity | null) => void
}) {
  const Icon = entityIcons[entity.kind]
  const pets =
    entity.membership?.animals ?? (entity.animal ? [entity.animal] : [])
  const count = pets.length
  const attention = entityAttention(entity)
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={
        'relative size-12 rounded-full border-[3px] bg-card p-0 shadow-md transition-transform duration-150 motion-reduce:transition-none ' +
        (attention ? alertBorder(attention) : border[entity.kind]) +
        ' ' +
        (selected
          ? selectedMarkerClass
          : 'hover:scale-110 focus-visible:scale-110')
      }
      aria-pressed={!!selected}
      aria-label={`${entity.name}${count ? `, ${count} shared animals` : ''}${attention ? ', ' + attention.label : ''}`}
      title={`${entity.sample ? 'Sample · ' : ''}${entity.name}${count ? ` · ${count} shared animals` : ''}`}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseEnter={() => onHover?.(entity)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(entity)}
      onBlur={() => onHover?.(null)}
    >
      <AttentionRing attention={attention} />
      {entity.animal ? (
        <EntityFace entity={entity} className="size-full" />
      ) : entity.photo ? (
        <DiscoveryAvatar
          kind={entity.kind}
          src={entity.photo.url}
          alt={entity.name}
          className="size-full"
        />
      ) : count ? (
        <Collage animals={pets} fallback={entity.kind} />
      ) : (
        <DiscoveryAvatar
          kind={entity.kind}
          alt={entity.name}
          className="size-full"
        />
      )}
      <span className="pointer-events-none absolute -bottom-1 -left-1 grid size-5 place-items-center rounded-full border bg-card text-foreground">
        <Icon className="size-3" />
      </span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full border bg-card px-1 text-center text-[10px] font-extrabold tabular-nums text-foreground">
          {count}
        </span>
      )}
      {attention && <AttentionIcon attention={attention} />}
    </Button>
  )
}
export function GeographicMarker({
  entities,
  count = entities.length,
  onSelect,
  onHover,
}: {
  entities: MapEntity[]
  count?: number
  onSelect: () => void
  onHover?: () => void
}) {
  const summary = composition(entities),
    animals = membershipAnimals(entities)
  const attention = entities
    .map(entityAttention)
    .filter((a): a is MapAttention => !!a)
    .sort((a, b) => attentionRank(b) - attentionRank(a))[0]
  const description = entities.length
    ? `${count} nearby map entities, ${summary.animals} distinct shared animals. ${summary.kinds.home} homes, ${summary.kinds.shelter} shelters, ${summary.kinds.horde} Hordes. Zoom to expand.`
    : `${count} nearby map entities. Select to expand.`
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className={
        'relative size-14 rounded-full border-[3px] bg-card p-0 shadow-md transition-transform hover:scale-110 ' +
        (attention ? alertBorder(attention) : 'border-teal-700')
      }
      aria-label={description + (attention ? ' ' + attention.label : '')}
      title={description}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseEnter={onHover}
    >
      <AttentionRing attention={attention} />
      {animals.length ? (
        <Collage animals={animals} />
      ) : (
        <DiscoveryAvatar
          kind={
            entities.length &&
            entities.every((entity) => entity.kind === entities[0].kind)
              ? entities[0].kind
              : 'city'
          }
          alt="Map cluster"
          className="size-full"
        />
      )}
      <span className="absolute -bottom-1 left-1/2 min-w-7 -translate-x-1/2 rounded-full bg-teal-800 px-1.5 py-0.5 text-xs font-extrabold tabular-nums text-white">
        {count}
      </span>
      {attention && <AttentionIcon attention={attention} />}
    </Button>
  )
}
/** The bottom tip is the published destination, not an offset membership avatar. */
export function RouteDestinationMarker({ entity }: { entity: MapEntity }) {
  if (!entity.animal) return null
  return (
    <div
      role="img"
      aria-label={`Destination: ${entity.name}, approximate published area`}
      className="pointer-events-none relative flex w-14 flex-col items-center pb-2"
    >
      <span className="absolute bottom-full left-1/2 mb-1 max-w-48 -translate-x-1/2 truncate rounded-md border bg-card px-2 py-1 text-xs font-semibold text-foreground shadow-sm">
        {entity.name} · destination
      </span>
      <span className="relative z-[1] grid size-12 place-items-center rounded-full border-[3px] border-primary bg-card shadow-md">
        <AnimalFace animal={entity.animal} className="size-full" />
      </span>
      <span
        aria-hidden="true"
        className="absolute bottom-1 size-3 rotate-45 bg-primary"
      />
    </div>
  )
}

export function ViewerMarker({
  viewer,
  onSelect,
}: {
  viewer: UserPosition
  onSelect: () => void
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [viewer.avatar])
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      className="relative size-12 rounded-full border-[3px] border-blue-600 bg-card p-0 shadow-md"
      onClick={onSelect}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={
        viewer.source === 'manual'
          ? 'Your chosen starting point'
          : `You are here. Location accuracy about ${Math.round(viewer.accuracy ?? 0)} meters.`
      }
      title={
        viewer.source === 'manual' ? 'Chosen starting point' : 'You are here'
      }
    >
      {viewer.avatar && !failed ? (
        <img
          src={viewer.avatar}
          alt={viewer.name}
          className="size-full rounded-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound className="size-5 text-blue-700" />
      )}
      <span className="absolute -bottom-2 rounded-full bg-blue-700 px-2 text-[10px] text-white">
        {viewer.source === 'manual' ? 'Start' : 'You'}
      </span>
    </Button>
  )
}
