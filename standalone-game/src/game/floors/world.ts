import { familyAssets, familyMember, type FamilyCreature, type FamilySkill } from '../monsters/family-catalog'
import { HIT_IMPACT, HitImpactPool } from '../feedback/hit-impact'
import { clearSight, overlap } from '../items/spatial'
import type { AbilityEvent } from '../items/runtime'
import type { StagePlaytest } from '../stage-editor/playtest'
import { stageImage } from '../stage-editor/data'
import type { StageWorld } from '../stage-editor/canvas'
import { FLOOR_MOBS, type SpawnId } from './content'
import { vitals } from './commands'
import type { StageId } from './state'
import { FloorMarshal } from './marshal'
import type { FloorCombatReport } from './view'
import type { FloorSession } from './session'
type Point={x:number;y:number}
type Manifest={atlas:string;cellWidth:number;cellHeight:number;columns:number;rows:number;baseline:number;contentHeight:number;poses:Record<string,number>}
type Cast={skill:FamilySkill;time:number;origin:Point;direction:Point;contact:string;attempted:boolean}
type Mob={id:SpawnId;creature:FamilyCreature;native:Manifest;image:HTMLImageElement;point:Point;home:Point;pocket:readonly number[];hp:number;cooldown:number;cast:Cast|null;hurt:number;death:number;moving:boolean;looted:boolean;lootPending:boolean;lootFailed:boolean}
type NumberFx={x:number;y:number;text:string;age:number;color:string}
const rect=(p:Point,r=7)=>({x:p.x-r,y:p.y-r,width:r*2,height:r*2})
const inPocket=(p:Point,b:readonly number[])=>p.x>b[0]&&p.y>b[1]&&p.x<b[0]+b[2]&&p.y<b[1]+b[3]
/** Single canvas, shared native atlas and bounded effects. No per-mob renderer or timer. */
export class FloorWorld implements StageWorld{
 private mobs:Mob[]=[];private clock=0;private disposed=false;private pending=false;private ventCycle=-1;private numbers:NumberFx[]=[]
 private marshal:FloorMarshal|null=null
 private impacts=new HitImpactPool();private impactImage!:HTMLImageElement;private casts=new Map<string,boolean>()
 private constructor(private stage:StageId,private session:FloorSession,private death:()=>void){}
 static async create(stage:StageId,session:FloorSession,death:()=>void,report:(value:FloorCombatReport|null)=>void=()=>{}){
   const world=new FloorWorld(stage,session,death),state=session.getSnapshot().campaign!
   if(FLOOR_MOBS.some(row=>row.stage===stage)){
     world.impactImage=await stageImage(HIT_IMPACT.url)
     for(const spawn of FLOOR_MOBS.filter(row=>row.stage===stage)){
       const member=familyMember(spawn.creature);if(!member)throw Error('The installed machine family is unavailable.')
       const base=familyAssets(member.family,member.creature),response=await fetch(base+'manifest.json');if(!response.ok)throw Error('The machine animation manifest could not load.')
       const native:Manifest=await response.json(),image=await stageImage(base+native.atlas),looted=!!state.expedition.receipts['F01.MOB.'+spawn.id]
       world.mobs.push({id:spawn.id,creature:member.creature,native,image,point:{x:spawn.x,y:spawn.y},home:{x:spawn.x,y:spawn.y},pocket:spawn.pocket,hp:looted?0:member.creature.maxHp,cooldown:1500,cast:null,hurt:0,death:looted?2000:0,moving:false,looted,lootPending:false,lootFailed:false})
     }
   }
   if(stage==='f01.stage.switchyard'){world.impactImage=await stageImage(HIT_IMPACT.url);world.marshal=await FloorMarshal.create(session,{hit:(p,n,kind,player)=>{world.impact(p,kind,window.matchMedia('(prefers-reduced-motion: reduce)').matches);world.number(p,(player?'−':'')+n+(player?' HP':''),player?'#ff9a9a':'#ffe4a3')},notice:(p,text)=>world.number(p,text)},report,death)}
   return world
 }
 private get state(){return this.session.getSnapshot().campaign!}
 private number(p:Point,text:string,color='#ffe4a3'){if(this.numbers.length===16)this.numbers.shift();this.numbers.push({x:p.x,y:p.y-24,text,age:0,color})}
 private impact(p:Point,kind:'slash'|'weak'|'fire',reduced:boolean){this.impacts.spawn({kind,position:{x:p.x,y:p.y-15,z:0},unit:32,reducedMotion:reduced})}
 private loot(mob:Mob){
   if(mob.looted||mob.lootPending||this.pending||vitals(this.state).hp===0)return
   mob.lootPending=true;this.pending=true
   void this.session.perform({kind:'mob-loot',spawn:mob.id,defeated:mob.hp===0}).then(saved=>{if(this.disposed)return;if(saved){mob.looted=true;mob.lootFailed=false;this.number(mob.point,'Loot saved','#9ee9be')}else{mob.lootFailed=true;this.number(mob.point,'Loot not saved · strike to retry','#ffb5a2')}}).finally(()=>{mob.lootPending=false;this.pending=false})
 }
 ability=(events:AbilityEvent[],play:StagePlaytest)=>{
   if(this.marshal?.active){this.marshal.ability(events,play);return}
   if(this.disposed||this.pending||vitals(this.state).hp===0)return
   const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches
   for(const event of events){
     if(event.kind==='cast'){this.casts.set(event.castId,play.abilitySnapshot.cast?.key==='special');if(this.casts.size>16)this.casts.delete(this.casts.keys().next().value!)}
     if(event.kind!=='hit'||!event.targetId)continue
     const mob=this.mobs.find(row=>row.id===event.targetId);if(!mob||mob.looted)continue
     if(mob.hp<=0){mob.lootFailed=false;this.loot(mob);continue}
     const recovery=!!mob.cast&&mob.cast.time>=mob.cast.skill.windup+mob.cast.skill.active
     const damage=Math.min(mob.hp,Math.round((this.casts.get(event.castId)?80:45)*(recovery?mob.creature.weakMultiplier:mob.creature.armor)))
     mob.hp-=damage;mob.hurt=180;this.impact(mob.point,recovery?'weak':'slash',reduced);this.number(mob.point,(recovery?'OPENING ':'')+'−'+damage)
     if(mob.hp===0){mob.cast=null;mob.death=0;this.loot(mob)}
   }
 }
 private contact(source:'arc-pulse'|'rivet-lunge'|'prism-mark'|'vent',id:string,from:Point,play:StagePlaytest){
   if(this.pending||this.disposed||vitals(this.state).hp===0)return
   const before=vitals(this.state).hp;this.pending=true
   void this.session.perform({kind:'incoming',source,contact:id}).then(saved=>{
     if(this.disposed||!saved)return
     const applied=before-vitals(saved).hp
     if(applied>0){play.confirmedContact(from);const p={...play.position};this.number(p,'−'+applied+' HP','#ff9a9a');this.impact(p,source==='vent'?'fire':'slash',window.matchMedia('(prefers-reduced-motion: reduce)').matches)}
     if(vitals(saved).hp===0)this.death()
   }).finally(()=>{this.pending=false})
 }
 tick(delta:number,play:StagePlaytest){
   if(this.disposed||delta<=0||this.pending||vitals(this.state).hp===0)return
   this.clock+=delta;this.impacts.advance(delta);this.numbers=this.numbers.filter(n=>(n.age+=delta)<1100)
   if(this.marshal?.active){this.marshal.tick(delta,play);play.setTrainingTargets(this.marshal.targets());return}
   for(const mob of this.mobs){
     if(!mob.looted&&this.state.expedition.receipts['F01.MOB.'+mob.id]){mob.looted=true;mob.hp=0;mob.death=2000;mob.cast=null}
     mob.hurt=Math.max(0,mob.hurt-delta);mob.moving=false
     if(mob.hp<=0){mob.death+=delta;if(!mob.lootFailed)this.loot(mob);continue}
     const distance=Math.hypot(play.position.x-mob.point.x,play.position.y-mob.point.y),inside=inPocket(play.position,mob.pocket)
     if(mob.cast){
       const cast=mob.cast;cast.time+=delta
       if(!inside){mob.cast=null;mob.cooldown=1000;continue}
       if(cast.skill.shape==='sector'&&cast.time>=cast.skill.windup&&cast.time<cast.skill.windup+cast.skill.active){const step=delta/1000*70,next={x:mob.point.x+cast.direction.x*step,y:mob.point.y+cast.direction.y*step};if(inPocket(next,mob.pocket)&&play.canWalk(next)&&!play.solids.some(s=>overlap(rect(next,9),s.rect)))mob.point=next}
       if(cast.time>=cast.skill.windup&&!cast.attempted){cast.attempted=true;if(this.hits(cast,play.position)&&clearSight(cast.origin,rect(play.position,3),play.solids.map(s=>s.rect)))this.contact(cast.skill.id as 'arc-pulse'|'rivet-lunge'|'prism-mark',cast.contact,cast.origin,play)}
       if(cast.time>=cast.skill.windup+cast.skill.active+cast.skill.recovery){mob.cooldown=cast.skill.cooldown;mob.cast=null}
     }else{
       mob.cooldown=Math.max(0,mob.cooldown-delta)
       const target=inside&&distance<180?play.position:{x:mob.home.x+Math.sin(this.clock/2600)*22,y:mob.home.y+Math.cos(this.clock/2400)*14},dx=target.x-mob.point.x,dy=target.y-mob.point.y,len=Math.hypot(dx,dy)
       if(len>25){const speed=inside?24:10,step=Math.min(len,delta/1000*speed),next={x:mob.point.x+dx/len*step,y:mob.point.y+dy/len*step}
         if(inPocket(next,mob.pocket)&&play.canWalk(next)&&!play.solids.some(s=>overlap(rect(next,9),s.rect))){mob.point=next;mob.moving=true}
       }
       const skill=mob.creature.skills[0]
       if(inside&&distance<Math.max(80,skill.outer*32+16)&&mob.cooldown===0&&clearSight(mob.point,rect(play.position,3),play.solids.map(s=>s.rect))){const d=Math.hypot(dx,dy)||1;mob.cast={skill,time:0,origin:{...(skill.target==='player'?play.position:mob.point)},direction:{x:dx/d,y:dy/d},contact:'contact:'+crypto.randomUUID(),attempted:false}}
     }
   }
   const vent=this.hazard(),cycle=Math.floor(this.clock/6800),phase=this.clock%6800
   if(vent&&phase>=1500&&phase<1880&&cycle!==this.ventCycle&&overlap(rect(play.position,4),vent)){this.ventCycle=cycle;this.contact('vent','vent:'+crypto.randomUUID(),{x:vent.x-12,y:vent.y},play)}
   play.setTrainingTargets(this.mobs.filter(m=>!m.looted).map(m=>({id:m.id,rect:rect(m.point,11),kind:'training',eligible:!this.pending&&(!m.lootPending)})))
 }
 private hazard(){return this.stage==='f01.stage.undergrid'?{x:190,y:185,width:72,height:35}:this.stage==='f01.stage.skybridge'?{x:690,y:365,width:85,height:36}:null}
 private hits(c:Cast,p:Point){const dx=p.x-c.origin.x,dy=p.y-c.origin.y,d=Math.hypot(dx,dy);if(d>c.skill.outer*32)return false;if(c.skill.shape==='ring')return d>=c.skill.inner*32;if(c.skill.shape==='sector')return d<2||(dx*c.direction.x+dy*c.direction.y)/(d||1)>=Math.cos(c.skill.angle*Math.PI/360);return true}
 private shape(c:CanvasRenderingContext2D,cast:Cast,active:boolean){
   const s=cast.skill,o=cast.origin,r=s.outer*32;c.save();c.fillStyle=active?'#fa7b5f77':'#f5c06930';c.strokeStyle=active?'#ff9c79':'#ffd17b';c.lineWidth=1.5;c.setLineDash(active?[]:[5,3]);c.beginPath()
   if(s.shape==='sector'){const a=Math.atan2(cast.direction.y,cast.direction.x),half=s.angle*Math.PI/360;c.moveTo(o.x,o.y);c.arc(o.x,o.y,r,a-half,a+half);c.closePath()}
   else{c.arc(o.x,o.y,r,0,Math.PI*2);if(s.shape==='ring'){c.moveTo(o.x+s.inner*32,o.y);c.arc(o.x,o.y,s.inner*32,0,Math.PI*2,true)}}
   c.fill('evenodd');c.stroke();c.setLineDash([]);c.font='600 10px "Instrument Sans"';c.textAlign='center';c.fillStyle='#ffe3b8';c.fillText(active?'CONTACT':s.name,o.x,o.y-r-5);c.restore()
 }
 get active(){return this.marshal?.active??false}
 get unrecordedVictory(){return this.marshal?.unrecordedVictory??false}
 bounds=()=>this.marshal?.bounds()??null
 solids=()=>this.marshal?.solids()??[]
 begin=(play:StagePlaytest)=>{const started=this.marshal?.begin(play)??false;if(started)for(const mob of this.mobs){mob.cast=null;mob.cooldown=1500}return started}
 leave=(play:StagePlaytest)=>this.marshal?.leave(play)
 retryVictory=async()=>this.marshal?.retryVictory()
 ground(c:CanvasRenderingContext2D,reduced:boolean){
   this.marshal?.ground(c)
   if(this.stage==='f01.stage.skybridge'&&!reduced){c.save();c.strokeStyle='#9fcad839';c.lineWidth=1;for(let i=0;i<42;i++){const x=(i*97+Math.floor(this.clock/24))%1280,y=(i*71+Math.floor(this.clock/8))%768;c.beginPath();c.moveTo(x,y);c.lineTo(x-3,y+9);c.stroke()}c.restore()}
   for(const mob of this.mobs)if(mob.cast&&mob.cast.time<mob.cast.skill.windup+mob.cast.skill.active)this.shape(c,mob.cast,mob.cast.time>=mob.cast.skill.windup)
   const vent=this.hazard(),p=this.clock%6800
   if(vent&&p<1880){c.save();c.fillStyle=p<1500?'#edb45c35':'#e9815266';c.fillRect(vent.x,vent.y,vent.width,vent.height);c.strokeStyle='#efb66a';c.strokeRect(vent.x,vent.y,vent.width,vent.height);c.beginPath();c.rect(vent.x,vent.y,vent.width,vent.height);c.clip();for(let x=vent.x-40;x<vent.x+vent.width;x+=12){c.beginPath();c.moveTo(x,vent.y+vent.height);c.lineTo(x+30,vent.y);c.stroke()}c.restore();c.save();c.font='600 10px "Instrument Sans"';c.fillStyle='#ffe0ad';c.fillText(p<1500?'VENT · move out':'VENT · active',vent.x,vent.y-5);c.restore()}
 }
 bodies(){const bodies=this.mobs.filter(m=>!m.looted||m.death<1000).map(m=>({depth:m.point.y,draw:(c:CanvasRenderingContext2D,reduced:boolean)=>this.body(c,m,reduced)}));if(this.marshal)bodies.push({depth:this.marshal.position.y,draw:(c,reduced)=>this.marshal!.draw(c,reduced)});return bodies}
 private body(c:CanvasRenderingContext2D,m:Mob,reduced:boolean){
   const n=m.native,pose=m.hp<=0||m.hurt>0?'hurt':m.cast?(m.cast.time<m.cast.skill.windup?'windup':m.cast.time<m.cast.skill.windup+m.cast.skill.active?'attack':'idle'):m.moving?'walk':'idle',size=Math.round(40*m.creature.height*n.cellHeight/n.contentHeight),x=Math.round(m.point.x-size/2),y=Math.round(m.point.y-n.baseline/n.cellHeight*size)
   c.save();c.imageSmoothingEnabled=false;c.globalAlpha=m.hp<=0&&m.looted?Math.max(0,1-m.death/1000):1;c.fillStyle='#0c122d77';c.beginPath();c.ellipse(m.point.x,m.point.y,12,4,0,0,Math.PI*2);c.fill()
   c.drawImage(m.image,(n.poses[pose]??0)*n.cellWidth,m.creature.row*n.cellHeight,n.cellWidth,n.cellHeight,x,y+(reduced?0:Math.round(Math.sin(this.clock/480)*.5)),size,size)
   c.fillStyle='#141b2e';c.fillRect(m.point.x-22,m.point.y-45,44,4);c.fillStyle=m.hp>0?'#e8a36e':'#9cbbaf';c.fillRect(m.point.x-22,m.point.y-45,44*m.hp/m.creature.maxHp,4);c.font='600 10px "Saira Condensed"';c.textAlign='center';c.fillStyle='#f7e6ce';c.fillText(m.hp>0?`${m.creature.name} · ${m.hp}`:m.looted?'Defeated':'Loot pending · strike to retry',m.point.x,m.point.y-50);c.restore()
 }
 overlay(c:CanvasRenderingContext2D,reduced:boolean){
   if(this.impactImage)for(const slot of this.impacts.slots){const frame=this.impacts.frame(slot);if(frame<0)continue;const size=slot.unit*HIT_IMPACT.clips[slot.kind].size;c.drawImage(this.impactImage,frame%4*64,Math.floor(frame/4)*64,64,64,Math.round(slot.position.x-size/2),Math.round(slot.position.y-size/2),size,size)}
   c.save();c.font='700 12px "Instrument Sans"';c.textAlign='center';for(const n of this.numbers){c.globalAlpha=n.age>850?(1100-n.age)/250:1;c.fillStyle='#12182e';const y=n.y-(reduced?0:Math.min(15,n.age/65));c.fillText(n.text,n.x+1,y+1);c.fillStyle=n.color;c.fillText(n.text,n.x,y)}c.restore()
 }
 dispose(){this.disposed=true;this.marshal?.dispose();this.mobs=[];this.numbers=[];this.casts.clear();this.impacts.clear()}
}
