import contract from './contract.json'
import palette from './palette.json'
import type { CharacterParts } from './appearance-parts'
import { DEFAULT_CHARACTER_FACE, FACE_COLOR_KEYS, type FaceColors } from './face-details'

export type ActorAppearance = {
  version: 1
  parts: Required<CharacterParts>
  accessories: { glasses: boolean; facialHair?: 'none' | 'mustache' | 'goatee'; faceMarking?: 'none' | 'freckles' | 'beauty-mark' }
  colors: Record<keyof typeof palette, string>
  face: FaceColors
}
export type SavedCharacter = {
  id: string
  name: string
  appearance: ActorAppearance
  updated: string
  revision: number
  scope: 'device' | 'account'
  thumbnail?: string
  thumbnailStyle?: string
}
export const creatorContract = contract
export const basePalette = palette
export const customCharacterId = (value: unknown): value is `custom_${string}` =>
  typeof value === 'string' && /^custom_[a-f0-9]{32}$/.test(value)
export function defaultAppearance(): ActorAppearance {
  return {version:1, parts:{...contract.defaults} as Required<CharacterParts>, accessories:{glasses:false,facialHair:'none',faceMarking:'none'}, colors:{...palette},face:{...DEFAULT_CHARACTER_FACE}}
}
/** Strict versioned data only; no references, URLs, meshes or executable assets. */
export function readAppearance(input: unknown): ActorAppearance | null {
  if (!input || typeof input !== 'object') return null
  const value = input as Record<string, unknown>
  if (value.version !== 1 || !value.parts || typeof value.parts !== 'object' || !value.colors || typeof value.colors !== 'object') return null
  const parts = value.parts as Record<string, unknown>, colors = value.colors as Record<string, unknown>
  const result = defaultAppearance()
  for (const [slot, options] of Object.entries(contract.parts)) {
    if (typeof parts[slot] !== 'string' || !options.includes(parts[slot] as never)) return null
    ;(result.parts as Record<string, unknown>)[slot] = parts[slot]
  }
  if (typeof parts.backpack !== 'boolean') return null
  result.parts.backpack = parts.backpack
  if (!value.accessories || typeof value.accessories !== 'object' || typeof (value.accessories as Record<string,unknown>).glasses !== 'boolean') return null
  result.accessories.glasses = (value.accessories as {glasses:boolean}).glasses
  const accessories=value.accessories as Record<string,unknown>
  for(const slot of ['facialHair','faceMarking'] as const){
    const choice=accessories[slot]??'none'
    if(typeof choice!=='string'||!contract.accessories[slot].includes(choice as never))return null
    ;(result.accessories as Record<string,unknown>)[slot]=choice
  }
  for (const key of Object.keys(palette) as (keyof typeof palette)[]) {
    if (typeof colors[key] !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(colors[key])) return null
    result.colors[key] = (colors[key] as string).toLowerCase()
  }
  result.face={...DEFAULT_CHARACTER_FACE,nose:result.colors.skinShadow,marking:result.colors.hairShade}
  if(value.face!==undefined){
    if(!value.face||typeof value.face!=='object')return null
    const face=value.face as Record<string,unknown>
    for(const key of FACE_COLOR_KEYS){
      if(typeof face[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(face[key] as string))return null
      result.face[key]=(face[key] as string).toLowerCase()
    }
  }
  return result
}
export const appearanceSignature = (appearance: ActorAppearance) => JSON.stringify(appearance)
export function appearanceHeadHeight(appearance: ActorAppearance) {
  if (appearance.parts.headwear === 'outrider-bow') return 55
  if (appearance.parts.headwear === 'halo') return ['spiky','hero-spikes'].includes(appearance.parts.hair) ? 56 : 47
  if (appearance.parts.headwear === 'wide-brim') return 44
  if (appearance.parts.headwear === 'space-helmet') return 43
  if (appearance.parts.headwear === 'hood') return 41
  return ['spiky','hero-spikes'].includes(appearance.parts.hair) ? 50 : 39
}
/** Fit mutually overlapping pieces without throwing away the user's hair choice. */
export function fittedAppearance(appearance: ActorAppearance) {
  const copy = {...appearance, parts:{...appearance.parts}}
  if (['wide-brim','hood'].includes(copy.parts.headwear) && ['spiky','swept','hero-spikes'].includes(copy.parts.hair)) copy.parts.hair = 'cropped'
  if(copy.parts.headwear==='space-helmet')copy.parts.hair='cropped'
  return copy
}
