import { allowsMovingAction } from '../actor-rig/action-layers'

/** A server-owned contact pose wins over movement jitter and movable cosmetic emotes. */
export function resolveInteractionYaw(yaw: number, moving: boolean, action: string, facing: unknown, poseFacing: unknown) {
  if (typeof poseFacing === 'number' && Number.isFinite(poseFacing)) return poseFacing
  if (!moving && !allowsMovingAction(action) && !/^(walk|run|idle|standing|watch)/.test(action)
    && typeof facing === 'number' && Number.isFinite(facing)) return facing
  return yaw
}
