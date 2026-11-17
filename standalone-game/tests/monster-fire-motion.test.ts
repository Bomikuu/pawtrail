import test from 'node:test'
import assert from 'node:assert/strict'
import { MonsterEncounter } from '../src/game/monsters/encounter'
import { ATTACKS, type AttackId, type GroundPoint } from '../src/game/monsters/vaelrith'
import { chooseFireTiles, fireFrame, inFireTile, RIFTFIRE } from '../src/game/monsters/fire'
import { bossMotionClips, BOSS_MOTION_FRAMES, sampleBossMotion } from '../src/game/monsters/motion'
import { MONSTER_FRAME_INTERVAL, needsMonsterFrame } from '../src/game/monsters/frame-budget'

function step(boss: MonsterEncounter, ms: number, point: GroundPoint) {
  for (let elapsed = 0; elapsed < ms; elapsed += 25) boss.advance(Math.min(25, ms - elapsed), point)
}

test('random tile selection has a strict eight-effect bound and no duplicates', () => {
  for (const random of [() => 0, () => 1, () => NaN, () => .43]) {
    const tiles = chooseFireTiles(random)
    assert.equal(tiles.length, RIFTFIRE.count)
    assert.equal(new Set(tiles.map(p => p.x + ':' + p.z)).size, RIFTFIRE.count)
    assert.ok(tiles.every(p => p.x >= -6.6 && p.x <= 6.6 && p.z >= 2 && p.z <= 8.6))
  }
  assert.notDeepEqual(chooseFireTiles(() => 0), chooseFireTiles(() => .43))
})

test('damage matches the exact fire tile, including its edges', () => {
  const tiles = [{ x: 0, z: 4 }]
  assert.equal(inFireTile({ x: 0, z: 4 }, tiles), true)
  assert.equal(inFireTile({ x: .3, z: 4.3 }, tiles), true)
  assert.equal(inFireTile({ x: .301, z: 4 }, tiles), false)
  assert.equal(inFireTile({ x: 0, z: 4.301 }, tiles), false)
})

test('Riftfire warns before damage, locks tiles and caps damage to authored ticks', () => {
  const boss = new MonsterEncounter(undefined, () => 0), safe = { x: 7, z: 9.5 }
  boss.start(); assert.equal(boss.attack('riftfire-rain', safe), true)
  const tiles = structuredClone(boss.cast!.fireTiles), fire = tiles[0], spec = ATTACKS['riftfire-rain']
  step(boss, spec.preparation - 1, fire)
  assert.equal(boss.playerHp, 100); assert.equal(boss.window(), 'preparation')
  assert.deepEqual(boss.cast?.fireTiles, tiles)
  boss.advance(1, fire); assert.equal(boss.playerHp, 90)
  step(boss, spec.active, fire)
  assert.equal(boss.playerHp, 40) // six global 600ms ticks; never eight overlapping tile hits
  assert.equal(boss.window(), 'recovery'); assert.ok(boss.exposed('left') && boss.exposed('right'))
})

test('safe space, cancellation and reset remove every fire target', () => {
  const boss = new MonsterEncounter(undefined, () => .31), safe = { x: 7, z: 9.5 }
  boss.start(); boss.attack('riftfire-rain', safe)
  step(boss, ATTACKS['riftfire-rain'].preparation + 500, safe)
  assert.equal(boss.playerHp, 100)
  const oldTile = { ...boss.cast!.fireTiles[0] }
  boss.pause(); assert.equal(boss.cast, null); assert.equal(boss.inDanger(oldTile), false)
  step(boss, 2000, oldTile); assert.equal(boss.playerHp, 100)
  boss.reset(); assert.equal(boss.report().cooldowns['riftfire-rain'], undefined)
  boss.start(); assert.equal(boss.attack('riftfire-rain', safe), true)
  boss.hit('phase-cancel-fire', 16000, 'seal:center')
  assert.equal(boss.cast, null); assert.equal(boss.inDanger(oldTile), false)
})

test('generated atlas playback includes ignition, loop, decay and reduced motion', () => {
  const duration = ATTACKS['riftfire-rain'].active, frame = RIFTFIRE.frameMs
  assert.equal(fireFrame(-1, duration), -1)
  assert.equal(fireFrame(0, duration), 0)
  assert.equal(fireFrame(frame * 3.5, duration), 3)
  assert.equal(fireFrame(frame * 4, duration), 4)
  assert.equal(fireFrame(frame * 12, duration), 4)
  assert.equal(fireFrame(duration - 1, duration), 15)
  assert.equal(fireFrame(duration, duration), -1)
  assert.equal(fireFrame(1200, duration, 3, true), 6)
  for (let age = 0; age < duration; age += 10) assert.ok(fireFrame(age, duration, 7) >= 0 && fireFrame(age, duration, 7) < RIFTFIRE.frames)
})

test('all five attacks have 32 finite poses with continuous phase boundaries', () => {
  for (const id of Object.keys(ATTACKS) as AttackId[]) {
    const attack = ATTACKS[id], clip = bossMotionClips[id], total = attack.preparation + attack.active + attack.recovery
    assert.equal(clip.length, BOSS_MOTION_FRAMES)
    assert.equal(clip[0].time, 0); assert.equal(clip.at(-1)!.time, total)
    assert.ok(clip.every((frame, index) => Object.values(frame.pose).every(Number.isFinite) && (index === 0 || frame.time > clip[index - 1].time)))
    for (const boundary of [attack.preparation, attack.preparation + attack.active]) {
      const before = sampleBossMotion(id, boundary - .01), after = sampleBossMotion(id, boundary + .01)
      for (const key of Object.keys(before) as (keyof typeof before)[]) assert.ok(Math.abs(before[key] - after[key]) < .005, `${id}: ${key} snapped across a phase boundary`)
    }
    const rest = sampleBossMotion(id, total)
    assert.ok(Math.abs(rest.aimMix) < 1e-6 && Math.abs(rest.sweepMix) < 1e-6 && Math.abs(rest.lower) < 1e-6)
    assert.ok(Math.abs(rest.jaw - .27) < 1e-6)
  }
})

test('30fps active playback preserves the paused rendering guard', () => {
  assert.equal(MONSTER_FRAME_INTERVAL, 1000 / 30)
  assert.equal(needsMonsterFrame(false, false, false, false, 100000), false)
  assert.equal(needsMonsterFrame(false, true, false, false, 1000 / 30), true)
})
