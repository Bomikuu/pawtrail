import rules from './definitions.json'
import {canBecomeSuperSaiyan,type AppearanceParts} from '../actor-rig/action-layers'
export type AbilityId=keyof typeof rules.abilities
export type AbilityScope='local'|'preview'|'room'|null
export const abilityDefinitions=rules.abilities
export const isAbility=(id:string):id is AbilityId=>Object.hasOwn(rules.abilities,id)
type Active={id:AbilityId;until:number;boosted:boolean}
type State={scope:AbilityScope;active:Active|null;cooldowns:Partial<Record<AbilityId,number>>;notice:string}
let state:State={scope:null,active:null,cooldowns:{},notice:''},generation=0
let roomState:Pick<State,'active'|'cooldowns'|'notice'>|undefined
const listeners=new Set<()=>void>()
function patch(next:Partial<State>){state={...state,...next};for(const listener of listeners)listener()}
export const abilityStore={getSnapshot:()=>state,subscribe:(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn)}}}
const key=(scope:AbilityScope)=>'pawtrail:abilities:'+scope+':v1'
function savedCooldowns(scope:AbilityScope){try{const value=JSON.parse(localStorage.getItem(key(scope))??'{}'),now=Date.now();return Object.fromEntries(Object.keys(rules.abilities).flatMap(id=>typeof value[id]==='number'&&value[id]>now?[[id,Math.min(value[id],now+rules.abilities[id as AbilityId].cooldownMs)]]:[]))}catch{return {}}}
export function enterAbilities(scope:Exclude<AbilityScope,null>){
  const token=++generation;patch({scope,active:null,cooldowns:scope==='room'?{}:savedCooldowns(scope),notice:'',...(scope==='room'&&roomState?roomState:{})})
  return()=>{if(token===generation)patch({scope:null,active:null,cooldowns:{},notice:''})}
}
export function activeAbility(){
  if(state.active&&state.active.until<=Date.now())cancelLocalAbility()
  return state.active
}
export function activateLocalAbility(id:AbilityId,appearance:AppearanceParts){
  if(state.scope==='room'||!state.scope)return false
  const now=Date.now(),remaining=(state.cooldowns[id]??0)-now
  if(remaining>0){patch({notice:rules.abilities[id].name+' is ready in '+Math.ceil(remaining/1000)+'s.'});return false}
  const boosted=id!=='power_up'||canBecomeSuperSaiyan(appearance),definition=rules.abilities[id]
  const cooldowns={...state.cooldowns,[id]:now+definition.cooldownMs}
  try{localStorage.setItem(key(state.scope),JSON.stringify(cooldowns))}catch{/* The in-memory cooldown still applies. */}
  patch({active:{id,until:now+definition.durationMs,boosted},cooldowns,notice:boosted?definition.name+' active.':'Power up active. Super speed requires Goku’s gi and hero hair.'});return true
}
export function cancelLocalAbility(){const previous=state.active;patch({active:null,notice:''});if(previous&&typeof window!=='undefined')window.dispatchEvent(new CustomEvent('pawtrail:ability-ended',{detail:{id:previous.id}}))}
export function syncRoomAbilities(input:unknown,notice=''){
  if(!input||typeof input!=='object')return
  const value=input as {active?:{id?:string;remainingMs?:number;boosted?:boolean}|null;cooldownsMs?:Record<string,unknown>},now=Date.now()
  const active=value.active&&typeof value.active.id==='string'&&isAbility(value.active.id)&&typeof value.active.remainingMs==='number'&&Number.isFinite(value.active.remainingMs)&&value.active.remainingMs>0?{id:value.active.id,until:now+Math.min(value.active.remainingMs,rules.abilities[value.active.id].durationMs),boosted:value.active.boosted===true}:null
  const cooldowns=Object.fromEntries(Object.keys(rules.abilities).map(id=>{const ms=value.cooldownsMs?.[id];return [id,now+(typeof ms==='number'&&Number.isFinite(ms)?Math.max(0,Math.min(ms,rules.abilities[id as AbilityId].cooldownMs)):0)]}))
  roomState={active,cooldowns,notice};if(state.scope==='room')patch(roomState)
}
export function movementProfile(appearance:AppearanceParts,sprint=false){
  const active=activeAbility(),id=active?.id,base=sprint?rules.runSpeed:rules.walkSpeed
  const powered=id==='power_up'&&active?.boosted&&canBecomeSuperSaiyan(appearance)
  return {speed:id==='rescue_dash'?rules.abilities.rescue_dash.speed:id==='gentle_approach'?rules.abilities.gentle_approach.speed:powered?rules.abilities.power_up.speed:base,
    dash:id==='rescue_dash',gentle:id==='gentle_approach',running:id==='rescue_dash'||!!powered||sprint&&id!=='gentle_approach',action:id??null}
}
export function abilitySeconds(id:AbilityId){return Math.max(0,Math.ceil(((state.cooldowns[id]??0)-Date.now())/1000))}
export const abilityDefaults=rules
