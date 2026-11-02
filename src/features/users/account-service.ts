import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import {
  context,
  page,
  areaLocation,
  found,
  attachments,
  provenance,
  workflows,
  orderedPage,
  fail,
  registerSubject,
} from '@/lib/server/workflow-context'
import { currentUser } from './service'
import {
  privateUserSchema,
  profileInputSchema,
  privacySettingsSchema,
} from './schemas'
import {
  publicSnapshot,
  reconcilePublicMedia,
} from '@/features/moderation/service'
import { avatarPresetImage, personAvatar } from './avatar-presets'
import { listQuerySchema } from '@/lib/api/schemas'
import { leaderboardEntrySchema } from '@/features/kibble/schemas'
import { demoClock } from '@/lib/api/clock'
import {
  shelterProfileSchema,
  shelterSummarySchema,
} from '@/features/shelters/schemas'

export function installAccount(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.shelters.list = (input) => {
    const q = listQuerySchema.parse(input)
    return read((d) =>
      page(
        publicSnapshot(d).shelters.map((s) => shelterSummarySchema.parse(s)),
        q,
        'shelters',
      ),
    )
  }
  api.shelters.get = (slug) =>
    read((d) =>
      shelterProfileSchema.parse(
        found(
          publicSnapshot(d).shelters.find(
            (s) => s.slug === slug || s.id === slug,
          ),
        ),
      ),
    )
  api.users.me = () =>
    read((d) => {
      const user = currentUser(d)
      return privateUserSchema.parse({
        ...user,
        avatar: personAvatar(user.avatar, user.id),
      })
    })
  api.users.settings = () =>
    read((d) => structuredClone(currentUser(d).settings))
  api.users.updateSettings = (input, options) => {
    const p = privacySettingsSchema.parse(input)
    return write('users.settings', p, options, (d, u) => {
      u.settings = p
      return p
    })
  }
  api.users.update = (input, options) => {
    const p = profileInputSchema.parse(input)
    return write('users.update', p, options, (d, u) => {
      u.displayName = p.displayName
      u.bio = p.bio
      u.location = p.areaId ? areaLocation(d, p.areaId) : null
      if (p.avatarId !== u.avatar?.id) {
        const preset = p.avatarId ? avatarPresetImage(p.avatarId) : null
        if (p.avatarId?.startsWith('pawtrail-avatar-') && !preset)
          fail('Choose an avatar from the available collection.')
        if (preset || !p.avatarId) {
          const previous = u.avatar?.id
          const subject = d.moderation.subjects.find(
            (s) => s.ref.kind === 'user' && s.ref.id === u.id,
          )
          const pendingPhotos = subject?.photoIds ?? []
          u.avatar = preset ?? personAvatar(null, u.id)
          if (subject) {
            // Withdraw an obsolete avatar-photo review. Keep removed/rejected profile decisions intact.
            if (subject.state === 'pending' && pendingPhotos.length)
              subject.state = 'published'
            subject.photoIds = []
            subject.version++
          }
          reconcilePublicMedia(d, [
            ...pendingPhotos,
            ...(previous ? [previous] : []),
          ])
        } else {
          registerSubject(
            d,
            { kind: 'user', id: u.id },
            [u.id],
            [],
            [p.avatarId],
            'pending',
            (d.moderation.subjects.find(
              (s) => s.ref.kind === 'user' && s.ref.id === u.id,
            )?.version ?? 0) + 1,
          )
          // Arbitrary uploads still need publication review. Curated preset IDs never accept submitted URLs.
          u.avatar = null
        }
      }
      return privateUserSchema.parse({
        ...u,
        avatar: personAvatar(u.avatar, u.id),
      })
    })
  }
  api.users.summary = () =>
    read((d) => {
      const u = currentUser(d)
      return {
        animals: d.data.animals.filter((a) => a.ownerId === u.id).length,
        sightings: d.data.sightings.filter((s) => s.reporterId === u.id).length,
        applications: workflows(d).applications.filter(
          (a) => a.applicantId === u.id && a.status !== 'draft',
        ).length,
        unreadNotifications: d.moderation.notifications.filter(
          (n) => n.recipientId === u.id && !n.readAt,
        ).length,
        kibbleBalance: d.data.kibbleEntries
          .filter((e) => e.userId === u.id)
          .reduce((n, e) => n + e.amount, 0),
      }
    })
  api.kibble.wallet = () =>
    read((d) => ({
      balance: d.data.kibbleEntries
        .filter((e) => e.userId === currentUser(d).id)
        .reduce((n, e) => n + e.amount, 0),
      nonCash: true,
      provenance,
    }))
  api.kibble.transactions = (input) => {
    const q = listQuerySchema.parse(input)
    return read((d) =>
      page(
        d.data.kibbleEntries.filter((e) => e.userId === currentUser(d).id),
        q,
        `wallet:${d.auth.actorId}`,
      ),
    )
  }
  api.kibble.leaderboard = (period, input) => {
    const q = listQuerySchema.parse(input)
    return read((d) => {
      const month = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
      }).format(demoClock.now())
      const rows = publicSnapshot(d)
        .users.filter((u) => u.settings.showContributions)
        .map((u) => ({
          id: u.id,
          createdAt: u.createdAt,
          userId: u.id,
          username: u.username,
          displayName: u.displayName,
          kibble: d.data.kibbleEntries
            .filter(
              (e) =>
                e.userId === u.id &&
                (period === 'all' ||
                  new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Manila',
                    year: 'numeric',
                    month: '2-digit',
                  }).format(new Date(e.createdAt)) === month),
            )
            .reduce((n, e) => n + e.amount, 0),
          rank: 1,
          provenance: u.provenance,
        }))
        .sort(
          (a, b) =>
            b.kibble - a.kibble ||
            d.data.participations.filter(
              (p) => p.volunteerId === b.userId && p.state === 'approved',
            ).length -
              d.data.participations.filter(
                (p) => p.volunteerId === a.userId && p.state === 'approved',
              ).length ||
            a.userId.localeCompare(b.userId),
        )
      rows.forEach((r, i) => {
        r.rank = i + 1
      })
      const result = orderedPage(
        rows.filter(
          (r) =>
            !q.q || r.displayName.toLowerCase().includes(q.q.toLowerCase()),
        ),
        q,
        `leaderboard:${period}:${q.q ?? ''}`,
      )
      return {
        ...result,
        items: result.items.map((r) => leaderboardEntrySchema.parse(r)),
      }
    })
  }
  api.shelters.dashboard = (id) =>
    read((d) => {
      const u = currentUser(d)
      if (!u.roles.includes('shelter_staff') || !u.shelterIds.includes(id))
        fail('Responsible shelter staff access is required', 403)
      const apps = workflows(d).applications.filter((a) => a.shelterId === id)
      const missions = d.data.missions.filter((m) => m.shelterId === id)
      const participants = d.data.participations.filter((p) =>
        missions.some((m) => m.id === p.missionId),
      )
      return {
        shelterId: id,
        pendingApplications: apps.filter((a) =>
          ['submitted', 'needs_information'].includes(a.status),
        ).length,
        pendingEvidence: participants.filter((p) => p.state === 'submitted')
          .length,
        animalIds: d.data.animals
          .filter((a) => a.shelterId === id)
          .map((a) => a.id),
        fundraiserIds: d.data.fundraisers
          .filter((f) => f.shelterId === id)
          .map((f) => f.id),
        missionIds: missions.map((m) => m.id),
        eventIds: d.data.events
          .filter((e) => e.shelterId === id)
          .map((e) => e.id),
        volunteerIds: [
          ...new Set(
            participants
              .filter(
                (p) =>
                  p.state === 'approved' &&
                  d.data.users.some(
                    (u) =>
                      u.id === p.volunteerId &&
                      u.settings.discoverable &&
                      u.settings.showContributions,
                  ),
              )
              .map((p) => p.volunteerId),
          ),
        ],
      }
    })
}
