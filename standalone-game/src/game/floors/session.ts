import { applyOutcome } from './state'
import { reputationChanges } from './commands'
import { floorCommand, type FloorAction } from './actions'
import { FloorCampaignStore } from './store'
import { planTravel } from './travel'
import { INSTALLED_STAGES, stageNames } from './stages'
import type { Campaign, StageId } from './state'
import type { VictoryProof } from './encounter-proof'

type Snapshot={campaign:Campaign|null;status:'missing'|'ready'|'error';busy:boolean;notice:string;error:string}
export type PreparedFloor={activate:()=>void;dispose:()=>void}
/** One local slot, with UI success published only after durable writes resolve. */
export class FloorSession{
  private snapshot:Snapshot={campaign:null,status:'missing',busy:false,notice:'',error:''}
  private listeners=new Set<()=>void>()
  private disposed=false
  private acknowledgements:Promise<void>=Promise.resolve()
  private pendingSeen=new Set<string>()
  constructor(readonly store:FloorCampaignStore){}
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}}
  getSnapshot=()=>this.snapshot
  private patch(value:Partial<Snapshot>){if(this.disposed)return;this.snapshot={...this.snapshot,...value};this.listeners.forEach(listener=>listener())}
  private accept(campaign:Campaign,value:Partial<Snapshot>={}){if(!this.snapshot.campaign||campaign.revision>=this.snapshot.campaign.revision)this.patch({campaign,status:'ready',...value})}
  refresh(){const result=this.store.load();if(result.ok)this.accept(result.state,{error:''});else this.patch({status:result.status==='missing'?'missing':'error',error:result.status==='missing'?'':result.message});return result}
  async begin(){
    if(this.snapshot.busy)return false;this.patch({busy:true,error:''})
    try{const result=await this.store.create(crypto.randomUUID());if(!result.ok){this.patch({error:result.message});return false}this.accept(result.state,{notice:'Local adventure created. Enter Floor 01 from the lift.'});return true}finally{this.patch({busy:false})}
  }
  async perform(action:FloorAction){
    if(this.snapshot.busy||!this.snapshot.campaign)return null
    if(this.snapshot.campaign.vitals?.hp===0){this.patch({error:'Return to your safe checkpoint before taking another action.'});return null}
    this.patch({busy:true,error:''})
    try{
      await this.acknowledgements
      const before=this.snapshot.campaign!,requestId=crypto.randomUUID(),prepared=floorCommand(before,action,requestId)
      if(!prepared.ok){this.patch({error:prepared.message});return null}
      const result=await this.store.commit(prepared.outcome,{id:'accepted:'+requestId,kind:prepared.outcome.event},before.revision)
      if(!result.ok){if(result.status==='conflict')this.refresh();this.patch({error:result.message});return null}
      const delta=result.status==='applied'?reputationChanges(before,result.state):''
      this.accept(result.state,{notice:result.status==='already-applied'?'That outcome is already saved; nothing was granted again.':prepared.message+(delta?' '+delta:'.')})
      return result.state
    }finally{this.patch({busy:false})}
  }
  /** Prepare changed camp geometry before committing item/fixture state. */
  async performPrepared(action:FloorAction,prepare:(candidate:Campaign)=>Promise<PreparedFloor>,signal:AbortSignal){
    if(this.snapshot.busy||!this.snapshot.campaign)return null
    if(this.snapshot.campaign.vitals?.hp===0){this.patch({error:'Return to your safe checkpoint before changing camp furnishings.'});return null}
    this.patch({busy:true,error:'',notice:'Preparing the furnishing change…'});let candidate:PreparedFloor|undefined
    try{
      await this.acknowledgements
      const before=this.snapshot.campaign!,id=crypto.randomUUID(),command=floorCommand(before,action,id)
      if(!command.ok){this.patch({error:command.message});return null}
      const event={id:'accepted:'+id,kind:command.outcome.event},preview=applyOutcome(before,command.outcome,event)
      if(!preview.ok){this.patch({error:preview.message});return null}
      if(preview.status==='already-applied'){this.patch({notice:'This furnishing change is already saved.'});return before}
      candidate=await prepare(preview.state)
      if(signal.aborted)throw Error('Furnishing change cancelled before saving. Your item was kept.')
      const saved=await this.store.commit(command.outcome,event,before.revision)
      if(!saved.ok){candidate.dispose();candidate=undefined;if(saved.status==='conflict')this.refresh();this.patch({error:saved.message});return null}
      if(signal.aborted){candidate.dispose();candidate=undefined;this.accept(saved.state,{notice:'Furnishing state saved. Resume your camp to load it.'});return saved.state}
      candidate.activate();candidate=undefined;this.accept(saved.state,{notice:command.message});return saved.state
    }catch(error){candidate?.dispose();this.patch({error:error instanceof Error?error.message:'The furnishing change could not be prepared. No completion was confirmed.'});return null}
    finally{this.patch({busy:false})}
  }
  async seen(id:string){
    if(this.snapshot.campaign?.seen.includes(id)||this.pendingSeen.has(id))return
    this.pendingSeen.add(id)
    this.acknowledgements=this.acknowledgements.then(async()=>{
      try{const result=await this.store.markSeen(id);if(result.ok)this.accept(result.state);else this.patch({error:result.message+' This line may appear again next visit.'})}finally{this.pendingSeen.delete(id)}
    })
    await this.acknowledgements
  }
  async travel(to:StageId,prepare:()=>Promise<PreparedFloor>,signal:AbortSignal){
    if(this.snapshot.busy||!this.snapshot.campaign)return false
    this.patch({busy:true,error:'',notice:'Loading '+stageNames[to]+'…'})
    let candidate:PreparedFloor|undefined
    try{
      await this.acknowledgements
      const before=this.snapshot.campaign!,plan=planTravel(before,to,INSTALLED_STAGES)
      if(!plan.ok){this.patch({error:plan.message});return false}
      candidate=await prepare()
      if(signal.aborted)throw Error('Travel cancelled before saving. Your previous location is unchanged.')
      const result=await this.store.travel(to,before.revision,INSTALLED_STAGES)
      if(!result.ok){candidate.dispose();candidate=undefined;if(result.status==='conflict')this.refresh();this.patch({error:result.message,notice:'Travel did not complete. Your current scene was kept.'});return false}
      if(signal.aborted){candidate.dispose();candidate=undefined;this.accept(result.state,{notice:'Destination saved. Resume this adventure to continue.'});return false}
      candidate.activate();candidate=undefined
      const starter=result.state.scrip-before.scrip
      this.accept(result.state,{notice:'Arrived at '+stageNames[to]+'.'+(starter>0?' First floor entry · +'+starter+' local SC.':'')})
      return true
    }catch(error){candidate?.dispose();this.patch({error:error instanceof Error?error.message:'The destination could not load.',notice:'Travel stopped. No arrival was confirmed.'});return false}
    finally{this.patch({busy:false})}
  }
  async newExpedition(){
    if(this.snapshot.busy||!this.snapshot.campaign)return false
    this.patch({busy:true,error:''})
    try{await this.acknowledgements;const result=await this.store.newExpedition(crypto.randomUUID(),this.snapshot.campaign!.revision);if(!result.ok){this.patch({error:result.message});return false}this.accept(result.state,{notice:'New expedition started. Shop stock, resource nodes and selected supplies replenished; Maintenance Run is available again. Permanent rewards, decisions, reputation and camp furnishings are retained.'});return true}finally{this.patch({busy:false})}
  }
  async recordVictory(proof:VictoryProof){
    if(this.snapshot.busy||!this.snapshot.campaign)return null
    this.patch({busy:true,error:'',notice:'Recording accepted encounter victory…'})
    try{await this.acknowledgements;const result=await this.store.recordVictory(proof,this.snapshot.campaign!.revision)
      if(!result.ok){if(result.status==='conflict')this.refresh();this.patch({error:result.message+' Victory is held in this session for retry.'});return null}
      this.accept(result.state,{notice:'Victory recorded. Loot is waiting for its once-only claim.'});return result.state
    }finally{this.patch({busy:false})}
  }
  async recover(prepare:()=>Promise<PreparedFloor>){
    if(this.snapshot.busy||!this.snapshot.campaign)return false
    this.patch({busy:true,error:'',notice:'Preparing safe return…'});let candidate:PreparedFloor|undefined
    try{await this.acknowledgements;candidate=await prepare();const result=await this.store.recover(this.snapshot.campaign!.revision)
      if(!result.ok){candidate.dispose();candidate=undefined;this.patch({error:result.message});return false}
      candidate.activate();candidate=undefined;this.accept(result.state,{notice:'Returned to '+stageNames[result.state.location.stage]+' · 100 HP restored. Unrecorded encounter loot was not granted.'});return true
    }catch(error){candidate?.dispose();this.patch({error:error instanceof Error?error.message:'Safe return could not load. Your save was preserved.'});return false}
    finally{this.patch({busy:false})}
  }
  notice(notice:string){this.patch({notice,error:''})}
  error(error:string){this.patch({error})}
  clearError(){this.patch({error:''})}
  dispose(){this.disposed=true;this.listeners.clear()}
}
