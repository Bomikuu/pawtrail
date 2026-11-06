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
    <div
      className={
        'marketing-page max-w-352 mx-auto px-10 max-[64rem]:px-6 max-[48rem]:px-4'
      }
    >
      <a
        className={
          'skip-link fixed top-2 left-4 p-3 [z-index:100] bg-card [transform:translateY(-200%)] [&:focus]:[transform:none]'
        }
        href="#main-content"
      >
        Skip to content
      </a>
      <header
        className={
          'marketing-header min-h-26 flex items-center gap-8 [border-bottom:1px_solid_var(--border)] [&_nav]:flex [&_nav]:gap-[1.4rem] [&_nav]:mx-auto [&_nav_a]:inline-flex [&_nav_a]:min-h-11 [&_nav_a]:items-center [&_nav_a]:text-[length:0.9375rem] [&_nav_a]:font-semibold [&_nav_a]:no-underline [&_nav_a:hover]:underline max-[64rem]:gap-4 max-[64rem]:flex-wrap max-[64rem]:py-4 max-[64rem]:[&_nav]:[order:3] max-[64rem]:[&_nav]:w-full max-[64rem]:[&_nav]:justify-center max-[48rem]:[&_nav]:gap-6 [@media(prefers-reduced-motion:_no-preference)]:[&_nav_a]:[transition:color_150ms_ease-out]'
        }
      >
        <Link
          href="/"
          className={
            'marketing-brand inline-flex items-center gap-[0.6rem] font-[800] text-[length:1.8rem] leading-[1] font-heading text-foreground no-underline [&_svg]:w-[2.4rem] [&_svg]:h-[2.8rem] max-[48rem]:text-2xl max-[48rem]:[&_svg]:w-8'
          }
          aria-label="PawTrail home"
        >
          <PawMarker />
          PawTrail
        </Link>
        <nav aria-label="Public navigation">
          <a href="#discover">Discover</a>
          <a href="#adoption">Adopt</a>
          <a href="#help">Help</a>
          <a href="#stories">Stories</a>
        </nav>
        <div
          className={
            'marketing-account [&_>_a:not([data-slot])]:inline-flex [&_>_a:not([data-slot])]:min-h-11 [&_>_a:not([data-slot])]:items-center [&_>_a:not([data-slot])]:text-[length:0.9375rem] [&_>_a:not([data-slot])]:font-semibold [&_>_a:not([data-slot])]:no-underline flex gap-5 items-center max-[64rem]:ml-auto max-[48rem]:gap-3 max-[48rem]:[&_[data-slot]]:px-3 max-[48rem]:[&_[data-slot]]:text-sm'
          }
        >
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
          <p
            className={
              'marketing-demo m-0 py-3 text-muted-foreground text-[0.8125rem] text-center [border-bottom:1px_solid_var(--border)] max-[48rem]:text-left'
            }
          >
            You’re exploring a sample community. Profiles, stories,
            verification, and contributions are illustrative.
          </p>
        )}
        <Hero data={data} readyRoutes={readyRoutes} />
        <section
          className={
            'sample-statistics [border-block:1px_solid_var(--border)] [padding-block:1.75rem_1rem] [&_dl]:grid [&_dl]:grid-cols-[repeat(4,_1fr)] [&_dl]:gap-6 [&_dl]:m-0 [&_dl_>_div]:flex [&_dl_>_div]:flex-col-reverse [&_dl_>_div]:px-4 [&_dl_>_div]:[border-inline-start:1px_solid_var(--border)] [&_dl_>_div:first-child]:pl-0 [&_dl_>_div:first-child]:[border:0] [&_dt]:text-[0.8125rem] [&_dt]:text-muted-foreground [&_dd]:m-0 [&_dd]:font-[800] [&_dd]:text-[2rem] [&_dd]:leading-[1.2] [&_dd]:font-heading [&_dd]:tabular-nums [&_>_p]:text-xs [&_>_p]:text-muted-foreground [&_>_p]:[margin:1.25rem_0_0] max-[48rem]:[&_dl]:grid-cols-[1fr_1fr] max-[48rem]:[&_dl]:[gap:1.5rem_1rem] max-[48rem]:[&_dl_>_div]:[border:0] max-[48rem]:[&_dl_>_div]:p-0'
          }
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
        <section
          className={
            'marketing-close [&_h2]:[margin:0_0_1rem] [&_h2]:text-[length:clamp(1.85rem,_3vw,_2.6rem)] [&_h2]:font-extrabold [&_h2]:[letter-spacing:-0.025em] [padding:4.5rem_1rem] text-center max-w-168 mx-auto [&_p]:text-muted-foreground [&_p]:mb-6 max-[48rem]:py-12'
          }
        >
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
      <footer
        className={
          'marketing-footer [&_nav_a]:inline-flex [&_nav_a]:min-h-11 [&_nav_a]:items-center [&_nav_a]:text-[length:0.9375rem] [&_nav_a]:font-semibold [&_nav_a]:no-underline [&_a:hover]:underline flex flex-wrap justify-between items-start gap-8 [border-top:1px_solid_var(--border)] py-10 [&_p]:text-muted-foreground [&_p]:text-[0.8125rem] [&_nav]:flex [&_nav]:flex-col [&_nav]:gap-2 max-[48rem]:gap-4 max-[48rem]:[&_>_p]:[flex-basis:100%]'
        }
      >
        <div>
          <Link
            className={
              'marketing-brand inline-flex items-center gap-[0.6rem] font-[800] text-[length:1.8rem] leading-[1] font-heading text-foreground no-underline [&_svg]:w-[2.4rem] [&_svg]:h-[2.8rem] max-[48rem]:text-2xl max-[48rem]:[&_svg]:w-8'
            }
            href="/"
          >
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
