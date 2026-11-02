import { openDemoRepository } from '@/lib/server/demo/repository'
import { createMockApi } from '@/lib/api/adapters/mock'
import { sessionId } from '../demo/helpers'
export async function setup(dir: string, actor = 'user-20') {
  const repo = await openDemoRepository(sessionId(), dir)
  const api = createMockApi(undefined, repo)
  await api.auth.selectDemoActor(actor)
  return { repo, api }
}
export const reason = 'Reviewed the sample record against community rules'
export async function itemFor(
  api: ReturnType<typeof createMockApi>,
  id: string,
  kind = 'publication',
) {
  let cursor: string | undefined
  do {
    const page = await api.moderation.queue({
      limit: 50,
      kind: kind as 'publication' | 'verification',
      cursor,
    })
    const found = page.items.find(
      (item) => item.ref.id === id && !item.commentId,
    )
    if (found) return found
    cursor = page.nextCursor ?? undefined
  } while (cursor)
  throw new Error('Review item not found: ' + id)
}
