import { useCommunityStatistics } from './use-community-statistics'
import { provinceSummaries } from '@/features/neighborhood/game/discovery/region-stats'
import { useDirections } from './use-directions'
import { DirectionsPanel } from './directions-panel'
import { useEffect, useMemo, useState } from 'react'
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  LocateFixed,
  MapPin,
  PawPrint,
  RotateCw,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  HandHelping,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { animalAttentionQuests } from '@/features/neighborhood/game/discovery/quests'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { composition, distanceLabel, metersBetween } from '@/features/neighborhood/game/discovery/geo'
import {
  ENTITY_KINDS,
  ENTITY_LABELS,
  type EntityKind,
  type MapEntity,
} from '@/features/neighborhood/game/discovery/types'
import type { PlatformBridge } from '@/features/neighborhood/game/platform'
import { CommunityMapCanvas } from './map-canvas'
import { EntityDetail } from './entity-detail'
import { DiscoverySidebarHeader } from './discovery-header'
import { FloatingMapActions } from './map-actions'
import { NearbyPopup } from './nearby-popup'
import { useRetainedPanel } from './panel-motion'
import { MapQuestTracker } from './quest-tracker'
import { CommunityPicker } from './community-picker'
import { CommunityDrawer } from './community-drawer'
import { useCommunityAreas } from './use-community-areas'
import type { CommunityArea } from '@/features/neighborhood/game/discovery/communities'
import { AnimalHelpDialog } from './animal-help-dialog'
import { SampleReportDialog } from './sample-report-dialog'
import { DiscoveryFilter, type AnimalReportKind } from './discovery-badges'
import type { HelpPrompt } from '@/features/neighborhood/game/discovery/attention'
import { entityAttention, nearbyHelpPrompts } from '@/features/neighborhood/game/discovery/attention'
import { ReportDialog, type ReportMode } from './report-dialog'
import { EntityFace, entityIcons } from './markers'
import { useDiscovery } from './use-discovery'

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-xs">
        {label}
      </label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
