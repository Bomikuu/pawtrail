'use client'
import { useId, useState } from 'react'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
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
    <section
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
    >
      <h2>Patterns around the neighborhood</h2>
      <label htmlFor={id}>Time of day in Asia/Manila</label>
      <Select
        id={id}
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
      >
        <SelectOption value="all">All times</SelectOption>
        <SelectOption value="morning">Morning</SelectOption>
        <SelectOption value="afternoon">Afternoon</SelectOption>
        <SelectOption value="evening">Evening and night</SelectOption>
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
