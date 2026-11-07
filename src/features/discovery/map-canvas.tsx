'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useEffect, useState } from 'react'
import {
  useAppRouter as useRouter,
  usePageNavigation,
} from '@/components/layout/page-navigation'
import { APIProvider, Map, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import { Button } from '@/components/ui/button'
import type { DiscoveryResult } from './types'
import { NeighborhoodBrowse } from './neighborhood-browse'
type Feature = DiscoveryResult['features'][number]
function Markers({
  features,
  onSelect,
}: {
  features: Feature[]
  onSelect: (f: Feature) => void
}) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    const markers = features.map((f) => {
      const m = new google.maps.Marker({
        position: { lat: f.location.latitude, lng: f.location.longitude },
        title: `${f.title} — approximate area`,
      })
      m.addListener('click', () => onSelect(f))
      return m
    })
    const cluster = new MarkerClusterer({ map, markers })
    return () => {
      cluster.clearMarkers()
      cluster.setMap(null)
      markers.forEach((m) => {
        google.maps.event.clearInstanceListeners(m)
        m.setMap(null)
      })
    }
  }, [map, features, onSelect])
  return null
}
function Controls() {
  const map = useMap(),
    [error, setError] = useState(''),
    navigation = usePageNavigation(),
    router = useRouter()
  function search() {
    if (!map?.getBounds() || !map.getCenter()) return
    const c = map.getCenter()!,
      b = map.getBounds()!,
      ne = b.getNorthEast(),
      sw = b.getSouthWest(),
      q = new URLSearchParams(window.location.search)
    q.delete('cursor')
    q.set('latitude', String(c.lat()))
    q.set('longitude', String(c.lng()))
    q.set(
      'bounds',
      JSON.stringify({
        north: ne.lat(),
        east: ne.lng(),
        south: sw.lat(),
        west: sw.lng(),
      }),
    )
    q.set('radius', '100000')
    router.push(`/explore?${q}`)
  }
  function locate() {
    if (!navigator.geolocation) {
      setError(
        'Your browser does not support location. Search by neighborhood instead.',
      )
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        map?.panTo({ lat: p.coords.latitude, lng: p.coords.longitude })
        map?.setZoom(14)
      },
      () =>
        setError(
          'Location was unavailable. You can still pan the map or use the animal list.',
        ),
      { timeout: 10000, maximumAge: 60000 },
    )
  }
  return (
    <div
      className={
        'workflow-actions flex items-center gap-3 flex-wrap [margin:0.75rem_0] [.discovery-map_&_p]:m-0 [.discovery-map_&_p]:text-sm [.discovery-map_&_p]:text-muted-foreground max-[48rem]:[&_>_*]:max-w-full [.achievement-review-card_&]:mt-4 [.adoption-story_&]:gap-2.5 [.adoption-story_&_[data-slot=button]]:[flex:1_1_9rem]'
      }
    >
      <Button
        variant="outline"
        disabled={navigation?.pending}
        onClick={() => void search()}
      >
        {navigation?.pending ? 'Searching…' : 'Search this map area'}
      </Button>
      <Button variant="outline" onClick={locate}>
        Use my location
      </Button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
export default function MapCanvas({
  features,
  center,
}: {
  features: Feature[]
  center: { latitude: number; longitude: number }
}) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [rows, setRows] = useState(features),
    [selected, setSelected] = useState<Feature | null>(null),
    [error, setError] = useState(false),
    [loaded, setLoaded] = useState(false)
  useEffect(() => {
    setRows(features)
    setSelected(null)
  }, [features])
  useEffect(() => {
    if (!key || loaded) return
    const timeout = setTimeout(() => setError(true), 20000)
    return () => clearTimeout(timeout)
  }, [key, loaded])
  if (!key || error)
    return <NeighborhoodBrowse features={features} unavailable={!!key} />
  return (
    <APIProvider
      apiKey={key}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
    >
      <Map
        className={
          'map-canvas w-full h-104 [border:1px_solid_#ede5d8] rounded-2xl overflow-hidden max-[48rem]:h-88'
        }
        defaultCenter={{ lat: center.latitude, lng: center.longitude }}
        defaultZoom={14}
        gestureHandling="cooperative"
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
        disableDefaultUI={false}
      >
        <Markers features={rows} onSelect={setSelected} />
        {selected && (
          <InfoWindow
            position={{
              lat: selected.location.latitude,
              lng: selected.location.longitude,
            }}
            onCloseClick={() => setSelected(null)}
          >
            <strong>{selected.title}</strong>
            <p>{selected.location.neighborhood} · approximate area</p>
            <Link
              href={
                selected.href ??
                `/search?q=${encodeURIComponent(selected.title)}&kind=${selected.ref.kind}`
              }
            >
              Find this story
            </Link>
          </InfoWindow>
        )}
      </Map>
      <Controls />
      <div
        className={
          'map-results flex flex-wrap gap-1 max-h-48 overflow-auto [margin:1rem_0]'
        }
        aria-label="Map feature selection"
      >
        {rows.map((f, i) => (
          <Button
            variant="ghost"
            key={`${f.ref.kind}:${f.ref.id}:${i}`}
            onClick={() => setSelected(f)}
          >
            {f.title} · {f.ref.kind}
          </Button>
        ))}
      </div>
    </APIProvider>
  )
}
