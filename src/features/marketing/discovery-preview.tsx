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
      className={
        'marketing-section py-18 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:1rem] [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [&_h3]:font-[750] [&_h3]:text-xl [&_h3]:leading-[1.25] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:text-[color:var(--teal)] [&_h3_a:hover]:underline [&_small]:text-xs [&_small]:text-muted-foreground max-[48rem]:py-12 [@media(prefers-reduced-motion:_no-preference)]:[&_h3_a]:[transition:color_150ms_ease-out] discovery-section'
      }
      aria-labelledby="discovery-title"
    >
      <div
        className={
          'section-intro max-w-184 mb-8 [&_p]:[margin:0_0_1.25rem] [&_p]:text-muted-foreground [&_p]:max-w-[65ch]'
        }
      >
        <h2 id="discovery-title">Discover Animals Near You</h2>
        <p>
          A familiar face on your street might have a whole community behind
          them. See animal stories, sightings, and care needs together.
        </p>
      </div>
      <div
        className={
          'discovery-spread grid grid-cols-[1.05fr_1fr] gap-8 max-[48rem]:grid-cols-1'
        }
      >
        <NeighborhoodMap />
        <div className={'animal-notes grid [align-content:center] gap-6'}>
          <PreviewFrame
            state={data.animals.state}
            empty="Animal previews are quiet right now."
            error="Animal previews could not load."
          >
            {data.animals.items.map((animal) => (
              <article
                className={
                  'animal-note grid grid-cols-[9rem_1fr] items-center gap-5 [&_img]:w-36 [&_img]:h-32 [&_img]:object-cover [&_img]:rounded-xl [&_p]:[margin:0_0_0.4rem] [&_p]:text-sm max-[64rem]:grid-cols-[6rem_1fr] max-[64rem]:gap-4 max-[64rem]:[&_img]:w-24 max-[64rem]:[&_img]:h-24 max-[48rem]:grid-cols-[7rem_1fr] max-[48rem]:[&_img]:w-28 max-[48rem]:[&_img]:h-24'
                }
                key={animal.id}
              >
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
      <div
        className={
          'section-end flex justify-between items-center gap-4 mt-6 [&_>_p]:text-sm [&_>_p]:text-muted-foreground [&_>_p]:m-0 max-[48rem]:items-start max-[48rem]:flex-col'
        }
      >
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
