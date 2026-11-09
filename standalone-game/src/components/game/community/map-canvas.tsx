import { CITY_MIN_ZOOM, cityLevel, type ProvinceSummary, type CommunityMetricsState } from '@/game/discovery/region-stats'
import { ProvinceCountMarker } from './community-metrics'
import { discoveryPadding, SELECTED_ITEM_ZOOM } from './map-layout'
import { markerHasSelection } from '@/game/discovery/members'
import {
  EMPTY_COMMUNITIES,
  type CommunityArea,
  type CommunityAreas,
} from '@/game/discovery/communities'
import { CommunityHoverPreview, communityHoverPoint, type CommunityHover } from './community-hover'
import { COMMUNITY_FILL, highlightCommunity, updateCommunityLayers } from './community-layers'
import { routeFeatures } from '@/game/discovery/route-features'
import type { WalkingRoute } from '@/game/discovery/directions'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { Map as LibreMap, Marker, GeoJSONSource } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COMMUNITY_START } from '@/game/community'
import { circleFeature } from '@/game/discovery/geo'
import type {
  MapEntity,
  EntityKind,
  Point,
  Proximity,
  UserPosition,
} from '@/game/discovery/types'
import {
  EntityMarkerGroup,
  GeographicMarkerGroup,
  RouteDestinationMarker,
  ViewerMarker,
} from './markers'
import { SimplePlaceMap } from './simple-map'
import {
  MapZoomControls,
  type MapCamera,
  type MapControlActions,
} from './zoom-controls'
export type MapBounds = [number, number, number, number]
export type DiscoveryCanvasProps = {
  places: MapEntity[]
  provinces?: ProvinceSummary[]
  summaryKinds?: EntityKind[]
  communities?: CommunityAreas
  communityStatistics?: CommunityMetricsState
  selectedCommunity?: CommunityArea | null
  communityFocus?: number
  onCommunitySelect?: (id: string) => void
  sidebarOpen?: boolean
  controls?: MapControlActions
  route?: WalkingRoute | null
  routeFocus?: number
  destination?: MapEntity | null
  selected: MapEntity | null
  onSelect: (id: string) => void
  onCluster: (ids: string[]) => void
  onBounds: (bounds: MapBounds) => void
  clusters?: boolean
  circle?: Proximity | null
  viewer?: UserPosition | null
  onHover?: (e: MapEntity | null) => void
  picking?: boolean
  onPick?: (point: Point) => void
  focus?: { point: Point; id: number; zoom?: number } | null
  onViewer?: () => void
  reputationLayer?: boolean
  overlayOpen?: boolean
}
const collection = (places: MapEntity[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => ({
    type: 'Feature' as const,
    id: place.id,
    geometry: { type: 'Point' as const, coordinates: place.coordinates },
    properties: { id: place.id },
  })),
})
function detailPadding(
  instance: LibreMap,
  selected: boolean,
  sidebarOpen = false,
) {
  const host = instance.getContainer()
  return discoveryPadding(
    host.clientWidth,
    host.clientHeight,
    window.innerWidth >= 1024,
    selected,
    sidebarOpen,
  )
}

