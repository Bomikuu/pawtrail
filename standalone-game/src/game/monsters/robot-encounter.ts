import type { ArenaComponent, ArenaEncounter, ArenaEvent, ArenaPoint, ArenaReport } from './arena-contract'
import { inReaperArea, type ReaperArea } from './reaper-encounter'
import { ROBOT, ROBOT_ATTACKS, type RobotAttackId } from './robot'

const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n))
export type RobotField = { kind: 'beam'; x: number; z: number; endX: number; endZ: number; width: number; active: boolean } | (ReaperArea & { kind: 'ring' | 'sector' })
type Cast = { id: RobotAttackId; elapsed: number; fields: RobotField[]; contacted: boolean }
type Funnel = { id: string; name: string; hp: number; x: number; z: number; hurtUntil: number; destroyedAt: number }

/** Four independent components gate the main body's authoritative local HP. */
export class RobotEncounter implements ArenaEncounter {
  hp = ROBOT.maxHp
  playerHp = 100
  running = false
  enraged = false
  clock = 0
  phaseElapsed = 9999
  deathElapsed = 0
  hurtUntil = 0
  blockedUntil = 0
  position: ArenaPoint = { x: 0, z: -1.2 }
  readonly lift = 0
  cast: Cast | null = null
  funnels: Funnel[] = this.freshFunnels()
  private ready = new Map<RobotAttackId, number>()
  private seen = new Set<string>()
  private nextAttack = 2400
  private turn = 0
  private log = ['Four funnels power the shield. Destroy A–D before the main body can take damage.']
  constructor(private notify: (event: ArenaEvent) => void) {}
  private freshFunnels(): Funnel[] {
    return [[-3.6,3.1],[3.6,3.1],[-3.6,-3.1],[3.6,-3.1]].map(([x,z],i)=>({id:ROBOT.id+':funnel-'+i,name:'Funnel '+String.fromCharCode(65+i),hp:ROBOT.funnelHp,x,z,hurtUntil:0,destroyedAt:-1}))
  }
  get remaining() { return this.funnels.filter(f=>f.hp>0).length }
  get shielded() { return this.remaining>0 }
  get weak() { return !this.shielded && this.window()==='recovery' }
  private note(line: string) { this.log=[line,...this.log].slice(0,8) }
  components(): ArenaComponent[] {
    return this.funnels.map((f,i)=>({id:f.id,name:f.name,hp:f.hp,maxHp:ROBOT.funnelHp,
      x:this.position.x+f.x,z:this.position.z+f.z,height:1.05+(this.running?Math.sin(this.clock/700+i)*.04:0)}))
  }
  start() { if(this.hp>0&&this.playerHp>0)this.running=true }
  pause() { this.running=false;this.cancel() }
  cancel() { this.cast=null }
  reset() {
    this.pause();this.hp=ROBOT.maxHp;this.playerHp=100;this.enraged=false
    this.clock=this.deathElapsed=this.hurtUntil=this.blockedUntil=this.turn=0;this.phaseElapsed=9999
    this.funnels=this.freshFunnels();this.ready.clear();this.seen.clear();this.nextAttack=2400
    this.position={x:0,z:-1.2};this.log=['Reset · all four funnels restored to 360 HP, shield online, body 8,400 HP.']
  }
  rehearseEnrage() {
    if(this.shielded){this.notify({kind:'blocked',target:'boss',point:{...this.position},label:'Destroy all four funnels before core-enrage rehearsal.'});return}
    if(this.enraged||this.hp<=0)return
    this.hp=Math.min(this.hp,Math.floor(ROBOT.maxHp*ROBOT.enrageAt));this.enrage()
    this.note('Phase rehearsal · body HP set to 30%. No hit or reward recorded; funnels remain destroyed.')
  }
  private enrage() {
    if(this.enraged)return
    this.enraged=true;this.phaseElapsed=0;this.cancel()
    for(const id of Object.keys(ROBOT_ATTACKS) as RobotAttackId[])this.ready.set(id,this.clock+1800)
    this.nextAttack=this.clock+1800
    this.note('OVERCLOCK SIEGE · opened reactor, wider beams, five blast disks and faster cooldowns. Funnels do not respawn.')
    this.notify({kind:'phase',target:'boss',point:{...this.position}})
  }
  window() {
    if(this.hp<=0)return 'defeated'
    if(this.phaseElapsed<1800)return 'enraging'
    if(!this.cast)return this.clock<this.hurtUntil?'hurt':'idle'
    const t=ROBOT_ATTACKS[this.cast.id]
    return this.cast.elapsed<t.windup?'warning':this.cast.elapsed<t.windup+t.active?'striking':'recovery'
  }
  circles(){return []}
  fields(): RobotField[] {
    const stage=this.window()
    return this.cast&&(stage==='warning'||stage==='striking')?this.cast.fields.map(f=>({...f,active:stage==='striking'})):[]
  }
  bodyCircles(){return [{...this.position,radius:1.3},...this.components().filter(f=>f.hp>0).map(f=>({x:f.x,z:f.z,radius:.35}))]}
  hitRegions(){return [...this.components().map(f=>({x:f.x,z:f.z,id:f.id,radius:.62,eligible:f.hp>0})),{...this.position,id:ROBOT.id+':body',radius:1.45,eligible:true}]}
  attack(id: string,player: ArenaPoint) {
    if(!(id in ROBOT_ATTACKS)||!this.running||this.cast||this.hp<=0||this.phaseElapsed<1800)return false
    const key=id as RobotAttackId
    if(this.clock<(this.ready.get(key)??0))return false
    const fields: RobotField[]=[],factor=this.enraged?1.25:1
    if(key==='crossfire-lattice'){
      const emitters=this.components().filter(f=>f.hp>0)
      for(const origin of emitters.length?emitters:[this.position]){
        const dx=player.x-origin.x,dz=player.z-origin.z,d=Math.max(.01,Math.hypot(dx,dz)),length=Math.min(12,d+3)
        fields.push({kind:'beam',x:origin.x,z:origin.z,endX:origin.x+dx/d*length,endZ:origin.z+dz/d*length,width:this.enraged?1.1:.75,active:false})
      }
    }else if(key==='reactor-sweep')fields.push({kind:'sector',...this.position,outer:this.enraged?7:5.6,inner:0,angle:(this.enraged?150:110)*Math.PI/180,facing:Math.atan2(player.x-this.position.x,player.z-this.position.z),active:false})
    else{
      const x=clamp(player.x,-6,6),z=clamp(player.z,-4.8,4.8)
      const xs=x>3.5?[x,x-2.6,x-5.2]:x< -3.5?[x,x+2.6,x+5.2]:[x,x-2.6,x+2.6]
      for(const px of xs)fields.push({kind:'ring',x:px,z,outer:1.5*factor,inner:0,angle:Math.PI*2,facing:0,active:false})
      if(this.enraged)for(const pz of z>2?[z-2.8,z-5.6]:z< -2?[z+2.8,z+5.6]:[z-2.8,z+2.8])fields.push({kind:'ring',x,z:pz,outer:1.5*factor,inner:0,angle:Math.PI*2,facing:0,active:false})
    }
    this.cast={id:key,elapsed:0,fields,contacted:false};this.ready.set(key,this.clock+ROBOT_ATTACKS[key].cooldown*(this.enraged ? .65 : 1))
    this.note(ROBOT_ATTACKS[key].name+' · '+ROBOT_ATTACKS[key].description);return true
  }
  hit(id: string,amount: number,region?: string): boolean|'blocked' {
    if(!this.running||this.hp<=0||this.phaseElapsed<1800||!Number.isFinite(amount)||amount<=0)return false
    const key=id+':'+(region??'body')
    if(this.seen.has(key))return false
    const funnel=this.funnels.find(f=>f.id===region)
    if(funnel&&funnel.hp<=0||!funnel&&region!==ROBOT.id+':body'&&region!==ROBOT.id)return false
    this.seen.add(key);if(this.seen.size>512)this.seen.delete(this.seen.values().next().value!)
    if(funnel){
      const point=this.components().find(f=>f.id===funnel.id)!,applied=Math.min(funnel.hp,Math.round(amount))
      funnel.hp-=applied;funnel.hurtUntil=this.clock+250
      this.notify({kind:'damage',target:'boss',targetName:funnel.name,point,amount:applied,height:point.height,label:'Remote weapon · '+funnel.hp+' / '+ROBOT.funnelHp+' HP',impact:funnel.hp<=0?'fire':'weak'})
      if(funnel.hp<=0){
        funnel.destroyedAt=this.clock
        const message=funnel.name+' destroyed · '+this.remaining+' / 4 funnels remain'+(this.shielded?' · body still SHIELDED.':' · SHIELD DOWN — main body VULNERABLE!')
        this.note(message);this.notify({kind:'notice',target:'boss',point,label:message})
      }
      return true
    }
    if(this.shielded){
      this.blockedUntil=this.clock+350
      this.notify({kind:'blocked',target:'boss',point:{...this.position},label:'SHIELDED · '+this.remaining+' / 4 funnels remain · body damage blocked'})
      return 'blocked'
    }
    const weak=this.weak,applied=Math.min(this.hp,Math.round(amount*(weak?1.5:1)))
    this.hp-=applied;this.hurtUntil=this.clock+250
    this.notify({kind:'damage',target:'boss',point:{...this.position},amount:applied,weak,height:1.5,label:weak?'Exposed reactor recovery ×1.5':'Unshielded main body'})
    if(this.hp<=0){this.running=false;this.cancel();this.note('Kurogane defeated · all weapon systems offline.');this.notify({kind:'defeat',target:'boss',point:{...this.position}})}
    else if(!this.enraged&&this.hp<=ROBOT.maxHp*ROBOT.enrageAt)this.enrage()
    return true
  }
  private inField(player: ArenaPoint,field: RobotField){
    if(field.kind!=='beam')return inReaperArea(player,field)
    const dx=field.endX-field.x,dz=field.endZ-field.z,length2=dx*dx+dz*dz
    const t=length2?clamp(((player.x-field.x)*dx+(player.z-field.z)*dz)/length2,0,1):0
    return Math.hypot(player.x-field.x-t*dx,player.z-field.z-t*dz)<=field.width/2
  }
  advance(delta: number,player: ArenaPoint){
    const dt=clamp(delta,0,50)
    if(this.hp<=0){this.deathElapsed+=dt;return}if(!this.running)return
    this.clock+=dt;this.phaseElapsed+=dt;if(this.phaseElapsed<1800)return
    if(!this.cast&&this.clock>=this.nextAttack){
      const ids=Object.keys(ROBOT_ATTACKS) as RobotAttackId[]
      for(let i=0;i<ids.length;i++){const index=(this.turn+i)%ids.length;if(this.attack(ids[index],player)){this.turn=(index+1)%ids.length;break}}
    }
    const cast=this.cast;if(!cast)return
    cast.elapsed+=dt;const t=ROBOT_ATTACKS[cast.id]
    if(cast.elapsed>=t.windup+90&&!cast.contacted){
      cast.contacted=true
      if(cast.fields.some(f=>this.inField(player,f))){
        const applied=Math.min(this.playerHp,Math.round(t.damage*(this.enraged?1.25:1)));this.playerHp-=applied
        this.notify({kind:'damage',target:'player',point:{...player},amount:applied,attack:cast.id,impact:'fire'})
        if(this.playerHp<=0){this.running=false;this.cancel();this.note('Amber down · reset to restore funnels and try again.');this.notify({kind:'defeat',target:'player',point:{...player}})}
      }
    }
    if(this.cast&&cast.elapsed>=t.windup+t.active+t.recovery){this.cast=null;this.nextAttack=this.clock+(this.enraged?650:1100)}
  }
  report(): ArenaReport {
    const cooldowns=Object.fromEntries((Object.keys(ROBOT_ATTACKS) as RobotAttackId[]).map(id=>[id,Math.max(0,(this.ready.get(id)??0)-this.clock)]))
    const timing=this.cast?ROBOT_ATTACKS[this.cast.id]:null
    return {hp:this.hp,playerHp:this.playerHp,running:this.running,enraged:this.enraged,window:this.window(),cast:this.cast?.id??null,
      progress:this.cast&&timing?Math.min(1,this.cast.elapsed/(timing.windup+timing.active+timing.recovery)):0,
      fireCooldown:cooldowns['crossfire-lattice'],stompCooldown:cooldowns['reactor-sweep'],cooldowns,components:this.components(),shielded:this.shielded,
      log:[...this.log],phaseElapsed:this.phaseElapsed,weak:this.weak,portraitState:this.clock<this.hurtUntil?'hurt':['warning','striking','enraging'].includes(this.window())?'threatening':'alert'}
  }
}
