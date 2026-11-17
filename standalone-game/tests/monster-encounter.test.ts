import test from 'node:test'
import assert from 'node:assert/strict'
import { MonsterEncounter, type BossCue } from '../src/game/monsters/encounter'
import { ATTACKS, VAELRITH, healthBars, type GroundPoint } from '../src/game/monsters/vaelrith'

const safe = { x: 7, z: 9.5 }
function step(boss: MonsterEncounter, duration: number, player: GroundPoint = safe) {
  for (let elapsed = 0; elapsed < duration; elapsed += 25) boss.advance(Math.min(25, duration - elapsed), player)
}

test('ten-bar health handles exact boundaries, overflow, zero and capped input', () => {
  assert.equal(VAELRITH.maxHp, 10_000)
  assert.deepEqual(healthBars(10_000), { remaining: 10, active: 1000 })
  assert.deepEqual(healthBars(9000), { remaining: 9, active: 1000 })
  assert.deepEqual(healthBars(8999), { remaining: 9, active: 999 })
  assert.deepEqual(healthBars(7250), { remaining: 8, active: 250 })
  assert.deepEqual(healthBars(0), { remaining: 0, active: 0 })
  assert.deepEqual(healthBars(-500), { remaining: 0, active: 0 })
  assert.deepEqual(healthBars(20_000), { remaining: 10, active: 1000 })
})

test('armor halves damage and one strike cannot multiply across head/seal targets', () => {
  const boss = new MonsterEncounter(); boss.start()
  assert.equal(boss.hit('sword-1', 120, 'seal:left'), 60)
  assert.equal(boss.hit('sword-1', 120, 'seal:center'), 0)
  assert.equal(boss.hit('sword-1', 120, 'seal:right'), 0)
  assert.equal(boss.hp, 9940)
})

test('unexposed throats and invalid damage/regions cannot alter HP', () => {
  const boss = new MonsterEncounter(); boss.start()
  for (const damage of [NaN, Infinity, -10, 0]) assert.equal(boss.hit('invalid', damage, 'seal:left'), 0)
  assert.equal(boss.hit('unknown', 120, 'seal:fake'), 0)
  assert.equal(boss.hit('unknown', 120, 'unrecognized:left'), 0)
  assert.equal(boss.hit('not-exposed', 120, 'throat:left'), 0)
  assert.equal(boss.hp, 10_000)
})

test('bite locks its destination, has a harmless warning and damages once', () => {
  const boss = new MonsterEncounter(); boss.start()
  assert.equal(boss.attack('rift-fang', { x: 1, z: 4 }), true)
  step(boss, ATTACKS['rift-fang'].preparation - 1, { x: 1, z: 4 })
  assert.equal(boss.window(), 'preparation'); assert.equal(boss.playerHp, 100)
  boss.advance(1, { x: 1, z: 4 })
  assert.equal(boss.window(), 'active'); assert.equal(boss.playerHp, 70)
  step(boss, 200, { x: 1, z: 4 }); assert.equal(boss.playerHp, 70)
  assert.equal(boss.inDanger({ x: -4, z: 4 }), false)
  assert.deepEqual(boss.cast?.aim, { x: 1, z: 4 })
})

test('sweep leaves a far safe lane and cannot repeatedly damage one target', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.attack('obsidian-sweep', { x: 0, z: 3 })
  assert.equal(boss.inDanger({ x: 0, z: 6 }), false)
  step(boss, 1100 + 440, { x: 0, z: 3 })
  assert.equal(boss.playerHp, 75)
  boss.advance(10, safe); assert.equal(boss.window(), 'recovery')
  assert.equal(boss.exposed('right'), true); assert.equal(boss.exposed('left'), false)
})

test('breath has exactly three authored ticks and opens only the committed throat', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.attack('violet-exhalation', { x: 0, z: 6 })
  assert.equal(boss.inDanger({ x: 6, z: 3 }), false)
  step(boss, 2600, { x: 0, z: 6 })
  assert.equal(boss.playerHp, 55)
  assert.equal(boss.window(), 'recovery'); assert.equal(boss.exposed('center'), true)
  assert.equal(boss.exposed('left'), false)
  const before = boss.hp
  assert.equal(boss.hit('weak-strike', 120, 'throat:center'), 240)
  assert.equal(boss.hp, before - 240) // replaces armor; does not stack 0.5x with 2x
})

