import registry from './actor-previews.json'
import type { BakedActor } from './baked-actors'
import type { CatOptions, CatFace } from '../actor-rig/cat-appearance'

export type ActorPreview = {
  id: string
  name: string
  kind: 'rescuer' | 'orange-tabby'
  status: 'preview'
  description: string
  portrait: string
  portraitCollection?: string
  revision: string
  rigHash: string
  reference?: { file?: string; role: string; source: string; brief: string }
  colors: Record<string, string>
  accessories: { glasses?: boolean; facialHair?: 'none' | 'mustache' | 'goatee'; faceMarking?: 'none' | 'freckles' | 'beauty-mark' }
  cat?: CatOptions
  face?: CatFace
  parts?: { hair?: string; headwear?: string; outfit?: string; legs?: string; held?: string; backpack?: boolean; wings?: string; face?: string }
  sheet: BakedActor
}

export const actorPreviews = registry as ActorPreview[]
