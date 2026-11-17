import test from 'node:test'
import assert from 'node:assert/strict'
import { applyOutcome, freshCampaign, validCampaign, type Campaign, type Outcome } from '../src/game/floors/state'
import { neonFoundation as definitions } from '../src/game/floors/neon-foundation'
import { FloorCampaignStore, type ExclusiveLock } from '../src/game/floors/store'
import { FloorAnimationClock } from '../src/game/floors/animation-clock'
import { planTravel } from '../src/game/floors/travel'

const opening = ['start', 'meetMara', 'acceptBearings', 'checkpoint', 'route', 'bearings', 'acceptAllocation', 'cell'] as const
const event = (outcome: Outcome) => ({ id: 'accepted:' + outcome.id, kind: outcome.event })
function ready(profile = 'player-one') {
  let state = freshCampaign(profile, 'expedition-one')
  for (const id of opening) {
    const result = applyOutcome(state, definitions[id], event(definitions[id]))
    assert.equal(result.ok, true)
    if (!result.ok) throw Error(result.message)
    state = result.state
  }
  return state
}
class MemoryStorage {
  values = new Map<string, string>()
  failWrites = false
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { if (this.failWrites) throw Error('Quota'); this.values.set(key, value) }
}
function locks(): ExclusiveLock {
  const pending = new Map<string, Promise<void>>()
  return async (name, task) => {
    const previous = pending.get(name) ?? Promise.resolve()
    let release!: () => void
    const next = new Promise<void>(resolve => { release = resolve })
    pending.set(name, next)
    await previous
    try { return await task() }
    finally { release(); if (pending.get(name) === next) pending.delete(name) }
  }
}

test('clinic choice persists public memory, spends one cell and cannot be reversed or rewarded twice', () => {
  const before = ready(), chosen = applyOutcome(before, definitions.clinic, event(definitions.clinic))
  assert.equal(chosen.ok, true)
  if (!chosen.ok) return
  assert.equal(before.inventory['f01.key.cell'], 1)
  assert.equal(chosen.state.inventory['f01.key.cell'], 0)
  assert.equal(chosen.state.relationships.mara, 8)
  assert.equal(chosen.state.factions.residents, 6)
  assert.deepEqual(chosen.state.knowledge.nyx, ['allocation'])
  const reloaded: Campaign = JSON.parse(JSON.stringify(chosen.state))
  assert.equal(validCampaign(reloaded), true)
  assert.equal(reloaded.decisions.allocation, 'clinic')
  const repeat = applyOutcome(reloaded, definitions.clinic, { ...event(definitions.clinic), id: 'new-click' })
  assert.equal(repeat.ok && repeat.status, 'already-applied')
  assert.deepEqual(repeat.ok && repeat.state, chosen.state)
  assert.equal(applyOutcome(reloaded, definitions.transit, event(definitions.transit)).ok, false)
  const report = applyOutcome(reloaded, definitions.allocationReport, event(definitions.allocationReport))
  assert.equal(report.ok && report.state.scrip, 80)
  assert.equal(report.ok && report.state.relationships.mara, 8)
})

test('transit produces its distinct signed relationship effects without private knowledge', () => {
  const result = applyOutcome(ready(), definitions.transit, event(definitions.transit))
  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.state.relationships.mara, -3)
  assert.equal(result.state.relationships.nyx, 4)
  assert.equal(result.state.factions.couriers, 6)
  assert.equal(result.state.factions.residents, -2)
  assert.deepEqual(result.state.knowledge.sena, ['allocation'])
})

test('failed requirements and incorrect event types leave source inventory and relationships unchanged', () => {
  const fresh = freshCampaign('new-player', 'new-expedition')
  const met = applyOutcome(fresh, definitions.meetMara, event(definitions.meetMara))
  assert.equal(met.ok && met.state.quests.q01, 'available', 'Meeting Mara alone must not accept her quest')
  const state = ready(); state.inventory['f01.key.cell'] = 0
  const snapshot = structuredClone(state)
  assert.equal(applyOutcome(state, definitions.clinic, event(definitions.clinic)).ok, false)
  assert.equal(applyOutcome(state, definitions.clinic, { id: 'preview', kind: 'conversation' }).ok, false)
  assert.deepEqual(state, snapshot)
  const invalid = structuredClone(snapshot); invalid.inventory['f01.mat.wire'] = -1
  assert.equal(validCampaign(invalid), false)
  assert.equal(validCampaign({ ...snapshot, version: 2 }), false)
})

