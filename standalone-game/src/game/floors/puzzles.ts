import type { Campaign } from './state'
export const RELAY_CELLS=[1,2,3,4,5] as const
export const INITIAL_RELAY=[0,1,2,1,2,3,0,0,0]
export const ARCHIVE_SEQUENCE=[0,1,0,2] as const
export const SYMBOLS=['Fish','Moon','Star'] as const
export const LOCKER_CODE='0412'
export function puzzleState(state:Campaign){return structuredClone(state.puzzles??{relay:INITIAL_RELAY,archive:[]})}
const directions=['N','E','S','W'] as const
const original:Record<number,number[]>={1:[2,1],2:[3,2],3:[3,1],4:[3,0],5:[0,1]}
export function relayPorts(index:number,rotation:number){return(original[index]??[]).map(port=>directions[(port+rotation)%4])}
/** Trace actual matching ports, including symmetric straight-tile solutions. */
export function relayTrace(rotations:readonly number[]){
  const visited:number[]=[],offset=[-3,1,3,-1]
  let index=3,incoming=3
  while(visited.length<9){
    if(visited.includes(index)||!original[index])return{solved:false,path:visited}
    visited.push(index)
    const ports=original[index].map(port=>(port+rotations[index])%4)
    if(!ports.includes(incoming))return{solved:false,path:visited}
    const outgoing=ports.find(port=>port!==incoming)!
    if(index===5&&outgoing===1)return{solved:true,path:visited}
    if(outgoing===1&&index%3===2||outgoing===3&&index%3===0)return{solved:false,path:visited}
    index+=offset[outgoing];incoming=(outgoing+2)%4
  }
  return{solved:false,path:visited}
}
