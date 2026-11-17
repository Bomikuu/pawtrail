import { FamilyEncounter } from '../monsters/family-encounter'
import { familyMember,familyAssets } from '../monsters/family-catalog'
import type { ArenaEvent } from '../monsters/arena-contract'
import { stageImage } from '../stage-editor/data'
import type { StagePlaytest } from '../stage-editor/playtest'
import type { AbilityEvent } from '../items/runtime'
import type { FloorSession } from './session'
import type { FloorCombatReport } from './view'
import { acceptFloorVictory,type VictoryProof } from './encounter-proof'
import type { ENCOUNTER_DAMAGE } from './phase5-commands'
import { vitals } from './commands'
type Point={x:number;y:number}
type Feedback={hit:(p:Point,n:number,kind:'slash'|'weak'|'fire',player:boolean)=>void;notice:(p:Point,text:string)=>void}
/** Existing Marshal controller mapped to a cleared yard pocket, with no preview switches. */
export class FloorMarshal{
 readonly encounter:FamilyEncounter
 private image!:HTMLImageElement;private manifest!:{atlas:string;cellWidth:number;cellHeight:number;baseline:number;contentHeight:number;poses:Record<string,number>}
 private live=false;private pending=false;private disposed=false;private proof:VictoryProof|null=null;private run='marshal:'+crypto.randomUUID();private lastReport=''
 readonly origin={x:900,y:590};readonly boundary={x:700,y:435,width:400,height:300}
 private player:StagePlaytest|null=null
 private creature=familyMember('iron-marshal')!
 private constructor(private session:FloorSession,private fx:Feedback,private report:(value:FloorCombatReport|null)=>void,private death:()=>void){this.encounter=new FamilyEncounter(this.creature.creature,event=>this.event(event))}
 static async create(session:FloorSession,fx:Feedback,report:(value:FloorCombatReport|null)=>void,death:()=>void){
   const value=new FloorMarshal(session,fx,report,death),base=familyAssets(value.creature.family,value.creature.creature),response=await fetch(base+'manifest.json');if(!response.ok)throw Error('The existing Marshal animation could not load.')
   value.manifest=await response.json();value.image=await stageImage(base+value.manifest.atlas)
   if(session.getSnapshot().campaign!.expedition.receipts['F01.ENCOUNTER.marshal']||session.getSnapshot().campaign!.encounters?.pending?.kind==='marshal'){value.encounter.hp=0;value.encounter.deathElapsed=2000}
   return value
 }
 get active(){return this.live}
 get unrecordedVictory(){return!!this.proof&&!this.session.getSnapshot().campaign?.encounters?.pending&&!this.session.getSnapshot().campaign?.expedition.receipts['F01.ENCOUNTER.marshal']}
 private point(p:{x:number;z:number}){return{x:this.origin.x+p.x*32,y:this.origin.y+p.z*32}}
 get position(){return this.point(this.encounter.position)}
 bounds(){return this.live?this.boundary:null}
 solids(){const p=this.position,r=this.creature.creature.radius*32;return this.encounter.hp>0?[{x:p.x-r,y:p.y-r,width:r*2,height:r*2}]:[]}
 begin(play:StagePlaytest){
   if(this.live)return true
   const s=this.session.getSnapshot().campaign!
   if(s.expedition.receipts['F01.ENCOUNTER.marshal']){this.session.notice('Marshal cleared this expedition. A fresh expedition permits a rematch.');return false}
   if(s.encounters?.pending||this.proof){this.session.error('Claim or save the previous victory first.');return false}
   if(Math.hypot(play.position.x-650,play.position.y-490)>130){this.session.error('Approach the Marshal Dock entry board first.');return false}
   this.encounter.reset();this.encounter.playerHp=vitals(s).hp;this.run='marshal:'+crypto.randomUUID();this.live=true;this.player=play
   if(!play.relocate({x:760,y:690})){this.live=false;this.session.error('The dock entry is blocked. No encounter started.');return false}
   play.resetItems();this.encounter.start();this.session.notice('Marshal Dock entered · read Riot Sweep and Siege Lock, then counter during recovery.');return true
 }
 leave(play:StagePlaytest){
   if(this.pending||this.unrecordedVictory||this.session.getSnapshot().campaign?.encounters?.pending){this.session.error('Save and claim the accepted victory before leaving.');return}
   this.proof=null;this.live=false;this.encounter.pause();if(this.encounter.hp>0)this.encounter.reset();play.resetItems();play.relocate({x:650,y:490});this.report(null);this.session.notice('Left Marshal Dock. An unfinished fight resets; no loot was granted.')
 }
 tick(delta:number,play:StagePlaytest){
   if(!this.live||this.pending||this.disposed||delta<=0)return
   this.player=play;this.encounter.playerHp=vitals(this.session.getSnapshot().campaign!).hp
   if(this.encounter.playerHp>0&&this.encounter.hp>0)this.encounter.running=true
   this.encounter.advance(delta,{x:(play.position.x-this.origin.x)/32,z:(play.position.y-this.origin.y)/32})
   const e=this.encounter,r=e.report(),key=[r.hp,r.playerHp,r.enraged,r.window,Math.floor(r.phaseElapsed/100),r.cast].join(':')
   if(key!==this.lastReport){this.lastReport=key;this.report({...r,kind:'marshal',name:'Iron Marshal',maxHp:3000})}
 }
 targets(){const p=this.position,r=(this.creature.creature.radius+.12)*32;return this.live&&this.encounter.hp>0?[{id:'iron-marshal',kind:'training' as const,rect:{x:p.x-r,y:p.y-r,width:r*2,height:r*2},eligible:!this.pending&&this.encounter.phaseElapsed>=1800}]:[]}
 ability(events:AbilityEvent[],play:StagePlaytest){if(!this.live||this.pending)return;for(const event of events)if(event.kind==='hit'&&event.targetId==='iron-marshal')this.encounter.hit(event.castId+':'+(event.art?.id??'melee'),play.abilitySnapshot.cast?.key==='special'||event.art?80:45)}
 private event(event:ArenaEvent){
   if(this.disposed)return
   if(event.kind==='damage'&&event.target==='boss'){this.fx.hit(this.point(event.point),event.amount,event.weak?'weak':'slash',false);return}
   if(event.kind==='damage'&&event.target==='player'){
     if(this.pending)return;this.pending=true
     const before=vitals(this.session.getSnapshot().campaign!).hp
     void this.session.perform({kind:'encounter-contact',attack:event.attack as keyof typeof ENCOUNTER_DAMAGE,amount:event.amount,contact:'contact:'+crypto.randomUUID()}).then(saved=>{
       if(this.disposed)return;this.encounter.playerHp=vitals(saved??this.session.getSnapshot().campaign!).hp
       if(saved&&before-vitals(saved).hp>0){this.player?.confirmedContact(this.position);this.fx.hit(this.player?.position??this.point(event.point),event.amount,'fire',true)}
       if(saved&&vitals(saved).hp===0)this.death()
     }).finally(()=>{this.pending=false});return
   }
   if(event.kind==='phase'){this.fx.notice(this.position,'OVERCLOCK · larger areas, faster attacks');return}
   if(event.kind==='defeat'&&event.target==='boss'){
     this.proof=acceptFloorVictory('marshal',this.encounter,this.run,this.session.getSnapshot().campaign!.expedition.id);if(this.proof)void this.retryVictory()
   }
 }
 async retryVictory(){
   if(this.pending||this.disposed||!this.proof&&!this.session.getSnapshot().campaign?.encounters?.pending)return;this.pending=true
   try{if(this.proof){const recorded=await this.session.recordVictory(this.proof);if(!recorded)return}
     if(this.session.getSnapshot().campaign?.encounters?.pending){const claimed=await this.session.perform({kind:'claim-encounter'});if(!claimed)return}
     this.proof=null;this.fx.notice(this.position,'Marshal loot saved · return to Sena')
   }finally{this.pending=false}
 }
 ground(c:CanvasRenderingContext2D){if(!this.live)return;for(const area of this.encounter.areas()){
   const p=this.point(area),r=area.outer*32;c.save();c.strokeStyle=area.active?'#ff8c68':'#ffce7a';c.fillStyle=area.active?'#eb725b66':'#e9b45a30';c.lineWidth=2;c.setLineDash(area.active?[]:[6,3]);c.beginPath()
   if(area.kind==='sector'){const a=Math.PI/2-area.facing;c.moveTo(p.x,p.y);c.arc(p.x,p.y,r,a-area.angle/2,a+area.angle/2);c.closePath()}else{c.arc(p.x,p.y,r,0,Math.PI*2);if(area.inner>0){c.moveTo(p.x+area.inner*32,p.y);c.arc(p.x,p.y,area.inner*32,0,Math.PI*2,true)}}
   c.fill('evenodd');c.stroke();c.fillStyle='#ffe8bc';c.font='600 11px "Instrument Sans"';c.textAlign='center';c.fillText(area.active?'CONTACT':this.encounter.cast?.skill.name??'Warning',p.x,p.y-r-6);c.restore()
 }}
 draw(c:CanvasRenderingContext2D,reduced:boolean){
   const e=this.encounter,p=this.position,m=this.manifest,frame=m.poses[e.frame]??0,row=e.enraged?this.creature.creature.enragedRow??0:this.creature.creature.row,size=Math.round(40*3.4*m.cellHeight/m.contentHeight)
   c.save();c.imageSmoothingEnabled=false;c.globalAlpha=e.hp<=0?Math.max(.2,1-e.deathElapsed/1200):1;c.fillStyle='#10192e88';c.beginPath();c.ellipse(p.x,p.y,29,10,0,0,Math.PI*2);c.fill();c.drawImage(this.image,frame*m.cellWidth,row*m.cellHeight,m.cellWidth,m.cellHeight,Math.round(p.x-size/2),Math.round(p.y-m.baseline/m.cellHeight*size)+(reduced?0:Math.round(Math.sin(e.clock/500)*.5)),size,size);c.restore()
 }
 dispose(){this.disposed=true;this.encounter.pause();this.player=null;this.proof=null}
}
