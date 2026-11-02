import type { ReactNode } from 'react'
import type { AnimalProfile } from './types'
import { StatusBadge } from '@/components/shared/status-badge'
import { Gallery } from './gallery'
import { Traits } from './traits'
export function PublicAnimalStory({
  animal,
  actions,
}: {
  animal: AnimalProfile
  actions?: ReactNode
}) {
  return (
    <>
      <header className="animal-profile-header">
        <div>
          <h1>{animal.name}</h1>
          <p>
            {animal.species} · {animal.ageMonths} months · {animal.gender} ·{' '}
            {animal.size}
          </p>
          <p>{animal.location.neighborhood} · approximate area</p>
        </div>
        <StatusBadge>{animal.status}</StatusBadge>
      </header>
      <Gallery animal={animal} />
      {actions}
      <section className="profile-section" aria-labelledby="story-heading">
        <h2 id="story-heading">{animal.name}'s story</h2>
        <p className="profile-prose">{animal.description}</p>
        <div className="animal-badges">
          {animal.badges.map((badge) => (
            <StatusBadge key={badge}>{badge}</StatusBadge>
          ))}
        </div>
        <p className="profile-note">{animal.provenance.label}</p>
        <p className="profile-verification">
          <StatusBadge
            tone={
              animal.verification.status === 'verified' ? 'success' : 'neutral'
            }
          >
            {animal.verification.label}
          </StatusBadge>
        </p>
      </section>
      <Traits animal={animal} />
    </>
  )
}
