import { describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'
vi.mock('server-only', () => ({}))
import { validateUpload, MAX_UPLOAD_BYTES } from '@/lib/server/media/validation'
import { postInputSchema } from '@/features/community/schemas'

import { png } from './helpers'

describe('bounded upload validation', () => {
  it.each(['jpeg', 'png', 'webp'] as const)(
    'accepts matching %s signatures and MIME',
    async (format) => {
      const bytes = await sharp({
        create: { width: 2, height: 2, channels: 3, background: '#fff' },
      })
        [format]()
        .toBuffer()
      expect(
        validateUpload(
          { bytes, mimeType: `image/${format}`, filename: `pet.${format}` },
          'photo',
        ).mimeType,
      ).toBe(`image/${format}`)
    },
  )
  it('rejects SVG, disguised executables, mismatched MIME, empty files and oversize uploads', () => {
    for (const [bytes, mimeType] of [
      [Buffer.from('<svg/>'), 'image/svg+xml'],
      [Buffer.from('MZ executable'), 'image/png'],
      [png, 'image/jpeg'],
      [Buffer.alloc(0), 'image/png'],
      [Buffer.alloc(MAX_UPLOAD_BYTES + 1), 'image/png'],
    ] as const)
      expect(() =>
        validateUpload({ bytes, mimeType, filename: 'pet.png' }, 'photo'),
      ).toThrow()
  })
  it('only accepts PDF for private evidence', () => {
    const file = {
      bytes: Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF'),
      mimeType: 'application/pdf',
      filename: '../../report.pdf',
    }
    expect(validateUpload(file, 'evidence').extension).toBe('pdf')
    expect(() => validateUpload(file, 'photo')).toThrow()
  })
  it('rejects more than six attachments at the domain boundary', () => {
    expect(
      postInputSchema.safeParse({
        text: 'Pet story',
        type: 'photo',
        refs: [],
        mediaIds: Array.from({ length: 7 }, (_, i) => `media-${i}`),
      }).success,
    ).toBe(false)
  })
})

describe('campaign attachment budget', () => {
  const values = {
    title: 'Sample campaign',
    story: 'Sample care story',
    category: 'medical',
    urgency: 'normal',
    goalMinor: 10000,
    currency: 'PHP',
    animalId: null,
    shelterId: null,
    location: {
      areaId: 'davao',
      neighborhood: 'Sample area',
      latitude: 7,
      longitude: 125,
      approximateRadiusMeters: 500,
    },
    mediaIds: [],
    privateEvidenceIds: [],
  }
  it('caps private evidence and the combined public/private campaign attachments', async () => {
    const { campaignInputSchema } =
      await import('@/features/fundraising/schemas')
    const ids = Array.from({ length: 7 }, (_, i) => `evidence-${i}`)
    expect(
      campaignInputSchema.safeParse({ ...values, privateEvidenceIds: ids })
        .success,
    ).toBe(false)
    expect(
      campaignInputSchema.safeParse({
        ...values,
        mediaIds: ids.slice(0, 4),
        privateEvidenceIds: ids.slice(0, 3),
      }).success,
    ).toBe(false)
    expect(
      campaignInputSchema.safeParse({
        ...values,
        mediaIds: ids.slice(0, 3),
        privateEvidenceIds: ids.slice(0, 3),
      }).success,
    ).toBe(true)
  })
  it('keeps partial draft and update fields optional while enforcing supplied attachment budgets', async () => {
    const { campaignDraftSchema, campaignUpdateInputSchema } =
      await import('@/features/fundraising/schemas')
    const ids = Array.from({ length: 7 }, (_, i) => `evidence-${i}`)
    for (const attachments of [
      { privateEvidenceIds: ids },
      { mediaIds: ids.slice(0, 4), privateEvidenceIds: ids.slice(0, 3) },
    ]) {
      expect(
        campaignDraftSchema.safeParse({ values: attachments }).success,
      ).toBe(false)
      expect(
        campaignUpdateInputSchema.safeParse({
          ...attachments,
          expectedVersion: 1,
        }).success,
      ).toBe(false)
    }
    for (const fields of [
      { title: 'Sample campaign' },
      { privateEvidenceIds: ids.slice(0, 6) },
      { mediaIds: ids.slice(0, 3), privateEvidenceIds: ids.slice(0, 3) },
    ]) {
      expect(campaignDraftSchema.safeParse({ values: fields }).success).toBe(
        true,
      )
      expect(
        campaignUpdateInputSchema.safeParse({ ...fields, expectedVersion: 1 })
          .success,
      ).toBe(true)
    }
  })
})
