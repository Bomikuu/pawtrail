import { HydraScene,type HydraSceneReport } from '../monsters/hydra-scene'
import type { ArenaEvent } from '../monsters/arena-contract'
import type { ActionKey } from '../items/document'
import type { ObjectState } from '../housing/types'
import type { PlayCharacter } from '../stage-editor/play-character-presets'
import { vitals } from './commands'
import { acceptFloorVictory,type VictoryProof } from './encounter-proof'
import type { FloorSession } from './session'
import type { Campaign } from './state'
import type { FloorCombatReport,FloorView } from './view'
import type { ENCOUNTER_DAMAGE } from './phase5-commands'
/** The real existing Kurogane arena, owned by this floor slot; no rehearsal controls. */
export class FloorArenaView implements FloorView{
 private scene!:HydraScene;private suspended=true;private pending=false;private disposed=false;private proof:VictoryProof|null=null;private victory:ArenaEvent|null=null
 private run='bastion:'+crypto.randomUUID();private expedition:string
 readonly playPosition=null
 private constructor(private session:FloorSession,private report:(value:FloorCombatReport)=>void,private death:()=>void){this.expedition=session.getSnapshot().campaign!.expedition.id}
 static async create(host:HTMLElement,session:FloorSession,character:PlayCharacter,report:(value:FloorCombatReport)=>void,death:()=>void,fail:(message:string)=>void,signal:AbortSignal){
   const view=new FloorArenaView(session,report,death)
   view.scene=await HydraScene.create(host,value=>view.publish(value),fail,signal,'robot',undefined,{floor:true,character,initialHp:vitals(session.getSnapshot().campaign!).hp,weaponDamage:{primary:45,special:80},onEvent:(event,scene)=>{view.scene=scene;return view.receive(event)}})
   view.scene.setMuted(true)
   if(session.getSnapshot().campaign!.expedition.receipts['F01.ENCOUNTER.bastion']||session.getSnapshot().campaign!.encounters?.pending?.kind==='bastion'){const e=view.scene.encounter as import('../monsters/robot-encounter').RobotEncounter;e.hp=0;e.deathElapsed=2000;for(const f of e.funnels)f.hp=0}
   view.scene.hold(true);return view
 }
 private publish(value:HydraSceneReport){if(!this.disposed)this.report({...value,kind:'bastion',name:'Kurogane · The Neon Bastion',maxHp:8400})}
 private receive(event:ArenaEvent){
   if(this.disposed)return false
   if(event.kind==='damage'&&event.target==='player'){
     if(this.pending)return false;this.pending=true;this.scene.hold(true)
     const before=vitals(this.session.getSnapshot().campaign!).hp
     void this.session.perform({kind:'encounter-contact',attack:event.attack as keyof typeof ENCOUNTER_DAMAGE,amount:event.amount,contact:'contact:'+crypto.randomUUID()}).then(saved=>{
       if(this.disposed)return;this.scene.encounter.playerHp=vitals(saved??this.session.getSnapshot().campaign!).hp
       if(saved&&before-vitals(saved).hp>0)this.scene.presentEvent(event)
       if(saved&&vitals(saved).hp===0)this.death()
     }).finally(()=>{this.pending=false;this.applyHold()});return false
   }
   if(event.kind==='defeat'&&event.target==='player')return false
   if(event.kind==='defeat'&&event.target==='boss'){
     this.proof=acceptFloorVictory('bastion',this.scene.encounter,this.run,this.expedition);this.victory=event;this.scene.hold(true);if(this.proof)void this.retryVictory();return false
   }
   return true
 }
 async retryVictory(){
   if(this.pending||this.disposed)return
   this.pending=true;this.scene.hold(true)
   try{if(this.proof){const saved=await this.session.recordVictory(this.proof);if(!saved)return;if(this.victory)this.scene.presentEvent(this.victory)}
     if(this.session.getSnapshot().campaign?.encounters?.pending){const claimed=await this.session.perform({kind:'claim-encounter'});if(!claimed)return}
     this.proof=null;this.victory=null
   }finally{this.pending=false;this.applyHold()}
 }
 get canvas(){return this.scene.inputCanvas}
 get inEncounter(){return this.scene.encounter.hp>0}
 get unrecordedVictory(){return!!this.proof&&!this.session.getSnapshot().campaign?.encounters?.pending&&!this.session.getSnapshot().campaign?.expedition.receipts['F01.ENCOUNTER.bastion']}
 private applyHold(){if(!this.disposed)this.scene.hold(this.suspended||this.pending||this.scene.encounter.hp<=0||vitals(this.session.getSnapshot().campaign!).hp===0)}
 setSuspended(value:boolean){this.suspended=value;this.applyHold()}
 syncCampaign(state:Campaign){this.scene.encounter.playerHp=vitals(state).hp;this.scene.refreshReport()}
 updateObjectStates(_states:Record<string,ObjectState>){}
 focus(){this.scene.focus()}
 pinObject(_id:string|null){}
 setPlayInput(x:number,y:number){if(!this.suspended&&!this.pending)this.scene.move(x,y)}
 interactPlay(){}
 zoom(direction:number){this.scene.zoomView(direction)}
 useItem(key:ActionKey){if(!this.suspended&&!this.pending)this.scene.useWeapon(key)}
 targets(id:string){this.scene.target(id)}
 resumeCombat(){this.applyHold()}
 dispose(){this.disposed=true;this.scene.dispose()}
}
