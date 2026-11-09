import choices from './cat-contract.json'
import type { FaceColors } from './face-details'

/** Cat morphology is independent of palette and of the shared animation rig. */
export type CatBreed = 'domestic' | 'persian' | 'siamese' | 'maine-coon' | 'bobtail'
export type CatPattern = 'mackerel' | 'classic-tabby' | 'spotted' | 'solid' | 'bicolor' | 'calico' | 'colorpoint'
export type CatOptions = {
  breed?: CatBreed
  pattern?: CatPattern
  fur?: 'short' | 'plush' | 'long'
  tail?: 'long' | 'plume' | 'bobtail' | 'stub'
  tailMotion?: 'sway' | 'upright' | 'swish'
  hat?: 'none' | 'cap' | 'witch' | 'flower'
  shoes?: 'none' | 'boots'
  wings?: 'none' | 'feathered' | 'bat'
  collar?: 'none' | 'bell' | 'bandana'
  bodySize?: 'kitten' | 'standard' | 'large'
  faceMarking?: 'none' | 'mustache' | 'split-mustache' | 'tuxedo' | 'freckles'
}
export type CatFace = FaceColors
export const CAT_FACE_COLORS = { leftEye: '#e8bc5a', rightEye: '#e8bc5a', nose: '#c28864', marking: '#38271e' }
export const catBodyScale = (size?: CatOptions['bodySize']) => size === 'kitten' ? .85 : size === 'large' ? 1.4 : 1.15
export const CAT_CHOICES = choices

export function catBreedColors(breed?: CatBreed): Record<string, string> {
  if (breed === 'siamese') return { orange: '#dfcda8', furLight: '#f0e2c4', stripe: '#594237', cream: '#e6d7b9', creamShadow: '#b9a582', shirtLight: '#75bbd8', gold: '#75bbd8' }
  if (breed === 'persian') return { orange: '#ded4c6', furLight: '#f6efe3', stripe: '#a59a8b', cream: '#fff6e8', creamShadow: '#c2b9aa', gold: '#9ab66b' }
  return {}
}
export function catOptions(value: CatOptions = {}): Required<CatOptions> {
  const breed = value.breed ?? 'domestic'
  return {
    breed, pattern: breed === 'siamese' ? 'colorpoint' : breed === 'persian' ? 'solid' : 'mackerel',
    fur: breed === 'persian' || breed === 'maine-coon' ? 'long' : 'short',
    tail: breed === 'bobtail' ? 'bobtail' : breed === 'persian' || breed === 'maine-coon' ? 'plume' : 'long',
    tailMotion: 'sway', hat: 'none', shoes: 'none', wings: 'none', collar: 'none', bodySize: 'standard', faceMarking: 'none', ...value,
  }
}
/** Pure pose envelopes also drive the ground shadow, not the collision body. */
export function catJumpMotion(phase: number) {
  const p = Math.max(0, Math.min(1, phase))
  const air = Math.max(0, Math.min(1, (p - .2) / .6))
  return { lift: p > .2 && p < .8 ? Math.sin(air * Math.PI) : 0,
    crouch: p <= .2 ? Math.sin(p / .2 * Math.PI) : p >= .8 ? Math.sin((p - .8) / .2 * Math.PI) * .65 : 0 }
}
