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
      className={
        'neighborhood-browser bg-card [border:1px_solid_var(--social-line)] rounded-2xl p-4 [margin-block:0.75rem_1rem] [&_>_header]:flex [&_>_header]:gap-4 [&_>_header]:items-center [&_>_header]:mb-4 [&_>_header_img]:w-24 [&_>_header_img]:h-auto [&_>_header_img]:shrink-0 [&_h2]:font-[850] [&_h2]:text-xl [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_0.375rem] [&_p]:text-muted-foreground [&_p]:text-sm [&_p]:[line-height:1.55] [&_p]:m-0 max-[48rem]:[&_>_header]:items-start max-[48rem]:[&_>_header]:gap-2.5 max-[48rem]:[&_>_header_img]:w-16'
      }
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
            className={
              'neighborhood-choices flex flex-wrap gap-2 mb-3 [&_[data-slot=button]]:text-[0.8125rem] [&_[aria-pressed=true]]:bg-[var(--teal)] [&_[aria-pressed=true]]:text-card [&_[aria-pressed=true]]:border-[color:var(--teal)] max-[48rem]:flex-nowrap max-[48rem]:overflow-x-auto max-[48rem]:pb-1.5 max-[48rem]:[&_[data-slot=button]]:shrink-0'
            }
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
          <p
            className={
              'journal-meta text-sm text-[#6b625b] [margin:0_0_0.5rem] [.resource-card-heading_&]:m-0 [.resource-card-heading_&]:text-[0.8125rem]'
            }
            aria-live="polite"
          >
            {matches.length} public results in{' '}
            {areas.find(([id]) => id === area)?.[1]}
          </p>
          <ul
            className={
              'neighborhood-results grid grid-cols-2 list-none p-0 [margin:0.75rem_0_0] [&_li]:min-w-0 [&_li]:[border-top:1px_solid_var(--social-line)] [&_a]:grid [&_a]:grid-cols-[1fr_auto] [&_a]:items-center [&_a]:p-3 [&_a]:min-h-14 [&_a]:[gap:0.25rem_0.75rem] [&_a]:no-underline [&_a:hover]:bg-[#f0f6f2] [&_span]:text-muted-foreground [&_span]:text-xs [&_span]:[grid-column:1] [&_strong]:text-sm [&_strong]:[grid-column:1] [&_svg]:[grid-column:2] [&_svg]:[grid-row:1_/_3] max-[48rem]:grid-cols-1'
            }
          >
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
