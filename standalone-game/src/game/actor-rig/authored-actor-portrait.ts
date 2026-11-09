import { actorPreviews } from '../runtime/actor-previews'
import { appearanceSignature, defaultAppearance, readAppearance, type ActorAppearance } from './appearance'

/** Saved copies retain their authored portrait only while their appearance matches. */
export function authoredActorPortrait(appearance: ActorAppearance) {
  const normalized = readAppearance(appearance)
  if (!normalized) return undefined
  const signature = appearanceSignature(normalized), base = defaultAppearance()
  for (const row of actorPreviews) {
    if (row.kind !== 'rescuer' || !row.portraitCollection) continue
    const candidate = readAppearance({ ...base, parts: { ...base.parts, ...row.parts },
      accessories: { ...base.accessories, ...row.accessories }, colors: { ...base.colors, ...row.colors }, face: row.face ?? base.face })
    if (candidate && appearanceSignature(candidate) === signature) return row.portraitCollection
  }
  return undefined
}
