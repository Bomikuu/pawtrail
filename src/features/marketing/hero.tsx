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
    <section
      className={
        'marketing-hero grid grid-cols-[1.05fr_1fr] gap-8 items-center [padding-block:4.5rem_3.5rem] max-[64rem]:gap-6 max-[48rem]:grid-cols-1 max-[48rem]:py-10'
      }
      aria-labelledby="hero-title"
    >
      <div
        className={
          'hero-copy [&_h1]:max-w-[10ch] [&_h1]:[margin:0_0_1.5rem] [&_h1]:text-[length:clamp(3.25rem,_5.7vw,_5.5rem)] [&_h1]:[line-height:1.02] [&_h1]:[font-weight:850] [&_h1]:[letter-spacing:-0.035em] [&_>_p]:max-w-[47ch] [&_>_p]:text-base [&_>_p]:[margin:0_0_1.5rem] max-[48rem]:[&_h1]:text-[length:clamp(3.25rem,_12vw,_4.5rem)]'
        }
      >
        <h1 id="hero-title">Every Paw Has a Story.</h1>
        <p>
          Discover animals in your neighborhood, connect with loving companions,
          support rescue missions, and become part of a community making every
          paw count.
        </p>
        <div className={'marketing-actions flex flex-wrap items-start gap-3'}>
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
        <p
          className={
            'hero-signoff [.hero-copy_&]:font-[750] [.hero-copy_&]:text-lg [.hero-copy_&]:font-heading [.hero-copy_&]:[margin:1.75rem_0_0] [.hero-copy_&]:text-[color:var(--teal)]'
          }
        >
          Discover. Care. Connect.
        </p>
      </div>
      <div
        className={
          'hero-composition relative min-h-112 grid items-center max-[64rem]:min-h-100 max-[48rem]:min-h-104 max-[48rem]:max-w-136 max-[48rem]:w-full max-[48rem]:mx-auto'
        }
      >
        <NeighborhoodMap compact />
        <img
          className={
            'hero-doodle [z-index:1] relative w-[75%] h-auto [justify-self:center] [align-self:end] mb-10'
          }
          src="/images/illustrations/pet-companions.webp"
          width={960}
          height={640}
          alt="Original illustration of a friendly ginger cat beside a cream and brown dog"
          fetchPriority="high"
        />
        {animal && (
          <div
            className={
              'hero-animal absolute top-[0.1rem] right-0 [z-index:2] flex items-center gap-3 bg-card [border:1px_solid_var(--border)] rounded-xl p-[0.6rem] max-w-[65%] [&_img]:w-18 [&_img]:h-18 [&_img]:object-cover [&_img]:rounded-lg [&_>_div]:grid [&_>_div]:font-bold [&_>_div_>_span]:text-xs [&_>_div_>_span]:text-muted-foreground [&_>_div_>_span]:font-normal'
            }
          >
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
        <div
          className={
            'hero-help absolute bottom-0 right-0 [z-index:2] grid [padding:0.85rem_1rem] bg-card [border:1px_solid_var(--border)] rounded-xl [&_span]:text-[0.8125rem] [&_span]:text-muted-foreground'
          }
        >
          <strong>A little help goes a long way.</strong>
          <span>Share a sighting. Find a care circle.</span>
        </div>
      </div>
    </section>
  )
}
