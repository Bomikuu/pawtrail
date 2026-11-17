import { ATTACKS, HEADS, VAELRITH, headX, type AttackId, type GroundPoint, type HeadId } from './vaelrith'
import { chooseFireTiles, inFireTile } from './fire'

export type BossCast = { id: AttackId; elapsed: number; aim: GroundPoint; damaged: Set<number>; fireTiles: GroundPoint[] }
export type BossPhase = 'bound' | 'fracturing' | 'riftstorm'
export type BossReport = {
  hp: number; playerHp: number; phase: BossPhase; running: boolean; defeated: boolean;
  cast: AttackId | null; window: 'idle' | 'preparation' | 'active' | 'recovery' | 'stagger' | 'defeated';
  progress: number; log: string[]; cooldowns: Partial<Record<AttackId, number>>;
}
export type BossCue = 'awakening' | 'warning' | 'breath' | 'hurt' | 'stagger' | 'defeat'
export type BossCombatEvent =
  | { kind: 'damage'; target: 'boss'; amount: number; region: string; weak: boolean }
  | { kind: 'damage'; target: 'player'; amount: number; attack: AttackId }
  | { kind: 'phase'; phase: BossPhase }
  | { kind: 'stagger' }
  | { kind: 'defeat'; target: 'boss' | 'player' }
