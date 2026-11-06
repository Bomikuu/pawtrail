'use client'
import dynamic from 'next/dynamic'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DiscoveryResult } from './types'
import { NeighborhoodBrowse } from './neighborhood-browse'
const MapCanvas = dynamic(() => import('./map-canvas'), {
  ssr: false,
  loading: () => <p role="status">Loading the map…</p>,
})
export function DiscoveryMap({
  features,
  center,
}: {
  features: DiscoveryResult['features']
  center: { latitude: number; longitude: number }
}) {
  const mapAvailable = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [open, setOpen] = useState(false)
  return (
    <section
      className="discovery-map"
      aria-label={
        mapAvailable ? 'Approximate neighborhood map' : 'Neighborhood discovery'
      }
    >
      <div className="workflow-actions">
        <Button
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {mapAvailable
            ? open
              ? 'Hide map'
              : 'Show neighborhood map'
            : open
              ? 'Hide neighborhood guide'
              : 'Browse neighborhoods'}
        </Button>
        <p>Locations are generalized. The list stays available without maps.</p>
      </div>
      {open && (
        <>
          {mapAvailable ? (
            <MapCanvas features={features} center={center} />
          ) : (
            <NeighborhoodBrowse features={features} />
          )}
          {mapAvailable && (
            <details className="map-feature-list">
              <summary>
                Browse {features.length} nearby map results without using the
                map
              </summary>
              <ul>
                {features.map((f, i) => (
                  <li key={`${f.ref.kind}:${f.ref.id}:${i}`}>
                    <Link
                      href={
                        f.href ??
                        `/search?q=${encodeURIComponent(f.title)}&kind=${f.ref.kind}`
                      }
                    >
                      {f.title}
                    </Link>{' '}
                    · {f.ref.kind} · {f.location.neighborhood}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </section>
  )
}
