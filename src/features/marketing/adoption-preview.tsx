import { AnimalImage } from '@/components/shared/animal-image'
import type { LandingData } from './data'
import {
  MarketingDestination,
  PreviewFrame,
  type MarketingRoutes,
} from './destination'
export function AdoptionPreview({
  data,
  readyRoutes,
}: { data: LandingData } & MarketingRoutes) {
  return (
    <section
      id="adoption"
      className="marketing-section adoption-section"
      aria-labelledby="adoption-title"
    >
      <div className="adoption-copy">
        <h2 id="adoption-title">Find Your Perfect Companion</h2>
        <p>
          A good match starts with getting to know each other. Browse adoptable
          animals, learn about their needs, and express interest when you’re
          ready.
        </p>
        <p>
          Swipe through profiles or use the buttons. Your preferences can help
          narrow the search; a shelter conversation comes next.
        </p>
        <MarketingDestination action href="/adopt" readyRoutes={readyRoutes}>
          Start Matching
        </MarketingDestination>
        <small>
          Expressing interest is a first step, not an adoption approval.
        </small>
      </div>
      <div className="adoption-portraits">
        <PreviewFrame
          state={data.adoption.state}
          empty="No adoptable animals to preview yet."
          error="Adoption previews could not load."
        >
          {data.adoption.items.map((animal) => (
            <article key={animal.id} className="adoption-portrait">
              <AnimalImage image={animal.photo} />
              <h3>
                <MarketingDestination
                  href={`/animals/${animal.slug}`}
                  readyRoutes={readyRoutes}
                >
                  {animal.name}
                </MarketingDestination>
              </h3>
              <p>
                {animal.ageMonths} months · {animal.species} · {animal.size}
              </p>
              <small>
                {animal.provenance.kind === 'sample'
                  ? 'Sample adoptable profile · stock photo'
                  : 'Available to learn about'}
              </small>
            </article>
          ))}
        </PreviewFrame>
      </div>
    </section>
  )
}
