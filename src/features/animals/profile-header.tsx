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
      <header
        className={
          'animal-profile-header flex items-start justify-between gap-4 mb-6 [&_p]:mt-2 [&_p]:text-muted-foreground'
        }
      >
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
      <section
        className={
          'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
        }
        aria-labelledby="story-heading"
      >
        <h2 id="story-heading">{animal.name}'s story</h2>
        <p
          className={
            'profile-prose max-w-[70ch] [white-space:pre-line] [overflow-wrap:anywhere]'
          }
        >
          {animal.description}
        </p>
        <div className={'animal-badges flex flex-wrap items-center gap-3 mt-4'}>
          {animal.badges.map((badge) => (
            <StatusBadge key={badge}>{badge}</StatusBadge>
          ))}
        </div>
        <p className={'profile-note text-sm text-muted-foreground mt-2'}>
          {animal.provenance.label}
        </p>
        <p className={'profile-verification mt-4'}>
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
