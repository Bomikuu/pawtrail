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
    <span
      className={
        'animal-unavailable inline-flex flex-col gap-0.5 text-sm text-muted-foreground p-2 [&_small]:text-xs'
      }
      aria-disabled="true"
    >
      {children}
      <small>Coming soon</small>
    </span>
  )
}
export function HelpPanel({ animal }: { animal: AnimalProfile }) {
  return (
    <section
      id="help"
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm animal-help [.pet-social-profile_&]:p-4.5 [.pet-social-profile_&]:[border:1px_solid_#e8ddcf] [.pet-social-profile_&]:rounded-2xl [.pet-social-profile_&]:m-0 [.pet-social-profile_&]:bg-[#fff6e6] [.pet-social-profile_&]:[scroll-margin-top:6rem] [.pet-social-profile_&_h2]:font-[850] [.pet-social-profile_&_h2]:text-lg [.pet-social-profile_&_h2]:leading-[1.35] [.pet-social-profile_&_h2]:font-heading [.pet-social-profile_&_h2]:mb-3 [.pet-social-profile_&_>_p]:text-[0.8125rem] [.pet-social-profile_&_>_p]:[margin:0_0_1rem] [.pet-social-profile_&_[data-slot=button]]:text-xs'
      }
      aria-labelledby="help-heading"
    >
      <h2 id="help-heading">Help {animal.name}</h2>
      <p>
        {animal.adoptable
          ? 'A home could be the next chapter. Ask the responsible shelter about adoption, or help with a public care request.'
          : 'Share this story and keep community observations connected to this profile.'}
      </p>
      <div
        className={
          'profile-link-row flex flex-wrap items-center gap-3 mt-4 [.animal-action-bar_&]:mt-0 max-[48rem]:[.app-shell_.notification-list_&]:flex-wrap [.pet-social-actions_&]:flex [.pet-social-actions_&]:flex-wrap [.pet-social-actions_&]:gap-2'
        }
      >
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
