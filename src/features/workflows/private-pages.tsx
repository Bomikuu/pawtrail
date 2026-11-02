import { ChartPanel } from './chart-panel'
import Link from 'next/link'
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
} from './catalog'
import { privateApi, publicArea, queryValue, type SearchParams } from './server'
import { WorkflowForm, type Field } from './form'
import { ActionButton } from './action-button'
import { applicationFields, campaignFields, animalFields } from './fields'
import { ShelterEvidence } from '@/features/shelters/verification-evidence'

export async function DashboardPage() {
  const api = await privateApi('/dashboard'),
    [summary, session] = await Promise.all([
      api.users.summary(),
      api.auth.session(),
    ])
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
        operation="animal_edit"
        extra={{ id: a.id, version: a.version, location: a.location }}
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
        <article className="journal-row" key={s.id}>
          <strong>{s.moderation}</strong>
          <p>{s.observation}</p>
          <small>
            {date(s.observedAt)} · {s.location.neighborhood}
          </small>
        </article>
      ))}
      {!rows.count && <Empty>No observations shared yet.</Empty>}
      <NextPage cursor={rows.nextCursor} />
    </>
  )
}
export async function SavedPage() {
  const api = await privateApi('/dashboard/saved'),
    [animals, stories] = await Promise.all([
      api.animals.list({ saved: true, limit: 50 }),
      api.community.list({ saved: true, limit: 50 }),
    ])
  return (
    <>
      <PageHeading
        title="Stories to come back to"
        description="Only you can see this saved list. Withdrawn content disappears from public results."
      />
      <h2>Animals</h2>
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
      {!animals.count && <p>No saved animal profiles.</p>}
      <h2>Community stories</h2>
      {stories.items.map((p) => (
        <article className="journal-row" key={p.id}>
          <Link href={`/community/${p.id}`}>
            {p.text.slice(0, 150) || 'Photo story'}
          </Link>
        </article>
      ))}
      {!stories.count && <p>No saved community stories.</p>}
    </>
  )
}
export async function ApplicationsPage({
  shelter = false,
}: {
  shelter?: boolean
}) {
  const api = await privateApi('/adopt/applications'),
    rows = await api.adoption.applications({
      scope: shelter ? 'shelter' : 'mine',
      limit: 50,
    }),
    animals = await api.animals.list({ limit: 50 })
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
      {rows.items.map((a) => (
        <article className="journal-row" key={a.id}>
          <p className="journal-meta">
            {a.status.replaceAll('_', ' ')} · {date(a.createdAt)}
          </p>
          <h2>
            <Link
              href={
                shelter
                  ? `/dashboard/shelter/applications/${a.id}`
                  : `/adopt/applications/${a.id}`
              }
            >
              {animals.items.find((r) => r.id === a.animalId)?.name ??
                'Animal application'}
            </Link>
          </h2>
          <p>Version {a.version}</p>
        </article>
      ))}
      {!rows.count && <Empty>No applications in this workspace yet.</Empty>}
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
        a.history.map((h) => (
          <article className="journal-row" key={h.version}>
            <strong>{h.status.replaceAll('_', ' ')}</strong>
            <p>{h.message}</p>
            <small>
              {date(h.createdAt)} · version {h.version}
            </small>
          </article>
        ))
      ) : (
        <p>No status transitions recorded yet.</p>
      )}
    </>
  )
}
export async function MyFundraisersPage() {
  const api = await privateApi('/dashboard/fundraisers'),
    [dashboard, drafts] = await Promise.all([
      api.fundraisers.dashboard(),
      api.fundraisers.drafts({ limit: 50 }),
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
          <h2>Private drafts</h2>
          {drafts.items.map((d) => (
            <p key={d.id}>
              <Link href={`/fundraisers/create?draft=${d.id}`}>{d.title}</Link>
            </p>
          ))}
        </section>
      )}
      {dashboard.campaigns.map((f) => (
        <CatalogCard
          key={f.id}
          href={`/dashboard/fundraisers/${f.id}`}
          title={f.title}
          description={`${php(f.raisedMinor)} / ${php(f.goalMinor)}`}
          meta={f.state}
        />
      ))}
      {!dashboard.campaigns.length && !drafts.count && (
        <Empty>No campaigns or private drafts yet.</Empty>
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
        <h2>Expense history</h2>
        {f.expenses.map((e) => (
          <article className="journal-row" key={e.id}>
            <strong>{php(e.amountMinor)}</strong>
            <p>{e.description}</p>
            <small>
              {e.correctsEntryId ? 'Correction · ' : ''}
              {date(e.createdAt)}
            </small>
            {dashboard.receipts
              .find((r) => r.expenseId === e.id)
              ?.mediaIds.map((id, i) => (
                <p key={id}>
                  <a
                    href={`/api/v1/media/${id}/content`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Private receipt {i + 1}
                  </a>
                </p>
              ))}
          </article>
        ))}
      </DetailBody>
    </>
  )
}
export async function MyMissionsPage() {
  const api = await privateApi('/dashboard/missions'),
    [mine, review, missions] = await Promise.all([
      api.missions.participations({ scope: 'mine', limit: 50 }),
      api.missions.participations({ scope: 'organization', limit: 50 }),
      api.missions.list({ limit: 50 }),
    ])
  return (
    <>
      <PageHeading
        title="Care you can follow through"
        description="Submit evidence after completing a mission. A responsible organizer reviews it before any non-cash reward is awarded."
        action={<ButtonLink href="/missions">Find a mission</ButtonLink>}
      />
      <h2>Your missions</h2>
      {mine.items.map((p) => (
        <section className="workflow-panel" key={p.id}>
          <h3>
            {missions.items.find((m) => m.id === p.missionId)?.title ??
              'Mission activity'}
          </h3>
          <p>
            {p.state} · {p.reviewReason ?? 'No review yet'}
          </p>
          {['accepted', 'rejected'].includes(p.state) && (
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
          )}
        </section>
      ))}
      {!mine.count && <p>You have not joined any missions yet.</p>}
      <h2>Evidence for your organization</h2>
      {review.items
        .filter((p) => ['submitted', 'approved'].includes(p.state))
        .map((p) => (
          <section className="workflow-panel" key={p.id}>
            <h3>
              {missions.items.find((m) => m.id === p.missionId)?.title ??
                'Mission evidence'}
            </h3>
            <p>{p.evidence?.text}</p>
            {p.evidence?.mediaIds.map((id, i) => (
              <p key={id}>
                <a
                  href={`/api/v1/media/${id}/content`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open private evidence {i + 1}
                </a>
              </p>
            ))}
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
      ) && <p>No evidence is ready for your review.</p>}
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
        <article className="journal-row" key={e.id}>
          <strong>
            {e.amount > 0 ? '+' : ''}
            {e.amount} Kibble
          </strong>
          <p>{e.description}</p>
          <small>
            {date(e.createdAt)} · {e.provenance.label}
          </small>
        </article>
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
          <ButtonLink href="/dashboard/events/create">
            Organize an event
          </ButtonLink>
        }
      />
      {rows.items.map((e) => (
        <section className="journal-row" key={e.id}>
          <h2>
            <Link href={`/events/${e.slug}`}>{e.title}</Link>
          </h2>
          <p>
            {date(e.startsAt)} · {e.state} · {e.attendanceCount}/{e.capacity}
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
        </section>
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
