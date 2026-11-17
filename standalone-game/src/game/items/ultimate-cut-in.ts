import {actorIllustrations} from '../creator/illustrations'

export type UltimateCutInState={id:string;source:string;castId:string;character:'amber'|'yae';ability:string;leaving:boolean}
let state:UltimateCutInState|null=null,serial=0
let leaveTimer:ReturnType<typeof setTimeout>|undefined,clearTimer:ReturnType<typeof setTimeout>|undefined
const listeners=new Set<()=>void>()
const publish=()=>listeners.forEach(listener=>listener())
const stop=()=>{clearTimeout(leaveTimer);clearTimeout(clearTimer);leaveTimer=clearTimer=undefined}
function leave(id:string){
 if(!state||state.id!==id||state.leaving)return
 clearTimeout(leaveTimer);state={...state,leaving:true};publish()
 clearTimer=setTimeout(()=>{if(state?.id===id){state=null;publish()}},180)
}
export const ultimateCutIn={
 subscribe(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener)}},
 getSnapshot:()=>state,
 getServerSnapshot:()=>null,
 show(event:Omit<UltimateCutInState,'id'|'leaving'>){
  if(!actorIllustrations[event.character]||state?.source===event.source&&state.castId===event.castId)return
  stop();state={...event,id:'ultimate-art-'+(++serial),leaving:false};publish()
  const id=state.id;leaveTimer=setTimeout(()=>leave(id),900)
 },
 finish(source:string,castId:string){if(state?.source===source&&state.castId===castId)leave(state.id)},
 clear(source:string){if(state?.source!==source)return;stop();state=null;publish()},
}
