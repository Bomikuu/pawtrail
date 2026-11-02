import type { AnimalProfile } from './types'
export function HelperWall({ animal }: { animal: AnimalProfile }) {
  return (
    <section className="profile-section" aria-labelledby="helpers-heading">
      <h2 id="helpers-heading">A little help, together</h2>
      <p>
        People who have helped {animal.name}. Some choose to stay anonymous.
      </p>
      {animal.helpers.length ? (
        <ul className="helper-wall">
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
