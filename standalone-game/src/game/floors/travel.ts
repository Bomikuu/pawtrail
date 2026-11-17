import type { Campaign, StageId } from './state'

const neighbors: Record<StageId, readonly StageId[]> = {
  'hub.concourse': ['f01.stage.arrival'],
  'f01.stage.arrival': ['hub.concourse', 'f01.stage.market'],
  'f01.stage.market': ['f01.stage.arrival', 'f01.stage.undergrid', 'f01.stage.switchyard'],
  'f01.stage.undergrid': ['f01.stage.market', 'f01.stage.skybridge'],
  'f01.stage.skybridge': ['f01.stage.undergrid', 'f01.stage.switchyard'],
  'f01.stage.switchyard': ['f01.stage.skybridge', 'f01.stage.market', 'f01.stage.bastion'],
  'f01.stage.bastion': ['f01.stage.switchyard'],
}
export type TravelPlan = { from: StageId; to: StageId; expectedRevision: number }
export type TravelResult = { ok: true; plan: TravelPlan } | { ok: false; message: string }
/** `installed` comes from actual loaded map bindings, not this design graph.
 * Nothing in this module registers or creates a map/portal automatically.
 */
export function planTravel(state: Campaign, to: StageId, installed: ReadonlySet<StageId>): TravelResult {
  const from = state.location.stage
  if (!neighbors[from].includes(to)) return { ok: false, message: 'There is no connected route to that destination.' }
  if (!installed.has(to)) return { ok: false, message: 'This destination is not installed yet. Stay here or choose an available route.' }
  if (from === 'f01.stage.market' && to === 'f01.stage.undergrid' && state.quests.q02 !== 'claimed') return { ok: false, message: 'Report the restored auxiliary line to Mara before entering the Undergrid.' }
  if ((from === 'f01.stage.market' && to === 'f01.stage.switchyard' || from === 'f01.stage.switchyard' && to === 'f01.stage.market' || to === 'f01.stage.bastion') && !state.facts['gate-authenticated']) return { ok: false, message: 'Sena must authenticate the Relay Seal and Transit Writ before this gate opens.' }
  if(to==='f01.stage.bastion'&&!['active','claimed'].includes(state.quests.q05))return{ok:false,message:'Accept The Neon Bastion from Sena before entering.'}
  if(state.encounters?.pending)return{ok:false,message:'Claim your recorded encounter victory before travelling.'}
  return { ok: true, plan: { from, to, expectedRevision: state.revision } }
}
export type LoadedFloorStage = {
  id: StageId
  /** Resolve using actual navigation/foot geometry; null means unsafe arrival. */
  arrival: (from: StageId, checkpoint: string | null) => { x: number; y: number } | null
  dispose: () => void
}
/** Loader/UI integration must preload, resolve a safe arrival, persist the new
 * location under the save lock, then activate. On failure dispose the candidate
 * and retain the current stage. That adapter is part of the later playable loop.
 */
export type FloorStageLoader = (plan: TravelPlan, signal: AbortSignal) => Promise<LoadedFloorStage>
