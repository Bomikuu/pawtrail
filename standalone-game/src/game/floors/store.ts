import { applyOutcome, freshCampaign, safeId, validCampaign, type AcceptedEvent, type Campaign, type Outcome, type OutcomeResult } from './state'
import { planTravel } from './travel'
import { neonFoundation } from './neon-foundation'
import type { StageId } from './state'
import { isFloorVictory, type VictoryProof } from './encounter-proof'
import { recoveryStage } from './checkpoints'

type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
export type ExclusiveLock = <T>(name: string, task: () => T | Promise<T>) => Promise<T>
type Loaded = { ok: true; state: Campaign } | { ok: false; status: 'missing' | 'invalid' | 'storage-error'; message: string }
type Failure = { ok: false; status: 'missing' | 'invalid' | 'storage-error' | 'conflict' | 'exists'; message: string }
export type SavedOutcome = OutcomeResult | Failure
export type SavedState = { ok: true; state: Campaign; status: 'saved' | 'unchanged' } | Failure
const MAX_BYTES = 512 * 1024

/** Writes a single validated snapshot under an exclusive local cross-tab lock.
 * Callers show success only after the returned commit resolves successfully.
 * This store never opens, migrates or overwrites neighborhood/editor saves.
 */
export class FloorCampaignStore {
  readonly key: string
  constructor(readonly profileId: string, private storage: StoragePort, private exclusive: ExclusiveLock) {
    if (!safeId(profileId)) throw Error('A valid local save-slot ID is required.')
    this.key = 'pawtrail:floor-campaign:v1:' + profileId
  }
  load(): Loaded {
    let raw: string | null
    try { raw = this.storage.getItem(this.key) }
    catch { return { ok: false, status: 'storage-error', message: 'The local save could not be read. It has not been replaced.' } }
    if (raw === null) return { ok: false, status: 'missing', message: 'No floor-campaign save exists in this slot.' }
    if (raw.length > MAX_BYTES) return { ok: false, status: 'invalid', message: 'The local save exceeds this version’s size limit. It has been preserved.' }
    try {
      const value: unknown = JSON.parse(raw)
      if (!validCampaign(value) || value.profileId !== this.profileId) return { ok: false, status: 'invalid', message: 'This save is invalid or uses an unsupported version. It has been preserved.' }
      return { ok: true, state: value }
    } catch { return { ok: false, status: 'invalid', message: 'The local save is not readable JSON. It has been preserved.' } }
  }
  private write(state: Campaign): Failure | null {
    if (!validCampaign(state)) return { ok: false, status: 'invalid', message: 'The candidate local save is invalid.' }
    const raw = JSON.stringify(state)
    if (raw.length > MAX_BYTES) return { ok: false, status: 'invalid', message: 'The candidate save is too large. Nothing was saved.' }
    try { this.storage.setItem(this.key, raw); return null }
    catch { return { ok: false, status: 'storage-error', message: 'The local outcome could not be saved. No success was confirmed.' } }
  }
  async create(expeditionId: string): Promise<Loaded | Failure> {
    if (!safeId(expeditionId)) return { ok: false, status: 'invalid', message: 'A valid expedition ID is required.' }
    try {
      return await this.exclusive<Loaded | Failure>(this.key, () => {
        const old = this.load()
        if (old.ok) return { ok: false, status: 'exists', message: 'This slot already contains a floor campaign.' } as Failure
        if (old.status !== 'missing') return old
        const state = freshCampaign(this.profileId, expeditionId), failure = this.write(state)
        return failure ?? { ok: true, state }
      })
    } catch { return { ok: false, status: 'storage-error', message: 'The local save lock is unavailable. Nothing was created.' } }
  }
  async commit(outcome: Outcome, event: AcceptedEvent, expectedRevision: number): Promise<SavedOutcome> {
    try {
      return await this.exclusive<SavedOutcome>(this.key, () => {
        const loaded = this.load()
        if (!loaded.ok) return loaded
        if (loaded.state.revision !== expectedRevision) return { ok: false, status: 'conflict', message: 'The local save changed. Refresh the conversation before trying again.' } as Failure
        const result = applyOutcome(loaded.state, outcome, event)
        if (!result.ok || result.status === 'already-applied') return result
        return this.write(result.state) ?? result
      })
    } catch { return { ok: false, status: 'storage-error', message: 'The local outcome lock is unavailable. No success was confirmed.' } }
  }
  private async update(expectedRevision:number|null, change:(state:Campaign)=>Campaign|Failure):Promise<SavedState>{
    try{return await this.exclusive<SavedState>(this.key,()=>{
      const loaded=this.load();if(!loaded.ok)return loaded
      if(expectedRevision!==null&&loaded.state.revision!==expectedRevision)return{ok:false,status:'conflict',message:'The local save changed. Refresh this action before trying again.'}
      const next=change(loaded.state)
      if(!('format' in next))return next
      if(next===loaded.state)return{ok:true,status:'unchanged',state:loaded.state}
      if(next.revision>=1_000_000)return{ok:false,status:'invalid',message:'This save needs a content migration before more changes can be recorded.'}
      next.revision++
      const failure=this.write(next);return failure??{ok:true,status:'saved',state:next}
    })}catch{return{ok:false,status:'storage-error',message:'The local save lock is unavailable. No success was confirmed.'}}
  }
  /** Candidate scene must already be loaded with a collision-safe arrival. */
  travel(to:StageId,expectedRevision:number,installed:ReadonlySet<StageId>){
    return this.update(expectedRevision,state=>{
      const plan=planTravel(state,to,installed);if(!plan.ok)return{ok:false,status:'invalid',message:plan.message}
      let next=structuredClone(state)
      if(to==='f01.stage.arrival'&&!Object.hasOwn(next.receipts,'F01.START')){
        const start=applyOutcome(next,neonFoundation.start,{id:'accepted:F01.START',kind:'floor-entry'})
        if(!start.ok)return{ok:false,status:'invalid',message:start.message}
        next=start.state
      }
      next.location.stage=to;return next
    })
  }
  /** Delivery acknowledgements merge under the lock; they never grant rewards. */
  recover(expectedRevision:number){
    return this.update(expectedRevision,state=>{
      if((state.vitals?.hp??100)!==0)return{ok:false,status:'invalid',message:'Recovery is only available after defeat.'}
      const next=structuredClone(state);next.location.stage=recoveryStage(state);next.vitals={hp:100,maxHp:100,insulation:0};return next
    })
  }
  recordVictory(proof:VictoryProof,expectedRevision:number){
    return this.update(expectedRevision,state=>{
      if(!isFloorVictory(proof)||!safeId(proof.id)||proof.expedition!==state.expedition.id)return{ok:false,status:'invalid',message:'Only an accepted encounter defeat can be recorded.'}
      const stage=proof.kind==='marshal'?'f01.stage.switchyard':'f01.stage.bastion'
      if(state.location.stage!==stage||(state.vitals?.hp??100)<=0)return{ok:false,status:'invalid',message:'The encounter location or player state changed. Retry this victory before leaving.'}
      if(state.expedition.receipts['F01.ENCOUNTER.'+proof.kind])return state
      if(state.encounters?.pending){if(state.encounters.pending.id===proof.id)return state;return{ok:false,status:'invalid',message:'Claim the previous recorded victory before another encounter.'}}
      const next=structuredClone(state);next.encounters={pending:{kind:proof.kind,id:proof.id,expedition:proof.expedition},emblem:next.encounters?.emblem??false};return next
    })
  }
  markSeen(node:string){
    return this.update(null,state=>{
      if(!safeId(node))return{ok:false,status:'invalid',message:'This conversation acknowledgement is invalid.'}
      if(state.seen.includes(node))return state
      if(state.seen.length>=1024)return{ok:false,status:'invalid',message:'This save needs a conversation migration.'}
      const next=structuredClone(state);next.seen.push(node);return next
    })
  }
  newExpedition(id:string,expectedRevision:number){
    return this.update(expectedRevision,state=>{
      if(state.encounters?.pending)return{ok:false,status:'invalid',message:'Claim your recorded encounter loot before starting a fresh expedition.'}
      if(state.location.stage!=='hub.concourse'||!safeId(id)||id===state.expedition.id)return{ok:false,status:'invalid',message:'Start a new expedition from Wayfarer Concourse.'}
      const next=structuredClone(state);next.expedition={id,receipts:{}};next.quests.q11=next.quests.q06==='claimed'?'available':'locked';if(next.activities)next.activities.koi=null;return next
    })
  }
}

/** Explicit opt-in; importing this file never accesses storage or creates a save. */
export function browserFloorStore(profileId: string) {
  if (typeof navigator === 'undefined' || !navigator.locks) throw Error('Exclusive local save locking is unavailable in this browser. Floor-campaign writes are disabled.')
  const exclusive: ExclusiveLock = async <T>(name: string, task: () => T | Promise<T>): Promise<T> =>
    await navigator.locks.request<T | Promise<T>>(name, () => task())
  return new FloorCampaignStore(profileId, window.localStorage, exclusive)
}
