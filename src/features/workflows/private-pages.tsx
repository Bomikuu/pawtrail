import { ActivityCard } from '@/components/shared/social-card'
import { ContributorLine, ContributorFaces } from './contributors'
import { PostDetail } from '@/features/community/post-card'
import { AnimalImage } from '@/components/shared/animal-image'
import { ChartPanel } from './chart-panel'
import Link from 'next/link'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { ButtonLink } from '@/components/ui/button-link'
import {
  PageHeading,
  CatalogCard,
  Empty,
  DetailBody,
  php,
  date,
  options,
  NextPage,
  FilterForm,
} from './catalog'
import { privateApi, publicArea, queryValue, type SearchParams } from './server'
import { WorkflowForm, type Field } from './form'
import { ActionButton } from './action-button'
import { applicationFields, campaignFields, animalFields } from './fields'
import { ShelterEvidence } from '@/features/shelters/verification-evidence'
import { DashboardAttention } from './dashboard-attention'
import { StatusBadge } from '@/components/shared/status-badge'
import { demoClock, systemClock } from '@/lib/api/clock'

export async function DashboardPage() {
  const api = await privateApi('/dashboard'),
    [summary, session] = await Promise.all([
      api.users.summary(),
      api.auth.session(),
    ])
  const recent = await api.community.list({
    authorId: session.actor!.id,
    limit: 3,
  })
  return (
    <>
      <PageHeading
        title="Overview"
        description={
          'Welcome back, ' +
          session.actor!.displayName +
          '. Manage your animals, applications and community contributions.'
        }
        action={<ButtonLink href="/animals/report">Add an animal</ButtonLink>}
      />
      <DashboardAttention
        api={api}
        actor={session.actor!}
        now={(session.demo ? demoClock : systemClock).now().toISOString()}
      />
      <ContributorLine
        api={api}
        id={session.actor!.id}
        meta="Your community contributions and management workspace"
        fallback="Your private workspace"
      />
      <dl className="dashboard-summary">
        {[
          [summary.animals, 'Animals you look after', '/dashboard/animals'],
          [summary.sightings, 'Observations shared', '/dashboard/sightings'],
          [
            summary.applications,
            'Adoption applications',
            '/dashboard/adoptions',
          ],
          [
            summary.unreadNotifications,
            'Unread updates',
            '/dashboard/notifications',
          ],
          [summary.kibbleBalance, 'Non-cash Kibble', '/dashboard/kibble'],
        ].map(([count, label, path]) => (
          <div key={String(path)}>
            <dt>
              <Link href={String(path)}>{label}</Link>
            </dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      <ChartPanel
        title="View your activity chart"
        data={[
          { name: 'Animals', value: summary.animals },
          { name: 'Sightings', value: summary.sightings },
          { name: 'Applications', value: summary.applications },
        ]}
      />
      <h2>Your latest stories</h2>
      {recent.items.length ? (
        recent.items.map((post) => (
          <ActivityCard
            key={post.id}
            title={`${post.type === 'photo' ? 'Photo' : 'Community'} story · ${new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(new Date(post.createdAt))}`}
            href={`/community/${post.id}`}
            identity={
              <ContributorLine
                api={api}
                id={session.actor!.id}
                meta={`${date(post.createdAt)} · ${post.moderation}`}
                fallback="Your story"
              />
            }
          >
            <p className="story-summary">{post.text}</p>
            <Link className="story-link" href={`/community/${post.id}`}>
              Read story
            </Link>
          </ActivityCard>
        ))
      ) : (
        <Empty href="/community/create" label="Share your first story">
          Your community stories will appear here.
        </Empty>
      )}
      <h2>Keep a good thing going</h2>
      <div className="journal-grid">
        <CatalogCard
          href="/community/create"
          title="Share a story"
          description="Tell the community about a familiar animal or a moment of care."
        />
        <CatalogCard
          href="/missions"
          title="Lend a helping hand"
          description="Find a clear, practical task with a local organizer."
        />
      </div>
    </>
  )
}
export async function ProfilePage() {
  const api = await privateApi('/dashboard/profile'),
    u = await api.users.me(),
    location = await publicArea()
  return (
    <>
      <PageHeading
        title="Your community profile"
        description="Share what you would like neighbors to know. Privacy settings control whether your profile, area and contributions appear publicly."
        action={
          <div className="profile-editor-actions">
            {u.settings.discoverable && (
              <ButtonLink
                href={'/users/' + encodeURIComponent(u.username)}
                variant="outline"
              >
                View public profile
              </ButtonLink>
            )}
            <ButtonLink href="/dashboard/settings" variant="outline">
              Privacy settings
            </ButtonLink>
          </div>
        }
      />
      <WorkflowForm
        key={u.id}
        operation="profile"
        extra={{
          location,
          avatarId: u.avatar?.id ?? null,
          bannerId: u.bannerId,
        }}
        initialAvatar={u.avatar}
        fields={[
          {
            name: 'displayName',
            label: 'Display name',
            value: u.displayName,
            required: true,
          },
          { name: 'bio', label: 'About you', type: 'textarea', value: u.bio },
          {
            name: 'showArea',
            label: 'Include my general neighborhood',
            type: 'checkbox',
            value: !!u.location,
          },
        ]}
        submitLabel="Save profile"
      />
      <p>
        <Link href="/dashboard/achievements">
          Choose achievement badges and mastery to show on your profile
        </Link>
      </p>
      {u.settings.discoverable && (
        <p>
          <Link href={`/users/${u.username}`}>View your public profile</Link>
        </p>
      )}
    </>
  )
}
export async function SettingsPage() {
  const api = await privateApi('/dashboard/settings'),
    s = await api.users.settings()
  return (
    <>
      <PageHeading
        title="Choose what you share"
        description="These settings affect public profiles, search, contribution attribution and the leaderboard. Private application answers and evidence are never added to your public profile."
      />
      <WorkflowForm
        operation="privacy"
        fields={[
          {
            name: 'discoverable',
            label: 'Let people find my public profile',
            type: 'checkbox',
            value: s.discoverable,
          },
          {
            name: 'showLocation',
            label: 'Show my general neighborhood',
            type: 'checkbox',
            value: s.showLocation,
          },
          {
            name: 'showContributions',
            label: 'Show my attributed contributions and earned achievements',
            type: 'checkbox',
            value: s.showContributions,
          },
        ]}
        submitLabel="Save privacy choices"
      />
    </>
  )
}
export async function MyAnimalsPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await privateApi('/dashboard/animals'),
    rows = await api.animals.list({
      scope: 'mine',
      limit: 50,
      cursor: queryValue(p.cursor),
    })
  return (
    <>
      <PageHeading
        title="The animals in your care"
        description="Manage stories you own or profiles assigned to your shelter. Changes return to publication review."
        action={
          <ButtonLink href="/animals/report">Add an animal report</ButtonLink>
        }
      />
      <div className="journal-grid">
        {rows.items.map((a) => (
          <CatalogCard
            key={a.id}
            href={`/dashboard/animals/${a.slug}/edit`}
            title={a.name}
            meta={`${a.reviewState ?? 'published'} · ${a.status}`}
            image={a.photo}
            description={a.location.neighborhood}
          />
        ))}
      </div>
      {!rows.count && (
        <Empty href="/animals/report" label="Report an animal">
          You have not created or been assigned any animal profiles yet.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} />
    </>
  )
}
export async function AnimalEditPage({ slug }: { slug: string }) {
  const api = await privateApi('/dashboard/animals'),
    a = await api.animals.get(slug),
    u = await api.users.me()
  const fields: Field[] = [
    {
      name: 'clearPhotos',
      label: 'Remove previous photos from this profile submission',
      type: 'checkbox',
    },
    {
      name: 'clearEvidence',
      label: 'Remove previous evidence from this verification submission',
      type: 'checkbox',
    },
    ...animalFields.map((f) => ({
      ...f,
      value: String(a[f.name as 'name' | 'species' | 'description']),
    })),
    {
      name: 'ageMonths',
      label: 'Age in months',
      type: 'number',
      min: 0,
      value: String(a.ageMonths),
    },
    {
      name: 'size',
      label: 'Size',
      type: 'select',
      options: options(['small', 'medium', 'large']).slice(1),
      value: a.size,
    },
    {
      name: 'status',
      label: 'Care status',
      type: 'select',
      options: options([
        'community',
        'sheltered',
        'owned',
        'adopted',
        'missing',
      ]).slice(1),
      value: a.status,
    },
    {
      name: 'adoptable',
      label: 'Available for responsible adoption through a shelter',
      type: 'checkbox',
      value: a.adoptable,
    },
    {
      name: 'shelterId',
      label: 'Responsible shelter',
      type: 'select',
      options: [
        { value: '', label: 'Retain existing shelter' },
        ...u.shelterIds.map((id) => ({ value: id, label: id })),
      ],
      value: a.shelterId ?? '',
    },
  ]
  return (
    <>
      <PageHeading
        title={`Care for ${a.name}’s story`}
        description="Edits are private until reviewed. Existing attachments are retained unless you submit replacements."
      />
      <WorkflowForm
        key={a.id}
        operation="animal_edit"
        extra={{
          id: a.id,
          version: a.version,
          location: a.location,
          bannerId: a.bannerId,
        }}
        fields={fields}
        uploads="both"
        submitLabel="Submit changes for review"
      />
    </>
  )
}
export async function MySightingsPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await privateApi('/dashboard/sightings'),
    rows = await api.sightings.list({
      scope: 'mine',
      limit: 50,
      cursor: queryValue(p.cursor),
    })
  return (
    <>
      <PageHeading
        title="Your observations"
        description="Publication status is separate from verification. Public views always use generalized areas."
        action={
          <ButtonLink href="/sightings/create">Add a sighting</ButtonLink>
        }
      />
      {rows.items.map((s) => (
        <ActivityCard
          key={s.id}
          title="Your neighborhood sighting"
          identity={
            <ContributorLine
              api={api}
              id={s.reporterId}
              meta={`${date(s.observedAt)} · ${s.moderation}`}
              fallback="Your sighting"
            />
          }
        >
          <p>{s.observation}</p>
          <p className="journal-meta">{s.location.neighborhood}</p>
          {s.media.length > 0 && (
            <AnimalImage image={s.media[0]} className="activity-photo" />
          )}
        </ActivityCard>
      ))}
      {!rows.count && <Empty>No observations shared yet.</Empty>}
      <NextPage cursor={rows.nextCursor} />
    </>
  )
}
export async function SavedPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const params: Awaited<SearchParams> = await (searchParams ??
    Promise.resolve({}))
  const api = await privateApi('/dashboard/saved'),
    [animals, stories, session] = await Promise.all([
      api.animals.list({
        saved: true,
        limit: 50,
        cursor: queryValue(params.animals),
      }),
      api.community.list({
        saved: true,
        limit: 50,
        cursor: queryValue(params.stories),
      }),
      api.auth.session(),
    ])
  return (
    <>
      <PageHeading
        title="Stories to come back to"
        description="Only you can see this saved list. Withdrawn content disappears from public results."
      />
      <h2 id="saved-animals">Animals</h2>
      <div className="journal-grid">
        {animals.items.map((a) => (
          <CatalogCard
            key={a.id}
            href={`/pets/${a.slug}`}
            title={a.name}
            image={a.photo}
          />
        ))}
      </div>
      {!animals.count && (
        <Empty href="/explore" label="Meet nearby animals">
          No saved animal profiles yet.
        </Empty>
      )}
      <NextPage
        cursor={animals.nextCursor}
        cursorKey="animals"
        params={{ stories: queryValue(params.stories) }}
        anchor="saved-animals"
        label="More saved animals"
      />
      <h2 id="saved-stories">Community stories</h2>
      <div className="resource-story-feed">
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
      {!stories.count && (
        <Empty href="/community" label="Explore stories">
          Save a community story to find it here later.
        </Empty>
      )}
      <NextPage
        cursor={stories.nextCursor}
        cursorKey="stories"
        params={{ animals: queryValue(params.animals) }}
        anchor="saved-stories"
        label="More saved stories"
      />
    </>
  )
}
export async function ApplicationsPage({
  shelter = false,
  searchParams,
}: {
  shelter?: boolean
  searchParams?: SearchParams
}) {
  const params: Awaited<SearchParams> = await (searchParams ??
    Promise.resolve({}))
  const status = [
    'draft',
    'submitted',
    'needs_information',
    'approved',
    'rejected',
    'withdrawn',
  ].includes(queryValue(params.status) ?? '')
    ? (queryValue(params.status) as
        | 'draft'
        | 'submitted'
        | 'needs_information'
        | 'approved'
        | 'rejected'
        | 'withdrawn')
    : undefined
  const api = await privateApi('/adopt/applications'),
    rows = await api.adoption.applications({
      scope: shelter ? 'shelter' : 'mine',
      status,
      cursor: queryValue(params.cursor),
      limit: 50,
    }),
    animals = await api.animals.list({
      ids: [...new Set(rows.items.map((item) => item.animalId))],
      limit: 50,
    })
  return (
    <>
      <PageHeading
        title={shelter ? 'Shelter application review' : 'Your adoption journey'}
        description={
          shelter
            ? 'Private applications for the organizations you manage. Drafts stay with the applicant.'
            : 'Saved interest, private drafts, and applications are separate steps. A shelter decision does not finalize an adoption.'
        }
        action={!shelter && <ButtonLink href="/adopt">Meet animals</ButtonLink>}
      />
      <FilterForm
        search={false}
        fields={[
          {
            name: 'status',
            label: 'Application status',
            type: 'select',
            value: status ?? '',
            options: options(
              [
                'submitted',
                'needs_information',
                'approved',
                'rejected',
                'withdrawn',
                ...(!shelter ? ['draft'] : []),
              ],
              'All applications',
            ),
          },
        ]}
      />
      {rows.items.map((a) => (
        <ActivityCard
          key={a.id}
          title={
            animals.items.find((r) => r.id === a.animalId)?.name ??
            'Animal application'
          }
          image={animals.items.find((r) => r.id === a.animalId)?.photo}
          href={
            shelter
              ? `/dashboard/shelter/applications/${a.id}`
              : `/adopt/applications/${a.id}`
          }
          meta={`${a.status.replaceAll('_', ' ')} · ${date(a.createdAt)}`}
        >
          <p className="private-card-note">
            Private application · version {a.version}
          </p>
        </ActivityCard>
      ))}
      {!rows.count && <Empty>No applications match this status.</Empty>}
      <NextPage
        cursor={rows.nextCursor}
        params={{ status }}
        label="More applications"
      />
    </>
  )
}
export async function ApplicationNewPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams,
    api = await privateApi('/adopt/applications/new'),
    id = queryValue(p.animalId) ?? queryValue(p.animal)
  if (!id)
    return (
      <Empty href="/adopt" label="Meet adoptable animals">
        Choose an animal before starting an application.
      </Empty>
    )
  const a = await api.animals.get(id)
  if (!a.adoptable || !a.shelterId)
    return (
      <Empty href="/adopt">
        This animal is not accepting adoption applications.
      </Empty>
    )
  const drafts = await api.adoption.applications({
      status: 'draft',
      limit: 50,
    }),
    prior = drafts.items.find((r) => r.animalId === a.id)
  if (prior)
    return (
      <>
        <PageHeading title={`Continue your application for ${a.name}`} />
        <ButtonLink href={`/adopt/applications/${prior.id}`}>
          Resume private draft
        </ButtonLink>
      </>
    )
  return (
    <>
      <PageHeading
        title={`A home for ${a.name}`}
        description="Share the information the shelter needs for an initial conversation. Do not submit identification documents, bank details or unrelated sensitive information."
      />
      <WorkflowForm
        operation="application"
        fields={applicationFields}
        extra={{ animalId: a.id }}
        steps={['Your details', 'Home and care', 'Review']}
        allowDraft
        submitLabel="Submit private application"
      />
    </>
  )
}
export async function ApplicationPage({ id }: { id: string }) {
  const api = await privateApi('/adopt/applications'),
    [a, u] = await Promise.all([api.adoption.application(id), api.users.me()]),
    mine = a.applicantId === u.id
  const fields = applicationFields.map((f) => ({
    ...f,
    value:
      f.name === 'agreement'
        ? a.answers.agreement === true
        : String(a.answers[f.name as keyof typeof a.answers] ?? ''),
  }))
  return (
    <>
      <PageHeading
        title="Adoption application"
        description={`${a.status.replaceAll('_', ' ')} · last version ${a.version} · private to you and responsible shelter staff`}
      />
      {a.reviewMessage && (
        <section className="workflow-panel">
          <h2>A note from the shelter</h2>
          <p>{a.reviewMessage}</p>
        </section>
      )}
      {mine && ['draft', 'needs_information'].includes(a.status) ? (
        <WorkflowForm
          operation="application"
          fields={fields}
          extra={{
            id: a.id,
            animalId: a.animalId,
            draftId: a.status === 'draft' ? a.id : undefined,
            version: a.version,
            resubmit: a.status === 'needs_information',
          }}
          steps={['Your details', 'Home and care', 'Review']}
          allowDraft={a.status === 'draft'}
          submitLabel={
            a.status === 'draft'
              ? 'Submit application'
              : 'Resubmit with information'
          }
        />
      ) : (
        <dl className="workflow-review">
          {applicationFields
            .filter((f) => f.type !== 'checkbox')
            .map((f) => (
              <div key={f.name}>
                <dt>{f.label}</dt>
                <dd>
                  {String(
                    a.answers[f.name as keyof typeof a.answers] ??
                      'Not provided',
                  )}
                </dd>
              </div>
            ))}
        </dl>
      )}
      {mine &&
        ['draft', 'submitted', 'needs_information', 'approved'].includes(
          a.status,
        ) && (
          <ActionButton action="withdraw" id={a.id}>
            Withdraw this application
          </ActionButton>
        )}
      {!mine && a.status === 'submitted' && (
        <section className="workflow-panel">
          <h2>Record a considered decision</h2>
          <WorkflowForm
            operation="application_review"
            extra={{ id: a.id, version: a.version }}
            fields={[
              {
                name: 'decision',
                label: 'Decision',
                type: 'select',
                options: [
                  {
                    value: 'needs_information',
                    label: 'Request more information',
                  },
                  {
                    value: 'approved',
                    label: 'Approve application for next steps',
                  },
                  { value: 'rejected', label: 'Decline application' },
                ],
                value: 'needs_information',
              },
              {
                name: 'message',
                label: 'Explanation for the applicant',
                type: 'textarea',
                required: true,
              },
            ]}
            submitLabel="Record decision"
          />
        </section>
      )}
      <h2>Status history</h2>
      {a.history.length ? (
        a.history.map((h, index) => (
          <ActivityCard
            key={`${h.version}:${h.status}:${h.createdAt}:${index}`}
            title={h.status.replaceAll('_', ' ')}
            identity={
              <ContributorLine
                api={api}
                id={h.actorId}
                meta={date(h.createdAt)}
                fallback="Private application update"
              />
            }
          >
            <p>{h.message}</p>
            <small>Version {h.version}</small>
          </ActivityCard>
        ))
      ) : (
        <Empty>
          Status updates will appear here when the application moves forward.
        </Empty>
      )}
    </>
  )
}
export async function MyFundraisersPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const params: Awaited<SearchParams> = await (searchParams ??
    Promise.resolve({}))
  const api = await privateApi('/dashboard/fundraisers'),
    [dashboard, drafts] = await Promise.all([
      api.fundraisers.dashboard(),
      api.fundraisers.drafts({ limit: 50, cursor: queryValue(params.drafts) }),
    ])
  return (
    <>
      <PageHeading
        title="Your fundraising workspace"
        description={`${php(dashboard.totalRaisedMinor)} in simulated support across ${dashboard.contributionCount} contributions. No money has moved.`}
        action={
          <ButtonLink href="/fundraisers/create">Start a fundraiser</ButtonLink>
        }
      />
      {drafts.items.length > 0 && (
        <section>
          <h2 id="private-fundraiser-drafts">Private drafts</h2>
          {drafts.items.map((d) => (
            <CatalogCard
              key={d.id}
              href={`/fundraisers/create?draft=${d.id}`}
              title={d.title}
              meta="Private draft"
              description="Continue preparing your campaign before submitting it for review."
            />
          ))}
        </section>
      )}
      {!drafts.items.length && (
        <Empty href="/fundraisers/create" label="Prepare a campaign">
          No private fundraiser drafts yet.
        </Empty>
      )}
      <NextPage
        cursor={drafts.nextCursor}
        cursorKey="drafts"
        anchor="private-fundraiser-drafts"
        label="More private drafts"
      />
      <h2>Your campaigns</h2>
      {dashboard.campaigns.map((f) => (
        <CatalogCard
          key={f.id}
          href={`/dashboard/fundraisers/${f.id}`}
          title={f.title}
          image={f.photo}
          people={
            <ContributorLine
              api={api}
              id={f.organizerId}
              meta="Campaign organizer"
            />
          }
          description={`${php(f.raisedMinor)} / ${php(f.goalMinor)}`}
          meta={f.state}
        />
      ))}
      {!dashboard.campaigns.length && (
        <Empty>
          No submitted campaigns yet. Continue a draft or prepare your first
          fundraiser.
        </Empty>
      )}
    </>
  )
}
export async function ManageCampaignPage({ id }: { id: string }) {
  const api = await privateApi('/dashboard/fundraisers'),
    [f, dashboard] = await Promise.all([
      api.fundraisers.get(id),
      api.fundraisers.dashboard(),
    ])
  if (!dashboard.campaigns.some((r) => r.id === f.id))
    return <Empty>This campaign is outside your workspace.</Empty>
  const fields = campaignFields.map((fld) => ({
    ...fld,
    step: 0,
    value:
      fld.name === 'budget'
        ? f.budget
            .map((b) => `${b.description} | ${b.amountMinor / 100}`)
            .join('\n')
        : fld.name === 'goal'
          ? String(f.goalMinor / 100)
          : String(f[fld.name as 'title' | 'story' | 'category' | 'urgency']),
  }))
  const preserved: Field[] = [
    ...fields,
    { name: 'hordeId', label: 'Horde beneficiary ID', value: f.hordeId ?? '' },
    {
      name: 'animalId',
      label: 'Animal beneficiary ID',
      value: f.animalId ?? '',
      help: 'Beneficiary and goal cannot change after publication or support.',
    },
    {
      name: 'shelterId',
      label: 'Responsible shelter ID',
      value: f.shelterId ?? '',
    },
  ]
  return (
    <>
      <PageHeading
        title={f.title}
        description={`${f.state} · ${php(f.raisedMinor)} raised · ${php(f.balanceMinor)} available`}
      />
      <p>{f.verification.label}</p>
      <DetailBody>
        {f.state === 'active' && (
          <>
            <h2>Post an update</h2>
            <WorkflowForm
              operation="campaign_update"
              extra={{ id: f.id }}
              fields={[
                {
                  name: 'text',
                  label: 'What has changed?',
                  type: 'textarea',
                  required: true,
                },
              ]}
              uploads="photos"
              submitLabel="Submit campaign update"
            />
            <h2>Record spending</h2>
            <p>
              Entries are append-only. Correct an earlier entry by adding a
              replacement that references it.
            </p>
            <WorkflowForm
              operation="expense"
              extra={{ id: f.id }}
              fields={[
                {
                  name: 'amount',
                  label: 'Amount spent in PHP',
                  required: true,
                },
                {
                  name: 'description',
                  label: 'What was provided?',
                  type: 'textarea',
                  required: true,
                },
                {
                  name: 'correctsEntryId',
                  label: 'Correction (optional)',
                  type: 'select',
                  options: [
                    { value: '', label: 'New expense' },
                    ...f.expenses
                      .filter(
                        (e) =>
                          !f.expenses.some((r) => r.correctsEntryId === e.id),
                      )
                      .map((e) => ({
                        value: e.id,
                        label: `${php(e.amountMinor)} — ${e.description}`,
                      })),
                  ],
                },
              ]}
              uploads="evidence"
              submitLabel="Append expense record"
            />
            <h2>Close contributions</h2>
            <p>
              Closing stops new simulated support and keeps the public financial
              record.
            </p>
            <ActionButton action="close" id={f.id}>
              Close this campaign
            </ActionButton>
          </>
        )}
        <h2>Campaign details</h2>
        {!['closed', 'completed'].includes(f.state) && (
          <WorkflowForm
            operation="campaign_edit"
            extra={{ id: f.id, version: f.version, location: f.location }}
            fields={preserved}
            uploads="both"
            submitLabel="Submit changes for review"
          />
        )}
        {['closed', 'completed'].includes(f.state) && (
          <ActivityCard title="Campaign details are read-only" meta={f.state}>
            <p>
              The campaign is no longer accepting contributions. Its published
              story, updates and financial record remain available.
            </p>
            <ButtonLink href={`/fundraisers/${f.slug}`} variant="outline">
              View public campaign
            </ButtonLink>
          </ActivityCard>
        )}
        <h2>Expense history</h2>
        {f.expenses.length ? (
          f.expenses.map((expense) => {
            const receipts =
              dashboard.receipts.find((entry) => entry.expenseId === expense.id)
                ?.mediaIds ?? []
            return (
              <ActivityCard
                key={expense.id}
                title={`${php(expense.amountMinor)} recorded spending`}
                identity={
                  <ContributorLine
                    api={api}
                    id={expense.authorId}
                    meta={date(expense.createdAt)}
                    fallback="Campaign expense record"
                  />
                }
              >
                <p>{expense.description}</p>
                {expense.correctsEntryId && (
                  <p className="journal-meta">
                    Correction to an earlier expense
                  </p>
                )}
                {f.expenses.some(
                  (entry) => entry.correctsEntryId === expense.id,
                ) && (
                  <p className="journal-meta">
                    Superseded by a later correction
                  </p>
                )}
                {receipts.length ? (
                  <div className="activity-actions">
                    {receipts.map((id, index) => (
                      <ButtonAnchor
                        key={id}
                        variant="outline"
                        href={`/api/v1/media/${encodeURIComponent(id)}/content`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Private receipt {index + 1}
                        <span className="sr-only"> (opens a new tab)</span>
                      </ButtonAnchor>
                    ))}
                  </div>
                ) : (
                  <p className="journal-meta">
                    No private receipt is attached.
                  </p>
                )}
              </ActivityCard>
            )
          })
        ) : (
          <Empty>No expenses have been recorded for this campaign yet.</Empty>
        )}
      </DetailBody>
    </>
  )
}
export async function MyMissionsPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const params: Awaited<SearchParams> = await (searchParams ??
    Promise.resolve({}))
  const reviewState =
    params.reviewState === 'approved' ? 'approved' : 'submitted'
  const state =
    params.state === 'submitted' ||
    params.state === 'rejected' ||
    params.state === 'approved' ||
    params.state === 'all'
      ? params.state
      : 'accepted'
  const participationNames = {
    accepted: 'To do',
    submitted: 'Awaiting review',
    rejected: 'Needs changes',
    approved: 'Completed',
    all: 'All activity',
  } as const
  const reviewHref = (reviewStatus: 'submitted' | 'approved') => {
    const query = new URLSearchParams({ reviewState: reviewStatus, state })
    const mineCursor = queryValue(params.mine)
    if (mineCursor) query.set('mine', mineCursor)
    return `?${query}#mission-review`
  }
  const api = await privateApi('/dashboard/missions'),
    [mine, review, missions, session] = await Promise.all([
      api.missions.participations({
        scope: 'mine',
        state: state === 'all' ? undefined : state,
        limit: 50,
        cursor: queryValue(params.mine),
      }),
      api.missions.participations({
        scope: 'organization',
        state: reviewState,
        limit: 50,
        cursor: queryValue(params.review),
      }),
      api.missions.list({ limit: 50 }),
      api.auth.session(),
    ])
  return (
    <>
      <PageHeading
        title="Care you can follow through"
        description="Submit evidence after completing a mission. A responsible organizer reviews it before any non-cash reward is awarded."
        action={<ButtonLink href="/missions">Find a mission</ButtonLink>}
      />
      <h2 id="my-mission-activity">Your missions</h2>
      <nav
        className="workspace-tabs mission-state-tabs"
        aria-label="Your mission status"
      >
        {Object.entries(participationNames).map(([key, label]) => (
          <Link
            key={key}
            href={`?${new URLSearchParams({ state: key, reviewState })}#my-mission-activity`}
            aria-current={state === key ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      {mine.items.map((p) => {
        const mission = missions.items.find((item) => item.id === p.missionId)
        return (
          <section className="workflow-panel" key={p.id}>
            <ContributorLine
              api={api}
              id={p.volunteerId}
              meta="Your mission participation"
              fallback="Your mission participation"
            />
            <StatusBadge
              tone={
                p.state === 'approved'
                  ? 'success'
                  : p.state === 'rejected'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {participationNames[p.state]}
            </StatusBadge>
            <h3>
              <Link href={`/missions/${mission?.slug ?? p.missionId}`}>
                {mission?.title ?? 'Open mission details'}
              </Link>
            </h3>
            <p className="mission-deadline">
              {mission
                ? `${Date.parse(mission.deadline) <= (session.demo ? demoClock : systemClock).now().getTime() ? 'Deadline passed' : 'Help by'} · ${date(mission.deadline)}`
                : 'Open the mission for its latest deadline and instructions.'}
            </p>
            <p>
              {p.reviewReason ??
                (p.state === 'accepted'
                  ? 'Complete the care task, then submit private evidence.'
                  : 'Your evidence is waiting for an organizer’s review.')}
            </p>
            {['accepted', 'rejected'].includes(p.state) && (
              <details className="mission-evidence-details">
                <summary>
                  {p.state === 'rejected'
                    ? 'Update and resubmit evidence'
                    : 'Submit evidence'}
                </summary>
                <WorkflowForm
                  operation="mission_evidence"
                  extra={{ id: p.id, version: p.version }}
                  fields={[
                    {
                      name: 'text',
                      label: 'Describe the completed contribution',
                      type: 'textarea',
                      value: p.evidence?.text ?? '',
                      required: true,
                    },
                  ]}
                  uploads="evidence"
                  submitLabel="Submit private evidence"
                />
              </details>
            )}
          </section>
        )
      })}
      {!mine.count && (
        <Empty href="/missions" label="Find a mission">
          No missions in “{participationNames[state]}”. Switch status to see
          your other activity, or find a new way to help.
        </Empty>
      )}
      <NextPage
        cursor={mine.nextCursor}
        cursorKey="mine"
        params={{ review: queryValue(params.review), reviewState, state }}
        anchor="my-mission-activity"
        label="More of your missions"
      />
      {session.actor?.roles.some(
        (role) => role === 'shelter_staff' || role === 'moderator',
      ) && (
        <>
          <h2 id="mission-review">
            Evidence for your organization ({review.count})
          </h2>
          <nav
            className="workspace-tabs"
            aria-label="Mission evidence review state"
          >
            <Link
              href={reviewHref('submitted')}
              aria-current={reviewState === 'submitted' ? 'page' : undefined}
            >
              Waiting for review
            </Link>
            <Link
              href={reviewHref('approved')}
              aria-current={reviewState === 'approved' ? 'page' : undefined}
            >
              Approved evidence
            </Link>
          </nav>
          {review.items
            .filter((p) => ['submitted', 'approved'].includes(p.state))
            .map((p) => (
              <section className="workflow-panel" key={p.id}>
                <ContributorLine
                  api={api}
                  id={p.volunteerId}
                  meta="Private evidence for your organization"
                  fallback="Mission volunteer"
                />
                <h3>
                  <Link href={`/missions/${p.missionId}`}>
                    {missions.items.find((m) => m.id === p.missionId)?.title ??
                      'Open mission details'}
                  </Link>
                </h3>
                <p>
                  {p.evidence?.text || 'No evidence description was supplied.'}
                </p>
                {p.evidence?.mediaIds.length ? (
                  <div className="activity-actions">
                    {p.evidence.mediaIds.map((id, index) => (
                      <ButtonAnchor
                        key={id}
                        variant="outline"
                        href={`/api/v1/media/${encodeURIComponent(id)}/content`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open private evidence {index + 1}
                        <span className="sr-only"> (opens a new tab)</span>
                      </ButtonAnchor>
                    ))}
                  </div>
                ) : (
                  <p className="journal-meta">
                    No media attachments were supplied.
                  </p>
                )}
                <WorkflowForm
                  operation="mission_review"
                  extra={{ id: p.id, version: p.version }}
                  fields={[
                    {
                      name: 'decision',
                      label: 'Decision',
                      type: 'select',
                      value: p.state === 'approved' ? 'rejected' : 'approved',
                      options:
                        p.state === 'approved'
                          ? [
                              {
                                value: 'rejected',
                                label: 'Reverse approval and earned reward',
                              },
                            ]
                          : [
                              {
                                value: 'approved',
                                label: 'Approve evidence and award Kibble',
                              },
                              { value: 'rejected', label: 'Reject evidence' },
                            ],
                    },
                    {
                      name: 'reason',
                      label: 'Review explanation',
                      type: 'textarea',
                      required: true,
                    },
                  ]}
                  submitLabel="Record evidence decision"
                />
              </section>
            ))}
          {!review.items.some((p) =>
            ['submitted', 'approved'].includes(p.state),
          ) && (
            <Empty>
              {reviewState === 'approved'
                ? 'No approved mission evidence is available in this queue yet.'
                : 'No mission evidence is waiting for review. New submissions will appear here.'}
            </Empty>
          )}
          <NextPage
            cursor={review.nextCursor}
            cursorKey="review"
            params={{ mine: queryValue(params.mine), reviewState, state }}
            anchor="mission-review"
            label="More evidence records"
          />
        </>
      )}
    </>
  )
}
export async function WalletPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await privateApi('/dashboard/kibble'),
    [wallet, ledger] = await Promise.all([
      api.kibble.wallet(),
      api.kibble.transactions({ limit: 50, cursor: queryValue(p.cursor) }),
    ])
  return (
    <>
      <PageHeading
        title="Your Kibble journal"
        description={`${wallet.balance} non-cash Kibble. Earned through reviewed community contributions; it cannot be purchased, transferred or cashed out.`}
      />
      <p>
        Level {1 + Math.floor(wallet.balance / 100)} · each 100 net earned
        Kibble advances one level.
      </p>
      <h2>Immutable activity record</h2>
      {ledger.items.map((e) => (
        <ActivityCard
          key={e.id}
          title={`${e.amount > 0 ? '+' : ''}${e.amount} Kibble`}
          meta={date(e.createdAt)}
        >
          <p>{e.description}</p>
          <small>{e.provenance.label}</small>
        </ActivityCard>
      ))}
      {!ledger.count && (
        <Empty href="/missions" label="Explore missions">
          No Kibble entries yet. Join a mission and submit your contribution for
          review.
        </Empty>
      )}
      <NextPage cursor={ledger.nextCursor} />
    </>
  )
}
export async function MyEventsPage({
  searchParams,
}: { searchParams?: SearchParams } = {}) {
  const p: Awaited<SearchParams> = await (searchParams ?? Promise.resolve({}))
  const api = await privateApi('/dashboard/events'),
    [rows, u] = await Promise.all([
      api.events.list({
        scope: 'mine',
        limit: 50,
        cursor: queryValue(p.cursor),
      }),
      api.users.me(),
    ])
  return (
    <>
      <PageHeading
        title="Your community gatherings"
        description="Events you organize or plan to attend."
        action={
          u.roles.some(
            (role) => role === 'shelter_staff' || role === 'moderator',
          ) ? (
            <ButtonLink href="/dashboard/events/create">
              Organize an event
            </ButtonLink>
          ) : (
            <ButtonLink href="/events">Find a gathering</ButtonLink>
          )
        }
      />
      {rows.items.map((e) => (
        <ActivityCard
          key={e.id}
          title={e.title}
          href={`/events/${e.slug}`}
          meta={`${date(e.startsAt)} · ${e.state}`}
          identity={
            <ContributorLine
              api={api}
              id={e.organizerId}
              meta="Event organizer"
            />
          }
        >
          <p>
            {e.attendanceCount} attending · {e.capacity} places
          </p>
          {(e.organizerId === u.id ||
            u.shelterIds.includes(e.shelterId ?? '')) && (
            <ButtonLink
              variant="outline"
              href={`/dashboard/events/${e.id}/edit`}
            >
              Manage event
            </ButtonLink>
          )}
        </ActivityCard>
      ))}
      {!rows.count && (
        <Empty href="/events" label="Find a gathering">
          No events in your calendar yet.
        </Empty>
      )}
      <NextPage cursor={rows.nextCursor} />
    </>
  )
}
export async function ShelterWorkspacePage() {
  const api = await privateApi('/dashboard/shelter'),
    u = await api.users.me()
  if (!u.roles.includes('shelter_staff') || !u.shelterIds.length)
    return (
      <Empty>This workspace is available to responsible shelter staff.</Empty>
    )
  const rows = await Promise.all(
      u.shelterIds.map((id) => api.shelters.dashboard(id)),
    ),
    shelters = await api.shelters.list({ limit: 50 }),
    publicUsers = await api.search.query({ kinds: ['user'], limit: 50 })
  return (
    <>
      <PageHeading
        title="Room for care"
        description="Manage only the organizations assigned to your account. Volunteer identities appear only when their public contribution choices permit it."
        action={
          <ButtonLink href="/dashboard/shelter/applications">
            Review applications
          </ButtonLink>
        }
      />
      {rows.map((s) => (
        <section className="workflow-panel" key={s.shelterId}>
          <h2>
            {shelters.items.find((r) => r.id === s.shelterId)?.name ??
              'Your shelter'}
          </h2>
          <p>
            {s.pendingApplications} applications waiting · {s.pendingEvidence}{' '}
            evidence submissions
          </p>
          <nav className="workspace-tabs">
            <Link href="/dashboard/animals">
              Managed animals ({s.animalIds.length})
            </Link>
            <Link href="/dashboard/fundraisers">
              Campaigns ({s.fundraiserIds.length})
            </Link>
            <Link href="/dashboard/missions">Mission evidence</Link>
            <Link href="/dashboard/events">Events ({s.eventIds.length})</Link>
          </nav>
          <p>
            {s.volunteerIds.length} eligible public volunteers linked to
            approved participation.
          </p>
          <ContributorFaces
            api={api}
            ids={s.volunteerIds}
            href={`/shelters/${shelters.items.find((r) => r.id === s.shelterId)?.slug ?? ''}`}
          />
          {!s.volunteerIds.length && (
            <Empty>
              No public volunteer profiles are connected to approved
              participation yet.
            </Empty>
          )}
          <ul>
            {publicUsers.items
              .filter((u) => s.volunteerIds.includes(u.ref.id))
              .map((u) => (
                <li key={u.ref.id}>
                  <Link href={u.path}>{u.title}</Link>
                </li>
              ))}
          </ul>
          <ShelterEvidence shelterId={s.shelterId} />
        </section>
      ))}
    </>
  )
}
