import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowUpRight, Award, Heart, PawPrint } from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { BadgeShelf, MasteryPanel } from '@/features/achievements/badge-shelf'
import { ButtonLink } from '@/components/ui/button-link'
import { FollowButton } from './follow-button'
import { ProfileActivity, ProfileStories, type ProfileTab } from './profile-activity'
import { PublicProfileHeader } from './public-profile-header'
import { PublicProfileDetails } from './public-profile-details'
import { ProfileTabs } from './profile-tabs'
import type { PublicProfile as Profile } from './types'

export function PublicProfile({ profile, tab = 'overview', isOwn = false, selectedBadge }: { profile: Profile; tab?: ProfileTab; isOwn?: boolean; selectedBadge?: string }) {
  const returnTo = `/users/${encodeURIComponent(profile.username)}`
  const summary = profile.summary
  return <article className="user-profile pawpal-profile @container/user-profile mx-auto w-full min-w-0 max-w-281 pb-6">
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(15rem,18.75rem)] items-start gap-6 @max-[52rem]/user-profile:grid-cols-1 @max-[52rem]/user-profile:gap-4">
      <div className="min-w-0 w-full max-w-200 rounded-2xl bg-card @max-[52rem]/user-profile:mx-auto">
        <PublicProfileHeader profile={profile} isOwn={isOwn} returnTo={returnTo} />
        {summary && <ProfileTabs path={returnTo} current={tab} />}
        <div id="profile-activity" className="grid min-w-0 scroll-mt-24 gap-5 p-5 @max-[38rem]/user-profile:p-4">
          {summary ? <>
              {tab === 'overview' ? (
                <>
                  <section
                    className={
                      'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem] profile-achievement-section'
                    }
                    aria-labelledby="profile-achievements"
                  >
                    <div
                      className={
                        'profile-section-title flex flex-wrap items-center justify-between [gap:0.5rem_1rem] pb-2.5 [border-bottom:1px_solid_#ece2d3] mb-3 [&_h2]:m-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:gap-1 [&_>_a]:text-xs [&_>_a]:min-h-11 [&_>_a]:[font-weight:650] [&_>_a]:text-[color:var(--teal)] [&_>_a]:no-underline [&_>_a:hover]:underline [&_>_a:hover]:[text-underline-offset:0.2em]'
                      }
                    >
                      <h2 id="profile-achievements">
                        <Award size={21} aria-hidden="true" />
                        Achievement showcase
                      </h2>
                      <Link href="/dashboard/achievements">
                        {isOwn ? 'Choose your badges' : 'Explore badges'}
                        <ArrowUpRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                    {profile.badges.length ? (
                      <BadgeShelf
                        badges={profile.badges}
                        selectedBadge={selectedBadge}
                      />
                    ) : (
                      <p
                        className={
                          'profile-empty-copy text-muted-foreground text-[0.8125rem] [margin:0.5rem_0]'
                        }
                      >
                        No badges showcased yet.
                        {isOwn &&
                          ' Choose earned badges in your achievements workspace.'}
                      </p>
                    )}
                    {profile.mastery && (
                      <MasteryPanel summary={profile.mastery} />
                    )}
                  </section>
                  <section
                    className={
                      'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem]'
                    }
                    aria-labelledby="animals-helped-heading"
                  >
                    <div
                      className={
                        'profile-section-title flex flex-wrap items-center justify-between [gap:0.5rem_1rem] pb-2.5 [border-bottom:1px_solid_#ece2d3] mb-3 [&_h2]:m-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:gap-1 [&_>_a]:text-xs [&_>_a]:min-h-11 [&_>_a]:[font-weight:650] [&_>_a]:text-[color:var(--teal)] [&_>_a]:no-underline [&_>_a:hover]:underline [&_>_a:hover]:[text-underline-offset:0.2em]'
                      }
                    >
                      <h2 id="animals-helped-heading">
                        <PawPrint size={21} aria-hidden="true" />
                        Animals supported{' '}
                        <span>({profile.animalsHelped.length})</span>
                      </h2>
                    </div>
                    {profile.animalsHelped.length ? (
                      <ul
                        className={
                          'profile-supported-animals list-none p-0 m-0 grid grid-cols-2 gap-3 [&_>_li]:flex [&_>_li]:items-center [&_>_li]:gap-2.5 [&_>_li]:p-2.5 [&_>_li]:[border:1px_solid_#e7ded1] [&_>_li]:rounded-xl [&_>_li]:min-w-0 [&_>_li_>_img]:w-16 [&_>_li_>_img]:h-13 [&_>_li_>_img]:object-cover [&_>_li_>_img]:rounded-lg [&_>_li_>_img]:shrink-0 [&_>_li_>_div:not(.animal-image-fallback)]:[flex:1] [&_>_li_>_div:not(.animal-image-fallback)]:min-w-0 [&_>_li_>_div_>_a]:block [&_>_li_>_div_>_a]:text-foreground [&_>_li_>_div_>_a]:font-[850] [&_>_li_>_div_>_a]:text-[length:0.9375rem] [&_>_li_>_div_>_a]:leading-[1.3] [&_>_li_>_div_>_a]:font-heading [&_>_li_>_div_>_a]:no-underline [&_>_li_>_div_>_a]:[overflow-wrap:anywhere] [&_>_li_>_div_>_a:hover]:underline [&_>_li_>_div_>_span]:block [&_>_li_>_div_>_span]:text-[0.6875rem] [&_>_li_>_div_>_span]:text-muted-foreground [&_[data-slot=button]]:text-xs [&_[data-slot=button]]:px-2.5 max-[76rem]:grid-cols-1'
                        }
                      >
                        {profile.animalsHelped.map((animal) => (
                          <li key={animal.id}>
                            <AnimalImage image={animal.photo} compact />
                            <div>
                              <Link
                                href={
                                  '/pets/' + encodeURIComponent(animal.slug)
                                }
                              >
                                {animal.name}
                              </Link>
                              <span>
                                {animal.species === 'cat'
                                  ? 'Community cat'
                                  : animal.species === 'dog'
                                    ? 'Community dog'
                                    : 'Community animal'}
                              </span>
                            </div>
                            <FollowButton
                              target={{ kind: 'animal', id: animal.id }}
                              name={animal.name}
                              returnTo={returnTo}
                              compact
                            />
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p
                        className={
                          'profile-empty-copy text-muted-foreground text-[0.8125rem] [margin:0.5rem_0]'
                        }
                      >
                        No public animal-help contributions recorded yet.
                      </p>
                    )}
                  </section>
                  <ProfileStories profile={profile} preview />
                </>
              ) : tab === 'stories' ? (
                <ProfileStories profile={profile} />
              ) : (
                <ProfileActivity profile={profile} tab={tab} />
              )}
          </> : (
            <section
              className={
                'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem] profile-private-contributions [padding:2.5rem_1rem] text-center [&_h2]:justify-center [&_h2]:mt-3 [&_>_svg]:text-[color:var(--teal)] [&_p]:text-muted-foreground [&_p]:text-sm'
              }
            >
              <Heart size={28} aria-hidden="true" />
              <h2>Contributions are private</h2>
              <p>This PawPal keeps their activity and achievements private.</p>
              {isOwn && (
                <ButtonLink href="/dashboard/settings" variant="outline">
                  Manage privacy settings
                </ButtonLink>
              )}
            </section>
          )}
        </div>
      </div>
      <PublicProfileDetails profile={profile} isOwn={isOwn} />
    </div>
  </article>
}
