import type { CreatorPreviewModel } from './preview-models'

export type ActorIllustration = {
  name: string
  folder: string
  nativeSize: readonly [number, number]
  style: string
  motion: string
}

/** Illustration data stays separate from the actor, icon and dialogue collections. */
export const actorIllustrations: Partial<Record<CreatorPreviewModel, ActorIllustration>> = {
  amber: {
    name: 'Amber',
    folder: '/pawtrail-game/actor-studio/illustrations/amber-outrider/v2-5a17b27d3162',
    nativeSize: [160, 240],
    style: 'Refined cel',
    motion: 'Hair & cape sway',
  },
  yae: {
    name: 'Yae Miko',
    folder: '/pawtrail-game/actor-studio/illustrations/yae-miko/v1-3d798d294407',
    nativeSize: [160, 240],
    style: 'Refined cel',
    motion: 'Hair & robe sway',
  },
}
