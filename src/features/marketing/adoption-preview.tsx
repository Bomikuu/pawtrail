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
      className={
        'marketing-section py-18 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:1rem] [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [&_h3]:font-[750] [&_h3]:text-xl [&_h3]:leading-[1.25] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:text-[color:var(--teal)] [&_h3_a:hover]:underline [&_small]:text-xs [&_small]:text-muted-foreground max-[48rem]:py-12 [@media(prefers-reduced-motion:_no-preference)]:[&_h3_a]:[transition:color_150ms_ease-out] adoption-section grid grid-cols-[0.85fr_1.15fr] items-center gap-12 max-[64rem]:gap-8 max-[48rem]:grid-cols-1 max-[48rem]:gap-8'
      }
      aria-labelledby="adoption-title"
    >
      <div
        className={
          'adoption-copy [&_>_p]:[margin:0_0_1.25rem] [&_>_p]:text-muted-foreground [&_>_p]:max-w-[65ch] [&_>_small]:block [&_>_small]:mt-4'
        }
      >
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
      <div
        className={
          'adoption-portraits grid grid-cols-2 gap-5 max-[48rem]:gap-4'
        }
      >
        <PreviewFrame
          state={data.adoption.state}
          empty="No adoptable animals to preview yet."
          error="Adoption previews could not load."
        >
          {data.adoption.items.map((animal) => (
            <article
              key={animal.id}
              className={
                'adoption-portrait [&_img]:w-full [&_img]:h-auto [&_img]:[aspect-ratio:4/5] [&_img]:object-cover [&_img]:rounded-xl [&_img]:mb-4 [&_p]:text-[0.8125rem] [&_p]:[margin:0_0_0.4rem]'
              }
            >
              <AnimalImage
                image={animal.photo}
                species={animal.species}
                appearance={animal.appearance}
              />
              <h3>
                <MarketingDestination
                  href={`/animals/${animal.slug}`}
                  readyRoutes={readyRoutes}
                >
                  {animal.name}
                </MarketingDestination>
              </h3>
              <p>
                {animal.ageMonths === null
                  ? 'Age not recorded'
                  : animal.ageMonths + ' months'}{' '}
                · {animal.species} · {animal.size}
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