test('busy and cooldown reject another move; rupture is restricted to phase three', () => {
  const boss = new MonsterEncounter(); boss.start()
  assert.equal(boss.attack('seal-rupture', safe), false)
  boss.attack('rift-fang', safe)
  assert.equal(boss.attack('obsidian-sweep', safe), false)
  step(boss, 2720)
  assert.equal(boss.cast, null)
  assert.equal(boss.attack('rift-fang', safe), false)
  assert.ok((boss.report().cooldowns['rift-fang'] ?? 0) > 0)
})

test('threshold skips enter the final phase and cancel the old attack', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.attack('rift-fang', safe)
  assert.equal(boss.hit('phase-skip', 16000, 'seal:center'), 8000)
  assert.equal(boss.hp, 2000); assert.equal(boss.phase, 'riftstorm'); assert.equal(boss.cast, null)
  assert.equal(boss.attack('seal-rupture', safe), true)
})

test('rupture leaves gaps and an exposed seal staggers and cancels all pending damage', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.hit('phase', 16000, 'seal:center')
  boss.attack('seal-rupture', { x: 2, z: 8 })
  assert.equal(boss.inDanger({ x: 2, z: 8 }), false)
  assert.equal(boss.inDanger({ x: 0, z: 8 }), true)
  step(boss, 4000, { x: 2, z: 8 })
  assert.equal(boss.sealExposed(), true); assert.equal(boss.playerHp, 100)
  boss.hit('break-seal', 120, 'seal:left')
  assert.equal(boss.cast, null); assert.equal(boss.window(), 'stagger')
  assert.ok(boss.exposed('left') && boss.exposed('center') && boss.exposed('right'))
  assert.equal(boss.attack('rift-fang', safe), false)
  step(boss, 2200); assert.equal(boss.window(), 'idle'); assert.equal(boss.playerHp, 100)
})

test('pause freezes clocks, cancels active damage and reset clears all state', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.attack('rift-fang', { x: 0, z: 3 })
  step(boss, 600); boss.pause(); const clock = boss.clock
  step(boss, 10000, { x: 0, z: 3 })
  assert.equal(boss.clock, clock); assert.equal(boss.playerHp, 100); assert.equal(boss.cast, null)
  boss.reset(); const report = boss.report()
  assert.equal(report.hp, 10_000); assert.equal(report.playerHp, 100)
  assert.equal(report.running, false); assert.equal(report.phase, 'bound')
  assert.deepEqual(report.cooldowns, {}); assert.equal(boss.staggerUntil, 0)
  boss.start(); assert.equal(boss.attack('rift-fang', safe), true)
})

test('defeat occurs once, overkill clamps to zero and reset can accept the same hit id', () => {
  const cues: BossCue[] = [], boss = new MonsterEncounter(cue => cues.push(cue))
  boss.start(); boss.attack('rift-fang', safe)
  boss.hit('finish', 50000, 'seal:center'); boss.hit('another', 50000, 'seal:left')
  assert.equal(boss.hp, 0); assert.equal(boss.running, false); assert.equal(boss.cast, null)
  assert.equal(boss.window(), 'defeated'); assert.equal(boss.exposed('left'), false)
  assert.equal(cues.filter(cue => cue === 'defeat').length, 1)
  step(boss, 2000); assert.equal(boss.deathElapsed, 1200)
  boss.start(); assert.equal(boss.running, false)
  boss.reset(); boss.start(); assert.equal(boss.hit('finish', 120, 'seal:center'), 60)
})

test('large and invalid frame deltas cannot fast-forward a warning into damage', () => {
  const boss = new MonsterEncounter(); boss.start(); boss.attack('rift-fang', { x: 0, z: 3 })
  boss.advance(90000, { x: 0, z: 3 }); assert.equal(boss.clock, 50)
  boss.advance(NaN, safe); boss.advance(Infinity, safe); boss.advance(-20, safe)
  assert.equal(boss.clock, 50); assert.equal(boss.playerHp, 100)
})
