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
      className="marketing-section"
      aria-labelledby="campaign-title"
    >
      <div className="section-intro">
        <h2 id="campaign-title">Every Paw Deserves Help</h2>
        <p>
          Food, shelter, and care take a community. Follow a campaign’s story,
          review its updates, and understand what help is needed.
        </p>
      </div>
      {data.sample && (
        <p className="sample-disclosure">
          Sample campaigns. Contributions are simulated; no money is
          transferred.
        </p>
      )}
      <div className="campaign-previews">
        <PreviewFrame
          state={data.campaigns.state}
          empty="No active campaigns to preview yet."
          error="Campaign previews could not load."
        >
          {data.campaigns.items.map((campaign) => (
            <article key={campaign.id} className="campaign-preview">
              <AnimalImage image={campaign.photo} />
              <div>
                <p className="campaign-context">
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
      <div className="section-end">
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
