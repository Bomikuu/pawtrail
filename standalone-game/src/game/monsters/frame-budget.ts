export const MONSTER_FRAME_INTERVAL = 1000 / 30

/** A paused/idle preview only draws on a camera, size or control change. */
export function needsMonsterFrame(dirty: boolean, running: boolean, deathAnimating: boolean, effects: boolean, elapsed: number) {
  return dirty || ((running || deathAnimating || effects) && elapsed >= MONSTER_FRAME_INTERVAL)
}
