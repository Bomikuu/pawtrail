import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveInteractionYaw } from '../src/game/models3d/interaction-facing'

test('seated poses use all four seat headings regardless of arrival direction or alignment jitter', () => {
  for (const heading of [0, -Math.PI / 2, Math.PI, Math.PI / 2]) {
    for (const moving of [true, false]) {
      assert.equal(resolveInteractionYaw(.7, moving, 'sit', 1.2, heading), heading)
    }
  }
})

test('walking cosmetic emotes keep their movement heading without an authoritative pose', () => {
  for (const action of ['sit', 'wave', 'dance', 'laugh']) {
    assert.equal(resolveInteractionYaw(.7, true, action, -1.2, null), .7)
  }
})

test('clearing the pose releases its heading to locomotion, and invalid locks are ignored', () => {
  for (const action of ['walk_down', 'run_left', 'idle_right']) {
    assert.equal(resolveInteractionYaw(.7, false, action, -1.2, undefined), .7)
  }
  for (const invalid of [null, undefined, NaN, Infinity, 'left']) {
    assert.equal(resolveInteractionYaw(.7, true, 'walk', -1.2, invalid), .7)
  }
})
