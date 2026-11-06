'use client'
import { useState } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowRight, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DiscoveryResult } from './types'

const kindNames: Record<string, string> = {
  animal: 'Animal',
  horde: 'Animal group',
  fundraiser: 'Fundraiser',
  mission: 'Help request',
  event: 'Event',
  shelter: 'Shelter',
  sighting: 'Sighting',
  post: 'Community story',
  user: 'Community helper',
}

export function NeighborhoodBrowse({
  features,
  unavailable = false,
}: {
  features: DiscoveryResult['features']
  unavailable?: boolean
}) {
  const [selected, setSelected] = useState<string>()
  const [limit, setLimit] = useState(6)
  const unique = [
    ...new Map(
      features.map((feature) => [
        `${feature.ref.kind}:${feature.ref.id}`,
        feature,
      ]),
    ).values(),
  ]
  const areas = [
    ...new Map(
      unique.map((feature) => [
        feature.location.areaId,
        feature.location.neighborhood,
      ]),
    ).entries(),
  ]
  const area = areas.find(([id]) => id === selected)?.[0] ?? areas[0]?.[0]
  const matches = unique.filter((feature) => feature.location.areaId === area)
  return (
    <section
      className="neighborhood-browser"
      aria-label="Browse approximate neighborhoods"
    >
      <header>
        <img
          src="/images/pawtrail/care-circle.webp"
          width={120}
          height={90}
          alt=""
        />
        <div>
          <h2>Care starts close to home</h2>
          <p>
            {unavailable ? 'The live map couldn’t load. ' : ''}Browse animals
            and ways to help by neighborhood. Locations stay approximate.
          </p>
        </div>
      </header>
      {areas.length ? (
        <>
          <div
            className="neighborhood-choices"
            role="group"
            aria-label="Choose a neighborhood"
          >
            {areas.map(([id, name]) => (
              <Button
                key={id}
                variant="outline"
                aria-pressed={id === area}
                onClick={() => {
                  setSelected(id)
                  setLimit(6)
                }}
              >
                <MapPin size={16} aria-hidden="true" />
                {name}
              </Button>
            ))}
          </div>
          <p className="journal-meta" aria-live="polite">
            {matches.length} public results in{' '}
            {areas.find(([id]) => id === area)?.[1]}
          </p>
          <ul className="neighborhood-results">
            {matches.slice(0, limit).map((feature) => (
              <li key={`${feature.ref.kind}:${feature.ref.id}`}>
                <Link
                  href={
                    feature.href ??
                    `/search?q=${encodeURIComponent(feature.title)}&kind=${feature.ref.kind}`
                  }
                >
                  <span>{kindNames[feature.ref.kind] ?? feature.ref.kind}</span>
                  <strong>{feature.title}</strong>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          {matches.length > limit && (
            <Button
              variant="ghost"
              onClick={() => setLimit((value) => value + 6)}
            >
              Show more in this neighborhood ({matches.length - limit})
            </Button>
          )}
        </>
      ) : (
        <p>
          No public results in this area yet. Widen your search or try another
          neighborhood.
        </p>
      )}
    </section>
  )
}
