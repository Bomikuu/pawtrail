import type { ArenaEncounter, ArenaEvent, ArenaPoint, ArenaReport } from './arena-contract'
import type { FamilyCreature, FamilySkill } from './family-catalog'
import { inReaperArea, type ReaperArea } from './reaper-encounter'

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
export function familyAreaShape(skill: FamilySkill, enraged: boolean) {
  return { inner: skill.shape === 'ring' ? skill.inner * (enraged ? .8 : 1) : 0,
    outer: skill.outer * (enraged ? 1.25 : 1),
    angle: skill.shape === 'sector' ? Math.min(360, skill.angle * (enraged ? 1.15 : 1)) * Math.PI / 180 : Math.PI * 2 }
}
type Cast = { skill: FamilySkill; elapsed: number; area: ReaperArea; contacted: boolean }

/** One selected subordinate, using the boss arena's real player and hit pipeline. */
export class FamilyEncounter implements ArenaEncounter {
  hp: number
  playerHp = 100
  running = false
  enraged = false
  clock = 0
  phaseElapsed = 9999
  deathElapsed = 0
  hurtUntil = 0
  position: ArenaPoint = { x: 0, z: -1.35 }
  moving = false
  facing = 0
  cast: Cast | null = null
  private ready = new Map<string, number>()
  private nextAttack = 1800
  private turn = 0
  private seen = new Set<string>()
  private log: string[]
  constructor(readonly creature: FamilyCreature, private notify: (event: ArenaEvent) => void) {
    this.hp = creature.maxHp
    this.log = [creature.name + ' approaches. Read the warning, then counterattack.']
  }
  get lift() { return this.creature.hover ? this.creature.hover + Math.sin(this.clock / 450) * .018 : 0 }
  get weak() { return this.window() === 'recovery' }
  get frame() {
    if (this.hp <= 0 || this.clock < this.hurtUntil) return 'hurt'
    const state = this.window()
    return state === 'warning' ? 'windup' : state === 'striking' ? 'attack' : this.moving && Math.floor(this.clock / 180) % 2 ? 'walk' : 'idle'
  }
  private note(line: string) { this.log = [line, ...this.log].slice(0, 6) }
  start() { if (this.hp > 0 && this.playerHp > 0) this.running = true }
  pause() { this.running = false; this.moving = false; this.cancel() }
  cancel() { this.cast = null }
  reset() {
    this.pause(); this.hp = this.creature.maxHp; this.playerHp = 100; this.enraged = false
    this.clock = this.deathElapsed = this.hurtUntil = this.turn = 0; this.phaseElapsed = 9999
    this.position = { x: 0, z: -1.35 }; this.facing = 0; this.ready.clear(); this.seen.clear(); this.nextAttack = 1800
    this.log = ['Reset · full health, normal form and all skill cooldowns restored.']
  }
  rehearseEnrage() {
    if (this.creature.tier !== 'mini-boss' || this.enraged || this.hp <= 0) return
    this.hp = Math.min(this.hp, Math.floor(this.creature.maxHp * this.creature.enrageAt))
    this.enrage(); this.note('Phase rehearsal · local HP set to 30%. No hit or reward recorded.')
  }
  private enrage() {
    if (this.enraged || this.creature.tier !== 'mini-boss') return
    this.enraged = true; this.phaseElapsed = 0; this.cancel(); this.moving = false
    for (const skill of this.creature.skills) this.ready.set(skill.id, this.clock + 1800)
    this.nextAttack = this.clock + 1800
    this.note('UNBOUND · distinct form, larger areas, faster pursuit and cooldowns.')
    this.notify({ kind: 'phase', target: 'boss', point: { ...this.position } })
  }
  window() {
    if (this.hp <= 0) return 'defeated'
    if (this.phaseElapsed < 1800) return 'enraging'
    if (this.cast) return this.cast.elapsed < this.cast.skill.windup ? 'warning' : this.cast.elapsed < this.cast.skill.windup + this.cast.skill.active ? 'striking' : 'recovery'
    return this.clock < this.hurtUntil ? 'hurt' : this.moving ? 'chasing' : 'idle'
  }
  circles() { return [] }
  areas(): ReaperArea[] {
    const stage = this.window()
    return this.cast && (stage === 'warning' || stage === 'striking') ? [{ ...this.cast.area, active: stage === 'striking' }] : []
  }
  bodyCircles() { return [{ ...this.position, radius: this.creature.radius }] }
  hitRegions() { return [{ ...this.position, id: this.creature.id, radius: this.creature.radius + .12 }] }
  attack(id: string, player: ArenaPoint) {
    const skill = this.creature.skills.find(entry => entry.id === id)
    if (!skill || !this.running || this.cast || this.hp <= 0 || this.phaseElapsed < 1800 || this.clock < (this.ready.get(id) ?? 0)) return false
    this.facing = Math.atan2(player.x - this.position.x, player.z - this.position.z)
    const origin = skill.target === 'player' ? player : this.position
    this.cast = { skill, elapsed: 0, contacted: false, area: {
      kind: skill.shape === 'sector' ? 'sector' : 'ring', ...origin,
      ...familyAreaShape(skill, this.enraged), facing: this.facing, active: false,
    } }
    this.moving = false; this.ready.set(id, this.clock + skill.cooldown * (this.enraged ? .65 : 1))
    this.note(skill.name + ' · ' + skill.description)
    return true
  }
  hit(id: string, amount: number) {
    if (!this.running || this.hp <= 0 || this.phaseElapsed < 1800 || this.seen.has(id) || !Number.isFinite(amount) || amount <= 0) return false
    this.seen.add(id); if (this.seen.size > 256) this.seen.delete(this.seen.values().next().value!)
    const weak = this.weak, applied = Math.min(this.hp, Math.round(amount * (weak ? this.creature.weakMultiplier : this.creature.armor)))
    this.hp -= applied; this.hurtUntil = this.clock + 230
    this.notify({ kind: 'damage', target: 'boss', amount: applied, weak, point: { ...this.position }, height: this.creature.height * .62 + this.lift })
    if (this.hp <= 0) {
      this.running = this.moving = false; this.cancel(); this.note(this.creature.name + ' defeated · local encounter only.')
      this.notify({ kind: 'defeat', target: 'boss', point: { ...this.position } })
    } else if (this.creature.enrageAt > 0 && this.hp <= this.creature.maxHp * this.creature.enrageAt) this.enrage()
    return true
  }
  private damage(player: ArenaPoint, skill: FamilySkill) {
    const applied = Math.min(this.playerHp, Math.round(skill.damage * (this.enraged ? 1.25 : 1)))
    this.playerHp -= applied
    this.notify({ kind: 'damage', target: 'player', amount: applied, point: { ...player }, attack: skill.id })
    if (this.playerHp <= 0) {
      this.running = false; this.cancel(); this.note('Amber is down · reset to retry.')
      this.notify({ kind: 'defeat', target: 'player', point: { ...player } })
    }
  }
  advance(delta: number, player: ArenaPoint) {
    const dt = clamp(delta, 0, 50)
    if (this.hp <= 0) { this.deathElapsed += dt; return }
    if (!this.running) return
    this.clock += dt; this.phaseElapsed += dt; this.moving = false
    if (this.phaseElapsed < 1800) return
    if (!this.cast) {
      const dx = player.x - this.position.x, dz = player.z - this.position.z, distance = Math.hypot(dx, dz)
      const skill = this.creature.skills[this.turn % this.creature.skills.length]
      const reach = skill.target === 'player' ? 3.2 : skill.outer * .78
      const target = Math.atan2(dx, dz)
      this.facing += clamp(Math.atan2(Math.sin(target - this.facing), Math.cos(target - this.facing)), -dt * .004, dt * .004)
      if (distance > reach && distance > 0) {
        const step = Math.min(distance - reach, this.creature.speed * (this.enraged ? 1.3 : 1) * dt / 1000)
        this.position = { x: clamp(this.position.x + dx / distance * step, -5, 5), z: clamp(this.position.z + dz / distance * step, -3.7, 3.7) }
        this.moving = true
      }
      if (this.clock >= this.nextAttack && distance <= reach + .2 && this.attack(skill.id, player)) this.turn++
    }
    const cast = this.cast
    if (!cast) return
    cast.elapsed += dt
    if (cast.elapsed >= cast.skill.windup + 90 && !cast.contacted) {
      cast.contacted = true
      if (inReaperArea(player, cast.area)) this.damage(player, cast.skill)
    }
    if (this.cast && cast.elapsed >= cast.skill.windup + cast.skill.active + cast.skill.recovery) {
      this.cast = null; this.nextAttack = this.clock + (this.enraged ? 400 : 750)
    }
  }
  report(): ArenaReport {
    return { hp: this.hp, playerHp: this.playerHp, running: this.running, enraged: this.enraged,
      window: this.window(), cast: this.cast?.skill.id ?? null,
      progress: this.cast ? Math.min(1, this.cast.elapsed / (this.cast.skill.windup + this.cast.skill.active + this.cast.skill.recovery)) : 0,
      fireCooldown: Math.max(0, (this.ready.get(this.creature.skills[0].id) ?? 0) - this.clock),
      stompCooldown: Math.max(0, (this.ready.get(this.creature.skills[1]?.id ?? '') ?? 0) - this.clock),
      log: [...this.log], phaseElapsed: this.phaseElapsed, weak: this.weak,
      portraitState: this.frame === 'hurt' ? 'hurt' : ['warning','striking','enraging'].includes(this.window()) ? 'threatening' : 'alert' }
  }
}
