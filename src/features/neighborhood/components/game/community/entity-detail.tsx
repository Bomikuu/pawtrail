import { AnimalDetailDrawer } from './animal-detail-drawer'
import { DetailDrawer } from './detail-drawer'
import { AnimalActions } from './animal-actions'
import { SightingPhotos } from './sighting-photos'
import { useEffect, useId, useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  ExternalLink,
  MapPin,
  PawPrint,
  Users,
  TriangleAlert,
  CalendarDays,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { placeEntry, type CommunityPlace } from '@/features/neighborhood/game/community'
import { composition, distanceLabel } from '@/features/neighborhood/game/discovery/geo'
import { memberEntity } from '@/features/neighborhood/game/discovery/members'
import { entityAttention } from '@/features/neighborhood/game/discovery/attention'
import {
  sampleMissionsFor,
  sampleMissionHref,
} from '@/features/neighborhood/game/discovery/sample-missions'
import {
  AnimalCharacteristics,
  KindBadge,
  SampleBadge,
  IconBadge,
  type AnimalReportKind,
} from './discovery-badges'
import {
  ENTITY_LABELS,
  type EntityKind,
  type MapEntity,
  type Proximity,
  type PublicRecords,
} from '@/features/neighborhood/game/discovery/types'
import type { PlatformBridge, PlatformAnimalDetail } from '@/features/neighborhood/game/platform'
import { AnimalFace, EntityFace, entityIcons } from './markers'
import { discoveryPlaceholder } from '@/features/neighborhood/game/discovery/placeholders'
import type { ReportMode } from './report-dialog'

export function EvidenceSummary({ entity }: { entity: MapEntity }) {
  const contribution = entity.contribution,
    welfare = entity.welfare
  return (
    <section
      className="space-y-3 border-y py-3"
      aria-label="Contributions and welfare are separate"
    >
      <div>
        <h3 className="text-xs font-bold text-foreground">
          Documented contributions
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={
              contribution?.verifiedCount
                ? 'border-green-700/30 text-green-800 dark:text-green-300'
                : ''
            }
          >
            {contribution?.level === 'established'
              ? 'Established contributor'
              : contribution?.level === 'growing'
                ? 'Growing contribution record'
                : 'Unrated'}
          </Badge>
          {contribution && (
            <span className="text-xs text-muted-foreground">
              {contribution.verifiedCount} verified records
            </span>
          )}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
          {contribution?.explanation ??
            'Public verified contribution information is not available for this view.'}
        </p>
      </div>
      <div>
        <h3 className="text-xs font-bold text-foreground">
          Animal welfare reports
        </h3>
        {welfare ? (
          <>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {welfare.openConfirmed > 0 && (
                <Badge
                  variant="outline"
                  className="border-red-700/30 text-red-800 dark:text-red-300"
                >
                  {welfare.openConfirmed} unresolved corroborated concerns
                </Badge>
              )}
              {welfare.underReview > 0 && (
                <Badge
                  variant="outline"
                  className="border-amber-700/30 text-amber-900 dark:text-amber-200"
                >
                  {welfare.underReview} published reports under review
                </Badge>
              )}
              {welfare.resolved > 0 && (
                <span className="text-xs text-muted-foreground">
                  {welfare.resolved} resolved
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {welfare.explanation}
            </p>
          </>
        ) : (
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            No published report summary is available here. This does not
            establish that an area is free of incidents.
          </p>
        )}
      </div>
    </section>
  )
}
export function EntityDetail({
  entity,
  onClose,
  onReport,
  saved,
  onSave,
  platform,
  onChoose,
  exiting = false,
  onAnimalReport,
  onHelp,
  onDirections,
}: {
  entity: MapEntity
  onClose: () => void
  onReport: (mode: ReportMode) => void
  saved: boolean
  onSave: () => void
  platform?: PlatformBridge
  onChoose: (id: string) => void
  exiting?: boolean
  onAnimalReport: (entity: MapEntity, kind: AnimalReportKind) => void
  onHelp: (entity: MapEntity) => void
  onDirections: (entity: MapEntity) => void
}) {
  const [photoFailed, setPhotoFailed] = useState(false),
    [joining, setJoining] = useState(false),
    [detail, setDetail] = useState<PlatformAnimalDetail | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('')
  useEffect(() => {
    setPhotoFailed(false)
    setJoining(false)
    setError('')
    setDetail(null)
    const abort = new AbortController()
    if (entity.animal && platform && entity.profileHref)
      platform
        .get(entity.animal.id, abort.signal)
        .then((value) => {
          if (!abort.signal.aborted && value.id === entity.animal?.id)
            setDetail(value)
        })
        .catch(() => {})
    return () => abort.abort()
  }, [entity.id, platform])
  const attention = entityAttention(entity)
  const sampleMissions =
    entity.sample && entity.animal ? sampleMissionsFor(entity.animal.id) : []
  const full =
    entity.capacity !== undefined && (entity.occupancy ?? 0) >= entity.capacity
  const pets = entity.membership?.animals ?? []
  const base = window.location.pathname === '/' ? '/' : '/play'
  async function follow() {
    if (!detail || !platform || !entity.animal) return
    setBusy(true)
    try {
      await platform.follow(
        entity.animal.id,
        !detail.viewer.following,
        new AbortController().signal,
      )
      setDetail({
        ...detail,
        viewer: { ...detail.viewer, following: !detail.viewer.following },
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  const content = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {!entity.animal && (
          <div className="relative flex h-32 shrink-0 items-center justify-center overflow-hidden bg-secondary">
            {entity.photo && !photoFailed ? (
              <img
                src={entity.photo.url}
                alt={entity.photo.alt}
                className="size-full object-cover [image-rendering:auto]"
                onError={() => setPhotoFailed(true)}
              />
            ) : (
              <img
                src={discoveryPlaceholder(entity.kind)}
                alt=""
                className="size-28 object-contain"
              />
            )}
          </div>
        )}
        <div className="space-y-3 p-4">
          {(!entity.animal || entity.sample) && (
            <div className="flex flex-wrap gap-1.5">
              <KindBadge kind={entity.kind} />
              {entity.sample && <SampleBadge />}
              {entity.incident && (
                <Badge variant="outline">
                  {entity.incident.status === 'corroborated'
                    ? 'Corroborated'
                    : entity.incident.status === 'resolved'
                      ? 'Resolved'
                      : 'Under review · not a confirmed finding'}
                </Badge>
              )}
              {entity.help && (
                <Badge
                  variant="outline"
                  className={
                    entity.kind === 'urgent'
                      ? 'border-red-600 text-red-800 dark:text-red-300'
                      : ''
                  }
                >
                  {entity.help.priority} priority
                </Badge>
              )}
            </div>
          )}
          {entity.animal && (
            <section
              className="flex items-start gap-2.5 text-sm"
              aria-label="Published location"
            >
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="font-semibold text-foreground">{entity.area}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {entity.locationLabel}
                </p>
              </div>
            </section>
          )}
          {entity.animal?.associationName &&
            (entity.animal.associationId ? (
              <Button
                variant="outline"
                className="h-auto w-full justify-between gap-3 whitespace-normal rounded-md p-3 text-left text-foreground"
                onClick={() => onChoose(entity.animal!.associationId!)}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Shared at {entity.animal.associationName}
                  </span>
                  <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                    This marker shows membership, not an individual live
                    location.
                  </span>
                </span>
                <ArrowRight className="size-4 shrink-0" />
              </Button>
            ) : (
              <p className="text-xs leading-relaxed text-muted-foreground">
                Shared at {entity.animal.associationName}. This marker shows
                membership, not an individual live location.
              </p>
            ))}
          {attention && (
            <section
              className={
                'space-y-2 rounded-xl border p-3 ' +
                (attention.level === 'urgent'
                  ? 'border-red-400/40 bg-red-500/5'
                  : 'border-amber-500/40 bg-amber-500/5')
              }
              aria-label="Help or welfare status"
            >
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <TriangleAlert className="size-4" />
                {attention.label}
              </h3>
              <p className="text-xs leading-relaxed">{attention.detail}</p>
              {attention.sourceId !== entity.id && (
                <Button
                  className="text-foreground"
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onChoose(attention.sourceId)}
                >
                  {attention.sourceKind === 'incident'
                    ? 'Read published report'
                    : 'View help request'}
                  <ArrowRight className="size-3.5" />
                </Button>
              )}
            </section>
          )}
          {entity.animal ? (
            <>
              <SightingPhotos animalId={entity.animal.id} platform={platform} />
              <section
                className="space-y-2 border-t pt-4"
                aria-label={'About ' + entity.name}
              >
                <h3 className="font-heading text-lg font-bold text-foreground">
                  About {entity.name}
                </h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {detail?.description || entity.description}
                </p>
              </section>
            </>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {entity.description}
            </p>
          )}
          {entity.host && (
            <div className="flex items-center gap-2 text-xs">
              {entity.host.avatar && (
                <img
                  src={entity.host.avatar}
                  alt=""
                  className="size-7 rounded-full object-cover"
                />
              )}
              <span>
                Hosted by{' '}
                {entity.host.profileHref ? (
                  <a
                    href={entity.host.profileHref}
                    className="font-bold underline underline-offset-2"
                  >
                    {entity.host.name}
                  </a>
                ) : (
                  entity.host.name
                )}
              </span>
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {entity.occupancy !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {entity.occupancy}
                {entity.capacity !== undefined
                  ? ' / ' + entity.capacity
                  : ''}{' '}
                inside
              </span>
            )}
            {entity.adoptableCount !== undefined && (
              <span>{entity.adoptableCount} adoptable</span>
            )}
            {entity.missionCount !== undefined && (
              <span>{entity.missionCount} active missions</span>
            )}
            {entity.visibility && (
              <span>
                {entity.visibility === 'friends'
                  ? 'Friends only'
                  : entity.visibility === 'invite'
                    ? 'Invitation required'
                    : entity.visibility}
              </span>
            )}
          </div>
          {entity.animal && (
            <AnimalCharacteristics animal={entity.animal} detail={detail} />
          )}
          {(sampleMissions.length > 0 || !!detail?.missions.length) && (
            <section
              className="space-y-2 border-y py-3"
              aria-label="Related missions"
            >
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <ClipboardList className="size-4" />
                Related missions
              </h3>
              {sampleMissions.map((m) => (
                <Button
                  key={m.id}
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto w-full justify-between whitespace-normal rounded-md p-2 text-left text-foreground"
                >
                  <a href={sampleMissionHref(m.id)}>
                    <span>{m.title}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </Button>
              ))}
              {detail?.missions.map((m) => (
                <Button
                  key={m.id}
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-auto w-full justify-between whitespace-normal rounded-md p-2 text-left text-foreground"
                >
                  <a href={m.href}>
                    <span>{m.title}</span>
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                </Button>
              ))}
            </section>
          )}
          {entity.event && (
            <section
              className="space-y-3 border-y py-3"
              aria-label="Event details"
            >
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <CalendarDays className="size-4" />
                Event details
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <IconBadge
                  icon={CalendarDays}
                  label={new Date(entity.event.startsAt).toLocaleString()}
                />
                <IconBadge
                  icon={Users}
                  label={
                    entity.event.attending +
                    ' / ' +
                    entity.event.capacity +
                    ' attending'
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {entity.event.venue}
              </p>
              {!!entity.event.attendees?.length && (
                <div className="flex items-center gap-2">
                  {entity.event.attendees.map((a) => (
                    <AnimalFace
                      key={a.id}
                      animal={{
                        id: a.id,
                        name: a.name,
                        species: 'person',
                        photo: a.avatar ? { url: a.avatar, alt: a.name } : null,
                      }}
                      className="size-8"
                    />
                  ))}
                  <span className="text-[11px] text-muted-foreground">
                    Public attendees
                  </span>
                </div>
              )}
              {entity.sample && (
                <p className="text-[11px] text-muted-foreground">
                  Illustrative event; no real gathering is scheduled.
                </p>
              )}
            </section>
          )}
          {entity.membership && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-foreground">
                Shared animals ({pets.length})
              </h3>
              {pets.length ? (
                <div className="grid grid-cols-2 gap-2">
                  {pets.map((a) => (
                    <Button
                      key={a.id}
                      variant="ghost"
                      className="h-auto min-w-0 justify-start gap-2 rounded-md bg-secondary/40 p-2 text-left text-foreground"
                      onClick={() => onChoose(memberEntity(entity, a).id)}
                    >
                      <AnimalFace animal={a} className="size-9 shrink-0" />
                      <span className="min-w-0 text-xs">
                        <span className="block truncate font-bold">
                          {a.name}
                        </span>
                        <span className="text-muted-foreground">
                          {a.species}
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  Animal profiles have not been publicly shared for this place.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Membership stays the same as you zoom. Nearby sightings do not
                imply ownership.
              </p>
            </section>
          )}
          {['home', 'shelter', 'hub', 'horde'].includes(entity.kind) && (
            <EvidenceSummary entity={entity} />
          )}
          {!!entity.animal?.traits?.length && (
            <div className="flex flex-wrap gap-1.5">
              {entity.animal.traits.map((trait) => (
                <IconBadge key={trait} icon={Sparkles} label={trait} />
              ))}
            </div>
          )}
          {entity.incident && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Observed {new Date(entity.incident.occurredAt).toLocaleString()}.
              Severity: {entity.incident.severity}. Only the approved public
              summary is shown; evidence and reporter details stay private.
            </p>
          )}
          {entity.help && (
            <p className="text-xs text-muted-foreground">
              Active until {new Date(entity.help.expiresAt).toLocaleString()}.
              Urgent assistance is separate from incident verification.
            </p>
          )}
          {!entity.animal && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {entity.locationLabel}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
      {!entity.animal && (
        <footer
          className="shrink-0 border-t bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          aria-label={'Actions for ' + entity.name}
        >
          <div className="grid grid-cols-2 gap-2">
            {entity.entry &&
              (full ? (
                <Button
                  className="h-auto min-h-11 whitespace-normal rounded-md"
                  disabled
                >
                  Room full
                </Button>
              ) : (
                <Button
                  asChild
                  className="h-auto min-h-11 whitespace-normal rounded-md leading-snug"
                >
                  <a
                    href={placeEntry(entity as CommunityPlace, base)}
                    onClick={() => setJoining(true)}
                  >
                    {joining ? (
                      <PawPrint className="size-4 animate-pulse" />
                    ) : (
                      <ArrowRight className="size-4" />
                    )}
                    {joining
                      ? 'Opening…'
                      : entity.kind === 'home'
                        ? 'Visit home'
                        : entity.kind === 'hub'
                          ? 'Join community'
                          : 'Visit shelter space'}
                  </a>
                </Button>
              ))}
            {entity.profileHref && (
              <Button
                className={
                  'h-auto min-h-11 whitespace-normal rounded-md leading-snug ' +
                  (!entity.entry && !entity.help && !entity.incident
                    ? 'col-span-2'
                    : '')
                }
                asChild
                variant={
                  entity.entry || entity.help || entity.incident
                    ? 'outline'
                    : 'default'
                }
              >
                <a href={entity.profileHref}>
                  {entity.kind === 'event'
                    ? 'Open event & RSVP'
                    : 'View profile'}
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
            {entity.help &&
              (entity.help.href ? (
                <Button
                  asChild
                  className="h-auto min-h-11 whitespace-normal rounded-md leading-snug"
                >
                  <a href={entity.help.href}>
                    Offer help
                    <ArrowRight className="size-4" />
                  </a>
                </Button>
              ) : (
                <Button
                  className="h-auto min-h-11 whitespace-normal rounded-md leading-snug"
                  onClick={() => onReport('offer')}
                >
                  Offer help
                </Button>
              ))}
            {entity.incident && (
              <>
                <Button
                  className="h-auto min-h-11 whitespace-normal rounded-md leading-snug"
                  onClick={() => onReport('information')}
                >
                  Add information
                </Button>
                <Button
                  className="h-auto min-h-11 whitespace-normal rounded-md text-foreground leading-snug"
                  variant="outline"
                  onClick={() => onReport('appeal')}
                >
                  Report incorrect information
                </Button>
              </>
            )}
            <Button
              className="col-span-2 h-10 rounded-md text-foreground"
              variant="ghost"
              size="sm"
              onClick={onSave}
            >
              <Bookmark className={'size-4 ' + (saved ? 'fill-current' : '')} />
              {saved ? 'Saved on device' : 'Save on device'}
            </Button>
          </div>
        </footer>
      )}
      {entity.animal && (
        <AnimalActions
          entity={entity}
          saved={saved}
          following={
            detail?.viewer.authenticated ? detail.viewer.following : undefined
          }
          busy={busy}
          loginHref={
            detail && !detail.viewer.authenticated && platform
              ? platform.loginHref('/play?map=community')
              : undefined
          }
          onDirections={() => onDirections(entity)}
          onHelp={() => onHelp(entity)}
          onAnimalReport={onAnimalReport}
          onRequestHelp={() => onReport('help')}
          onFollow={() => void follow()}
          onSave={onSave}
        />
      )}
    </>
  )
  if (entity.animal)
    return (
      <AnimalDetailDrawer
        entity={entity}
        detail={detail}
        open={!exiting}
        onClose={onClose}
      >
        {content}
      </AnimalDetailDrawer>
    )
  return (
    <DetailDrawer
      title={entity.name}
      summary={entity.area}
      description={entity.locationLabel}
      portrait={<EntityFace entity={entity} className="size-14 border border-border" />}
      open={!exiting}
      onClose={onClose}
    >
      {content}
    </DetailDrawer>
  )
}

export function nearbyTitle(proximity: Proximity) {
  return proximity.label === 'Nearby you'
    ? 'Nearby you'
    : proximity.label === 'Selected map location'
      ? 'Around this spot'
      : 'Near ' + proximity.label
}
export function NearbySummary({
  proximity,
  entities,
  area,
  nearOnly,
  onNearOnly,
  onRadius,
  onFilter,
  onAnimals,
  framed = true,
  showHeading = true,
}: {
  proximity: Proximity
  entities: MapEntity[]
  area?: PublicRecords['areaSummary']
  nearOnly: boolean
  onNearOnly: (value: boolean) => void
  onRadius: (value: number) => void
  onFilter: (kind: EntityKind) => void
  onAnimals: () => void
  framed?: boolean
  showHeading?: boolean
}) {
  const result = composition(entities)
  const nearbyToggleId = useId()
  const [custom, setCustom] = useState(String(proximity.radius))
  useEffect(() => setCustom(String(proximity.radius)), [proximity.radius])
  return (
    <section
      className={
        'space-y-3 ' + (framed ? 'rounded-xl border bg-card p-3' : 'p-4')
      }
      aria-label="Proximity area summary"
    >
      {showHeading && (
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {nearbyTitle(proximity)} · {distanceLabel(proximity.radius)}
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Distance from this center, independent of map zoom. Approximate
            published locations are used.
          </p>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {[100, 250, 500, 1000].map((r) => (
          <Button
            key={r}
            size="sm"
            variant={proximity.radius === r ? 'secondary' : 'ghost'}
            className="h-7 px-2 text-xs"
            aria-pressed={proximity.radius === r}
            onClick={() => onRadius(r)}
          >
            {r === 1000 ? '1 km' : r + ' m'}
          </Button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs">
        Custom meters
        <Input
          type="number"
          min="100"
          max="5000"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onBlur={() => {
            const n = Number(custom)
            if (Number.isFinite(n) && n >= 100 && n <= 5000) onRadius(n)
            else setCustom(String(proximity.radius))
          }}
          className="h-8 w-24"
        />
      </label>
      <div className="grid grid-cols-2 gap-1">
        {(
          [
            'home',
            'shelter',
            'horde',
            'help',
            'urgent',
            'incident',
            'event',
          ] as EntityKind[]
        ).map((kind) => (
          <Button
            key={kind}
            variant="ghost"
            size="sm"
            className="h-auto justify-between gap-2 px-2 py-1.5 text-xs text-foreground"
            onClick={() => onFilter(kind)}
          >
            <span className="flex items-center gap-1.5">
              {(() => {
                const Icon = entityIcons[kind]
                return <Icon className="size-3.5" />
              })()}
              {ENTITY_LABELS[kind]}
            </span>
            <span className="font-bold tabular-nums">{result.kinds[kind]}</span>
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="col-span-2 h-8 justify-between px-2 text-xs text-foreground"
          onClick={onAnimals}
        >
          <span>Distinct shared animals</span>
          <span className="font-bold tabular-nums">{result.animals}</span>
        </Button>
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        An animal shared by a home, shelter or Horde is counted once.
      </p>
      <div className="border-t pt-2 text-xs leading-relaxed">
        <p>
          {area
            ? area.verifiedContributionCount + ' documented contributions'
            : result.documentedPlaces + ' places with documented contributions'}
        </p>
        <p className="mt-1">
          {area ? area.openConfirmed : result.openConfirmed} corroborated open
          reports · {area ? area.underReview : result.underReview} published
          reports under review
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Published PawTrail records only. Activity does not cancel an
          unresolved concern.
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={nearbyToggleId} className="text-xs">
          Only show this proximity area
        </label>
        <Switch
          id={nearbyToggleId}
          checked={nearOnly}
          onCheckedChange={onNearOnly}
        />
      </div>
    </section>
  )
}
