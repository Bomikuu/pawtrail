'use client'
import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import 'maplibre-gl/dist/maplibre-gl.css'

export function ReportedAreaMap({ latitude, longitude, radius }: { latitude: number; longitude: number; radius: number }) {
  const container = useRef<HTMLDivElement>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let cancelled = false
    let map: import('maplibre-gl').Map | undefined
    void import('maplibre-gl').then((maplibre) => {
      if (!container.current || cancelled) return
      const coordinates = Array.from({ length: 65 }, (_, index) => {
        const angle = index / 64 * Math.PI * 2
        return [longitude + Math.cos(angle) * radius / (111320 * Math.max(0.05, Math.cos(latitude * Math.PI / 180))), latitude + Math.sin(angle) * radius / 111320]
      })
      const currentMap = new maplibre.Map({ container: container.current, style: 'https://tiles.openfreemap.org/styles/liberty', center: [longitude, latitude], zoom: 13, interactive: false, attributionControl: false })
      map = currentMap
      currentMap.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right')
      currentMap.on('load', () => {
        if (cancelled) return
        currentMap.addSource('reported-area', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coordinates] } } })
        currentMap.addLayer({ id: 'reported-area-fill', type: 'fill', source: 'reported-area', paint: { 'fill-color': '#f97316', 'fill-opacity': 0.18 } })
        currentMap.addLayer({ id: 'reported-area-outline', type: 'line', source: 'reported-area', paint: { 'line-color': '#c2410c', 'line-width': 2, 'line-dasharray': [3, 2] } })
        currentMap.resize()
      })
      currentMap.on('error', () => { if (!cancelled) setError(true) })
    }).catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true; map?.remove() }
  }, [latitude, longitude, radius])
  return <div className="space-y-2"><div className="relative overflow-hidden rounded-xl border bg-muted"><div ref={container} className="h-60 w-full" role="img" aria-label="Approximate historical reported area, not the animal’s current position" />{error && <div className="absolute inset-0 flex items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground"><span><MapPin className="mx-auto mb-2 size-6" />The map could not load. The approximate report details remain below.</span></div>}</div><p className="text-xs leading-relaxed text-muted-foreground">Generalized reported area, about {Math.round(radius)} m radius. This shows a historical report, not live tracking or a guaranteed current range.</p></div>
}
