import { expect, it } from 'vitest'
import { notificationViewSchema } from '@/features/notifications/schemas'

it('accepts the real achievement-review notification and its workspace link', () => {
  expect(
    notificationViewSchema.parse({
      id: 'review-notification',
      recipientId: 'member',
      kind: 'achievement',
      message: 'Your achievement evidence was approved.',
      ref: null,
      createdAt: '2026-11-08T00:00:00Z',
      readAt: null,
      provenance: { kind: 'real', label: 'PawTrail community record' },
      destinationHref: '/dashboard/achievements',
    }).destinationHref,
  ).toBe('/dashboard/achievements')
})
