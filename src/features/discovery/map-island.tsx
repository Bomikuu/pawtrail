'use client'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { DiscoveryResult } from './types'
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
  const [open, setOpen] = useState(false)
  return (
    <section
      className="discovery-map"
      aria-label="Approximate neighborhood map"
    >
      <div className="workflow-actions">
        <Button
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? 'Hide map' : 'Show neighborhood map'}
        </Button>
        <p>Locations are generalized. The list stays available without maps.</p>
      </div>
      {open && (
        <>
          <MapCanvas features={features} center={center} />
          <details className="map-feature-list">
            <summary>
              Browse {features.length} nearby map results without using the map
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
        </>
      )}
    </section>
  )
}
