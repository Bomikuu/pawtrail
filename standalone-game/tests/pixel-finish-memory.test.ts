import test from 'node:test'
import assert from 'node:assert/strict'
import { PixelFinish } from '../src/game/actor-rig/pixel-finish'
import { needsMonsterFrame, MONSTER_FRAME_INTERVAL } from '../src/game/monsters/frame-budget'

// The pixel transform is CPU code; exercise it without a browser or WebGL context.
class TestImageData {
  readonly colorSpace = 'srgb' as const
  readonly data: Uint8ClampedArray
  constructor(readonly width: number, readonly height: number) { this.data = new Uint8ClampedArray(width * height * 4) }
}
Object.defineProperty(globalThis, 'ImageData', { value: TestImageData, configurable: true })
const palette = ['#ff0000', '#00ff00', '#0000ff']
const image = (width: number, height: number) => new TestImageData(width, height) as ImageData

test('pixel output retains the original palette, contour and alpha rules', () => {
  const finish = new PixelFinish(palette), source = image(3, 3)
  source.data.set([255, 0, 0, 255], 16)
  assert.deepEqual([...finish.finish(source).data], [
    42,28,23,255, 58,38,29,255, 42,28,23,255,
    58,38,29,255, 255,0,0,255, 42,28,23,255,
    42,28,23,255, 42,28,23,255, 42,28,23,255,
  ])
  const translucent = image(1, 1); translucent.data.set([255, 0, 0, 64])
  assert.deepEqual([...finish.finish(translucent, 1, true).data], [255, 0, 0, 64])
  assert.deepEqual([...finish.finish(translucent).data], [0, 0, 0, 0])
})

test('live output reuse clears old pixels without changing independently cached actor frames', () => {
  const finish = new PixelFinish(palette), source = image(3, 3), target = image(3, 3)
  source.data.set([255, 0, 0, 255], 16)
  const cached = finish.finish(source)
  assert.equal(finish.finishInto(source, target), target)
  source.data.fill(0)
  assert.equal(finish.finishInto(source, target), target)
  assert.ok(target.data.every(value => value === 0))
  assert.deepEqual([...cached.data.slice(16, 20)], [255, 0, 0, 255])
  assert.notEqual(finish.finish(source), cached)
  assert.throws(() => finish.finishInto(source, source), /separate output/)
  assert.throws(() => finish.finishInto(source, image(1, 1)), /matching size/)
})

test('color streaming retains a fixed cache and bounded heap', () => {
  const finish = new PixelFinish(palette), source = image(1024, 64), target = image(1024, 64)
  const gc = (globalThis as typeof globalThis & { gc?: () => void }).gc
  gc?.(); const before = process.memoryUsage().heapUsed
  for (let frame = 0; frame < 12; frame++) {
    for (let pixel = 0; pixel < 65536; pixel++) {
      const color = Math.imul(frame * 65536 + pixel, 7919) & 0xffffff, i = pixel * 4
      source.data[i] = color >>> 16; source.data[i + 1] = color >>> 8 & 255; source.data[i + 2] = color & 255; source.data[i + 3] = 255
    }
    finish.finishInto(source, target)
    assert.equal(finish.cacheByteLength, 256 * 1024)
  }
  gc?.()
  const retained = process.memoryUsage().heapUsed - before
  if (gc) assert.ok(retained < 8 * 1024 * 1024, `Retained heap grew by ${retained} bytes`)
  // Revisit known colors after cache collisions; nearest matching remains exact.
  source.data.set([255, 0, 0, 255]); finish.finishInto(source, target)
  assert.deepEqual([...target.data.slice(0, 4)], [255, 0, 0, 255])
  console.log(JSON.stringify({ streamedColors: 12 * 65536, cacheBytes: finish.cacheByteLength, retainedHeapBytes: gc ? retained : 'GC not exposed' }))
})

test('paused scenes do no continuous work and active scenes respect their frame cap', () => {
  assert.equal(needsMonsterFrame(false, false, false, false, 1e9), false)
  assert.equal(needsMonsterFrame(true, false, false, false, 0), true)
  assert.equal(needsMonsterFrame(false, true, false, false, MONSTER_FRAME_INTERVAL - .1), false)
  assert.equal(needsMonsterFrame(false, true, false, false, MONSTER_FRAME_INTERVAL), true)
  assert.equal(needsMonsterFrame(false, false, true, false, MONSTER_FRAME_INTERVAL), true)
  assert.equal(needsMonsterFrame(false, false, false, true, MONSTER_FRAME_INTERVAL), true)
})
