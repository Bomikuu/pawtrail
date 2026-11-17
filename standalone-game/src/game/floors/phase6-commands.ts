import type { CommandResult } from './commands'
import { activities,fixtures,RECIPES,GOVERNANCE,KOI_ROUTE,KOI_TIMING,CAMP_SLOTS,unlockedRecipe,type Governance,type RecipeId,type CampItem,type KoiDirection } from './phase6-content'
import { safeId,NPCS,type Campaign,type Effect,type ItemId,type Outcome,type NpcId,type FactionId } from './state'
export type Phase6Action=
 |{kind:'accept-q06'|'accept-q07'|'repair-awning'|'claim-q07'|'accept-q10'|'claim-q10'|'koi-cancel'|'accept-q11'|'claim-q11'|'claim-perk'}
 |{kind:'governance';choice:Governance}
 |{kind:'craft';recipe:RecipeId;request:string}
 |{kind:'koi-start';mode:'normal'|'assisted'}
 |{kind:'koi-input';direction:KoiDirection;attempt:string}
 |{kind:'fixture-deploy'|'fixture-reclaim';item:CampItem;request:string}
 |{kind:'fixture-rotate';item:CampItem;from:number}
 |{kind:'fixture-light';lit:boolean}
export const PHASE6_KINDS=new Set(['accept-q06','accept-q07','repair-awning','claim-q07','accept-q10','claim-q10','koi-cancel','accept-q11','claim-q11','claim-perk','governance','craft','koi-start','koi-input','fixture-deploy','fixture-reclaim','fixture-rotate','fixture-light'])
export const isFixtureAction=(a:{kind:string})=>['fixture-deploy','fixture-reclaim','fixture-rotate'].includes(a.kind)
export function phase6Command(s:Campaign,a:Phase6Action,id:string,now=Date.now()):CommandResult{
 const arrival=s.location.stage==='f01.stage.arrival',market=s.location.stage==='f01.stage.market',yard=s.location.stage==='f01.stage.switchyard',hub=s.location.stage==='hub.concourse',state=activities(s)
 const fail=(message:string):CommandResult=>({ok:false,message})
 const result=(key:string,effects:Effect[],message:string,scope:Outcome['scope']='profile',event:Outcome['event']='conversation'):CommandResult=>({ok:true,outcome:{id:key,scope,event,conditions:[{kind:'stage',value:s.location.stage}],effects},message})
 const has=(inputs:Partial<Record<ItemId,number>>)=>Object.entries(inputs).every(([key,n])=>s.inventory[key as ItemId]>=(n??0))
 const costs=(inputs:Partial<Record<ItemId,number>>):Effect[]=>Object.entries(inputs).map(([key,n])=>({kind:'item',key:key as ItemId,amount:-n!}))
 switch(a.kind){
 case'accept-q06':return arrival&&s.quests.q05==='claimed'&&['available','locked'].includes(s.quests.q06)&&s.decisions.governance==='unset'?result('F01.Q06.ACCEPT',[{kind:'quest',key:'q06',value:'active'}],'Who Owns the Dawn accepted. Review the public controller’s three choices; the Core stays with you until confirmation.'):fail('Report the accepted boss victory to Sena before discussing grid authority with EKO.')
 case'governance':{
  if(!arrival||s.quests.q05!=='claimed'||s.quests.q06!=='active'||s.decisions.governance!=='unset'||s.inventory['f01.key.core']<1||!Object.hasOwn(GOVERNANCE,a.choice))return fail('An active Q06, reported boss victory and actual Clearance Core are required. Nothing was spent.')
  const choice=GOVERNANCE[a.choice],effects:Effect[]=[{kind:'item',key:'f01.key.core',amount:-1},{kind:'decision',key:'governance',value:a.choice},{kind:'fact',key:'floor-cleared',value:true},{kind:'quest',key:'q06',value:'claimed'},{kind:'quest',key:'q11',value:'available'},{kind:'scrip',amount:80}]
  for(const [key,amount]of Object.entries(choice.npc))effects.push({kind:'relationship',key:key as NpcId,amount})
  for(const [key,amount]of Object.entries(choice.faction))effects.push({kind:'faction',key:key as FactionId,amount})
  effects.push(...NPCS.map(key=>({kind:'knowledge' as const,key,value:'governance' as const})))
  return result(choice.bundle,effects,`${choice.name} recorded · Core consumed · +80 SC · Floor 01 cleared. The tower has recorded your clearance for future floors.`)
 }
 case'accept-q07':return arrival&&s.quests.q02==='claimed'&&['locked','available'].includes(s.quests.q07)?result('F01.Q07.ACCEPT',[{kind:'quest',key:'q07',value:state.awning?'completed':'active'}],'Rainproof Neighbors accepted. Bring Fiber 3 and Scrap 2 to the Repair Bay station.'):fail('Ask Mara after the auxiliary-line report. This repair may already be tracked.')
 case'repair-awning':{
  const inputs={'f01.mat.fiber':3,'f01.mat.scrap':2} as const
  if(!market||s.quests.q07!=='active'||state.awning||!has(inputs))return fail('Repair requires active Q07, Fiber 3 and Scrap 2 at the Repair Bay. Nothing was consumed.')
  state.awning=true;return result('F01.AWN.REPAIR',[...costs(inputs),{kind:'activities',value:state},{kind:'quest',key:'q07',value:'completed'}],'Awning repair accepted · Fiber −3 · Scrap −2. Report the patched awning to Mara.','profile','service')
 }
 case'claim-q07':return arrival&&state.awning&&s.quests.q07==='completed'?result('F01.AWN',[{kind:'scrip',amount:30},{kind:'relationship',key:'mara',amount:3},{kind:'faction',key:'residents',amount:4},{kind:'quest',key:'q07',value:'claimed'}],'Rainproof Neighbors reported · +30 SC. Mara remembers the completed repair.'):fail('Mara needs the accepted Repair Bay completion before issuing this reward.')
 case'accept-q10':return arrival&&s.quests.q03==='claimed'&&['locked','available'].includes(s.quests.q10)?result('F01.Q10.ACCEPT',[{kind:'quest',key:'q10',value:state.koiSolved?'completed':'active'}],'Two Koi, One Signal accepted. Normal and assisted modes give the same reward.'):fail('Ask EKO after the archive is resolved. Calibration may already be tracked.')
 case'koi-start':{
  if(!arrival||s.quests.q10!=='active'||state.koiSolved||!['normal','assisted'].includes(a.mode))return fail('Accept EKO’s calibration quest before starting. A completed calibration does not pay again.')
  state.koi={id,mode:a.mode,start:Math.floor(now),entered:[]};state.koiMessage='Follow Left → Up → Right → Down.'
  return result('F01.KOI.START.'+id,[{kind:'activities',value:state}],a.mode==='assisted'?'Assisted calibration started · choose each direction at your own pace.':'Normal calibration started · watch the four cues, then answer on each beat.','state','puzzle')
 }
 case'koi-input':{
  const k=state.koi;if(!arrival||s.quests.q10!=='active'||state.koiSolved||!k||a.attempt!==k.id||!KOI_ROUTE.includes(a.direction))return fail('This calibration attempt is no longer active. Start a new attempt.')
  const index=k.entered.length,expected=KOI_ROUTE[index],center=k.start+KOI_TIMING.answerDelay+index*KOI_TIMING.answerBeat+KOI_TIMING.answerBeat/2
  if(a.direction!==expected||k.mode==='normal'&&Math.abs(now-center)>KOI_TIMING.tolerance){state.koi=null;state.koiMessage=a.direction!==expected?'Direction mismatch. No materials or reputation lost; try again.':'Beat missed. Retry or choose assisted mode; the reward is equal.';return result('F01.KOI.MISS.'+id,[{kind:'activities',value:state}],state.koiMessage,'state','puzzle')}
  k.entered.push(a.direction);const solved=k.entered.length===4
  state.koiSolved=solved;state.koiMessage=solved?'Signals synchronized. Report the saved result to EKO.':`${k.entered.length}/4 directions accepted.`;if(solved)state.koi=null
  return result(solved?'F01.KOI.SUCCESS':'F01.KOI.STEP.'+id,[{kind:'activities',value:state},...(solved?[{kind:'quest',key:'q10',value:'completed'} as Effect]:[])],state.koiMessage,solved?'profile':'state','puzzle')
 }
 case'koi-cancel':state.koi=null;state.koiMessage=state.koiSolved?'Signals synchronized.':'Calibration stopped. Nothing was spent.';return arrival?result('F01.KOI.CANCEL.'+id,[{kind:'activities',value:state}],state.koiMessage,'state','puzzle'):fail('Calibration is at EKO’s plaza.')
 case'claim-q10':return arrival&&state.koiSolved&&s.quests.q10==='completed'?result('F01.KOI',[{kind:'scrip',amount:20},{kind:'relationship',key:'eko',amount:3},{kind:'quest',key:'q10',value:'claimed'}],'Signals reported · +20 SC · Koi Lamp recipe unlocked.'):fail('Report an accepted calibration success to EKO first.')
 case'accept-q11':return yard&&s.quests.q06==='claimed'&&s.quests.q11==='available'?result('F01.MAINT.ACCEPT',[{kind:'quest',key:'q11',value:'active'}],'Maintenance Run accepted · Scrap 2 + Coolant 1 for 12 SC. No reputation reward.','expedition'):fail('Sena offers one maintenance shipment per fresh expedition after governance is recorded.')
 case'claim-q11':{
  const inputs={'f01.mat.scrap':2,'f01.mat.coolant':1} as const
  if(!yard||s.quests.q06!=='claimed'||s.quests.q11!=='active'||!has(inputs))return fail('The shipment needs active Q11, Scrap 2 and Coolant 1. Nothing was taken.')
  return result('F01.MAINT.CLAIM',[...costs(inputs),{kind:'scrip',amount:12},{kind:'quest',key:'q11',value:'claimed'}],'Maintenance shipment recorded · Scrap −2 · Coolant −1 · +12 SC. No reputation changed.','expedition')
 }
 case'claim-perk':{
  const choice=s.decisions.governance
  if(s.quests.q06!=='claimed'||choice!=='community'&&choice!=='warden'||choice==='community'&&!arrival||choice==='warden'&&!yard)return fail('Collect the selected Community supply from Mara or Warden supply from Sena after governance.')
  const item=choice==='community'?'f01.item.med-patch':'f01.item.insulator'
  return result('F01.PERK.'+choice,[{kind:'item',key:item,amount:1}],choice==='community'?'Clinic supply saved · Med Patch +1 for this expedition.':'Warden supply saved · Insulator +1 for this expedition.','expedition','service')
 }
 case'craft':{
  if(!market||!Object.hasOwn(RECIPES,a.recipe)||!safeId(a.request))return fail('Choose an actual recipe at the Repair Bay.')
  const key='F01.CRAFT.'+a.request,recipe=RECIPES[a.recipe]
  if(s.receipts[key])return result(key,[],'This craft request is already saved. No additional materials were spent.','profile','service')
  if(!unlockedRecipe(s,a.recipe))return fail(a.recipe==='koi'?'Report Q10 to EKO to unlock the Koi Lamp.':'Record governance and clear Q06 to unlock the Bastion Bench.')
  if(!has(recipe.inputs))return fail('Your pack is short of the displayed recipe materials. Nothing was consumed.')
  return result(key,[...costs(recipe.inputs),{kind:'item',key:recipe.item,amount:1}],`${recipe.name} crafted · +1 item. The displayed materials were consumed together. No SC fee.`,'profile','service')
 }
 case'fixture-deploy':case'fixture-reclaim':{
  if(!hub||!Object.hasOwn(CAMP_SLOTS,a.item)||!safeId(a.request))return fail('Use a valid furnishing at the Concourse camp.')
  const key='F01.CAMP.'+a.request,placed=fixtures(s),slot=CAMP_SLOTS[a.item],deploy=a.kind==='fixture-deploy'
  if(s.receipts[key])return result(key,[],'This furnishing change is already saved.','profile','service')
  if(deploy?(!!placed[a.item]||s.inventory[slot.item]<1):!placed[a.item])return fail(deploy?'This camp slot is occupied, or the crafted item is not in your pack.':'No furnishing occupies this camp slot.')
  if(deploy)placed[a.item]={rotation:0,lit:true};else delete placed[a.item]
  return result(key,[{kind:'item',key:slot.item,amount:deploy?-1:1},{kind:'fixtures',value:placed}],`${a.item==='koi'?'Koi Lamp':'Bastion Bench'} ${deploy?'deployed at camp':'returned to your pack'}.`,'profile','service')
 }
 case'fixture-rotate':{
  const placed=fixtures(s),f=placed[a.item]
  if(!hub||!Object.hasOwn(CAMP_SLOTS,a.item)||!f||![0,90,180,270].includes(a.from)||f.rotation!==a.from)return fail('The furnishing facing changed. Review its current rotation.')
  f.rotation=((f.rotation+90)%360) as 0|90|180|270
  return result('F01.ROTATE.'+id,[{kind:'fixtures',value:placed}],`Furnishing rotated to ${f.rotation}° and saved.`,'state','service')
 }
 case'fixture-light':{
  const placed=fixtures(s);if(!hub||!placed.koi||typeof a.lit!=='boolean')return fail('Deploy the Koi Lamp at camp before switching it.')
  placed.koi.lit=a.lit;return result('F01.LIGHT.'+id,[{kind:'fixtures',value:placed}],`Koi projection ${a.lit?'on':'off'} · saved.`,'state','service')
 }
 }
}
