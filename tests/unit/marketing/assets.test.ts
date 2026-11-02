// @vitest-environment node
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import sharp from 'sharp'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { samplePhotos } from '@/data/fixtures/photos'
import { seed, validateSeed } from '@/data/fixtures'

describe('licensed local asset delivery', () => {
  it('ships decodable photos with provenance and species-correct fixture relationships', async () => {
    for (const [index, photo] of samplePhotos.entries()) {
      const bytes = await readFile(resolve('public', photo.url.slice(1)))
      const metadata = await sharp(bytes).metadata()
      expect([metadata.width, metadata.height]).toEqual([960, 720])
      expect(bytes.toString('latin1')).toContain('Unsplash License')
      expect(seed.animals[index].species).toBe(index ? 'cat' : 'dog')
      expect(seed.animals[index].photo).toEqual(photo)
      expect(seed.fundraisers[index].photo).toEqual(photo)
      expect(seed.posts[index].media).toEqual([photo])
    }
    expect(() => validateSeed(seed)).not.toThrow()
  })
  it('ships compact self-hosted fonts with OFL licenses and no remote font request', async () => {
    for (const family of ['Nunito', 'Inter']) {
      const license = await readFile(`public/fonts/${family}-OFL.txt`, 'utf8')
      expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1')
      for (const subset of ['Latin', 'Latin-Ext']) {
        const bytes = await readFile(
          `public/fonts/${family}-${subset}-Variable.woff2`,
        )
        expect(bytes.subarray(0, 4).toString()).toBe('wOF2')
        expect(bytes.length).toBeLessThan(100_000)
      }
    }
    const css = await readFile('src/app/globals.css', 'utf8')
    expect(css).not.toMatch(/https:\/\/fonts\./)
    expect(css).toContain('font-display: swap')
    expect(css).toContain('unicode-range:')
  })
  it('preserves illustration transparency, original prompt and documented provenance', async () => {
    const file = 'public/images/illustrations/pet-companions.webp'
    const bytes = await readFile(file)
    const metadata = await sharp(bytes).metadata()
    expect(metadata.hasAlpha).toBe(true)
    expect([metadata.width, metadata.height]).toEqual([960, 640])
    expect((await stat(file)).size).toBeLessThan(200_000)
    expect(await readFile(`${file}.json`, 'utf8')).toContain(
      'illustration-story',
    )
    expect(await readFile('docs/assets/credits.md', 'utf8')).toContain(
      'pending owner brand review',
    )
  })
})
