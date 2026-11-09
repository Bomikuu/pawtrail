import { CITY_MIN_ZOOM, cityLevel, type ProvinceSummary } from '@/features/neighborhood/game/discovery/region-stats'
import { ProvinceCountMarker } from './community-metrics'
import { discoveryPadding, SELECTED_ITEM_ZOOM } from './map-layout'
import { markerHasSelection } from '@/features/neighborhood/game/discovery/members'
import { CommunityHoverPreview, communityHoverPoint, type CommunityHover } from './community-hover'
import { communityAt, communityColor, EMPTY_COMMUNITIES } from '@/features/neighborhood/game/discovery/communities'
import { routeFeatures } from '@/features/neighborhood/game/discovery/route-features'
import { useEffect, useMemo, useRef, useState } from 'react'

import { MapZoomControls, type MapCamera } from './zoom-controls'
import { COMMUNITY_START } from '@/features/neighborhood/game/community'
import { radiusRing } from '@/features/neighborhood/game/discovery/geo'
import type { Point, MapEntity } from '@/features/neighborhood/game/discovery/types'
import type { DiscoveryCanvasProps } from './map-canvas'
import {
  EntityMarkerGroup,
  GeographicMarkerGroup,
  RouteDestinationMarker,
  ViewerMarker,
} from './markers'
const TILE = 256
function project(point: readonly number[], zoom: number) {
  const size = TILE * 2 ** zoom,
    lat = (Math.max(-85, Math.min(85, point[1])) * Math.PI) / 180
  return {
    x: ((point[0] + 180) / 360) * size,
    y: ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * size,
  }
}
function unproject(x: number, y: number, zoom: number): Point {
  const size = TILE * 2 ** zoom,
    n = Math.PI * (1 - (2 * y) / size)
  return [
    (((((x / size) * 360) % 360) + 360) % 360) - 180,
    (180 / Math.PI) * Math.atan(Math.sinh(n)),
  ]
}
export function SimplePlaceMap(
  props: DiscoveryCanvasProps & {
    initialCamera?: MapCamera
    onCamera?: (camera: MapCamera) => void
  },
) {
  const { places, selected, onSelect, onCluster, onBounds } = props
  const host = useRef<HTMLDivElement>(null)
  const drag = useRef<{
    x: number
    y: number
    cx: number
    cy: number
    moved: boolean
  } | null>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [center, setCenter] = useState<Point>(
    props.initialCamera?.point ?? COMMUNITY_START,
  )
  const [zoom, setZoom] = useState(
    Math.max(3, Math.min(18, Math.round(props.initialCamera?.zoom ?? 12))),
  )
  const [tileError, setTileError] = useState(false)
  const [communityHover, setCommunityHover] = useState<CommunityHover | null>(null)
  useEffect(() => {
    if (!host.current) return
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.max(1, entry.contentRect.width),
        height: Math.max(1, entry.contentRect.height),
      }),
    )
    observer.observe(host.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    props.onCamera?.({ point: center, zoom })
  }, [center, zoom, props.onCamera])
  useEffect(() => {
    if (selected) {
      const z = Math.max(zoom, SELECTED_ITEM_ZOOM)
      setCenter(centerFor(selected.coordinates, z))
      setZoom(z)
    }
  }, [
    selected?.id,
    selected?.coordinates[0],
    selected?.coordinates[1],
    props.sidebarOpen,
  ])
  useEffect(() => {
    if (props.focus) {
      const z = Math.max(zoom, Math.round(props.focus.zoom ?? (selected ? SELECTED_ITEM_ZOOM : 15)))
      setCenter(centerFor(props.focus.point, z))
      setZoom(z)
    }
  }, [props.focus?.id])
  useEffect(() => {
    if (!props.route) return
    const points = [
      ...props.route.coordinates,
      props.route.origin,
      props.route.destination,
    ].map((p) => project(p, 0))
    const xs = points.map((p) => p.x),
      ys = points.map((p) => p.y)
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys)
    const padding = discoveryPadding(
      size.width,
      size.height,
      window.innerWidth >= 1024,
      true,
      !!props.sidebarOpen,
    )
    const availableWidth = Math.max(
      100,
      size.width - padding.left - padding.right,
    )
    const availableHeight = Math.max(
      100,
      size.height - padding.top - padding.bottom,
    )
    const z = Math.max(
      3,
      Math.min(
        17,
        Math.floor(
          Math.log2(
            Math.min(
              availableWidth / Math.max(0.001, x1 - x0),
              availableHeight / Math.max(0.001, y1 - y0),
            ),
          ),
        ),
      ),
    )
    setCenter(centerFor(unproject((x0 + x1) / 2, (y0 + y1) / 2, 0), z))
    setZoom(z)
  }, [
    props.route,
    props.routeFocus,
    props.sidebarOpen,
    size.width,
    size.height,
  ])
  useEffect(() => {
    if (!props.selectedCommunity) return
    const [west, south, east, north] = props.selectedCommunity.properties.bounds
    const a = project([west, north], 0),
      b = project([east, south], 0)
    const padding = discoveryPadding(
      size.width,
      size.height,
      window.innerWidth >= 1024,
      true,
      !!props.sidebarOpen,
    )
    const width = Math.max(80, size.width - padding.left - padding.right)
    const height = Math.max(80, size.height - padding.top - padding.bottom)
    const z = Math.max(
      3,
      Math.min(
        16,
        Math.floor(
          Math.log2(
            Math.min(
              width / Math.max(0.001, b.x - a.x),
              height / Math.max(0.001, b.y - a.y),
            ),
          ),
        ),
      ),
    )
    setCenter(centerFor(unproject((a.x + b.x) / 2, (a.y + b.y) / 2, 0), z))
    setZoom(z)
  }, [
    props.selectedCommunity?.id,
    props.communityFocus,
    props.sidebarOpen,
    size.width,
    size.height,
  ])
  function centerFor(location: Point, z: number): Point {
    const p = project(location, z)
    const padding = discoveryPadding(
      size.width,
      size.height,
      window.innerWidth >= 1024,
      !!selected || !!props.overlayOpen,
      !!props.sidebarOpen,
    )
    return unproject(
      p.x + (padding.right - padding.left) / 2,
      p.y + (padding.bottom - padding.top) / 2,
      z,
    )
  }
  const point = project(center, zoom),
    left = point.x - size.width / 2,
    top = point.y - size.height / 2
  useEffect(() => {
    const sw = unproject(left, top + size.height, zoom),
      ne = unproject(left + size.width, top, zoom)
    onBounds(
      sw[0] <= ne[0] ? [sw[0], sw[1], ne[0], ne[1]] : [-180, sw[1], 180, ne[1]],
    )
  }, [center, zoom, size, onBounds])
  const communityPaths = useMemo(
    () =>
      (props.communities?.features ?? []).map((feature) => {
        const polygons =
          feature.geometry.type === 'Polygon'
            ? [feature.geometry.coordinates]
            : feature.geometry.coordinates
        const path = polygons
          .flatMap((rings) =>
            rings.map(
              (ring) =>
                ring
                  .map((coordinate, i) => {
                    const p = project(coordinate, zoom)
                    return (
                      (i ? 'L' : 'M') + p.x.toFixed(2) + ' ' + p.y.toFixed(2)
                    )
                  })
                  .join(' ') + ' Z',
            ),
          )
          .join(' ')
        return { id: feature.id, path, color: communityColor(feature) }
      }),
    [props.communities, zoom],
  )
  const tiles = useMemo(() => {
    const result: { key: string; url: string; x: number; y: number }[] = [],
      count = 2 ** zoom
    const xs = Array.from(
      { length: Math.ceil(size.width / TILE) + 2 },
      (_, i) => Math.floor(left / TILE) + i,
    )
    const ys = Array.from(
      { length: Math.ceil(size.height / TILE) + 2 },
      (_, i) => Math.floor(top / TILE) + i,
    )
    for (const x of xs)
      for (const y of ys) {
        if (y < 0 || y >= count) continue
        const wrapped = ((x % count) + count) % count
        result.push({
          key: zoom + ':' + x + ':' + y,
          url:
            'https://tile.openstreetmap.org/' +
            zoom +
            '/' +
            wrapped +
            '/' +
            y +
            '.png',
          x: x * TILE - left,
          y: y * TILE - top,
        })
      }
    return result
  }, [left, top, size, zoom])
  const destinationPoint = props.destination
    ? project(props.destination.coordinates, zoom)
    : null
  const groups = useMemo(() => {
    const result: { x: number; y: number; places: MapEntity[] }[] = []
    for (const place of places) {
      const p = project(place.coordinates, zoom),
        x = p.x - left,
        y = p.y - top
      if (x < -60 || y < -60 || x > size.width + 60 || y > size.height + 60)
        continue
      const group =
        props.clusters !== false && place.id !== selected?.id
          ? result.find(
              (g) =>
                g.places.every((e) => e.id !== selected?.id) &&
                Math.hypot(g.x - x, g.y - y) < 120,
            )
          : undefined
      if (group) {
        const count = group.places.length
        group.x = (group.x * count + x) / (count + 1)
        group.y = (group.y * count + y) / (count + 1)
        group.places.push(place)
      } else result.push({ x, y, places: [place] })
    }
    return result
  }, [places, left, top, size, zoom, props.clusters, selected?.id])
  function fitProvince(summary: ProvinceSummary) {
    const b=summary.bounds
    const low=project([b[0],b[1]],0), high=project([b[2],b[3]],0)
    const padding=discoveryPadding(size.width,size.height,window.innerWidth>=1024,false,!!props.sidebarOpen)
    const z=Math.max(3,Math.min(10,Math.floor(Math.log2(Math.min(Math.max(120,size.width-padding.left-padding.right)/Math.max(0.000001,Math.abs(high.x-low.x)),Math.max(120,size.height-padding.top-padding.bottom)/Math.max(0.000001,Math.abs(high.y-low.y)))))))
    setCenter(centerFor([(b[0]+b[2])/2,(b[1]+b[3])/2],z))
    setZoom(z)
  }
  const provinceMode=zoom<CITY_MIN_ZOOM && !!props.provinces?.length && !props.picking && !props.destination && !props.selectedCommunity
  function fit() {
    if (!places.length) return
    const points = places.map((p) => project(p.coordinates, 0)),
      xs = points.map((p) => p.x),
      ys = points.map((p) => p.y),
      x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys)
    setCenter(unproject((x0 + x1) / 2, (y0 + y1) / 2, 0))
    setZoom(
      Math.max(
        3,
        Math.min(
          14,
          Math.floor(
            Math.log2(
              Math.min(
                Math.max(80, size.width - 100) / Math.max(1, x1 - x0),
                Math.max(80, size.height - 100) / Math.max(1, y1 - y0),
              ),
            ),
          ),
        ),
      ),
    )
  }
  function polygon(center: Point, radius: number) {
    return radiusRing(center, radius)
      .map((p) => {
        const pixel = project(p, zoom)
        return pixel.x - left + ',' + (pixel.y - top)
      })
      .join(' ')
  }
  const viewer = props.viewer ? project(props.viewer.coordinates, zoom) : null
  return (
    <div
      ref={host}
      className={
        'absolute inset-0 touch-none overflow-hidden bg-[#e7ecdf] [image-rendering:auto] ' +
        (props.picking ? 'cursor-crosshair' : communityHover && cityLevel(zoom) && !props.destination && !props.overlayOpen ? 'cursor-pointer' : 'cursor-grab')
      }
      role="region"
      data-active-map="true"
      tabIndex={0}
      aria-label="Street map with community discovery"
      onKeyDown={(event) => {
        const directions: Partial<Record<string, [number, number]>> = {
          ArrowLeft: [-48, 0],
          ArrowRight: [48, 0],
          ArrowUp: [0, -48],
          ArrowDown: [0, 48],
        }
        const direction = directions[event.key]
        if (direction) {
          event.preventDefault()
          setCenter(
            unproject(point.x + direction[0], point.y + direction[1], zoom),
          )
        }
        if (props.picking && ['Enter', ' '].includes(event.key)) {
          event.preventDefault()
          props.onPick?.(center)
        }
      }}
      onPointerLeave={() => setCommunityHover(null)}
      onPointerDown={(e) => {
        setCommunityHover(null)
        if (e.button !== 0) return
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = {
          x: e.clientX,
          y: e.clientY,
          cx: point.x,
          cy: point.y,
          moved: false,
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (cityLevel(zoom) && !d && !props.picking && !props.destination && !props.overlayOpen && e.pointerType !== 'touch' && !(e.target instanceof Element && e.target.closest('button, a, [role="button"]'))) {
          const box = e.currentTarget.getBoundingClientRect()
          const area = communityAt(unproject(left + e.clientX - box.left, top + e.clientY - box.top, zoom), props.communities ?? EMPTY_COMMUNITIES)
          setCommunityHover(area ? communityHoverPoint(area.id, e.clientX - box.left, e.clientY - box.top, size.width, size.height) : null)
        } else setCommunityHover(null)
        if (d) {
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) d.moved = true
          if (d.moved)
            setCenter(
              unproject(
                d.cx - (e.clientX - d.x),
                d.cy - (e.clientY - d.y),
                zoom,
              ),
            )
        }
      }}
      onPointerUp={(e) => {
        const d = drag.current
        if (
          e.target instanceof Element &&
          e.target.closest('button, a, [role="button"]')
        ) {
          drag.current = null
          return
        }
        if (props.picking && d && !d.moved) {
          const box = e.currentTarget.getBoundingClientRect()
          props.onPick?.(
            unproject(
              left + e.clientX - box.left,
              top + e.clientY - box.top,
              zoom,
            ),
          )
        } else if (cityLevel(zoom) && !props.destination && d && !d.moved) {
          const box = e.currentTarget.getBoundingClientRect()
          const location = unproject(
            left + e.clientX - box.left,
            top + e.clientY - box.top,
            zoom,
          )
          const area = communityAt(
            location,
            props.communities ?? EMPTY_COMMUNITIES,
          )
          if (area) props.onCommunitySelect?.(area.id)
        }
        drag.current = null
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.url}
            alt=""
            draggable={false}
            className="absolute h-64 w-64 max-w-none select-none [image-rendering:auto]"
            style={{ left: tile.x, top: tile.y }}
            onError={() => setTileError(true)}
          />
        ))}
      </div>
      <svg
        className="pointer-events-none absolute inset-0 size-full"
        aria-hidden="true"
      >
        <g transform={`translate(${-left} ${-top})`}>
          {cityLevel(zoom) && communityPaths.map((area) => {
            const selected = area.id === props.selectedCommunity?.id
            const hovered = !props.picking && !props.destination && !props.overlayOpen && area.id === communityHover?.id
            return <g key={area.id}>
              <path d={area.path} fill={area.color} fillOpacity={selected ? 0.035 : hovered ? 0.06 : 0.008} fillRule="evenodd" stroke="#ffffff" strokeOpacity={0.65} strokeWidth={selected ? 3.2 : hovered ? 3 : 2} />
              <path d={area.path} fill="none" fillRule="evenodd" stroke={area.color} strokeWidth={selected ? 1.8 : hovered ? 1.6 : 1} />
            </g>
          })}
        </g>
        {props.route && props.selected?.approximateRadiusMeters && (
          <polygon
            points={polygon(
              props.route.destination,
              props.selected.approximateRadiusMeters,
            )}
            fill="#f9731614"
            stroke="#c2410c"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />
        )}
        {routeFeatures(props.route ?? null).features.map((feature, index) => {
          const points = feature.geometry.coordinates
            .map((coordinate) => {
              const p = project(coordinate, zoom)
              return `${p.x - left},${p.y - top}`
            })
            .join(' ')
          return (
            <g key={index}>
              {feature.properties.kind === 'route' && (
                <polyline
                  points={points}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              <polyline
                points={points}
                fill="none"
                stroke={
                  feature.properties.kind === 'route' ? '#2563eb' : '#475569'
                }
                strokeWidth={feature.properties.kind === 'route' ? 5 : 2}
                strokeDasharray={
                  feature.properties.kind === 'route' ? undefined : '4 4'
                }
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          )
        })}
        {props.circle && (
          <polygon
            points={polygon(props.circle.center, props.circle.radius)}
            fill="#147c7918"
            stroke="#147c79"
            strokeWidth="2"
            strokeDasharray="5 4"
          />
        )}
        {props.viewer &&
          props.viewer.accuracy !== null &&
          props.viewer.accuracy < 10000 && (
            <polygon
              points={polygon(
                props.viewer.coordinates,
                Math.max(10, props.viewer.accuracy),
              )}
              fill="#2563eb12"
              stroke="#2563eb"
              strokeWidth="1"
            />
          )}
        {props.reputationLayer &&
          places
            .filter((e) => (e.contribution?.verifiedCount ?? 0) > 0)
            .map((e) => (
              <polygon
                key={e.id}
                points={polygon(e.coordinates, 250)}
                fill="#45674614"
                stroke="#45674666"
                strokeWidth="1"
              />
            ))}
      </svg>
      {!provinceMode && groups.map((group) => (
        <div
          key={group.places
            .map((p) => p.id)
            .sort()
            .join('|')}
          inert={props.picking}
          className={'absolute -translate-x-1/2 -translate-y-1/2 ' + (group.places.some(entity => markerHasSelection(entity, selected?.id)) ? 'z-[24]' : 'z-10')}
          style={{ left: group.x, top: group.y }}
        >
          {group.places.length > 1 ? (
            <GeographicMarkerGroup
              entities={group.places}
              selectedId={selected?.id}
              onAnimalSelect={onSelect}
              onHover={props.onHover}
              onSelect={() => {
                setCenter(unproject(left + group.x, top + group.y, zoom))
                setZoom((z) => Math.min(18, z + 2))
                onCluster(group.places.map((p) => p.id))
              }}
            />
          ) : (
            <EntityMarkerGroup
              entity={group.places[0]}
              selectedId={selected?.id}
              onSelect={onSelect}
              onHover={props.onHover}
            />
          )}
        </div>
      ))}
      {props.destination?.animal && destinationPoint && (
        <div
          className="pointer-events-none absolute z-[25] -translate-x-1/2 -translate-y-full"
          style={{
            left: destinationPoint.x - left,
            top: destinationPoint.y - top,
          }}
        >
          <RouteDestinationMarker entity={props.destination} />
        </div>
      )}
      {viewer && props.viewer && (
        <div
          inert={props.picking}
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
          style={{ left: viewer.x - left, top: viewer.y - top }}
        >
          <ViewerMarker
            viewer={props.viewer}
            onSelect={() => props.onViewer?.()}
          />
        </div>
      )}
      {provinceMode && props.provinces?.map(summary => { const pixel=project(summary.center,zoom)
        return <div key={summary.id} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{left:pixel.x-left,top:pixel.y-top}}><ProvinceCountMarker summary={summary} kinds={props.summaryKinds ?? []} onChoose={()=>fitProvince(summary)} /></div> })}
      {cityLevel(zoom) && !props.picking && !props.destination && !props.overlayOpen && <CommunityHoverPreview statistics={props.communityStatistics} point={communityHover} area={props.communities?.features.find((area) => area.id === communityHover?.id)} />}
      <MapZoomControls
        displaced={!!props.overlayOpen}
        actions={props.controls}
        zoom={zoom}
        hasPlaces={!!places.length}
        onIn={() => setZoom((z) => Math.min(18, z + 1))}
        onOut={() => setZoom((z) => Math.max(3, z - 1))}
        onFit={fit}
      />

      <div className="absolute bottom-2 left-2 z-10 max-w-[calc(100%-12rem)] rounded-md bg-card px-2 py-1 text-[10px] text-muted-foreground">
        {tileError
          ? 'Street tiles unavailable · markers remain interactive'
          : 'Street map · drag to move'}
      </div>
      <div
        className="absolute bottom-0 right-0 z-20 rounded-tl-md bg-white/95 px-2 py-1 text-[10px] text-[#38271e]"
        onPointerDown={(e) => e.stopPropagation()}
      >
        ©{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          OpenStreetMap contributors
        </a>
      </div>
    </div>
  )
}
