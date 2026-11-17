import type { ArenaEncounter, ArenaEvent, ArenaPoint, ArenaReport } from './arena-contract'
import { DEITY, DEITY_ATTACKS, DEITY_RULES, type DeityAttackId } from './deity'
import { inReaperArea, type ReaperArea } from './reaper-encounter'

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
const ease = (n: number) => { const t = clamp(n, 0, 1); return t*t*(3-2*t) }
export type DeityArea = ReaperArea & { effect: 'palm' | 'halo' | 'pillar' }
export type DeityPalm = ArenaPoint & { side: -1 | 1; y: number; eligible: boolean }
type Cast = { id: DeityAttackId; elapsed: number; side: -1 | 1; areas: DeityArea[]; contacted: boolean }

/** Anchored colossus. All reachable palm regions derive from the animated hands. */
export class DeityEncounter implements ArenaEncounter {
  hp = DEITY.maxHp
  playerHp = 100
  running = false
  enraged = false
  clock = 0
  phaseElapsed = 9999
  deathElapsed = 0
  hurtUntil = 0
  position: ArenaPoint = { x: 0, z: -3.5 }
  cast: Cast | null = null
  readonly lift = 0
  private ready = new Map<DeityAttackId, number>()
  private nextAttack = 1500
  private turn = 0
  private seen = new Set<string>()
  private log = ['Solvaris awaits. Read the ground; the head and halo are far beyond melee reach.']
  constructor(private notify: (event: ArenaEvent) => void) {}
  get rules() { return this.enraged ? DEITY_RULES.enraged : DEITY_RULES.normal }
  get weak() { return this.palms().some(palm => palm.eligible) }
  get bodyDrop() {
    if (!this.cast || this.cast.id !== 'solar-verdict') return 0
    const timing = DEITY_ATTACKS[this.cast.id], t = this.cast.elapsed
    const retract = timing.windup + timing.active + timing.recovery - 600
    return t < timing.windup ? ease(t/timing.windup)*2.8 : t > retract ? (1-ease((t-retract)/600))*2.8 : 2.8
  }
  private note(line: string) { this.log = [line,...this.log].slice(0,7) }
  start() { if (this.hp > 0 && this.playerHp > 0) this.running = true }
  pause() { this.running = false; this.cancel() }
  cancel() { this.cast = null }
  reset() {
    this.pause(); this.hp = DEITY.maxHp; this.playerHp = 100; this.enraged = false
    this.clock = this.deathElapsed = this.hurtUntil = this.turn = 0; this.phaseElapsed = 9999
    this.ready.clear(); this.seen.clear(); this.nextAttack = 1500; this.position = { x:0,z:-3.5 }
    this.log = ['Reset · full health, normal halo, lowered-hands state and cooldowns restored.']
  }
  rehearseEnrage() {
    if (this.enraged || this.hp <= 0) return
    this.hp = Math.min(this.hp, Math.floor(DEITY.maxHp*DEITY.enrageAt)); this.enrage()
    this.note('Phase rehearsal · local HP set to 30%. No hit or reward recorded.')
  }
  private enrage() {
    if (this.enraged) return
    this.enraged = true; this.phaseElapsed = 0; this.cancel()
    for (const id of Object.keys(DEITY_ATTACKS) as DeityAttackId[]) this.ready.set(id,this.clock+1800)
    this.nextAttack = this.clock+1800
    this.note('SHATTERED MANDATE · broken halo, wider fields, five pillars and faster cooldowns.')
    this.notify({kind:'phase',target:'boss',point:{...this.position}})
  }
  window() {
    if (this.hp <= 0) return 'defeated'
    if (this.phaseElapsed < 1800) return 'enraging'
    if (!this.cast) return this.clock < this.hurtUntil ? 'hurt' : 'idle'
    const t = DEITY_ATTACKS[this.cast.id]
    return this.cast.elapsed < t.windup ? 'warning' : this.cast.elapsed < t.windup+t.active ? 'striking' : 'recovery'
  }
  circles() { return [] }
  areas(): DeityArea[] {
    const stage = this.window()
    return this.cast && (stage === 'warning' || stage === 'striking') ? this.cast.areas.map(area => ({...area,active:stage==='striking'})) : []
  }
  palms(): DeityPalm[] {
    return ([-1,1] as const).map(side => {
      const rest = { x:side*8.7,y:9.7,z:this.position.z+1.2 }
      if (!this.cast) return {...rest,side,eligible:false}
      const timing = DEITY_ATTACKS[this.cast.id], elapsed = this.cast.elapsed
      const recovery = timing.windup+timing.active, end = recovery+timing.recovery
      if (this.cast.id === 'solar-verdict' && side !== this.cast.side) return {...rest,side,eligible:false}
      const destination = this.cast.id === 'solar-verdict' ? this.cast.areas[0] : {x:side*7.2,z:this.position.z+6}
      const isRecovery = elapsed >= recovery
      const lowering = elapsed < timing.windup ? ease(elapsed/timing.windup)*.2 : elapsed < recovery ? ease((elapsed-timing.windup)/180) : 1
      const settle = ease((elapsed-recovery)/350)
      const blend = isRecovery ? (this.cast.id==='solar-verdict'?1:settle)*(1-ease((elapsed-(end-600))/600)) : this.cast.id==='solar-verdict'?lowering:0
      const x = rest.x+(destination.x-rest.x)*blend, z = rest.z+(destination.z-rest.z)*blend
      let y = rest.y+(3-rest.y)*blend
      if (elapsed < timing.windup) y = rest.y+Math.sin(elapsed/timing.windup*Math.PI)*3
      if (this.cast.id !== 'solar-verdict') y = isRecovery ? y+3.2*(1-settle) : rest.y+3.2*ease(elapsed/700)
      return {x,z,y,side,eligible:isRecovery && blend>.96 && this.hp>0}
    })
  }
  bodyCircles() { return [{...this.position,radius:3.1},...this.palms().filter(p=>p.eligible).map(p=>({x:p.x,z:p.z,radius:1.25}))] }
  hitRegions() {
    return [...this.palms().map(p=>({x:p.x,z:p.z,id:DEITY.id+':'+(p.side<0?'left-palm':'right-palm'),radius:1.7,eligible:p.eligible})),
      {...this.position,id:DEITY.id+':feet',radius:2.7,eligible:true}]
  }
  attack(id: string, player: ArenaPoint) {
    if (!(id in DEITY_ATTACKS) || !this.running || this.cast || this.hp <= 0 || this.phaseElapsed < 1800) return false
    const key = id as DeityAttackId
    if (this.clock < (this.ready.get(key)??0)) return false
    const side = player.x < 0 ? -1 : 1, areas: DeityArea[] = []
    const area = (x:number,z:number,outer:number,inner=0,effect:DeityArea['effect']='pillar'): DeityArea => ({kind:'ring',x,z,outer,inner,angle:Math.PI*2,facing:0,active:false,effect})
    if (key === 'solar-verdict') {
      // The giant bends forward; clamp distant corners to its physical arm reach.
      const shoulder = {x:side*5.1,z:this.position.z+3}, dx=player.x-shoulder.x,dz=player.z-shoulder.z,d=Math.hypot(dx,dz),reach=10.7
      const ratio = d>reach?reach/d:1
      areas.push(area(shoulder.x+dx*ratio,shoulder.z+dz*ratio,this.rules.palmRadius,0,'palm'))
    } else if (key === 'halo-decree') areas.push(area(this.position.x,this.position.z,this.rules.ringOuter,this.rules.ringInner,'halo'))
    else {
      const x=clamp(player.x,-17,17),z=clamp(player.z,-11,11)
      const xs=x>11.5?[x,x-5.5,x-11]:x< -11.5?[x,x+5.5,x+11]:[x,x-5.5,x+5.5]
      for(const px of xs)areas.push(area(px,z,this.rules.pillarRadius))
      if(this.enraged){
        const zs=z>6.2?[z-4.8,z-9.6]:z< -6.2?[z+4.8,z+9.6]:[z-4.8,z+4.8]
        for(const pz of zs)areas.push(area(x,pz,this.rules.pillarRadius))
      }
    }
    this.cast = {id:key,elapsed:0,side,areas,contacted:false}
    this.ready.set(key,this.clock+DEITY_ATTACKS[key].cooldown*this.rules.cooldown)
    this.note(DEITY_ATTACKS[key].name+' · '+DEITY_ATTACKS[key].description)
    return true
  }
  hit(id:string,amount:number,region?:string) {
    if (!this.running || this.hp <= 0 || this.phaseElapsed < 1800 || this.seen.has(id) || !Number.isFinite(amount) || amount<=0) return false
    const palm = this.palms().find(p=>region===DEITY.id+':'+(p.side<0?'left-palm':'right-palm'))
    const weak = !!palm?.eligible
    if (palm && !weak || !palm && region && region!==DEITY.id+':feet') return false
    this.seen.add(id); if(this.seen.size>256)this.seen.delete(this.seen.values().next().value!)
    const applied = Math.min(this.hp,Math.round(amount*(weak?1.75:.35)));this.hp-=applied;this.hurtUntil=this.clock+260
    this.notify({kind:'damage',target:'boss',amount:applied,weak,point:palm?{x:palm.x,z:palm.z}:{...this.position},height:weak?1.2:1.6})
    if(this.hp<=0){this.running=false;this.cancel();this.note('Solvaris defeated · the solar mandate is released.');this.notify({kind:'defeat',target:'boss',point:{...this.position}})}
    else if(!this.enraged&&this.hp<=DEITY.maxHp*DEITY.enrageAt)this.enrage()
    return true
  }
  private damage(player:ArenaPoint,id:DeityAttackId) {
    const applied=Math.min(this.playerHp,Math.round(DEITY_ATTACKS[id].damage*(this.enraged?1.25:1)))
    this.playerHp-=applied;this.notify({kind:'damage',target:'player',amount:applied,point:{...player},attack:id,impact:'fire'})
    if(this.playerHp<=0){this.running=false;this.cancel();this.note('Amber is down · reset to retry.');this.notify({kind:'defeat',target:'player',point:{...player}})}
  }
  advance(delta:number,player:ArenaPoint) {
    const dt=clamp(delta,0,50)
    if(this.hp<=0){this.deathElapsed+=dt;return}
    if(!this.running)return
    this.clock+=dt;this.phaseElapsed+=dt
    if(this.phaseElapsed<1800)return
    if(!this.cast&&this.clock>=this.nextAttack){
      const ids=Object.keys(DEITY_ATTACKS) as DeityAttackId[]
      for(let i=0;i<ids.length;i++){const index=(this.turn+i)%ids.length;if(this.attack(ids[index],player)){this.turn=(index+1)%ids.length;break}}
    }
    const cast=this.cast;if(!cast)return
    cast.elapsed+=dt;const timing=DEITY_ATTACKS[cast.id]
    if(cast.elapsed>=timing.windup+100&&!cast.contacted){cast.contacted=true;if(cast.areas.some(a=>inReaperArea(player,a)))this.damage(player,cast.id)}
    if(this.cast&&cast.elapsed>=timing.windup+timing.active+timing.recovery){this.cast=null;this.nextAttack=this.clock+this.rules.rest}
  }
  report():ArenaReport {
    const cooldowns=Object.fromEntries((Object.keys(DEITY_ATTACKS) as DeityAttackId[]).map(id=>[id,Math.max(0,(this.ready.get(id)??0)-this.clock)]))
    const timing=this.cast?DEITY_ATTACKS[this.cast.id]:null
    return {hp:this.hp,playerHp:this.playerHp,running:this.running,enraged:this.enraged,window:this.window(),cast:this.cast?.id??null,
      progress:this.cast&&timing?Math.min(1,this.cast.elapsed/(timing.windup+timing.active+timing.recovery)):0,
      fireCooldown:cooldowns['solar-verdict'],stompCooldown:cooldowns['halo-decree'],cooldowns,
      log:[...this.log],phaseElapsed:this.phaseElapsed,weak:this.weak,
      portraitState:this.clock<this.hurtUntil?'hurt':['warning','striking','enraging'].includes(this.window())?'threatening':'alert'}
  }
}
