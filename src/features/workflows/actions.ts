import { getBrowserApi } from '@/lib/api/client'
import * as animal from '@/features/animals/schemas'
import * as adoption from '@/features/adoption/schemas'
import * as campaign from '@/features/fundraising/schemas'
import * as mission from '@/features/missions/schemas'
import * as event from '@/features/events/schemas'
import * as user from '@/features/users/schemas'
import { sightingInputSchema } from '@/features/sightings/schemas'
import type { PublicLocation } from '@/types/common'
import type { Actor } from '@/features/auth/types'

export type Operation =
  | 'animal'
  | 'animal_edit'
  | 'sighting'
  | 'preferences'
  | 'application'
  | 'application_review'
  | 'campaign'
  | 'campaign_edit'
  | 'donation'
  | 'expense'
  | 'campaign_update'
  | 'mission'
  | 'mission_evidence'
  | 'mission_review'
  | 'event'
  | 'event_edit'
  | 'profile'
  | 'privacy'
export type Extra = {
  id?: string
  animalId?: string
  version?: number
  location?: PublicLocation
  shelterId?: string
  draftId?: string
  resubmit?: boolean
  avatarId?: string | null
  bannerId?: string
}
export function parsePHPAmount(value: string) {
  if (!/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(value.trim()))
    throw new Error('Enter a peso amount with at most two decimal places.')
  const [whole, fraction = ''] = value.trim().split('.')
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(result))
    throw new Error('This amount is too large.')
  return result
}
export async function performOperation(
  operation: Operation,
  v: Record<string, string | boolean>,
  extra: Extra,
  photos: string[],
  evidence: string[],
  key: string,
  draft = false,
): Promise<{
  href?: string
  message: string
  identity?: Pick<Actor, 'id' | 'displayName' | 'avatar'>
}> {
  const api = getBrowserApi(),
    options = { idempotencyKey: key }
  const text = (k: string) => String(v[k] ?? '')
  const optional = (k: string) => text(k) || undefined
  const number = (k: string) => (text(k) ? Number(text(k)) : undefined)
  const location = extra.location
  switch (operation) {
    case 'animal':
    case 'animal_edit': {
      const payload = {
        bannerId: extra.bannerId,
        name: text('name'),
        species: text('species'),
        description: text('description'),
        location,
        mediaIds:
          operation === 'animal_edit'
            ? v.clearPhotos === true
              ? []
              : !photos.length
                ? undefined
                : photos
            : photos,
        verificationEvidenceIds:
          operation === 'animal_edit'
            ? v.clearEvidence === true
              ? []
              : !evidence.length
                ? undefined
                : evidence
            : evidence,
        shelterId: optional('shelterId'),
        ...(operation === 'animal_edit'
          ? {
              status: optional('status'),
              adoptable: v.adoptable === true,
              ageMonths: number('ageMonths'),
              size: optional('size'),
            }
          : {}),
      }
      if (operation === 'animal_edit')
        await api.animals.update(
          extra.id!,
          animal.animalUpdateInputSchema.parse({
            ...payload,
            expectedVersion: extra.version,
          }),
          options,
        )
      else
        await api.animals.report(
          animal.animalReportInputSchema.parse(payload),
          options,
        )
      return {
        href: '/dashboard/animals',
        message: 'Saved privately and submitted for publication review.',
      }
    }
    case 'sighting': {
      await api.sightings.create(
        sightingInputSchema.parse({
          animalId: text('animalId') || extra.animalId,
          observedAt: new Date(text('observedAt')).toISOString(),
          areaId: location?.areaId,
          exactLatitude: number('latitude'),
          exactLongitude: number('longitude'),
          observation: text('observation'),
          mediaIds: photos,
        }),
        options,
      )
      return {
        href: '/dashboard/sightings',
        message: 'Sighting submitted. Exact coordinates stay private.',
      }
    }
    case 'preferences': {
      await api.adoption.savePreferences(
        adoption.adoptionPreferencesSchema.parse({
          species: optional('species'),
          homeType: optional('homeType'),
          activity: optional('activity'),
          experience: optional('experience'),
          otherPets: text('otherPets')
            ? text('otherPets') === 'none'
              ? []
              : text('otherPets').split(',')
            : undefined,
          originAreaId: text('maxDistanceKm') ? location?.areaId : undefined,
          maxDistanceKm: number('maxDistanceKm'),
          minAgeMonths: number('minAgeMonths'),
          maxAgeMonths: number('maxAgeMonths'),
          size: optional('size'),
          personality: text('personality')
            ? text('personality')
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : undefined,
        }),
        options,
      )
      return {
        href: '/adopt',
        message:
          'Optional preferences saved. You can change or skip them at any time.',
      }
    }
    case 'application': {
      const answers = {
        fullName: text('fullName'),
        email: text('email'),
        phone: text('phone'),
        livingSituation: text('livingSituation'),
        careExperience: text('careExperience'),
        motivation: text('motivation'),
        agreement: v.agreement === true ? true : undefined,
      }
      if (draft) {
        const partial = Object.fromEntries(
          Object.entries(answers).filter(
            ([, v]) => v !== '' && v !== undefined,
          ),
        )
        const r = await api.adoption.saveDraft(
          adoption.adoptionApplicationDraftSchema.parse({
            id: extra.draftId,
            animalId: extra.animalId,
            answers: partial,
            expectedVersion: extra.version,
          }),
          options,
        )
        return {
          href: `/adopt/applications/${r.id}`,
          message: 'Private application draft saved.',
        }
      }
      const payload = adoption.adoptionApplicationInputSchema.parse({
        animalId: extra.animalId,
        draftId: extra.draftId,
        expectedVersion: extra.version,
        answers,
      })
      const r = extra.resubmit
        ? await api.adoption.resubmit(extra.id!, payload, options)
        : await api.adoption.apply(payload, options)
      return {
        href: `/adopt/applications/${r.id}`,
        message: 'Application submitted for human shelter review.',
      }
    }
    case 'application_review': {
      await api.adoption.review(
        extra.id!,
        adoption.applicationReviewInputSchema.parse({
          decision: text('decision'),
          message: text('message'),
          expectedVersion: extra.version,
        }),
        options,
      )
      return {
        message:
          'Application decision recorded. This does not finalize an adoption.',
      }
    }
    case 'campaign':
    case 'campaign_edit': {
      const budget = text('budget')
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((r) => {
          const split = r.lastIndexOf('|')
          if (split < 1)
            throw new Error(
              'Use description | amount in PHP for each budget item.',
            )
          return {
            description: r.slice(0, split).trim(),
            amountMinor: parsePHPAmount(r.slice(split + 1).trim()),
          }
        })
      const values = {
        title: text('title'),
        story: text('story'),
        category: text('category'),
        urgency: text('urgency'),
        goalMinor: text('goal') ? parsePHPAmount(text('goal')) : undefined,
        currency: 'PHP',
        animalId: optional('animalId') ?? null,
        shelterId: optional('shelterId') ?? null,
        location,
        mediaIds:
          operation === 'campaign_edit' && !photos.length ? undefined : photos,
        privateEvidenceIds:
          operation === 'campaign_edit' && !evidence.length
            ? undefined
            : evidence,
      }
      const complete = {
        ...values,
        hordeId: optional('hordeId') ?? null,
        budget,
        timeline: text('timeline'),
      }
      if (draft) {
        const partial = Object.fromEntries(
          Object.entries(complete).filter(
            ([, v]) => v !== '' && v !== undefined,
          ),
        )
        const r = await api.fundraisers.saveDraft(
          campaign.campaignDraftSchema.parse({
            id: extra.draftId,
            expectedVersion: extra.version,
            values: partial,
          }),
          options,
        )
        return {
          href: `/fundraisers/create?draft=${r.id}`,
          message: 'Private fundraiser draft saved.',
        }
      }
      const r =
        operation === 'campaign_edit'
          ? await api.fundraisers.update(
              extra.id!,
              campaign.campaignUpdateInputSchema.parse({
                ...complete,
                expectedVersion: extra.version,
              }),
              options,
            )
          : await api.fundraisers.create(
              campaign.campaignInputSchema.parse({
                ...complete,
                draftId: extra.draftId,
                expectedVersion: extra.version,
              }),
              options,
            )
      return {
        href: `/dashboard/fundraisers/${r.id}`,
        message: 'Campaign submitted for independent publication review.',
      }
    }
    case 'donation': {
      await api.fundraisers.pledge(
        extra.id!,
        {
          amountMinor: parsePHPAmount(text('amount')),
          message: text('message'),
          anonymous: v.anonymous === true,
        },
        options,
      )
      return {
        message: 'Your support pledge is saved. No payment was taken.',
      }
    }
    case 'expense':
      await api.fundraisers.addExpense(
        extra.id!,
        campaign.expenseInputSchema.parse({
          amountMinor: parsePHPAmount(text('amount')),
          description: text('description'),
          correctsEntryId: optional('correctsEntryId'),
          receiptIds: evidence,
        }),
        options,
      )
      return {
        message:
          'Expense appended to the transparent record. Receipts remain private.',
      }
    case 'campaign_update': {
      const r = await api.fundraisers.addUpdate(
        extra.id!,
        { text: text('text'), mediaIds: photos },
        options,
      )
      return {
        message: r.publicationPostId
          ? 'Photo update submitted for publication review.'
          : 'Campaign update published.',
        ...(r.publicationPostId
          ? { href: `/community/${r.publicationPostId}` }
          : {}),
      }
    }
    case 'mission': {
      const r = await api.missions.create(
        mission.missionInputSchema.parse({
          title: text('title'),
          kind: text('kind'),
          urgency: text('urgency'),
          description: text('description'),
          deadline: new Date(text('deadline')).toISOString(),
          rewardKibble: Number(text('rewardKibble')),
          location,
          animalId: optional('animalId') ?? null,
          hordeId: optional('hordeId') ?? null,
          shelterId: optional('shelterId') ?? null,
          evidenceRequirements: text('requirements')
            .split('\n')
            .filter(Boolean),
        }),
        options,
      )
      return { href: `/missions/${r.slug}`, message: 'Help request created.' }
    }
    case 'mission_evidence':
      await api.missions.submit(
        extra.id!,
        {
          text: text('text'),
          mediaIds: evidence,
          expectedVersion: extra.version!,
        },
        options,
      )
      return {
        href: '/dashboard/missions?state=submitted#my-mission-activity',
        message:
          'Private evidence submitted. Kibble is awarded only after independent approval.',
      }
    case 'mission_review':
      await api.missions.review(
        extra.id!,
        mission.missionReviewInputSchema.parse({
          decision: text('decision'),
          reason: text('reason'),
          expectedVersion: extra.version,
        }),
        options,
      )
      return {
        message: 'Evidence decision and reward ledger updated together.',
      }
    case 'event':
    case 'event_edit': {
      const payload = event.eventInputSchema.parse({
        title: text('title'),
        description: text('description'),
        startsAt: new Date(text('startsAt')).toISOString(),
        endsAt: new Date(text('endsAt')).toISOString(),
        venue: {
          name: text('venue'),
          address: text('address'),
          latitude: Number(text('latitude')),
          longitude: Number(text('longitude')),
          intentionallyPublic: v.publicVenue === true ? true : undefined,
        },
        capacity: Number(text('capacity')),
        shelterId: optional('shelterId') ?? null,
        state: text('state') || 'scheduled',
        expectedVersion: extra.version,
      })
      const r =
        operation === 'event_edit'
          ? await api.events.update(extra.id!, payload, options)
          : await api.events.create(payload, options)
      return {
        href: `/events/${r.slug}`,
        message: 'Event saved. Venue information is intentionally public.',
      }
    }
    case 'profile': {
      const profile = await api.users.update(
        user.profileInputSchema.parse({
          displayName: text('displayName'),
          bio: text('bio'),
          avatarId: photos[0] ?? extra.avatarId ?? null,
          bannerId: extra.bannerId,
          areaId: v.showArea === true ? (location?.areaId ?? null) : null,
        }),
        options,
      )
      return {
        identity: {
          id: profile.id,
          displayName: profile.displayName,
          avatar: profile.avatar,
        },
        message: photos.length
          ? 'Profile saved; your new photograph awaits publication review.'
          : 'Profile saved.',
      }
    }
    case 'privacy':
      await api.users.updateSettings(
        {
          showLocation: v.showLocation === true,
          showContributions: v.showContributions === true,
          discoverable: v.discoverable === true,
          publicAttendance: v.publicAttendance === true,
        },
        options,
      )
      return {
        message:
          'Privacy settings saved. Public views use these settings immediately.',
      }
  }
}
