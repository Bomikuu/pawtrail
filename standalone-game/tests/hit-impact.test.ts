import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import * as T from 'three'
import { HIT_IMPACT, HitImpactPool, type HitImpactKind } from '../src/game/feedback/hit-impact'
import { HitImpactView } from '../src/game/feedback/hit-impact-view'
import { contactSpriteFor } from '../src/game/monsters/contact-feedback'
import { MonsterEncounter, type BossCombatEvent } from '../src/game/monsters/encounter'
import { ATTACKS } from '../src/game/monsters/vaelrith'

test('native contact atlas and playback data agree with the generated manifest', () => {
  const base = new URL('../public/pawtrail-game/effects/hit-impact-v1/', import.meta.url)
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', base), 'utf8'))
  const png = readFileSync(new URL(manifest.file, base))
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.readUInt32BE(16), manifest.columns * manifest.frameWidth)
  assert.equal(png.readUInt32BE(20), manifest.rows * manifest.frameHeight)
  assert.equal(png[25], 6, 'RGBA PNG retains real transparency')
  assert.equal(png.byteLength, manifest.bytes)
  for (const key of ['frameWidth', 'frameHeight', 'columns', 'rows'] as const) assert.equal(HIT_IMPACT[key], manifest[key])
  assert.equal(HIT_IMPACT.capacity, manifest.maximumVisibleImpacts)
  for (const kind of Object.keys(HIT_IMPACT.clips) as HitImpactKind[]) {
    const clip = HIT_IMPACT.clips[kind]
    assert.equal(clip.firstFrame, manifest.clips[kind].firstFrame)
    assert.equal(clip.frames, manifest.clips[kind].frames)
    assert.equal(clip.duration, manifest.clips[kind].durationMs)
  }
})

test('each contact clip plays its eight complete frames and expires at its boundary', () => {
  for (const kind of Object.keys(HIT_IMPACT.clips) as HitImpactKind[]) {
    const pool = new HitImpactPool(), clip = HIT_IMPACT.clips[kind]
    const slot = pool.spawn({ kind, position: { x: 1, y: 2, z: 3 }, unit: 2 })!
    for (let index = 0; index < 8; index++) {
      slot.age = index * clip.duration / 8
      assert.equal(pool.frame(slot), clip.firstFrame + index)
    }
    slot.age = 0; pool.advance(clip.duration - .01)
    assert.equal(pool.frame(slot), clip.firstFrame + 7)
    pool.advance(.01)
    assert.equal(pool.frame(slot), -1); assert.equal(pool.pending, false)
  }
})

test('contact bursts reuse twelve slots, copy positions, reject invalid input and clear on reset', () => {
  const pool = new HitImpactPool(), slots = [...pool.slots]
  const position = { x: 1, y: 4, z: 8 }
  const first = pool.spawn({ kind: 'slash', position, unit: 2 })!
  position.y = 500; assert.equal(first.position.y, 4)
  for (let index = 0; index < 11; index++) pool.spawn({ kind: 'weak', position, unit: 2 })
  const reused = pool.spawn({ kind: 'fire', position: { x: 3, y: 6, z: 9 }, unit: 3 })!
  assert.equal(reused, first, 'Replace the oldest effect when full')
  assert.equal(pool.slots.filter(slot => slot.active).length, 12)
  assert.deepEqual(pool.slots, slots)
  assert.equal(pool.spawn({ kind: 'fire', position: { x: NaN, y: 1, z: 1 }, unit: 1 }), undefined)
  assert.equal(pool.spawn({ kind: 'fire', position, unit: 0 }), undefined)
  pool.advance(-1); pool.advance(NaN); assert.equal(reused.age, 0)
  pool.clear(); assert.equal(pool.pending, false)
})

test('reduced motion holds the authored peak without sprite motion, then clears promptly', () => {
  const pool = new HitImpactPool()
  const slot = pool.spawn({ kind: 'weak', position: { x: 2, y: 4, z: 6 }, unit: 2, reducedMotion: true })!
  assert.equal(pool.frame(slot), 10)
  pool.advance(139); assert.equal(pool.frame(slot), 10)
  assert.deepEqual(slot.position, { x: 2, y: 4, z: 6 })
  pool.advance(1); assert.equal(pool.pending, false)
})

