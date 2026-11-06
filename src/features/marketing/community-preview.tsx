import { HandHeart, MessageCircle, Cookie } from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import type { LandingData } from './data'
import type { Post } from '@/features/community/types'
function storyTitle(post: Post, data: LandingData) {
  const animal = data.animals.items.find((animal) =>
    post.refs.some((ref) => ref.kind === 'animal' && ref.id === animal.id),
  )
  return animal ? `${animal.name}’s story` : 'A little help, shared'
}
import {
  MarketingDestination,
  PreviewFrame,
  type MarketingRoutes,
} from './destination'
export function CommunityPreview({
  data,
  readyRoutes,
}: { data: LandingData } & MarketingRoutes) {
  return (
    <>
      <section
        id="pawpal"
        className={
          'marketing-section py-18 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:1rem] [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [&_h3]:font-[750] [&_h3]:text-xl [&_h3]:leading-[1.25] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:text-[color:var(--teal)] [&_h3_a:hover]:underline [&_small]:text-xs [&_small]:text-muted-foreground max-[48rem]:py-12 [@media(prefers-reduced-motion:_no-preference)]:[&_h3_a]:[transition:color_150ms_ease-out] pawpal-section [&_>_div_>_p]:[margin:0_0_1.25rem] [&_>_div_>_p]:text-muted-foreground [&_>_div_>_p]:max-w-[65ch] grid grid-cols-[0.9fr_1.1fr] gap-20 max-[64rem]:gap-12 max-[48rem]:grid-cols-1'
        }
        aria-labelledby="pawpal-title"
      >
        <div>
          <h2 id="pawpal-title">Become a PawPal</h2>
          <p>
            You don’t need to do everything to make a difference. Start with a
            useful update or a mission that fits your day.
          </p>
          <MarketingDestination
            action
            href="/community"
            readyRoutes={readyRoutes}
          >
            Join the Community
          </MarketingDestination>
        </div>
        <ol
          className={
            'pawpal-steps grid gap-6 list-none p-0 m-0 [&_li]:flex [&_li]:items-start [&_li]:gap-4 [&_svg]:text-[color:var(--teal)] [&_svg]:[flex:0_0_1.5rem] [&_svg]:mt-[0.15rem] [&_p]:m-0 [&_p]:text-[length:0.9375rem] [&_p]:text-muted-foreground'
          }
        >
          <li>
            <MessageCircle aria-hidden="true" />
            <div>
              <h3>Share what you notice</h3>
              <p>Keep an animal’s story connected to the people who care.</p>
            </div>
          </li>
          <li>
            <HandHeart aria-hidden="true" />
            <div>
              <h3>Help with a mission</h3>
              <p>Contribute, submit evidence, and wait for a review.</p>
            </div>
          </li>
          <li>
            <Cookie aria-hidden="true" />
            <div>
              <h3>Earn Kibble for reviewed help</h3>
              <p>
                Kibble is a non-cash community reward. It cannot be spent or
                withdrawn as money.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <section
        id="stories"
        className={
          'marketing-section py-18 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:1rem] [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [&_h3]:font-[750] [&_h3]:text-xl [&_h3]:leading-[1.25] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:text-[color:var(--teal)] [&_h3_a:hover]:underline [&_small]:text-xs [&_small]:text-muted-foreground max-[48rem]:py-12 [@media(prefers-reduced-motion:_no-preference)]:[&_h3_a]:[transition:color_150ms_ease-out] stories-section'
        }
        aria-labelledby="stories-title"
      >
        <div
          className={
            'section-intro max-w-184 mb-8 [&_p]:[margin:0_0_1.25rem] [&_p]:text-muted-foreground [&_p]:max-w-[65ch]'
          }
        >
          <h2 id="stories-title">Stories Worth Sharing</h2>
          <p>
            Rescue updates, adoption journeys, and small community
            achievements—all connected by the animals at their heart.
          </p>
        </div>
        {data.sample && (
          <p
            className={
              'sample-disclosure text-[0.8125rem] text-muted-foreground [margin:-1rem_0_1.5rem]'
            }
          >
            Illustrative community stories, not testimonials or real rescue
            outcomes.
          </p>
        )}
        <div
          className={
            'story-previews grid grid-cols-[1fr_1fr_0.9fr] gap-8 max-[48rem]:grid-cols-1'
          }
        >
          <PreviewFrame
            state={data.stories.state}
            empty="The next story is still being written."
            error="Community stories could not load."
          >
            {data.stories.items.map((post) => (
              <article
                key={post.id}
                className={`story-preview [&_img]:w-full [&_img]:h-auto [&_img]:[aspect-ratio:4/3] [&_img]:object-cover [&_img]:rounded-xl [&_img]:mb-5 [&_p]:text-[length:0.9375rem] [&_p]:[margin:0.75rem_0_1rem] [&:last-child]:[border-top:1px_solid_var(--border)] [&:last-child]:pt-5 max-[48rem]:block max-[48rem]:[&_img]:h-28 max-[48rem]:[&_img]:object-cover max-[48rem]:[&_img]:m-0${post.media[0] ? ' story-preview-with-media max-[48rem]:grid max-[48rem]:grid-cols-[7rem_1fr] max-[48rem]:gap-4' : ''}`}
              >
                {post.media[0] && <AnimalImage image={post.media[0]} />}
                <div>
                  <h3>
                    <MarketingDestination
                      href={`/community/${post.id}`}
                      readyRoutes={readyRoutes}
                    >
                      {storyTitle(post, data)}
                    </MarketingDestination>
                  </h3>
                  <p>{post.text}</p>
                  <small>
                    {post.provenance.kind === 'sample'
                      ? 'Fictional community journal'
                      : 'Community update'}
                  </small>
                </div>
              </article>
            ))}
          </PreviewFrame>
        </div>
        <div
          className={
            'section-end flex justify-between items-center gap-4 mt-6 [&_>_p]:text-sm [&_>_p]:text-muted-foreground [&_>_p]:m-0 max-[48rem]:items-start max-[48rem]:flex-col'
          }
        >
          <p>Every update can help someone understand an animal better.</p>
          <MarketingDestination href="/community" readyRoutes={readyRoutes}>
            Read more stories
          </MarketingDestination>
        </div>
      </section>
    </>
  )
}
