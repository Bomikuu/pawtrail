import type { ArenaEncounter } from '../monsters/arena-contract'
export type EncounterKind='marshal'|'bastion'
export type VictoryRecord={kind:EncounterKind;id:string;expedition:string}
export type VictoryProof=VictoryRecord&{readonly accepted:true}
const issued=new WeakSet<object>()
/** Issued only from a running floor encounter's real defeat callback, never a UI flag. */
export function acceptFloorVictory(kind:EncounterKind,encounter:ArenaEncounter,id:string,expedition:string):VictoryProof|null{
 if(encounter.hp!==0||encounter.playerHp<=0||encounter.clock<=0||encounter.running)return null
 const components=encounter.components?.()
 if(kind==='bastion'&&(!components?.length||components.some(component=>component.hp>0)))return null
 const proof:VictoryProof=Object.freeze({kind,id,expedition,accepted:true});issued.add(proof);return proof
}
export const isFloorVictory=(proof:VictoryProof)=>issued.has(proof)
