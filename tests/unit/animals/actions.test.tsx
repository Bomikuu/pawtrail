import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { createMockApi } from '@/lib/api/adapters/mock'
import { openDemoRepository } from '@/lib/server/demo/repository'
import { sessionId, storage } from '../demo/helpers'
describe('actor scoped saved animals', () => {
  const env = storage()
  it('persists desired state, isolates actors and rejects guests', async () => {
    const id = sessionId()
    const repo = await openDemoRepository(id, env.dir)
    const api = createMockApi(undefined, repo)
    await expect(api.animals.setSaved('animal-1', true)).rejects.toMatchObject({
      status: 401,
    })
    await api.auth.selectDemoActor('user-1')
    await api.animals.setSaved('animal-1', true)
    await api.animals.setSaved('animal-1', true)
    expect((await api.animals.get('milo')).viewerSaved).toBe(true)
    const reopened = await openDemoRepository(id, env.dir)
    expect(await reopened.read((draft) => draft.savedAnimals)).toEqual([
      { actorId: 'user-1', animalId: 'animal-1' },
    ])
    await api.auth.selectDemoActor('user-2')
    expect((await api.animals.get('milo')).viewerSaved).toBe(false)
    await api.auth.selectDemoActor('user-1')
    await api.animals.setSaved('animal-1', false)
    expect((await api.animals.get('milo')).viewerSaved).toBe(false)
  })
  it('rolls_back_failed_save', async () => {
    const repo = await openDemoRepository(sessionId(), env.dir)
    const api = createMockApi(undefined, repo)
    await api.auth.selectDemoActor('user-1')
    await repo.transact({
      name: 'hide',
      input: null,
      execute(draft) {
        draft.data.animals[0].moderation = 'removed'
      },
    })
    await expect(api.animals.setSaved('animal-1', true)).rejects.toMatchObject({
      status: 404,
    })
    const savedAfterRejectedRequest = await repo.read((d) =>
      d.savedAnimals.some(
        (s) => s.actorId === 'user-1' && s.animalId === 'animal-1',
      ),
    )
    expect(savedAfterRejectedRequest).toBe(false)
  })
})
