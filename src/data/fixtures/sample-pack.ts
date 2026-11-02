import 'server-only'
import { achievementCatalog } from '@/features/achievements/catalog'
import {
  achievementOverview,
  achievementStore,
  manilaDay,
} from '@/features/achievements/engine'
import { adoptionApplicationSchema } from '@/features/adoption/schemas'
import { emptyWorkflow } from '@/lib/server/workflow-store'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import type { FixtureSeed } from './index'
import { DEMO_NOW } from '@/lib/api/clock'
import { base } from './shared'
import { samplePast } from './scenarios'

export const SAMPLE_PACK_VERSION = 1

/** Expand legacy collection overlays once. Existing rows and deliberate removals stay authoritative. */
export function mergeExpandedSamples(draft: DemoDraft, baseline: FixtureSeed) {
  const limits: Partial<Record<keyof FixtureSeed, number>> = {
    posts: 10,
    sightings: 20,
    comments: 10,
    fundraisers: 10,
    missions: 10,
  }
  const references: Record<string, keyof FixtureSeed> = {
    animalId: 'animals',
    hordeId: 'hordes',
    shelterId: 'shelters',
    authorId: 'users',
    userId: 'users',
    contributorId: 'users',
    reporterId: 'users',
    organizerId: 'users',
    volunteerId: 'users',
    reviewerId: 'users',
    campaignId: 'fundraisers',
    missionId: 'missions',
    eventId: 'events',
  }
  const kinds: Record<string, keyof FixtureSeed> = {
    animal: 'animals',
    horde: 'hordes',
    shelter: 'shelters',
    user: 'users',
    fundraiser: 'fundraisers',
    mission: 'missions',
    event: 'events',
    post: 'posts',
  }
  const referenceExists = (collection: keyof FixtureSeed, id: unknown) => {
    const row = draft.data[collection].find((r) => r.id === id)
    if (!row || ('moderation' in row && row.moderation !== 'published'))
      return false
    const kind = Object.keys(kinds).find((name) => kinds[name] === collection)
    return !draft.moderation.subjects.some(
      (s) => s.ref.kind === kind && s.ref.id === id && s.state !== 'published',
    )
  }
  const resolves = (
    value: unknown,
    collection: keyof FixtureSeed,
    selfId: string,
  ): boolean => {
    if (Array.isArray(value))
      return value.every((item) => resolves(item, collection, selfId))
    if (!value || typeof value !== 'object') return true
    const row = value as Record<string, unknown>
    if (
      typeof row.kind === 'string' &&
      kinds[row.kind] &&
      !('createdAt' in row) &&
      typeof row.id === 'string' &&
      !referenceExists(kinds[row.kind]!, row.id)
    )
      return false
    return Object.entries(row).every(([field, child]) => {
      if (
        child != null &&
        references[field] &&
        !(references[field] === collection && child === selfId) &&
        !referenceExists(references[field]!, child)
      )
        return false
      if (
        field === 'contributionId' &&
        ![...draft.data.participations, ...draft.data.namingAwards].some(
          (r) => r.id === child,
        )
      )
        return false
      return resolves(child, collection, selfId)
    })
  }
  const order: (keyof FixtureSeed)[] = [
    'areas',
    'fundraisers',
    'missions',
    'posts',
    'sightings',
    'participations',
    'contributions',
    'kibbleEntries',
    'comments',
    'rsvps',
  ]
  for (const key of order) {
    const current = draft.data[key] as { id: string }[]
    for (const row of baseline[key]) {
      const number = Number(row.id.match(/-(\d+)$/)?.[1])
      const fresh =
        (row.id.startsWith('sample-') &&
          !row.id.startsWith('sample-naming-')) ||
        (limits[key] !== undefined && number > limits[key]!) ||
        (key === 'areas' && row.id !== 'area-davao-poblacion')
      if (
        fresh &&
        !current.some((item) => item.id === row.id) &&
        resolves(row, key, row.id)
      )
        current.push(structuredClone(row))
    }
  }
  // Only replace known original placeholder copy; edited identities and moderation remain intact.
  for (const user of draft.data.users) {
    const original = baseline.users.find((u) => u.id === user.id)
    if (!original || user.provenance.kind !== 'sample') continue
    if (user.createdAt === DEMO_NOW) user.createdAt = original.createdAt
    if (user.bio === 'Illustrative community helper profile') {
      user.bio = original.bio
      user.avatar ??= original.avatar
      if (user.bannerId === 'meadow') user.bannerId = original.bannerId
    }
  }
  for (const animal of draft.data.animals) {
    const original = baseline.animals.find((a) => a.id === animal.id)
    if (
      !original ||
      animal.version !== 1 ||
      animal.description !==
        `Meet ${animal.name}, an illustrative animal in the PawTrail demo.`
    )
      continue
    Object.assign(animal, {
      description: original.description,
      appearance: original.appearance,
      personality: original.personality,
      behavior: original.behavior,
      needs: original.needs,
      photo: animal.photo ?? original.photo,
      bannerId: original.bannerId,
      location: original.location,
    })
  }
  for (const mission of draft.data.missions) {
    const original = baseline.missions.find((m) => m.id === mission.id)
    if (
      original &&
      mission.version === 1 &&
      /^Sample community help \d+$/.test(mission.title)
    )
      Object.assign(mission, {
        title: original.title,
        description: original.description,
        evidenceRequirements: original.evidenceRequirements,
        hordeId: original.hordeId,
        location: original.location,
      })
  }
  for (const campaign of draft.data.fundraisers) {
    const original = baseline.fundraisers.find((c) => c.id === campaign.id)
    if (
      original &&
      campaign.version === 1 &&
      /^Sample animal care fund \d+$/.test(campaign.title)
    )
      Object.assign(campaign, {
        title: original.title,
        story: original.story,
        category: original.category,
        hordeId: original.hordeId,
        photo: campaign.photo ?? original.photo,
        location: original.location,
        budget: original.budget,
        timeline: original.timeline,
      })
  }
  for (const horde of draft.data.hordes) {
    const original = baseline.hordes.find((h) => h.id === horde.id)
    if (
      original &&
      horde.description === 'Illustrative neighborhood animal group'
    )
      Object.assign(horde, {
        name: original.name,
        description: original.description,
        photo: original.photo,
        location: original.location,
      })
  }
  for (const shelter of draft.data.shelters) {
    const original = baseline.shelters.find((s) => s.id === shelter.id)
    if (original && /^Sample Davao Shelter \d+$/.test(shelter.name))
      Object.assign(shelter, {
        name: original.name,
        location: original.location,
      })
  }
  for (const event of draft.data.events) {
    const original = baseline.events.find((e) => e.id === event.id)
    if (
      original &&
      event.version === 1 &&
      /^Sample care gathering \d+$/.test(event.title)
    )
      Object.assign(event, {
        title: original.title,
        description: original.description,
        venue: original.venue,
      })
  }
}

