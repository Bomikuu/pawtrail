import type { AnimalProfile } from './types'
export function Traits({ animal }: { animal: AnimalProfile }) {
  return (
    <section
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
      aria-labelledby="traits-heading"
    >
      <h2 id="traits-heading">Getting to know {animal.name}</h2>
      <dl
        className={
          'animal-traits grid gap-5 [&_dt]:font-bold [&_dt]:mb-1 [&_dd]:m-0 [&_dd]:max-w-[70ch]'
        }
      >
        <div>
          <dt>Appearance</dt>
          <dd>{animal.appearance}</dd>
        </div>
        <div>
          <dt>Observed condition</dt>
          <dd>{animal.observedCondition}</dd>
        </div>
        {(['personality', 'behavior', 'characteristics'] as const).map(
          (key) => (
            <div key={key}>
              <dt>{key[0].toUpperCase() + key.slice(1)}</dt>
              <dd>
                {animal[key].length
                  ? animal[key].join(', ')
                  : 'Not recorded yet'}
              </dd>
            </div>
          ),
        )}
      </dl>
      <p className={'profile-note text-sm text-muted-foreground mt-2'}>
        Community observations describe a visit and do not replace veterinary
        advice.
      </p>
    </section>
  )
}
