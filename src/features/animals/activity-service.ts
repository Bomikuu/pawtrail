import 'server-only'
import { checkCancelled } from '@/lib/api/errors'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import {
  context,
  found,
  filterScope,
  orderedPage,
} from '@/lib/server/workflow-context'
import { publicSnapshot } from '@/features/moderation/service'
import { projectPost } from '@/features/community/service'
import { topTenRecognitionRanks } from '@/features/kibble/leaderboard-service'
import { personAvatar } from '@/features/users/avatar-presets'
import { demoClock } from '@/lib/api/clock'
import {
  animalActivityFiltersSchema,
  animalActivityPageSchema,
  type AnimalActivity,
  type AnimalActivityPage,
} from './activity-schemas'
export function installAnimalActivity(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read } = context(data, repository)
  api.animals.activity = (slug, input, options) => {
    checkCancelled(options?.signal)
    const q = animalActivityFiltersSchema.parse(input)
    return read((d) => {
      const visible = publicSnapshot(d)
      const animal = found(
        visible.animals.find((a) => a.slug === slug || a.id === slug),
      )
      const path = '/pets/' + encodeURIComponent(animal.slug)
      const ranks = topTenRecognitionRanks(d, demoClock.now().toISOString())
      const people = visible.users.filter(
        (u) => u.settings.discoverable && u.settings.showContributions,
      )
      const identity = (id: string | null) => {
        const u = people.find((u) => u.id === id)
        return {
          userId: u?.id ?? null,
          displayName: u?.displayName ?? 'Community member',
          username: u?.username ?? null,
          avatar: u ? personAvatar(u.avatar, u.id) : null,
          leaderboardRank: u ? (ranks.get(u.id) ?? null) : null,
        }
      }
      const approvedImages = (images: AnimalActivity['media']) =>
        images.filter((image) => {
          const media = d.media.find((media) => media.asset.id === image.id)
          return !media || (media.approved && media.purpose === 'public_image')
        })
      const posts = visible.posts
        .filter((p) =>
          p.refs.some((ref) => ref.kind === 'animal' && ref.id === animal.id),
        )
        .map((p) => projectPost(d, p, ranks))
      const sightings = visible.sightings
        .filter((s) => s.animalId === animal.id)
        .sort(
          (a, b) =>
            Date.parse(b.observedAt) - Date.parse(a.observedAt) ||
            a.id.localeCompare(b.id),
        )
      const missions = visible.missions.filter(
        (m) => m.animalId === animal.id || animal.missionIds.includes(m.id),
      )
      const campaigns = visible.fundraisers.filter(
        (c) =>
          (c.animalId === animal.id || animal.fundraiserIds.includes(c.id)) &&
          ['active', 'completed', 'closed'].includes(c.state),
      )
      const rows: AnimalActivity[] = []
      const now = demoClock.now().getTime()
      const isOpenMission = (mission: (typeof missions)[number]) =>
        mission.state === 'open' && Date.parse(mission.deadline) > now
      for (const p of posts) {
        // This animal is the first tag in its own feed; authorship always remains with the person.
        p.linkedEntities.sort(
          (a, b) =>
            Number(b.ref.kind === 'animal' && b.ref.id === animal.id) -
            Number(a.ref.kind === 'animal' && a.ref.id === animal.id),
        )
        rows.push({
          id: 'post:' + p.id,
          kind: 'post',
          createdAt: p.createdAt,
          priority: ['help', 'sighting', 'feeding', 'rescue'].includes(p.type)
            ? 1
            : 3,
          label: 'Tagged community story',
          title: p.author.displayName + ' shared a story about ' + animal.name,
          text: p.text,
          href: '/community/' + encodeURIComponent(p.id),
          author: identity(p.authorId),
          media: approvedImages(p.media),
          location: null,
          post: p,
          provenance: p.provenance,
        })
      }
      for (const s of sightings)
        rows.push({
          id: 'sighting:' + s.id,
          kind: 'sighting',
          createdAt: s.observedAt,
          priority: 1,
          label: 'Published sighting',
          title: 'Spotted ' + animal.name,
          text: s.observation,
          href: path + '?tab=location#sightings',
          author: identity(s.reporterId),
          media: approvedImages(s.media),
          location: s.location,
          post: null,
          provenance: s.provenance,
        })
      for (const m of missions)
        rows.push({
          id: 'mission:' + m.id,
          kind: 'mission',
          createdAt: m.createdAt,
          priority: isOpenMission(m) ? 0 : 2,
          label: isOpenMission(m)
            ? 'Open help mission'
            : m.state === 'open'
              ? 'Mission deadline passed'
              : 'Closed help mission',
          title: m.title,
          text: m.description,
          href: '/missions/' + encodeURIComponent(m.slug),
          author: identity(m.organizerId),
          media: [],
          location: m.location,
          post: null,
          provenance: m.provenance,
        })
      for (const c of campaigns)
        rows.push({
          id: 'fundraiser:' + c.id,
          kind: 'fundraiser',
          createdAt: c.createdAt,
          priority: c.state === 'active' ? 0 : 2,
          label:
            c.state === 'active' ? 'Active fundraiser' : 'Fundraiser update',
          title: c.title,
          text: c.story,
          href: '/fundraisers/' + encodeURIComponent(c.slug),
          author: identity(c.organizerId),
          media: approvedImages(c.photo ? [c.photo] : []),
          location: c.location,
          post: null,
          provenance: c.provenance,
        })
      for (const participation of visible.participations.filter(
        (p) =>
          p.state === 'approved' &&
          !!p.reviewerId &&
          p.reviewerId !== p.volunteerId &&
          missions.some((m) => m.id === p.missionId),
      )) {
        const mission = missions.find((m) => m.id === participation.missionId)!
        const approvedAt =
          participation.reviewedAt ??
          d.data.kibbleEntries.find(
            (entry) =>
              entry.contributionId === participation.id &&
              entry.reason === 'mission_approved',
          )?.createdAt ??
          participation.createdAt
        rows.push({
          id: 'care:' + participation.id,
          kind: 'care',
          createdAt: approvedAt,
          priority: 1,
          label: 'Independently approved help',
          title: 'Help completed: ' + mission.title,
          text: 'A community member completed this help mission with independently reviewed evidence. Private evidence stays private.',
          href: '/missions/' + encodeURIComponent(mission.slug),
          author: identity(participation.volunteerId),
          media: [],
          location: mission.location,
          post: null,
          provenance: participation.provenance,
        })
      }
      const helpers = new Set(
        animal.helperIds.filter((id) => people.some((u) => u.id === id)),
      )
      for (const p of visible.participations.filter(
        (p) =>
          p.state === 'approved' &&
          !!p.reviewerId &&
          p.reviewerId !== p.volunteerId &&
          missions.some((m) => m.id === p.missionId) &&
          people.some((u) => u.id === p.volunteerId),
      ))
        helpers.add(p.volunteerId)
      for (const c of visible.contributions.filter(
        (c) =>
          !c.anonymous &&
          campaigns.some((campaign) => campaign.id === c.campaignId) &&
          people.some((u) => u.id === c.contributorId),
      ))
        helpers.add(c.contributorId)
      const photos: AnimalActivityPage['photos'] = []
      const addPhotos = (
        images: AnimalActivity['media'],
        href: string,
        credit: string,
      ) => {
        for (const image of approvedImages(images))
          if (!photos.some((p) => p.image.id === image.id))
            photos.push({ image, href, credit })
      }
      addPhotos(
        [...(animal.photo ? [animal.photo] : []), ...animal.gallery],
        path + '?tab=about',
        'Profile photograph',
      )
      for (const s of sightings)
        addPhotos(
          s.media,
          path + '?tab=location#sightings',
          identity(s.reporterId).displayName + ' · sighting',
        )
      for (const p of posts)
        addPhotos(
          p.media,
          '/community/' + encodeURIComponent(p.id),
          p.author.displayName + ' · tagged story',
        )
      const needle = q.q?.trim().toLowerCase()
      const selected = rows
        .filter(
          (row) =>
            !needle ||
            (row.title + ' ' + row.text + ' ' + row.author.displayName)
              .toLowerCase()
              .includes(needle),
        )
        .filter(
          (row) =>
            q.kind === 'all' ||
            (q.kind === 'sightings'
              ? row.kind === 'sighting'
              : q.kind === 'tagged'
                ? row.kind === 'post'
                : row.kind === 'mission' ||
                  row.kind === 'care' ||
                  row.kind === 'fundraiser' ||
                  (row.kind === 'post' &&
                    !!row.post &&
                    ['help', 'feeding', 'rescue'].includes(row.post.type))),
        )
      selected.sort(
        (a, b) =>
          (q.sort === 'priority' ? a.priority - b.priority : 0) ||
          Date.parse(b.createdAt) - Date.parse(a.createdAt) ||
          a.id.localeCompare(b.id),
      )
      return animalActivityPageSchema.parse({
        ...orderedPage(
          selected,
          q,
          `animal-activity:${animal.id}:${d.auth.actorId ?? 'guest'}:${filterScope(q)}`,
        ),
        summary: {
          taggedPosts: posts.length,
          sightings: sightings.length,
          helpers: helpers.size,
          followers: new Set(
            d.community.follows
              .filter(
                (edge) =>
                  edge.ref.kind === 'animal' &&
                  edge.ref.id === animal.id &&
                  people.some((u) => u.id === edge.actorId),
              )
              .map((edge) => edge.actorId),
          ).size,
          openMissions: missions.filter(isOpenMission).length,
          activeFundraisers: campaigns.filter((c) => c.state === 'active')
            .length,
        },
        photos,
        latestSighting: sightings[0]
          ? {
              observedAt: sightings[0].observedAt,
              location: sightings[0].location,
            }
          : null,
      })
    })
  }
}