test('only confirmed positive damage selects contact sprites; statuses never fake a hit', () => {
  assert.equal(contactSpriteFor({ kind: 'damage', target: 'boss', amount: 60, region: 'seal:center', weak: false })?.kind, 'slash')
  assert.equal(contactSpriteFor({ kind: 'damage', target: 'boss', amount: 240, region: 'throat:center', weak: true })?.kind, 'weak')
  for (const attack of Object.keys(ATTACKS) as (keyof typeof ATTACKS)[]) {
    const expected = ['riftfire-rain', 'violet-exhalation', 'seal-rupture'].includes(attack) ? 'fire' : 'slash'
    assert.equal(contactSpriteFor({ kind: 'damage', target: 'player', amount: 10, attack })?.kind, expected)
  }
  const statuses: BossCombatEvent[] = [{ kind: 'phase', phase: 'fracturing' }, { kind: 'stagger' }, { kind: 'defeat', target: 'boss' }]
  for (const event of statuses) assert.equal(contactSpriteFor(event), null)
  for (const amount of [0, -1, NaN, Infinity]) assert.equal(contactSpriteFor({ kind: 'damage', target: 'boss', amount, region: 'seal:center', weak: false }), null)
})

test('real encounter damage spawns one contact, duplicate and cancelled attempts spawn none', () => {
  const pool = new HitImpactPool()
  const encounter = new MonsterEncounter(undefined, () => .3, event => {
    const sprite = contactSpriteFor(event)
    if (sprite) pool.spawn({ ...sprite, position: { x: 1, y: 3, z: 5 }, unit: 2 })
  })
  encounter.start()
  assert.equal(encounter.hit('cast:1', 120, 'seal:center'), 60)
  assert.equal(pool.slots.filter(slot => slot.active).length, 1)
  assert.equal(encounter.hit('cast:1', 120, 'seal:center'), 0)
  assert.equal(encounter.hit('invalid', 120, 'missing'), 0)
  encounter.pause(); assert.equal(encounter.hit('cancelled', 120, 'seal:center'), 0)
  assert.equal(pool.slots.filter(slot => slot.active).length, 1)
  pool.clear(); assert.equal(pool.pending, false)
})

test('sprite view shares an atlas, animates UVs at body height and releases its fixed resources', async () => {
  const original = T.TextureLoader.prototype.loadAsync
  const atlas = new T.Texture<HTMLImageElement>()
  T.TextureLoader.prototype.loadAsync = async () => atlas
  let view: HitImpactView | undefined
  try {
    view = await HitImpactView.create()
    const sprites = view.root.children as T.Sprite[], originalChildren = [...sprites]
    assert.equal(sprites.length, 12)
    assert.equal(new Set(sprites.map(sprite => sprite.material.map!.source)).size, 1)
    const maps = sprites.map(sprite => sprite.material.map!)
    for (const map of maps) { assert.deepEqual(map.repeat.toArray(), [.25, 1 / 6]); assert.equal(map.magFilter, T.NearestFilter); assert.equal(map.generateMipmaps, false) }
    view.spawn({ kind: 'weak', position: { x: 1, y: 3, z: 5 }, unit: 2 })
    view.update(0)
    assert.deepEqual(sprites[0].position.toArray(), [1, 3, 5], 'Impact stays on the body, not projected onto the floor')
    assert.deepEqual(sprites[0].scale.toArray(), [2.6, 2.6, 2.6])
    assert.deepEqual(maps[0].offset.toArray(), [0, .5])
    view.update(HIT_IMPACT.clips.weak.duration / 8)
    assert.deepEqual(maps[0].offset.toArray(), [.25, .5])
    for (let index = 0; index < 200; index++) { view.spawn({ kind: 'fire', position: { x: 3, y: 2, z: 1 }, unit: 2 }); view.update(1) }
    assert.deepEqual(view.root.children, originalChildren)
    view.update(1000); assert.equal(view.pending, false); assert.ok(sprites.every(sprite => !sprite.visible))
    view.spawn({ kind: 'slash', position: { x: 1, y: 3, z: 5 }, unit: 2 }); view.update(0); view.clear()
    assert.ok(sprites.every(sprite => !sprite.visible))
    let texturesDisposed = 0, materialsDisposed = 0
    for (const map of [...maps, atlas]) map.addEventListener('dispose', () => texturesDisposed++)
    for (const sprite of sprites) sprite.material.addEventListener('dispose', () => materialsDisposed++)
    view.dispose(); view.dispose()
    assert.equal(texturesDisposed, 13); assert.equal(materialsDisposed, 12)
    assert.equal(view.root.children.length, 0)
    view.spawn({ kind: 'slash', position: { x: 1, y: 3, z: 5 }, unit: 2 }); assert.equal(view.pending, false)
  } finally { view?.dispose(); T.TextureLoader.prototype.loadAsync = original }
})

test('failed contact atlas loads retain a readable error rather than a generic DOM event', async () => {
  const original = T.TextureLoader.prototype.loadAsync
  T.TextureLoader.prototype.loadAsync = async () => { throw new Event('error') }
  try { await assert.rejects(HitImpactView.create(), /hit-impact animation could not load/) }
  finally { T.TextureLoader.prototype.loadAsync = original }
})
