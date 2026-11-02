import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'
const css = readFileSync('src/app/globals.css', 'utf8')
const color = (name: string) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  expect(match, `Missing token ${name}`).not.toBeNull()
  return match![1]
}
function luminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/../g)!
    .map((c) => parseInt(c, 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
}
function contrast(a: string, b: string) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}
it('preserves pinned branding and gives default and hover actions AA text contrast', () => {
  expect(color('primary').toLowerCase()).toBe('#f97316')
  expect(color('primary-dark').toLowerCase()).toBe('#ea580c')
  for (const [foreground, background] of [
    ['foreground', 'primary'],
    ['surface', 'action-hover'],
    ['foreground', 'background'],
    ['foreground', 'surface'],
    ['secondary-text', 'background'],
    ['secondary-text', 'surface'],
    ['teal', 'surface'],
    ['teal', 'background'],
    ['foreground', 'green'],
  ])
    expect(
      contrast(color(foreground), color(background)),
      `${foreground} on ${background}`,
    ).toBeGreaterThanOrEqual(4.5)
})
it('preserves focus visibility and removes intent motion under reduced-motion', () => {
  expect(contrast(color('teal'), color('background'))).toBeGreaterThanOrEqual(3)
  expect(css).toMatch(/prefers-reduced-motion:\s*reduce/)
  expect(css).toContain('scroll-padding-bottom')
})
it('keeps hovered current navigation on a contrast-safe foreground', () => {
  const hover = css.match(
    /\.nav-item:hover:not\(\.nav-unavailable\)\s*\{([^}]+)\}/,
  )![1]
  expect(hover).toContain('color: var(--foreground)')
  expect(contrast(color('foreground'), color('border'))).toBeGreaterThanOrEqual(
    4.5,
  )
})
