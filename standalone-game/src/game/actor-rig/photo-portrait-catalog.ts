import catalog from './photo-portrait-catalog.json'

export type PhotoPortraitStyle = typeof catalog[number] & { characterId: string; characterName: string; poseIds?: readonly string[]; budgetBytes?: number }
export const PHOTO_PORTRAIT_STYLES: PhotoPortraitStyle[] = catalog.map(entry => ({
  ...entry,
  characterId: 'characterId' in entry ? String(entry.characterId) : 'photo-reference',
  characterName: 'characterName' in entry ? String(entry.characterName) : 'Photo reference',
}))
export const PHOTO_PORTRAIT_CHARACTERS = Array.from(new Map(PHOTO_PORTRAIT_STYLES.map(entry => [
  entry.characterId, { id: entry.characterId, name: entry.characterName },
])).values())
export const PHOTO_PORTRAIT_POSES = [
  { id: 'front-pout', label: 'Front', description: 'Front-facing portrait' },
  { id: 'three-quarter-left', label: 'Three-quarter', description: 'Three-quarter view to the left' },
  { id: 'profile-left', label: 'Side profile', description: 'Left-facing side profile' },
  { id: 'head-tilt-smile-right', label: 'Head tilt', description: 'The approved tilted-head pose' },
] as const
export type PhotoPortraitPose = typeof PHOTO_PORTRAIT_POSES[number]['id']
export function photoPortraitPoses(style: PhotoPortraitStyle) {
  return PHOTO_PORTRAIT_POSES.filter(pose => !style.poseIds || style.poseIds.includes(pose.id))
}
export const PHOTO_PORTRAIT_EMOTIONS = ['idle', 'smile', 'happy', 'sad', 'angry', 'surprised'] as const
export type PhotoPortraitEmotion = typeof PHOTO_PORTRAIT_EMOTIONS[number]
export type PortraitBlink = 'auto' | 'open' | 'half' | 'closed'
export type PortraitMouth = 'auto' | 'rest' | 'small' | 'round'
export const PHOTO_PORTRAIT_BLINKS: { id: PortraitBlink; label: string }[] = [
  { id: 'auto', label: 'Natural blinking' },
  { id: 'open', label: 'Resting eyes' },
  { id: 'half', label: 'Half blink' },
  { id: 'closed', label: 'Closed eyes' },
]
export function photoPortraitStyle(id: string) {
  const style = PHOTO_PORTRAIT_STYLES.find(entry => entry.id === id)
  if (!style) throw new Error('This portrait style is not available.')
  return style
}
