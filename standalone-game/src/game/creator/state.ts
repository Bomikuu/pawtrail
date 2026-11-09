import { defaultAppearance, appearanceSignature, readAppearance, type ActorAppearance, type SavedCharacter } from '../actor-rig/appearance'
import { actorPreviews } from '../runtime/actor-previews'

const KEY='pawtrail:character-draft:v1'
export const creatorTemplates=[{id:'rescuer',name:'Trail rescuer',appearance:defaultAppearance()},...actorPreviews.filter(a=>a.kind==='rescuer').map(row=>({
  id:row.id,name:row.name,appearance:{...defaultAppearance(),parts:{...defaultAppearance().parts,...row.parts},colors:{...defaultAppearance().colors,...row.colors},accessories:{...defaultAppearance().accessories,...row.accessories,glasses:row.accessories.glasses===true},face:row.face??defaultAppearance().face} as ActorAppearance,
}))]
type CreatorState={name:string;appearance:ActorAppearance;selected:SavedCharacter|null;baseline:string;renderRevision:number;error:string}
const signature=(name:string,appearance:ActorAppearance)=>name.trim()+'|'+appearanceSignature(appearance)
const initialName='My rescuer',initial=defaultAppearance()
let state:CreatorState={name:initialName,appearance:initial,selected:null,baseline:signature(initialName,initial),renderRevision:0,error:''}
if(typeof window!=='undefined')try{
  const draft=JSON.parse(localStorage.getItem(KEY)??'null'),appearance=readAppearance(draft?.appearance)
  if(appearance&&typeof draft.name==='string'&&draft.name.length<=64)state={...state,name:draft.name,appearance}
}catch{/* Draft restoration is optional. */}
const listeners=new Set<()=>void>()
let persist:ReturnType<typeof setTimeout>|undefined
function patch(value:Partial<CreatorState>){state={...state,...value};for(const fn of listeners)fn()
  clearTimeout(persist);persist=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify({name:state.name,appearance:state.appearance}))}catch{/* Explicit save reports storage failures. */}},250)
}
export const characterCreator={
  subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},getSnapshot:()=>state,
  dirty:()=>signature(state.name,state.appearance)!==state.baseline,
  name(name:string){patch({name,error:''})},
  edit(value:Partial<ActorAppearance>){patch({appearance:{...state.appearance,...value,accessories:{...state.appearance.accessories,...value.accessories}},renderRevision:state.renderRevision+1,error:''})},
  load(row:SavedCharacter){patch({name:row.name,appearance:row.appearance,selected:row,baseline:signature(row.name,row.appearance),renderRevision:state.renderRevision+1,error:''})},
  template(id:string){const row=creatorTemplates.find(t=>t.id===id);if(row)patch({name:row.name,appearance:row.appearance,selected:null,baseline:signature(row.name,row.appearance),renderRevision:state.renderRevision+1,error:''})},
  saved(row:SavedCharacter){patch({selected:row,baseline:signature(row.name,row.appearance),error:''})},
  error(error:string){patch({error})},
}

let capture:(()=>string)|undefined
export const creatorPreviewCapture={set(fn:(()=>string)|undefined){capture=fn},take(){return capture?.()}}
