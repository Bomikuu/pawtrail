import { readFileSync } from 'node:fs'
import postcss, { type AnyNode } from 'postcss'
import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
vi.mock('server-only', () => ({}))
import { LandingPage } from '@/features/marketing/landing-page'
import { loadLandingData } from '@/features/marketing/data'
import { createMockApi } from '@/lib/api/adapters/mock'

const stylesheet = postcss.parse(
  readFileSync('src/features/marketing/marketing.css', 'utf8'),
)
/** Resolve these source declarations at a breakpoint; does not measure browser layout. */
function declaration(element: Element, property: string, viewportRem: number) {
  let value: string | undefined
  stylesheet.walkRules((rule) => {
    if (
      !rule.selectors.some(
        (selector) => !selector.includes('::') && element.matches(selector),
      )
    )
      return
    let parent: AnyNode | undefined = rule.parent
    while (parent) {
      if (parent.type === 'atrule' && parent.name === 'media') {
        const maxWidth = parent.params.match(/max-width:\s*([\d.]+)rem/)
        if (maxWidth && viewportRem > Number(maxWidth[1])) return
      }
      parent = parent.parent
    }
    rule.walkDecls(property, (decl) => {
      value = decl.value
    })
  })
  return value
}
async function landingData() {
  vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
  return loadLandingData(createMockApi())
}
describe('marketing responsive content-state contracts', () => {
  it('sizes unavailable and failed photos to the same responsive columns as loaded photos', async () => {
    const data = await landingData()
    data.animals.items[0] = { ...data.animals.items[0], photo: null }
    data.campaigns.items[0] = { ...data.campaigns.items[0], photo: null }
    const { container } = render(<LandingPage data={data} />)
    for (const selector of ['.animal-note', '.campaign-preview']) {
      const rows = container.querySelectorAll(selector)
      const loaded = rows[1].querySelector('img')!
      const missing = rows[0].querySelector('.animal-image-fallback')!
      for (const viewport of [75, 56, 44]) {
        expect(declaration(missing, 'width', viewport)).toBe(
          declaration(loaded, 'width', viewport),
        )
        expect(declaration(missing, 'height', viewport)).toBe(
          declaration(loaded, 'height', viewport),
        )
      }
      fireEvent.error(loaded)
      const failed = rows[1].querySelector('.animal-image-fallback')!
      expect(failed).not.toBeNull()
      expect(declaration(failed, 'width', 44)).toBe(
        selector === '.animal-note' ? '7rem' : '100%',
      )
    }
  })
  it('gives text-only stories full mobile rows regardless of position and keeps photographed stories in two columns', async () => {
    const data = await landingData()
    data.stories.items = [
      { ...data.stories.items[0], media: [] },
      data.stories.items[1],
      { ...data.stories.items[2], media: data.stories.items[0].media },
    ]
    const { container } = render(<LandingPage data={data} />)
    const stories = container.querySelectorAll('.story-preview')
    expect(stories[0].querySelector('img')).toBeNull()
    expect(declaration(stories[0], 'display', 44)).toBe('block')
    for (const story of [stories[1], stories[2]]) {
      expect(story.querySelector('img')).not.toBeNull()
      expect(declaration(story, 'display', 44)).toBe('grid')
      expect(declaration(story, 'grid-template-columns', 44)).toBe('7rem 1fr')
    }
  })
})
