import { ARENA_DEFINITIONS } from './arena-definitions'
import type { ArenaCircle, ArenaEncounter, ArenaEvent, ArenaPoint, ArenaReport } from './arena-contract'
import manifest from '../../../assets/monster-studio/morvane-ossuary-serpent/manifest.json'

const DEF = ARENA_DEFINITIONS.serpent
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const distance = (a: ArenaPoint, b: ArenaPoint) => Math.hypot(a.x - b.x, a.z - b.z)
const bounded = (p: ArenaPoint) => ({ x: clamp(p.x, -DEF.arena.boundsX + .6, DEF.arena.boundsX - .6), z: clamp(p.z, -DEF.arena.boundsZ + .6, DEF.arena.boundsZ - .6) })
type SerpentCast = { id: string; elapsed: number; aim: ArenaPoint; origin: ArenaPoint; hazards: ArenaCircle[]; struck: Set<number> }

/** One HP pool and a distance-constrained trail, rather than a long sliding poster. */
export class SerpentEncounter implements ArenaEncounter {
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
  readonly lift = 0
  cast: SerpentCast | null = null
  segments: ArenaPoint[] = []
  travelled = 0
  private biteReady = 0
  private waveReady = 0
  private nextAttack = 2000
  private invulnerableUntil = 0
  private seen = new Set<string>()
  private log = ['Morvane follows your footsteps. Run around its long body and watch its skull.']
  constructor(private notify: (event: ArenaEvent) => void) { this.seedBody() }
  get weak() { return this.window() === 'recovery' }
  get skullReachable() { return this.weak || this.cast?.id === 'grave-bite' && this.window() === 'striking' }
  private note(line: string) { this.log = [line, ...this.log].slice(0, 6) }
  private seedBody() {
    this.segments = [{ ...this.position }]
    for (let i = 1; i < manifest.bodySegments; i++) { const previous = this.segments[i - 1], angle = Math.PI - i * .16; this.segments.push({ x: previous.x + Math.sin(angle) * manifest.segmentSpacing, z: previous.z + Math.cos(angle) * manifest.segmentSpacing }) }
  }
  private followBody() {
    this.segments[0] = { ...this.position }
    for (let i = 1; i < this.segments.length; i++) {
      const p = this.segments[i], previous = this.segments[i - 1], d = distance(previous, p)
      if (d > .0001) { p.x = previous.x + (p.x - previous.x) / d * manifest.segmentSpacing; p.z = previous.z + (p.z - previous.z) / d * manifest.segmentSpacing }
    }
  }
  start() { if (this.hp > 0 && this.playerHp > 0) this.running = true }
  pause() { this.running = false; this.cancel(); this.moving = false }
  cancel() { this.cast = null }
  reset() {
    this.pause(); this.hp = DEF.maxHp; this.playerHp = 100; this.enraged = false; this.clock = 0; this.phaseElapsed = 9999; this.deathElapsed = this.hurtUntil = 0
    this.position = { x: 0, z: -1.8 }; this.facing = 0; this.travelled = 0; this.seedBody(); this.biteReady = this.waveReady = this.invulnerableUntil = 0; this.nextAttack = 2000; this.seen.clear()
    this.log = ['Reset · full HP, coiled body, normal form and cooldowns restored.']
  }
  rehearseEnrage() { if (this.enraged || this.hp <= 0) return; this.hp = Math.min(this.hp, Math.floor(DEF.maxHp * DEF.enrageAt)); this.enrage(); this.note('Phase rehearsal · local HP set to 30%. No hit or reward recorded.') }
  private enrage() {
    if (this.enraged) return
    this.enraged = true; this.phaseElapsed = 0; this.cancel(); this.moving = false; this.biteReady = this.waveReady = this.nextAttack = this.clock + 1800
    this.note('CRIMSON MARROW · faster pursuit, wider bite, more rib-wave areas and shorter cooldowns.'); this.notify({ kind: 'phase', target: 'boss', point: { ...this.position } })
  }
  window() {
    if (this.hp <= 0) return 'defeated'
    if (this.phaseElapsed < 1800) return 'enraging'
    if (!this.cast) return this.moving ? 'chasing' : 'idle'
    const c = this.cast, active = c.id === 'grave-bite' ? 1100 : 1200, end = c.id === 'grave-bite' ? 1550 : 2000
    return c.elapsed < active ? 'warning' : c.elapsed < end ? 'striking' : 'recovery'
  }
  circles(): ArenaCircle[] {
    const c = this.cast
    if (!c) return []
    return c.hazards.map((circle, index) => {
      const begins = c.id === 'grave-bite' ? 1100 : 1200 + index * (this.enraged ? 35 : 45)
      return { ...circle, active: c.elapsed >= begins && c.elapsed < begins + (c.id === 'grave-bite' ? 450 : 220), visible: c.elapsed < begins + 500 }
    })
  }
  bodyCircles(): ArenaCircle[] { return this.segments.filter((_, i) => i % 2 === 0).map((p, i) => ({ ...p, radius: i === 0 ? .9 : .32 })) }
  hitRegions() { return this.segments.filter((_, i) => i % 2 === 0).map((p, i) => ({ ...p, id: DEF.id + (i === 0 ? ':skull' : ':rib-' + i * 2), radius: i === 0 ? .85 : .45, eligible: i !== 0 || this.skullReachable })) }
  attack(id: string, player: ArenaPoint) {
    if (!this.running || this.cast || this.phaseElapsed < 1800 || this.hp <= 0 || !['grave-bite', 'ossuary-wave'].includes(id)) return false
    if (this.clock < (id === 'grave-bite' ? this.biteReady : this.waveReady)) return false
    const aim = bounded(player)
    const hazards = id === 'grave-bite' ? [{ ...aim, radius: this.enraged ? 1.5 : 1.05 }] : this.segments.filter((_, i) => i > 1 && i % (this.enraged ? 2 : 3) === 0).map(p => ({ ...p, radius: this.enraged ? 1.12 : .8 }))
    this.cast = { id, elapsed: 0, aim, origin: { ...this.position }, hazards, struck: new Set() }; this.moving = false
    if (id === 'grave-bite') this.biteReady = this.clock + (this.enraged ? 4000 : 6500)
    else this.waveReady = this.clock + (this.enraged ? 7000 : 11000)
    this.note(id === 'grave-bite' ? 'Gravebite · skull draws back; leave the locked bite circle.' : 'Ossuary Ribwave · bone circles are locked along the body. Move clear!')
    return true
  }
  hit(id: string, amount: number, region = DEF.id + ':skull') {
    if (!this.running || this.hp <= 0 || this.phaseElapsed < 1800 || this.seen.has(id)) return false
    const skull = region.endsWith(':skull'), weak = skull && this.weak
    if (skull && !this.skullReachable) return false
    const index = skull ? 0 : Number(region.split(':rib-')[1])
    if (!Number.isInteger(index) || !this.segments[index]) return false
    this.seen.add(id); if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!)
    const applied = Math.min(this.hp, Math.round(amount * (weak ? 1.65 : skull ? 1 : .65))); this.hp -= applied; this.hurtUntil = this.clock + 180
    this.notify({ kind: 'damage', target: 'boss', amount: applied, weak, point: { ...this.segments[index] }, height: skull ? 1.35 : .7, label: weak ? DEF.weakLabel : skull ? 'Crowned skull' : DEF.armorLabel })
    if (this.hp <= 0) { this.running = false; this.moving = false; this.cancel(); this.note('Morvane defeated · the binding is broken.'); this.notify({ kind: 'defeat', target: 'boss', point: { ...this.position } }) }
    else if (!this.enraged && this.hp <= DEF.maxHp * DEF.enrageAt) this.enrage()
    return true
  }
  private damage(amount: number, player: ArenaPoint, attack: string) {
    if (this.clock < this.invulnerableUntil || this.playerHp <= 0) return
    const applied = Math.min(this.playerHp, amount); this.playerHp -= applied; this.invulnerableUntil = this.clock + 500
    this.notify({ kind: 'damage', target: 'player', amount: applied, point: { ...player }, attack })
    if (this.playerHp <= 0) { this.running = false; this.cancel(); this.moving = false; this.note('Amber is down · reset to retry.'); this.notify({ kind: 'defeat', target: 'player', point: { ...player } }) }
  }
  advance(delta: number, player: ArenaPoint) {
    const dt = clamp(delta, 0, 50)
    if (this.hp <= 0) { this.deathElapsed += dt; return }
    if (!this.running) return
    this.clock += dt; this.phaseElapsed += dt; this.moving = false
    const before = { ...this.position }, wanted = Math.atan2(player.x - this.position.x, player.z - this.position.z)
    const turn = Math.atan2(Math.sin(wanted - this.facing), Math.cos(wanted - this.facing)); this.facing += clamp(turn, -dt * .0021, dt * .0021)
    if (this.phaseElapsed >= 1800 && !this.cast) {
      const d = distance(player, this.position)
      if (d > 1.65) { const step = Math.min(d - 1.65, (this.enraged ? 2.3 : 1.65) * dt / 1000); this.position = bounded({ x: this.position.x + Math.sin(this.facing) * step, z: this.position.z + Math.cos(this.facing) * step }); this.moving = step > 0 }
      if (this.clock >= this.nextAttack) {
        if (d < 3 && this.clock >= this.biteReady) this.attack('grave-bite', player)
        else if (this.clock >= this.waveReady && this.segments.some(segment => distance(player, segment) < (this.enraged ? 2.5 : 1.8))) this.attack('ossuary-wave', player)
        else if (d < 4 && this.clock >= this.biteReady) this.attack('grave-bite', player)
      }
    }
    const c = this.cast
    if (c) {
      c.elapsed += dt
      if (c.id === 'grave-bite' && c.elapsed >= 1100 && c.elapsed <= 1400) {
        const p = clamp((c.elapsed - 1100) / 300, 0, 1)
        this.position = { x: c.origin.x + (c.aim.x - c.origin.x) * p, z: c.origin.z + (c.aim.z - c.origin.z) * p }
      }
      for (let index = 0; index < c.hazards.length; index++) {
        const contact = c.id === 'grave-bite' ? 1400 : 1200 + index * (this.enraged ? 35 : 45)
        if (c.elapsed >= contact && !c.struck.has(index)) { c.struck.add(index); if (distance(player, c.hazards[index]) < c.hazards[index].radius + .2) this.damage(c.id === 'grave-bite' ? this.enraged ? 32 : 24 : this.enraged ? 26 : 18, player, c.id) }
      }
      if (c.elapsed >= (c.id === 'grave-bite' ? 2650 : 3050)) { this.cast = null; this.nextAttack = this.clock + (this.enraged ? 650 : 1200) }
    }
    this.travelled += distance(before, this.position); this.followBody()
  }
  report(): ArenaReport { return { hp: this.hp, playerHp: this.playerHp, running: this.running, enraged: this.enraged, window: this.window(), cast: this.cast?.id ?? null, progress: this.cast ? Math.min(1, this.cast.elapsed / (this.cast.id === 'grave-bite' ? 2650 : 3050)) : 0, fireCooldown: Math.max(0, this.biteReady - this.clock), stompCooldown: Math.max(0, this.waveReady - this.clock), log: [...this.log], phaseElapsed: this.phaseElapsed, weak: this.weak } }
}
