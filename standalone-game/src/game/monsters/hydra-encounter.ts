import { HYDRA, HYDRA_HEADS, type HydraPoint, type HydraAttack, type HydraWindow } from './hydra'

type Cast = { id: HydraAttack; elapsed: number; aim: HydraPoint; origin: HydraPoint; fired: number; landed: boolean }
export type HydraBolt = HydraPoint & { id: number; vx: number; vz: number; life: number; sourceHeight: number; fallDuration: number }
export function hydraBoltHeight(bolt: HydraBolt) { return .6 + (bolt.sourceHeight - .6) * Math.max(0, 1 - (1800 - bolt.life) / bolt.fallDuration) }
export type HydraCircle = HydraPoint & { radius: number }
export type HydraEvent =
  | { kind: 'damage'; target: 'boss' | 'player'; amount: number; weak?: boolean; point: HydraPoint; attack?: HydraAttack }
  | { kind: 'phase' | 'defeat'; target: 'boss' | 'player'; point: HydraPoint }
export type HydraReport = {
  hp: number; playerHp: number; running: boolean; enraged: boolean; window: HydraWindow;
  cast: HydraAttack | null; progress: number; fireCooldown: number; stompCooldown: number;
  log: string[]; phaseElapsed: number; weak: boolean
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))
const distance = (a: HydraPoint, b: HydraPoint) => Math.hypot(a.x - b.x, a.z - b.z)
const bounded = (p: HydraPoint) => ({ x: clamp(p.x, -5, 5), z: clamp(p.z, -3.7, 4.2) })
function segmentDistance(p: HydraPoint, a: HydraPoint, b: HydraPoint) {
  const dx = b.x - a.x, dz = b.z - a.z, t = clamp(((p.x - a.x) * dx + (p.z - a.z) * dz) / Math.max(.00001, dx * dx + dz * dz), 0, 1)
  return distance(p, { x: a.x + dx * t, z: a.z + dz * t })
}

