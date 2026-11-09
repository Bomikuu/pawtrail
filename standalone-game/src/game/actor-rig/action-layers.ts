import clips from './actions.json'
/** Cosmetic runtime layers; never persisted over the character's chosen colors. */
export const SUPER_SAIYAN_COLORS={
  hair:'#f4c84a',hairLight:'#ffe990',hairShade:'#bb7b23',hairSheen:'#fff5bf',
  eye:'#279a85',eyeLight:'#85d6b7',
}
export type AppearanceParts={parts?:{hair?:string;outfit?:string;headwear?:string}}
export function canBecomeSuperSaiyan(appearance:AppearanceParts){
  return appearance.parts?.outfit==='gi'&&appearance.parts.hair==='hero-spikes'&&
    ['none','halo',undefined].includes(appearance.parts.headwear)
}
const authored=new Set([...Object.keys(clips.rescuer),...Object.keys(clips['orange-tabby'])])
const aliases:Record<string,string>={rest:'sleep',sleepy:'sleep',laughing:'laugh',car:'ride',crying:'sad',cry:'sad',floating:'float',petting:'pet',petted:'pet',being_petted:'pet',refill_water:'water',fill_water:'water',water_plant:'water',fill_food:'feed',care_aquarium:'clean',pick_up_furniture:'pick_up',place_object:'pick_up',move_object:'pick_up',carry_supplies:'hold_item',inspect_furniture:'inspect',observe:'inspect',check:'inspect',rescue:'pick_up'}
export const canonicalActorAction=(action:string)=>/^run(_|$)/.test(action)?'run':aliases[action]??action
/** Every authored action survives movement; new clips inherit this policy. */
export const allowsMovingAction=(action:string)=>{
  action=canonicalActorAction(action)
  return authored.has(action)&&action!=='idle'&&action!=='walk'&&action!=='run'
}
const fullBodyMotion=new Set(['sit','sleep','float','ride','lie_down','climb','jetpack','jetpack_takeoff','jetpack_land','roll_yarn','jump','pounce','chase_tail','fly'])
export const usesWalkingLegs=(action:string)=>allowsMovingAction(action)&&!fullBodyMotion.has(canonicalActorAction(action))
export const actorEffectAction=(appearance:AppearanceParts,action:string)=>
  ['power_up','power_run'].includes(action)?canBecomeSuperSaiyan(appearance)?'super_saiyan':'power_up':action
export const jetpackLift=(appearance:AppearanceParts)=>appearance.parts?.headwear==='halo'?6:8
