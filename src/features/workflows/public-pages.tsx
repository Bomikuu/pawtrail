import { AchievementActivity } from '@/features/achievements/activity'
import { ChartPanel } from './chart-panel'
import { ResourceDiscussion } from './discussion'
import { PublicJsonLd } from '@/lib/seo/public-json-ld'
import Link from 'next/link'
import { getServerApi } from '@/lib/api/server'
import { ButtonLink } from '@/components/ui/button-link'
import { AnimalImage } from '@/components/shared/animal-image'
import {
  PageHeading,
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
import { AdoptionDeck } from '@/features/adoption/deck'

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
        {animals.count} animals · {area.neighborhood} · approximate locations
      </p>
      <div className="journal-grid">
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
      <div className="journal-grid">
        {rows.items.map((h) => (
          <CatalogCard
            key={h.id}
            title={h.name}
            href={`/hordes/${h.slug}`}
            description={h.description}
            meta={`${h.animalIds.length} known members · ${h.location.neighborhood}`}
            image={h.photo}
          />
        ))}
      </div>
      <NextPage cursor={rows.nextCursor} params={{ q }} />
    </>
  )
}
export async function HordePage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    h = await publicRecord(() => api.hordes.get(slug)),
    [animals, sightings, campaigns, missions] = await Promise.all([
      api.animals.list({ hordeId: h.id, limit: 50 }),
      api.sightings.list({ hordeId: h.id }),
      api.fundraisers.list({ limit: 50 }),
      api.missions.list({ limit: 50 }),
    ])
  return (
    <>
      <PublicJsonLd
        name={h.name}
        description={h.description}
        path={`/hordes/${h.slug}`}
      />
      <PageHeading
        title={h.name}
        description={`${h.location.neighborhood} · approximate public area`}
      />
      {h.photo && <AnimalImage image={h.photo} className="detail-cover" />}
      <DetailBody>
        <p>{h.description}</p>
        <p>
          {animals.count} confirmed profile members. A total population estimate
          has not been supplied.
        </p>
        <p>
          <ButtonLink
            href={`/fundraisers/create?hordeId=${h.id}`}
            variant="outline"
          >
            Start a fundraiser for this group
          </ButtonLink>
        </p>
        <h2>Meet the group</h2>
        <div className="journal-grid">
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
        <h2>Shared observations</h2>
        {sightings.items.length ? (
          sightings.items.map((s) => (
            <article className="journal-row" key={s.id}>
              <p>{s.observation}</p>
              <small>
                {date(s.observedAt)} · {s.location.neighborhood}
              </small>
            </article>
          ))
        ) : (
          <Empty>No published observations yet.</Empty>
        )}
        <h2>Ways to help</h2>
        {campaigns.items
          .filter((f) => h.fundraiserIds.includes(f.id))
          .map((f) => (
            <p key={f.id}>
              <Link href={`/fundraisers/${f.slug}`}>{f.title}</Link>
            </p>
          ))}
        {missions.items
          .filter((m) => h.missionIds.includes(m.id))
          .map((m) => (
            <p key={m.id}>
              <Link href={`/missions/${m.slug}`}>{m.title}</Link>
            </p>
          ))}
        <h2>Community stories</h2>
        {h.postIds.length ? (
          h.postIds.map((id) => (
            <p key={id}>
              <Link href={`/community/${id}`}>
                Read a story about this group
              </Link>
            </p>
          ))
        ) : (
          <p>No published stories yet.</p>
        )}
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
            {items.map((r) => (
              <article
                className="journal-row"
                key={`${r.ref.kind}:${r.ref.id}`}
              >
                <h3>
                  <Link href={r.path}>{r.title}</Link>
                </h3>
                <p>{r.excerpt}</p>
              </article>
            ))}
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
      <div className="journal-grid">
        {rows.items.map((f) => (
          <CatalogCard
            key={f.id}
            title={f.title}
            href={`/fundraisers/${f.slug}`}
            image={f.photo}
            meta={`${f.category} · ${f.urgency} priority`}
            description={`${php(f.raisedMinor)} of ${php(f.goalMinor)} · ${f.state}`}
          >
            <progress
              max={f.goalMinor}
              value={Math.min(f.raisedMinor, f.goalMinor)}
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
export async function FundraiserPage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    f = await publicRecord(() => api.fundraisers.get(slug)),
    [supporters, session] = await Promise.all([
      api.fundraisers.supporters(f.id, { limit: 50 }),
      api.auth.session(),
    ])
  return (
    <>
      <PublicJsonLd
        name={f.title}
        description={f.story}
        path={`/fundraisers/${f.slug}`}
      />
      <PageHeading
        title={f.title}
        description={`${f.location.neighborhood} · ${f.verification.label}`}
      />
      <AchievementActivity
        target={{ kind: 'fundraiser', id: f.id }}
        href={'/fundraisers/' + f.slug}
      />
      {f.photo && <AnimalImage image={f.photo} className="detail-cover" />}
      <DetailBody>
        <p className="prose-copy">{f.story}</p>
        <h2>Support, in full view</h2>
        <p className="funding-amount">
          {php(f.raisedMinor)} <span>of {php(f.goalMinor)}</span>
        </p>
        <progress
          max={f.goalMinor}
          value={Math.min(f.goalMinor, f.raisedMinor)}
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
          <section className="workflow-panel">
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
            <p key={i}>
              {b.description} · {php(b.amountMinor)} estimated
            </p>
          ))
        ) : (
          <p>No itemized estimate supplied.</p>
        )}
        {f.timeline && (
          <>
            <h2>Expected timeline</h2>
            <p>{f.timeline}</p>
          </>
        )}
        <h2>Campaign updates</h2>
        {f.updates.length ? (
          f.updates.map((u) => (
            <article className="journal-row" key={u.id}>
              <p>{u.text}</p>
              <small>{date(u.createdAt)}</small>
            </article>
          ))
        ) : (
          <p>No updates have been published.</p>
        )}
        <h2>Expense record</h2>
        {f.expenses.length ? (
          f.expenses.map((e) => (
            <article className="journal-row" key={e.id}>
              <strong>{php(e.amountMinor)}</strong>
              <p>{e.description}</p>
              <small>
                {date(e.createdAt)}
                {e.correctsEntryId ? ' · correction to an earlier entry' : ''}
                {f.expenses.some((r) => r.correctsEntryId === e.id)
                  ? ' · superseded by a later correction'
                  : ''}
              </small>
            </article>
          ))
        ) : (
          <p>No spending has been recorded.</p>
        )}
        <h2>Supporters</h2>
        {supporters.items.map((s) => (
          <article className="journal-row" key={s.id}>
            <strong>
              {s.displayName} · {php(s.amountMinor)}
            </strong>
            <p>{s.message}</p>
          </article>
        ))}
        {!supporters.count && <p>Be the first to try a demo contribution.</p>}
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
    api = await getServerApi(),
    rows = await api.missions.list({
      q,
      cursor: queryValue(p.cursor),
      kind: kind as 'mission' | 'quest' | undefined,
    })
  return (
    <>
      <PageHeading
        title="A little help goes a long way"
        description="Find practical ways to care for the animals around you. Earn non-cash Kibble after your evidence is reviewed."
        action={
          <ButtonLink href="/missions/create">Create a help request</ButtonLink>
        }
      />
      <FilterForm
        q={q}
        fields={[
          {
            name: 'kind',
            label: 'Type',
            type: 'select',
            options: options(['mission', 'quest']),
            value: kind ?? '',
          },
        ]}
      />
      {rows.items.map((m) => (
        <CatalogCard
          key={m.id}
          href={`/missions/${m.slug}`}
          title={m.title}
          meta={`${m.kind} · ${m.urgency} priority`}
          description={`${m.rewardKibble} Kibble after approval · deadline ${date(m.deadline)}`}
        />
      ))}
      {!rows.count && <Empty>No help requests match this search.</Empty>}
      <NextPage cursor={rows.nextCursor} params={{ q, kind }} />
    </>
  )
}
export async function MissionPage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    m = await publicRecord(() => api.missions.get(slug)),
    session = await api.auth.session()
  return (
    <>
      <PublicJsonLd
        name={m.title}
        description={m.description}
        path={`/missions/${m.slug}`}
      />
      <PageHeading
        title={m.title}
        description={`${m.location.neighborhood} · ${m.state} · ${m.kind}`}
      />
      <AchievementActivity
        target={{ kind: 'mission', id: m.id }}
        href={'/missions/' + m.slug}
      />
      <DetailBody>
        <p>{m.description}</p>
        <p>
          Deadline: {date(m.deadline)} · {m.rewardKibble} non-cash Kibble after
          independent approval
        </p>
        <h2>What to submit</h2>
        <ul>
          {m.evidenceRequirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {session.actor ? (
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
export async function EventsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    q = queryValue(p.q),
    api = await getServerApi(),
    rows = await api.events.list({ q, cursor: queryValue(p.cursor) })
  return (
    <>
      <PageHeading
        title="Gather for a good cause"
        description="Animal welfare gatherings, adoption days and community care. Listed sample gatherings are illustrative."
        action={
          <ButtonLink href="/dashboard/events/create">
            Organize an event
          </ButtonLink>
        }
      />
      <FilterForm q={q} />
      {rows.items.map((e) => (
        <CatalogCard
          key={e.id}
          href={`/events/${e.slug}`}
          title={e.title}
          meta={`${date(e.startsAt)} · ${e.state}`}
          description={`${e.venue.name} · ${e.attendanceCount}/${e.capacity} places`}
        />
      ))}
      {!rows.count && <Empty>No events match this search.</Empty>}
      <NextPage cursor={rows.nextCursor} params={{ q }} />
    </>
  )
}
export async function EventPage({ slug }: { slug: string }) {
  const api = await getServerApi(),
    e = await publicRecord(() => api.events.get(slug)),
    session = await api.auth.session()
  return (
    <>
      <PublicJsonLd
        name={e.title}
        description={e.description}
        path={`/events/${e.slug}`}
      />
      <PageHeading
        title={e.title}
        description={`${date(e.startsAt)} — ${date(e.endsAt)} · Asia/Manila`}
      />
      <DetailBody>
        <p>{e.description}</p>
        <h2>Meet here</h2>
        <p>
          {e.venue.name}
          <br />
          {e.venue.address}
        </p>
        <p>This event venue and its coordinates are intentionally public.</p>
        <DiscoveryMap
          center={{ latitude: e.venue.latitude, longitude: e.venue.longitude }}
          features={[
            {
              ref: { kind: 'event', id: e.id },
              href: `/events/${e.slug}`,
              title: e.title,
              location: {
                areaId: 'public-event',
                neighborhood: e.venue.address,
                latitude: e.venue.latitude,
                longitude: e.venue.longitude,
                approximateRadiusMeters: 500,
              },
            },
          ]}
        />
        <p>
          {e.attendanceCount} attending · capacity {e.capacity} · {e.state}
        </p>
        {session.actor ? (
          <ActionButton action="rsvp" id={e.id} active={e.viewerAttending}>
            {e.viewerAttending ? 'Cancel my RSVP' : 'RSVP to this event'}
          </ActionButton>
        ) : (
          <ButtonLink
            href={`/login?returnTo=${encodeURIComponent(`/events/${slug}`)}`}
          >
            Sign in to RSVP
          </ButtonLink>
        )}
      </DetailBody>
      <ResourceDiscussion
        target={{ kind: 'event', id: e.id }}
        title={e.title}
        path={`/events/${e.slug}`}
      />
    </>
  )
}
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
      <div className="journal-grid">
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
      <PageHeading
        title={s.name}
        description={`${s.location.neighborhood} · ${s.verification.label}`}
      />
      <DetailBody>
        <p>{s.description}</p>
        <h2>Contact and next steps</h2>
        <p>
          No real contact details have been supplied for this illustrative
          organization. Use its adoption applications and mission pages to
          explore the demonstration workflows.
        </p>
        <h2>Looking for a home</h2>
        <div className="journal-grid">
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
          <p>No adoptable profiles are currently published.</p>
        )}
        <h2>Support their work</h2>
        {campaigns.items
          .filter((f) => f.shelterId === s.id)
          .map((f) => (
            <p key={f.id}>
              <Link href={`/fundraisers/${f.slug}`}>{f.title}</Link>
            </p>
          ))}
        <h2>Volunteer</h2>
        {missions.items
          .filter((m) => m.shelterId === s.id)
          .map((m) => (
            <p key={m.id}>
              <Link href={`/missions/${m.slug}`}>{m.title}</Link>
            </p>
          ))}
        <h2>Upcoming gatherings</h2>
        {events.items.map((e) => (
          <p key={e.id}>
            <Link href={`/events/${e.slug}`}>
              {e.title} · {date(e.startsAt)}
            </Link>
          </p>
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
      <nav className="workspace-tabs">
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
