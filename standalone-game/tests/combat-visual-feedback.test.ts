import test from 'node:test'
import assert from 'node:assert/strict'
import { VisualFeedbackQueue, ActionFeedbackTracker, drawVisualFeedback } from '../src/game/feedback/visual-feedback'
import { MonsterEncounter, type BossCombatEvent } from '../src/game/monsters/encounter'
import { ATTACKS } from '../src/game/monsters/vaelrith'

test('boss damage receipts match actual mitigation, vulnerability and overkill', () => {
  const events: BossCombatEvent[] = [], boss = new MonsterEncounter(undefined, () => 0, event => events.push(event))
  boss.start()
  assert.equal(boss.hit('armor', 120, 'seal:center'), 60)
  assert.deepEqual(events.at(-1), { kind: 'damage', target: 'boss', amount: 60, region: 'seal:center', weak: false })
  boss.hit('armor', 120, 'seal:right'); boss.hit('invalid', .1, 'seal:left'); boss.hit('closed', 120, 'throat:center')
  assert.equal(events.length, 1, 'Rejected or duplicate hits must not produce cosmetic damage')
  boss.attack('violet-exhalation', { x: 0, z: 6 })
  for (let t = 0; t < 2600; t += 25) boss.advance(25, { x: 7, z: 9.5 })
  const before = boss.hp; boss.hit('weak', 120, 'throat:center')
  assert.equal(before - boss.hp, 240)
  assert.deepEqual(events.at(-1), { kind: 'damage', target: 'boss', amount: 240, region: 'throat:center', weak: true })
  const remaining = boss.hp
  assert.equal(boss.hit('overkill', 100000, 'seal:center'), remaining)
  assert.equal(events.filter(event => event.kind === 'defeat').length, 1)
  const damage = events.filter(event => event.kind === 'damage' && event.target === 'boss')
  assert.equal(damage.reduce((sum, event) => sum + (event.kind === 'damage' ? event.amount : 0), 0), 10000)
})

test('player damage displays the remaining HP loss, and phase/stagger have real outcome events', () => {
  const events: BossCombatEvent[] = [], boss = new MonsterEncounter(undefined, () => 0, event => events.push(event))
  boss.start(); boss.playerHp = 5; boss.attack('riftfire-rain', { x: 7, z: 9.5 })
  const tile = boss.cast!.fireTiles[0]
  for (let time = 0; time < ATTACKS['riftfire-rain'].preparation; time += 25) boss.advance(25, tile)
  assert.ok(events.some(event => event.kind === 'damage' && event.target === 'player' && event.amount === 5))
  assert.equal(boss.playerHp, 0); assert.equal(events.filter(event => event.kind === 'defeat').length, 1)
  boss.reset(); boss.start(); boss.hit('phase', 16000, 'seal:center')
  assert.ok(events.some(event => event.kind === 'phase' && event.phase === 'riftstorm'))
  boss.attack('seal-rupture', { x: 2, z: 8 })
  for (let time = 0; time < 4000; time += 25) boss.advance(25, { x: 2, z: 8 })
  boss.hit('break', 120, 'seal:center')
  assert.equal(events.at(-1)!.kind, 'stagger')
})

test('transient feedback combines a same-target burst without mixing heads or outcomes', () => {
  const queue = new VisualFeedbackQueue(), position = { x: 1, y: 2, z: 3 }
  queue.add({ kind: 'weak', target: 'Vaelrith', group: 'center', amount: 240, label: 'Weak point ×2', position })
  position.x = 99
  assert.equal(queue.entries[0].position.x, 1)
  queue.advance(50)
  queue.add({ kind: 'weak', target: 'Vaelrith', group: 'center', amount: 240, label: 'Weak point ×2', position })
  assert.equal(queue.entries.length, 1); assert.equal(queue.entries[0].amount, 480)
  queue.add({ kind: 'weak', target: 'Vaelrith', group: 'left', amount: 240, label: 'Weak point ×2', position })
  queue.add({ kind: 'armored', target: 'Vaelrith', group: 'left', amount: 60, label: 'Armored ×0.5', position })
  assert.equal(queue.entries.length, 3)
  queue.advance(2000); assert.equal(queue.pending, false)
  assert.match(queue.latest, /60 HP/)
})

test('feedback has a hard capacity, expires, and never displays invalid or zero damage', () => {
  const queue = new VisualFeedbackQueue(), position = { x: 0, y: 0, z: 0 }
  for (const amount of [0, -10, NaN, Infinity, .1]) queue.add({ kind: 'damage', target: 'Vaelrith', amount, label: 'Hit', position })
  assert.equal(queue.entries.length, 0)
  for (let i = 0; i < 2000; i++) queue.add({ kind: 'notice', target: 'Amber', label: 'Cooldown ' + i, position })
  assert.equal(queue.entries.length, queue.limit)
  queue.advance(1500); assert.equal(queue.entries.length, 0)
  queue.clear('Reset · full health'); assert.equal(queue.latest, 'Reset · full health')
})

test('miss feedback waits for projectile expiry and never replaces a confirmed hit or block', () => {
  const tracker = new ActionFeedbackTracker()
  tracker.begin('wave')
  assert.deepEqual(tracker.finish({ cast: { id: 'wave' }, projectiles: [] }), [])
  assert.deepEqual(tracker.finish({ cast: null, projectiles: [{ castId: 'wave' }] }), [])
  assert.deepEqual(tracker.finish({ cast: null, projectiles: [] }), ['wave'])
  tracker.begin('hit'); tracker.hit('hit'); tracker.begin('wall'); tracker.blocked('wall')
  assert.deepEqual(tracker.finish({ cast: null, projectiles: [] }), [])
  tracker.begin('cancelled'); tracker.clear()
  assert.deepEqual(tracker.finish({ cast: null, projectiles: [] }), [])
})

test('Canvas feedback paints readable numbers and captions without motion when reduced', () => {
  const queue = new VisualFeedbackQueue(), drawn: { text: string; x: number; y: number }[] = []
  queue.add({ kind: 'armored', target: 'Vaelrith', amount: 60, label: 'Armored ×0.5', position: { x: 0, y: 0, z: 0 } })
  const context = { canvas: { width: 480, height: 360 }, save() {}, restore() {}, strokeText() {}, fillText(text: string, x: number, y: number) { drawn.push({ text, x, y }) } } as unknown as CanvasRenderingContext2D
  drawVisualFeedback(context, queue, () => ({ x: 240, y: 100 }), true)
  queue.advance(400); drawVisualFeedback(context, queue, () => ({ x: 240, y: 100 }), true)
  assert.equal(drawn[0].text, '−60'); assert.equal(drawn[1].text, 'Armored ×0.5')
  assert.equal(drawn[0].y, drawn[2].y)
})
