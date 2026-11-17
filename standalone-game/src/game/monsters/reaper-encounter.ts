import { ARENA_DEFINITIONS } from './arena-definitions'
import type { ArenaEncounter, ArenaEvent, ArenaPoint, ArenaReport } from './arena-contract'

const DEF = ARENA_DEFINITIONS.reaper
export const REAPER_RULES = {
  normal: { speed: 1.45, arcRadius: 3.1, arcAngle: 150, arcCooldown: 7200, ringInner: 1.4, ringOuter: 4.4, ringCooldown: 11200, rest: 1200 },
  enraged: { speed: 2.05, arcRadius: 4, arcAngle: 195, arcCooldown: 4300, ringInner: 1.1, ringOuter: 5.4, ringCooldown: 6800, rest: 650 },
} as const
export type ReaperArea = { kind: 'sector' | 'ring'; x: number; z: number; inner: number; outer: number; facing: number; angle: number; active: boolean }
type ReaperCast = { id: string; elapsed: number; area: ReaperArea; struck: boolean }
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))

/** Exact shared shape data drives both contact and the visible sector/ring. */
export function inReaperArea(player: ArenaPoint, area: ReaperArea) {
  const dx = player.x - area.x, dz = player.z - area.z, distance = Math.hypot(dx, dz)
  if (distance < area.inner || distance > area.outer) return false
  if (area.kind === 'ring') return true
  const direction = Math.atan2(dx, dz), delta = Math.atan2(Math.sin(direction - area.facing), Math.cos(direction - area.facing))
  return Math.abs(delta) <= area.angle / 2
}

