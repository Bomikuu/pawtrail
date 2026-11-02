import '@/features/animals/pet-profile.css'
import { Discussion } from '@/features/community/discussion'
import { BehaviorMap } from '@/features/sightings/behavior-map'
import { ReportDialog } from '@/features/community/report-dialog'
import { getPublicAnimal } from '@/features/animals/server'
import { HelpPanel } from '@/features/animals/help-panel'
import { HelperWall } from '@/features/animals/helper-wall'
import { SightingHistory } from '@/features/animals/activity-timeline'
import { ProfileActions } from '@/features/animals/profile-actions'
import { AchievementActivity } from '@/features/achievements/activity'
import {
  AnimalSocialHeader,
  AnimalAbout,
  AnimalCareMilestones,
  AnimalRecentSighting,
  AnimalPhotoCollection,
  type AnimalProfileTab,
} from '@/features/animals/social-profile'
import { AnimalActivityFeed } from '@/features/animals/activity-feed'
import { AnimalPostComposer } from '@/features/animals/post-composer'
import { Gallery } from '@/features/animals/gallery'
import { Traits } from '@/features/animals/traits'
import { animalMetadata } from '@/lib/seo/metadata'
import { animalJsonLd, safeJsonLd } from '@/lib/seo/json-ld'
import { animalUrl } from '@/lib/seo/origin'
import { getServerApi } from '@/lib/api/server'
import { demoClock, systemClock } from '@/lib/api/clock'
import { getApiConfig } from '@/lib/api/config'
import { DataState } from '@/components/shared/data-state'
import { ButtonLink } from '@/components/ui/button-link'
import { SightingRetry } from '@/features/animals/sighting-retry'
import { queryValue, type SearchParams } from '@/features/workflows/server'
type Props = { params: Promise<{ slug: string }>; searchParams: SearchParams }
export async function generateMetadata({ params }: Props) {
  return animalMetadata(await getPublicAnimal((await params).slug))
}
export default async function AnimalPage({ params, searchParams }: Props) {
  const animal = await getPublicAnimal((await params).slug)
  const search = await searchParams
  const tab: AnimalProfileTab =
    search.tab === 'about' ||
    search.tab === 'photos' ||
    search.tab === 'location'
      ? search.tab
      : search.period || search.sightingCursor
        ? 'location'
        : 'activity'
  const kind =
    search.kind === 'sightings' ||
    search.kind === 'help' ||
    search.kind === 'tagged'
      ? search.kind
      : 'all'
  const sort = search.sort === 'newest' ? 'newest' : 'priority'
  const period =
    search.period === 'week' || search.period === 'month'
      ? search.period
      : 'all'
  const since =
    period === 'all'
      ? undefined
      : new Date(
          (getApiConfig().mode === 'mock' ? demoClock : systemClock)
            .now()
            .getTime() -
            (period === 'week' ? 7 : 30) * 86400000,
        ).toISOString()
  const api = await getServerApi(),
    session = await api.auth.session()
  const filters = {
    kind,
    sort,
    cursor: tab === 'activity' ? queryValue(search.cursor) : undefined,
    limit: 12,
  } as const
  const [activity, history] = await Promise.allSettled([
    api.animals.activity(animal.slug, filters),
    tab === 'location'
      ? api.sightings.list({
          animalId: animal.id,
          since,
          cursor:
            queryValue(search.sightingCursor) ?? queryValue(search.cursor),
          limit: 20,
        })
      : Promise.resolve(null),
  ])
  const page = activity.status === 'fulfilled' ? activity.value : null
  const path = '/pets/' + encodeURIComponent(animal.slug)
  return (
    <article className="animal-profile pet-social-profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(animalJsonLd(animal)) }}
      />
      <AnimalSocialHeader
        animal={animal}
        activity={page}
        tab={tab}
        actions={
          <ProfileActions
            key={`${animal.id}:${animal.viewerSaved}`}
            id={animal.id}
            slug={animal.slug}
            name={animal.name}
            initialSaved={animal.viewerSaved}
            viewerScope={session.cacheScope}
            url={animalUrl(animal.slug)}
            adoptable={animal.adoptable}
          />
        }
      />
      <div className="pet-social-columns">
        <div className="pet-main-column" id="pet-activity">
          {tab === 'activity' ? (
            <>
              <AnimalPostComposer
                key={animal.id}
                id={animal.id}
                name={animal.name}
                slug={animal.slug}
              />
              {page ? (
                <AnimalActivityFeed
                  animal={animal}
                  page={page}
                  filters={filters}
                  scope={session.cacheScope}
                />
              ) : (
                <DataState
                  state="error"
                  errorMessage="Community activity couldn’t load. The pet profile is still available."
                />
              )}
              {!page && (
                <ButtonLink href={path + '?tab=activity'} variant="outline">
                  Reload activity
                </ButtonLink>
              )}
            </>
          ) : tab === 'about' ? (
            <>
              <AnimalAbout animal={animal} extended />
              <Traits animal={animal} />
              <HelperWall animal={animal} />
            </>
          ) : tab === 'photos' ? (
            page ? (
              <AnimalPhotoCollection page={page} />
            ) : (
              <>
                <Gallery animal={animal} />
                <DataState
                  state="error"
                  errorMessage="Community photographs couldn’t load. Profile photographs remain available."
                />
                <ButtonLink href={path + '?tab=photos'} variant="outline">
                  Reload photographs
                </ButtonLink>
              </>
            )
          ) : history.status === 'fulfilled' && history.value ? (
            <>
              <SightingHistory
                sightings={history.value.items}
                slug={animal.slug}
                period={period}
                nextCursor={history.value.nextCursor}
              />
              <BehaviorMap
                sightings={history.value.items}
                animalSlug={animal.slug}
              />
            </>
          ) : (
            <section id="sightings">
              <DataState
                state="error"
                errorMessage="Sightings couldn’t load. This pet’s story is still available."
              />
              <SightingRetry />
              <ButtonLink href={path + '?tab=location'} variant="outline">
                Return to the latest sightings
              </ButtonLink>
            </section>
          )}
          <section
            id="discussion"
            className="profile-section pet-discussion"
            aria-labelledby="discussion-heading"
          >
            <h2 id="discussion-heading">Talk about {animal.name}</h2>
            <ReportDialog
              target={{ kind: 'animal', id: animal.id }}
              returnTo={path}
            />
            <Discussion
              target={{ kind: 'animal', id: animal.id }}
              returnTo={path}
              photoContext={[
                {
                  ref: { kind: 'animal', id: animal.id },
                  title: animal.name,
                  href: path,
                },
              ]}
            />
          </section>
        </div>
        <aside
          className="pet-details-column"
          aria-label={'About and care for ' + animal.name}
        >
          {tab !== 'about' && <AnimalAbout animal={animal} />}
          <AnimalCareMilestones animal={animal} activity={page} />
          <AnimalRecentSighting animal={animal} activity={page} />
          <HelpPanel animal={animal} />
          <AchievementActivity
            target={{ kind: 'animal', id: animal.id }}
            href={path}
            showShare={false}
          />
        </aside>
      </div>
    </article>
  )
}
