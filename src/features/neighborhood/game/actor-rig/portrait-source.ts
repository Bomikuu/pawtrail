import { customCharacterId, defaultAppearance, readAppearance, type ActorAppearance } from './appearance'
import { defaultCatAppearance, catId, type CatAppearance } from '../cat-creator/appearance'
import { gameAppearance } from './game-appearances'
import skins from '../models3d/uv-manifest.json'
import { modelPreferences } from '../models3d/preferences'
import { getSavedCharacter, resolveSavedCharacter } from '../creator/library'
import { catLibrary, loadCatLibrary } from '../cat-creator/library'

export type PortraitSubject = { kind: 'actor'; appearance: ActorAppearance; headScale?: number; preset?:'maya' } | { kind: 'cat'; appearance: CatAppearance }
type CatPalette = { coat: string; mark: string; cream: string; eye: string; pattern: string; patch?: string }
const entries = skins.entries as unknown as Record<string, { kind: string; palette: CatPalette }>
const aliases: Record<string, string> = { ...skins.aliases, gray_cat: 'gray-tabby', gray_tabby: 'gray-tabby', calico_cat: 'calico', siamese_cat: 'siamese' }

/** Resolve cosmetic appearance only. Never replace an animal's actual profile photo. */
export async function resolvePortraitSubject(identity: string): Promise<PortraitSubject | null> {
  if (customCharacterId(identity)) {
    const row = getSavedCharacter(identity) ?? await resolveSavedCharacter(identity)
    return row ? { kind: 'actor', appearance: row.appearance } : null
  }
  if (catId(identity)) {
    const find = () => { const library = catLibrary.getSnapshot(); return [...library.device, ...library.account].find(row => row.id === identity) }
    let row = find()
    if (!row && ['idle', 'loading'].includes(catLibrary.getSnapshot().status)) { await loadCatLibrary(); row = find() }
    return row ? { kind: 'cat', appearance: row.appearance } : null
  }
  const actor = gameAppearance(identity, modelPreferences(identity))
  if (actor) return { kind: 'actor', appearance: actor.appearance, headScale: actor.headScale, ...(identity==='maya'?{preset:'maya' as const}:{}) }
  const canonical = aliases[identity] ?? identity, entry = entries[canonical]
  if (canonical === 'orange-tabby') return { kind: 'cat', appearance: defaultCatAppearance() }
  if (entry?.kind === 'cat') {
    // Match the in-game coat palette; tabby markings remain distinct from solids.
    const p = entry.palette, appearance = defaultCatAppearance({
      breed: canonical === 'siamese' ? 'siamese' : 'domestic',
      pattern: p.pattern === 'points' ? 'colorpoint' : p.pattern === 'calico' ? 'calico' : p.pattern === 'solid' ? 'solid' : p.pattern === 'tuxedo' || p.pattern === 'bicolor' ? 'bicolor' : 'mackerel',
      faceMarking: p.pattern === 'tuxedo' ? 'tuxedo' : 'none',
    })
    Object.assign(appearance.colors, { orange: p.patch ?? p.coat, furLight: p.coat, stripe: p.mark, cream: p.cream, creamShadow: p.mark })
    appearance.face.leftEye = appearance.face.rightEye = p.eye
    return { kind: 'cat', appearance }
  }
  // Catalogue looks share their authored parts, not a guessed recolor.
  const { actorPreviews } = await import('../runtime/actor-previews')
  const template = actorPreviews.find(row => row.id === identity)
  if (!template) return null
  if (template.kind === 'orange-tabby') {
    const appearance = defaultCatAppearance(template.cat)
    Object.assign(appearance.colors, template.colors)
    if (template.face) appearance.face = template.face
    return { kind: 'cat', appearance }
  }
  const base = defaultAppearance(), appearance = readAppearance({ ...base, parts: { ...base.parts, ...template.parts }, accessories: { ...base.accessories, ...template.accessories }, colors: { ...base.colors, ...template.colors }, face: template.face ?? base.face })
  return appearance ? { kind: 'actor', appearance } : null
}
