import test from 'node:test'
import assert from 'node:assert/strict'
import * as T from 'three'
import { RiftfireView } from '../src/game/monsters/fire-view'
import { VaelrithRig } from '../src/game/monsters/rig'
import { MonsterEncounter } from '../src/game/monsters/encounter'
import { ATTACKS, type AttackId } from '../src/game/monsters/vaelrith'

async function withTextures(run: () => Promise<void>) {
  const original = T.TextureLoader.prototype.loadAsync
  T.TextureLoader.prototype.loadAsync = async () => new T.Texture()
  try { await run() } finally { T.TextureLoader.prototype.loadAsync = original }
}

test('image-loader rejection events become useful fire and model error messages', async () => {
  const original = T.TextureLoader.prototype.loadAsync
  T.TextureLoader.prototype.loadAsync = async () => { throw new Event('error') }
  try {
    await assert.rejects(RiftfireView.create(), /Riftfire animation could not load/)
    await assert.rejects(VaelrithRig.create(), /boss armor texture could not load/)
  } finally { T.TextureLoader.prototype.loadAsync = original }
})

test('fire view reuses eight sprites, one atlas source and one tile geometry, then disposes ownership', async () => withTextures(async () => {
  const view = await RiftfireView.create(), boss = new MonsterEncounter(undefined, () => .3)
  try {
    const sprites = view.root.children.filter((node): node is T.Sprite => node instanceof T.Sprite)
    const tiles = view.root.children.filter((node): node is T.Mesh => node instanceof T.Mesh)
    assert.equal(sprites.length, 8); assert.equal(tiles.length, 8)
    assert.equal(new Set(sprites.map(sprite => sprite.material.map!.source)).size, 1)
    assert.equal(new Set(tiles.map(tile => tile.geometry)).size, 1)
    boss.start(); boss.attack('riftfire-rain', { x: 7, z: 9.5 }); view.update(boss, false)
    assert.equal(tiles.filter(tile => tile.visible).length, 8)
    assert.equal(sprites.filter(sprite => sprite.visible).length, 0)
    for (let i = 0; i < ATTACKS['riftfire-rain'].preparation / 25; i++) boss.advance(25, { x: 7, z: 9.5 })
    view.update(boss, false); assert.equal(sprites.filter(sprite => sprite.visible).length, 8)
    for (const sprite of sprites) assert.deepEqual(sprite.material.map!.repeat.toArray(), [.25, .25])
    const children = [...view.root.children]
    for (let i = 0; i < 180; i++) { boss.advance(5, { x: 7, z: 9.5 }); view.update(boss, false) }
    assert.deepEqual(view.root.children, children, 'Animation must not create new scene objects')
    boss.pause(); view.update(boss, false)
    assert.ok(view.root.children.every(node => !node.visible))
    let mapsDisposed = 0, materialsDisposed = 0
    for (const sprite of sprites) {
      sprite.material.map!.addEventListener('dispose', () => mapsDisposed++)
      sprite.material.addEventListener('dispose', () => materialsDisposed++)
    }
    view.dispose()
    assert.equal(mapsDisposed, 8); assert.equal(materialsDisposed, 8); assert.equal(view.root.children.length, 0)
  } catch (error) { view.dispose(); throw error }
}))

test('real boss geometry keeps wall roots fixed through interpolated attacks without frame jumps', async () => withTextures(async () => {
  const rig = await VaelrithRig.create()
  try {
    for (const id of Object.keys(ATTACKS) as AttackId[]) {
      const boss = new MonsterEncounter(undefined, () => .3)
      if (id === 'seal-rupture') { boss.start(); boss.hit('phase', 16000, 'seal:center') } else boss.start()
      rig.pose(0, boss, false); boss.attack(id, { x: 1, z: 4 })
      const a = ATTACKS[id], duration = a.preparation + a.active + a.recovery
      let previous = rig.necks.map(neck => neck.head.position.clone()), maximum = 0
      for (let time = 1000 / 30; time <= duration; time += 1000 / 30) {
        boss.advance(1000 / 30, { x: 7, z: 9.5 }); rig.pose(time, boss, false)
        rig.necks.forEach((neck, index) => {
          maximum = Math.max(maximum, neck.head.position.distanceTo(previous[index]))
          assert.deepEqual(neck.links[0].position.toArray(), neck.home[0].toArray())
          assert.ok(neck.head.position.toArray().every(Number.isFinite))
        })
        previous = rig.necks.map(neck => neck.head.position.clone())
      }
      assert.ok(maximum < 1.6, `${id} moved ${maximum} player heights in one frame`)
      assert.deepEqual(rig.root.position.toArray(), [0, 0, 0])
    }
  } finally { rig.dispose() }
}))
