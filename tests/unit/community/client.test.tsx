import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { PostDetail, PostCard } from '@/features/community/post-card'
import { Feed } from '@/features/community/feed'
import { postTypes } from '@/features/community/post-composer'
import { renderSession } from '../layout/helpers'
import type { Post } from '@/features/community/types'
const state = vi.hoisted(() => ({
  get: vi.fn(),
  list: vi.fn(),
  react: vi.fn(),
  save: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/api/client', () => ({
  getBrowserApi: () => ({
    community: {
      get: state.get,
      list: state.list,
      setReaction: state.react,
      setSaved: state.save,
    },
  }),
}))
const post: Post = {
  id: 'post-1',
  createdAt: '2026-11-01T16:00:00Z',
  provenance: { kind: 'sample', label: 'Sample story' },
  authorId: 'author-1',
  text: 'A small moment with Milo',
  type: 'story',
  media: [],
  refs: [],
  moderation: 'published',
  reactionCount: 4,
  commentCount: 1,
  version: 1,
  author: { displayName: 'Sample Helper', username: null },
  linkedEntities: [],
  viewerReacted: false,
  viewerSaved: false,
  viewerOwns: false,
}
beforeEach(() => {
  state.get.mockResolvedValue(post)
  state.list.mockResolvedValue({ items: [post], count: 1, nextCursor: null })
})
it('restores rendered reaction counts after a failed request', async () => {
  state.react.mockRejectedValueOnce(new Error('offline'))
  renderSession(<PostDetail initial={post} scope="layout-test" options={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'React · 4' }))
  await screen.findByRole('alert')
  expect(screen.getByRole('button', { name: 'React · 4' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
})
it('never hydrates a different viewer’s pending post in the feed or detail', () => {
  state.get.mockReturnValue(new Promise(() => {}))
  state.list.mockReturnValue(new Promise(() => {}))
  const privatePost = {
    ...post,
    text: 'Private pending content',
    moderation: 'pending' as const,
  }
  renderSession(
    <>
      <Feed
        initial={{ items: [privatePost], count: 1, nextCursor: null }}
        scope="other-viewer"
        options={[]}
        areas={[]}
        animals={[]}
      />
      <PostDetail initial={privatePost} scope="other-viewer" options={[]} />
    </>,
  )
  expect(screen.queryByText('Private pending content')).not.toBeInTheDocument()
})
it.each(Object.entries(postTypes))(
  'renders the %s story type with honest linked identity',
  (type, label) => {
    renderSession(
      <PostCard
        post={{
          ...post,
          type: type as Post['type'],
          linkedEntities: [
            {
              ref: { kind: 'animal', id: 'animal-1' },
              title: 'Milo',
              href: '/pets/milo',
            },
          ],
        }}
        options={[]}
      />,
    )
    expect(
      screen.getByRole('article', { name: `${label} by Sample Helper` }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Milo' })).toHaveAttribute(
      'href',
      '/pets/milo',
    )
    expect(screen.getByText(/discussion coming soon/)).toBeVisible()
  },
)
it('falls back from share and clipboard failures to a selectable permalink', async () => {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: vi.fn().mockRejectedValue(new Error('unsupported')),
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
  })
  renderSession(<PostCard post={post} options={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Share' }))
  expect(await screen.findByLabelText('Copy this story link')).toHaveValue(
    'http://localhost:3000/community/post-1',
  )
})
it('reconciles successful save state across the detail cache', async () => {
  state.save.mockResolvedValue(undefined)
  state.get.mockResolvedValue({ ...post, viewerSaved: true })
  renderSession(<PostDetail initial={post} scope="layout-test" options={[]} />)
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute(
      'aria-pressed',
      'true',
    ),
  )
})
