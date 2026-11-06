import Link from 'next/link'
import {
  CalendarDays,
  Check,
  Heart,
  MapPin,
  MessageCircle,
  PawPrint,
  ArrowUpRight,
} from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { RankCrown } from '@/features/kibble/rank-crown'
import type { PublicProfile } from './types'
export type ProfileTab =
  'overview' | 'stories' | 'sightings' | 'missions' | 'contributions'
export function profileDate(value: string) {
  return new Intl.DateTimeFormat('en-PH', {
    dateStyle: 'medium',
    timeZone: 'Asia/Manila',
  }).format(new Date(value))
}
export function ProfileStories({
  profile,
  preview = false,
}: {
  profile: PublicProfile
  preview?: boolean
}) {
  const stories = preview ? profile.stories.slice(0, 3) : profile.stories
  return (
    <section
      className="profile-surface profile-stories-section"
      aria-labelledby="user-stories-heading"
    >
      <div className="profile-section-title">
        <h2 id="user-stories-heading">
          <PawPrint size={21} aria-hidden="true" /> Stories{' '}
          <span>({profile.summary?.stories ?? 0})</span>
        </h2>
        {preview && stories.length > 0 && (
          <Link href={`?tab=stories#profile-activity`}>
            View all <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        )}
      </div>
      {stories.length ? (
        <ul className="profile-story-list">
          {stories.map((post) => (
            <li key={post.id}>
              {post.media[0] && (
                <AnimalImage
                  image={post.media[0]}
                  className="profile-story-photo"
                />
              )}
              <article>
                <div className="profile-story-meta">
                  <span>{post.author.displayName}</span>
                  <RankCrown rank={post.author.leaderboardRank} />
                  <time dateTime={post.createdAt}>
                    {profileDate(post.createdAt)}
                  </time>
                </div>
                <h3>
                  <Link
                    className="story-summary"
                    href={'/community/' + encodeURIComponent(post.id)}
                  >
                    {post.text}
                  </Link>
                </h3>
                <div className="profile-story-footer">
                  <Link href={'/community/' + encodeURIComponent(post.id)}>
                    Read story <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                  <span>
                    <Heart size={16} aria-hidden="true" />
                    {post.reactionCount}
                    <span className="sr-only"> reactions</span>
                    <MessageCircle size={16} aria-hidden="true" />
                    {post.commentCount}
                    <span className="sr-only"> comments</span>
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      ) : (
        <p className="profile-empty-copy">No public stories shared yet.</p>
      )}
    </section>
  )
}
export function ProfileActivity({
  profile,
  tab,
}: {
  profile: PublicProfile
  tab: Exclude<ProfileTab, 'overview' | 'stories'>
}) {
  const kind =
    tab === 'sightings' ? 'sighting' : tab === 'missions' ? 'mission' : null
  const entries = (profile.activities ?? []).filter(
    (entry) => !kind || entry.kind === kind,
  )
  const title =
    tab === 'sightings'
      ? 'Published sightings'
      : tab === 'missions'
        ? 'Approved missions'
        : 'Recorded contributions'
  return (
    <section
      className="profile-surface"
      aria-labelledby="profile-activity-heading"
    >
      <div className="profile-section-title">
        <h2 id="profile-activity-heading">
          {tab === 'sightings' ? (
            <MapPin size={21} aria-hidden="true" />
          ) : tab === 'missions' ? (
            <Check size={21} aria-hidden="true" />
          ) : (
            <Heart size={21} aria-hidden="true" />
          )}
          {title}
        </h2>
      </div>
      {tab === 'contributions' && (
        <p className="profile-activity-explanation">
          Public sightings, independently approved missions and distinct
          fundraisers supported. Stories have their own tab.
        </p>
      )}
      {entries.length ? (
        <ol className="profile-activity-list">
          {entries.map((entry) => (
            <li key={entry.kind + ':' + entry.id}>
              <span className={'profile-activity-icon activity-' + entry.kind}>
                {entry.kind === 'sighting' ? (
                  <MapPin size={20} aria-hidden="true" />
                ) : entry.kind === 'mission' ? (
                  <Check size={20} aria-hidden="true" />
                ) : (
                  <Heart size={20} aria-hidden="true" />
                )}
              </span>
              <div>
                <span className="profile-activity-kind">
                  {entry.kind === 'sighting'
                    ? 'Published sighting'
                    : entry.kind === 'mission'
                      ? 'Approved mission'
                      : 'Fundraiser supported'}
                </span>
                <h3>
                  <Link href={entry.href}>{entry.title}</Link>
                </h3>
                <p>{entry.description}</p>
              </div>
              <time dateTime={entry.createdAt}>
                <CalendarDays size={14} aria-hidden="true" />
                {profileDate(entry.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      ) : (
        <p className="profile-empty-copy">
          {profile.activities === null
            ? 'Activity details are currently unavailable.'
            : 'No ' + title.toLowerCase() + ' to show yet.'}
        </p>
      )}
    </section>
  )
}
