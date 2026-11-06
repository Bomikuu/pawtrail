import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { PawMarker } from '@/components/illustrations/paw-marker'
import { READY_ROUTES } from '@/components/layout/navigation'
import { Hero } from './hero'
import { DiscoveryPreview } from './discovery-preview'
import { AdoptionPreview } from './adoption-preview'
import { CampaignPreview } from './campaign-preview'
import { CommunityPreview } from './community-preview'
import { MarketingDestination, type MarketingRoutes } from './destination'
import type { LandingData } from './data'
export function LandingPage({
  data,
  readyRoutes = READY_ROUTES,
}: { data: LandingData } & MarketingRoutes) {
  return (
    <div className="marketing-page">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="marketing-header">
        <Link href="/" className="marketing-brand" aria-label="PawTrail home">
          <PawMarker />
          PawTrail
        </Link>
        <nav aria-label="Public navigation">
          <a href="#discover">Discover</a>
          <a href="#adoption">Adopt</a>
          <a href="#help">Help</a>
          <a href="#stories">Stories</a>
        </nav>
        <div className="marketing-account">
          <MarketingDestination href="/login" readyRoutes={readyRoutes}>
            Log in
          </MarketingDestination>
          <MarketingDestination
            action
            href="/register"
            readyRoutes={readyRoutes}
          >
            Join PawTrail
          </MarketingDestination>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        {data.sample && (
          <p className="marketing-demo">
            You’re exploring a sample community. Profiles, stories,
            verification, and contributions are illustrative.
          </p>
        )}
        <Hero data={data} readyRoutes={readyRoutes} />
        <section
          className="sample-statistics"
          aria-label={
            data.sample ? 'Sample community statistics' : 'Community statistics'
          }
        >
          {data.stats ? (
            <>
              <dl>
                {(
                  [
                    ['Animals Discovered', data.stats.animalsDiscovered],
                    ['Animals Adopted', data.stats.animalsAdopted],
                    ['Community Helpers', data.stats.communityHelpers],
                    [
                      'Successful Fundraisers',
                      data.stats.successfulFundraisers,
                    ],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} data-testid="sample-statistic">
                    <dt>Sample {label}</dt>
                    <dd>{value.toLocaleString('en-PH')}</dd>
                  </div>
                ))}
              </dl>
              <p>
                Sample dataset totals. Adopted means marked adopted; successful
                means completed and at goal. These are not real-world outcomes.
              </p>
            </>
          ) : (
            <p>
              Community totals are unavailable until a verified summary is
              connected.
            </p>
          )}
        </section>
        <DiscoveryPreview data={data} readyRoutes={readyRoutes} />
        <AdoptionPreview data={data} readyRoutes={readyRoutes} />
        <CampaignPreview data={data} readyRoutes={readyRoutes} />
        <CommunityPreview data={data} readyRoutes={readyRoutes} />
        <section className="marketing-close">
          <h2>There’s a place for you in their story.</h2>
          <p>
            Get to know a neighbor. Share a little care. Start your PawTrail.
          </p>
          <MarketingDestination
            action
            href="/register"
            readyRoutes={readyRoutes}
          >
            Create your account
          </MarketingDestination>
        </section>
      </main>
      <footer className="marketing-footer">
        <div>
          <Link className="marketing-brand" href="/">
            <PawMarker />
            PawTrail
          </Link>
          <p>Discover. Care. Connect.</p>
        </div>
        <p>
          {data.sample
            ? 'A demonstration of a caring pet community.'
            : 'Animal stories, connected.'}
          <br />
          Photography is illustrative.{' '}
          <a href="/asset-credits.txt">Asset credits and licenses</a>
        </p>
        <nav aria-label="Footer navigation">
          <a href="#main-content">Back to top</a>
          <MarketingDestination href="/community" readyRoutes={readyRoutes}>
            Community
          </MarketingDestination>
        </nav>
      </footer>
    </div>
  )
}