/** One local HP pool, timeline-based damage and no asynchronous attack timers. */
export class MonsterEncounter {
  hp: number = VAELRITH.maxHp
  playerHp = 100
  phase: BossPhase = 'bound'
  cast: BossCast | null = null
  running = false
  clock = 0
  staggerUntil = 0
  hurtUntil = 0
  hurtHead: HeadId | null = null
  deathElapsed = 0
  readonly log: string[] = ['Local rehearsal ready. No online rewards.']
  private cooldowns = new Map<AttackId, number>()
  private applied = new Set<string>()
  private serial = 0
  private nextAttack = 0
  private activeNotified = false
  constructor(private cue: (cue: BossCue) => void = () => {}, private random: () => number = Math.random, private notify: (event: BossCombatEvent) => void = () => {}) {}
  private note(text: string) { this.log.unshift(text); this.log.length = Math.min(8, this.log.length) }
  start() { if (this.hp <= 0 || this.playerHp <= 0) return; this.running = true; this.nextAttack = this.clock + 1100; this.cue('awakening') }
  pause() { this.running = false; this.cancel(); this.note('Paused; all attack windows cancelled.') }
  cancel() { this.cast = null; this.activeNotified = false }
  reset() {
    this.running = false; this.cancel(); this.hp = VAELRITH.maxHp; this.playerHp = 100
    this.phase = 'bound'; this.clock = 0; this.staggerUntil = 0; this.nextAttack = 0
    this.hurtUntil = 0; this.hurtHead = null; this.deathElapsed = 0
    this.cooldowns.clear(); this.applied.clear(); this.serial = 0
    this.log.splice(0, this.log.length, 'Encounter reset. All ten bars restored.')
  }
  attack(id: AttackId, player: GroundPoint) {
    if (!this.running || this.cast || this.hp <= 0 || this.playerHp <= 0 || this.clock < this.staggerUntil || (this.cooldowns.get(id) ?? 0) > this.clock) return false
    if (id === 'seal-rupture' && this.phase !== 'riftstorm') return false
    const spec = ATTACKS[id]
    this.cast = { id, elapsed: 0, aim: { x: Math.max(-6.5, Math.min(6.5, player.x)), z: Math.max(2, Math.min(6, player.z)) }, damaged: new Set(), fireTiles: id === 'riftfire-rain' ? chooseFireTiles(this.random) : [] }
    this.cooldowns.set(id, this.clock + spec.cooldown); this.activeNotified = false
    this.note(spec.name + ' · warning'); this.cue('warning'); return true
  }
  window(): BossReport['window'] {
    if (this.hp <= 0) return 'defeated'
    if (this.clock < this.staggerUntil) return 'stagger'
    if (!this.cast) return 'idle'
    const a = ATTACKS[this.cast.id]
    return this.cast.elapsed < a.preparation ? 'preparation' : this.cast.elapsed < a.preparation + a.active ? 'active' : 'recovery'
  }
  exposed(head: HeadId) {
    if (this.hp <= 0) return false
    if (this.clock < this.staggerUntil) return true
    return !!this.cast && this.window() === 'recovery' && (ATTACKS[this.cast.id].head === head || ATTACKS[this.cast.id].head === 'all')
  }
  sealExposed() { return this.cast?.id === 'seal-rupture' && this.window() === 'recovery' }
  /** Shared by visible floor geometry and damage evaluation. Coordinates are player heights. */
  inDanger(point: GroundPoint, cast = this.cast) {
    if (!cast) return false
    if (cast.id === 'riftfire-rain') return inFireTile(point, cast.fireTiles)
    if (cast.id === 'rift-fang') return Math.hypot(point.x - cast.aim.x, point.z - cast.aim.z) <= 1.05
    if (cast.id === 'obsidian-sweep') return point.x >= -6.8 && point.x <= 6.8 && point.z >= 1.7 && point.z <= 3.7
    if (cast.id === 'seal-rupture') return HEADS.some(h => Math.abs(point.x - headX[h]) <= .65) && point.z >= 1.4 && point.z <= 9
    const dz = point.z - 1.7, aimX = cast.aim.x, aimZ = cast.aim.z - 1.7
    const distance = Math.hypot(point.x, dz), length = Math.hypot(aimX, aimZ)
    return distance <= 8 && distance > 0 && (point.x * aimX + dz * aimZ) / (distance * length) >= Math.cos(.26)
  }
  /** A strike touching multiple heads/sockets is submitted once with its best eligible region. */
  hit(strikeId: string, baseDamage: number, region: string) {
    if (!this.running || this.hp <= 0 || this.playerHp <= 0 || this.applied.has(strikeId) || !Number.isFinite(baseDamage) || baseDamage <= 0) return 0
    const head = region.split(':')[1] as HeadId
    if (!HEADS.includes(head) || !['seal:' + head, 'throat:' + head].includes(region)) return 0
    const weak = region.startsWith('throat:') && this.exposed(head)
    if (region.startsWith('throat:') && !weak) return 0
    const damage = Math.min(this.hp, Math.round(baseDamage * (weak ? 2 : .5)))
    if (damage <= 0) return 0
    this.applied.add(strikeId)
    if (this.applied.size > 512) this.applied.delete(this.applied.values().next().value!)
    this.hurtUntil = this.clock + 220; this.hurtHead = head
    this.hp = Math.max(0, this.hp - damage); this.note(`${weak ? 'Exposed throat' : 'Armored seal'} · −${damage} HP`)
    this.notify({ kind: 'damage', target: 'boss', amount: damage, region, weak })
    this.cue('hurt')
    if (this.hp <= 0) {
      this.cancel(); this.running = false; this.staggerUntil = 0; this.note('Vaelrith defeated. Rehearsal only.'); this.cue('defeat'); this.notify({ kind: 'defeat', target: 'boss' }); return damage
    }
    const phase: BossPhase = this.hp / VAELRITH.maxHp <= .3 ? 'riftstorm' : this.hp / VAELRITH.maxHp <= .65 ? 'fracturing' : 'bound'
    if (phase !== this.phase) {
      this.phase = phase; this.cancel(); this.nextAttack = this.clock + 1700; this.note('Phase · ' + phase)
      this.notify({ kind: 'phase', phase })
    } else if (region.startsWith('seal:') && this.sealExposed()) {
      this.staggerUntil = this.clock + 2200; this.cancel(); this.nextAttack = this.staggerUntil + 700
      this.note('Seal broken · all heads staggered'); this.cue('stagger')
      this.notify({ kind: 'stagger' })
    }
    return damage
  }
  advance(delta: number, player: GroundPoint) {
    const dt = Math.max(0, Math.min(50, Number.isFinite(delta) ? delta : 0))
    if (this.hp <= 0) { this.deathElapsed = Math.min(1200, this.deathElapsed + dt); return }
    if (!this.running) return
    this.clock += dt
    if (!this.cast && this.clock >= this.staggerUntil && this.clock >= this.nextAttack) {
      const rotation: AttackId[] = this.phase === 'riftstorm' ? ['rift-fang', 'violet-exhalation', 'obsidian-sweep', 'riftfire-rain', 'seal-rupture'] : ['rift-fang', 'violet-exhalation', 'obsidian-sweep', 'riftfire-rain']
      const eligible = rotation.filter(id => (this.cooldowns.get(id) ?? 0) <= this.clock)
      if (eligible.length) this.attack(eligible[this.serial++ % eligible.length], player)
    }
    const cast = this.cast
    if (!cast) return
    const a = ATTACKS[cast.id], before = cast.elapsed; cast.elapsed += dt
    if (!this.activeNotified && cast.elapsed >= a.preparation) { this.activeNotified = true; this.cue('breath') }
    // Tick intersections also cover a short active interval crossed by one frame.
    const count = a.tick ? Math.ceil(a.active / a.tick) : 1
    for (let tick = 0; tick < count; tick++) {
      const start = a.preparation + tick * a.tick, end = a.tick ? Math.min(a.preparation + a.active, start + a.tick) : a.preparation + a.active
      if (cast.elapsed >= start && before < end && !cast.damaged.has(tick) && this.inDanger(player, cast)) {
        const damage = Math.min(this.playerHp, a.damage)
        cast.damaged.add(tick); this.playerHp -= damage
        this.note(`${a.name} · player −${damage} HP`)
        if (damage > 0) this.notify({ kind: 'damage', target: 'player', amount: damage, attack: cast.id })
      }
    }
    if (this.playerHp <= 0) { this.running = false; this.cancel(); this.note('Player down. Reset to retry.'); this.notify({ kind: 'defeat', target: 'player' }); return }
    if (cast.elapsed >= a.preparation + a.active + a.recovery) { this.cancel(); this.nextAttack = this.clock + 1000 }
  }
  report(): BossReport {
    const a = this.cast && ATTACKS[this.cast.id]
    return { hp: this.hp, playerHp: this.playerHp, phase: this.phase, running: this.running, defeated: this.hp <= 0,
      cast: this.cast?.id ?? null, window: this.window(), progress: this.cast && a ? this.cast.elapsed / (a.preparation + a.active + a.recovery) : 0,
      log: [...this.log], cooldowns: Object.fromEntries([...this.cooldowns].map(([id, until]) => [id, Math.max(0, until - this.clock)])) }
  }
}
