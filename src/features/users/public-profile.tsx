import Link from 'next/link'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { StatusBadge } from '@/components/shared/status-badge'
import { FollowButton } from './follow-button'
import { BadgeShelf, MasteryPanel } from '@/features/achievements/badge-shelf'
import { ButtonLink } from '@/components/ui/button-link'
import type { PublicProfile as Profile } from './types'
export function PublicProfile({ profile }: { profile: Profile }) {
  const returnTo = `/users/${encodeURIComponent(profile.username)}`
  return (
    <article className="user-profile">
      <header className="user-identity">
        <CommunityAvatar
          name={profile.displayName}
          image={profile.avatar}
          large
        />
        <div>
          <h1>{profile.displayName}</h1>
          <p>@{profile.username}</p>
          <StatusBadge>{profile.provenance.label}</StatusBadge>
        </div>
        <FollowButton
          target={{ kind: 'user', id: profile.id }}
          name={profile.displayName}
          returnTo={returnTo}
        />
      </header>
      {profile.bio && <p className="profile-bio">{profile.bio}</p>}
      {profile.location && <p>Neighborhood: {profile.location.neighborhood}</p>}
      <section
        className="profile-section"
        aria-labelledby="contributions-heading"
      >
        <h2 id="contributions-heading">Community contributions</h2>
        {profile.summary ? (
          <>
            <p>
              {profile.contributionCount} public contributions recorded. Sample
              donations transfer no money.
            </p>
            <dl className="contribution-summary">
              <div>
                <dt>Stories</dt>
                <dd>{profile.summary.stories}</dd>
              </div>
              <div>
                <dt>Sightings</dt>
                <dd>{profile.summary.sightings}</dd>
              </div>
              <div>
                <dt>Approved missions</dt>
                <dd>{profile.summary.missions}</dd>
              </div>
              <div>
                <dt>Public demo contributions</dt>
                <dd>{profile.summary.donations}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p>This member keeps contributions private.</p>
        )}
        {profile.summary && (
          <>
            <p>
              {profile.level === null
                ? 'Level is not available yet.'
                : `Level ${profile.level}`}
            </p>
          </>
        )}
      </section>
      {profile.summary && (
        <section
          className="profile-section"
          aria-labelledby="profile-achievements"
        >
          <div className="rail-heading">
            <h2 id="profile-achievements">Achievement showcase</h2>
            <ButtonLink href="/dashboard/achievements" variant="ghost">
              Explore badges
            </ButtonLink>
          </div>
          {profile.mastery && <MasteryPanel summary={profile.mastery} />}
          {profile.badges.length ? (
            <BadgeShelf badges={profile.badges} />
          ) : (
            <p>No badges showcased yet.</p>
          )}
        </section>
      )}
      {profile.summary && (
        <>
          <section
            className="profile-section"
            aria-labelledby="animals-helped-heading"
          >
            <h2 id="animals-helped-heading">Animals helped</h2>
            {profile.animalsHelped.length ? (
              <ul className="helped-animals">
                {profile.animalsHelped.map((animal) => (
                  <li key={animal.id}>
                    {animal.photo && <AnimalImage image={animal.photo} />}
                    <Link href={`/pets/${encodeURIComponent(animal.slug)}`}>
                      {animal.name}
                    </Link>
                    <FollowButton
                      target={{ kind: 'animal', id: animal.id }}
                      name={animal.name}
                      returnTo={returnTo}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p>No public animal-help contributions recorded yet.</p>
            )}
          </section>
          <section
            className="profile-section"
            aria-labelledby="user-stories-heading"
          >
            <h2 id="user-stories-heading">Stories</h2>
            {profile.stories.length ? (
              <div className="user-stories">
                {profile.stories.map((post) => (
                  <article className="post-card" key={post.id}>
                    <p>{post.text}</p>
                    {post.media[0] && <AnimalImage image={post.media[0]} />}
                    <Link href={`/community/${encodeURIComponent(post.id)}`}>
                      Read story
                    </Link>
                  </article>
                ))}
              </div>
            ) : (
              <p>No public stories shared yet.</p>
            )}
          </section>
        </>
      )}
    </article>
  )
}
