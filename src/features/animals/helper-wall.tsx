import type { AnimalProfile } from './types'
export function HelperWall({ animal }: { animal: AnimalProfile }) {
  return (
    <section
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
      aria-labelledby="helpers-heading"
    >
      <h2 id="helpers-heading">A little help, together</h2>
      <p>
        People who have helped {animal.name}. Some choose to stay anonymous.
      </p>
      {animal.helpers.length ? (
        <ul
          className={
            'helper-wall flex flex-wrap [gap:0.75rem_1.5rem] p-0 list-none mt-4'
          }
        >
          {animal.helpers.map((helper, index) => (
            <li key={index}>{helper.displayName}</li>
          ))}
        </ul>
      ) : (
        <p>No helpers recorded yet.</p>
      )}
    </section>
  )
}
