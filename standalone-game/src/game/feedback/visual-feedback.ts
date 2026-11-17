export type FeedbackPoint = { x: number; y: number; z: number }
export type FeedbackKind = 'damage' | 'weak' | 'armored' | 'player-damage' | 'blocked' | 'miss' | 'notice' | 'phase' | 'stagger' | 'defeat'
export type FeedbackInput = { kind: FeedbackKind; target: string; group?: string; label: string; position: FeedbackPoint; amount?: number }
export type FeedbackEntry = FeedbackInput & { id: number; age: number; duration: number }
const damageKinds: FeedbackKind[] = ['damage', 'weak', 'armored', 'player-damage']
const colors: Record<FeedbackKind, string> = { damage: '#ffb85a', weak: '#ffdb72', armored: '#efe1c7', 'player-damage': '#ff8174', blocked: '#e4d7c7', miss: '#e4d7c7', notice: '#f5edd9', phase: '#71f0d5', stagger: '#71f0d5', defeat: '#ffcc76' }

/** A projectile still in flight cannot be declared a miss when its cast ends. */
export class ActionFeedbackTracker {
  private receipts = new Map<string, { hit: boolean; blocked: boolean }>()
  begin(id: string) {
    if (this.receipts.size >= 16) this.receipts.delete(this.receipts.keys().next().value!)
    this.receipts.set(id, { hit: false, blocked: false })
  }
  hit(id: string) { const receipt = this.receipts.get(id); if (receipt) receipt.hit = true }
  blocked(id: string) { const receipt = this.receipts.get(id); if (receipt) receipt.blocked = true }
  finish(snapshot: { cast: { id: string } | null; projectiles: readonly { castId: string }[] }) {
    const misses: string[] = []
    for (const [id, receipt] of this.receipts) {
      if (snapshot.cast?.id === id || snapshot.projectiles.some(projectile => projectile.castId === id)) continue
      if (!receipt.hit && !receipt.blocked) misses.push(id)
      this.receipts.delete(id)
    }
    return misses
  }
  clear() { this.receipts.clear() }
}

/** Event-driven, finite-lived receipts. Never infer successful damage from an animation. */
export class VisualFeedbackQueue {
  private active: FeedbackEntry[] = []
  private serial = 0
  latest = ''
  readonly limit = 16
  get entries(): readonly FeedbackEntry[] { return this.active }
  get pending() { return this.active.length > 0 }
  add(input: FeedbackInput) {
    const damage = damageKinds.includes(input.kind)
    if (damage && (!Number.isFinite(input.amount) || input.amount! <= 0)) return
    const amount = damage ? Math.round(input.amount!) : undefined
    if (damage && amount! <= 0) return
    const last = this.active.at(-1)
    if (damage && last && last.age < 100 && last.target === input.target && last.group === input.group && last.kind === input.kind && last.label === input.label) {
      last.amount = (last.amount ?? 0) + amount!; last.age = 0
      this.latest = `${input.target}: −${last.amount} HP · ${input.label}`
      return last
    }
    const entry: FeedbackEntry = { ...input, amount, position: { ...input.position }, id: ++this.serial, age: 0, duration: damage ? 1100 : 1300 }
    if (this.active.length >= this.limit) this.active.shift()
    this.active.push(entry)
    this.latest = damage ? `${input.target}: −${amount} HP · ${input.label}` : input.label
    return entry
  }
  advance(delta: number) {
    const dt = Number.isFinite(delta) ? Math.max(0, delta) : 0
    for (const entry of this.active) entry.age += dt
    this.active = this.active.filter(entry => entry.age < entry.duration)
  }
  clear(summary?: string) { this.active = []; if (summary !== undefined) this.latest = summary }
}

/** Shared Canvas2D overlay, projected by the calling scene; no textures or frame cache. */
export function drawVisualFeedback(context: CanvasRenderingContext2D, feedback: VisualFeedbackQueue, project: (point: FeedbackPoint) => { x: number; y: number }, reducedMotion: boolean) {
  context.save(); context.textAlign = 'center'; context.textBaseline = 'middle'; context.lineJoin = 'round'
  for (const entry of feedback.entries) {
    const screen = project(entry.position), progress = entry.age / entry.duration
    const x = Math.max(65, Math.min(context.canvas.width - 65, screen.x + (entry.id % 3 - 1) * 12)), y = Math.max(24, Math.min(context.canvas.height - 25, screen.y - (reducedMotion ? 0 : progress * 22)))
    context.globalAlpha = Math.min(1, (1 - progress) * 4)
    const damage = entry.amount !== undefined
    context.font = `700 ${entry.kind === 'weak' ? 19 : damage ? 17 : 14}px "Saira Condensed"`
    context.strokeStyle = '#211329'; context.lineWidth = 4; context.fillStyle = colors[entry.kind]
    const text = damage ? '−' + entry.amount!.toLocaleString() : entry.label
    context.strokeText(text, x, y); context.fillText(text, x, y)
    if (damage) {
      context.font = '600 9px "Instrument Sans"'; context.lineWidth = 3
      context.strokeText(entry.label, x, y + 14); context.fillText(entry.label, x, y + 14)
      if (!reducedMotion && entry.age < 150) {
        context.beginPath(); const radius = 5 + entry.age / 35
        context.moveTo(x - radius - 8, y); context.lineTo(x - radius - 3, y)
        context.moveTo(x + radius + 3, y); context.lineTo(x + radius + 8, y)
        context.lineWidth = 1; context.strokeStyle = colors[entry.kind]; context.stroke()
      }
    }
  }
  context.restore()
}
