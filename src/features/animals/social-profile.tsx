import { AnimatedNumber } from '@/components/shared/animated-number'
import { Suspense, type ReactNode } from 'react'
import { PetProfileTabs } from './profile-navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { DataState } from '@/components/shared/data-state'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
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
}: {
  animal: AnimalProfile
  activity: AnimalActivityPage | null
  actions: ReactNode
}) {
  const path = '/pets/' + encodeURIComponent(animal.slug)
  const summary = activity?.summary
  return (
    <header className="pet-social-header">
      <div
        className={
          'pet-cover w-full min-w-0 h-auto [aspect-ratio:3.7_/_1] min-h-30 max-h-54 relative overflow-hidden rounded-[1rem_1rem_0.625rem_0.625rem] bg-[#dcecc8] max-[48rem]:h-auto'
        }
      >
        <ProfileBanner id={animal.bannerId} />
        {animal.viewerCanManage && (
          <ButtonLink
            className={
              'pet-cover-edit absolute top-4 right-4 bg-card text-[0.8125rem] max-[48rem]:top-2.5 max-[48rem]:right-2.5 max-[48rem]:text-[0.6875rem] max-[48rem]:p-2'
            }
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
      <div
        className={
          'pet-social-identity grid grid-cols-[8rem_minmax(0,_1fr)_auto] items-start gap-5 [padding:0_1.5rem] max-[65rem]:grid-cols-[8rem_minmax(0,_1fr)] max-[65rem]:gap-4 max-[48rem]:px-4 max-[48rem]:grid-cols-[6rem_minmax(0,_1fr)] max-[48rem]:gap-3'
        }
      >
        <div
          className={
            'pet-portrait [.dark_&]:border-[#151515] w-32 h-32 mt-[-3.25rem] [border:6px_solid_#fffcf8] rounded-full relative bg-[#f0e6d6] max-[65rem]:w-32 max-[65rem]:h-32 max-[65rem]:mt-[-3.5rem] max-[48rem]:w-24 max-[48rem]:h-24 max-[48rem]:mt-[-2.5rem] max-[48rem]:[border-width:4px]'
          }
        >
          <AnimalImage
            image={animal.photo}
            className={
              'pet-profile-photo w-full h-full object-cover rounded-full'
            }
            compact
          />
          {animal.viewerCanManage && (
            <ButtonLink
              className={
                'pet-photo-edit absolute right-0 bottom-1 min-w-11 p-2.5 rounded-full bg-card max-[48rem]:p-2 max-[48rem]:bottom-[-0.25rem] max-[48rem]:right-[-0.25rem]'
              }
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
        <div className={'pet-identity-main pt-3 min-w-0 max-[48rem]:pt-2.5'}>
          <div
            className={
              'pet-name-line flex flex-wrap items-center [gap:0.5rem_0.75rem] [.app-content_&_h1]:[font:900_clamp(1.875rem,_2.5vw,_2.5rem)/1.15_var(--font-heading)] [.app-content_&_h1]:m-0 [.app-content_&_h1]:[overflow-wrap:anywhere] [&_>_svg]:text-[#b95308] [&_>_svg]:shrink-0 max-[48rem]:[.app-content_&_h1]:text-[1.75rem] max-[48rem]:gap-1.5 max-[48rem]:[&_>_svg]:w-5 max-[48rem]:[&_>_svg]:h-5'
            }
          >
            <h1>{animal.name}</h1>
            <PawPrint size={25} aria-hidden="true" />
            <StatusBadge>
              {animal.status[0].toUpperCase() + animal.status.slice(1)}
            </StatusBadge>
          </div>
          <p
            className={
              'pet-identity-facts text-[0.8125rem] [margin:0.5rem_0_0.375rem] capitalize max-[48rem]:text-xs'
            }
          >
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
          <p
            className={
              'pet-neighborhood [.dark_&_>_span]:text-muted-foreground flex flex-wrap items-center gap-1.5 m-0 text-[0.8125rem] [&_>_span]:text-muted-foreground [&_>_span]:text-[0.6875rem] max-[48rem]:text-xs'
            }
          >
            <MapPin size={17} aria-hidden="true" />
            {animal.location.neighborhood}
            <span>Approximate area</span>
          </p>
          <p
            className={
              'pet-provenance [.dark_&]:text-muted-foreground [margin:0.5rem_0_0] text-muted-foreground text-[0.6875rem] max-w-[60ch] max-[48rem]:text-[0.625rem]'
            }
          >
            {animal.provenance.label}
          </p>
        </div>
        <div
          className={
            'pet-social-actions pt-5 max-w-80 [&_[data-slot=button]]:text-[0.8125rem] [&_[data-slot=button]]:min-w-11 max-[65rem]:[grid-column:2] max-[65rem]:pt-0 max-[65rem]:max-w-none max-[48rem]:[grid-column:1_/_-1] max-[48rem]:pt-1'
          }
        >
          {actions}
        </div>
      </div>
      <dl
        className={
          'pet-social-stats flex flex-wrap [gap:0.5rem_1.25rem] [margin:1rem_1.5rem] [&_>_div]:flex [&_>_div]:flex-row-reverse [&_>_div]:items-baseline [&_>_div]:gap-[0.3rem] [&_dt]:text-[0.8125rem] [&_dt]:text-muted-foreground [&_dd]:font-[700] [&_dd]:text-sm [&_dd]:leading-[1.4] [&_dd]:font-sans [&_dd]:m-0 [&_dd]:tabular-nums max-[65rem]:ml-6 max-[48rem]:[margin:0.875rem_1rem] max-[48rem]:[gap:0.375rem_1rem] max-[48rem]:[&_>_div]:px-1.5 max-[48rem]:[&_>_div]:p-0 max-[48rem]:[&_dt]:text-xs max-[48rem]:[&_dd]:text-[0.8125rem]'
        }
        aria-label="Public community activity about this pet"
      >
        {[
          ['taggedPosts', 'Tagged stories'],
          ['sightings', 'Sightings'],
          ['helpers', 'Helpers'],
          ['followers', 'Followers'],
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
      <Suspense
        fallback={
          <Skeleton
            className={'pet-tabs-skeleton h-12 [margin:1rem_1.5rem_0]'}
          />
        }
      >
        <PetProfileTabs path={path} />
      </Suspense>
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
      className={
        'pet-sidebar-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.dark_&_small]:text-muted-foreground [border:1px_solid_#e8ddcf] rounded-2xl p-4.5 bg-card min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:shrink-0 max-[48rem]:p-4 pet-about [.dark_&_dl_>_div]:border-[#333333] [&_>_p]:text-[0.8125rem] [&_>_p]:[line-height:1.55] [&_>_p]:[margin:0_0_0.75rem] [&_>_p]:[overflow-wrap:anywhere] [&_>_p]:max-w-[70ch] [&_dl]:m-0 [&_dl_>_div]:grid [&_dl_>_div]:grid-cols-[minmax(6rem,_0.85fr)_minmax(0,_1fr)] [&_dl_>_div]:gap-3 [&_dl_>_div]:[padding:0.625rem_0] [&_dl_>_div]:[border-top:1px_solid_#eee5d8] [&_dl_>_div]:text-xs [&_dt]:flex [&_dt]:items-center [&_dt]:gap-2 [&_dt]:[font-weight:650] [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere] [&_dd]:capitalize [&_dt_>_svg]:shrink-0 max-[65rem]:[grid-column:1_/_-1] [.pet-details-column_>_&]:[grid-column:auto]'
      }
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
      <p className={'pet-verification [.pet-about_&]:[margin:0.75rem_0_0]'}>
        <StatusBadge
          tone={
            animal.verification.status === 'verified' ? 'success' : 'neutral'
          }
        >
          {animal.verification.label}
        </StatusBadge>
      </p>
      {animal.badges.length > 0 && (
        <div className={'pet-record-labels flex flex-wrap gap-1.5 mt-2.5'}>
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
    <section
      className={
        'pet-sidebar-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.dark_&_small]:text-muted-foreground [border:1px_solid_#e8ddcf] rounded-2xl p-4.5 bg-card min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:shrink-0 max-[48rem]:p-4 pet-care-milestones [&_ul]:grid [&_ul]:grid-cols-4 [&_ul]:gap-2 [&_ul]:list-none [&_ul]:m-0 [&_ul]:p-0 [&_li]:text-center [&_li_>_img]:block [&_li_>_img]:w-full [&_li_>_img]:max-w-18 [&_li_>_img]:h-auto [&_li_>_img]:[aspect-ratio:1] [&_li_>_img]:[margin:0_auto_0.25rem] [&_li_>_span]:block [&_li_>_span]:font-[750] [&_li_>_span]:text-[0.625rem] [&_li_>_span]:leading-[1.35] [&_li_>_span]:font-heading'
      }
    >
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
      <p
        className={
          'pet-care-note [.pet-care-milestones_&]:[margin:1rem_0_0] [.pet-care-milestones_&]:text-muted-foreground [.pet-care-milestones_&]:text-[0.6875rem]'
        }
      >
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
    <section
      className={
        'pet-sidebar-panel [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.dark_&_small]:text-muted-foreground [border:1px_solid_#e8ddcf] rounded-2xl p-4.5 bg-card min-w-0 [&_h2]:flex [&_h2]:flex-wrap [&_h2]:items-center [&_h2]:gap-1.5 [&_h2]:font-[850] [&_h2]:text-lg [&_h2]:leading-[1.35] [&_h2]:font-heading [&_h2]:[margin:0_0_0.875rem] [&_h2_>_svg]:text-[#b95308] [&_h2_>_svg]:shrink-0 max-[48rem]:p-4 pet-recent-sighting'
      }
    >
      <div
        className={
          'pet-panel-heading flex justify-between gap-2 items-start flex-wrap [&_a]:text-[color:var(--teal)] [&_a]:no-underline [&_a]:min-h-11 [&_a]:inline-flex [&_a]:items-center [&_a]:text-[0.6875rem] [&_a]:[font-weight:650]'
        }
      >
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
        <div
          className={
            'pet-last-seen flex items-center gap-3.5 [&_>_img]:w-21 [&_>_img]:h-21 [&_>_img]:shrink-0 [&_>_img]:object-contain [&_strong]:block [&_strong]:text-[0.8125rem] [&_span]:block [&_span]:text-[0.625rem] [&_span]:text-muted-foreground [&_span]:mt-1.5 [&_time]:block [&_time]:text-xs [&_time]:mt-0.5 [&_small]:block [&_small]:text-[0.625rem] [&_small]:text-muted-foreground [&_small]:mt-1.5'
          }
        >
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
      className={
        'pet-photo-collection [&_>_h2]:font-[850] [&_>_h2]:text-xl [&_>_h2]:leading-[1.3] [&_>_h2]:font-heading [&_>_h2]:[margin:0_0_0.5rem] [&_>_p]:text-[0.8125rem] [&_>_p]:text-muted-foreground [&_>_ul]:list-none [&_>_ul]:[margin:1rem_0_0] [&_>_ul]:p-0 [&_>_ul]:grid [&_>_ul]:grid-cols-2 [&_>_ul]:gap-4 [&_figure]:m-0 [&_figure_>_img]:block [&_figure_>_img]:w-full [&_figure_>_img]:h-auto [&_figure_>_img]:[aspect-ratio:4_/_3] [&_figure_>_img]:object-cover [&_figure_>_img]:rounded-xl [&_figcaption]:text-xs [&_figcaption]:[padding:0.5rem_0.125rem] [&_figcaption_a]:text-[color:var(--teal)] [&_figcaption_a]:no-underline [&_figcaption_small]:block [&_figcaption_small]:text-muted-foreground [&_figcaption_small]:text-[0.625rem] [&_figcaption_small]:mt-1 max-[48rem]:[&_>_ul]:grid-cols-1'
      }
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
        <DataState
          state="empty"
          emptyTitle="No public photographs yet"
          emptyDescription="Photos from approved sightings and tagged stories will appear here. Share an update from Activity to add to this pet’s story."
          emptyAction={
            <ButtonLink href="?tab=activity#pet-activity" variant="outline">
              Back to activity
            </ButtonLink>
          }
        />
      )}
    </section>
  )
}
