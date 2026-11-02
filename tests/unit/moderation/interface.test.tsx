import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { renderSession } from '../layout/helpers'
import { Discussion } from '@/features/community/discussion'
import { ReportDialog } from '@/features/community/report-dialog'
import { ReviewPanel } from '@/features/moderation/review-panel'
import type { ModerationItem } from '@/features/moderation/types'
const calls = vi.hoisted(() => ({
  comments: vi.fn(),
  comment: vi.fn(),
  report: vi.fn(),
  review: vi.fn(),
  refresh: vi.fn(),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: calls.refresh }),
}))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({
    community: { comments: calls.comments, comment: calls.comment },
    moderation: { report: calls.report, review: calls.review },
  }),
}))
const ref = { kind: 'animal' as const, id: 'animal-1' }
beforeEach(() => {
  calls.comments.mockResolvedValue({ items: [], count: 0, nextCursor: null })
})
it('keeps failed comment text and submits an honest pending state', async () => {
  calls.comment
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce({ id: 'comment-1', moderation: 'pending' })
  renderSession(<Discussion target={ref} returnTo="/pets/milo" />)
  fireEvent.change(screen.getByLabelText('Your comment'), {
    target: { value: 'An update from today' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }))
  await screen.findByRole('alert')
  expect(screen.getByLabelText('Your comment')).toHaveValue(
    'An update from today',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Submit comment' }))
  await screen.findByText('Comment submitted for review. It is not public yet.')
  expect(calls.comment).toHaveBeenLastCalledWith(
    ref,
    { text: 'An update from today' },
    expect.objectContaining({ idempotencyKey: expect.any(String) }),
  )
})
it('shows report confirmation without claiming automatic deletion', async () => {
  calls.report.mockResolvedValue({ id: 'report-1' })
  renderSession(<ReportDialog target={ref} returnTo="/pets/milo" />)
  fireEvent.click(screen.getByRole('button', { name: 'Report' }))
  fireEvent.click(screen.getByRole('button', { name: 'Misinformation' }))
  fireEvent.click(screen.getByRole('button', { name: 'Submit report' }))
  await screen.findByText(
    'Report received. A reviewer will assess it; reporting does not automatically remove or verify content.',
  )
  expect(calls.report).toHaveBeenCalledWith(
    { target: ref, reason: 'misinformation', details: '' },
    expect.any(Object),
  )
})
it('requires audit reason, warns before sensitive media, and never offers verify on publication items', async () => {
  const item: ModerationItem = {
    id: 'publication:post:post-1',
    createdAt: '2026-11-01T00:00:00Z',
    provenance: { kind: 'sample', label: 'Sample' },
    ref: { kind: 'post', id: 'post-1' },
    creatorId: 'user-1',
    kind: 'publication',
    state: 'pending',
    version: 1,
    reportCount: 0,
    reports: [],
    title: 'Sample story',
    text: 'Review this update',
    publicImages: [],
    media: [
      {
        id: 'photo-1',
        url: '/private-photo',
        alt: 'Distressed animal',
        bytes: 50,
        mimeType: 'image/png',
        visibility: 'private',
        sensitive: true,
      },
    ],
    evidenceIds: [],
    canVerify: false,
    verification: null,
  }
  calls.review.mockResolvedValue({ ...item, state: 'published', version: 2 })
  renderSession(<ReviewPanel item={item} onReviewed={vi.fn()} />)
  expect(screen.queryByRole('img')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Verify' }),
  ).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  fireEvent.click(
    screen.getByRole('button', { name: 'Show review photograph' }),
  )
  expect(
    screen.getByRole('img', { name: 'Distressed animal' }),
  ).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Audit reason'), {
    target: { value: 'Reviewed context and photograph' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  await waitFor(() =>
    expect(calls.review).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedVersion: 1,
        action: 'publish',
        evidenceRefs: [],
      }),
      expect.any(Object),
    ),
  )
})
it('blocks stale-review retries until the reviewer reloads', async () => {
  const { ApiError } = await import('@/lib/api/errors')
  calls.review.mockRejectedValueOnce(new ApiError('CONFLICT', 'Changed', 409))
  const item: ModerationItem = {
    id: 'publication:post:post-2',
    createdAt: '2026-11-01T00:00:00Z',
    provenance: { kind: 'sample', label: 'Sample' },
    ref: { kind: 'post', id: 'post-2' },
    creatorId: 'user-2',
    kind: 'publication',
    state: 'pending',
    version: 1,
    reportCount: 0,
    reports: [],
    title: 'Changed story',
    text: 'An update',
    publicImages: [],
    media: [],
    evidenceIds: [],
    canVerify: false,
    verification: null,
  }
  const reload = vi.fn()
  renderSession(<ReviewPanel item={item} onReviewed={reload} />)
  fireEvent.change(screen.getByLabelText('Audit reason'), {
    target: { value: 'Review complete' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Publish' }))
  await screen.findByText(
    'This record changed. Reload the queue and review its latest version before deciding again.',
  )
  expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Reload queue' }))
  expect(reload).toHaveBeenCalledOnce()
})
it('opens the existing photo composer with its animal connection preserved', async () => {
  renderSession(
    <Discussion
      target={ref}
      returnTo="/pets/milo"
      photoContext={[{ ref, title: 'Milo', href: '/pets/milo' }]}
    />,
  )
  fireEvent.click(screen.getByRole('button', { name: 'Share a photo update' }))
  expect(screen.getByLabelText('Your update')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Photo' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
  expect(
    screen.getByRole('button', { name: 'Unlink Milo' }),
  ).toBeInTheDocument()
})
