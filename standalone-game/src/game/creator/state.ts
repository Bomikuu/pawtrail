import { defaultAppearance, appearanceSignature, readAppearance, type ActorAppearance, type SavedCharacter } from '../actor-rig/appearance'
import { actorPreviews } from '../runtime/actor-previews'
import { yaeStudyAppearance } from '../actor-rig/yae-study-appearance'
import { siegAppearance } from '../actor-rig/sieg-appearance'
import { sieghartAppearance } from '../actor-rig/sieghart-appearance'
import { aureliaAppearance } from '../actor-rig/aurelia-appearance'
import {rikaAppearance,peonyAppearance} from '../actor-rig/rika-appearance'
import {miraAppearance} from '../actor-rig/mira-appearance'
import type { CreatorPreviewModel } from './preview-models'

const KEY='pawtrail:character-draft:v1'
const customBase=defaultAppearance();customBase.parts={...customBase.parts,hair:'cropped',outfit:'tunic',legs:'trousers',backpack:false};customBase.colors={...customBase.colors,shirt:'#d8d3c7',shirtLight:'#f3eee2',shirtDark:'#9c9a91',jacket:'#d8d3c7',jacketLight:'#eee5d3',shorts:'#99998d',shortsLight:'#bebcb0',shortsDark:'#72756e'}
export const creatorTemplates=[{id:'rescuer',name:'Trail rescuer',appearance:defaultAppearance(),previewModel:'shared' as CreatorPreviewModel},{id:'custom-base',name:'Custom base · Refined v2',appearance:customBase,previewModel:'shared' as CreatorPreviewModel},...actorPreviews.filter(a=>a.kind==='rescuer').map(row=>({
  id:row.id,name:row.id==='amber-outrider'?'Amber · refined model':row.name,previewModel:(row.id==='amber-outrider'?'amber':'shared')as CreatorPreviewModel,appearance:{...defaultAppearance(),parts:{...defaultAppearance().parts,...row.parts},colors:{...defaultAppearance().colors,...row.colors},accessories:{...defaultAppearance().accessories,...row.accessories,glasses:row.accessories.glasses===true},face:row.face??defaultAppearance().face} as ActorAppearance,
})),{id:'yae-miko',name:'Yae Miko · refined model',appearance:yaeStudyAppearance(),previewModel:'yae' as CreatorPreviewModel},{id:'sieg',name:'Sieg · Stormwarden',appearance:siegAppearance(),previewModel:'sieg' as CreatorPreviewModel},{id:'sieghart',name:'Sieghart · Painterly anime',appearance:sieghartAppearance(),previewModel:'sieghart' as CreatorPreviewModel},{id:'aurelia-weiss',name:'Aurelia Weiss · Moonfeather Warden',appearance:aureliaAppearance(),previewModel:'aurelia' as CreatorPreviewModel},{id:'rika-hoshino',name:'Rika Hoshino · Rescue Pilot',appearance:rikaAppearance(),previewModel:'rika' as CreatorPreviewModel},{id:'peony-7',name:'Peony-7 · Rescue Mech',appearance:peonyAppearance(),previewModel:'peony' as CreatorPreviewModel},{id:'mira-adler',name:'Mira Adler · Glasshouse Guardian',appearance:miraAppearance(),previewModel:'mira' as CreatorPreviewModel}]
type CreatorState={name:string;appearance:ActorAppearance;previewModel:CreatorPreviewModel;selected:SavedCharacter|null;baseline:string;renderRevision:number;error:string}
const signature=(name:string,appearance:ActorAppearance)=>name.trim()+'|'+appearanceSignature(appearance)
const initialName='My rescuer',initial=defaultAppearance()
let state:CreatorState={name:initialName,appearance:initial,previewModel:'shared',selected:null,baseline:signature(initialName,initial),renderRevision:0,error:''}
if(typeof window!=='undefined')try{
  const draft=JSON.parse(localStorage.getItem(KEY)??'null'),appearance=readAppearance(draft?.appearance)
  if(appearance&&typeof draft.name==='string'&&draft.name.length<=64)state={...state,name:draft.name,appearance,previewModel:['amber','yae','sieg','sieghart','aurelia','rika','peony','mira'].includes(draft.previewModel)?draft.previewModel:'shared'}
}catch{/* Draft restoration is optional. */}
const listeners=new Set<()=>void>()
let persist:ReturnType<typeof setTimeout>|undefined
function patch(value:Partial<CreatorState>){state={...state,...value};for(const fn of listeners)fn()
  clearTimeout(persist);persist=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify({name:state.name,appearance:state.appearance,previewModel:state.previewModel}))}catch{/* Explicit save reports storage failures. */}},250)
}
export const characterCreator={
  subscribe(fn:()=>void){listeners.add(fn);return()=>{listeners.delete(fn)}},getSnapshot:()=>state,
  dirty:()=>state.previewModel==='shared'&&signature(state.name,state.appearance)!==state.baseline,
  name(name:string){patch({name,error:''})},
  edit(value:Partial<ActorAppearance>){patch({appearance:{...state.appearance,...value,accessories:{...state.appearance.accessories,...value.accessories}},renderRevision:state.renderRevision+1,error:''})},
  load(row:SavedCharacter){patch({name:row.name,appearance:row.appearance,previewModel:'shared',selected:row,baseline:signature(row.name,row.appearance),renderRevision:state.renderRevision+1,error:''})},
  template(id:string){const row=creatorTemplates.find(t=>t.id===id);if(row){const name=row.previewModel==='amber'?'Amber':row.previewModel==='yae'?'Yae Miko':row.previewModel==='sieg'?'Sieg':row.previewModel==='sieghart'?'Sieghart':row.previewModel==='aurelia'?'Aurelia Weiss':row.previewModel==='rika'?'Rika Hoshino':row.previewModel==='peony'?'Peony-7':row.previewModel==='mira'?'Mira Adler':row.name;patch({name,appearance:row.appearance,previewModel:row.previewModel,selected:null,baseline:signature(name,row.appearance),renderRevision:state.renderRevision+1,error:''})}},
  saved(row:SavedCharacter){patch({selected:row,baseline:signature(row.name,row.appearance),error:''})},
  error(error:string){patch({error})},
}

let capture:(()=>string)|undefined
export const creatorPreviewCapture={set(fn:(()=>string)|undefined){capture=fn},take(){return capture?.()}}