test('concurrent local stores reject a stale claim and keep a single granted outcome', async () => {
  const storage = new MemoryStorage(), exclusive = locks()
  const a = new FloorCampaignStore('player-one', storage, exclusive), b = new FloorCampaignStore('player-one', storage, exclusive)
  assert.equal((await a.create('expedition-one')).ok, true)
  for (const id of opening) {
    const loaded = a.load(); assert.equal(loaded.ok, true)
    if (!loaded.ok) throw Error(loaded.message)
    assert.equal((await a.commit(definitions[id], event(definitions[id]), loaded.state.revision)).ok, true)
  }
  const loaded = a.load(); if (!loaded.ok) throw Error(loaded.message)
  const outcomes = await Promise.all([a.commit(definitions.clinic, event(definitions.clinic), loaded.state.revision), b.commit(definitions.transit, event(definitions.transit), loaded.state.revision)])
  assert.equal(outcomes.filter(result => result.ok && result.status === 'applied').length, 1)
  assert.equal(outcomes.filter(result => !result.ok && result.status === 'conflict').length, 1)
  const saved = b.load(); if (!saved.ok) throw Error(saved.message)
  assert.equal(saved.state.inventory['f01.key.cell'], 0)
  const winner = saved.state.decisions.allocation === 'clinic' ? definitions.clinic : definitions.transit
  const replay = await b.commit(winner, { ...event(winner), id: 'replayed-choice' }, saved.state.revision)
  assert.equal(replay.ok && replay.status, 'already-applied')
  assert.equal((await b.create('another-expedition')).ok, false)
})

test('corrupt, unsupported and failed-write slots are preserved; other players have independent state', async () => {
  const storage = new MemoryStorage(), store = new FloorCampaignStore('one', storage, locks())
  storage.values.set(store.key, '{broken')
  assert.equal((await store.create('run-one')).ok, false)
  assert.equal(storage.getItem(store.key), '{broken')
  storage.values.delete(store.key)
  assert.equal((await store.create('run-one')).ok, true)
  const original = storage.getItem(store.key)!
  storage.failWrites = true
  assert.equal((await store.commit(definitions.start, event(definitions.start), 0)).ok, false)
  assert.equal(storage.getItem(store.key), original)
  storage.failWrites = false
  const other = new FloorCampaignStore('two', storage, locks())
  assert.equal((await other.create('run-two')).ok, true)
  assert.equal((await other.commit(definitions.start, event(definitions.start), 0)).ok, true)
  const first = store.load(); assert.equal(first.ok && first.state.scrip, 0)
  storage.values.set(store.key, JSON.stringify({ ...JSON.parse(original), version: 99 }))
  assert.equal((await store.create('new-run')).ok, false)
  assert.equal(JSON.parse(storage.getItem(store.key)!).version, 99)
})

test('travel refuses uninstalled destinations and locked routes, while retaining a safe return', () => {
  const state = ready(), installed = new Set<Campaign['location']['stage']>(['hub.concourse', 'f01.stage.arrival', 'f01.stage.market', 'f01.stage.undergrid', 'f01.stage.switchyard'])
  assert.equal(planTravel(state, 'f01.stage.arrival', new Set()).ok, false)
  state.location.stage = 'f01.stage.market'
  assert.equal(planTravel(state, 'f01.stage.undergrid', installed).ok, false)
  assert.equal(planTravel(state, 'f01.stage.arrival', installed).ok, true)
  state.quests.q02 = 'claimed'
  assert.equal(planTravel(state, 'f01.stage.undergrid', installed).ok, true)
  assert.equal(planTravel(state, 'f01.stage.switchyard', installed).ok, false)
  state.facts['gate-authenticated'] = true
  assert.equal(planTravel(state, 'f01.stage.switchyard', installed).ok, true)
})

test('animation pauses without catch-up and reduced motion keeps a stable per-instance pose', () => {
  const clock = new FloorAnimationClock()
  clock.tick(100, true, false); clock.tick(116, true, false)
  assert.equal(clock.timeMs, 16)
  const still = clock.phase('tower-one', 8000, true)
  clock.tick(132, false, false); clock.tick(10000, true, false)
  assert.equal(clock.timeMs, 16)
  clock.tick(10016, true, false)
  assert.equal(clock.timeMs, 32)
  assert.equal(clock.phase('tower-one', 8000, true), still)
  clock.tick(11000, true, true); clock.tick(20000, true, false)
  assert.equal(clock.timeMs, 32)
  clock.dispose(); clock.tick(20016, true, false)
  assert.equal(clock.timeMs, 32)
})
