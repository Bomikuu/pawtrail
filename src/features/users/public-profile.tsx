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
    <article className="user-profile pawpal-profile">
      <header className="pawpal-profile-header">
        <div className="profile-cover">
          <ProfileBanner id={profile.bannerId} />
          {isOwn && (
            <ButtonLink
              className="profile-cover-edit"
              href="/dashboard/profile#profile-banner-picker"
              variant="outline"
            >
              <ImagePlus size={16} aria-hidden="true" />
              Change banner
            </ButtonLink>
          )}
        </div>
        <div className="profile-identity-row">
          <div className="profile-avatar-overlap">
            <CommunityAvatar
              name={profile.displayName}
              image={profile.avatar}
              large
            />
          </div>
          <div className="profile-main-identity">
            <div className="profile-recognized-name">
              <h1>{profile.displayName}</h1>
              <RankCrown rank={profile.leaderboardRank} prominent />
            </div>
            <p className="profile-username">@{profile.username}</p>
            <StatusBadge>{profile.provenance.label}</StatusBadge>
            {summary && profile.level !== null && (
              <div className="profile-level-progress">
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
          <div className="profile-identity-actions">
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
          className="profile-stat-strip"
          aria-label="Public community contributions"
        >
          <div className="profile-stat-stories">
            <dt>
              <PawPrint aria-hidden="true" />
              Stories
            </dt>
            <dd>
              <AnimatedNumber value={summary.stories} />
            </dd>
          </div>
          <div className="profile-stat-sightings">
            <dt>
              <MapPin aria-hidden="true" />
              Sightings
            </dt>
            <dd>
              <AnimatedNumber value={summary.sightings} />
            </dd>
          </div>
          <div className="profile-stat-missions">
            <dt>
              <Check aria-hidden="true" />
              Approved missions
            </dt>
            <dd>
              <AnimatedNumber value={summary.missions} />
            </dd>
          </div>
          <div className="profile-stat-support">
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
      <div className="profile-columns">
        <aside className="profile-about-column" aria-label="About this PawPal">
          <section className="profile-surface profile-about">
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
            <section className="profile-surface profile-impact">
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
        <div className="profile-main-column" id="profile-activity">
          {summary ? (
            <>
              <nav className="profile-tabs" aria-label="Profile activity">
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
                    className="profile-surface profile-achievement-section"
                    aria-labelledby="profile-achievements"
                  >
                    <div className="profile-section-title">
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
                      <p className="profile-empty-copy">
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
                    className="profile-surface"
                    aria-labelledby="animals-helped-heading"
                  >
                    <div className="profile-section-title">
                      <h2 id="animals-helped-heading">
                        <PawPrint size={21} aria-hidden="true" />
                        Animals supported{' '}
                        <span>({profile.animalsHelped.length})</span>
                      </h2>
                    </div>
                    {profile.animalsHelped.length ? (
                      <ul className="profile-supported-animals">
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
                      <p className="profile-empty-copy">
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
            <section className="profile-surface profile-private-contributions">
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
