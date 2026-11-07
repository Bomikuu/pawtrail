import { AnimatedNumber } from '@/components/shared/animated-number'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  Award,
  CalendarDays,
  Check,
  Heart,
  Home,
  ImagePlus,
  MapPin,
  NotebookText,
  PawPrint,
  Sprout,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react'
import { RankCrown } from '@/features/kibble/rank-crown'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { AnimalImage } from '@/components/shared/animal-image'
import { StatusBadge } from '@/components/shared/status-badge'
import { FollowButton } from './follow-button'
import { BadgeShelf, MasteryPanel } from '@/features/achievements/badge-shelf'
import { ButtonLink } from '@/components/ui/button-link'
import { Progress } from '@/components/ui/progress'
import { ProfileBanner } from './profile-banner'
import {
  ProfileActivity,
  ProfileStories,
  type ProfileTab,
} from './profile-activity'
import type { PublicProfile as Profile } from './types'

export function PublicProfile({
  profile,
  tab = 'overview',
  isOwn = false,
  selectedBadge,
}: {
  profile: Profile
  tab?: ProfileTab
  isOwn?: boolean
  selectedBadge?: string
}) {
  const returnTo = `/users/${encodeURIComponent(profile.username)}`
  const summary = profile.summary
  const joined = new Intl.DateTimeFormat('en-PH', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(new Date(profile.createdAt))
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'stories', label: 'Stories', icon: NotebookText },
    { id: 'sightings', label: 'Sightings', icon: MapPin },
    { id: 'missions', label: 'Missions', icon: Check },
    { id: 'contributions', label: 'Contributions', icon: Heart },
  ] as const
  return (
    <article
      className={
        'user-profile max-w-208 mx-auto pawpal-profile w-full max-w-none m-0 bg-card rounded-2xl pb-6 [.app-content_&_h1]:text-[length:clamp(1.625rem,_2.5vw,_2.25rem)] [.app-content_&_h1]:[line-height:1.2] [.app-content_&_h1]:m-0 max-[48rem]:[.app-content_&_h1]:text-2xl'
      }
    >
      <header className="pawpal-profile-header">
        <div
          className={
            'profile-cover relative h-[clamp(10rem,_17vw,_15rem)] rounded-[1rem_1rem_0.5rem_0.5rem] overflow-hidden bg-[#e2eddd] max-[48rem]:h-36'
          }
        >
          <ProfileBanner id={profile.bannerId} />
          {isOwn && (
            <ButtonLink
              className={
                'profile-cover-edit absolute bottom-3 right-3 bg-card text-[0.8125rem] max-[48rem]:p-2 max-[48rem]:text-[0.6875rem]'
              }
              href="/dashboard/profile#profile-banner-picker"
              variant="outline"
            >
              <ImagePlus size={16} aria-hidden="true" />
              Change banner
            </ButtonLink>
          )}
        </div>
        <div
          className={
            'profile-identity-row grid grid-cols-[10rem_minmax(0,_1fr)_auto] gap-5 items-start [padding:0_1.5rem_1.25rem] max-[76rem]:grid-cols-[8rem_minmax(0,_1fr)] max-[76rem]:gap-4 max-[48rem]:[padding:0_1rem_1rem] max-[48rem]:grid-cols-[5.75rem_minmax(0,_1fr)] max-[48rem]:gap-3'
          }
        >
          <div
            className={
              'profile-avatar-overlap mt-[-3.5rem] relative max-[48rem]:mt-[-2.5rem]'
            }
          >
            <CommunityAvatar
              name={profile.displayName}
              image={profile.avatar}
              large
            />
          </div>
          <div
            className={'profile-main-identity pt-3 min-w-0 max-[48rem]:pt-2.5'}
          >
            <div
              className={
                'profile-recognized-name flex flex-wrap items-center [gap:0.5rem_1rem] mb-2 [.app-content_&_h1]:mb-0 [.app-content_&_h1]:[overflow-wrap:anywhere] max-[48rem]:gap-2 [.pawpal-profile_&]:[gap:0.375rem_0.75rem] [.pawpal-profile_&]:mb-1'
              }
            >
              <h1>{profile.displayName}</h1>
              <RankCrown rank={profile.leaderboardRank} prominent />
            </div>
            <p
              className={
                'profile-username [margin:0_0_0.375rem] text-sm text-muted-foreground [overflow-wrap:anywhere]'
              }
            >
              @{profile.username}
            </p>
            <StatusBadge>{profile.provenance.label}</StatusBadge>
            {summary && profile.level !== null && (
              <div
                className={
                  'profile-level-progress flex flex-wrap items-center [gap:0.5rem_0.75rem] mt-3.5 [&_>_span]:inline-flex [&_>_span]:items-center [&_>_span]:gap-1.5 [&_>_span]:font-[800] [&_>_span]:text-[0.8125rem] [&_>_span]:leading-[1.4] [&_>_span]:font-heading [&_>_span_>_svg]:text-[#b95308] [&_>_span_>_svg]:shrink-0 [&_[data-slot=progress]]:[flex:1_1_8rem] [&_[data-slot=progress]]:max-w-60 [&_[data-slot=progress]]:min-w-20 [&_[data-slot=progress]]:h-2 [&_[data-slot=progress]]:[accent-color:#d85c0b] [&_[data-slot=progress]::-webkit-progress-value]:bg-[#d85c0b] [&_[data-slot=progress]::-moz-progress-bar]:bg-[#d85c0b] [&_small]:text-muted-foreground [&_small]:text-[0.6875rem] [&_small]:tabular-nums max-[48rem]:mt-2.5 max-[48rem]:[&_>_span]:text-xs max-[48rem]:[&_[data-slot=progress]]:[flex-basis:100%] max-[48rem]:[&_[data-slot=progress]]:max-w-none'
                }
              >
                <span>
                  <PawPrint size={20} aria-hidden="true" />
                  Level {profile.level}
                  {profile.mastery && ' · ' + profile.mastery.tier}
                </span>
                {profile.impact && (
                  <>
                    <Progress
                      max={100}
                      value={profile.impact.levelProgress}
                      aria-label={`${profile.impact.levelProgress} of 100 Kibble toward level ${profile.level + 1}`}
                    />
                    <small>
                      {profile.impact.levelProgress} / 100 Kibble{' '}
                      <span title="One level for every 100 lifetime net Kibble; Kibble is a non-cash reward.">
                        to level {profile.level + 1}
                      </span>
                    </small>
                  </>
                )}
              </div>
            )}
          </div>
          <div
            className={
              'profile-identity-actions pt-5 [&_[data-slot=button]]:min-w-24 max-[76rem]:[grid-column:2] max-[76rem]:pt-0'
            }
          >
            {isOwn ? (
              <ButtonLink href="/dashboard/profile" variant="outline">
                Edit profile
              </ButtonLink>
            ) : (
              <FollowButton
                target={{ kind: 'user', id: profile.id }}
                name={profile.displayName}
                returnTo={returnTo}
                compact
              />
            )}
          </div>
        </div>
      </header>
      {summary && (
        <dl
          className={
            'profile-stat-strip grid grid-cols-4 gap-4 [margin:0_1.5rem_1.5rem] [&_>_div]:relative [&_>_div]:grid [&_>_div]:grid-cols-[3rem_minmax(0,_1fr)] [&_>_div]:[gap:0.125rem_0.75rem] [&_>_div]:p-4 [&_>_div]:[border:1px_solid_var(--border)] [&_>_div]:rounded-2xl [&_>_div]:min-h-21 [&_dt]:[grid-column:2] [&_dt]:[grid-row:2] [&_dt]:text-xs [&_dt]:[line-height:1.4] [&_dt_svg]:absolute [&_dt_svg]:top-[50%] [&_dt_svg]:left-4 [&_dt_svg]:[transform:translateY(-50%)] [&_dt_svg]:p-2.5 [&_dt_svg]:w-12 [&_dt_svg]:h-12 [&_dt_svg]:rounded-full [&_dd]:[grid-column:2] [&_dd]:[grid-row:1] [&_dd]:m-0 [&_dd]:font-[900] [&_dd]:text-[length:1.625rem] [&_dd]:leading-[1.1] [&_dd]:font-heading [&_dd]:tabular-nums max-[76rem]:gap-2.5 max-[76rem]:[&_>_div]:p-3 max-[76rem]:[&_>_div]:grid-cols-[2.25rem_minmax(0,_1fr)] max-[76rem]:[&_>_div]:[gap:0.125rem_0.5rem] max-[76rem]:[&_dt_svg]:left-3 max-[76rem]:[&_dt_svg]:w-9 max-[76rem]:[&_dt_svg]:h-9 max-[76rem]:[&_dt_svg]:p-2 max-[60rem]:grid-cols-2 max-[48rem]:[margin:0_1rem_1rem] max-[48rem]:[&_dd]:text-2xl max-[48rem]:[&_dt]:text-[0.6875rem]'
          }
          aria-label="Public community contributions"
        >
          <div
            className={
              'profile-stat-stories [.profile-stat-strip_>_&]:bg-[#f4f8e9] [.profile-stat-strip_>_&]:border-[#cadba7] [.profile-stat-strip_>_&]:text-[#2f5220] [&_svg]:bg-[#e1efc6]'
            }
          >
            <dt>
              <PawPrint aria-hidden="true" />
              Stories
            </dt>
            <dd>
              <AnimatedNumber value={summary.stories} />
            </dd>
          </div>
          <div
            className={
              'profile-stat-sightings [.profile-stat-strip_>_&]:bg-[#fff5e7] [.profile-stat-strip_>_&]:border-[#e9cb9a] [.profile-stat-strip_>_&]:text-[#7b420e] [&_svg]:bg-[#ffe6b4]'
            }
          >
            <dt>
              <MapPin aria-hidden="true" />
              Sightings
            </dt>
            <dd>
              <AnimatedNumber value={summary.sightings} />
            </dd>
          </div>
          <div
            className={
              'profile-stat-missions [.profile-stat-strip_>_&]:bg-[#edf8f5] [.profile-stat-strip_>_&]:border-[#b0d4ca] [.profile-stat-strip_>_&]:text-[#155b4b] [&_svg]:bg-[#cfebe2]'
            }
          >
            <dt>
              <Check aria-hidden="true" />
              Approved missions
            </dt>
            <dd>
              <AnimatedNumber value={summary.missions} />
            </dd>
          </div>
          <div
            className={
              'profile-stat-support [.profile-stat-strip_>_&]:bg-[#fff0ec] [.profile-stat-strip_>_&]:border-[#edc6b9] [.profile-stat-strip_>_&]:text-[#8a3929] [&_svg]:bg-[#ffd9ce]'
            }
          >
            <dt>
              <Heart aria-hidden="true" />
              Fundraisers supported
            </dt>
            <dd>
              <AnimatedNumber value={summary.donations} />
            </dd>
          </div>
        </dl>
      )}
      <div
        className={
          'profile-columns grid grid-cols-[minmax(14rem,_18rem)_minmax(0,_1fr)] gap-6 px-6 items-start max-[76rem]:grid-cols-[minmax(12rem,_15rem)_minmax(0,_1fr)] max-[76rem]:gap-4 max-[60rem]:grid-cols-1 max-[48rem]:px-4'
        }
      >
        <aside
          className={
            'profile-about-column min-w-0 grid gap-4 max-[60rem]:grid-cols-2 max-[60rem]:[&_>_[data-slot=button]]:[grid-column:1_/_-1] max-[60rem]:[&_>_[data-slot=button]]:[justify-self:start] max-[48rem]:grid-cols-1 max-[48rem]:[&_>_[data-slot=button]]:[justify-self:stretch]'
          }
          aria-label="About this PawPal"
        >
          <section
            className={
              'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem] profile-about [&_>_p]:text-[0.8125rem] [&_>_p]:whitespace-pre-wrap [&_>_p]:[overflow-wrap:anywhere] [&_>_p]:[margin:0_0_1rem] [&_dl]:[border-top:1px_solid_#eadfce] [&_dl]:pt-3.5 [&_dl]:m-0 [&_dl]:grid [&_dl]:gap-3 [&_dl_>_div]:flex [&_dl_>_div]:flex-wrap [&_dl_>_div]:[gap:0.25rem_0.5rem] [&_dl_>_div]:text-xs [&_dt]:inline-flex [&_dt]:items-center [&_dt]:gap-1.5 [&_dt]:font-semibold [&_dd]:m-0 [&_dd]:text-muted-foreground [&_svg]:shrink-0'
            }
          >
            <h2>
              <PawPrint size={21} aria-hidden="true" />
              About
            </h2>
            <p>{profile.bio || 'This PawPal hasn’t added a bio yet.'}</p>
            <dl>
              <div>
                <dt>
                  <MapPin size={16} aria-hidden="true" />
                  Neighborhood
                </dt>
                <dd>{profile.location?.neighborhood ?? 'Not shared'}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={16} aria-hidden="true" />
                  Joined
                </dt>
                <dd>{joined}</dd>
              </div>
            </dl>
          </section>
          {summary && (
            <section
              className={
                'profile-surface p-4.5 [border:1px_solid_#e8dac8] rounded-2xl min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_svg]:text-[#b95308] [&_h2_svg]:shrink-0 [&_h2_>_span]:text-[length:0.9375rem] max-[48rem]:p-3.5 max-[48rem]:[&_h2]:text-[length:1.0625rem] profile-impact [&_dl]:m-0 [&_dl_>_div]:flex [&_dl_>_div]:justify-between [&_dl_>_div]:gap-3 [&_dl_>_div]:[padding:0.625rem_0] [&_dl_>_div]:text-xs [&_dl_>_div_+_div]:[border-top:1px_solid_#ece2d3] [&_dt]:inline-flex [&_dt]:items-center [&_dt]:gap-2.5 [&_dt_svg]:text-[#b95308] [&_dt_svg]:shrink-0 [&_dd]:m-0 [&_dd]:[font-weight:750] [&_dd]:tabular-nums [&_>_p]:text-[0.6875rem] [&_>_p]:text-muted-foreground [&_>_p]:[margin:0.75rem_0_0]'
              }
            >
              <h2>
                <TrendingUp size={21} aria-hidden="true" />
                Community impact
              </h2>
              <dl>
                {profile.impact && (
                  <div>
                    <dt>
                      <PawPrint size={18} aria-hidden="true" />
                      Net Kibble earned
                    </dt>
                    <dd>
                      <AnimatedNumber value={profile.impact.kibbleEarned} />
                    </dd>
                  </div>
                )}
                <div>
                  <dt>
                    <Heart size={18} aria-hidden="true" />
                    Animals supported
                  </dt>
                  <dd>
                    <AnimatedNumber value={profile.animalsHelped.length} />
                  </dd>
                </div>
                {profile.impact && (
                  <>
                    <div>
                      <dt>
                        <CalendarDays size={18} aria-hidden="true" />
                        Event RSVPs
                      </dt>
                      <dd>
                        <AnimatedNumber value={profile.impact.eventsJoined} />
                      </dd>
                    </div>
                    <div>
                      <dt>
                        <Sprout size={18} aria-hidden="true" />
                        Member for
                      </dt>
                      <dd>
                        <AnimatedNumber value={profile.impact.membershipDays} />{' '}
                        days
                      </dd>
                    </div>
                  </>
                )}
              </dl>
              <p>
                From public contributions. Kibble is non-cash; animal links do
                not certify rescue or adoption outcomes.
              </p>
            </section>
          )}
          {isOwn && (
            <ButtonLink href="/dashboard/settings" variant="ghost">
              Manage profile privacy
            </ButtonLink>
          )}
        </aside>
        <div
          className={
            'profile-main-column min-w-0 grid gap-4 [scroll-margin-top:6rem]'
          }
          id="profile-activity"
        >
          {summary ? (
            <>
              <nav
                className={
                  'profile-tabs w-full min-w-0 flex items-center [border:1px_solid_#e8dac8] rounded-full p-0.5 gap-0.5 overflow-x-auto max-w-full [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:gap-1.5 [&_a]:[padding:0.625rem_0.75rem] [&_a]:rounded-full [&_a]:min-h-11 [&_a]:[flex:1_0_auto] [&_a]:no-underline [&_a]:text-xs [&_a]:[font-weight:650] [&_a]:text-foreground [&_a]:whitespace-nowrap [&_a:hover]:bg-[#f4ecde] [&_a[aria-current=page]]:bg-[var(--teal)] [&_a[aria-current=page]]:text-[white] max-[48rem]:rounded-xl max-[48rem]:[&_a]:text-[0.6875rem] max-[48rem]:[&_a]:px-2.5 [@media(forced-colors:_active)]:[&_a[aria-current=page]]:[outline:2px_solid_Highlight]'
                }
                aria-label="Profile activity"
              >
                {tabs.map(({ id, label, icon: Icon }) => (
                  <Link
                    key={id}
                    href={`${returnTo}?tab=${id}#profile-activity`}
                    aria-current={tab === id ? 'page' : undefined}
                  >
                    <Icon size={17} aria-hidden="true" />
                    {label}
                  </Link>
                ))}
              </nav>
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
            </>
          ) : (
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
    </article>
  )
}
