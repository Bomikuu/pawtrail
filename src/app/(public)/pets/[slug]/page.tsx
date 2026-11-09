import { PublicMedicalRecords } from '@/features/medical/public-records'
import { getPublicAnimal, getPetActivity } from '@/features/animals/server'
import { getServerApi } from '@/lib/api/server'
import { animalMetadata } from '@/lib/seo/metadata'
import { demoClock, systemClock } from '@/lib/api/clock'
import { getApiConfig } from '@/lib/api/config'
import { queryValue, type SearchParams } from '@/features/workflows/server'
import {
  AnimalAbout,
  AnimalPhotoCollection,
  type AnimalProfileTab,
} from '@/features/animals/social-profile'
import { AnimalActivityFeed } from '@/features/animals/activity-feed'
import { AnimalPostComposer } from '@/features/animals/post-composer'
import { HelperWall } from '@/features/animals/helper-wall'
import { Traits } from '@/features/animals/traits'
import { Gallery } from '@/features/animals/gallery'
import { SightingHistory } from '@/features/animals/activity-timeline'
import { BehaviorMap } from '@/features/sightings/behavior-map'
import { SightingRetry } from '@/features/animals/sighting-retry'
import { DataState } from '@/components/shared/data-state'
import { ButtonLink } from '@/components/ui/button-link'
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
    search.tab === 'location' ||
    search.tab === 'medical'
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
  const api =
    tab === 'activity' || tab === 'location' || tab === 'medical' ? await getServerApi() : null
  const session = tab === 'activity' ? await api!.auth.session() : null
  const filters = {
    kind,
    sort,
    cursor: tab === 'activity' ? queryValue(search.cursor) : undefined,
    limit: 12,
  } as const
  const [activity, history, medical] = await Promise.allSettled([
    tab === 'activity' || tab === 'photos'
      ? getPetActivity(
          animal.slug,
          tab === 'photos' ? 'all' : kind,
          tab === 'photos' ? 'priority' : sort,
          filters.cursor,
        )
      : Promise.resolve(null),
    tab === 'location'
      ? api!.sightings.list({
          animalId: animal.id,
          since,
          cursor:
            queryValue(search.sightingCursor) ?? queryValue(search.cursor),
          limit: 20,
        })
      : Promise.resolve(null),
    tab === 'medical'
      ? api!.medical.list(animal.slug, { scope: 'public', cursor: queryValue(search.medicalCursor), limit: 12 })
      : Promise.resolve(null),
  ])
  const page = activity.status === 'fulfilled' ? activity.value : null
  const path = '/pets/' + encodeURIComponent(animal.slug)
  return (
    <>
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
              scope={session!.cacheScope}
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
      ) : tab === 'medical' ? (
        medical.status === 'fulfilled' && medical.value ? (
          <PublicMedicalRecords animal={animal} page={medical.value} nextHref={medical.value.nextCursor ? `${path}?tab=medical&medicalCursor=${encodeURIComponent(medical.value.nextCursor)}#pet-activity` : null} />
        ) : (
          <><DataState state="error" errorMessage="Medical records couldn’t load. Please try again." /><ButtonLink href={path + '?tab=medical'} variant="outline">Reload medical records</ButtonLink></>
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
    </>
  )
}