export class ReaperEncounter implements ArenaEncounter {
  hp = DEF.maxHp
  playerHp = 100
  running = false
  enraged = false
  clock = 0
  phaseElapsed = 9999
  deathElapsed = 0
  hurtUntil = 0
  position: ArenaPoint = { x: 0, z: -1.8 }
  facing = 0
  moving = false
  cast: ReaperCast | null = null
  private arcReady = 0
  private eclipseReady = 0
  private nextAttack = 1800
  private seen = new Set<string>()
  private log = ['Vesper hovers toward you. Watch the scythe and the marked ground.']
  constructor(private notify: (event: ArenaEvent) => void) {}
  get config() { return this.enraged ? REAPER_RULES.enraged : REAPER_RULES.normal }
  get weak() { return this.window() === 'recovery' }
  get lift() {
    const hover = .37 + Math.sin(this.clock / 500) * .03
    return hover + (this.cast?.id === 'hollow-eclipse' && this.cast.elapsed < 2100 ? Math.sin(Math.PI * this.cast.elapsed / 2100) * .9 : 0)
  }
  private note(line: string) { this.log = [line, ...this.log].slice(0, 6) }
  start() { if (this.hp > 0 && this.playerHp > 0) this.running = true }
  pause() { this.running = false; this.moving = false; this.cancel() }
  cancel() { this.cast = null }
  reset() {
    this.pause(); this.hp = DEF.maxHp; this.playerHp = 100; this.enraged = false; this.clock = 0; this.phaseElapsed = 9999; this.deathElapsed = this.hurtUntil = 0
    this.position = { x: 0, z: -1.8 }; this.facing = 0; this.arcReady = this.eclipseReady = 0; this.nextAttack = 1800; this.seen.clear()
    this.log = ['Reset · full health, low hover, normal form and cooldowns restored.']
  }
  rehearseEnrage() { if (this.enraged || this.hp <= 0) return; this.hp = Math.min(this.hp, Math.floor(DEF.maxHp * DEF.enrageAt)); this.enrage(); this.note('Phase rehearsal · local HP set to 30%. No hit or reward recorded.') }
  private enrage() {
    if (this.enraged) return
    this.enraged = true; this.phaseElapsed = 0; this.cancel(); this.moving = false; this.arcReady = this.eclipseReady = this.nextAttack = this.clock + 1800
    this.note('HOLLOW ASCENSION · wider crescents, larger Eclipse rings and shorter cooldowns.'); this.notify({ kind: 'phase', target: 'boss', point: { ...this.position } })
  }
  window() {
    if (this.hp <= 0) return 'defeated'
    if (this.phaseElapsed < 1800) return 'enraging'
    if (!this.cast) return this.moving ? 'chasing' : 'idle'
    const windup = this.cast.id === 'reaping-arc' ? 1150 : 1650, end = this.cast.id === 'reaping-arc' ? 1650 : 2150
    return this.cast.elapsed < windup ? 'warning' : this.cast.elapsed < end ? 'striking' : 'recovery'
  }
  circles() { return [] }
  areas(): ReaperArea[] {
    const stage = this.window()
    return this.cast && (stage === 'warning' || stage === 'striking') ? [{ ...this.cast.area, active: stage === 'striking' }] : []
  }
  bodyCircles() { return [{ ...this.position, radius: .7 }] }
  hitRegions() { return [{ ...this.position, id: DEF.id, radius: .75, eligible: this.lift < .5 }] }
  attack(id: string, player: ArenaPoint) {
    if (!this.running || this.cast || this.hp <= 0 || this.phaseElapsed < 1800 || !['reaping-arc', 'hollow-eclipse'].includes(id)) return false
    const arc = id === 'reaping-arc'
    if (this.clock < (arc ? this.arcReady : this.eclipseReady)) return false
    this.facing = Math.atan2(player.x - this.position.x, player.z - this.position.z)
    const area: ReaperArea = { kind: arc ? 'sector' : 'ring', ...this.position, inner: arc ? 0 : this.config.ringInner, outer: arc ? this.config.arcRadius : this.config.ringOuter, facing: this.facing, angle: arc ? this.config.arcAngle * Math.PI / 180 : Math.PI * 2, active: false }
    this.cast = { id, elapsed: 0, area, struck: false }; this.moving = false
    if (arc) this.arcReady = this.clock + this.config.arcCooldown
    else this.eclipseReady = this.clock + this.config.ringCooldown
    this.note(arc ? 'Reaping Crescent · scythe winds back. Get behind Vesper or leave the sector!' : 'Hollow Eclipse · Vesper rises. The unmarked inner circle is safe!')
    return true
  }
  hit(id: string, amount: number) {
    if (!this.running || this.hp <= 0 || this.phaseElapsed < 1800 || this.lift >= .5 || this.seen.has(id)) return false
    this.seen.add(id); if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!)
    const weak = this.weak, applied = Math.min(this.hp, Math.round(amount * (weak ? 1.65 : .7))); this.hp -= applied; this.hurtUntil = this.clock + 180
    this.notify({ kind: 'damage', target: 'boss', amount: applied, weak, point: { ...this.position }, height: 1.6 + this.lift })
    if (this.hp <= 0) { this.running = false; this.moving = false; this.cancel(); this.note('Vesper defeated · the binding dissolves.'); this.notify({ kind: 'defeat', target: 'boss', point: { ...this.position } }) }
    else if (!this.enraged && this.hp <= DEF.maxHp * DEF.enrageAt) this.enrage()
    return true
  }
  private damage(amount: number, player: ArenaPoint, attack: string) {
    if (this.playerHp <= 0) return
    const applied = Math.min(this.playerHp, amount); this.playerHp -= applied
    this.notify({ kind: 'damage', target: 'player', amount: applied, point: { ...player }, attack })
    if (this.playerHp <= 0) { this.running = false; this.cancel(); this.note('Amber is down · reset to retry.'); this.notify({ kind: 'defeat', target: 'player', point: { ...player } }) }
  }
  advance(delta: number, player: ArenaPoint) {
    const dt = clamp(delta, 0, 50)
    if (this.hp <= 0) { this.deathElapsed += dt; return }
    if (!this.running) return
    this.clock += dt; this.phaseElapsed += dt; this.moving = false
    if (!this.cast && this.phaseElapsed >= 1800) {
      const dx = player.x - this.position.x, dz = player.z - this.position.z, d = Math.hypot(dx, dz), target = Math.atan2(dx, dz)
      this.facing += clamp(Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing)), -dt * .002, dt * .002)
      if (d > 2.45) { const step = Math.min(d - 2.45, this.config.speed * dt / 1000); this.position = { x: clamp(this.position.x + Math.sin(this.facing) * step, -6.2, 6.2), z: clamp(this.position.z + Math.cos(this.facing) * step, -4.2, 4.2) }; this.moving = true }
      if (this.clock >= this.nextAttack && d < this.config.arcRadius) {
        if (this.clock >= this.arcReady) this.attack('reaping-arc', player)
        else if (this.clock >= this.eclipseReady) this.attack('hollow-eclipse', player)
      }
    }
    const cast = this.cast
    if (cast) {
      cast.elapsed += dt
      const contact = cast.id === 'reaping-arc' ? 1400 : 1900
      if (cast.elapsed >= contact && !cast.struck) { cast.struck = true; if (inReaperArea(player, cast.area)) this.damage(cast.id === 'reaping-arc' ? this.enraged ? 34 : 26 : this.enraged ? 38 : 30, player, cast.id) }
      if (cast.elapsed >= (cast.id === 'reaping-arc' ? 2900 : 3350)) { this.cast = null; this.nextAttack = this.clock + this.config.rest }
    }
  }
  report(): ArenaReport { return { hp: this.hp, playerHp: this.playerHp, running: this.running, enraged: this.enraged, window: this.window(), cast: this.cast?.id ?? null, progress: this.cast ? Math.min(1, this.cast.elapsed / (this.cast.id === 'reaping-arc' ? 2900 : 3350)) : 0, fireCooldown: Math.max(0, this.arcReady - this.clock), stompCooldown: Math.max(0, this.eclipseReady - this.clock), log: [...this.log], phaseElapsed: this.phaseElapsed, weak: this.weak } }
}
