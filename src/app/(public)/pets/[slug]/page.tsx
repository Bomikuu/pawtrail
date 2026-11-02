import { Discussion } from '@/features/community/discussion'
import { ReportDialog } from '@/features/community/report-dialog'
import { getPublicAnimal } from '@/features/animals/server'
import { PublicAnimalStory } from '@/features/animals/profile-header'
import { HelpPanel } from '@/features/animals/help-panel'
import { HelperWall } from '@/features/animals/helper-wall'
import {
  ActivityTimeline,
  SightingHistory,
} from '@/features/animals/activity-timeline'
import { ProfileActions } from '@/features/animals/profile-actions'
import { animalMetadata } from '@/lib/seo/metadata'
import { animalJsonLd, safeJsonLd } from '@/lib/seo/json-ld'
import { animalUrl } from '@/lib/seo/origin'
import { getServerApi } from '@/lib/api/server'
import { demoClock, systemClock } from '@/lib/api/clock'
import { getApiConfig } from '@/lib/api/config'
import { DataState } from '@/components/shared/data-state'
import { SightingRetry } from '@/features/animals/sighting-retry'
type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ period?: string; cursor?: string }>
}
export async function generateMetadata({ params }: Props) {
  return animalMetadata(await getPublicAnimal((await params).slug))
}
export default async function AnimalPage({ params, searchParams }: Props) {
  const animal = await getPublicAnimal((await params).slug)
  const search = await searchParams
  const period = ['week', 'month'].includes(search.period ?? '')
    ? search.period!
    : 'all'
  const days = period === 'week' ? 7 : 30
  const since =
    period === 'all'
      ? undefined
      : new Date(
          (getApiConfig().mode === 'mock' ? demoClock : systemClock)
            .now()
            .getTime() -
            days * 86400000,
        ).toISOString()
  const api = await getServerApi()
  const session = await api.auth.session()
  const [sightings, posts] = await Promise.allSettled([
    api.sightings.list({
      animalId: animal.id,
      since,
      cursor: search.cursor,
      limit: 20,
    }),
    api.community.list({ animalId: animal.id, limit: 12 }),
  ])
  return (
    <article className="animal-profile">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(animalJsonLd(animal)) }}
      />
      <PublicAnimalStory
        animal={animal}
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
      <HelpPanel animal={animal} />
      <HelperWall animal={animal} />
      {posts.status === 'fulfilled' ? (
        <ActivityTimeline posts={posts.value.items} />
      ) : (
        <DataState
          state="error"
          errorMessage="Community stories couldn’t load. Reload this profile to try again."
        />
      )}
      {sightings.status === 'fulfilled' ? (
        <SightingHistory
          sightings={sightings.value.items}
          slug={animal.slug}
          period={period}
          nextCursor={sightings.value.nextCursor}
        />
      ) : (
        <section id="sightings">
          <DataState
            state="error"
            errorMessage="Sightings couldn’t load. Your animal’s story is still available."
          />
          <SightingRetry />
        </section>
      )}
      <section
        id="discussion"
        className="profile-section"
        aria-labelledby="discussion-heading"
      >
        <h2 id="discussion-heading">Talk about {animal.name}</h2>
        <ReportDialog
          target={{ kind: 'animal', id: animal.id }}
          returnTo={`/pets/${animal.slug}`}
        />
        <Discussion
          target={{ kind: 'animal', id: animal.id }}
          returnTo={`/pets/${animal.slug}`}
          photoContext={[
            {
              ref: { kind: 'animal', id: animal.id },
              title: animal.name,
              href: `/pets/${animal.slug}`,
            },
          ]}
        />
      </section>
    </article>
  )
}
