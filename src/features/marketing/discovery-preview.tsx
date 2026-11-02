import { AnimalImage } from '@/components/shared/animal-image'
import { NeighborhoodMap } from '@/components/illustrations/neighborhood-map'
import type { LandingData } from './data'
import {
  MarketingDestination,
  PreviewFrame,
  type MarketingRoutes,
} from './destination'
export function DiscoveryPreview({
  data,
  readyRoutes,
}: { data: LandingData } & MarketingRoutes) {
  return (
    <section
      id="discover"
      className="marketing-section discovery-section"
      aria-labelledby="discovery-title"
    >
      <div className="section-intro">
        <h2 id="discovery-title">Discover Animals Near You</h2>
        <p>
          A familiar face on your street might have a whole community behind
          them. See animal stories, sightings, and care needs together.
        </p>
      </div>
      <div className="discovery-spread">
        <NeighborhoodMap />
        <div className="animal-notes">
          <PreviewFrame
            state={data.animals.state}
            empty="Animal previews are quiet right now."
            error="Animal previews could not load."
          >
            {data.animals.items.map((animal) => (
              <article className="animal-note" key={animal.id}>
                <AnimalImage image={animal.photo} />
                <div>
                  <h3>
                    <MarketingDestination
                      href={`/animals/${animal.slug}`}
                      readyRoutes={readyRoutes}
                    >
                      {animal.name}
                    </MarketingDestination>
                  </h3>
                  <p>{animal.location.neighborhood}</p>
                  <small>
                    {animal.provenance.kind === 'sample'
                      ? 'Sample animal · illustrative photo'
                      : animal.species}{' '}
                    · {animal.status}
                  </small>
                </div>
              </article>
            ))}
          </PreviewFrame>
        </div>
      </div>
      <div className="section-end">
        <p>Locations are approximate. Sensitive details stay private.</p>
        <MarketingDestination
          action
          secondary
          href="/explore"
          readyRoutes={readyRoutes}
        >
          Explore Animals
        </MarketingDestination>
      </div>
    </section>
  )
}
