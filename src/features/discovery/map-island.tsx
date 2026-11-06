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
      className={'discovery-map [margin:1.5rem_0]'}
      aria-label={
        mapAvailable ? 'Approximate neighborhood map' : 'Neighborhood discovery'
      }
    >
      <div
        className={
          'workflow-actions flex items-center gap-3 flex-wrap [margin:0.75rem_0] [.discovery-map_&_p]:m-0 [.discovery-map_&_p]:text-sm [.discovery-map_&_p]:text-[#6b625b] max-[48rem]:[&_>_*]:max-w-full [.achievement-review-card_&]:mt-4 [.adoption-story_&]:gap-2.5 [.adoption-story_&_[data-slot=button]]:[flex:1_1_9rem]'
        }
      >
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
