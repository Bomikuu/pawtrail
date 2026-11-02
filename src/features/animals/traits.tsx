import type { AnimalProfile } from './types'
export function Traits({ animal }: { animal: AnimalProfile }) {
  return (
    <section className="profile-section" aria-labelledby="traits-heading">
      <h2 id="traits-heading">Getting to know {animal.name}</h2>
      <dl className="animal-traits">
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
      <p className="profile-note">
        Community observations describe a visit and do not replace veterinary
        advice.
      </p>
    </section>
  )
}