/** The simulation owns contact and phase state; the rendered rig never awards damage. */
export class HydraEncounter {
  hp: number = HYDRA.maxHp
  playerHp = 100
  running = false
  enraged = false
  clock = 0
  position: HydraPoint = { x: 0, z: -2.1 }
  facing = 0
  cast: Cast | null = null
  bolts: HydraBolt[] = []
  moving = false
  phaseElapsed = 9999
  deathElapsed = 0
  hurtUntil = 0
  private serial = 0
  private fireReady = 0
  private stompReady = 0
  private nextAttack = 1700
  private invulnerableUntil = 0
  private seen = new Set<string>()
  private log = ['Move with WASD. J strikes with Amber’s equipped sword; K uses its ultimate.']
  constructor(private emit: (event: HydraEvent) => void) {}
  get config() { return this.enraged ? HYDRA.enraged : HYDRA.normal }
  get weak() { return this.window() === 'recovery' }
  private note(message: string) { this.log = [message, ...this.log].slice(0, 6) }
  start() { if (this.hp > 0 && this.playerHp > 0) this.running = true }
  pause() { this.running = false; this.cancel(); this.moving = false }
  cancel() { this.cast = null; this.bolts = [] }
  reset() {
    this.pause(); this.hp = HYDRA.maxHp; this.playerHp = 100; this.enraged = false
    this.clock = 0; this.position = { x: 0, z: -2.1 }; this.facing = 0; this.phaseElapsed = 9999; this.deathElapsed = 0
    this.fireReady = this.stompReady = this.invulnerableUntil = this.hurtUntil = 0; this.nextAttack = 1700; this.seen.clear(); this.serial = 0
    this.log = ['Reset · full HP, normal phase and cooldowns restored.']
  }
  /** Explicit authoring control changes real local HP; never presented as a combat hit. */
  rehearseEnrage() {
    if (this.hp <= 0 || this.enraged) return
    this.hp = Math.min(this.hp, Math.floor(HYDRA.maxHp * HYDRA.enrageAt)); this.enrage()
    this.note('Phase rehearsal · local boss HP set to 30%. No strike or reward recorded.')
  }
  private enrage() {
    if (this.enraged) return
    this.enraged = true; this.phaseElapsed = 0; this.cancel(); this.moving = false
    this.fireReady = this.stompReady = this.clock + 1800; this.nextAttack = this.clock + 1800
    this.note('ENRAGED · ember scales, longer fire fans, larger stomp with three satellite blasts, shorter cooldowns.')
    this.emit({ kind: 'phase', target: 'boss', point: { ...this.position } })
  }
  window(): HydraWindow {
    if (this.hp <= 0) return 'defeated'
    if (this.phaseElapsed < 1800) return 'enraging'
    const c = this.cast
    if (!c) return this.moving ? 'chasing' : 'idle'
    if (c.id === 'ember-barrage') return c.elapsed < 1000 ? 'warning' : c.elapsed < 1000 + this.config.fireDuration ? 'firing' : 'recovery'
    if (c.elapsed < 1000) return 'warning'
    if (c.elapsed < 1500) return 'ascending'
    if (c.elapsed < 2050) return 'airborne'
    if (c.elapsed < 2700) return 'landing'
    return 'recovery'
  }
  get lift() {
    const c = this.cast
    if (!c || c.id !== 'skyfall-stomp') return 0
    if (c.elapsed < 1000) return 0
    if (c.elapsed < 1500) return (c.elapsed - 1000) / 500 * 2.8
    if (c.elapsed < 2050) return 2.8
    return Math.max(0, 1 - (c.elapsed - 2050) / 400) * 2.8
  }
  circles(): HydraCircle[] {
    if (!this.cast || this.cast.id !== 'skyfall-stomp') return []
    const p = this.cast.aim, circles: HydraCircle[] = [{ ...p, radius: this.config.stompRadius }]
    if (this.enraged) for (let i = 0; i < 3; i++) {
      const angle = i * Math.PI * 2 / 3
      // The identical authored circles drive both ground warnings and contact.
      circles.push({ x: p.x + Math.cos(angle) * 2.7, z: p.z + Math.sin(angle) * 2.7, radius: 1.1 })
    }
    return circles
  }
  attack(id: HydraAttack, player: HydraPoint) {
    if (!this.running || this.cast || this.phaseElapsed < 1800 || this.hp <= 0) return false
    if (this.clock < (id === 'ember-barrage' ? this.fireReady : this.stompReady)) return false
    this.cast = { id, elapsed: 0, aim: bounded(player), origin: { ...this.position }, fired: 0, landed: false }
    this.moving = false
    if (id === 'ember-barrage') this.fireReady = this.clock + this.config.fireCooldown
    else this.stompReady = this.clock + this.config.stompCooldown
    this.note(id === 'ember-barrage' ? 'Heads draw back · sustained fire incoming. Strafe away from the mouth line.' : 'Skyfall · landing location locked. Leave the orange circles!')
    return true
  }
  hit(id: string, amount: number) {
    if (!this.running || this.hp <= 0 || this.lift > .5 || this.phaseElapsed < 1800 || this.seen.has(id)) return false
    this.seen.add(id); if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!)
    const weak = this.weak, applied = Math.min(this.hp, Math.round(amount * (weak ? 1.65 : .75)))
    this.hp -= applied; this.hurtUntil = this.clock + 180
    this.emit({ kind: 'damage', target: 'boss', amount: applied, weak, point: { ...this.position } })
    if (this.hp <= 0) { this.cancel(); this.running = false; this.moving = false; this.note('Kaedros defeated · local encounter only.'); this.emit({ kind: 'defeat', target: 'boss', point: { ...this.position } }) }
    else if (!this.enraged && this.hp <= HYDRA.maxHp * HYDRA.enrageAt) this.enrage()
    return true
  }
  private damage(amount: number, point: HydraPoint, attack: HydraAttack) {
    if (this.clock < this.invulnerableUntil || this.playerHp <= 0) return
    const applied = Math.min(this.playerHp, amount); this.playerHp -= applied; this.invulnerableUntil = this.clock + 400
    this.emit({ kind: 'damage', target: 'player', amount: applied, point: { ...point }, attack })
    if (this.playerHp <= 0) { this.running = false; this.cancel(); this.note('Amber is down · reset to retry.'); this.emit({ kind: 'defeat', target: 'player', point: { ...point } }) }
  }
  advance(delta: number, player: HydraPoint) {
    const dt = clamp(delta, 0, 50)
    if (this.hp <= 0) { this.deathElapsed += dt; return }
    if (!this.running) return
    this.clock += dt; this.phaseElapsed += dt
    const direction = Math.atan2(player.x - this.position.x, player.z - this.position.z)
    const diff = Math.atan2(Math.sin(direction - this.facing), Math.cos(direction - this.facing))
    this.facing += clamp(diff, -dt * .002, dt * .002)
    this.moving = false
    if (!this.cast && this.phaseElapsed >= 1800) {
      const d = distance(player, this.position)
      if (d > 2.4) {
        const step = Math.min(d - 2.4, this.config.speed * dt / 1000)
        this.position = bounded({ x: this.position.x + Math.sin(direction) * step, z: this.position.z + Math.cos(direction) * step }); this.moving = step > 0
      }
      if (this.clock >= this.nextAttack) {
        const stomp = this.clock >= this.stompReady && (d < 3.7 || this.clock < this.fireReady)
        if (!this.attack(stomp ? 'skyfall-stomp' : 'ember-barrage', player) && this.clock >= this.stompReady) this.attack('skyfall-stomp', player)
      }
    }
    const c = this.cast
    if (c) {
      c.elapsed += dt
      if (c.id === 'ember-barrage') {
        const fireTime = c.elapsed - 1000
        if (fireTime >= 0 && fireTime < this.config.fireDuration) {
          const count = Math.floor(fireTime / this.config.fireInterval) + 1
          while (c.fired < count) {
            const head = c.fired++ % 5, lower = HYDRA_HEADS.fireLower
            const origin = { x: this.position.x + HYDRA_HEADS.x[head] * (1 - lower * .55), z: this.position.z + .38 + lower * .75 }
            const aimAngle = Math.atan2(player.x - origin.x, player.z - origin.z)
            const aimDelta = Math.atan2(Math.sin(aimAngle - this.facing), Math.cos(aimAngle - this.facing))
            const angle = this.facing + clamp(aimDelta, -.6, .6) + (this.enraged ? (head - 2) * .06 : 0)
            const sourceHeight = HYDRA_HEADS.heights[head] * (1 - lower) + 1.25 * lower + .22
            const fallDuration = Math.max(220, distance(origin, player) / 6.5 * 1000)
            for (const offset of this.enraged ? [-.14, .14] : [0]) if (this.bolts.length < 80) this.bolts.push({ ...origin, id: ++this.serial, vx: Math.sin(angle + offset) * 6.5, vz: Math.cos(angle + offset) * 6.5, life: 1800, sourceHeight, fallDuration })
          }
        }
        if (c.elapsed >= 1000 + this.config.fireDuration + 1100) { this.cast = null; this.nextAttack = this.clock + this.config.rest }
      } else {
        if (c.elapsed >= 1500 && c.elapsed <= 2450) {
          const travel = clamp((c.elapsed - 1500) / 550, 0, 1)
          this.position = { x: c.origin.x + (c.aim.x - c.origin.x) * travel, z: c.origin.z + (c.aim.z - c.origin.z) * travel }
        }
        if (c.elapsed >= 2450 && !c.landed) {
          c.landed = true
          if (this.circles().some(circle => distance(player, circle) <= circle.radius + .22)) this.damage(this.enraged ? 34 : 26, player, c.id)
        }
        if (c.elapsed >= 3650) { this.cast = null; this.nextAttack = this.clock + this.config.rest }
      }
    }
    // Swept contact avoids fast embers tunnelling through the player at low FPS.
    for (let i = this.bolts.length - 1; i >= 0; i--) {
      const b = this.bolts[i], previous = { x: b.x, z: b.z }
      b.x += b.vx * dt / 1000; b.z += b.vz * dt / 1000; b.life -= dt
      if (hydraBoltHeight(b) <= 1.15 && segmentDistance(player, previous, b) < .32) { this.bolts.splice(i, 1); this.damage(this.enraged ? 10 : 8, player, 'ember-barrage'); if (!this.running) break }
      else if (b.life <= 0 || Math.abs(b.x) > 9 || Math.abs(b.z) > 7) this.bolts.splice(i, 1)
    }
  }
  report(): HydraReport {
    return { hp: this.hp, playerHp: this.playerHp, running: this.running, enraged: this.enraged, window: this.window(), cast: this.cast?.id ?? null,
      progress: this.cast ? clamp(this.cast.elapsed / (this.cast.id === 'skyfall-stomp' ? 3650 : 2100 + this.config.fireDuration), 0, 1) : 0,
      fireCooldown: Math.max(0, this.fireReady - this.clock), stompCooldown: Math.max(0, this.stompReady - this.clock), log: [...this.log], phaseElapsed: this.phaseElapsed, weak: this.weak }
  }
}