/** Fictional demo setup, never called for the live backend or for user-created identities. */
export function applySamplePack(draft: DemoDraft) {
  const workflow = (draft.workflow ??= emptyWorkflow())
  if (workflow.samplePackVersion >= SAMPLE_PACK_VERSION) return
  workflow.samplePackVersion = SAMPLE_PACK_VERSION
  const members = draft.data.users.filter(
    (u) => /^user-\d+$/.test(u.id) && u.provenance.kind === 'sample',
  )
  if (!members.length) return
  const store = achievementStore(draft)
  const reviewer = members.find(
    (u) => u.id === 'user-20' && u.roles.includes('moderator'),
  )
  const eligibleAnimal = (id: string) =>
    draft.data.animals.some(
      (a) => a.id === id && a.moderation === 'published',
    ) &&
    !draft.moderation.subjects.some(
      (s) =>
        s.ref.kind === 'animal' && s.ref.id === id && s.state !== 'published',
    )

  for (const [index, member] of members.entries()) {
    const animal = draft.data.animals.find(
      (a) =>
        a.id === `animal-${((Number(member.id.slice(5)) + 5) % 15) + 1}` &&
        a.adoptable &&
        eligibleAnimal(a.id),
    )
    if (
      animal?.shelterId &&
      !workflow.applications.some((a) => a.applicantId === member.id)
    ) {
      const statuses = [
        'submitted',
        'needs_information',
        'draft',
        'approved',
        'rejected',
        'withdrawn',
      ] as const
      const status = statuses[index % statuses.length]!
      const submitted = samplePast(5, 9)
      const reviewed = samplePast(2, 14)
      const organizer = draft.data.users.find(
        (u) => u.shelterIds.includes(animal.shelterId!) && u.id !== member.id,
      )
      if (organizer)
        workflow.applications.push(
          adoptionApplicationSchema.parse({
            ...base(`sample-application-${member.id}`),
            createdAt: submitted,
            animalId: animal.id,
            applicantId: member.id,
            shelterId: animal.shelterId,
            status,
            version: status === 'draft' || status === 'submitted' ? 1 : 2,
            answers: {
              fullName: member.displayName,
              email: member.email,
              phone: 'Fictional demo contact — not a real number',
              livingSituation:
                'Sample household with a quiet indoor resting space and a planned daily care routine.',
              careExperience:
                'Fictional experience helping with supervised feeding and shelter visits.',
              motivation:
                'A sample application demonstrating thoughtful preparation and a patient introduction.',
              agreement: true,
            },
            reviewMessage: [
              'approved',
              'rejected',
              'needs_information',
            ].includes(status)
              ? 'Illustrative application review only; this does not confirm a real adoption.'
              : null,
            history: [
              {
                status: 'draft',
                message: 'Sample application prepared.',
                actorId: member.id,
                createdAt: submitted,
                version: 1,
              },
              ...(status === 'draft'
                ? []
                : [
                    {
                      status: 'submitted',
                      message:
                        'Sample application submitted for shelter review.',
                      actorId: member.id,
                      createdAt: submitted,
                      version: 1,
                    },
                  ]),
              ...(['draft', 'submitted'].includes(status)
                ? []
                : [
                    {
                      status,
                      message:
                        status === 'withdrawn'
                          ? 'Sample applicant withdrew this application.'
                          : 'Fictional responsible-shelter review.',
                      actorId:
                        status === 'withdrawn' ? member.id : organizer.id,
                      createdAt: reviewed,
                      version: 2,
                    },
                  ]),
            ],
          }),
        )
    }
    if (!workflow.preferences.some((p) => p.actorId === member.id))
      workflow.preferences.push({
        actorId: member.id,
        values: {
          species: index % 2 ? 'cat' : 'dog',
          homeType: index % 3 ? 'house' : 'apartment',
          activity: index % 2 ? 'low' : 'medium',
          experience: index % 4 ? 'experienced' : 'novice',
          otherPets: [],
          ...(member.location ? { originAreaId: member.location.areaId } : {}),
          maxDistanceKm: 20,
        },
      })
    const primary = workflow.applications.find(
      (a) => a.id === `sample-application-${member.id}`,
    )
    const alternate = draft.data.animals.find(
      (a) =>
        a.id !== primary?.animalId &&
        a.adoptable &&
        eligibleAnimal(a.id) &&
        a.shelterId &&
        draft.data.users.some(
          (u) => u.shelterIds.includes(a.shelterId!) && u.id !== member.id,
        ),
    )
    if (
      primary &&
      alternate?.shelterId &&
      !workflow.applications.some(
        (a) => a.id === `sample-application-extra-${member.id}`,
      )
    ) {
      const status = primary.status === 'draft' ? 'submitted' : 'draft'
      workflow.applications.push(
        adoptionApplicationSchema.parse({
          ...primary,
          id: `sample-application-extra-${member.id}`,
          animalId: alternate.id,
          shelterId: alternate.shelterId,
          status,
          createdAt: samplePast(3, 9),
          version: 1,
          reviewMessage: null,
          history: [
            {
              status,
              message:
                status === 'draft'
                  ? 'Fictional draft ready to continue.'
                  : 'Fictional application waiting for independent shelter review.',
              actorId: member.id,
              createdAt: samplePast(3, 9),
              version: 1,
            },
          ],
        }),
      )
    }
    if (animal && !workflow.campaignDrafts.some((c) => c.actorId === member.id))
      workflow.campaignDrafts.push({
        id: `sample-campaign-draft-${member.id}`,
        actorId: member.id,
        createdAt: samplePast(2, 10),
        version: 1,
        values: {
          title: `Sample draft: a care kit for ${animal.name}`,
          story:
            'Fictional unpublished campaign draft for trying the organizer workflow. No real funds are collected.',
          category: 'food',
          currency: 'PHP',
          goalMinor: 150000,
          urgency: 'normal',
          animalId: animal.id,
          shelterId: animal.shelterId,
          hordeId: animal.hordeId,
          location: animal.location,
          mediaIds: [],
          privateEvidenceIds: [],
        },
      })
    for (const candidate of draft.data.animals
      .filter((a) => a.adoptable && eligibleAnimal(a.id))
      .slice(index % 10, (index % 10) + 3)) {
      if (
        !workflow.interests.some(
          (r) => r.actorId === member.id && r.animalId === candidate.id,
        )
      )
        workflow.interests.push({
          actorId: member.id,
          animalId: candidate.id,
          createdAt: samplePast(4, 12),
        })
    }
    const activityCount = index % 4 === 0 ? 4 : 7
    for (let day = 0; day < activityCount; day++) {
      const id = `sample-daily-${member.id}-${day}`
      if (!store.activities.some((a) => a.id === id))
        store.activities.push({
          id,
          userId: member.id,
          kind: 'daily',
          ref: null,
          createdAt: samplePast(day),
        })
    }
    const discoveries = draft.data.animals
      .filter((a) => eligibleAnimal(a.id))
      .slice(0, index % 3 === 0 ? 6 : 10)
    for (const [offset, discovered] of discoveries.entries()) {
      const id = `sample-discovery-${member.id}-${discovered.id}`
      if (!store.activities.some((a) => a.id === id))
        store.activities.push({
          id,
          userId: member.id,
          kind: 'discovery',
          ref: { kind: 'animal', id: discovered.id },
          createdAt: samplePast(2, offset),
        })
    }
    for (const shared of discoveries.slice(0, index % 3 === 0 ? 3 : 5)) {
      const id = `sample-share-${member.id}-${shared.id}`
      if (!store.activities.some((a) => a.id === id))
        store.activities.push({
          id,
          userId: member.id,
          kind: 'share',
          ref: { kind: 'animal', id: shared.id },
          createdAt: samplePast(1, 12),
        })
    }
    if (
      reviewer &&
      reviewer.id !== member.id &&
      animal &&
      Date.parse(member.createdAt) < Date.parse(samplePast(12))
    ) {
      const proofs =
        index % 3 === 0
          ? ['care-companion', 'feeding-hero']
          : index % 3 === 1
            ? ['hydration-helper', 'rescue-ally']
            : ['care-companion', 'feeding-hero', 'rescue-ally']
      for (const badgeId of proofs) {
        const badge = achievementCatalog.find((b) => b.id === badgeId)!
        for (let visit = 0; visit < badge.target; visit++) {
          const id = `sample-proof-${member.id}-${badgeId}-${visit}`
          const occurredAt = samplePast(visit + 2, 10)
          if (!store.proofs.some((p) => p.id === id))
            store.proofs.push({
              id,
              userId: member.id,
              badgeId,
              ref: { kind: 'animal', id: animal.id },
              occurredAt,
              details:
                'Fictional sample care evidence for demonstration. No real feeding, hydration, rescue or medical work is claimed.',
              mediaIds: [],
              createdAt: occurredAt,
              updatedAt: samplePast(1, 18),
              dedupKey: `${member.id}:${badgeId}:animal:${animal.id}:${manilaDay(occurredAt)}`,
              state: 'approved',
              reviewerId: reviewer.id,
              reason:
                'Illustrative independent sample review, not a real-world verification.',
              version: 2,
            })
        }
      }
    }
    const nearby = draft.data.animals
      .filter((a) => eligibleAnimal(a.id))
      .slice(index % 10, (index % 10) + 3)
    for (const a of nearby) {
      if (
        !draft.community.follows.some(
          (f) =>
            f.actorId === member.id &&
            f.ref.kind === 'animal' &&
            f.ref.id === a.id,
        )
      )
        draft.community.follows.push({
          actorId: member.id,
          ref: { kind: 'animal', id: a.id },
          createdAt: samplePast(6),
        })
      if (
        !draft.savedAnimals.some(
          (s) => s.actorId === member.id && s.animalId === a.id,
        )
      )
        draft.savedAnimals.push({ actorId: member.id, animalId: a.id })
    }
    for (const other of members
      .filter((u) => u.id !== member.id && u.settings.discoverable)
      .slice(index % 10, (index % 10) + 2)) {
      if (
        !draft.community.follows.some(
          (f) =>
            f.actorId === member.id &&
            f.ref.kind === 'user' &&
            f.ref.id === other.id,
        )
      )
        draft.community.follows.push({
          actorId: member.id,
          ref: { kind: 'user', id: other.id },
          createdAt: samplePast(5),
        })
    }
    for (const post of draft.data.posts
      .filter((p) => p.moderation === 'published' && p.authorId !== member.id)
      .slice(index * 2, index * 2 + 2)) {
      if (
        !draft.community.saved.some(
          (s) => s.actorId === member.id && s.postId === post.id,
        )
      )
        draft.community.saved.push({ actorId: member.id, postId: post.id })
    }
  }
  for (const [index, post] of draft.data.posts.entries()) {
    if (post.provenance.kind !== 'sample' || post.moderation !== 'published')
      continue
    const fans = members
      .filter((u) => u.id !== post.authorId)
      .slice(index % 10, (index % 10) + 3 + (index % 5))
    for (const fan of fans)
      if (
        !draft.community.reactions.some(
          (r) => r.actorId === fan.id && r.postId === post.id,
        )
      )
        draft.community.reactions.push({ actorId: fan.id, postId: post.id })
    post.reactionCount = draft.community.reactions.filter(
      (r) => r.postId === post.id,
    ).length
    post.commentCount = draft.data.comments.filter(
      (c) =>
        c.ref.kind === 'post' &&
        c.ref.id === post.id &&
        c.moderation === 'published',
    ).length
  }
  for (const animal of draft.data.animals) {
    if (animal.provenance.kind !== 'sample') continue
    animal.postIds = [
      ...new Set([
        ...animal.postIds,
        ...draft.data.posts
          .filter(
            (p) =>
              p.provenance.kind === 'sample' &&
              p.refs.some((r) => r.kind === 'animal' && r.id === animal.id),
          )
          .map((p) => p.id),
      ]),
    ]
    animal.sightingIds = [
      ...new Set([
        ...animal.sightingIds,
        ...draft.data.sightings
          .filter((s) => s.animalId === animal.id)
          .map((s) => s.id),
      ]),
    ]
    animal.missionIds = [
      ...new Set([
        ...animal.missionIds,
        ...draft.data.missions
          .filter((m) => m.animalId === animal.id)
          .map((m) => m.id),
      ]),
    ]
    animal.fundraiserIds = [
      ...new Set([
        ...animal.fundraiserIds,
        ...draft.data.fundraisers
          .filter((c) => c.animalId === animal.id)
          .map((c) => c.id),
      ]),
    ]
    const approvedMissionIds = new Set(
      draft.data.missions
        .filter((m) => m.animalId === animal.id)
        .map((m) => m.id),
    )
    animal.helperIds = [
      ...new Set([
        ...animal.helperIds,
        ...draft.data.participations
          .filter(
            (p) =>
              approvedMissionIds.has(p.missionId) &&
              p.state === 'approved' &&
              !!p.reviewerId &&
              p.reviewerId !== p.volunteerId,
          )
          .map((p) => p.volunteerId),
      ]),
    ]
  }
  for (const member of members)
    member.contributionCount =
      draft.data.sightings.filter(
        (s) => s.reporterId === member.id && s.moderation === 'published',
      ).length +
      draft.data.posts.filter(
        (p) => p.authorId === member.id && p.moderation === 'published',
      ).length +
      draft.data.participations.filter(
        (p) =>
          p.volunteerId === member.id &&
          p.state === 'approved' &&
          p.reviewerId !== member.id,
      ).length
  // Award only eligible seeded badges. Existing claims, including revocations, are never replaced.
  const award = (userId: string, badgeId: string) => {
    const badge = achievementCatalog.find((b) => b.id === badgeId)!
    if (store.claims.some((c) => c.userId === userId && c.badgeId === badgeId))
      return
    const id = `sample-achievement-${userId}-${badgeId}`
    store.claims.push({
      id,
      userId,
      badgeId,
      state: 'active',
      claimedAt: DEMO_NOW,
      rewardKibble: badge.rewardKibble,
      version: 1,
    })
    if (!draft.data.kibbleEntries.some((e) => e.contributionId === id))
      draft.data.kibbleEntries.push({
        ...base(`sample-reward-${userId}-${badgeId}`),
        userId,
        amount: badge.rewardKibble,
        reason: 'achievement_awarded',
        contributionId: id,
        description: `Sample achievement unlocked: ${badge.title}. Non-cash reward.`,
      })
  }
  for (let pass = 0; pass < 3; pass++) {
    const ready = members.flatMap((m) =>
      achievementOverview(draft, m.id, DEMO_NOW)
        .items.filter((p) => p.state === 'ready' && p.id !== 'top-pawpal')
        .map((p) => ({ userId: m.id, badgeId: p.id })),
    )
    for (const item of ready) award(item.userId, item.badgeId)
    if (!ready.length) break
  }
  for (const member of members) {
    if (
      achievementOverview(draft, member.id, DEMO_NOW).items.some(
        (p) => p.id === 'top-pawpal' && p.state === 'ready',
      )
    )
      award(member.id, 'top-pawpal')
    if (!store.showcases.some((s) => s.userId === member.id)) {
      const unlocked = achievementOverview(
        draft,
        member.id,
        DEMO_NOW,
      ).items.filter((p) => p.state === 'unlocked')
      const preferred = [
        'true-pawpal',
        'paw-legacy',
        'mission-complete',
        'care-companion',
        'feeding-hero',
        'hydration-helper',
        'rescue-ally',
        'community-storyteller',
        'keen-spotter',
        'first-help',
      ]
      unlocked.sort(
        (a, b) =>
          (preferred.indexOf(a.id) < 0 ? 99 : preferred.indexOf(a.id)) -
          (preferred.indexOf(b.id) < 0 ? 99 : preferred.indexOf(b.id)),
      )
      store.showcases.push({
        userId: member.id,
        badgeIds: unlocked.slice(0, 6).map((p) => p.id),
        showMastery: true,
      })
    }
  }
  // Keep relational pages populated when an older session stored a whole collection overlay.
  for (const horde of draft.data.hordes) {
    const missionIds = new Set(
      draft.data.missions
        .filter((m) => m.hordeId === horde.id)
        .map((m) => m.id),
    )
    horde.contributorIds = [
      ...new Set([
        ...horde.contributorIds,
        ...draft.data.sightings
          .filter((s) => s.hordeId === horde.id && s.moderation === 'published')
          .map((s) => s.reporterId),
        ...draft.data.participations
          .filter(
            (p) =>
              missionIds.has(p.missionId) &&
              p.state === 'approved' &&
              !!p.reviewerId &&
              p.reviewerId !== p.volunteerId,
          )
          .map((p) => p.volunteerId),
      ]),
    ]
    horde.postIds = [
      ...new Set([
        ...horde.postIds,
        ...draft.data.posts
          .filter((p) =>
            p.refs.some((r) => r.kind === 'horde' && r.id === horde.id),
          )
          .map((p) => p.id),
      ]),
    ]
    horde.sightingIds = [
      ...new Set([
        ...horde.sightingIds,
        ...draft.data.sightings
          .filter((s) => s.hordeId === horde.id)
          .map((s) => s.id),
      ]),
    ]
    horde.missionIds = [
      ...new Set([
        ...horde.missionIds,
        ...draft.data.missions
          .filter((m) => m.hordeId === horde.id)
          .map((m) => m.id),
      ]),
    ]
    horde.fundraiserIds = [
      ...new Set([
        ...horde.fundraiserIds,
        ...draft.data.fundraisers
          .filter((c) => c.hordeId === horde.id)
          .map((c) => c.id),
      ]),
    ]
  }
  for (const shelter of draft.data.shelters) {
    shelter.missionIds = [
      ...new Set([
        ...shelter.missionIds,
        ...draft.data.missions
          .filter((m) => m.shelterId === shelter.id)
          .map((m) => m.id),
      ]),
    ]
    shelter.fundraiserIds = [
      ...new Set([
        ...shelter.fundraiserIds,
        ...draft.data.fundraisers
          .filter((c) => c.shelterId === shelter.id)
          .map((c) => c.id),
      ]),
    ]
  }
}
