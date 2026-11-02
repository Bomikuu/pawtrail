import 'server-only'
import type { PawTrailApi } from '@/lib/api/contracts'
import type { FixtureSeed } from '@/data/fixtures'
import type { DemoRepository } from '@/lib/server/demo/repository'
import {
  context,
  workflows,
  stamp,
  found,
  fail,
  version,
  staff,
  distanceKm,
  page,
  filterScope,
} from '@/lib/server/workflow-context'
import { currentUser } from '@/features/users/service'
import { publicSnapshot } from '@/features/moderation/service'
import { toPublicAnimal } from '@/lib/server/projections'
import { listQuerySchema } from '@/lib/api/schemas'
import { notify } from '@/features/notifications/service'
import * as s from './schemas'
import { scoreCompatibility } from './compatibility'

export function installAdoption(
  api: PawTrailApi,
  data: FixtureSeed,
  repository?: DemoRepository,
) {
  const { read, write } = context(data, repository)
  api.adoption.preferences = () =>
    read(
      (d) =>
        workflows(d).preferences.find((p) => p.actorId === currentUser(d).id)
          ?.values ?? {},
    )
  api.adoption.savePreferences = (input, options) => {
    const p = s.adoptionPreferencesSchema.parse(input)
    return write('adoption.preferences', p, options, (d, u) => {
      if (
        p.minAgeMonths !== undefined &&
        p.maxAgeMonths !== undefined &&
        p.minAgeMonths > p.maxAgeMonths
      )
        fail('Minimum age must not exceed maximum age.')
      workflows(d).preferences = workflows(d).preferences.filter(
        (r) => r.actorId !== u.id,
      )
      workflows(d).preferences.push({ actorId: u.id, values: p })
      return p
    })
  }
  api.adoption.discover = (input) => {
    const q = s.adoptionFiltersSchema.parse(input)
    return read((d) => {
      const publicData = publicSnapshot(d)
      const p =
        q.preferences ??
        workflows(d).preferences.find((p) => p.actorId === d.auth.actorId)
          ?.values ??
        {}
      const origin = publicData.areas.find((a) => a.id === p.originAreaId)
      const rows = publicData.animals
        .filter(
          (a) =>
            a.adoptable &&
            a.status !== 'adopted' &&
            a.shelterId &&
            (!q.shelterId || a.shelterId === q.shelterId) &&
            (!p.species || p.species === a.species) &&
            (!p.size || p.size === a.size) &&
            (p.minAgeMonths === undefined || a.ageMonths >= p.minAgeMonths) &&
            (p.maxAgeMonths === undefined || a.ageMonths <= p.maxAgeMonths) &&
            (!p.personality?.length ||
              p.personality.every((t) => a.personality.includes(t))),
        )
        .map((a) => ({
          ...a,
          animal: toPublicAnimal(a, publicData.users),
          compatibility: scoreCompatibility(
            toPublicAnimal(a, publicData.users),
            p,
            origin ? distanceKm(origin, a.location) : undefined,
          ),
        }))
      const result = page(
        rows,
        q,
        `adopt:${filterScope(p)}:${q.shelterId ?? ''}`,
      )
      return {
        ...result,
        items: result.items.map((r) => ({
          animal: r.animal,
          compatibility: r.compatibility,
        })),
      }
    })
  }
  api.adoption.setInterest = (animalId, interested, options) =>
    write(
      'adoption.interest',
      { animalId, interested },
      options,
      (d, u, now) => {
        const a = found(
          publicSnapshot(d).animals.find(
            (a) => a.id === animalId && a.adoptable && a.status !== 'adopted',
          ),
        )
        const w = workflows(d)
        if (
          interested &&
          !w.interests.some((r) => r.actorId === u.id && r.animalId === a.id)
        )
          w.interests.push({ actorId: u.id, animalId: a.id, createdAt: now })
        if (!interested)
          w.interests = w.interests.filter(
            (r) => r.actorId !== u.id || r.animalId !== animalId,
          )
      },
    )
  api.adoption.interested = (input) => {
    const q = listQuerySchema.parse(input)
    return read((d) => {
      const u = currentUser(d),
        w = workflows(d),
        visible = publicSnapshot(d)
      const p = w.preferences.find((p) => p.actorId === u.id)?.values ?? {}
      const result = page(
        w.interests
          .filter((e) => e.actorId === u.id)
          .flatMap((e) => {
            const a = visible.animals.find(
              (a) =>
                a.id === e.animalId && a.adoptable && a.status !== 'adopted',
            )
            return a
              ? [
                  {
                    id: a.id,
                    createdAt: e.createdAt,
                    animal: toPublicAnimal(a, visible.users),
                    compatibility: scoreCompatibility(
                      toPublicAnimal(a, visible.users),
                      p,
                    ),
                  },
                ]
              : []
          }),
        q,
        `interest:${u.id}`,
      )
      return {
        ...result,
        items: result.items.map(({ animal, compatibility }) => ({
          animal,
          compatibility,
        })),
      }
    })
  }
  api.adoption.saveDraft = (input, options) => {
    const p = s.adoptionApplicationDraftSchema.parse(input)
    return write('adoption.draft', p, options, (d, u, now) => {
      const w = workflows(d),
        a = found(
          publicSnapshot(d).animals.find(
            (a) =>
              a.id === p.animalId &&
              a.adoptable &&
              a.shelterId &&
              a.status !== 'adopted',
          ),
        )
      let row = p.id
        ? found(
            w.applications.find((a) => a.id === p.id && a.applicantId === u.id),
          )
        : w.applications.find(
            (a) =>
              a.animalId === p.animalId &&
              a.applicantId === u.id &&
              a.status === 'draft',
          )
      if (row) {
        if (row.status !== 'draft' || row.animalId !== a.id)
          fail('Only your draft can be edited.', 409)
        version(row, p.expectedVersion)
        row.answers = p.answers
        row.version++
      } else {
        row = s.adoptionApplicationSchema.parse({
          ...stamp(now),
          animalId: a.id,
          applicantId: u.id,
          shelterId: a.shelterId,
          status: 'draft',
          version: 1,
          answers: p.answers,
          reviewMessage: null,
        })
        w.applications.push(row)
      }
      return {
        id: row.id,
        animalId: row.animalId,
        answers: row.answers,
        expectedVersion: row.version,
      }
    })
  }
  api.adoption.apply = (input, options) => {
    const p = s.adoptionApplicationInputSchema.parse(input)
    return write('adoption.apply', p, options, async (d, u, now) => {
      const a = found(
          publicSnapshot(d).animals.find(
            (a) =>
              a.id === p.animalId &&
              a.adoptable &&
              a.shelterId &&
              a.status !== 'adopted',
          ),
        ),
        w = workflows(d)
      const duplicate = w.applications.find(
        (a) =>
          a.animalId === p.animalId &&
          a.applicantId === u.id &&
          ['submitted', 'needs_information', 'approved'].includes(a.status),
      )
      if (duplicate)
        fail('You already have an active application for this animal.', 409)
      const row = p.draftId
        ? found(
            w.applications.find(
              (a) =>
                a.id === p.draftId &&
                a.applicantId === u.id &&
                a.status === 'draft' &&
                a.animalId === p.animalId,
            ),
          )
        : s.adoptionApplicationSchema.parse({
            ...stamp(now),
            animalId: a.id,
            applicantId: u.id,
            shelterId: a.shelterId,
            status: 'draft',
            answers: {},
            reviewMessage: null,
            version: 1,
          })
      if (p.draftId) version(row, p.expectedVersion)
      else w.applications.push(row)
      row.answers = p.answers
      row.status = 'submitted'
      row.version++
      row.history.push({
        status: row.status,
        message: 'Application submitted',
        actorId: u.id,
        createdAt: now,
        version: row.version,
      })
      for (const recipient of d.data.users.filter(
        (r) =>
          r.roles.includes('shelter_staff') &&
          r.shelterIds.includes(row.shelterId),
      ))
        await notify({
          draft: d,
          recipientId: recipient.id,
          kind: 'application',
          ref: { kind: 'animal', id: a.id },
          now,
        })
      return s.adoptionApplicationSchema.parse(row)
    })
  }
  api.adoption.applications = (input) => {
    const q = s.applicationFiltersSchema.parse(input)
    return read((d) => {
      const u = currentUser(d)
      if (
        q.scope === 'shelter' &&
        (!u.roles.includes('shelter_staff') ||
          (q.shelterId && !u.shelterIds.includes(q.shelterId)))
      )
        fail('Shelter staff access required.', 403)
      return page(
        workflows(d)
          .applications.filter(
            (a) =>
              (q.scope === 'shelter'
                ? u.shelterIds.includes(a.shelterId) && a.status !== 'draft'
                : a.applicantId === u.id) &&
              (!q.shelterId || a.shelterId === q.shelterId) &&
              (!q.status || a.status === q.status),
          )
          .map((a) => s.adoptionApplicationSummarySchema.parse(a)),
        q,
        `applications:${u.id}:${q.scope ?? 'mine'}:${q.status ?? ''}`,
      )
    })
  }
  api.adoption.application = (id) =>
    read((d) => {
      const u = currentUser(d),
        a = found(workflows(d).applications.find((a) => a.id === id))
      if (
        a.applicantId !== u.id &&
        (a.status === 'draft' ||
          !u.roles.includes('shelter_staff') ||
          !u.shelterIds.includes(a.shelterId))
      )
        fail('Application not found.', 404)
      return s.adoptionApplicationSchema.parse(a)
    })
  api.adoption.withdraw = (id, options) =>
    write('adoption.withdraw', { id }, options, (d, u, now) => {
      const a = found(
        workflows(d).applications.find(
          (a) => a.id === id && a.applicantId === u.id,
        ),
      )
      if (
        !['draft', 'submitted', 'needs_information', 'approved'].includes(
          a.status,
        )
      )
        fail('This application cannot be withdrawn.', 409)
      a.status = 'withdrawn'
      a.version++
      a.history.push({
        status: a.status,
        message: 'Withdrawn by applicant',
        actorId: u.id,
        createdAt: now,
        version: a.version,
      })
      return s.adoptionApplicationSchema.parse(a)
    })
  api.adoption.resubmit = (id, input, options) => {
    const p = s.adoptionApplicationInputSchema.parse(input)
    return write(
      'adoption.resubmit',
      { id, ...p },
      options,
      async (d, u, now) => {
        const a = found(
          workflows(d).applications.find(
            (a) => a.id === id && a.applicantId === u.id,
          ),
        )
        version(a, p.expectedVersion)
        if (a.status !== 'needs_information' || a.animalId !== p.animalId)
          fail('Only an information request can be resubmitted.', 409)
        found(
          publicSnapshot(d).animals.find(
            (r) => r.id === a.animalId && r.adoptable && r.status !== 'adopted',
          ),
        )
        a.answers = p.answers
        a.status = 'submitted'
        a.version++
        a.history.push({
          status: a.status,
          message: 'Information resubmitted by applicant',
          actorId: u.id,
          createdAt: now,
          version: a.version,
        })
        for (const recipient of d.data.users.filter(
          (r) =>
            r.roles.includes('shelter_staff') &&
            r.shelterIds.includes(a.shelterId),
        ))
          await notify({
            draft: d,
            recipientId: recipient.id,
            kind: 'application',
            ref: { kind: 'animal', id: a.animalId },
            now,
          })
        return s.adoptionApplicationSchema.parse(a)
      },
    )
  }
  api.adoption.review = (id, input, options) => {
    const p = s.applicationReviewInputSchema.parse(input)
    return write(
      'adoption.review',
      { id, ...p },
      options,
      async (d, u, now) => {
        const a = found(workflows(d).applications.find((a) => a.id === id))
        staff(u, a.shelterId)
        version(a, p.expectedVersion)
        if (a.applicantId === u.id)
          fail('You cannot review your own application.', 403)
        if (a.status !== 'submitted')
          fail('Only a submitted application can be reviewed.', 409)
        found(
          publicSnapshot(d).animals.find(
            (r) => r.id === a.animalId && r.adoptable && r.status !== 'adopted',
          ),
        )
        a.status = p.decision
        a.reviewMessage = p.message
        a.version++
        a.history.push({
          status: a.status,
          message: p.message,
          actorId: u.id,
          createdAt: now,
          version: a.version,
        })
        await notify({
          draft: d,
          recipientId: a.applicantId,
          kind: 'application',
          ref: { kind: 'animal', id: a.animalId },
          now,
        })
        return s.adoptionApplicationSchema.parse(a)
      },
    )
  }
}
