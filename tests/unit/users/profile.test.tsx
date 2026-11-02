import { describe, expect, it } from 'vitest'
import { storage } from '../demo/helpers'
import { setup } from '../moderation/helpers'
const disk = storage()
describe('public user profiles', () => {
  it('derives summaries from public contributions rather than denormalized profile counts', async () => {
    const { api, repo } = await setup(disk.dir)
    await repo.transact({
      name: 'count',
      input: {},
      execute(d) {
        d.data.users[1].contributionCount = 999
      },
    })
    const profile = await api.users.get('sample-helper-2')
    expect(profile.contributionCount).not.toBe(999)
    expect(profile.summary).toMatchObject({ donations: 1, missions: 0 })
    expect(
      profile.stories.every(
        (p) => p.moderation === 'published' && p.authorId === profile.id,
      ),
    ).toBe(true)
    expect(profile.level).toBeNull()
    expect(profile.badges).toEqual([])
    expect(JSON.stringify(profile)).not.toMatch(/email|reviewerId|applicant/)
  })
  it('omits hidden location, contribution associations and anonymous donations', async () => {
    const { api, repo } = await setup(disk.dir)
    expect((await api.users.get('sample-helper-1')).summary?.donations).toBe(0)
    await repo.transact({
      name: 'privacy',
      input: {},
      execute(d) {
        d.data.users[1].settings.showLocation = false
        d.data.users[1].settings.showContributions = false
      },
    })
    const profile = await api.users.get('sample-helper-2')
    expect(profile).toMatchObject({
      location: null,
      contributionCount: null,
      summary: null,
      stories: [],
      animalsHelped: [],
      level: null,
      badges: [],
    })
    await repo.transact({
      name: 'hidden',
      input: {},
      execute(d) {
        d.data.users[1].settings.discoverable = false
      },
    })
    await expect(api.users.get('sample-helper-2')).rejects.toMatchObject({
      status: 404,
    })
  })
  it('rechecks withdrawal for old adapters and filters withdrawn linked animals and campaigns', async () => {
    const { api, repo } = await setup(disk.dir)
    await repo.transact({
      name: 'withdraw',
      input: {},
      execute(d) {
        d.data.animals.forEach((a) => (a.moderation = 'removed'))
        d.moderation.subjects.push({
          ref: { kind: 'user', id: 'user-3' },
          creatorIds: ['user-3'],
          evidenceIds: [],
          version: 2,
          state: 'removed',
        })
      },
    })
    expect((await api.users.get('sample-helper-2')).animalsHelped).toEqual([])
    await expect(api.users.get('sample-helper-3')).rejects.toMatchObject({
      status: 404,
    })
  })
})
it('excludes owner private posts and withdrawn campaign/mission associations from the same summary', async () => {
  const { api, repo } = await setup(disk.dir, 'user-2')
  await repo.transact({
    name: 'private-summary',
    input: {},
    execute(d) {
      d.data.posts[1].moderation = 'pending'
      d.data.contributions[5].anonymous = true
      d.moderation.subjects.push({
        ref: { kind: 'fundraiser', id: 'campaign-2' },
        creatorIds: ['user-2'],
        evidenceIds: [],
        version: 2,
        state: 'removed',
      })
    },
  })
  expect(await api.users.get('sample-helper-2')).toMatchObject({
    summary: { stories: 0, donations: 0 },
    animalsHelped: [],
    stories: [],
  })
  const publicVolunteer = await api.users.get('sample-helper-6')
  expect(publicVolunteer.summary?.missions).toBe(1)
  await repo.transact({
    name: 'withdraw-mission',
    input: {},
    execute(d) {
      d.moderation.subjects.push({
        ref: { kind: 'mission', id: 'mission-1' },
        creatorIds: ['user-1'],
        evidenceIds: [],
        version: 2,
        state: 'removed',
      })
    },
  })
  expect(await api.users.get('sample-helper-6')).toMatchObject({
    summary: { missions: 0 },
    animalsHelped: [],
  })
})
it.each(['pending', 'rejected', 'removed', 'published'] as const)(
  'counts only published sightings while their animal remains public: %s',
  async (moderation) => {
    const { api, repo } = await setup(disk.dir)
    const before = await api.users.get('sample-helper-2')
    expect(before.summary?.sightings).toBe(1)
    await repo.transact({
      name: 'test.sighting-eligibility',
      input: { moderation },
      execute(draft) {
        const sighting = draft.data.sightings.find(
          (row) => row.reporterId === 'user-2',
        )!
        const animal = draft.data.animals.find(
          (row) => row.id === sighting.animalId,
        )!
        expect(animal.moderation).toBe('published')
        sighting.moderation = moderation
      },
    })
    const after = await api.users.get('sample-helper-2')
    const eligible = moderation === 'published'
    expect(after.summary?.sightings).toBe(eligible ? 1 : 0)
    expect(after.contributionCount).toBe(
      before.contributionCount! - (eligible ? 0 : 1),
    )
    expect((await api.animals.get('luna')).id).toBe('animal-2')
  },
)
