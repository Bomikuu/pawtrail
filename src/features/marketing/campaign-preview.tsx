import { AnimalImage } from '@/components/shared/animal-image'
import { Money } from '@/components/shared/money'
import type { LandingData } from './data'
import {
  MarketingDestination,
  PreviewFrame,
  type MarketingRoutes,
} from './destination'
export function CampaignPreview({
  data,
  readyRoutes,
}: { data: LandingData } & MarketingRoutes) {
  return (
    <section
      id="help"
      className={
        'marketing-section py-18 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:1rem] [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [&_h3]:font-[750] [&_h3]:text-xl [&_h3]:leading-[1.25] [&_h3]:font-heading [&_h3]:[margin:0_0_0.5rem] [&_h3_a]:text-foreground [&_h3_a]:no-underline [&_h3_a:hover]:text-[color:var(--teal)] [&_h3_a:hover]:underline [&_small]:text-xs [&_small]:text-muted-foreground max-[48rem]:py-12 [@media(prefers-reduced-motion:_no-preference)]:[&_h3_a]:[transition:color_150ms_ease-out]'
      }
      aria-labelledby="campaign-title"
    >
      <div
        className={
          'section-intro max-w-184 mb-8 [&_p]:[margin:0_0_1.25rem] [&_p]:text-muted-foreground [&_p]:max-w-[65ch]'
        }
      >
        <h2 id="campaign-title">Every Paw Deserves Help</h2>
        <p>
          Food, shelter, and care take a community. Follow a campaign’s story,
          review its updates, and understand what help is needed.
        </p>
      </div>
      {data.sample && (
        <p
          className={
            'sample-disclosure text-[0.8125rem] text-muted-foreground [margin:-1rem_0_1.5rem]'
          }
        >
          Sample campaigns. Contributions are simulated; no money is
          transferred.
        </p>
      )}
      <div
        className={
          'campaign-previews grid grid-cols-2 gap-8 max-[48rem]:grid-cols-1'
        }
      >
        <PreviewFrame
          state={data.campaigns.state}
          empty="No active campaigns to preview yet."
          error="Campaign previews could not load."
        >
          {data.campaigns.items.map((campaign) => (
            <article
              key={campaign.id}
              className={
                'campaign-preview grid grid-cols-[9rem_1fr] gap-5 py-4 [border-block:1px_solid_var(--border)] [&_img]:w-36 [&_img]:h-full [&_img]:min-h-40 [&_img]:object-cover [&_img]:rounded-xl [&_p]:text-[0.8125rem] [&_p]:[margin:0.5rem_0] [&_[data-slot=progress]]:block [&_[data-slot=progress]]:w-full [&_[data-slot=progress]]:h-2 [&_[data-slot=progress]]:[border:0] [&_[data-slot=progress]]:rounded-[var(--radius)] [&_[data-slot=progress]]:overflow-hidden [&_[data-slot=progress]]:bg-border [&_[data-slot=progress]]:text-[color:var(--teal)] [&_[data-slot=progress]]:[accent-color:var(--teal)] [&_[data-slot=progress]]:my-3 [&_[data-slot=progress]::-webkit-progress-bar]:bg-border [&_[data-slot=progress]::-webkit-progress-value]:bg-[var(--teal)] [&_[data-slot=progress]::-moz-progress-bar]:bg-[var(--teal)] max-[64rem]:grid-cols-1 max-[64rem]:[&_img]:w-full max-[64rem]:[&_img]:h-auto max-[64rem]:[&_img]:[aspect-ratio:16/10] max-[48rem]:grid-cols-[7rem_1fr] max-[48rem]:gap-4 max-[48rem]:[&_img]:h-full max-[48rem]:[&_img]:min-h-40 max-[48rem]:[&_img]:[aspect-ratio:auto]'
              }
            >
              <AnimalImage image={campaign.photo} />
              <div>
                <p
                  className={
                    'campaign-context [.campaign-preview_&]:mt-0 [.campaign-preview_&]:text-[color:var(--teal)] [.campaign-preview_&]:capitalize'
                  }
                >
                  {campaign.category} · {campaign.state}
                </p>
                <h3>
                  <MarketingDestination
                    href={`/fundraisers/${campaign.slug}`}
                    readyRoutes={readyRoutes}
                  >
                    {campaign.title}
                  </MarketingDestination>
                </h3>
                <p>
                  <Money amount={campaign.raisedMinor} />{' '}
                  {campaign.provenance.kind === 'sample'
                    ? 'simulated'
                    : 'raised'}{' '}
                  toward <Money amount={campaign.goalMinor} />
                </p>
                <progress
                  value={Math.min(campaign.raisedMinor, campaign.goalMinor)}
                  max={campaign.goalMinor}
                  aria-label={`${campaign.title}: ${campaign.provenance.kind === 'sample' ? 'simulated ' : ''}funding progress`}
                />
                <small>
                  {campaign.provenance.kind === 'sample'
                    ? 'Illustrative photo · sample verification only'
                    : campaign.verification.label}
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
        <p>Know the story behind the support.</p>
        <MarketingDestination
          action
          secondary
          href="/fundraisers"
          readyRoutes={readyRoutes}
        >
          Support a Fundraiser
        </MarketingDestination>
      </div>
    </section>
  )
}
