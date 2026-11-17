import { activities,fixtures,CAMP_SLOTS } from './phase6-content'
import { cloneStage, starterStage, type StageDocument, type StageObject } from '../stage-editor/data'
import type { Campaign, StageId } from './state'
import type { FloorPropState } from './prop-state'
import { RESOURCE_NODES } from './content'
import { puzzleState } from './puzzles'
import type { FloorPanel } from './dialogue'

export const INSTALLED_STAGES:ReadonlySet<StageId>=new Set(['hub.concourse','f01.stage.arrival','f01.stage.market','f01.stage.undergrid','f01.stage.skybridge','f01.stage.switchyard','f01.stage.bastion'])
export const stageNames:Partial<Record<StageId,string>>={'hub.concourse':'Wayfarer Concourse','f01.stage.arrival':'Lantern Landing','f01.stage.market':'Lumen Market','f01.stage.undergrid':'Undergrid','f01.stage.skybridge':'Rainline Skybridge','f01.stage.switchyard':'Neon Switchyard','f01.stage.bastion':'Kurogane · The Neon Bastion'}
export type StageInteraction={panel:FloorPanel;label:string;to?:StageId;blocked?:string;node?:string}
export function stageInteraction(stage:StageId,target:string):StageInteraction|null{
  if(stage==='f01.stage.arrival'&&target==='plaza-controller')return{panel:'governance',label:'Who Owns the Dawn · public controller'}
  if(stage==='f01.stage.arrival'&&target==='plaza-koi')return{panel:'koi',label:'P04 · Koi Signal Echo'}
  if(stage==='f01.stage.market'&&target==='repair-station')return{panel:'crafting',label:'Repair Bay · crafting and awning'}
  if(stage==='hub.concourse'&&target==='camp-koi')return{panel:'furnishings',label:'Camp Koi Lamp'}
  if(stage==='f01.stage.switchyard')return target==='return-skybridge'?{panel:'travel',label:'Return to Rainline Skybridge',to:'f01.stage.skybridge'}:target==='market-shortcut'?{panel:'travel',label:'Market shortcut',to:'f01.stage.market'}:target==='bastion-gate'?{panel:'travel',label:'Enter the Neon Bastion',to:'f01.stage.bastion'}:target==='authorization'?{panel:'gate-authorization',label:'Two-record gate authorization'}:target==='dispatch-beacon'?{panel:'dispatch-checkpoint',label:'Freight Dispatch checkpoint'}:target==='dispatch-supply'?{panel:'dispatch-supplies',label:'Dispatch supply bin'}:target==='marshal-entry'?{panel:'marshal-dock',label:'Iron Marshal · Dock challenge'}:null
  if(stage==='f01.stage.market'&&target==='market-shortcut')return{panel:'travel',label:'Switchyard shortcut',to:'f01.stage.switchyard'}
  if(stage==='f01.stage.market'&&target==='advert-panel')return{panel:'resource',label:'Inspect the unlit advert panel',node:'advert-cache'}
  if(RESOURCE_NODES[target]?.stage===stage)return{panel:'resource',label:RESOURCE_NODES[target].label,node:target}
  if(stage==='f01.stage.undergrid')return target==='return-market'?{panel:'travel',label:'Return to Lumen Market',to:'f01.stage.market'}:target==='skybridge-lift'?{panel:'travel',label:'Lift to Rainline Skybridge',to:'f01.stage.skybridge'}:target==='p02'?{panel:'relay',label:'P02 · Restore the relay'}:target==='undergrid-plan'?{panel:'planning',label:'Utility service plan'}:null
  if(stage==='f01.stage.skybridge')return target==='return-undergrid'?{panel:'travel',label:'Return to Undergrid',to:'f01.stage.undergrid'}:target==='switchyard-gate'?{panel:'travel',label:'Continue to the Neon Switchyard',to:'f01.stage.switchyard'}:target==='p03'?{panel:'archive',label:'P03 · Echo of the koi'}:target==='maintenance-plaque'?{panel:'plaque',label:'Public maintenance plaque'}:null
  if(stage==='hub.concourse')return target==='lift'?{panel:'travel',label:'Lift to Lantern Landing',to:'f01.stage.arrival'}:target==='planning'?{panel:'planning',label:'Expedition board'}:target==='lobby-counter'?{panel:'planning',label:'Supplies at Lumen Market'}:null
  if(stage==='f01.stage.arrival')return target==='arrival-lift'?{panel:'travel',label:'Return to Wayfarer Concourse',to:'hub.concourse'}:target==='market-gate'?{panel:'travel',label:'Walk to Lumen Market',to:'f01.stage.market'}:target==='arrival-planning'?{panel:'planning',label:'Market route board'}:target==='landing-beacon'?{panel:'checkpoint',label:'Landing return beacon'}:null
  if(stage==='f01.stage.market')return target==='return-gate'?{panel:'travel',label:'Return to Lantern Landing',to:'f01.stage.arrival'}:target==='utility-gate'?{panel:'travel',label:'Undergrid utility gate',to:'f01.stage.undergrid'}:target==='p01'?{panel:'allocation',label:'P01 · Load for the Living'}:target==='ivo-counter'?{panel:'shop',label:'Ivo’s salvage counter'}:null
  return null
}
const prop=(id:string,asset:string,x:number,y:number):StageObject=>({id,asset,x,y,elevation:0,layer:'world',bias:0,rotation:0})
/** Layouts stay editable; adventure-only bindings never mutate source templates. */
export function floorStage(stage:StageId,state?:Campaign):StageDocument{
  const key=stage==='hub.concourse'?'f01-lobby':stage==='f01.stage.arrival'?'f01-arrival':stage==='f01.stage.market'?'f01-market':stage==='f01.stage.undergrid'?'f01-undergrid':stage==='f01.stage.skybridge'?'f01-skybridge':stage==='f01.stage.switchyard'?'f01-switchyard':null
  if(!key)throw Error('That district has not been installed.')
  const map=cloneStage(starterStage(key))
  if(stage==='f01.stage.arrival'){const hologram=map.objects.find(o=>o.asset==='f01:holo-head');if(hologram){hologram.id='eko';hologram.asset='f01:eko'}}
  if(stage==='f01.stage.arrival')map.objects.push(prop('market-gate','f01:lift',1280,920),prop('landing-beacon','f01:planning',600,900))
  if(stage==='f01.stage.market')map.objects.push(prop('return-gate','f01:lift',100,440),prop('utility-gate','f01:lift',510,220),prop('bay-toolkit','f01:supply',340,700),prop('advert-panel','f01:archive',900,430),prop('market-shortcut','f01:bulkhead',1120,710))
  if(stage==='hub.concourse'&&state)for(const key of ['koi','bench'] as const){const f=fixtures(state)[key];if(!f)continue;const slot=CAMP_SLOTS[key];map.objects.push({...prop(slot.object,slot.asset,slot.x,slot.y),rotation:f.rotation})}
  return map
}
export function preferredArrival(to:StageId,from?:StageId){
  if(to==='hub.concourse')return{x:512,y:720}
  if(to==='f01.stage.arrival')return from==='f01.stage.market'?{x:1280,y:970}:{x:760,y:1090}
  if(to==='f01.stage.undergrid')return from==='f01.stage.skybridge'?{x:1130,y:250}:{x:105,y:830}
  if(to==='f01.stage.skybridge')return from==='f01.stage.switchyard'?{x:1165,y:380}:{x:155,y:595}
  if(to==='f01.stage.switchyard')return from==='f01.stage.market'?{x:140,y:530}:from==='f01.stage.bastion'?{x:1015,y:230}:{x:125,y:780}
  if(to==='f01.stage.market'&&from==='f01.stage.switchyard')return{x:1120,y:755}
  return from==='f01.stage.undergrid'?{x:510,y:265}:{x:100,y:490}
}
export type FloorObjectState=FloorPropState
export function stageObjectStates(state:Campaign):Record<string,FloorObjectState>{
  const allocated=state.decisions.allocation!=='unset',allocation=allocated?state.decisions.allocation as 'clinic'|'transit':undefined
  const resourceStates=Object.fromEntries(Object.entries(RESOURCE_NODES).map(([id,node])=>[id,{open:!!(node.scope==='profile'?state.receipts:state.expedition.receipts)['F01.NODE.'+id]}]))
  return{
    'repair-station':{open:activities(state).awning,lit:true},'plaza-controller':{open:state.facts['floor-cleared'],lit:state.quests.q05==='claimed'},'plaza-koi':{lit:activities(state).koiSolved},'camp-koi':{lit:fixtures(state).koi?.lit??true},'camp-bench':{lit:true},
    ...resourceStates,'bastion-gate':{open:state.facts['gate-authenticated']},'market-shortcut':{open:state.facts['gate-authenticated']},authorization:{open:state.facts['gate-authenticated']},'dispatch-beacon':{lit:state.location.checkpoint==='f01.dispatch'},'dispatch-supply':{open:!!state.expedition.receipts['F01.DISPATCH.SUPPLIES']},'switchyard-gate':{open:true},'advert-panel':{lit:false,open:!!state.receipts['F01.NODE.advert-cache']},p02:{lit:state.facts['p02-solved'],relay:puzzleState(state).relay},p03:{open:state.facts['archive-open'],lit:true},
    p01:{lit:allocated,open:allocated,allocation},
    'landing-beacon':{lit:state.facts['checkpoint-active']},
    'arrival-planning':{lit:state.facts['route-inspected']},
  }
}
export function worldLabel(stage:StageId,object:StageObject,state:Campaign):string|undefined{
  const binding=stageInteraction(stage,object.id)
  if(object.id==='repair-station')return activities(state).awning?'Repair Bay · awning patched':'Repair Bay · recipes and awning'
  if(object.id==='plaza-controller')return state.facts['floor-cleared']?'Grid authority · '+state.decisions.governance:'Public grid controller'
  if(object.id==='plaza-koi')return activities(state).koiSolved?'Koi signals · synchronized':'P04 · Left → Up → Right → Down'
  if(object.id==='sena')return'Sena · Freight Dispatch'
  if(object.id==='authorization')return state.facts['gate-authenticated']?'Two records verified · gate open':'Seal + Writ · authorize gate'
  if(object.id==='eko')return'EKO-9 · archivist'
  if(object.id==='nyx')return'Nyx · courier'
  if(object.id==='mara')return'Mara · medic'
  if(object.id==='ivo')return'Ivo · merchant'
  if(object.id==='p01')return state.decisions.allocation==='unset'?'P01 · auxiliary power':state.decisions.allocation==='clinic'?'Clinic powered · 6 / 6':'Transit powered · 6 / 6'
  if(object.id==='landing-beacon')return state.facts['checkpoint-active']?'Landing checkpoint · active':'Activate return checkpoint'
  return binding?.label
}
