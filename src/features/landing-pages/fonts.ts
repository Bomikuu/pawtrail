import { fonts, fontRegistry } from '@sitebuilder/core'
// Host registration: Studio keeps its own defaults; PawTrail adds its installed fonts.
for (const family of ['Saira Condensed', 'Instrument Sans']) {
  if (!fonts.includes(family)) fonts.push(family)
  if (!fontRegistry.some((font) => font.family === family))
    fontRegistry.push({ family, kind: 'system' })
}
