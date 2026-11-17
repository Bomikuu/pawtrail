import {ACTION_KEYS,emptyCooldowns,type ItemDocument,type ItemAction,type ActionKey,type Vec,type Rect,type ItemEvent} from './document'
import {forward,areaHits,areaOrigin,clearSight,sweepBand} from './spatial'
import {chainTouches} from './chain-path'
export type AbilityActor={id:string;position:Vec;direction:string;eligible?:boolean;running?:boolean}
export type AbilityTarget={id:string;rect:Rect;kind:'training'|'prop';eligible:boolean}
export type AbilityWorld={targets:AbilityTarget[];solids:Rect[];actorPosition?:Vec}
type Cast={id:string;key:ActionKey;action:ItemAction;actor:AbilityActor;elapsed:number;fired:Set<string>;hits:Set<string>}
export type Projectile={id:string;castId:string;position:Vec;origin:Vec;forward:Vec;traveled:number;age:number;spec:ItemAction['projectile'];art:ItemEvent;hits:Set<string>}
export type AbilityEvent={id:string;castId:string;kind:'cast'|'trail'|'burst'|'projectile'|'sound'|'hit'|'blocked'|'complete';position:Vec;forward:Vec;targetId?:string;art?:ItemEvent;time:number;impulse?:Vec;hitStop?:number}
export type ActivationResult={ok:true;castId:string;buffered?:boolean}|{ok:false;reason:'no-item'|'cooldown'|'busy'|'invalid-state'}
export type AbilitySnapshot={time:number;cast:null|{id:string;key:ActionKey;action:ItemAction;elapsed:number;duration:number;actor:AbilityActor;locked:boolean;buffered:boolean;canChain:boolean};projectiles:Omit<Projectile,'hits'>[];cooldowns:Record<ActionKey,number>}
/** Data-only local rehearsal: fixed-step casts, buffered combo links and per-strike hit IDs. */
export class AbilitySession {
 private item:ItemDocument|null=null
 private cast:Cast|null=null
 private projectiles:Projectile[]=[]
 private clock=0
 private accumulated=0
 private serial=0
 private cooldowns=new Map<string,number>()
 private eventSerial=0
 private buffered:{expires:number;accepted:boolean}|null=null
 equip(item:ItemDocument|null){this.cancel('unequip');this.item=item?structuredClone(item):null}
 private begin(key:ActionKey,actor:AbilityActor){
  const action=this.item!.actions[key]!
  const id='cast-'+(++this.serial)
  this.cast={id,key,action:structuredClone(action),actor:structuredClone(actor),elapsed:0,fired:new Set(),hits:new Set()}
  this.buffered=null
  this.cooldowns.set(this.item!.id+':'+key,this.clock+action.cooldown)
  if(['primary','combo2','combo3','running'].includes(key))this.cooldowns.set(this.item!.id+':primary',this.clock+action.cooldown)
  return id
 }
 activate(request:ActionKey,actor:AbilityActor):ActivationResult {
  if(!this.item)return{ok:false,reason:'no-item'}
  if(actor.eligible===false||!Number.isFinite(actor.position.x)||!Number.isFinite(actor.position.y))return{ok:false,reason:'invalid-state'}
  if(this.cast){
   const c=this.cast,combo=c.action.combo
   if(request==='primary'&&combo&&this.item.actions[combo.next]&&c.elapsed>=Math.max(0,combo.open-combo.buffer)&&c.elapsed<=combo.close){
    this.buffered={expires:this.clock+combo.buffer,accepted:c.elapsed>=combo.open}
    return{ok:true,castId:c.id,buffered:true}
   }
   return{ok:false,reason:'busy'}
  }
  const key=request==='primary'&&actor.running&&this.item.actions.running?'running':request
  if(!this.item.actions[key])return{ok:false,reason:'invalid-state'}
  if(Math.max(this.cooldowns.get(this.item.id+':'+key)??0,request==='primary'?this.cooldowns.get(this.item.id+':primary')??0:0)>this.clock+.001)return{ok:false,reason:'cooldown'}
  return{ok:true,castId:this.begin(key,actor)}
 }
 advance(delta:number,world:AbilityWorld):AbilityEvent[] {
  const events:AbilityEvent[]=[]
  this.accumulated+=Math.max(0,Math.min(Number.isFinite(delta)?delta:0,1000))
  const step=1000/60
  while(this.accumulated+1e-7>=step){this.step(step,world,events);this.accumulated-=step}
  return events
 }
 private emit(events:AbilityEvent[],castId:string,kind:AbilityEvent['kind'],position:Vec,f:Vec,art?:ItemEvent,targetId?:string){
  const event:AbilityEvent={id:'event-'+(++this.eventSerial),castId,kind,position:{...position},forward:{...f},art:art?structuredClone(art):undefined,targetId,time:this.clock}
  events.push(event);return event
 }
 private step(dt:number,world:AbilityWorld,events:AbilityEvent[]) {
  this.clock+=dt
  for(const p of [...this.projectiles])this.moveProjectile(p,dt,world,events)
  const cast=this.cast
  if(!cast)return
  if(cast.action.rootMotion?.distance&&world.actorPosition)cast.actor.position={...world.actorPosition}
  const before=Math.max(0,cast.elapsed),after=Math.min(cast.action.duration,cast.elapsed+dt),f=forward(cast.actor.direction)
  const origin=areaOrigin(cast.actor.position,f,cast.action.area)
  for(const event of [...cast.action.events].sort((a,b)=>a.time-b.time)){
   if(cast.fired.has(event.id)||event.time>after+.001)continue
   cast.fired.add(event.id)
   if(event.kind==='projectile'){
    if(this.projectiles.length>=16){this.emit(events,cast.id,'blocked',origin,f,event);continue}
    const p:Projectile={id:cast.id+':'+event.id,castId:cast.id,position:{...origin},origin,forward:f,traveled:0,age:0,spec:{...cast.action.projectile},art:{...event},hits:new Set()}
    this.projectiles.push(p);this.emit(events,cast.id,'projectile',origin,f,event)
    this.moveProjectile(p,Math.max(0,after-event.time),world,events)
   }else this.emit(events,cast.id,event.kind,origin,f,event)
  }
  const windows=cast.action.hitWindows??(cast.action.melee?[{id:'melee',start:cast.action.windup,end:cast.action.activeEnd,area:cast.action.area,knockback:0}]:[])
  for(const window of windows){
   if(after<window.start||before>window.end)continue
   for(const target of world.targets){
    const hitId=window.id+':'+target.id
    if(!target.eligible||cast.hits.has(hitId)||!areaHits(cast.actor.position,f,window.area,target.rect)||!clearSight(origin,target.rect,world.solids))continue
    if(!chainTouches(cast.action,Math.max(before,window.start),Math.min(after,window.end),cast.actor.position,f,target.rect,world.solids))continue
    cast.hits.add(hitId)
    const position={x:target.rect.x+target.rect.width/2,y:target.rect.y+target.rect.height/2}
    const event=this.emit(events,cast.id,'hit',position,f,undefined,target.id)
    const dx=position.x-cast.actor.position.x,dy=position.y-cast.actor.position.y,length=Math.hypot(dx,dy)||1
    event.impulse={x:dx/length*window.knockback,y:dy/length*window.knockback};event.hitStop=cast.action.hitStop??0
   }
  }
  cast.elapsed=after
  const combo=cast.action.combo
  if(this.buffered&&combo){
   if(!this.buffered.accepted&&this.clock>this.buffered.expires)this.buffered=null
   else if(after>=combo.open)this.buffered.accepted=true
   if(this.buffered?.accepted&&after>=combo.close&&this.item?.actions[combo.next]){
    this.emit(events,cast.id,'complete',cast.actor.position,f)
    const id=this.begin(combo.next,{...cast.actor,position:{...(world.actorPosition??cast.actor.position)}})
    this.emit(events,id,'cast',world.actorPosition??cast.actor.position,f)
    return
   }
  }
  if(after>=cast.action.duration){this.emit(events,cast.id,'complete',cast.actor.position,f);this.cast=null;this.buffered=null}
 }
 private moveProjectile(p:Projectile,dt:number,world:AbilityWorld,events:AbilityEvent[]){
  const budget=Math.min(dt,Math.max(0,p.spec.lifetime-p.age)),distance=Math.min(p.spec.speed*budget/1000,p.spec.range-p.traveled),end={x:p.position.x+p.forward.x*distance,y:p.position.y+p.forward.y*distance}
  let contact=1,blocked=false
  if(p.spec.stopAtWalls)for(const solid of world.solids){const t=sweepBand(p.position,end,p.forward,p.spec.width,p.spec.depth,solid);if(t!==null&&t<=contact){contact=t;blocked=true}}
  const hits=world.targets.filter(t=>t.eligible&&!p.hits.has(t.id)).map(target=>({target,time:sweepBand(p.position,end,p.forward,p.spec.width,p.spec.depth,target.rect)})).filter((hit):hit is {target:AbilityTarget;time:number}=>hit.time!==null).sort((a,b)=>a.time-b.time)
  for(const hit of hits){if(hit.time>contact+.00001||(blocked&&hit.time>=contact-.00001))continue;p.hits.add(hit.target.id);this.emit(events,p.castId,'hit',{x:hit.target.rect.x+hit.target.rect.width/2,y:hit.target.rect.y+hit.target.rect.height/2},p.forward,p.art,hit.target.id);if(!p.spec.pierce){contact=hit.time;blocked=true;break}}
  p.position={x:p.position.x+(end.x-p.position.x)*contact,y:p.position.y+(end.y-p.position.y)*contact};p.traveled+=distance*contact;p.age+=dt
  if(blocked||p.traveled>=p.spec.range-.001||p.age>=p.spec.lifetime){if(blocked)this.emit(events,p.castId,'blocked',p.position,p.forward,p.art);this.projectiles=this.projectiles.filter(row=>row!==p)}
 }

 reset(){this.cancel('reset');this.cooldowns.clear();this.clock=0;this.eventSerial=0}
 cancel(_reason:'unequip'|'leave'|'reset'){this.cast=null;this.projectiles=[];this.buffered=null;this.accumulated=0}
 snapshot():AbilitySnapshot {
  const cooldowns=emptyCooldowns()
  for(const key of ACTION_KEYS)cooldowns[key]=Math.max(0,(this.cooldowns.get((this.item?.id??'')+':'+key)??0)-this.clock)
  const c=this.cast,combo=c?.action.combo
  return{time:this.clock,cast:c?{id:c.id,key:c.key,action:c.action,elapsed:Math.max(0,c.elapsed),duration:c.action.duration,actor:structuredClone(c.actor),locked:c.action.lockMovement,buffered:!!this.buffered,canChain:!!combo&&c.elapsed>=Math.max(0,combo.open-combo.buffer)&&c.elapsed<=combo.close}:null,projectiles:this.projectiles.map(({hits,...p})=>structuredClone(p)),cooldowns}
 }
}
