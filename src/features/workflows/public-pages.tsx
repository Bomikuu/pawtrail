import { demoClock, systemClock } from '@/lib/api/clock'
import { AchievementActivity } from '@/features/achievements/activity'
import { ChartPanel } from './chart-panel'
import { ResourceDiscussion } from './discussion'
import { PublicJsonLd } from '@/lib/seo/public-json-ld'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { getServerApi } from '@/lib/api/server'
import { ButtonLink } from '@/components/ui/button-link'
import { AnimalImage } from '@/components/shared/animal-image'
import {
  PageHeading,
  ResourceHero,
  CatalogCard,
  Empty,
  FilterForm,
  NextPage,
  DetailBody,
  php,
  date,
  options,
} from './catalog'
import { WorkflowForm, type Field } from './form'
import { ActionButton } from './action-button'
import {
  privateApi,
  publicRecord,
  publicArea,
  queryValue,
  type SearchParams,
} from './server'
import {
  animalFields,
  preferenceFields,
  applicationFields,
  campaignFields,
  missionFields,
  eventFields,
} from './fields'
import { DiscoveryMap } from '@/features/discovery/map-island'
import { ActivityCard } from '@/components/shared/social-card'
import { ContributorLine, ContributorFaces } from './contributors'
import { PostDetail } from '@/features/community/post-card'
import { AdoptionDeck } from '@/features/adoption/deck'
import { StatusBadge } from '@/components/shared/status-badge'
import { Progress } from '@/components/ui/progress'
import { missionStatus } from '@/features/missions/presentation'

