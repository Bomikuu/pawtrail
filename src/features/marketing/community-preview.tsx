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
        className="marketing-section pawpal-section"
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
        <ol className="pawpal-steps">
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
        className="marketing-section stories-section"
        aria-labelledby="stories-title"
      >
        <div className="section-intro">
          <h2 id="stories-title">Stories Worth Sharing</h2>
          <p>
            Rescue updates, adoption journeys, and small community
            achievements—all connected by the animals at their heart.
          </p>
        </div>
        {data.sample && (
          <p className="sample-disclosure">
            Illustrative community stories, not testimonials or real rescue
            outcomes.
          </p>
        )}
        <div className="story-previews">
          <PreviewFrame
            state={data.stories.state}
            empty="The next story is still being written."
            error="Community stories could not load."
          >
            {data.stories.items.map((post) => (
              <article key={post.id} className="story-preview">
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
        <div className="section-end">
          <p>Every update can help someone understand an animal better.</p>
          <MarketingDestination href="/community" readyRoutes={readyRoutes}>
            Read more stories
          </MarketingDestination>
        </div>
      </section>
    </>
  )
}
