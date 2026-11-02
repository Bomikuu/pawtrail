import type { AnimalProfile } from './types'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { ButtonLink } from '@/components/ui/button-link'
import { READY_ROUTES } from '@/components/layout/navigation'
import { isRouteReady } from '@/lib/route-readiness'
export function AnimalDestination({
  href,
  children,
}: {
  href: string
  children: string
}) {
  return isRouteReady(href, READY_ROUTES) ? (
    <ButtonLink href={href} variant="outline">
      {children}
    </ButtonLink>
  ) : (
    <span className="animal-unavailable" aria-disabled="true">
      {children}
      <small>Coming soon</small>
    </span>
  )
}
export function HelpPanel({ animal }: { animal: AnimalProfile }) {
  return (
    <section
      id="help"
      className="profile-section animal-help"
      aria-labelledby="help-heading"
    >
      <h2 id="help-heading">Help {animal.name}</h2>
      <p>
        {animal.adoptable
          ? 'A home could be the next chapter. Ask the responsible shelter about adoption, or help with a public care request.'
          : 'Share this story and keep community observations connected to this profile.'}
      </p>
      <div className="profile-link-row">
        <ButtonLink
          href={
            '/pets/' +
            encodeURIComponent(animal.slug) +
            '?tab=activity&kind=help#pet-activity'
          }
          variant="outline"
        >
          See help requests
        </ButtonLink>
        {animal.adoptable && (
          <AnimalDestination
            href={`/adopt/applications/new?animalId=${encodeURIComponent(animal.id)}`}
          >
            Ask about adoption
          </AnimalDestination>
        )}
        {animal.fundraiserIds.map((id) => (
          <AnimalDestination
            key={id}
            href={`/fundraisers/${encodeURIComponent(id)}`}
          >
            Support a fundraiser
          </AnimalDestination>
        ))}
        {animal.missionIds.map((id) => (
          <AnimalDestination
            key={id}
            href={`/missions/${encodeURIComponent(id)}`}
          >
            Help with a mission
          </AnimalDestination>
        ))}
        <ButtonAnchor href="#discussion" variant="outline">
          Community discussion
        </ButtonAnchor>
      </div>
    </section>
  )
}
