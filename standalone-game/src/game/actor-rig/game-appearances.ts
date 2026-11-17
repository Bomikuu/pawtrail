import skins from '../models3d/uv-manifest.json'
import { featuredActors } from '../runtime/featured-actors'
import { defaultAppearance, type ActorAppearance } from './appearance'
import type { ModelOptions } from '../models3d/model'

type Palette = { hair: string; skin: string; outfit: string; shirt: string; pants: string; shoes: string; style: string; hat?: string }
export type GameAppearance = { appearance: ActorAppearance; headScale: number; bodyScale: number; yaw: number }
const palettes = skins.entries as unknown as Record<string, { kind: string; palette: Palette }>
const npcLooks: Record<string, string> = { maya: 'jacket-rescuer', jo: 'male-red-gardener', lina: 'glasses-rescuer' }
const finite = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
const validColor = (value: unknown): value is string => typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value)
function tint(hex: string, amount: number) {
  return '#' + [1,3,5].map(i => { const v = parseInt(hex.slice(i,i+2),16); return Math.round(amount < 0 ? v*(1+amount) : v+(255-v)*amount).toString(16).padStart(2,'0') }).join('')
}
/** Existing roster identities/palettes, rendered through the creator's shared rig. */
export function gameAppearance(identity: string, options: Partial<ModelOptions> = {}): GameAppearance | null {
  if (featuredActors[identity]) return { appearance: featuredActors[identity].appearance, headScale: 1, bodyScale: 1, yaw: 0 }
  const npc = identity in npcLooks ? identity : undefined
  if (npc) { identity = npcLooks[npc]; options = {} }
  options=options&&typeof options==='object'?options:{}
  const entry = palettes[identity]
  if (!entry || entry.kind !== 'player') return null
  const appearance = defaultAppearance(), p = entry.palette
  if (identity !== 'rescuer') {
    const c = appearance.colors
    Object.assign(c, { hair:p.hair, skin:p.skin, jacket:p.outfit, shirt:p.shirt, shorts:p.pants, shoe:p.shoes,
      hood:p.outfit, hat:p.hat ?? c.hat })
    appearance.parts.hair = p.style === 'glasses' || p.style === 'hat' ? 'long' : identity === 'male-blonde-scout' || identity === 'male-violet-volunteer' ? 'spiky' : 'swept'
    appearance.parts.face = p.style === 'glasses' || p.style === 'hat' ? 'soft' : 'default'
    appearance.parts.headwear = p.style === 'hat' ? 'wide-brim' : p.style === 'hoodie' ? 'hood' : 'none'
    appearance.parts.legs = p.style === 'shorts' || p.style === 'glasses' ? 'shorts' : 'trousers'
    appearance.parts.outfit = p.style === 'hoodie' ? 'coat' : 'vest'
    appearance.accessories.glasses = p.style === 'glasses' || identity === 'male-violet-volunteer'
  }
  if (npc === 'maya') {
    // The existing Maya portrait guides both her world model and dialogue bust.
    appearance.parts.hair = 'long'; appearance.parts.face = 'soft'
    appearance.accessories.glasses = false
    Object.assign(appearance.colors, { hair: '#59372d', jacket: '#75865c', shirt: '#e5d1a7', skin: '#dcaa7b' })
    appearance.face.leftEye = appearance.face.rightEye = '#70462b'
  }
  if (validColor(options.hair)) appearance.colors.hair = options.hair
  if (validColor(options.outfit)) { appearance.colors.jacket = options.outfit; appearance.colors.hood = options.outfit }
  if (identity !== 'rescuer' || options.hair || options.outfit) {
    const c = appearance.colors
    for (const [base,light,dark] of [['hair','hairLight','hairShade'],['skin','skinLight','skinShadow'],['shirt','shirtLight','shirtDark'],['jacket','jacketLight','jacketDark'],['shorts','shortsLight','shortsDark']] as const) {
      c[light] = tint(c[base],.24); c[dark] = tint(c[base],-.3)
    }
    c.hairSheen = tint(c.hair,.44); c.hoodShade = tint(c.hood,-.32)
    appearance.face.nose = c.skinShadow; appearance.face.marking = c.hairShade
  }
  return { appearance, headScale:finite(options.head,1,.8,1.25), bodyScale:finite(options.size,1,.8,1.2), yaw:finite(options.yaw,0,-Math.PI,Math.PI) }
}