function PlaceRow({
  entity,
  selected,
  saved,
  distance,
  onSelect,
  onPreview,
}: {
  entity: MapEntity
  selected: boolean
  saved: boolean
  distance?: number
  onSelect: () => void
  onPreview: (entity: MapEntity | null) => void
}) {
  const animals =
    entity.membership?.animals ?? (entity.animal ? [entity.animal] : [])
  const attention = entityAttention(entity)
  const urgent = attention?.level === 'urgent',
    concern = attention?.level === 'concern'
  const AttentionIcon = urgent || concern ? TriangleAlert : HandHelping
  const urgentMembers = (entity.membership?.animals ?? [])
    .filter((a) => a.attention?.level === 'urgent')
    .map((a) => a.name)
  return (
    <Button
      id={'place-' + entity.id}
      variant="outline"
      className={
        'h-auto w-full justify-start gap-3 whitespace-normal rounded-md p-3 text-left transition-colors duration-150 ' +
        (urgent
          ? 'border-red-500/60 bg-red-50 text-red-950 hover:bg-red-100 hover:text-red-950 aria-pressed:border-red-700 aria-pressed:bg-red-100 dark:border-red-500/60 dark:bg-red-950/35 dark:text-red-100 dark:hover:bg-red-950/50 dark:hover:text-red-100 dark:aria-pressed:border-red-400 dark:aria-pressed:bg-red-950/60'
          : concern
            ? 'border-amber-500/50 bg-amber-50/70 text-amber-950 hover:bg-amber-100 hover:text-amber-950 aria-pressed:border-amber-700 aria-pressed:bg-amber-100 dark:border-amber-500/50 dark:bg-amber-950/30 dark:text-amber-100 dark:hover:bg-amber-950/50 dark:hover:text-amber-100 dark:aria-pressed:border-amber-400 dark:aria-pressed:bg-amber-950/60'
            : 'text-foreground aria-pressed:border-primary aria-pressed:bg-primary/5')
      }
      aria-pressed={selected}
      onClick={onSelect}
      onMouseEnter={() => onPreview(entity)}
      onMouseLeave={() => onPreview(null)}
      onFocus={() => onPreview(entity)}
      onBlur={() => onPreview(null)}
    >
      <span
        className={
          'relative flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary ' +
          (urgent
            ? 'ring-2 ring-red-600/50 ring-offset-2 ring-offset-red-50 dark:ring-offset-red-950'
            : concern
              ? 'ring-2 ring-amber-600/35 ring-offset-2 ring-offset-amber-50 dark:ring-offset-amber-950'
              : '')
        }
      >
        <EntityFace entity={entity} className="size-12" />
        {animals.length > 0 && (
          <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border bg-card text-[10px] font-bold tabular-nums">
            {animals.length}
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-heading text-lg font-bold leading-tight">
            {entity.name}
          </span>
          {saved && (
            <Bookmark
              aria-label="Saved on this device"
              className="size-3.5 shrink-0 fill-current text-primary"
            />
          )}
        </span>
        <span className="mt-1 block text-xs font-normal text-muted-foreground">
          {entity.area}
        </span>
        <span className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[10px] font-normal text-muted-foreground">
          <span>{ENTITY_LABELS[entity.kind]}</span>
          {entity.sample && <span>Sample</span>}
          {distance !== undefined && (
            <span>{distanceLabel(distance)} away</span>
          )}
          {entity.occupancy !== undefined && (
            <span>{entity.occupancy} inside</span>
          )}
        </span>
        {attention && (
          <span className="mt-1.5 block">
            <Badge
              variant="outline"
              className={
                'gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ' +
                (urgent
                  ? 'border-red-600/40 bg-red-100 text-red-900 dark:bg-red-950/60 dark:text-red-100'
                  : concern
                    ? 'border-amber-600/35 bg-amber-100 text-amber-950 dark:bg-amber-950/60 dark:text-amber-100'
                    : 'border-border bg-card text-foreground')
              }
            >
              <AttentionIcon className="size-3 shrink-0" />
              {urgent ? 'Needs urgent help' : attention.label}
            </Badge>
            {!entity.animal && urgentMembers.length > 0 && (
              <span className="mt-1 block text-[11px] font-medium">
                Help needed for {urgentMembers.slice(0, 2).join(', ')}
              </span>
            )}
          </span>
        )}
        {(entity.contribution?.verifiedCount ?? 0) > 0 && (
          <span className="mt-1 block text-[11px] font-normal text-green-800 dark:text-green-300">
            {entity.contribution!.verifiedCount} verified contributions
          </span>
        )}
        {(entity.welfare?.openConfirmed ?? 0) > 0 && (
          <span className="mt-1 block text-[11px] font-semibold text-red-800 dark:text-red-300">
            {entity.welfare!.openConfirmed} unresolved corroborated concerns
          </span>
        )}
        {entity.incident && (
          <span className="mt-1 block text-[11px] font-normal text-amber-900 dark:text-amber-200">
            {entity.incident.status === 'corroborated'
              ? 'Corroborated report'
              : entity.incident.status === 'resolved'
                ? 'Resolved report'
                : 'Under review · not a confirmed finding'}
          </span>
        )}
      </span>
    </Button>
  )
}

function DiscoveryMap({ platform }: { platform?: PlatformBridge }) {
  const d = useDiscovery(platform)
  const directions = useDirections(
    () => d.locate(false),
    platform?.mapDestination,
  )
  const statistics = useCommunityStatistics(platform, d.dataRevision, d.account)
  const provinces = useMemo(() => provinceSummaries(statistics.provinces, statistics.cities, d.layers), [statistics.provinces, statistics.cities, d.layers])
  const summaryAllowed = !d.query.trim() && !d.hasPets && !d.visitOnly && d.contributionFilter === 'all' && !d.nearOnly && !d.inView && !d.cluster
  const [communityBorders, setCommunityBorders] = useState(true)
  const communityAreas = useCommunityAreas(
    d.bounds,
    communityBorders,
    d.dataRevision,
  )
  const [selectedCommunity, setSelectedCommunity] =
    useState<CommunityArea | null>(null)
  const [communityFocus, setCommunityFocus] = useState(0)
  const communityPanel = useRetainedPanel(selectedCommunity, 240)
  const mapCommunityAreas = useMemo(() => {
    const data = communityAreas.data
    if (
      !communityBorders ||
      !selectedCommunity ||
      data.features.some((area) => area.id === selectedCommunity.id)
    )
      return data
    return {
      ...data,
      features: [selectedCommunity, ...data.features].slice(0, 180),
    }
  }, [communityAreas.data, communityBorders, selectedCommunity])
  const [filters, setFilters] = useState(false)
  const [resultsOpen, setResultsOpen] = useState(true)
  const [savedOnly, setSavedOnly] = useState(false)
  const [report, setReport] = useState<ReportMode | null>(null)
  const [reportTarget, setReportTarget] = useState<MapEntity | null>(null)
  const [sampleReport, setSampleReport] = useState<{
    entity: MapEntity
    kind: AnimalReportKind
  } | null>(null)
  function reportAnimal(entity: MapEntity, kind: AnimalReportKind) {
    setHelpDialog(null)
    if (entity.sample) {
      setSampleReport({ entity, kind })
      return
    }
    if (kind === 'sighting' && entity.animal) {
      window.location.assign(
        '/spot?animalId=' + encodeURIComponent(entity.animal.id),
      )
      return
    }
    setReportTarget(entity)
    setReport('incident')
  }
  function openReport(mode: ReportMode) {
    setSelectedCommunity(null)
    setReportTarget(d.selected)
    setReport(mode)
  }
  const [nearbyOpen, setNearbyOpen] = useState(false)
  const [dismissedHelp, setDismissedHelp] = useState<Set<string>>(
    () => new Set(),
  )
  const [helpQuiet, setHelpQuiet] = useState(false)
  const [helpDialog, setHelpDialog] = useState<HelpPrompt | null>(null)
  const helpPrompts = useMemo(
    () => nearbyHelpPrompts(d.matching, d.proximity, d.bounds, dismissedHelp),
    [d.matching, d.proximity, d.bounds, dismissedHelp],
  )
  const attentionQuests = useMemo(
    () => animalAttentionQuests(d.entities),
    [d.entities],
  )
  const currentHelp =
    !d.loading &&
    !d.selected &&
    !directions.state &&
    !nearbyOpen &&
    !report &&
    !helpDialog &&
    !sampleReport &&
    !d.picking &&
    !d.locating &&
    !helpQuiet
      ? (helpPrompts[0] ?? null)
      : null
  function acknowledgeHelp(key: string) {
    setDismissedHelp((old) => new Set([...old, key]))
  }
  const [notice, setNotice] = useState<{ message: string; id: number } | null>(
    null,
  )
  const routeTarget = directions.state?.destinationReady
    ? directions.state.target
    : null
  const routeAnimalId = routeTarget?.animal?.id
  // A member avatar is offset around its shared place. During directions, show
  // this animal only at the resolved destination, with its own labelled pin.
  const mapPlaces = useMemo(
    () =>
      routeAnimalId
        ? d.matching
            .filter((entity) => entity.animal?.id !== routeAnimalId)
            .map((entity) =>
              entity.membership?.animals.some(
                (animal) => animal.id === routeAnimalId,
              )
                ? {
                    ...entity,
                    membership: {
                      ...entity.membership,
                      animals: entity.membership.animals.filter(
                        (animal) => animal.id !== routeAnimalId,
                      ),
                    },
                  }
                : entity,
            )
        : d.matching,
    [d.matching, routeAnimalId],
  )
  const detail = useRetainedPanel(d.selected, 240)
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 3500)
    return () => clearTimeout(timer)
  }, [notice])
  function announce(message: string) {
    setNotice({ message, id: Date.now() })
  }
  const base = window.location.pathname === '/' ? '/' : '/play'
  const demo = new URLSearchParams(window.location.search).get('demo') === '1'
  useEffect(() => {
    document.body.dataset.pawtrailGame = 'true'
    return () => {
      delete document.body.dataset.pawtrailGame
    }
  }, [])
  const listed = savedOnly
    ? d.listed.filter((e) => d.saved.includes(e.id))
    : d.listed
  const clusterEntities = d.cluster
    ? d.entities.filter((e) => d.cluster!.includes(e.id))
    : []
  const group = composition(clusterEntities)
  function helpAnimal(entity: MapEntity) {
    setSelectedCommunity(null)
    const attention = entityAttention(entity) ?? {
      key: 'profile-help:' + entity.id,
      level: 'help' as const,
      label: 'Ways to help',
      detail:
        'Check the linked missions or request current help for this animal.',
      sourceId: entity.id,
      sourceKind: 'help' as const,
    }
    setHelpDialog({
      entity,
      attention,
      distance: null,
      animalName: entity.animal?.name,
      contextOnly: true,
    })
  }
  function changeResultsOpen(open: boolean) {
    d.previewEntity(null)
    if (
      !open &&
      document
        .getElementById('discovery-results')
        ?.contains(document.activeElement)
    )
      document
        .getElementById('map-results-toggle')
        ?.focus({ preventScroll: true })
    setResultsOpen(open)
  }
  function revealMap() {
    if (window.innerWidth < 1024) setResultsOpen(false)
  }
  function select(id: string) {
    setSelectedCommunity(null)
    directions.stop()
    d.choose(id)
    setNearbyOpen(false)
    revealMap()
  }
  function selectCommunity(id: string) {
    const area = communityAreas.data.features.find(
      (feature) => feature.id === id,
    )
    if (!area) return
    directions.stop()
    d.previewEntity(null)
    d.closeSelection()
    d.setPicking(false)
    d.setProximity(null)
    d.setNearOnly(false)
    setNearbyOpen(false)
    setHelpQuiet(true)
    setSelectedCommunity(area)
    setCommunityFocus((value) => value + 1)
    revealMap()
  }
  function goToAnimal(entity: MapEntity) {
    if (!entity.animal || entity.animal.id !== d.selected?.animal?.id) return
    d.previewEntity(null)
    d.closeSelection()
    d.setPicking(false)
    setNearbyOpen(false)
    revealMap()
    setHelpQuiet(true)
    void directions.start(entity)
  }
  function filterKind(kind: EntityKind) {
    d.setLayers([kind])
    d.setCluster(null)
    d.setInView(null)
  }
  function reset() {
    setSelectedCommunity(null)
    directions.stop()
    d.clear()
    setSavedOnly(false)
    setNearbyOpen(false)
    announce('Discovery filters cleared')
  }
  const nearbyCount = composition(d.nearby).animals
  const loginHref =
    platform?.loginHref('/play?map=community') ??
    '/login?returnTo=%2Fplay%3Fmap%3Dcommunity'
  async function locate() {
    setSelectedCommunity(null)
    directions.stop()
    setHelpQuiet(false)
    setNearbyOpen(false)
    revealMap()
    d.closeSelection()
    if (await d.locate()) {
      setNearbyOpen(true)
      announce('Nearby animals and places updated for your current location')
    }
  }
  function pickCenter() {
    setSelectedCommunity(null)
    directions.stop()
    setNearbyOpen(false)
    d.closeSelection()
    revealMap()
    d.setPicking(!d.picking)
  }
  function chooseCenter(
    point: Parameters<typeof d.choosePoint>[0],
    label = 'Selected map location',
  ) {
    d.choosePoint(point, label)
    setHelpQuiet(false)
    setNearbyOpen(true)
    announce('Nearby area updated to your chosen map location')
  }
  function showSaved() {
    setSelectedCommunity(null)
    directions.stop()
    d.clear()
    setSavedOnly(true)
    setNearbyOpen(false)
    setResultsOpen(true)
    announce('Showing saved places on this device')
  }
  function showNearby() {
    setSelectedCommunity(null)
    directions.stop()
    if (!d.proximity) return
    d.closeSelection()
    d.recenter(d.proximity.center)
    setNearbyOpen(true)
    revealMap()
  }
  return (
    <div className="pawtrail-game flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <main className="relative isolate min-h-0 flex-1 overflow-hidden [--map-overlay-left:0.75rem] lg:[--map-overlay-left:24rem]">
        <h1 className="sr-only">Community map</h1>
        <div className="pointer-events-none absolute left-3 right-3 top-3 z-30 lg:left-[var(--map-overlay-left)] lg:right-[26rem] xl:right-[28rem]">
          <nav
            aria-label="Map category filters"
            className="pointer-events-auto mx-auto w-fit max-w-full"
          >
            <div
              className="flex max-w-full gap-2 overflow-x-auto p-1"
              role="group"
              aria-label="Quick discovery filters"
            >
              <DiscoveryFilter
                icon={Layers}
                label="All"
                count={d.entities.length}
                active={d.layers.length === ENTITY_KINDS.length && !savedOnly}
                onClick={() => {
                  d.setLayers(ENTITY_KINDS)
                  d.setCluster(null)
                  setSavedOnly(false)
                }}
              />
              {(
                ['animal', 'home', 'shelter', 'help', 'event'] as EntityKind[]
              ).map((kind) => (
                <DiscoveryFilter
                  key={kind}
                  icon={entityIcons[kind]}
                  label={ENTITY_LABELS[kind]}
                  count={
                    kind === 'animal'
                      ? composition(d.entities).animals
                      : d.entities.filter((e) => e.kind === kind).length
                  }
                  active={
                    d.layers.length === 1 && d.layers[0] === kind && !savedOnly
                  }
                  onClick={() => {
                    filterKind(kind)
                    setSavedOnly(false)
                  }}
                />
              ))}
              <DiscoveryFilter
                icon={Bookmark}
                label="Saved"
                count={d.saved.length}
                active={savedOnly}
                onClick={() => setSavedOnly((v) => !v)}
              />
            </div>
          </nav>
        </div>
        <Collapsible
          asChild
          open={resultsOpen}
          onOpenChange={changeResultsOpen}
        >
          <aside
            id="discovery-sidebar"
            className="absolute left-3 top-20 z-30 flex max-h-[calc(100%-6rem)] w-[min(22rem,calc(100%-4.5rem))] min-h-0 flex-col overflow-hidden rounded-xl border bg-card shadow-lg lg:top-3 lg:max-h-[calc(100%-1.5rem)] lg:w-88"
            aria-label="Community discovery"
          >
            <DiscoverySidebarHeader
              account={d.account}
              base={base}
              demo={demo}
              onSaved={showSaved}
              onReports={() => setReport('mine')}
              loginHref={loginHref}
            />
            <div className="shrink-0 space-y-2.5 border-b p-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground"
                  />
                  <Input
                    aria-label="Search animals, places, hosts or areas"
                    value={d.query}
                    onChange={(e) => {
                      d.setQuery(e.target.value)
                      d.setCluster(null)
                      setResultsOpen(true)
                    }}
                    placeholder="Animals, neighbors, places…"
                    className="h-10 pl-9"
                  />
                </div>
                <Button
                  size="icon"
                  variant={filters ? 'secondary' : 'outline'}
                  aria-expanded={filters}
                  aria-controls="map-filters"
                  aria-label="Map filters and layers"
                  onClick={() => {
                    setFilters((v) => !v)
                    setResultsOpen(true)
                  }}
                >
                  <SlidersHorizontal className="size-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <p
                  role="status"
                  key={[
                    listed.length,
                    d.layers.join(),
                    d.nearOnly,
                    savedOnly,
                  ].join(':')}
                  className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-150"
                >
                  {d.loading
                    ? 'Loading your neighborhood…'
                    : `${listed.length} ${listed.length === 1 ? 'result' : 'results'}`}
                  {d.cluster
                    ? ' in this cluster'
                    : d.nearOnly
                      ? ' nearby'
                      : d.inView
                        ? ' in map area'
                        : ''}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-foreground"
                    aria-label="Refresh discovery"
                    disabled={d.loading}
                    onClick={d.retry}
                  >
                    <RotateCw
                      className={
                        'size-3.5 ' +
                        (d.loading ? 'motion-safe:animate-spin' : '')
                      }
                    />
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button
                      id="map-results-toggle"
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-foreground"
                      aria-label={
                        resultsOpen
                          ? 'Collapse results list'
                          : 'Expand results list'
                      }
                      aria-controls="discovery-results"
                    >
                      {resultsOpen ? (
                        <ChevronUp aria-hidden="true" className="size-4" />
                      ) : (
                        <ChevronDown aria-hidden="true" className="size-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>
            <CollapsibleContent
              id="discovery-results"
              className="min-h-0 flex-1 overflow-hidden data-[state=open]:flex data-[state=open]:flex-col motion-safe:data-[state=open]:animate-in motion-safe:data-[state=open]:fade-in-0 motion-safe:data-[state=open]:slide-in-from-top-2 motion-safe:data-[state=open]:duration-150"
            >
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                <CommunityPicker
                  areas={communityAreas.data}
                  selected={selectedCommunity}
                  enabled={communityBorders}
                  loading={communityAreas.loading}
                  error={communityAreas.error}
                  onEnabled={(value) => {
                    setCommunityBorders(value)
                    if (!value) setSelectedCommunity(null)
                  }}
                  onChoose={selectCommunity}
                  onRetry={communityAreas.retry}
                />
                {filters && (
                  <section
                    id="map-filters"
                    className="space-y-3 rounded-xl border p-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-150"
                  >
                    <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Layers className="size-4" />
                      Map layers
                    </h2>
                    <div className="space-y-2.5">
                      {ENTITY_KINDS.map((kind) => (
                        <Toggle
                          key={kind}
                          id={'layer-' + kind}
                          label={ENTITY_LABELS[kind]}
                          checked={d.layers.includes(kind)}
                          onChange={(v) =>
                            d.setLayers(
                              v
                                ? [...d.layers, kind]
                                : d.layers.filter((k) => k !== kind),
                            )
                          }
                        />
                      ))}
                    </div>
                    <div className="space-y-2.5 border-t pt-3">
                      <Toggle
                        id="cluster-map"
                        label="Group nearby map pins"
                        checked={d.clusters}
                        onChange={d.setClusters}
                      />
                      <Toggle
                        id="contribution-layer"
                        label="Show contribution areas"
                        checked={d.reputationLayer}
                        onChange={d.setReputationLayer}
                      />

                      <Toggle
                        id="has-animals"
                        label="Has shared animals"
                        checked={d.hasPets}
                        onChange={d.setHasPets}
                      />
                      <Toggle
                        id="visitable-map"
                        label="Has an available space to enter"
                        checked={d.visitOnly}
                        onChange={d.setVisitOnly}
                      />
                    </div>
                    <Select
                      value={d.contributionFilter}
                      onValueChange={d.setContributionFilter}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label="Documented contribution level"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="pawtrail-game text-foreground">
                        <SelectItem value="all">
                          Any contribution record
                        </SelectItem>
                        <SelectItem value="unrated">Unrated</SelectItem>
                        <SelectItem value="growing">
                          Growing contribution record
                        </SelectItem>
                        <SelectItem value="established">
                          Established contributor
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      Contribution areas show verified activity only. Welfare
                      concerns remain a separate layer.
                    </p>
                  </section>
                )}
                {d.cluster && (
                  <section className="rounded-xl border bg-muted/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-bold text-foreground">
                        This geographic cluster
                      </h2>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-foreground"
                        aria-label="Clear cluster filter"
                        onClick={() => d.setCluster(null)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed">
                      {clusterEntities.length} map entities · {group.animals}{' '}
                      distinct shared animals
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {group.kinds.home} homes · {group.kinds.shelter} shelters
                      · {group.kinds.horde} Hordes. Zooming changes this group;
                      animal memberships stay the same.
                    </p>
                  </section>
                )}
                {(d.issues.length > 0 || d.sourceIssues.length > 0) && (
                  <div
                    className="space-y-2 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed"
                    role="status"
                  >
                    {d.sourceIssues.map((issue) => (
                      <div key={issue.source} className="space-y-2">
                        <p>{issue.message}</p>
                        {issue.kind === 'auth' ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={loginHref}>Sign in to see member homes</a>
                          </Button>
                        ) : issue.kind === 'unavailable' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={d.loading}
                            onClick={d.retry}
                          >
                            Retry member homes
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    {d.issues.map((issue) => (
                      <p key={issue}>{issue}</p>
                    ))}
                    {d.issues.length > 0 && (
                      <Button
                        className="text-foreground"
                        size="sm"
                        variant="outline"
                        disabled={d.loading}
                        onClick={d.retry}
                      >
                        Retry public records
                      </Button>
                    )}
                  </div>
                )}
                {d.loading && (
                  <div
                    className="space-y-2"
                    aria-label="Loading discovery cards"
                  >
                    {[0, 1, 2].map((n) => (
                      <Card
                        key={n}
                        className="flex flex-row gap-3 p-3 motion-safe:animate-pulse"
                      >
                        <div className="size-12 rounded-xl bg-muted" />
                        <div className="flex-1 space-y-2 py-1">
                          <div className="h-3 w-3/4 rounded bg-muted" />
                          <div className="h-3 w-full rounded bg-muted" />
                          <div className="h-2 w-1/2 rounded bg-muted" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {listed.map((entity) => (
                    <PlaceRow
                      key={entity.id}
                      entity={entity}
                      selected={
                        (directions.state?.target.id ?? d.selectedId) ===
                        entity.id
                      }
                      saved={d.saved.includes(entity.id)}
                      distance={
                        d.proximity
                          ? metersBetween(
                              d.proximity.center,
                              entity.coordinates,
                            )
                          : undefined
                      }
                      onSelect={() => select(entity.id)}
                      onPreview={directions.state ? () => {} : d.previewEntity}
                    />
                  ))}
                </div>
                {!d.loading && !listed.length && (
                  <div className="rounded-xl border border-dashed px-4 py-7 text-center">
                    <PawPrint className="mx-auto mb-3 size-7 text-primary" />
                    <h2 className="font-bold text-foreground">
                      {d.hasActiveFilters || savedOnly
                        ? 'No matching places'
                        : 'No published places yet'}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      Only published database records are shown. Animals need an
                      accepted public location to appear on the map.
                      {(d.hasActiveFilters || savedOnly) &&
                        ' Try widening your search or clearing the active filters.'}
                    </p>
                    <Button asChild size="sm" className="mt-4 rounded-md">
                      <a href="/spot">Record an animal encounter</a>
                    </Button>
                    {(d.hasActiveFilters || savedOnly) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 text-foreground"
                        onClick={reset}
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                )}
                {d.truncated && (
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    This is a bounded snapshot, not a complete census. Narrow
                    the map area to retrieve more published reports.
                  </p>
                )}
                {(d.hasActiveFilters || savedOnly) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-foreground"
                    onClick={reset}
                  >
                    <X className="size-3" />
                    Reset discovery filters
                  </Button>
                )}
              </div>
              <div className="shrink-0 space-y-2 border-t p-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-full text-xs text-foreground"
                  onClick={() => setReport('mine')}
                >
                  My reports & review queue
                </Button>
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Public locations are approximate. Evidence, precise report
                  coordinates and reporter details stay private.
                </p>
              </div>
            </CollapsibleContent>
          </aside>
        </Collapsible>
        <section
          className="@container absolute inset-0 isolate min-h-0 min-w-0"
          aria-label="Neighborhood map"
        >
          <CommunityMapCanvas
            communities={mapCommunityAreas}
            communityStatistics={statistics}
            provinces={summaryAllowed ? provinces : []}
            summaryKinds={d.layers}
            selectedCommunity={selectedCommunity}
            communityFocus={communityFocus}
            onCommunitySelect={selectCommunity}
            sidebarOpen={resultsOpen}
            controls={{
              locating: d.locating,
              picking: directions.state?.phase === 'picking' || d.picking,
              inView: !!d.inView,
              hasBounds: !!d.bounds,
              onLocate: () => void locate(),
              onPick: () => {
                if (directions.state?.destinationReady) {
                  if (directions.state.phase === 'picking')
                    directions.cancelPicking()
                  else directions.pickOrigin()
                } else pickCenter()
              },
              onSearch: () => {
                if (d.inView) {
                  d.setInView(null)
                  announce('Map-area filter cleared')
                } else {
                  d.setInView(d.bounds)
                  d.setCluster(null)
                  d.setNearOnly(false)
                  announce('Showing results inside this map area')
                }
              },
            }}
            places={mapPlaces}
            destination={routeTarget}
            selected={
              directions.state?.phase === 'picking'
                ? null
                : (directions.state?.target ?? d.selected)
            }
            route={directions.state?.route}
            routeFocus={directions.fit}
            onSelect={(id) => {
              if (!directions.isPicking()) select(id)
            }}
            onCluster={(ids) => {
              if (!directions.isPicking()) d.setCluster(ids)
            }}
            onBounds={d.onBounds}
            clusters={d.clusters}
            circle={directions.state ? null : d.displayCircle}
            viewer={directions.state?.origin ?? d.viewer}
            onHover={directions.state ? undefined : d.hoverEntity}
            picking={
              directions.state?.phase === 'picking' ||
              (d.picking && !directions.state)
            }
            onPick={(point) => {
              if (directions.isPicking()) {
                d.recenter(point)
                void directions.chooseOrigin(point, d.account)
              } else if (!directions.state) chooseCenter(point)
            }}
            focus={d.focus}
            onViewer={() =>
              directions.state
                ? directions.showRoute()
                : d.viewer && chooseCenter(d.viewer.coordinates, 'Nearby you')
            }
            reputationLayer={d.reputationLayer}
            overlayOpen={
              !!selectedCommunity ||
              nearbyOpen ||
              !!d.selected ||
              (!!directions.state && directions.state.phase !== 'picking')
            }
          />
          {directions.state && (
            <DirectionsPanel
              state={directions.state}
              onClose={() => {
                directions.stop()
                document
                  .getElementById('map-locate')
                  ?.focus({ preventScroll: true })
              }}
              onRetry={() => void directions.retry()}
              onShowRoute={directions.showRoute}
              onPickOrigin={directions.pickOrigin}
              onCancelPicking={directions.cancelPicking}
            />
          )}
          <FloatingMapActions
            onReport={openReport}
            proximity={d.proximity}
            animalCount={nearbyCount}
            nearbyOpen={nearbyOpen}
            onNearby={showNearby}
          />
          <p role="status" aria-live="polite" className="sr-only">
            {d.locating
              ? 'Finding your location…'
              : (notice?.message ?? d.locationStatus)}
          </p>
          {!d.selected &&
            !nearbyOpen &&
            (d.locating || (!d.picking && notice)) && (
              <div
                key={d.locating ? 'locating' : notice?.id}
                className="absolute left-[var(--map-overlay-left)] top-80 lg:top-36 z-20 flex max-w-[min(24rem,calc(100%-5rem))] items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-xs shadow-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-200"
              >
                <LocateFixed
                  className={
                    'size-4 shrink-0 text-primary ' +
                    (d.locating ? 'motion-safe:animate-pulse' : '')
                  }
                />
                {d.locating
                  ? 'Finding your current location…'
                  : notice?.message}
              </div>
            )}
          {d.picking && !directions.state && (
            <div
              role="status"
              className="absolute left-[var(--map-overlay-left)] right-16 top-80 lg:top-36 z-20 flex items-center gap-2 rounded-xl border bg-card p-3 text-xs shadow-md motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <p className="flex-1">
                {d.locationStatus.includes('unavailable')
                  ? d.locationStatus
                  : 'Choose a point on the map to find nearby animals and places.'}
              </p>
              <Button
                size="icon"
                variant="ghost"
                className="size-7 text-foreground"
                aria-label="Cancel choosing a center"
                onClick={() => d.setPicking(false)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}
          {d.reputationLayer && (
            <Badge
              variant="secondary"
              className="absolute bottom-36 left-3 z-10 border bg-card text-[10px]"
            >
              <Check className="size-3 text-green-700" />
              Green areas: documented contributions
            </Badge>
          )}
          {d.proximity && (
            <NearbyPopup
              open={nearbyOpen && !d.selected}
              proximity={d.proximity}
              entities={d.nearby}
              area={d.areaSummary}
              nearOnly={d.nearOnly}
              onNearOnly={(value) => {
                d.setNearOnly(value)
                announce(
                  value
                    ? 'Only nearby results are shown'
                    : 'Results outside the circle are visible again',
                )
              }}
              onRadius={(value) => {
                d.setRadius(value)
                announce('Nearby radius changed to ' + distanceLabel(value))
              }}
              onFilter={(kind) => {
                filterKind(kind)
                d.setNearOnly(true)
                setNearbyOpen(false)
                setResultsOpen(true)
                announce('Showing nearby ' + ENTITY_LABELS[kind].toLowerCase())
              }}
              onAnimals={() => {
                d.setHasPets(true)
                d.setNearOnly(true)
                d.setCluster(null)
                d.setInView(null)
                setNearbyOpen(false)
                setResultsOpen(true)
                announce('Showing nearby animals and places with shared pets')
              }}
              onClose={() => {
                setNearbyOpen(false)
                document
                  .getElementById('map-nearby-trigger')
                  ?.focus({ preventScroll: true })
              }}
              onClear={() => {
                setNearbyOpen(false)
                d.setProximity(null)
                d.setNearOnly(false)
                announce('Nearby area cleared')
                document
                  .getElementById('map-locate')
                  ?.focus({ preventScroll: true })
              }}
            />
          )}
          <MapQuestTracker
            platform={platform}
            refreshKey={d.dataRevision}
            visible={
              !selectedCommunity &&
              !d.selected &&
              !directions.state &&
              !nearbyOpen &&
              !report &&
              !helpDialog &&
              !sampleReport &&
              !d.picking &&
              !d.locating
            }
            attention={currentHelp}
            attentions={attentionQuests}
            entities={d.entities}
            loadingAnimals={d.loading}
            origin={d.viewer?.coordinates}
            onChoose={select}
            resultsExpanded={resultsOpen}
            onExpand={() => {
              if (window.innerWidth < 1024) setResultsOpen(false)
            }}
            loginHref={loginHref}
            onAttention={(prompt) => {
              acknowledgeHelp(prompt.attention.key)
              setHelpQuiet(true)
              setSelectedCommunity(null)
              setHelpDialog(prompt)
            }}
            onDismissAttention={(prompt) => {
              acknowledgeHelp(prompt.attention.key)
              setHelpQuiet(true)
            }}
          />
          {communityPanel.value && (
            <CommunityDrawer
              area={communityPanel.value}
              metrics={statistics.cities.find(city => city.id === communityPanel.value.id)}
              loading={statistics.loading}
              error={statistics.error}
              homeStatus={statistics.homeStatus}
              exiting={communityPanel.exiting}
              href={
                base +
                '?home=' +
                encodeURIComponent(communityPanel.value.properties.roomId)
              }
              onFit={() => setCommunityFocus((value) => value + 1)}
              onClose={() => {
                setSelectedCommunity(null)
                const picker = resultsOpen
                  ? document.getElementById('community-area-picker')
                  : document.getElementById('map-results-toggle')
                picker?.focus({ preventScroll: true })
              }}
            />
          )}
          {detail.value && (
            <EntityDetail
              key={detail.value.id}
              entity={detail.value}
              exiting={detail.exiting}
              platform={platform}
              onChoose={select}
              onAnimalReport={reportAnimal}
              onHelp={helpAnimal}
              onDirections={goToAnimal}
              saved={d.saved.includes(detail.value.id)}
              onSave={() => detail.value && d.toggleSaved(detail.value.id)}
              onReport={openReport}
              onClose={() => {
                const id = d.selected?.animal?.associationId ?? d.selectedId
                d.closeSelection()
                const target =
                  window.innerWidth >= 1024
                    ? document.getElementById('place-' + id)
                    : null
                ;(target ?? document.getElementById('map-locate'))?.focus({
                  preventScroll: true,
                })
              }}
            />
          )}
        </section>
      </main>
      {helpDialog && (
        <AnimalHelpDialog
          key={helpDialog.attention.key + ':' + helpDialog.entity.id}
          prompt={helpDialog}
          entities={d.entities}
          platform={platform}
          authenticated={!!d.account?.authenticated}
          loginHref={loginHref}
          onClose={() => setHelpDialog(null)}
          onViewMap={(id) => {
            setHelpDialog(null)
            select(id)
          }}
          onReport={(entity, mode) => {
            setHelpDialog(null)
            setReportTarget(entity)
            setReport(mode)
          }}
          onOffered={d.retry}
          onAnimalReport={reportAnimal}
        />
      )}
      {sampleReport && (
        <SampleReportDialog
          key={sampleReport.entity.id + sampleReport.kind}
          entity={sampleReport.entity}
          kind={sampleReport.kind}
          onClose={() => setSampleReport(null)}
        />
      )}
      <ReportDialog
        mode={report}
        onClose={() => {
          setReport(null)
          setReportTarget(null)
        }}
        entity={reportTarget ?? d.selected}
        center={d.proximity?.center ?? null}
        onSaved={d.retry}
        loginHref={
          platform?.loginHref('/play?map=community') ??
          '/login?returnTo=%2Fplay%3Fmap%3Dcommunity'
        }
      />
    </div>
  )
}

export default function CommunityMap(props: { platform?: PlatformBridge }) {
  return <DiscoveryMap {...props} />
}
