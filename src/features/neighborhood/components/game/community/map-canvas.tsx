import { useEffect, useRef, useState } from 'react'
import type { Map as LibreMap, GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMMUNITY_START, type CommunityPlace } from '@/features/neighborhood/game/community'

export type MapBounds = [number, number, number, number]
const collection = (places: CommunityPlace[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => ({ type: 'Feature' as const, id: place.id,
    geometry: { type: 'Point' as const, coordinates: place.coordinates },
    properties: { id: place.id, kind: place.kind, name: place.name },
  })),
})
const markerPaths = {
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1Z"/><path d="M9 21v-9h6v9"/>',
  shelter: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>',
  hub: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
}
async function addIcons(map: LibreMap) {
  for (const [kind, paths] of Object.entries(markerPaths)) {
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`)
    await image.decode()
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 48
    const context = canvas.getContext('2d')!
    context.drawImage(image, 0, 0)
    map.addImage(kind, context.getImageData(0, 0, 48, 48), { pixelRatio: 2 })
  }
}

export function CommunityMapCanvas({ places, selected, onSelect, onCluster, onBounds }: {
  places: CommunityPlace[]
  selected: CommunityPlace | null
  onSelect: (id: string) => void
  onCluster: (ids: string[]) => void
  onBounds: (bounds: MapBounds) => void
}) {
  const host = useRef<HTMLDivElement>(null), map = useRef<LibreMap | null>(null)
  const latest = useRef({ places, onSelect, onCluster, onBounds })
  latest.current = { places, onSelect, onCluster, onBounds }
  const [attempt, setAttempt] = useState(0), [ready, setReady] = useState(false), [error, setError] = useState('')
  useEffect(() => {
    let disposed = false, instance: LibreMap | undefined, resize: ResizeObserver | undefined
    let timer: ReturnType<typeof setTimeout> | undefined
    setReady(false); setError('')
    import('maplibre-gl').then(({ Map, NavigationControl, setWorkerUrl }) => {
      if (disposed || !host.current) return
      setWorkerUrl('/pawtrail-game/maplibre/maplibre-gl-worker.mjs')
      instance = new Map({ container: host.current, style: 'https://tiles.openfreemap.org/styles/liberty',
        center: COMMUNITY_START, zoom: 12, maxZoom: 18, minZoom: 2, attributionControl: { compact: true },
      })
      map.current = instance
      instance.getCanvas().style.imageRendering = 'auto'
      instance.getCanvas().setAttribute('aria-label', 'Community map. Use arrow keys to pan and plus or minus to zoom. Places are also available in the list.')
      instance.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      const updateBounds = () => {
        if (!instance || disposed) return
        const b = instance.getBounds()
        latest.current.onBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
      }
      instance.on('moveend', updateBounds)
      instance.on('load', async () => {
        if (!instance || disposed) return
        clearTimeout(timer)
        instance.addSource('places', { type: 'geojson', data: collection(latest.current.places), cluster: true, clusterRadius: 55, clusterMaxZoom: 14 })
        instance.addLayer({ id: 'clusters', type: 'circle', source: 'places', filter: ['has', 'point_count'],
          paint: { 'circle-color': '#456746', 'circle-radius': ['step', ['get', 'point_count'], 22, 10, 27, 40, 32], 'circle-stroke-width': 3, 'circle-stroke-color': '#fffcf5' },
        })
        instance.addLayer({ id: 'cluster-count', type: 'symbol', source: 'places', filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': ['Noto Sans Regular'], 'text-size': 14 }, paint: { 'text-color': '#ffffff' },
        })
        instance.addLayer({ id: 'points', type: 'circle', source: 'places', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-radius': 19, 'circle-color': ['match', ['get', 'kind'], 'home', '#a54922', 'shelter', '#26796f', '#456746'], 'circle-stroke-width': 3, 'circle-stroke-color': '#fffcf5' },
        })
        setReady(true); setError(''); updateBounds()
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        instance.on('click', 'clusters', async (event) => {
          const feature = event.features?.[0]
          if (!instance || !feature || feature.geometry.type !== 'Point') return
          try {
            const source = instance.getSource('places') as GeoJSONSource
            const id = Number(feature.properties.cluster_id)
            const [zoom, leaves] = await Promise.all([source.getClusterExpansionZoom(id), source.getClusterLeaves(id, 500, 0)])
            if (disposed) return
            latest.current.onCluster(leaves.map((leaf) => String(leaf.properties?.id)))
            instance.easeTo({ center: feature.geometry.coordinates as [number, number], zoom, duration: reduced ? 0 : 250 })
          } catch { /* Source may have changed while opening a cluster. */ }
        })
        instance.on('click', 'points', (event) => {
          const id = event.features?.[0]?.properties.id
          if (typeof id === 'string') latest.current.onSelect(id)
        })
        for (const layer of ['clusters', 'points']) {
          instance.on('mouseenter', layer, () => { if (instance) instance.getCanvas().style.cursor = 'pointer' })
          instance.on('mouseleave', layer, () => { if (instance) instance.getCanvas().style.cursor = '' })
        }
        try {
          await addIcons(instance)
          if (!disposed) instance.addLayer({ id: 'place-icons', type: 'symbol', source: 'places', filter: ['!', ['has', 'point_count']], layout: { 'icon-image': ['get', 'kind'], 'icon-allow-overlap': true, 'icon-ignore-placement': true, 'icon-size': .85 } })
        } catch { /* Colored markers and the accessible list remain usable. */ }
      })
      timer = setTimeout(() => { if (!disposed) setError('The map is taking a while to load. You can still explore every place in the list.') }, 15000)
      instance.on('error', () => { if (!disposed && !instance?.isStyleLoaded()) setError('Map tiles could not load. Your place list and previews are still available.') })
      resize = new ResizeObserver(() => instance?.resize())
      resize.observe(host.current)
    }).catch(() => { if (!disposed) setError('This browser could not open the map. Use the place list, or retry in a WebGL-capable browser.') })
    return () => { disposed = true; clearTimeout(timer); resize?.disconnect(); map.current = null; instance?.remove() }
  }, [attempt])
  useEffect(() => {
    const source = map.current?.getSource('places') as GeoJSONSource | undefined
    source?.setData(collection(places))
  }, [places, ready])
  useEffect(() => {
    if (!selected || !ready) return
    map.current?.easeTo({ center: selected.coordinates, zoom: Math.max(map.current.getZoom(), 14.5), duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250 })
  }, [selected?.id, ready])
  return (
    <div className="relative h-full min-h-64 w-full overflow-hidden bg-muted">
      <div ref={host} className="absolute inset-0" />
      {!ready && !error && <div role="status" className="pointer-events-none absolute inset-0 grid place-items-center bg-background/90"><div className="text-center"><MapPin className="mx-auto mb-2 size-7 text-primary motion-safe:animate-pulse" /><p className="text-sm font-bold">Finding the neighborhood…</p></div></div>}
      {error && <div className="absolute inset-x-3 top-3 z-10 flex items-start gap-3 rounded-xl border bg-card p-3 shadow-sm"><p className="flex-1 text-xs leading-relaxed" role="status">{error}</p><Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}><RotateCw className="size-3.5" />Retry</Button></div>}
    </div>
  )
}
