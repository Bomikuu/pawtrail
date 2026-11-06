import { AnimatedNumber } from '@/components/shared/animated-number'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Camera,
  Heart,
  MapPin,
  Mars,
  PawPrint,
  Ruler,
  Sparkles,
  HandHeart,
  Grid2X2,
  Info,
  Images,
} from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { StatusBadge } from '@/components/shared/status-badge'
import { ButtonLink } from '@/components/ui/button-link'
import { ProfileBanner } from '@/features/users/profile-banner'
import { profileDate } from './activity-timeline'
import type { AnimalProfile } from './types'
import type { AnimalActivityPage } from './activity-schemas'
export type AnimalProfileTab = 'activity' | 'about' | 'photos' | 'location'
export function AnimalSocialHeader({
  animal,
  activity,
  actions,
  tab,
}: {
  animal: AnimalProfile
  activity: AnimalActivityPage | null
  actions: ReactNode
  tab: AnimalProfileTab
}) {
  const path = '/pets/' + encodeURIComponent(animal.slug)
  const summary = activity?.summary
  const tabs = [
    { id: 'activity', label: 'Activity', icon: Grid2X2 },
    { id: 'about', label: 'About', icon: Info },
    { id: 'photos', label: 'Photos', icon: Images },
    { id: 'location', label: 'Location', icon: MapPin },
  ] as const
  return (
    <header className="pet-social-header">
      <div className="pet-cover">
        <ProfileBanner id={animal.bannerId} />
        {animal.viewerCanManage && (
          <ButtonLink
            className="pet-cover-edit"
            href={
              '/dashboard/animals/' +
              encodeURIComponent(animal.slug) +
              '/edit#profile-banner-picker'
            }
            variant="outline"
          >
            <Camera size={17} aria-hidden="true" />
            Edit cover
          </ButtonLink>
        )}
      </div>
      <div className="pet-social-identity">
        <div className="pet-portrait">
          <AnimalImage
            image={animal.photo}
            className="pet-profile-photo"
            compact
          />
          {animal.viewerCanManage && (
            <ButtonLink
              className="pet-photo-edit"
              href={
                '/dashboard/animals/' +
                encodeURIComponent(animal.slug) +
                '/edit'
              }
              variant="outline"
              aria-label={'Edit ' + animal.name + '’s photo'}
            >
              <Camera size={18} aria-hidden="true" />
            </ButtonLink>
          )}
        </div>
        <div className="pet-identity-main">
          <div className="pet-name-line">
            <h1>{animal.name}</h1>
            <PawPrint size={25} aria-hidden="true" />
            <StatusBadge>
              {animal.status[0].toUpperCase() + animal.status.slice(1)}
            </StatusBadge>
          </div>
          <p className="pet-identity-facts">
            {animal.species === 'dog'
              ? 'Dog'
              : animal.species === 'cat'
                ? 'Cat'
                : 'Animal'}
            <span aria-hidden="true"> · </span>
            {animal.gender === 'unknown'
              ? 'Gender not recorded'
              : animal.gender[0].toUpperCase() + animal.gender.slice(1)}
            <span aria-hidden="true"> · </span>
            {animal.ageMonths} months
          </p>
          <p className="pet-neighborhood">
            <MapPin size={17} aria-hidden="true" />
            {animal.location.neighborhood}
            <span>Approximate area</span>
          </p>
          <p className="pet-provenance">{animal.provenance.label}</p>
        </div>
        <div className="pet-social-actions">{actions}</div>
      </div>
      <dl
        className="pet-social-stats"
        aria-label="Public community activity about this pet"
      >
        {[
          ['taggedPosts', 'Tagged stories'],
          ['sightings', 'Sightings'],
          ['helpers', 'Public helpers'],
          ['followers', 'Public followers'],
        ].map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd>
              {summary ? (
                <AnimatedNumber
                  value={
                    summary[
                      key as
                        'taggedPosts' | 'sightings' | 'helpers' | 'followers'
                    ]
                  }
                />
              ) : (
                <span aria-label="Unavailable">—</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <nav className="pet-profile-tabs" aria-label="Pet profile sections">
        {tabs.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            href={`${path}?tab=${id}#pet-activity`}
            aria-current={tab === id ? 'page' : undefined}
          >
            <Icon size={20} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
export function AnimalAbout({
  animal,
  extended = false,
}: {
  animal: AnimalProfile
  extended?: boolean
}) {
  const facts = [
    { label: 'Age', value: animal.ageMonths + ' months', icon: CalendarDays },
    {
      label: 'Gender',
      value: animal.gender === 'unknown' ? 'Not recorded' : animal.gender,
      icon: Mars,
    },
    { label: 'Size', value: animal.size, icon: Ruler },
    {
      label: 'Personality',
      value: animal.personality.join(', ') || 'Not recorded',
      icon: Heart,
    },
    {
      label: 'Behavior',
      value: animal.behavior.join(', ') || 'Not recorded',
      icon: Sparkles,
    },
  ]
  return (
    <section
      className="pet-sidebar-panel pet-about"
      aria-labelledby={extended ? 'pet-about-full' : 'pet-about-heading'}
    >
      <h2 id={extended ? 'pet-about-full' : 'pet-about-heading'}>
        <PawPrint size={23} aria-hidden="true" />
        About {animal.name}
      </h2>
      <p>{animal.description}</p>
      <dl>
        {facts.map(({ label, value, icon: Icon }) => (
          <div key={label}>
            <dt>
              <Icon size={17} aria-hidden="true" />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="pet-verification">
        <StatusBadge
          tone={
            animal.verification.status === 'verified' ? 'success' : 'neutral'
          }
        >
          {animal.verification.label}
        </StatusBadge>
      </p>
      {animal.badges.length > 0 && (
        <div className="pet-record-labels">
          {animal.badges.map((badge) => (
            <StatusBadge key={badge}>{badge}</StatusBadge>
          ))}
        </div>
      )}
    </section>
  )
}
export function AnimalCareMilestones({
  animal,
  activity,
}: {
  animal: AnimalProfile
  activity: AnimalActivityPage | null
}) {
  if (!activity) return null
  const s = activity.summary
  const milestones = [
    ...(s.sightings
      ? [{ id: 'first-sighting', label: 'Sightings recorded' }]
      : []),
    ...(s.helpers ? [{ id: 'first-help', label: 'Helping hands' }] : []),
    ...(s.activeFundraisers
      ? [{ id: 'fundraiser-supporter', label: 'Community support' }]
      : []),
    ...(animal.adoptable
      ? [{ id: 'adoption-supporter', label: 'Adoption listing' }]
      : []),
  ]
  return (
    <section className="pet-sidebar-panel pet-care-milestones">
      <h2>
        <HandHeart size={23} aria-hidden="true" />
        Community care
      </h2>
      {milestones.length ? (
        <ul>
          {milestones.map((m) => (
            <li key={m.id}>
              <img
                src={'/images/badges/' + m.id + '.webp'}
                width={192}
                height={192}
                alt=""
                loading="lazy"
              />
              <span>{m.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p>Care milestones appear as sightings and support are recorded.</p>
      )}
      <p className="pet-care-note">
        These markers describe {animal.name}’s public care records. People earn
        achievement badges and Kibble for their contributions.
      </p>
    </section>
  )
}
export function AnimalRecentSighting({
  animal,
  activity,
}: {
  animal: AnimalProfile
  activity: AnimalActivityPage | null
}) {
  const latest = activity?.latestSighting
  return (
    <section className="pet-sidebar-panel pet-recent-sighting">
      <div className="pet-panel-heading">
        <h2>
          <MapPin size={23} aria-hidden="true" />
          Recent sightings
        </h2>
        <Link
          href={
            '/pets/' +
            encodeURIComponent(animal.slug) +
            '?tab=location#sightings'
          }
        >
          See history
        </Link>
      </div>
      {latest ? (
        <div className="pet-last-seen">
          <img
            src="/images/badges/explorer.webp"
            width={192}
            height={192}
            alt=""
            loading="lazy"
          />
          <div>
            <strong>{latest.location.neighborhood}</strong>
            <span>Last observed</span>
            <time dateTime={latest.observedAt}>
              {profileDate(latest.observedAt)}
            </time>
            <small>Approximate area; illustration is not a live map.</small>
          </div>
        </div>
      ) : (
        <p>
          {activity
            ? 'No public sightings recorded yet.'
            : 'Sighting details are unavailable.'}
        </p>
      )}
    </section>
  )
}
export function AnimalPhotoCollection({ page }: { page: AnimalActivityPage }) {
  return (
    <section
      className="pet-photo-collection"
      aria-labelledby="pet-photos-heading"
    >
      <h2 id="pet-photos-heading">Community photographs</h2>
      <p>
        Public photos from this profile, published sightings and people’s tagged
        stories.
      </p>
      {page.photos.length ? (
        <ul>
          {page.photos.map((photo) => (
            <li key={photo.image.id}>
              <figure>
                <AnimalImage image={photo.image} />
                <figcaption>
                  <Link href={photo.href}>{photo.credit}</Link>
                  <small>{photo.image.provenance.label}</small>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      ) : (
        <p>No public photographs yet.</p>
      )}
    </section>
  )
}
