import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Home, MapPin, Search, RotateCw, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { STARTER_PLACES, validCoordinates, type CommunityPlace } from '@/features/neighborhood/game/community'
import { loadHomePlaces } from '@/features/neighborhood/game/housing/client'
import type { PlatformBridge } from '@/features/neighborhood/game/platform'
import { CommunityMapCanvas, type MapBounds } from './map-canvas'
import { PlacePreview, placeIcons, placeLabels } from './place-preview'

const kinds = ['all', 'home', 'shelter', 'hub'] as const
export default function CommunityMap({ platform }: { platform?: PlatformBridge }) {
  const [places, setPlaces] = useState<CommunityPlace[]>(STARTER_PLACES), [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<string[]>([]), [attempt, setAttempt] = useState(0)
  const [query, setQuery] = useState(''), [kind, setKind] = useState<(typeof kinds)[number]>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null), [cluster, setCluster] = useState<string[] | null>(null)
  const [showSamples, setShowSamples] = useState(true)
  const [bounds, setBounds] = useState<MapBounds | null>(null), [inView, setInView] = useState<MapBounds | null>(null)
  const base = window.location.pathname === '/' ? '/' : '/play'
  useEffect(() => {
    document.body.dataset.pawtrailGame = 'true'
    return () => { delete document.body.dataset.pawtrailGame }
  }, [])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true); setIssues([])
    const samples = fetch('/pawtrail-game/maps/community-demo.json', { signal: abort.signal }).then(async (response) => {
      if (!response.ok) throw new Error('Sample places could not load.')
      const data = await response.json() as { rooms: { place: CommunityPlace }[] }
      return data.rooms.map((room) => room.place)
    })
    Promise.allSettled([loadHomePlaces(abort.signal), platform?.places?.(abort.signal) ?? Promise.resolve([]), samples]).then(([homes, shelters, demos]) => {
      if (abort.signal.aborted) return
      const next = new Map(STARTER_PLACES.map((place) => [place.id, place]))
      const warnings: string[] = []
      if (demos.status === 'fulfilled') for (const place of demos.value) next.set(place.id, place)
      else warnings.push('The sample neighborhood could not load. Retry to show the demo homes and shelters.')
      if (homes.status === 'fulfilled') for (const place of homes.value) next.set(place.id, place)
      else warnings.push('Member homes are unavailable. Sign in to load them, or enter a labeled demo place below as a guest.')
      if (shelters.status === 'fulfilled') for (const place of shelters.value) next.set(place.id, place)
      else warnings.push('Shelter profiles could not load. Retry to refresh the public shelter directory.')
      setPlaces([...next.values()].filter((place) => validCoordinates(place.coordinates)))
      setIssues(warnings); setLoading(false)
    })
    return () => abort.abort()
  }, [attempt, platform])
  const matching = useMemo(() => {
    const text = query.trim().toLocaleLowerCase()
    return places.filter((place) => (!place.demo || showSamples) && (kind === 'all' || place.kind === kind) && (!text || `${place.name} ${place.area} ${place.host?.name ?? ''}`.toLocaleLowerCase().includes(text)))
  }, [places, kind, query, showSamples])
  const listed = matching.filter((place) => (!cluster || cluster.includes(place.id)) && (!inView || (place.coordinates[0] >= inView[0] && place.coordinates[0] <= inView[2] && place.coordinates[1] >= inView[1] && place.coordinates[1] <= inView[3])))
  const selected = matching.find((place) => place.id === selectedId) ?? null
  const choose = useCallback((id: string) => setSelectedId(id), [])
  const selectCluster = useCallback((ids: string[]) => { setCluster(ids); setSelectedId(null); setInView(null) }, [])
  const resetFilters = () => { setQuery(''); setKind('all'); setCluster(null); setInView(null); setSelectedId(null) }
  return (
    <div className="pawtrail-game flex h-dvh min-h-0 flex-col overflow-hidden bg-background text-foreground">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3"><Button asChild size="icon" variant="ghost"><a href={base} aria-label="Back to exploration"><ArrowLeft className="size-4" /></a></Button><div className="min-w-0"><h1 className="font-heading text-lg font-extrabold sm:text-xl">Find your community</h1><p className="hidden text-xs text-muted-foreground sm:block">A place to visit. Someone to help. A door to open.</p></div></div>
        <Button asChild variant="outline" size="sm"><a href={`${base}?home=me${new URLSearchParams(window.location.search).get('demo') === '1' ? '&demo=1' : ''}`}><Home className="size-4" /><span className="hidden sm:inline">My home</span></a></Button>
      </header>
      <main className="grid min-h-0 flex-1 grid-rows-[minmax(16rem,1fr)_minmax(12rem,.65fr)] lg:grid-cols-[22rem_1fr] lg:grid-rows-1">
        <aside className="order-2 flex min-h-0 flex-col border-t bg-card lg:order-1 lg:border-t-0 lg:border-r" aria-label="Community places">
          <div className="shrink-0 space-y-3 border-b p-3 sm:p-4">
            <div className="relative"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Search places, neighborhoods, or hosts" value={query} onChange={(event) => { setQuery(event.target.value); setCluster(null) }} placeholder="Search places, areas, hosts…" className="h-10 pl-9" /></div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Place types">{kinds.map((value) => <Button key={value} size="sm" variant={kind === value ? 'default' : 'outline'} aria-pressed={kind === value} className="h-8 rounded-full px-3 text-xs" onClick={() => { setKind(value); setCluster(null); setSelectedId(null) }}>{value === 'all' ? 'All places' : value === 'home' ? 'Homes' : value === 'shelter' ? 'Shelters' : 'Commons'}</Button>)}</div>
            <div className="flex items-center justify-between gap-3"><label htmlFor="show-demo-places" className="text-xs font-semibold">Show demo homes & shelters</label><Switch id="show-demo-places" checked={showSamples} onCheckedChange={(checked) => { setShowSamples(checked); setCluster(null); setSelectedId(null) }} /></div>
            <div className="flex items-center justify-between gap-2 text-xs"><p role="status">{loading ? 'Refreshing places…' : `${listed.length} ${listed.length === 1 ? 'place' : 'places'}`}{cluster ? ' in this cluster' : inView ? ' in this map area' : ' to discover'}</p><Button variant="ghost" size="icon" className="size-7" aria-label="Refresh community places" disabled={loading} onClick={() => setAttempt((n) => n + 1)}><RotateCw className={`size-3.5 ${loading ? 'motion-safe:animate-spin' : ''}`} /></Button></div>
            {(cluster || inView || query || kind !== 'all') && <Button variant="ghost" size="sm" className="h-7 px-0 text-xs" onClick={resetFilters}><X className="size-3" />Clear filters</Button>}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
            {issues.length > 0 && <div className="mb-3 space-y-2 rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed" role="status">{issues.map((issue) => <p key={issue}>{issue}</p>)}<div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)} disabled={loading}>Retry</Button>{platform && <Button asChild size="sm" variant="ghost"><a href={platform.loginHref('/play?map=community')}>Sign in</a></Button>}</div></div>}
            {loading && <div className="mb-3 space-y-2" aria-label="Loading community places">{[0, 1].map((n) => <Card key={n} className="gap-2 p-3 motion-safe:animate-pulse"><div className="h-4 w-2/3 rounded bg-muted" /><div className="h-3 w-4/5 rounded bg-muted" /></Card>)}</div>}
            <div className="space-y-2">{listed.map((place) => {
              const Icon = placeIcons[place.kind]
              return <Button key={place.id} id={'place-' + place.id} variant="outline" className="h-auto w-full justify-start gap-3 whitespace-normal rounded-xl p-3 text-left aria-pressed:border-primary aria-pressed:bg-primary/5" aria-pressed={selectedId === place.id} onClick={() => choose(place.id)}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary">{place.host?.avatar ? <img src={place.host.avatar} alt="" className="size-10 rounded-lg object-cover" /> : <Icon className="size-5 text-primary" />}</span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-bold leading-snug">{place.name}</span><span className="mt-1 block text-xs font-normal text-muted-foreground">{place.area}</span><span className="mt-1 flex flex-wrap gap-x-2 text-[10px] font-normal text-muted-foreground"><span>{placeLabels[place.kind]}</span>{place.sample && <span>Sample</span>}{place.occupancy !== undefined && <span>{place.occupancy} inside</span>}</span></span>
              </Button>
            })}</div>
            {!loading && listed.length === 0 && <div className="py-7 text-center"><MapPin className="mx-auto mb-3 size-8 text-primary" /><h2 className="font-bold">There’s room for more kindness here.</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Try a wider map area or another search. Homeowners can add a neighborhood pin in Homes settings.</p><Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>Show all places</Button></div>}
          </div>
          <p className="hidden shrink-0 border-t px-4 py-3 text-[11px] leading-relaxed text-muted-foreground lg:block">Home pins mark virtual spaces in a neighborhood, never private addresses. Shelter pins use published approximate locations.</p>
        </aside>
        <section className="relative order-1 min-h-0 min-w-0 lg:order-2" aria-label="Neighborhood map">
          <CommunityMapCanvas places={matching} selected={selected} onSelect={choose} onCluster={selectCluster} onBounds={setBounds} />
          <div className="absolute top-3 left-3 flex max-w-[calc(100%-4rem)] flex-wrap gap-2"><Button size="sm" variant="secondary" className="border shadow-sm" disabled={!bounds} onClick={() => { setInView(bounds); setCluster(null); setSelectedId(null) }}><SlidersHorizontal className="size-3.5" />Search this area</Button><Badge variant="secondary" className="hidden border bg-card/95 sm:inline-flex">Davao community pilot</Badge></div>
          {selected && <PlacePreview place={selected} onClose={() => { setSelectedId(null); document.getElementById('place-' + selected.id)?.focus({ preventScroll: true }) }} />}
        </section>
      </main>
    </div>
  )
}
