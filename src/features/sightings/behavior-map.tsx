'use client'
import { useId, useState } from 'react'
import { Select } from '@/components/ui/select'
import { DiscoveryMap } from '@/features/discovery/map-island'
import type { Sighting } from './types'
export function BehaviorMap({
  sightings,
  animalSlug,
}: {
  sightings: Sighting[]
  animalSlug?: string
}) {
  const id = useId(),
    [period, setPeriod] = useState('all')
  const rows = sightings.filter((s) => {
    const hour = Number(
      new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        hour: 'numeric',
        hourCycle: 'h23',
      }).format(new Date(s.observedAt)),
    )
    return (
      period === 'all' ||
      (period === 'morning'
        ? hour >= 5 && hour < 12
        : period === 'afternoon'
          ? hour >= 12 && hour < 18
          : hour >= 18 || hour < 5)
    )
  })
  const center = rows[0]?.location ?? sightings[0]?.location
  return (
    <section className="profile-section">
      <h2>Patterns around the neighborhood</h2>
      <label htmlFor={id}>Time of day in Asia/Manila</label>
      <Select
        id={id}
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
      >
        <option value="all">All times</option>
        <option value="morning">Morning</option>
        <option value="afternoon">Afternoon</option>
        <option value="evening">Evening and night</option>
      </Select>
      <p>
        {rows.length} published observations. Map positions show generalized
        areas, not exact animal locations.
      </p>
      {center && (
        <DiscoveryMap
          center={center}
          features={rows.map((s) => ({
            ref: { kind: 'animal', id: s.animalId },
            title: s.observation.slice(0, 80),
            href: animalSlug ? `/pets/${animalSlug}` : undefined,
            location: s.location,
          }))}
        />
      )}
    </section>
  )
}