export function CommunityMapCanvas(props: DiscoveryCanvasProps) {
  const host = useRef<HTMLDivElement>(null),
    map = useRef<LibreMap | null>(null),
    latest = useRef(props)
  latest.current = props
  const [simple, setSimple] = useState(false),
    [pinsReady, setPinsReady] = useState(false),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0),
    [error, setError] = useState('')
  const [communityHover, setCommunityHover] = useState<CommunityHover | null>(null)
  const invalidate = useRef(() => {})
  const camera = useRef<MapCamera>({ point: COMMUNITY_START, zoom: 12 })
  const rasterActive = useRef(true)
  rasterActive.current = simple || !pinsReady
  const [zoom, setZoom] = useState(12)
  const onRasterCamera = useCallback((value: MapCamera) => {
    camera.current = value
    setZoom(value.zoom)
    if (rasterActive.current)
      map.current?.jumpTo({
        center: value.point,
        zoom: value.zoom,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
      })
  }, [])
  useEffect(() => {
    let disposed = false,
      instance: LibreMap | undefined,
      resize: ResizeObserver | undefined,
      timer: ReturnType<typeof setTimeout> | undefined,
      moveTimer: ReturnType<typeof setTimeout> | undefined
    let fallback = false,
      revision = 0,
      lastRefresh = 0
    const markers = new Map<
      string,
      { marker: Marker; root: Root; signature: string }
    >()
    const provinceMarkers = new Map<string, { marker: Marker
      root: Root
      signature: string }>()
    function clearProvinces() {
      for (const item of provinceMarkers.values()) { item.root.unmount()
        item.marker.remove() }
      provinceMarkers.clear()
    }
    const clusters = new Map<number, string[]>()
    const pending = new Set<number>()
    let viewerMarker:
      { marker: Marker; root: Root; signature: string } | undefined
    let destinationMarker:
      { marker: Marker; root: Root; signature: string } | undefined
    setReady(false)
    setPinsReady(false)
    setError('')
    import('maplibre-gl')
      .then(({ Map: MapLibre, Marker: LibreMarker, setWorkerUrl }) => {
        if (disposed || !host.current) return
        setWorkerUrl('/pawtrail-game/maplibre/maplibre-gl-worker.mjs?v=6.16.0')
        const relay = (url: string) => {
          try {
            const parsed = new URL(url, window.location.href)
            if (
              window.location.pathname !== '/' &&
              parsed.origin === 'https://tiles.openfreemap.org'
            )
              return (
                '/api/game/map-assets?path=' +
                encodeURIComponent(parsed.pathname + parsed.search)
              )
          } catch {}
          return url
        }
        instance = new MapLibre({
          container: host.current,
          style: relay('https://tiles.openfreemap.org/styles/liberty'),
          transformRequest: (url) => ({ url: relay(url) }),
          center: camera.current.point,
          zoom: camera.current.zoom,
          minZoom: 3,
          maxZoom: 18,
          attributionControl: { compact: true },
        })
        map.current = instance
        instance.getCanvas().style.imageRendering = 'auto'
        instance
          .getCanvas()
          .setAttribute(
            'aria-label',
            'Community discovery map. Arrow keys pan; plus and minus zoom. All entities are also in the list.',
          )
        function clearMarkers() {
          for (const item of markers.values()) {
            item.root.unmount()
            item.marker.remove()
          }
          markers.clear()
        }
        invalidate.current = () => {
          revision++
          lastRefresh = 0
          clusters.clear()
          pending.clear()
          instance?.triggerRepaint()
        }
        const updateBounds = () => {
          clearTimeout(moveTimer)
          moveTimer = setTimeout(() => {
            if (!instance || disposed) return
            const b = instance.getBounds()
            latest.current.onBounds([
              Math.max(-180, b.getWest()),
              Math.max(-85, b.getSouth()),
              Math.min(180, b.getEast()),
              Math.min(85, b.getNorth()),
            ])
          }, 150)
        }
        const refresh = () => {
          if (fallback || rasterActive.current) {
            clearProvinces()
            clearMarkers()
            viewerMarker?.root.unmount()
            viewerMarker?.marker.remove()
            viewerMarker = undefined
            destinationMarker?.root.unmount()
            destinationMarker?.marker.remove()
            destinationMarker = undefined
            return
          }
          if (
            disposed ||
            !instance?.getSource('places') ||
            performance.now() - lastRefresh < 100
          )
            return
          lastRefresh = performance.now()
          const provinceMode = instance.getZoom() < CITY_MIN_ZOOM && !!latest.current.provinces?.length && !latest.current.picking && !latest.current.destination && !latest.current.selectedCommunity
          if (provinceMode) {
            const live = new Set<string>()
            for (const summary of latest.current.provinces ?? []) {
              live.add(summary.id)
              let item = provinceMarkers.get(summary.id)
              if (!item) {
                const element = document.createElement('div')
                element.style.pointerEvents = 'auto'
                item = { marker: new LibreMarker({element,anchor:'center'}).setLngLat(summary.center).addTo(instance),root:createRoot(element),signature:'' }
                provinceMarkers.set(summary.id,item)
              }
              item.marker.setLngLat(summary.center)
              const signature=JSON.stringify([summary,latest.current.summaryKinds])
              if(item.signature!==signature) {
                item.signature=signature
                item.root.render(<ProvinceCountMarker summary={summary} kinds={latest.current.summaryKinds ?? []} onChoose={()=>instance?.fitBounds([[summary.bounds[0],summary.bounds[1]],[summary.bounds[2],summary.bounds[3]]],{absolutePadding:true,padding:detailPadding(instance!,false,latest.current.sidebarOpen),maxZoom:10,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220})} />)
              }
            }
            for(const [id,item] of provinceMarkers)if(!live.has(id)){item.root.unmount()
              item.marker.remove()
              provinceMarkers.delete(id)}
            clearMarkers()
            viewerMarker?.root.unmount()
            viewerMarker?.marker.remove()
            viewerMarker=undefined
            return
          }
          clearProvinces()
          const features = instance.querySourceFeatures('places'),
            active = new Set<string>(),
            byId = new Map(latest.current.places.map((e) => [e.id, e]))
          for (const feature of features) {
            if (feature.geometry.type !== 'Point') continue
            const clustered = !!feature.properties?.cluster,
              clusterId = Number(feature.properties?.cluster_id)
            const id = clustered
              ? 'cluster:' + clusterId
              : String(feature.properties?.id)
            if (active.has(id)) continue
            active.add(id)
            const entity = byId.get(id),
              ids = clustered ? (clusters.get(clusterId) ?? []) : []
            if (!clustered && !entity) continue
            if (
              clustered &&
              !clusters.has(clusterId) &&
              !pending.has(clusterId)
            ) {
              pending.add(clusterId)
              const version = revision
              const source = instance.getSource('places') as GeoJSONSource
              void source
                .getClusterLeaves(clusterId, 10000, 0)
                .then((leaves) => {
                  if (disposed || version !== revision) return
                  clusters.set(
                    clusterId,
                    leaves.map((leaf) => String(leaf.properties?.id)),
                  )
                  pending.delete(clusterId)
                  lastRefresh = 0
                  instance?.triggerRepaint()
                })
                .catch(() => pending.delete(clusterId))
            }
            const coordinates = feature.geometry.coordinates as Point
            const members = ids
              .map((key) => byId.get(key))
              .filter((e): e is MapEntity => !!e)
            const signature = JSON.stringify(
              clustered
                ? [
                    members,
                    feature.properties.point_count,
                    latest.current.selected?.id,
                  ]
                : [entity, latest.current.selected?.id],
            )
            let item = markers.get(id)
            if (!item) {
              const element = document.createElement('div')
              element.style.pointerEvents = 'auto'
              item = {
                marker: new LibreMarker({ element, anchor: 'center' })
                  .setLngLat(coordinates)
                  .addTo(instance),
                root: createRoot(element),
                signature: '',
              }
              markers.set(id, item)
            }
            const previous = item.marker.getLngLat()
            const selectedId = latest.current.selected?.id
            item.marker.getElement().style.zIndex = (
              entity ? markerHasSelection(entity, selectedId) : members.some(member => markerHasSelection(member, selectedId))
            ) ? '24' : '0'
            if (
              previous.lng !== coordinates[0] ||
              previous.lat !== coordinates[1]
            )
              item.marker.setLngLat(coordinates)
            if (item.signature !== signature) {
              item.signature = signature
              if (clustered)
                item.root.render(
                  <GeographicMarkerGroup
                    entities={members}
                    count={Number(feature.properties.point_count)}
                    selectedId={latest.current.selected?.id}
                    onAnimalSelect={(id) => latest.current.onSelect(id)}
                    onHover={(e) => latest.current.onHover?.(e)}
                    onSelect={() => {
                      const source = instance?.getSource('places') as
                        GeoJSONSource | undefined
                      if (!source) return
                      void Promise.all([
                        source.getClusterExpansionZoom(clusterId),
                        source.getClusterLeaves(clusterId, 10000, 0),
                      ])
                        .then(([zoom, leaves]) => {
                          if (disposed) return
                          latest.current.onCluster(
                            leaves.map((leaf) => String(leaf.properties?.id)),
                          )
                          instance?.easeTo({
                            center: coordinates,
                            zoom,
                            duration: window.matchMedia(
                              '(prefers-reduced-motion: reduce)',
                            ).matches
                              ? 0
                              : 250,
                          })
                        })
                        .catch(() => {})
                    }}
                  />,
                )
              else if (entity)
                item.root.render(
                  <EntityMarkerGroup
                    entity={entity}
                    selectedId={latest.current.selected?.id}
                    onSelect={(id) => latest.current.onSelect(id)}
                    onHover={(e) => latest.current.onHover?.(e)}
                  />,
                )
            }
          }
          for (const [id, item] of markers)
            if (!active.has(id)) {
              item.root.unmount()
              item.marker.remove()
              markers.delete(id)
            }
          for (const item of markers.values())
            item.marker.getElement().inert = !!latest.current.picking
          const viewer = latest.current.viewer
          if (viewer) {
            const signature = JSON.stringify(viewer)
            if (!viewerMarker) {
              const element = document.createElement('div')
              viewerMarker = {
                marker: new LibreMarker({ element })
                  .setLngLat(viewer.coordinates)
                  .addTo(instance),
                root: createRoot(element),
                signature: '',
              }
            }
            viewerMarker.marker.getElement().inert = !!latest.current.picking
            viewerMarker.marker.setLngLat(viewer.coordinates)
            if (viewerMarker.signature !== signature) {
              viewerMarker.signature = signature
              viewerMarker.root.render(
                <ViewerMarker
                  viewer={viewer}
                  onSelect={() => latest.current.onViewer?.()}
                />,
              )
            }
          } else if (viewerMarker) {
            viewerMarker.root.unmount()
            viewerMarker.marker.remove()
            viewerMarker = undefined
          }
          const destination = latest.current.destination
          if (destination?.animal) {
            const signature = JSON.stringify(destination)
            if (!destinationMarker) {
              const element = document.createElement('div')
              element.style.pointerEvents = 'none'
              element.style.zIndex = '25'
              element.dataset.routeDestination = 'true'
              destinationMarker = {
                marker: new LibreMarker({ element, anchor: 'bottom' })
                  .setLngLat(destination.coordinates)
                  .addTo(instance),
                root: createRoot(element),
                signature: '',
              }
            }
            destinationMarker.marker.setLngLat(destination.coordinates)
            if (destinationMarker.signature !== signature) {
              destinationMarker.signature = signature
              destinationMarker.root.render(
                <RouteDestinationMarker entity={destination} />,
              )
            }
          } else if (destinationMarker) {
            destinationMarker.root.unmount()
            destinationMarker.marker.remove()
            destinationMarker = undefined
          }
        }
        instance.on('render', refresh)
        instance.on('sourcedata', () => {
          lastRefresh = 0
          instance?.triggerRepaint()
        })
        instance.on('moveend', () => {
          if (instance && !rasterActive.current) {
            const c = instance.getCenter()
            camera.current = {
              point: [c.lng, c.lat],
              zoom: instance.getZoom(),
            }
            setZoom(instance.getZoom())
          }
          updateBounds()
        })
        instance.on('idle', () => {
          if (
            !disposed &&
            !fallback &&
            instance?.getSource('places') &&
            instance.isSourceLoaded('places') &&
            instance.areTilesLoaded()
          )
            setPinsReady(true)
        })
        instance.getCanvas().addEventListener('keydown', (event) => {
          if (latest.current.picking && ['Enter', ' '].includes(event.key)) {
            event.preventDefault()
            if (!instance) return
            const host = instance.getContainer()
            const center = instance.unproject([
              host.clientWidth / 2,
              host.clientHeight / 2,
            ])
            latest.current.onPick?.([center.lng, center.lat])
          }
        })
        const clearCommunityHover = () => {
          setCommunityHover(null)
          if (instance) instance.getCanvas().style.cursor = latest.current.picking ? 'crosshair' : ''
        }
        instance.getCanvas().addEventListener('mouseleave', clearCommunityHover)
        instance.on('movestart', clearCommunityHover)
        instance.on('mousemove', (event) => {
          if (!instance || rasterActive.current || instance.isMoving() || !cityLevel(instance.getZoom()) || latest.current.picking || latest.current.destination || latest.current.overlayOpen || !instance.getLayer(COMMUNITY_FILL)) {
            clearCommunityHover()
            return
          }
          const feature = instance.queryRenderedFeatures(event.point, { layers: [COMMUNITY_FILL] })[0]
          const id = feature?.properties?.id
          if (!id) { clearCommunityHover(); return }
          const box = instance.getContainer()
          instance.getCanvas().style.cursor = 'pointer'
          setCommunityHover(communityHoverPoint(String(id), event.point.x, event.point.y, box.clientWidth, box.clientHeight))
        })
        instance.on('click', (event) => {
          if (latest.current.picking) {
            latest.current.onPick?.([event.lngLat.lng, event.lngLat.lat])
            return
          }
          if (
            latest.current.destination ||
            !instance || !cityLevel(instance.getZoom()) ||
            (event.originalEvent.target instanceof Element &&
              event.originalEvent.target.closest('button, a, [role="button"]'))
          )
            return
          if (instance?.getLayer(COMMUNITY_FILL)) {
            const feature = instance.queryRenderedFeatures(event.point, {
              layers: [COMMUNITY_FILL],
            })[0]
            if (feature?.properties?.id)
              latest.current.onCommunitySelect?.(String(feature.properties.id))
          }
        })
        const useSimple = () => {
          if (disposed || fallback) return
          fallback = true
          clearMarkers()
          setSimple(true)
          setError(
            'Detailed map unavailable. The street map, markers and previews remain available.',
          )
        }
        instance.on('style.load', () => {
          if (!instance || disposed) return
          clearTimeout(timer)
          for (const layer of instance.getStyle().layers ?? [])
            if (
              'source-layer' in layer &&
              layer['source-layer'] === 'building' &&
              (layer.maxzoom ?? 24) > 14
            )
              instance.setLayerZoomRange(
                layer.id,
                Math.max(14, layer.minzoom ?? 0),
                layer.maxzoom ?? 24,
              )
          if (!instance.getSource('places')) {
            instance.addSource('places', {
              type: 'geojson',
              data: collection(latest.current.places),
              cluster: latest.current.clusters !== false,
              clusterRadius: 85,
              clusterMaxZoom: 14,
            })
            instance.addLayer({
              id: 'place-source-anchor',
              type: 'circle',
              source: 'places',
              paint: { 'circle-radius': 1, 'circle-opacity': 0 },
            })
            instance.addSource('proximity', {
              type: 'geojson',
              data: circleFeature(latest.current.circle ?? null),
            })
            instance.addLayer({
              id: 'proximity-fill',
              type: 'fill',
              source: 'proximity',
              paint: { 'fill-color': '#147c79', 'fill-opacity': 0.09 },
            })
            instance.addLayer({
              id: 'proximity-line',
              type: 'line',
              source: 'proximity',
              paint: {
                'line-color': '#147c79',
                'line-width': 2,
                'line-dasharray': [3, 2],
              },
            })
            instance.addSource('accuracy', {
              type: 'geojson',
              data: circleFeature(null),
            })
            instance.addLayer({
              id: 'accuracy-fill',
              type: 'fill',
              source: 'accuracy',
              paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.08 },
            })
            instance.addSource('walking-route', {
              type: 'geojson',
              data: routeFeatures(latest.current.route ?? null),
            })
            instance.addLayer({
              id: 'walking-route-outline',
              type: 'line',
              source: 'walking-route',
              filter: ['==', ['get', 'kind'], 'route'],
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: {
                'line-color': '#ffffff',
                'line-width': 8,
                'line-opacity': 0.9,
              },
            })
            instance.addLayer({
              id: 'walking-route-line',
              type: 'line',
              source: 'walking-route',
              filter: ['==', ['get', 'kind'], 'route'],
              layout: { 'line-cap': 'round', 'line-join': 'round' },
              paint: { 'line-color': '#2563eb', 'line-width': 5 },
            })
            instance.addLayer({
              id: 'walking-route-connectors',
              type: 'line',
              source: 'walking-route',
              filter: ['==', ['get', 'kind'], 'connector'],
              paint: {
                'line-color': '#475569',
                'line-width': 2,
                'line-dasharray': [2, 2],
              },
            })
            instance.addSource('route-area', {
              type: 'geojson',
              data: circleFeature(null),
            })
            instance.addLayer({
              id: 'route-area-fill',
              type: 'fill',
              source: 'route-area',
              paint: { 'fill-color': '#f97316', 'fill-opacity': 0.08 },
            })
            instance.addLayer({
              id: 'route-area-line',
              type: 'line',
              source: 'route-area',
              paint: {
                'line-color': '#c2410c',
                'line-width': 1.5,
                'line-dasharray': [3, 2],
              },
            })
            instance.addSource('contribution-areas', {
              type: 'geojson',
              data: { type: 'FeatureCollection', features: [] },
            })
            instance.addLayer({
              id: 'contribution-fill',
              type: 'fill',
              source: 'contribution-areas',
              paint: { 'fill-color': '#2f8541', 'fill-opacity': 0.1 },
            })
            instance.addLayer({
              id: 'contribution-line',
              type: 'line',
              source: 'contribution-areas',
              paint: {
                'line-color': '#2f8541',
                'line-width': 1,
                'line-opacity': 0.5,
              },
            })
          }
          updateCommunityLayers(
            instance,
            latest.current.communities ?? EMPTY_COMMUNITIES,
            latest.current.selectedCommunity?.id,
          )
          setReady(true)
          updateBounds()
          timer = setTimeout(() => {
            if (
              !disposed &&
              instance &&
              !instance.isSourceLoaded('openmaptiles')
            )
              useSimple()
          }, 15000)
        })
        timer = setTimeout(() => {
          if (!disposed && !instance?.isStyleLoaded()) useSimple()
        }, 15000)
        let failures = 0
        instance.on('error', (event) => {
          if (
            /openfreemap|map-assets|Failed to fetch|NetworkError|AJAXError|HTTP/.test(
              String(event.error?.message || ''),
            ) &&
            ++failures >= 4
          )
            useSimple()
        })
        resize = new ResizeObserver(() => instance?.resize())
        resize.observe(host.current)
        instance.once('remove', () => {
          clearProvinces()
          clearMarkers()
          viewerMarker?.root.unmount()
          viewerMarker?.marker.remove()
          destinationMarker?.root.unmount()
          destinationMarker?.marker.remove()
        })
      })
      .catch(() => {
        if (!disposed) {
          setSimple(true)
          setError('Detailed map unavailable. Showing the street map.')
        }
      })
    return () => {
      disposed = true
      clearTimeout(timer)
      clearTimeout(moveTimer)
      resize?.disconnect()
      map.current = null
      invalidate.current = () => {}
      instance?.remove()
    }
  }, [attempt])
  useEffect(() => {
    if (ready && map.current)
      updateCommunityLayers(
        map.current,
        props.communities ?? EMPTY_COMMUNITIES,
        props.selectedCommunity?.id,
      )
  }, [props.communities, props.selectedCommunity?.id, ready])
  useEffect(() => {
    if (props.picking || props.destination || props.overlayOpen || simple || !cityLevel(zoom)) setCommunityHover(null)
  }, [props.picking, props.destination, props.overlayOpen, simple, zoom])
  useEffect(() => {
    if (map.current && ready) highlightCommunity(map.current, props.selectedCommunity?.id, communityHover?.id)
  }, [props.selectedCommunity?.id, communityHover?.id, props.communities, ready])
  useEffect(() => {
    const area = props.selectedCommunity
    const instance = map.current
    if (!ready || !instance || !area) return
    const bounds = area.properties.bounds
    instance.fitBounds(
      [
        [bounds[0], bounds[1]],
        [bounds[2], bounds[3]],
      ],
      {
        padding: detailPadding(instance, true, props.sidebarOpen),
        absolutePadding: true,
        maxZoom: 16,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 250,
      },
    )
  }, [
    props.selectedCommunity?.id,
    props.communityFocus,
    props.sidebarOpen,
    ready,
  ])
  useEffect(() => {
    invalidate.current()
    ;(map.current?.getSource('places') as GeoJSONSource | undefined)?.setData(
      collection(props.places),
    )
  }, [props.places, ready])
  useEffect(() => {
    const source = map.current?.getSource('places') as GeoJSONSource | undefined
    if (source) {
      invalidate.current()
      void source
        .setClusterOptions({ cluster: props.clusters !== false })
        .catch(() => {})
    }
  }, [props.clusters, ready])
  useEffect(() => {
    ;(
      map.current?.getSource('proximity') as GeoJSONSource | undefined
    )?.setData(circleFeature(props.circle ?? null))
  }, [props.circle, ready])
  useEffect(() => {
    const features = props.reputationLayer
      ? props.places
          .filter((e) => (e.contribution?.verifiedCount ?? 0) > 0)
          .flatMap(
            (e) =>
              circleFeature({
                center: e.coordinates,
                radius: 250,
                label: e.name,
              }).features,
          )
      : []
    const source = map.current?.getSource('contribution-areas') as
      GeoJSONSource | undefined
    source?.setData({ type: 'FeatureCollection', features })
  }, [props.places, props.reputationLayer, ready])
  useEffect(() => {
    const viewer = props.viewer
    ;(map.current?.getSource('accuracy') as GeoJSONSource | undefined)?.setData(
      circleFeature(
        viewer && viewer.accuracy !== null && viewer.accuracy < 10000
          ? {
              center: viewer.coordinates,
              radius: Math.max(10, viewer.accuracy),
              label: 'Location accuracy',
            }
          : null,
      ),
    )
    map.current?.triggerRepaint()
  }, [props.viewer, ready])
  useEffect(() => {
    if (!props.selected || !ready) return
    map.current?.easeTo({
      center: props.selected.coordinates,
      zoom: Math.max(map.current.getZoom(), SELECTED_ITEM_ZOOM),
      padding: detailPadding(
        map.current,
        !!props.selected || !!props.overlayOpen,
        props.sidebarOpen,
      ),
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 250,
    })
  }, [
    props.selected?.id,
    props.selected?.coordinates[0],
    props.selected?.coordinates[1],
    props.sidebarOpen,
    ready,
  ])
  useEffect(() => {
    invalidate.current()
  }, [props.selected?.id, ready])
  useEffect(() => {
    invalidate.current()
  }, [props.destination, ready])
  useEffect(() => {
    if (props.focus)
      map.current?.easeTo({
        center: props.focus.point,
        zoom: Math.max(map.current.getZoom(), props.focus.zoom ?? (props.selected ? SELECTED_ITEM_ZOOM : 15)),
        padding: detailPadding(
          map.current,
          !!props.selected || !!props.overlayOpen,
          props.sidebarOpen,
        ),
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 250,
      })
  }, [props.focus?.id, ready])
  useEffect(() => {
    if (ready && !props.selected && !props.overlayOpen)
      map.current?.easeTo({
        padding: detailPadding(map.current, false, props.sidebarOpen),
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 140,
      })
  }, [props.overlayOpen, props.selected?.id, props.sidebarOpen, ready])
  useEffect(() => {
    if (map.current)
      map.current.getCanvas().style.cursor = props.picking ? 'crosshair' : ''
  }, [props.picking, ready])
  useEffect(() => {
    const instance = map.current
    if (!instance || !ready) return
    ;(
      instance.getSource('walking-route') as GeoJSONSource | undefined
    )?.setData(routeFeatures(props.route ?? null))
    const radius = props.selected?.approximateRadiusMeters
    ;(instance.getSource('route-area') as GeoJSONSource | undefined)?.setData(
      circleFeature(
        props.route && radius
          ? {
              center: props.route.destination,
              radius,
              label: 'Approximate destination area',
            }
          : null,
      ),
    )
    if (!props.route) return
    const coordinates = [
      ...props.route.coordinates,
      props.route.origin,
      props.route.destination,
    ]
    const xs = coordinates.map((p) => p[0]),
      ys = coordinates.map((p) => p[1])
    instance.fitBounds(
      [
        [Math.min(...xs), Math.min(...ys)],
        [Math.max(...xs), Math.max(...ys)],
      ],
      {
        absolutePadding: true,
        padding: detailPadding(instance, true, props.sidebarOpen),
        maxZoom: 17,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 250,
      },
    )
  }, [props.route, props.routeFocus, props.sidebarOpen, ready])
  useEffect(() => {
    const canvas = map.current?.getCanvas()
    if (canvas) canvas.dataset.activeMap = String(!simple && pinsReady)
    map.current
      ?.getContainer()
      .querySelectorAll<HTMLElement>('.maplibregl-marker')
      .forEach((marker) => {
        marker.inert =
          !!props.picking && marker.dataset.routeDestination !== 'true'
      })
    map.current?.triggerRepaint()
  }, [simple, pinsReady, props.picking])
  useEffect(() => { invalidate.current()
    map.current?.triggerRepaint() }, [props.provinces, props.summaryKinds])
  function fitPlaces() {
    const instance = map.current
    if (!instance || !props.places.length) return
    const xs = props.places.map((p) => p.coordinates[0]),
      ys = props.places.map((p) => p.coordinates[1])
    instance.fitBounds(
      [
        [Math.min(...xs), Math.min(...ys)],
        [Math.max(...xs), Math.max(...ys)],
      ],
      {
        absolutePadding: true,
        padding: detailPadding(instance, false, props.sidebarOpen),
        maxZoom: 15,
        duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : 220,
      },
    )
  }
  return (
    <div className="isolate relative h-full min-h-64 w-full overflow-hidden bg-muted">
      <div ref={host} className="h-full w-full" />
      {!simple && pinsReady && cityLevel(zoom) && !props.picking && !props.destination && !props.overlayOpen && <CommunityHoverPreview statistics={props.communityStatistics} point={communityHover} area={props.communities?.features.find((area) => area.id === communityHover?.id)} />}
      {props.picking && (
        <MapPin
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-20 size-7 -translate-x-1/2 -translate-y-full fill-card text-primary drop-shadow"
        />
      )}
      {(!pinsReady || simple) && (
        <div className="absolute inset-0 z-[1]">
          <SimplePlaceMap
            key={attempt}
            {...props}
            initialCamera={camera.current}
            onCamera={onRasterCamera}
          />
        </div>
      )}
      {!simple && pinsReady && (
        <MapZoomControls
          displaced={!!props.overlayOpen}
          actions={props.controls}
          zoom={zoom}
          hasPlaces={!!props.places.length}
          onIn={() =>
            map.current?.zoomIn({
              duration: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 0
                : 160,
            })
          }
          onOut={() =>
            map.current?.zoomOut({
              duration: window.matchMedia('(prefers-reduced-motion: reduce)')
                .matches
                ? 0
                : 160,
            })
          }
          onFit={fitPlaces}
        />
      )}
      {error && (
        <div className="absolute left-[var(--map-overlay-left)] top-80 z-10 lg:top-36 flex w-60 max-w-[calc(100%-5rem)] flex-col gap-2 rounded-md border bg-card p-3 text-xs shadow-sm">
          <p className="flex-1" role="status">
            {error}
          </p>
          <Button
            className="text-foreground"
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSimple(false)
              setAttempt((n) => n + 1)
            }}
          >
            <RotateCw className="size-3.5" />
            Retry
          </Button>
        </div>
      )}
    </div>
  )
}
