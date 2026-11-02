import { AnimalImage } from '@/components/shared/animal-image'
import { NeighborhoodMap } from '@/components/illustrations/neighborhood-map'
import type { LandingData } from './data'
import { MarketingDestination, type MarketingRoutes } from './destination'
export function Hero({
  data,
  readyRoutes,
}: { data: LandingData } & MarketingRoutes) {
  const animal = data.animals.items[0]
  return (
    <section className="marketing-hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <h1 id="hero-title">Every Paw Has a Story.</h1>
        <p>
          Discover animals in your neighborhood, connect with loving companions,
          support rescue missions, and become part of a community making every
          paw count.
        </p>
        <div className="marketing-actions">
          <MarketingDestination
            action
            href="/explore"
            readyRoutes={readyRoutes}
          >
            Explore the Map
          </MarketingDestination>
          <MarketingDestination
            action
            secondary
            href="/adopt"
            readyRoutes={readyRoutes}
          >
            Find Your Companion
          </MarketingDestination>
        </div>
        <p className="hero-signoff">Discover. Care. Connect.</p>
      </div>
      <div className="hero-composition">
        <NeighborhoodMap compact />
        <img
          className="hero-doodle"
          src="/images/illustrations/pet-companions.webp"
          width={960}
          height={640}
          alt="Original illustration of a friendly ginger cat beside a cream and brown dog"
          fetchPriority="high"
        />
        {animal && (
          <div className="hero-animal">
            <AnimalImage image={animal.photo} />
            <div>
              <span>
                {animal.provenance.kind === 'sample'
                  ? 'Sample animal'
                  : 'Meet your neighbor'}
              </span>
              <MarketingDestination
                href={`/animals/${animal.slug}`}
                readyRoutes={readyRoutes}
              >
                {animal.name}
              </MarketingDestination>
            </div>
          </div>
        )}
        <div className="hero-help">
          <strong>A little help goes a long way.</strong>
          <span>Share a sighting. Find a care circle.</span>
        </div>
      </div>
    </section>
  )
}
