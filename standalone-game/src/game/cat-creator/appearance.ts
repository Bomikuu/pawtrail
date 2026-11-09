import palette from '../actor-rig/palette.json'
import { CAT_CHOICES, CAT_FACE_COLORS, catOptions, catBreedColors, type CatOptions, type CatFace } from '../actor-rig/cat-appearance'

export const CAT_LIBRARY_LIMIT = 24
export type CatAppearance = { version: 1; cat: Required<CatOptions>; colors: Record<keyof typeof palette, string>; face: CatFace }
export type SavedCat = { id: string; name: string; appearance: CatAppearance; scope: 'device' | 'account'; revision: number; updated: string; thumbnail?: string }
export const catId = (value: unknown): value is string => typeof value === 'string' && /^cat_[a-f0-9]{32}$/.test(value)
export function defaultCatAppearance(cat: CatOptions = {}): CatAppearance {
  const colors = { ...palette, ...catBreedColors(cat.breed) }
  const eye = cat.breed === 'siamese' || cat.pattern === 'colorpoint' ? colors.shirtLight : colors.gold
  return { version: 1, cat: catOptions(cat), colors, face: { ...CAT_FACE_COLORS, leftEye: eye, rightEye: eye, nose: colors.skinShadow } }
}
export const catAppearanceSignature = (appearance: CatAppearance) => JSON.stringify([appearance.cat, appearance.colors, appearance.face])
export function readCatAppearance(input: unknown): CatAppearance | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  if (value.version !== 1 || !value.cat || typeof value.cat !== 'object' || !value.colors || typeof value.colors !== 'object') return null
  const cat = value.cat as Record<string, unknown>, colors = value.colors as Record<string, unknown>
  const result = defaultCatAppearance()
  for (const [slot, choices] of Object.entries(CAT_CHOICES)) {
    if (cat[slot] === undefined && (slot === 'bodySize' || slot === 'faceMarking')) continue
    if (typeof cat[slot] !== 'string' || !choices.includes(cat[slot] as string)) return null
    ;(result.cat as Record<string, unknown>)[slot] = cat[slot]
  }
  for (const key of Object.keys(palette) as (keyof typeof palette)[]) {
    if (typeof colors[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(colors[key] as string)) return null
    result.colors[key] = (colors[key] as string).toLowerCase()
  }
  const eye = result.cat.pattern === 'colorpoint' ? result.colors.shirtLight : result.colors.gold
  result.face = { leftEye: eye, rightEye: eye, nose: result.colors.skinShadow, marking: result.colors.ink }
  if (value.face !== undefined) {
    if (!value.face || typeof value.face !== 'object') return null
    const face = value.face as Record<string, unknown>
    for (const key of Object.keys(CAT_FACE_COLORS) as (keyof CatFace)[]) {
      if (typeof face[key] !== 'string' || !/^#[a-f0-9]{6}$/i.test(face[key] as string)) return null
      result.face[key] = (face[key] as string).toLowerCase()
    }
  }
  return result
}