export async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    api = await getServerApi(),
    area = await publicArea()
  const species = queryValue(p.species) as 'cat' | 'dog' | 'other' | undefined
  const q = queryValue(p.q),
    cursor = queryValue(p.cursor)
  const filters = {
    q,
    species: species || undefined,
    adoptable: p.adoptable === 'true' ? true : undefined,
  }
  const latitude = p.latitude ? Number(queryValue(p.latitude)) : area.latitude,
    longitude = p.longitude ? Number(queryValue(p.longitude)) : area.longitude
  let bounds:
    { north: number; south: number; east: number; west: number } | undefined
  if (typeof p.bounds === 'string') {
    try {
      bounds = JSON.parse(p.bounds)
    } catch {
      bounds = undefined
    }
  }
  const map = await api.discovery.nearby({
    latitude,
    longitude,
    radiusMeters: Number(queryValue(p.radius) ?? 10000),
    bounds,
    filters,
  })
  const animals = await api.animals.list({
    ...filters,
    cursor,
    ids: map.features
      .filter((f) => f.ref.kind === 'animal')
      .map((f) => f.ref.id),
  })
  return (
    <>
      <PageHeading
        title="Find a familiar face nearby"
        description="Meet the animals and people who share your neighborhood. Public locations show general areas, never a sensitive exact position."
        action={
          <ButtonLink href="/animals/report">Report an animal</ButtonLink>
        }
      />
      <FilterForm
        q={q}
        fields={[
          {
            name: 'species',
            label: 'Species',
            type: 'select',
            options: options(['cat', 'dog', 'other']),
            value: species ?? '',
          },
          {
            name: 'adoptable',
            label: 'Availability',
            type: 'select',
            options: [
              { value: '', label: 'All animals' },
              { value: 'true', label: 'Available for adoption' },
            ],
            value: queryValue(p.adoptable) ?? '',
          },
        ]}
      />
      <DiscoveryMap features={map.features} center={{ latitude, longitude }} />
      <p>
        {animals.count} animals around {area.neighborhood} · approximate
        locations
      </p>
      <div
        className={
          'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
        }
      >
        {animals.items.map((a) => (
          <CatalogCard
            key={a.id}
            title={a.name}
            href={`/pets/${a.slug}`}
            image={a.photo}
            description={`${a.ageMonths} months · ${a.size} · ${a.gender}`}
            meta={`${a.species} · ${a.adoptable ? 'Looking for a home' : a.status}`}
          />
        ))}
      </div>
      {!animals.count && (
        <Empty href="/explore" label="Clear filters">
          No animals match these filters. Try a wider search.
        </Empty>
      )}
      <NextPage
        cursor={animals.nextCursor}
        params={{
          q,
          species,
          adoptable: queryValue(p.adoptable),
          latitude: queryValue(p.latitude),
          longitude: queryValue(p.longitude),
          bounds: queryValue(p.bounds),
          radius: queryValue(p.radius),
        }}
      />
    </>
  )
}
export async function HordesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    api = await getServerApi(),
    rows = await api.hordes.list({ q, cursor: queryValue(p.cursor) })
  return (
    <>
      <PageHeading
        title="Neighborhood Hordes"
        description="A shared place, a familiar group, and a community looking out for them."
      />
      <FilterForm q={q} />
      <div
        className={
          'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
        }
      >
        {rows.items.map((h) => (
          <CatalogCard
            key={h.id}
            title={h.name}
            href={`/hordes/${h.slug}`}
            description={h.description}
            people={
              <ContributorFaces
                api={api}
                ids={h.contributorIds}
                href={`/hordes/${h.slug}`}
              />
            }
            meta={`${h.animalIds.length} animals · ${h.location.neighborhood}`}
            image={h.photo}
          />
        ))}
      </div>
      {!rows.items.length && (
        <Empty href="/explore" label="Explore animals">
          No neighborhood Hordes match this search.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} params={{ q }} />
    </>
  )
}
export async function HordePage({
  slug,
  searchParams,
}: {
  slug: string
  searchParams?: SearchParams
}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await getServerApi(),
    h = await publicRecord(() => api.hordes.get(slug)),
    [animals, sightings, campaigns, missions, stories, session] =
      await Promise.all([
        api.animals.list({ hordeId: h.id, limit: 50 }),
        api.sightings.list({ hordeId: h.id, cursor: queryValue(p.sightings) }),
        api.fundraisers.list({ limit: 50 }),
        api.missions.list({ limit: 50 }),
        api.community.list({
          hordeId: h.id,
          limit: 12,
          cursor: queryValue(p.cursor),
        }),
        api.auth.session(),
      ])
  return (
    <>
      <PublicJsonLd
        name={h.name}
        description={h.description}
        path={`/hordes/${h.slug}`}
      />
      <ResourceHero
        image={h.photo}
        title={h.name}
        description={`${h.location.neighborhood} · approximate public area`}
      >
        <ContributorFaces
          api={api}
          ids={h.contributorIds}
          href={`/hordes/${h.slug}`}
        />
      </ResourceHero>
      <DetailBody>
        <p>{h.description}</p>
        <p>
          {animals.count} animal profiles in this group. A total population
          estimate has not been supplied.
        </p>
        <p>
          <ButtonLink
            href={`/fundraisers/create?hordeId=${h.id}`}
            variant="outline"
          >
            Start a fundraiser for this group
          </ButtonLink>
        </p>
        <h2>Animals in this group</h2>
        <div
          className={
            'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
          }
        >
          {animals.items.map((a) => (
            <CatalogCard
              key={a.id}
              href={`/pets/${a.slug}`}
              title={a.name}
              image={a.photo}
              meta={a.species}
            />
          ))}
        </div>
        <h2 id="group-sightings">Shared observations</h2>
        {sightings.items.length ? (
          sightings.items.map((s) => (
            <ActivityCard
              key={s.id}
              title="Neighborhood sighting"
              identity={
                <ContributorLine
                  api={api}
                  id={s.reporterId}
                  meta={date(s.observedAt)}
                  fallback="Community observer"
                />
              }
            >
              <p>{s.observation}</p>
              <small>{s.location.neighborhood}</small>
            </ActivityCard>
          ))
        ) : (
          <Empty>No published observations yet.</Empty>
        )}
        {!animals.items.length && (
          <Empty href="/explore" label="Explore nearby">
            No animal profiles are connected to this group yet.
          </Empty>
        )}
        <NextPage
          cursor={sightings.nextCursor}
          cursorKey="sightings"
          params={{ cursor: queryValue(p.cursor) }}
          anchor="group-sightings"
          label="More group sightings"
        />
        <h2>Ways to help</h2>
        {!campaigns.items.some((f) => h.fundraiserIds.includes(f.id)) &&
          !missions.items.some((m) => h.missionIds.includes(m.id)) && (
            <Empty href="/missions" label="Explore ways to help">
              No campaigns or missions are connected to this group yet.
            </Empty>
          )}
        {campaigns.items
          .filter((f) => h.fundraiserIds.includes(f.id))
          .map((f) => (
            <CatalogCard
              key={f.id}
              title={f.title}
              href={`/fundraisers/${f.slug}`}
              image={f.photo}
              meta={`${f.state} · ${php(f.raisedMinor)} raised`}
              people={
                <ContributorLine
                  api={api}
                  id={f.organizerId}
                  meta="Campaign organizer"
                />
              }
            />
          ))}
        {missions.items
          .filter((m) => h.missionIds.includes(m.id))
          .map((m) => (
            <CatalogCard
              key={m.id}
              title={m.title}
              href={`/missions/${m.slug}`}
              meta={`${m.state} · ${m.rewardKibble} Kibble after approval`}
              people={
                <ContributorLine
                  api={api}
                  id={m.organizerId}
                  meta="Mission organizer"
                />
              }
            />
          ))}
        <h2 id="group-stories">Community stories</h2>
        {stories.items.length ? (
          <div className={'resource-story-feed grid gap-5 min-w-0'}>
            {stories.items.map((post) => (
              <PostDetail
                key={post.id}
                initial={post}
                scope={session.cacheScope}
                options={post.linkedEntities}
                detail={false}
              />
            ))}
          </div>
        ) : (
          <Empty href="/community/create" label="Share a story">
            No published stories about this group yet.
          </Empty>
        )}
        <NextPage
          cursor={stories.nextCursor}
          params={{ sightings: queryValue(p.sightings) }}
          anchor="group-stories"
          label="More group stories"
        />
      </DetailBody>
      <ResourceDiscussion
        target={{ kind: 'horde', id: h.id }}
        title={h.name}
        path={`/hordes/${h.slug}`}
      />
    </>
  )
}
export async function SearchPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    kind = queryValue(p.kind),
    api = await getServerApi()
  const result = await api.search.query({
    q,
    cursor: queryValue(p.cursor),
    kinds: kind ? [kind as 'animal'] : undefined,
  })
  return (
    <>
      <PageHeading
        title="Search PawTrail"
        description="Find animals, stories, shelters, campaigns, missions and gatherings."
      />
      <FilterForm
        q={q}
        fields={[
          {
            name: 'kind',
            label: 'Look for',
            type: 'select',
            value: kind ?? '',
            options: options([
              'animal',
              'horde',
              'post',
              'user',
              'shelter',
              'fundraiser',
              'mission',
              'event',
            ]),
          },
        ]}
      />
      <p>{result.count} public results</p>
      {[
        'animal',
        'horde',
        'post',
        'user',
        'shelter',
        'fundraiser',
        'mission',
        'event',
      ].map((kind) => {
        const items = result.items.filter((r) => r.ref.kind === kind)
        return items.length ? (
          <section key={kind}>
            <h2>
              {kind === 'user'
                ? 'Community members'
                : `${kind.charAt(0).toUpperCase()}${kind.slice(1)} stories`}
            </h2>
            <div
              className={
                'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
              }
            >
              {items.map((r) => (
                <CatalogCard
                  key={`${r.ref.kind}:${r.ref.id}`}
                  href={r.path}
                  title={r.title}
                  description={r.excerpt}
                  meta={r.ref.kind === 'user' ? 'Community member' : r.ref.kind}
                  people={
                    r.ref.kind === 'user' ? (
                      <ContributorLine
                        api={api}
                        id={r.ref.id}
                        fallback="Public member profile"
                      />
                    ) : undefined
                  }
                />
              ))}
            </div>
          </section>
        ) : null
      })}
      {!result.count && <Empty>No public results match this search.</Empty>}
      <NextPage cursor={result.nextCursor} params={{ q, kind }} />
    </>
  )
}
export async function FundraisersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    category = queryValue(p.category),
    api = await getServerApi()
  const rows = await api.fundraisers.list({
    q,
    cursor: queryValue(p.cursor),
    category: category as 'medical' | undefined,
    sort: queryValue(p.sort) as 'recent' | 'urgent' | undefined,
  })
  return (
    <>
      <PageHeading
        title="Small acts, shared care"
        description="Explore animal welfare campaigns and see how support would be used. Every contribution here is a demonstration; no money changes hands."
        action={
          <ButtonLink href="/fundraisers/create">Start a fundraiser</ButtonLink>
        }
      />
      <FilterForm
        q={q}
        fields={[
          {
            name: 'category',
            label: 'Purpose',
            type: 'select',
            options: options([
              'medical',
              'food',
              'rescue',
              'shelter',
              'community',
            ]),
            value: category ?? '',
          },
          {
            name: 'sort',
            label: 'Order',
            type: 'select',
            options: [
              { value: 'recent', label: 'Most recent' },
              { value: 'urgent', label: 'Most urgent' },
            ],
            value: queryValue(p.sort) ?? 'recent',
          },
        ]}
      />
      <div
        className={
          'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
        }
      >
        {rows.items.map((f) => (
          <CatalogCard
            key={f.id}
            title={f.title}
            href={`/fundraisers/${f.slug}`}
            image={f.photo}
            people={
              <ContributorLine
                api={api}
                id={f.organizerId}
                meta="Campaign organizer"
              />
            }
            meta={`${f.category} · ${f.urgency} priority`}
            description={`${php(f.raisedMinor)} of ${php(f.goalMinor)} · ${f.state}`}
          >
            <Progress
              max={100}
              value={
                (100 * Math.min(f.raisedMinor, f.goalMinor)) /
                Math.max(1, f.goalMinor)
              }
              aria-label={`${f.title} funding progress`}
            />
          </CatalogCard>
        ))}
      </div>
      {!rows.count && <Empty>No campaigns match these filters.</Empty>}
      <NextPage
        cursor={rows.nextCursor}
        params={{ q, category, sort: queryValue(p.sort) }}
      />
    </>
  )
}
export async function FundraiserPage({
  slug,
  searchParams,
}: {
  slug: string
  searchParams?: SearchParams
}) {
  const params: Awaited<SearchParams> = await (searchParams ??
    Promise.resolve({}))
  const api = await getServerApi(),
    f = await publicRecord(() => api.fundraisers.get(slug)),
    [supporters, session] = await Promise.all([
      api.fundraisers.supporters(f.id, {
        limit: 50,
        cursor: queryValue(params.supporters),
      }),
      api.auth.session(),
    ])
  return (
    <>
      <PublicJsonLd
        name={f.title}
        description={f.story}
        path={`/fundraisers/${f.slug}`}
      />
      <ResourceHero
        image={f.photo}
        title={f.title}
        description={`${f.location.neighborhood} · ${f.verification.label}`}
      />
      <AchievementActivity
        target={{ kind: 'fundraiser', id: f.id }}
        href={'/fundraisers/' + f.slug}
      />
      <DetailBody>
        <ContributorLine
          api={api}
          id={f.organizerId}
          meta="Campaign organizer"
        />
        <p className={'prose-copy [white-space:pre-line]'}>{f.story}</p>
        <h2>Support, in full view</h2>
        <p
          className={
            'funding-amount font-heading text-[2rem] font-extrabold tabular-nums [&_span]:text-base [&_span]:font-normal'
          }
        >
          {php(f.raisedMinor)} <span>of {php(f.goalMinor)}</span>
        </p>
        <Progress
          max={100}
          value={
            (100 * Math.min(f.goalMinor, f.raisedMinor)) /
            Math.max(1, f.goalMinor)
          }
          aria-label="Funding progress"
        />
        <p>
          {Math.round((100 * f.raisedMinor) / f.goalMinor)}% funded ·{' '}
          {f.supporterCount} supporters · {f.state}
        </p>
        <p>
          Available: {php(f.balanceMinor)} · Recorded spending:{' '}
          {php(f.raisedMinor - f.balanceMinor)}. No payout is made in this
          demonstration.
        </p>
        {f.animalId && (
          <Link href={`/adopt?animalId=${f.animalId}`}>
            Explore animals available for adoption
          </Link>
        )}
        {session.demo && session.actor && f.state === 'active' ? (
          <section
            className={
              'workflow-panel [padding:1.5rem_0] [border-top:1px_solid_#ede5d8] [margin:1.5rem_0] [&_h2]:mt-0 [&_h3]:mt-0 [.app-shell_&]:min-w-0 [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:[overflow-wrap:anywhere] [.app-shell_&]:p-5 [.app-shell_&]:[margin:0_0_1rem] [.management-shell_&]:border-border [.management-shell_&_>_h3]:mt-4 [.management-shell_&_>_h2]:mt-4 max-[48rem]:[.app-shell_&]:p-4'
            }
          >
            <h2>Try a simulated contribution</h2>
            <p>
              No card details, charges or transfers. Your entry updates this
              local demonstration.
            </p>
            <WorkflowForm
              operation="donation"
              extra={{ id: f.id }}
              fields={[
                { name: 'amount', label: 'Amount in PHP', required: true },
                {
                  name: 'message',
                  label: 'Message of support',
                  type: 'textarea',
                },
                {
                  name: 'anonymous',
                  label: 'Show my support anonymously',
                  type: 'checkbox',
                },
              ]}
              submitLabel="Record simulated contribution"
            />
          </section>
        ) : !session.demo ? (
          <p>
            Live payments are not enabled. You can follow the organizer’s
            published updates.
          </p>
        ) : f.state === 'active' ? (
          <ButtonLink
            href={`/login?returnTo=${encodeURIComponent(`/fundraisers/${slug}`)}`}
          >
            Sign in to try a demo contribution
          </ButtonLink>
        ) : (
          <p>This campaign is not accepting new contributions.</p>
        )}
        <ChartPanel
          title="View simulated funding chart"
          unit="PHP"
          data={[
            { name: 'Raised', value: f.raisedMinor / 100 },
            {
              name: 'Recorded spending',
              value: (f.raisedMinor - f.balanceMinor) / 100,
            },
            { name: 'Available', value: f.balanceMinor / 100 },
          ]}
        />
        <h2>Estimated budget</h2>
        {f.budget.length ? (
          f.budget.map((b, i) => (
            <ActivityCard
              key={`${i}:${b.description}`}
              title={b.description}
              meta="Estimated budget"
            >
              <strong>{php(b.amountMinor)}</strong>
            </ActivityCard>
          ))
        ) : (
          <Empty>The organizer has not added an itemized estimate yet.</Empty>
        )}
        <h2>Expected timeline</h2>
        {f.timeline ? (
          <p>{f.timeline}</p>
        ) : (
          <Empty>The organizer has not shared a timeline yet.</Empty>
        )}
        <h2>Campaign updates</h2>
        {f.updates.length ? (
          f.updates.map((u) => (
            <ActivityCard
              key={u.id}
              title="Campaign update"
              identity={
                <ContributorLine
                  api={api}
                  id={u.authorId}
                  meta={date(u.createdAt)}
                  fallback="Campaign organizer update"
                />
              }
            >
              <p>{u.text}</p>
              {u.media.length ? (
                <div
                  className={
                    'post-photos grid gap-3 [margin:1rem_-1.25rem] [&_img]:w-full [&_img]:h-auto [&_img]:max-h-136 [&_img]:object-cover [&_figcaption]:[padding:0.5rem_1.25rem] [&_figcaption]:text-sm [&_>_p]:[padding:0.5rem_1.25rem] [&_>_p]:text-sm max-[48rem]:ml-[-1rem] max-[48rem]:mr-[-1rem] [.app-shell_&]:[margin:0.875rem_-1.125rem_0.5rem] [.app-shell_&]:gap-1 [.app-shell_&]:bg-[#f0f1f2] [.app-shell_&_img]:block [.app-shell_&_img]:w-full [.app-shell_&_img]:h-auto [.app-shell_&_img]:max-h-104 [.app-shell_&_img]:object-contain max-[48rem]:[.app-shell_&]:mx-[-0.875rem] max-[48rem]:[.app-shell_&_img]:max-h-80 [.pet-social-profile_&]:px-4 [.pet-social-profile_&]:mb-4 [.pet-social-profile_&_>_img]:rounded-xl'
                  }
                >
                  {u.media.map((photo) => (
                    <AnimalImage
                      key={photo.id}
                      image={photo}
                      className={
                        'activity-photo w-full max-h-76 object-cover rounded-xl block mt-3.5'
                      }
                    />
                  ))}
                </div>
              ) : null}
            </ActivityCard>
          ))
        ) : (
          <Empty>
            Campaign updates will appear here when the organizer shares them.
          </Empty>
        )}
        <h2>Expense record</h2>
        {f.expenses.length ? (
          f.expenses.map((e) => (
            <ActivityCard
              key={e.id}
              title={`${php(e.amountMinor)} recorded spending`}
              identity={
                <ContributorLine
                  api={api}
                  id={e.authorId}
                  meta={date(e.createdAt)}
                  fallback="Campaign expense entry"
                />
              }
            >
              <p>{e.description}</p>
              {e.correctsEntryId && (
                <p
                  className={
                    'journal-meta text-sm text-muted-foreground [margin:0_0_0.5rem] [.resource-card-heading_&]:m-0 [.resource-card-heading_&]:text-[0.8125rem]'
                  }
                >
                  Correction to an earlier entry
                </p>
              )}
              {f.expenses.some((entry) => entry.correctsEntryId === e.id) && (
                <p
                  className={
                    'journal-meta text-sm text-muted-foreground [margin:0_0_0.5rem] [.resource-card-heading_&]:m-0 [.resource-card-heading_&]:text-[0.8125rem]'
                  }
                >
                  Superseded by a later correction
                </p>
              )}
            </ActivityCard>
          ))
        ) : (
          <Empty>No expenses have been recorded for this campaign yet.</Empty>
        )}
        <h2 id="campaign-supporters">Supporters</h2>
        {supporters.items.map((s) => (
          <ActivityCard
            key={s.id}
            title={`${php(s.amountMinor)} of support`}
            identity={
              s.userId ? (
                <ContributorLine
                  api={api}
                  id={s.userId}
                  meta="Campaign supporter"
                  fallback={s.displayName}
                />
              ) : undefined
            }
          >
            <strong>{!s.userId && s.displayName}</strong>
            <p>{s.message}</p>
          </ActivityCard>
        ))}
        {!supporters.count && (
          <Empty>
            No supporters are shown yet. You can try a simulated contribution
            above.
          </Empty>
        )}
        <NextPage
          cursor={supporters.nextCursor}
          cursorKey="supporters"
          anchor="campaign-supporters"
          label="More supporters"
        />
      </DetailBody>
      <ResourceDiscussion
        target={{ kind: 'fundraiser', id: f.id }}
        title={f.title}
        path={`/fundraisers/${f.slug}`}
      />
    </>
  )
}
export async function MissionsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    kind = queryValue(p.kind),
    api = await getServerApi()
  const status = ['all', 'open', 'urgent', 'expired', 'closed'].includes(
    queryValue(p.status) ?? '',
  )
    ? (queryValue(p.status) as 'all' | 'open' | 'urgent' | 'expired' | 'closed')
    : 'open'
  const sort =
    p.sort === 'recent' || p.sort === 'deadline' ? p.sort : 'priority'
  const [rows, session] = await Promise.all([
    api.missions.list({
      q,
      cursor: queryValue(p.cursor),
      kind: kind as 'mission' | 'quest' | undefined,
      status,
      sort,
    }),
    api.auth.session(),
  ])
  const now = (session.demo ? demoClock : systemClock).now().getTime()
  return (
    <>
      <PageHeading
        title="A little help goes a long way"
        description="Find practical ways to care for the animals around you. Earn non-cash Kibble after your evidence is reviewed."
        action={
          session.roles.some(
            (role) => role === 'shelter_staff' || role === 'moderator',
          ) ? (
            <ButtonLink href="/missions/create">
              Create a help request
            </ButtonLink>
          ) : session.actor ? (
            <ButtonLink href="/dashboard/missions" variant="outline">
              Your mission activity
            </ButtonLink>
          ) : undefined
        }
      />
      <FilterForm
        q={q}
        fields={[
          {
            name: 'status',
            label: 'Availability',
            type: 'select',
            value: status,
            options: [
              { value: 'open', label: 'Open requests' },
              { value: 'urgent', label: 'Urgent requests' },
              { value: 'expired', label: 'Expired' },
              { value: 'closed', label: 'Closed' },
              { value: 'all', label: 'All requests' },
            ],
          },
          {
            name: 'kind',
            label: 'Type',
            type: 'select',
            options: options(['mission', 'quest']),
            value: kind ?? '',
          },
          {
            name: 'sort',
            label: 'Order',
            type: 'select',
            value: sort,
            options: [
              { value: 'priority', label: 'Care priority' },
              { value: 'deadline', label: 'Deadline' },
              { value: 'recent', label: 'Newest' },
            ],
          },
        ]}
      />
      <p className={'catalog-count text-muted-foreground text-[0.8125rem]'}>
        {rows.count} help requests ·{' '}
        {status === 'open'
          ? 'Open and accepting help'
          : 'Filtered by availability'}
      </p>
      <div
        className={
          'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1 mission-grid'
        }
      >
        {rows.items.map((m) => (
          <CatalogCard
            key={m.id}
            href={`/missions/${m.slug}`}
            title={m.title}
            people={
              <ContributorLine
                api={api}
                id={m.organizerId}
                meta="Organizing this mission"
              />
            }
            meta={`${m.kind === 'quest' ? 'Community quest' : 'Help mission'} · ${m.location.neighborhood}`}
            status={
              <StatusBadge tone={missionStatus(m, now).tone}>
                {missionStatus(m, now).label}
              </StatusBadge>
            }
            description={`${m.rewardKibble} Kibble after approval`}
            actionLabel={
              missionStatus(m, now).actionable
                ? 'See how to help'
                : 'View mission history'
            }
          >
            <p
              className={
                'mission-deadline text-muted-foreground text-[0.8125rem] [.app-shell_&]:[margin:0_0_0.5rem]'
              }
            >
              {Date.parse(m.deadline) <= now ? 'Deadline passed' : 'Help by'} ·{' '}
              {date(m.deadline)}
            </p>
          </CatalogCard>
        ))}
      </div>
      {!rows.count && <Empty>No help requests match this search.</Empty>}
      <NextPage cursor={rows.nextCursor} params={{ q, kind, status, sort }} />
    </>
  )
}
export async function MissionPage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    m = await publicRecord(() => api.missions.get(slug)),
    session = await api.auth.session()
  const joinable =
    m.state === 'open' &&
    Date.parse(m.deadline) >
      (session.demo ? demoClock : systemClock).now().getTime()
  const existing = session.actor
    ? await api.missions.participations({
        scope: 'mine',
        missionId: m.id,
        limit: 1,
      })
    : null
  return (
    <>
      <PublicJsonLd
        name={m.title}
        description={m.description}
        path={`/missions/${m.slug}`}
      />
      <ResourceHero
        banner="explorer"
        title={m.title}
        description={`${m.location.neighborhood} · ${m.state} · ${m.kind}`}
      />
      <AchievementActivity
        target={{ kind: 'mission', id: m.id }}
        href={'/missions/' + m.slug}
      />
      <DetailBody>
        <StatusBadge
          tone={
            missionStatus(
              m,
              (session.demo ? demoClock : systemClock).now().getTime(),
            ).tone
          }
        >
          {
            missionStatus(
              m,
              (session.demo ? demoClock : systemClock).now().getTime(),
            ).label
          }
        </StatusBadge>
        <ContributorLine
          api={api}
          id={m.organizerId}
          meta="Mission organizer"
        />
        <p>{m.description}</p>
        <p>
          Deadline: {date(m.deadline)} · {m.rewardKibble} non-cash Kibble after
          independent approval
        </p>
        <h2>What to submit</h2>
        {!m.evidenceRequirements.length && (
          <Empty>
            The organizer has not supplied evidence instructions yet.
          </Empty>
        )}
        <ul>
          {m.evidenceRequirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {existing?.count ? (
          <ButtonLink href="/dashboard/missions" variant="outline">
            View your mission activity
          </ButtonLink>
        ) : !joinable ? (
          <Empty href="/missions" label="Find another mission">
            This mission is closed or its deadline has passed.
          </Empty>
        ) : session.actor ? (
          <ActionButton action="mission" id={m.id}>
            Join this mission
          </ActionButton>
        ) : (
          <ButtonLink
            href={`/login?returnTo=${encodeURIComponent(`/missions/${slug}`)}`}
          >
            Sign in to help
          </ButtonLink>
        )}
        <p>
          Mission rewards require independent approval. Submit evidence from My
          missions after completing the contribution. A separate Volunteer
          achievement can be unlocked for joining.
        </p>
      </DetailBody>
      <ResourceDiscussion
        target={{ kind: 'mission', id: m.id }}
        title={m.title}
        path={`/missions/${m.slug}`}
      />
    </>
  )
}
export { EventListPage as EventsPage } from '@/features/events/event-list-page'
export { EventDetailPage as EventPage } from '@/features/events/event-page'
export async function SheltersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    api = await getServerApi(),
    rows = await api.shelters.list({ q, cursor: queryValue(p.cursor) })
  return (
    <>
      <PageHeading
        title="People who make room for care"
        description="Meet the shelters and rescuers connecting animals with safer futures."
      />
      <FilterForm q={q} />
      <div
        className={
          'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
        }
      >
        {rows.items.map((s) => (
          <CatalogCard
            key={s.id}
            href={`/shelters/${s.slug}`}
            title={s.name}
            description={s.description}
            meta={`${s.location.neighborhood} · ${s.verification.label}`}
            image={s.photo}
          />
        ))}
      </div>
      {!rows.items.length && (
        <Empty href="/missions" label="Find a way to help">
          No public shelters match this search.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} params={{ q }} />
    </>
  )
}
export async function ShelterPage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    s = await publicRecord(() => api.shelters.get(slug)),
    [animals, campaigns, missions, events] = await Promise.all([
      api.animals.list({ shelterId: s.id, adoptable: true, limit: 50 }),
      api.fundraisers.list({ limit: 50 }),
      api.missions.list({ limit: 50 }),
      api.events.list({ shelterId: s.id }),
    ])
  return (
    <>
      <PublicJsonLd
        name={s.name}
        description={s.description}
        path={`/shelters/${s.slug}`}
      />
      <ResourceHero
        image={s.photo}
        banner="home"
        title={s.name}
        description={`${s.location.neighborhood} · ${s.verification.label}`}
      >
        <ContributorFaces
          api={api}
          ids={s.staffIds}
          href={`/shelters/${s.slug}`}
        />
      </ResourceHero>
      <DetailBody>
        <p>{s.description}</p>
        <h2>Contact and next steps</h2>
        <p>
          No real contact details have been supplied for this illustrative
          organization. Use its adoption applications and mission pages to
          explore the demonstration workflows.
        </p>
        <h2>Looking for a home</h2>
        <div
          className={
            'journal-grid grid grid-cols-2 gap-6 [margin:1.5rem_0_2rem] max-[48rem]:grid-cols-1 max-[48rem]:gap-4 [.app-shell_&]:grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] [.app-shell_&]:gap-4 [.app-shell_&]:items-stretch min-[105rem]:[.app-shell_&]:grid-cols-3 min-[105rem]:[.app-shell_.detail-body_&]:grid-cols-2 max-[48rem]:[.app-shell_&]:grid-cols-1 max-[48rem]:[.app-shell_.detail-body_&]:grid-cols-1'
          }
        >
          {animals.items.map((a) => (
            <CatalogCard
              key={a.id}
              href={`/pets/${a.slug}`}
              title={a.name}
              image={a.photo}
              meta={a.species}
            />
          ))}
        </div>
        {!animals.count && (
          <Empty href="/adopt" label="Meet other animals">
            No adoptable profiles are currently published by this shelter.
          </Empty>
        )}
        <h2>Support their work</h2>
        {!campaigns.items.some((f) => f.shelterId === s.id) && (
          <Empty>
            No public fundraising campaigns are linked to this shelter yet.
          </Empty>
        )}
        {campaigns.items
          .filter((f) => f.shelterId === s.id)
          .map((f) => (
            <CatalogCard
              key={f.id}
              title={f.title}
              href={`/fundraisers/${f.slug}`}
              image={f.photo}
              meta={`${f.state} · ${php(f.raisedMinor)} raised`}
              people={
                <ContributorLine
                  api={api}
                  id={f.organizerId}
                  meta="Campaign organizer"
                />
              }
            />
          ))}
        <h2>Volunteer</h2>
        {!missions.items.some((m) => m.shelterId === s.id) && (
          <Empty href="/missions" label="Find another mission">
            No volunteer missions are linked to this shelter yet.
          </Empty>
        )}
        {missions.items
          .filter((m) => m.shelterId === s.id)
          .map((m) => (
            <CatalogCard
              key={m.id}
              title={m.title}
              href={`/missions/${m.slug}`}
              meta={`${m.state} · ${m.rewardKibble} Kibble after approval`}
              people={
                <ContributorLine
                  api={api}
                  id={m.organizerId}
                  meta="Mission organizer"
                />
              }
            />
          ))}
        <h2>Upcoming gatherings</h2>
        {!events.items.length && (
          <Empty href="/events" label="Find a gathering">
            No community gatherings are listed for this shelter yet.
          </Empty>
        )}
        {events.items.map((e) => (
          <CatalogCard
            key={e.id}
            title={e.title}
            href={`/events/${e.slug}`}
            meta={date(e.startsAt)}
            description={`${e.attendanceCount} attending · ${e.capacity} places`}
          />
        ))}
      </DetailBody>
      <ResourceDiscussion
        target={{ kind: 'shelter', id: s.id }}
        title={s.name}
        path={`/shelters/${s.slug}`}
      />
    </>
  )
}
export { CommunityLeaderboard as LeaderboardPage } from '@/features/kibble/leaderboard'
export async function AdoptPage({
  interested = false,
  searchParams,
}: { interested?: boolean; searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = interested
      ? await privateApi('/adopt/interested')
      : await getServerApi(),
    session = await api.auth.session(),
    rows = interested
      ? await api.adoption.interested({
          limit: 50,
          cursor: queryValue(p.cursor),
        })
      : await api.adoption.discover({ limit: 50, cursor: queryValue(p.cursor) })
  return (
    <>
      <PageHeading
        title={
          interested
            ? 'The ones you’d like to meet'
            : 'Find your next chapter together'
        }
        description="Explore at your own pace. Compatibility reflects declared preferences and known observations; every adoption needs a human shelter review."
        action={
          <ButtonLink href="/adopt/preferences" variant="outline">
            Your preferences
          </ButtonLink>
        }
      />
      <nav
        className={
          'workspace-tabs flex flex-wrap gap-5 [padding:1rem_0] [border-bottom:1px_solid_#ede5d8] mb-6 [&_[aria-current]]:text-[#0f766e] [&_[aria-current]]:font-bold [&_[aria-current]]:[text-decoration-thickness:2px] [.management-shell_&_a]:inline-flex [.management-shell_&_a]:items-center [.management-shell_&_a]:min-h-11 [.management-shell_&_a]:[padding:0.625rem_0.875rem] [.management-shell_&_a]:rounded-xl [.management-shell_&_a[aria-current=page]]:bg-[var(--teal)] [.management-shell_&_a[aria-current=page]]:text-card'
        }
      >
        <Link href="/adopt">Discover</Link>
        <Link href="/adopt/interested">Interested</Link>
        <Link href="/adopt/applications">Applications</Link>
      </nav>
      {rows.items.length ? (
        <AdoptionDeck
          candidates={rows.items}
          signedIn={!!session.actor}
          list={interested}
        />
      ) : (
        <Empty href="/adopt/preferences" label="Adjust preferences">
          No available animals match, or your interested list is empty.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} />
    </>
  )
}
export async function PreferencesPage() {
  const api = await privateApi('/adopt/preferences'),
    p = await api.adoption.preferences(),
    location = await publicArea()
  const fields = preferenceFields.map((f) => ({
    ...f,
    value:
      f.name === 'otherPets'
        ? p.otherPets === undefined
          ? ''
          : p.otherPets.length
            ? p.otherPets.join(',')
            : 'none'
        : f.name === 'personality'
          ? (p.personality?.join(', ') ?? '')
          : String(p[f.name as keyof typeof p] ?? ''),
  }))
  return (
    <>
      <PageHeading
        title="A few things about your home"
        description="Every question is optional. Leave a field blank to skip it; you can browse without completing this form."
      />
      <WorkflowForm
        operation="preferences"
        fields={fields}
        extra={{ location }}
        submitLabel="Save preferences"
      />
      <p>
        <Link href="/adopt">Skip and discover animals</Link>
      </p>
    </>
  )
}
export async function AnimalReportPage({ animalId }: { animalId?: string }) {
  const api = await privateApi('/animals/report'),
    location = await publicArea()
  const a = animalId ? await api.animals.get(animalId) : null
  return (
    <>
      <PageHeading
        title={
          a ? 'Update an animal story' : 'Every story starts with noticing'
        }
        description={`Report an animal around ${location.neighborhood}. Photographs and reports go through publication review; evidence stays private.`}
      />
      <WorkflowForm
        operation={a ? 'animal_edit' : 'animal'}
        extra={{ id: a?.id, version: a?.version, location }}
        fields={animalFields.map((f) => ({
          ...f,
          value: a
            ? String(a[f.name as 'name' | 'species' | 'description'])
            : f.value,
        }))}
        uploads="both"
        submitLabel="Submit for review"
      />
    </>
  )
}
export async function SightingPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    api = await privateApi('/sightings/create'),
    location = await publicArea(),
    animals = await api.animals.list({ limit: 50 })
  const fields: Field[] = [
    {
      name: 'animalId',
      label: 'Animal',
      type: 'select',
      options: animals.items.map((a) => ({ value: a.id, label: a.name })),
      value: queryValue(p.animalId) ?? animals.items[0]?.id ?? '',
    },
    {
      name: 'observedAt',
      label: 'Observed at (your local time)',
      type: 'datetime-local',
      required: true,
      value: '2026-11-01T18:00',
    },
    {
      name: 'observation',
      label: 'What did you observe?',
      type: 'textarea',
      required: true,
    },
    {
      name: 'latitude',
      label: 'Private exact latitude (optional)',
      type: 'number',
    },
    {
      name: 'longitude',
      label: 'Private exact longitude (optional)',
      type: 'number',
      help: 'Both coordinates are optional. They are kept off public profiles and maps.',
    },
  ]
  return (
    <>
      <PageHeading
        title="Leave a helpful observation"
        description={`Public reports use the general ${location.neighborhood} area. Describe what you saw; do not make a diagnosis.`}
      />
      <WorkflowForm
        operation="sighting"
        fields={fields}
        extra={{ location }}
        uploads="photos"
        submitLabel="Submit sighting for review"
      />
    </>
  )
}
export async function CampaignCreatePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    api = await privateApi('/fundraisers/create'),
    location = await publicArea(),
    [animals, session] = await Promise.all([
      api.animals.list({ limit: 50 }),
      api.auth.session(),
    ]),
    draft = queryValue(p.draft)
      ? await api.fundraisers.draft(queryValue(p.draft)!)
      : null
  const hordes = await api.hordes.list({ limit: 50 })
  const fields: Field[] = [
    ...campaignFields,
    {
      name: 'hordeId',
      label: 'Horde this supports',
      type: 'select',
      options: [
        { value: '', label: 'No group beneficiary' },
        ...hordes.items.map((h) => ({ value: h.id, label: h.name })),
      ],
      value: queryValue(p.hordeId) ?? '',
      step: 1,
    },
    {
      name: 'animalId',
      label: 'Animal this supports',
      type: 'select',
      options: [
        { value: '', label: 'General animal welfare' },
        ...animals.items.map((a) => ({ value: a.id, label: a.name })),
      ],
      value: queryValue(p.animalId) ?? '',
      step: 1,
    },
    {
      name: 'shelterId',
      label: 'Responsible shelter',
      type: 'select',
      options: [
        { value: '', label: 'Individual organizer' },
        ...session.actor!.shelterIds.map((id) => ({ value: id, label: id })),
      ],
      step: 1,
    },
  ]
  const initial = fields.map((f) => ({
    ...f,
    value: draft
      ? f.name === 'budget'
        ? (draft.values.budget
            ?.map((b) => `${b.description} | ${b.amountMinor / 100}`)
            .join('\n') ?? '')
        : f.name === 'goal'
          ? draft.values.goalMinor === undefined
            ? ''
            : String(draft.values.goalMinor / 100)
          : String(
              draft.values[f.name as keyof typeof draft.values] ??
                f.value ??
                '',
            )
      : f.value,
  }))
  return (
    <>
      <PageHeading
        title="Make a clear case for care"
        description="Explain the need, set a transparent goal, and submit private evidence for independent review. This is a demonstration fundraiser."
      />
      <WorkflowForm
        operation="campaign"
        fields={initial}
        extra={{
          location,
          draftId: draft?.id,
          version: draft?.expectedVersion,
        }}
        steps={['Purpose', 'Their story', 'Goal and evidence', 'Review']}
        uploads="both"
        initialPhotos={draft?.values.mediaIds ?? []}
        initialEvidence={draft?.values.privateEvidenceIds ?? []}
        allowDraft
        submitLabel="Submit fundraiser for review"
      />
    </>
  )
}
export async function MissionCreatePage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await privateApi('/missions/create'),
    session = await api.auth.session(),
    location = await publicArea()
  if (!session.roles.some((r) => ['shelter_staff', 'moderator'].includes(r)))
    return (
      <>
        <PageHeading
          title="Organizer access required"
          description="A shelter organizer or moderator can create help requests. As a member, you can join a mission and submit evidence."
        />
        <ButtonLink href="/missions">Find a mission</ButtonLink>
      </>
    )
  const [animals, hordes] = await Promise.all([
    api.animals.list({ limit: 50 }),
    api.hordes.list({ limit: 50 }),
  ])
  return (
    <>
      <PageHeading
        title="Turn a need into a useful next step"
        description="Give volunteers a clear task, a deadline and evidence requirements."
      />
      <WorkflowForm
        operation="mission"
        fields={[
          ...missionFields.map((f) =>
            f.name === 'kind'
              ? { ...f, value: p.kind === 'quest' ? 'quest' : 'mission' }
              : f,
          ),
          {
            name: 'animalId',
            label: 'Animal this supports',
            type: 'select',
            options: [
              { value: '', label: 'General community help' },
              ...animals.items.map((a) => ({ value: a.id, label: a.name })),
            ],
          },
          {
            name: 'hordeId',
            label: 'Horde this supports',
            type: 'select',
            options: [
              { value: '', label: 'No group beneficiary' },
              ...hordes.items.map((h) => ({ value: h.id, label: h.name })),
            ],
          },
          {
            name: 'shelterId',
            label: 'Responsible shelter',
            type: 'select',
            options: [
              { value: '', label: 'Independent organizer' },
              ...session.actor!.shelterIds.map((id) => ({
                value: id,
                label: id,
              })),
            ],
          },
        ]}
        extra={{ location }}
        submitLabel="Create help request"
      />
    </>
  )
}
export async function EventCreatePage({ id }: { id?: string }) {
  const api = await privateApi('/dashboard/events/create'),
    session = await api.auth.session()
  if (!session.roles.some((r) => ['shelter_staff', 'moderator'].includes(r)))
    return (
      <Empty href="/events" label="Browse gatherings">
        Organization staff or moderators can create events.
      </Empty>
    )
  const row = id ? await api.events.get(id) : null
  const fields: Field[] = [
    ...eventFields,
    {
      name: 'shelterId',
      label: 'Organizing shelter',
      type: 'select',
      options: [
        { value: '', label: 'Independent organizer' },
        ...session.actor!.shelterIds.map((id) => ({ value: id, label: id })),
      ],
    },
  ]
  const local = (iso: string) =>
    new Date(Date.parse(iso) + 8 * 60 * 60 * 1000).toISOString().slice(0, 16)
  const values = row
    ? {
        ...row,
        venue: row.venue.name,
        address: row.venue.address,
        latitude: String(row.venue.latitude),
        longitude: String(row.venue.longitude),
        publicVenue: true,
        startsAt: local(row.startsAt),
        endsAt: local(row.endsAt),
      }
    : null
  return (
    <>
      <PageHeading
        title={row ? 'Manage your gathering' : 'Bring the community together'}
        description="Only publish a venue whose address and coordinates are intended for the public. Display times use Asia/Manila."
      />
      <WorkflowForm
        operation={row ? 'event_edit' : 'event'}
        extra={{ id: row?.id, version: row?.version }}
        fields={fields.map((f) => ({
          ...f,
          value: values
            ? f.name === 'publicVenue'
              ? true
              : String(values[f.name as keyof typeof values] ?? f.value ?? '')
            : f.value,
        }))}
        submitLabel="Save event"
      />
    </>
  )
}
