import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  ArrowUpRight,
  Check,
  Clock,
  HandHelping,
  LoaderCircle,
  MapPin,
  PawPrint,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { HelpPrompt } from '@/game/discovery/attention'
import { entityAttention } from '@/game/discovery/attention'
import { membershipEntities } from '@/game/discovery/members'
import { animalPlaceholder } from '@/game/animal-placeholder'
import { discoveryPlaceholder } from '@/game/discovery/placeholders'
import { mapRequest } from '@/game/housing/client'
import type { MapEntity } from '@/game/discovery/types'
import type {
  PlatformAnimalDetail,
  PlatformBridge,
  PlatformMissionDetail,
} from '@/game/platform'
import type { ReportMode } from './report-dialog'
import {
  AnimalCharacteristics,
  AnimalReportActions,
  SampleBadge,
  type AnimalReportKind,
} from './discovery-badges'
import {
  sampleMissionsFor,
  sampleMissionHref,
} from '@/game/discovery/sample-missions'
import { SampleMissionOffer } from './sample-mission-offer'
import { memberEntity } from '@/game/discovery/members'

type MissionLink = {
  id: string
  title: string
  href: string
  sampleLocal?: boolean
}
export function AnimalHelpDialog({
  prompt,
  entities,
  platform,
  authenticated,
  loginHref,
  onClose,
  onViewMap,
  onReport,
  onOffered,
  onAnimalReport,
}: {
  prompt: HelpPrompt
  entities: MapEntity[]
  platform?: PlatformBridge
  authenticated: boolean
  loginHref: string
  onClose: () => void
  onViewMap: (id: string) => void
  onReport: (entity: MapEntity, mode: ReportMode) => void
  onOffered: () => void
  onAnimalReport: (entity: MapEntity, kind: AnimalReportKind) => void
}) {
  const found = useMemo(
    () =>
      [...entities, ...membershipEntities(entities)].find(
        (e) => e.id === prompt.entity.id,
      ),
    [entities, prompt.entity.id],
  )
  const current = found ?? prompt.entity
  const alertAvailable =
    !!prompt.contextOnly || (!!found && !!entityAttention(found))
  const attention = entityAttention(current) ?? prompt.attention
  const source = entities.find((e) => e.id === attention.sourceId) ?? current
  const animal =
    current.animal ??
    (source.membership?.animals.length === 1
      ? source.membership.animals[0]
      : null)
  const demoMissions = useMemo(
    () => (current.sample && animal ? sampleMissionsFor(animal.id) : []),
    [current.sample, animal?.id],
  )
  const sampleMission = demoMissions[0] ?? null
  const reportEntity = current.animal
    ? current
    : animal
      ? memberEntity(current, animal)
      : null
  const knownMission: MissionLink | null = source.help?.href?.startsWith(
    '/missions/',
  )
    ? { id: source.help.id, title: source.name, href: source.help.href }
    : null
  const localRequest =
    source.help && !source.help.href && /^[0-9a-f-]{36}$/i.test(source.help.id)
      ? source
      : null
  const [detail, setDetail] = useState<PlatformAnimalDetail | null>(null)
  const [mission, setMission] = useState<PlatformMissionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [photoFailed, setPhotoFailed] = useState(false)
  const [fallbackFailed, setFallbackFailed] = useState(false)
  const [offering, setOffering] = useState(false)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const action = useRef<AbortController | null>(null)
  useEffect(() => () => action.current?.abort(), [])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setLoadError('')
    setDetail(null)
    setMission(null)
    async function load() {
      let animalDetail: PlatformAnimalDetail | null = null
      const errors: string[] = []
      if (animal?.profileHref && platform) {
        try {
          animalDetail = await platform.get(animal.id, abort.signal)
          if (!abort.signal.aborted) setDetail(animalDetail)
        } catch {
          errors.push(
            'The latest animal details could not load. The published map summary is shown.',
          )
        }
      }
      const link = knownMission ?? animalDetail?.missions[0]
      if (link && platform?.getMission) {
        try {
          const result = await platform.getMission(
            link.id,
            link.href,
            abort.signal,
          )
          if (!abort.signal.aborted) setMission(result)
        } catch {
          errors.push(
            'The mission details could not load. You can still open its page.',
          )
        }
      }
      if (!abort.signal.aborted) {
        setLoadError(errors.join(' '))
        setLoading(false)
      }
    }
    void load()
    return () => abort.abort()
  }, [
    animal?.id,
    animal?.profileHref,
    knownMission?.id,
    knownMission?.href,
    platform,
    retry,
  ])
  const linkedMissions = useMemo(() => {
    const links = new Map<string, MissionLink>()
    if (knownMission) links.set(knownMission.id, knownMission)
    for (const m of detail?.missions ?? []) links.set(m.id, m)
    for (const m of demoMissions)
      links.set(m.id, {
        id: m.id,
        title: m.title,
        href: sampleMissionHref(m.id),
        sampleLocal: true,
      })
    return [...links.values()]
  }, [
    knownMission?.id,
    knownMission?.href,
    knownMission?.title,
    detail,
    demoMissions,
  ])
  const primary =
    knownMission ?? linkedMissions.find((m) => !m.sampleLocal) ?? null
  const practice =
    !!(current.demo || attention.sourceKind === 'sample') &&
    !localRequest &&
    !primary
  const requestActive =
    alertAvailable &&
    !!localRequest?.help &&
    ['open', 'active'].includes(localRequest.help.status) &&
    Date.parse(localRequest.help.expiresAt) > Date.now()
  const realOffer = !!localRequest || !!primary
  const rawPhoto = animal
    ? (animal.photo ?? detail?.photo ?? null)
    : (source.photo ?? null)
  const fallback = animal
    ? animalPlaceholder(
        animal?.species ?? '',
        detail?.appearance ??
          animal?.coat ??
          animal?.characteristics?.join(' ') ??
          '',
      )
    : discoveryPlaceholder(source.kind)
  const image =
    rawPhoto && !photoFailed ? rawPhoto.url : !fallbackFailed ? fallback : null
  const animalName = animal?.name ?? prompt.animalName
  async function sendOffer(event?: FormEvent) {
    event?.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    setSuccess('')
    const abort = new AbortController()
    action.current = abort
    try {
      if (practice) {
        setSuccess(
          'Sample offer saved for this preview. Nothing was sent, no real request was created, and no Kibble was awarded.',
        )
        setOffering(false)
        return
      }
      if (!authenticated) throw new Error('Sign in to offer help.')
      if (localRequest?.help) {
        if (!requestActive)
          throw new Error('This help request is no longer active.')
        const result = await mapRequest<{ notice: string }>(
          'help-requests/' + localRequest.help.id + '/offers/',
          { description },
          abort.signal,
        )
        setSuccess(result.notice)
      } else if (primary && platform?.offerMission) {
        const result = await platform.offerMission(
          primary.id,
          primary.href,
          abort.signal,
        )
        setSuccess(
          result.state === 'accepted'
            ? 'You’re listed as a volunteer for this mission. Open it to coordinate the next steps.'
            : `Your mission participation is ${result.state.replaceAll('_', ' ')}. Open the mission for its current details.`,
        )
      } else
        throw new Error(
          'No active help request or mission is linked to this animal.',
        )
      setOffering(false)
      onOffered()
    } catch (e) {
      if (!abort.signal.aborted) setError((e as Error).message)
    } finally {
      if (!abort.signal.aborted) setBusy(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className="pawtrail-game max-h-[92dvh] overflow-y-auto rounded-lg bg-card text-foreground sm:max-w-3xl"
      >
        <DialogHeader className="pr-6">
          <DialogTitle className="text-xl font-extrabold text-foreground">
            {animalName
              ? 'Help ' + animalName
              : 'Help with this nearby concern'}
          </DialogTitle>
          <DialogDescription>
            Review the animal and what is needed, then choose how you can help.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={
              attention.level === 'urgent'
                ? 'border-red-400 text-red-800'
                : 'border-amber-400 text-amber-900'
            }
          >
            <TriangleAlert className="size-3" />
            {alertAvailable ? attention.label : 'Previous map alert'}
          </Badge>
          {current.sample && <SampleBadge />}
        </div>
        {!alertAvailable && (
          <p
            role="status"
            className="rounded-md border p-3 text-xs leading-relaxed text-muted-foreground"
          >
            This alert is no longer in the current map snapshot. The previous
            details are shown for context; open the linked profile or mission
            for its latest status.
          </p>
        )}
        <div className="grid min-w-0 gap-6 md:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <div className="min-w-0 space-y-3">
            <div className="grid h-60 place-items-center overflow-hidden rounded-md border bg-secondary/40">
              {image ? (
                <img
                  src={image}
                  alt={animalName ?? current.name}
                  className="size-full object-contain p-3"
                  onError={() => {
                    if (rawPhoto && !photoFailed) setPhotoFailed(true)
                    else setFallbackFailed(true)
                  }}
                />
              ) : (
                <PawPrint className="size-16 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-foreground">
                {animalName ?? current.name}
              </h3>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {detail?.neighborhood ?? current.area}
              </p>
            </div>
            {reportEntity && (
              <AnimalReportActions
                entity={reportEntity}
                onReport={onAnimalReport}
              />
            )}
            {animal && (
              <AnimalCharacteristics animal={animal} detail={detail} />
            )}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {detail?.description ?? current.description}
            </p>
            {animal?.profileHref && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="rounded-md text-foreground"
              >
                <a href={animal.profileHref}>
                  Open animal profile
                  <ArrowUpRight className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <section className="space-y-2">
              <h3 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                <HandHelping className="size-4" />
                What help is needed?
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {mission?.description ??
                  sampleMission?.description ??
                  (localRequest ? localRequest.description : attention.detail)}
              </p>
              {detail?.needs.length ? (
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed">
                  {detail.needs.map((need, i) => (
                    <li key={i}>{need}</li>
                  ))}
                </ul>
              ) : null}
              {(mission ?? sampleMission)?.requirements.length ? (
                <div className="space-y-1.5 border-t pt-3">
                  <p className="text-xs font-semibold">Mission requirements</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed">
                    {(mission ?? sampleMission)!.requirements.map(
                      (requirement, i) => (
                        <li key={i}>{requirement}</li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}
              {(mission?.deadline || localRequest?.help?.expiresAt) && (
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Clock className="mt-0.5 size-3.5 shrink-0" />
                  {mission ? 'Mission deadline' : 'Request active until'}{' '}
                  {new Date(
                    mission?.deadline ?? localRequest!.help!.expiresAt,
                  ).toLocaleString()}
                </p>
              )}
            </section>
            {loading && (
              <p
                role="status"
                className="flex items-center gap-2 text-xs text-muted-foreground"
              >
                <LoaderCircle className="size-3.5 motion-safe:animate-spin" />
                Loading the latest public details…
              </p>
            )}
            {loadError && (
              <div className="space-y-1 rounded-md border p-2 text-xs text-muted-foreground">
                <p>{loadError}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 rounded-md px-0 text-foreground"
                  disabled={loading}
                  onClick={() => setRetry((n) => n + 1)}
                >
                  Reload details
                </Button>
              </div>
            )}
            <section className="space-y-2 border-t pt-3">
              <h3 className="text-sm font-bold text-foreground">
                Related mission
              </h3>
              {linkedMissions.length ? (
                <div className="space-y-2">
                  {linkedMissions.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between gap-2 rounded-md border p-2"
                    >
                      <p className="text-xs font-semibold">{m.title}</p>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="shrink-0 rounded-md text-foreground"
                      >
                        <a href={m.href}>
                          Open mission
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
                  No mission is linked to this {practice ? 'sample' : 'record'}{' '}
                  yet.{' '}
                  {practice
                    ? 'Practice offering help below.'
                    : 'Use the available request or animal actions below.'}
                </p>
              )}
            </section>
            {sampleMission ? (
              <SampleMissionOffer mission={sampleMission} />
            ) : success ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-green-700/25 bg-green-600/5 p-3 text-sm leading-relaxed"
              >
                <Check className="mt-0.5 size-4 shrink-0 text-green-800" />
                <p>{success}</p>
              </div>
            ) : offering ? (
              <form
                onSubmit={(event) => void sendOffer(event)}
                className="space-y-3 rounded-md border p-3"
              >
                <label className="block space-y-2 text-sm font-semibold">
                  {practice ? 'Try a sample offer' : 'How can you help?'}
                  <Textarea
                    autoFocus
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    minLength={10}
                    maxLength={1000}
                    placeholder="Describe what you can offer and when you are available."
                    className="min-h-24 rounded-md font-normal"
                  />
                </label>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {practice
                    ? 'This practice offer stays in this dialog and sends nothing.'
                    : 'Your offer is shared privately with the request organizer.'}
                </p>
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy} className="rounded-md">
                    {busy && (
                      <LoaderCircle className="size-4 motion-safe:animate-spin" />
                    )}
                    {busy
                      ? 'Sending…'
                      : practice
                        ? 'Save sample offer'
                        : 'Send offer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    className="rounded-md text-foreground"
                    onClick={() => setOffering(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {practice ? (
                  <Button
                    type="button"
                    className="w-full rounded-md"
                    onClick={() => setOffering(true)}
                  >
                    <HandHelping className="size-4" />
                    Try offering help
                  </Button>
                ) : realOffer && !authenticated ? (
                  <Button asChild className="w-full rounded-md">
                    <a href={loginHref}>
                      Sign in to offer help
                      <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                ) : localRequest ? (
                  <>
                    <Button
                      type="button"
                      className="w-full rounded-md"
                      disabled={!requestActive || busy}
                      onClick={() => setOffering(true)}
                    >
                      <HandHelping className="size-4" />
                      {requestActive ? 'Offer help' : 'Request unavailable'}
                    </Button>
                  </>
                ) : primary && platform?.offerMission ? (
                  <Button
                    type="button"
                    className="w-full rounded-md"
                    disabled={busy || mission?.state === 'closed'}
                    onClick={() => void sendOffer()}
                  >
                    {busy ? (
                      <LoaderCircle className="size-4 motion-safe:animate-spin" />
                    ) : (
                      <HandHelping className="size-4" />
                    )}
                    {busy
                      ? 'Joining mission…'
                      : mission?.state === 'closed'
                        ? 'Mission closed'
                        : 'Offer help with this mission'}
                  </Button>
                ) : source.incident ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-md text-foreground"
                    onClick={() => onReport(source, 'information')}
                  >
                    Add information for the reviewer
                  </Button>
                ) : animal?.status === 'missing' ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full rounded-md text-foreground"
                  >
                    <a
                      href={
                        '/sightings/create?animalId=' +
                        encodeURIComponent(animal.id)
                      }
                    >
                      Report a sighting
                      <ArrowUpRight className="size-4" />
                    </a>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-md text-foreground"
                    onClick={() => onReport(current, 'help')}
                  >
                    {animal
                      ? 'Request help for this animal'
                      : 'Request help for this place'}
                  </Button>
                )}
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-md text-foreground"
            disabled={busy}
            onClick={() => onViewMap(current.id)}
          >
            <MapPin className="size-4" />
            View on map
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-md text-foreground"
            disabled={busy}
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
