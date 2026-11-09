import {customCharacterId} from './actor-rig/appearance'
export const CHARACTER_OPTIONS = [
  { id: 'rescuer', name: 'Trail rescuer', description: 'Brown hair, a teal shirt and a little backpack. Ready to explore, care and rest.' },
  { id: 'jacket-rescuer', name: 'Jacket rescuer', description: 'Ready for a day outdoors.' },
  { id: 'braided-rescuer', name: 'Braided rescuer', description: 'A sunhat and a curious spirit.' },
  { id: 'glasses-rescuer', name: 'Glasses rescuer', description: 'A girl with round glasses and a little backpack.' },
  { id: 'blonde-rescuer', name: 'Blonde rescuer', description: 'Golden blonde hair, round glasses, and a little backpack.' },
  { id: 'violet-rescuer', name: 'Violet rescuer', description: 'Violet hair, round glasses, and a little backpack.' },
  { id: 'red-rescuer', name: 'Redhead rescuer', description: 'Copper-red hair, round glasses, and a little backpack.' },
  { id: 'male-blonde-scout', name: 'Blonde scout', description: 'A man with tousled blonde hair, a denim jacket, and a sage backpack.' },
  { id: 'male-violet-volunteer', name: 'Violet volunteer', description: 'A man with curly violet hair, round glasses, and a mustard hoodie.' },
  { id: 'male-red-gardener', name: 'Copper gardener', description: 'A man with copper-red hair, a terracotta tee, and green overalls.' },
] as const

export type CharacterId = (typeof CHARACTER_OPTIONS)[number]['id'] | `custom_${string}`
export function isCharacterId(value: unknown): value is CharacterId {
  return customCharacterId(value) || CHARACTER_OPTIONS.some((character) => character.id === value)
}
export function characterId(value: unknown): CharacterId {
  return isCharacterId(value) ? value : 'rescuer'
}
export const characterSheet = (id: CharacterId) =>
  `/assets/game/characters/animations/${id}/complete-v2.png`

export const SPEAKER_PORTRAITS: Record<string, string> = {
  maya: '/pawtrail-game/game-assets/dialogue-portraits/maya.png',
  jo: '/pawtrail-game/game-assets/dialogue-portraits/jo.png',
  lina: '/pawtrail-game/game-assets/dialogue-portraits/lina.png',
  'glasses-rescuer': '/pawtrail-game/game-assets/dialogue-portraits/glasses-rescuer.png',
  'blonde-rescuer': '/pawtrail-game/game-assets/dialogue-portraits/blonde-rescuer.png',
  'violet-rescuer': '/pawtrail-game/game-assets/dialogue-portraits/violet-rescuer.png',
  'red-rescuer': '/pawtrail-game/game-assets/dialogue-portraits/red-rescuer.png',
  'male-blonde-scout': '/pawtrail-game/game-assets/dialogue-portraits/male-blonde-scout.png',
  'male-violet-volunteer': '/pawtrail-game/game-assets/dialogue-portraits/male-violet-volunteer.png',
  'male-red-gardener': '/pawtrail-game/game-assets/dialogue-portraits/male-red-gardener.png',
}
