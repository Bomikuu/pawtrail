/** A stage-owned clock: no timer, RAF, React state or listener per asset. */
export class FloorAnimationClock {
  private last: number | null = null
  private elapsed = 0
  private disposed = false
  tick(timestamp: number, visible: boolean, paused: boolean) {
    if (this.disposed || !Number.isFinite(timestamp)) return 0
    if (!visible || paused) { this.last = null; return 0 }
    const delta = this.last === null ? 0 : Math.max(0, Math.min(50, timestamp - this.last))
    this.last = timestamp
    this.elapsed += delta
    return delta
  }
  get timeMs() { return this.elapsed }
  /** Deterministic phase offsets stop all city windows restarting together.
   * Reduced motion returns a stable pose; state feedback is owned separately.
   */
  phase(instanceId: string, durationMs: number, reducedMotion = false) {
    if (this.disposed || !Number.isFinite(durationMs) || durationMs <= 0) return 0
    let hash = 2166136261
    for (const character of instanceId) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619) >>> 0 }
    const offset = hash / 0x100000000
    return reducedMotion ? offset : (this.elapsed / durationMs + offset) % 1
  }
  reset() { if (!this.disposed) { this.elapsed = 0; this.last = null } }
  dispose() { this.disposed = true; this.last = null }
}
