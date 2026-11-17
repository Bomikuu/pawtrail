import { neonFoundation } from './neon-foundation'
import type { Campaign, Effect, ItemId, Outcome, StageId } from './state'

export const SHOP=[
  {item:'f01.item.med-patch',name:'Med Patch',description:'Restore up to 30 missing HP.',buy:12,sell:0,stock:3},
  {item:'f01.item.insulator',name:'Insulator',description:'Halve the next two environmental contacts. No stacking.',buy:18,sell:0,stock:2},
  {item:'f01.mat.scrap',name:'Scrap',description:'Metal for repairs and crafting.',buy:3,sell:1,stock:6},
  {item:'f01.mat.wire',name:'Copper Wire',description:'A reusable circuit material.',buy:6,sell:2,stock:4},
  {item:'f01.mat.coolant',name:'Coolant Gel',description:'For medicine and insulated gear.',buy:8,sell:3,stock:3},
  {item:'f01.mat.fiber',name:'Weatherweave Fiber',description:'Repair cloth and medical supplies.',buy:4,sell:1,stock:6},
] as const satisfies readonly {item:ItemId;name:string;description:string;buy:number;sell:number;stock:number}[]
export type ShopItem=typeof SHOP[number]['item']
export const vitals=(state:Campaign)=>state.vitals??{hp:100,maxHp:100 as const,insulation:0}
export function buyingPrice(state:Campaign,base:number){
  const personal=state.relationships.ivo<=-10?10:state.relationships.ivo>=10?-10:0
  return Math.ceil(base*Math.max(80,100+personal-(state.decisions.governance==='exchange'?10:0))/100)
}
export function shopQuote(state:Campaign,item:ShopItem){
  const row=SHOP.find(row=>row.item===item)!,prefix='F01.BUY.'+item+'.'
  const used=Array.from({length:row.stock},(_,i)=>i+1).filter(slot=>Object.hasOwn(state.expedition.receipts,prefix+slot))
  const slot=Array.from({length:row.stock},(_,i)=>i+1).find(slot=>!used.includes(slot))??null
  return{...row,price:buyingPrice(state,row.buy),remaining:row.stock-used.length,slot}
}
export type FirstLoopAction=
  |{kind:'meet-mara'|'meet-ivo'|'accept-q01'|'claim-q01'|'accept-q02'|'claim-q02'|'cell'|'recover-cell'|'checkpoint'|'route'|'rest'}
  |{kind:'allocate';service:'clinic'|'transit';controller:boolean;clinic:boolean;transit:boolean}
  |{kind:'buy';item:ShopItem;slot:number;price:number}
  |{kind:'sell';item:ShopItem}
  |{kind:'use';item:'f01.item.med-patch'|'f01.item.insulator'}
export type CommandResult={ok:true;outcome:Outcome;message:string}|{ok:false;message:string}
const fail=(message:string):CommandResult=>({ok:false,message})
export function allocationPreview(controller:boolean,clinic:boolean,transit:boolean){
  const load=(controller?2:0)+(clinic?4:0)+(transit?4:0)
  const valid=controller&&clinic!==transit&&load===6
  return{load,capacity:6,valid,message:load>6?'Overload: 10 / 6. Disconnect one service.':!controller?'Connect the 2-unit safety controller.':!clinic&&!transit?'Choose Clinic or Transit.':'Safety controller + one service: 6 / 6.'}
}
export function firstLoopCommand(state:Campaign,action:FirstLoopAction,requestId:string):CommandResult{
  const stage=state.location.stage
  const at=(...stages:StageId[])=>stages.includes(stage)
  const definition=(key:string,message:string,required:StageId):CommandResult=>{
    if(stage!==required)return fail('Return to the relevant person or terminal before using this action.')
    return{ok:true,outcome:{...neonFoundation[key],conditions:[...neonFoundation[key].conditions,{kind:'stage',value:required}]},message}
  }
  const custom=(id:string,effects:Effect[],message:string,event:Outcome['event']='service',scope:Outcome['scope']='profile'):CommandResult=>({ok:true,outcome:{id,event,scope,conditions:[{kind:'stage',value:stage}],effects},message})
  switch(action.kind){
    case'meet-mara':return definition('meetMara','You met Mara Solis.','f01.stage.arrival')
    case'meet-ivo':return at('f01.stage.market')?custom('F01.IVO.MET',[{kind:'met',key:'ivo'}],'You met Ivo Mercado.','conversation'):fail('Ivo is at Lumen Market.')
    case'accept-q01':return definition('acceptBearings','Find Your Footing accepted.','f01.stage.arrival')
    case'claim-q01':return definition('bearings','Find Your Footing complete · +15 SC.','f01.stage.arrival')
    case'accept-q02':return definition('acceptAllocation','Keep One Light On accepted. Ask Ivo for the free Emergency Cell.','f01.stage.arrival')
    case'claim-q02':return definition('allocationReport','Keep One Light On complete · +35 SC.','f01.stage.arrival')
    case'cell':return definition('cell','Emergency Cell received · free quest supply.','f01.stage.market')
    case'recover-cell':{
      if(!at('f01.stage.market')||state.quests.q02!=='active'||!state.facts['cell-issued']||state.inventory['f01.key.cell']!==0||state.decisions.allocation!=='unset')return fail('A missing, unspent quest Cell is required for recovery.')
      return custom('F01.CELL.RECOVER',[{kind:'item',key:'f01.key.cell',amount:1}],'Missing Emergency Cell recovered against its original supply receipt.')
    }
    case'checkpoint':{
      if(!at('f01.stage.arrival'))return fail('Activate the landing checkpoint in Lantern Landing.')
      if(state.facts['checkpoint-active'])return custom('F01.CHECKPOINT.BIND.'+requestId,[{kind:'checkpoint',value:'f01.landing'}],'Landing checkpoint saved.','checkpoint','state')
      return custom('F01.CHECKPOINT',[{kind:'fact',key:'checkpoint-active',value:true},{kind:'checkpoint',value:'f01.landing'}],'Landing checkpoint saved.','checkpoint')
    }
    case'route':return definition('route','Market route recorded in your journal.','f01.stage.arrival')
    case'allocate':{
      if(!at('f01.stage.market'))return fail('Use the P01 console at Lumen Market.')
      const preview=allocationPreview(action.controller,action.clinic,action.transit)
      if(!preview.valid||action.service!==(action.clinic?'clinic':'transit'))return fail(preview.message)
      return definition(action.service,action.service==='clinic'?'Clinic powered. Emergency Cell consumed. Mara and the residents will remember.':'Transit powered. Emergency Cell consumed. Mara and the couriers will remember.','f01.stage.market')
    }
    case'buy':{
      if(!at('f01.stage.market'))return fail('Visit Ivo’s counter at Lumen Market.')
      const quote=shopQuote(state,action.item),id='F01.BUY.'+action.item+'.'+action.slot
      if(!Number.isInteger(action.slot)||action.slot<1||action.slot>quote.stock)return fail('That stock slot is invalid.')
      if(Object.hasOwn(state.expedition.receipts,id))return custom(id,[],'This purchase is already recorded.','purchase','expedition')
      if(quote.slot===null||quote.slot!==action.slot)return fail('That stock changed. Refresh the shop before purchasing.')
      if(quote.price!==action.price)return fail('The quoted price changed. Review the current price before buying.')
      if(state.scrip<quote.price)return fail(`You need ${quote.price} SC; you have ${state.scrip}. Nothing was spent.`)
      return custom(id,[{kind:'scrip',amount:-quote.price},{kind:'item',key:action.item,amount:1}],`${quote.name} purchased · −${quote.price} SC · +1 item.`,'purchase','expedition')
    }
    case'sell':{
      if(!at('f01.stage.market'))return fail('Visit Ivo’s counter to sell materials.')
      const row=SHOP.find(row=>row.item===action.item)!
      if(!row.sell)return fail('This item cannot be sold.')
      if(state.inventory[action.item]<1)return fail('You do not have that material. Nothing changed.')
      return custom('F01.SELL.'+requestId,[{kind:'item',key:action.item,amount:-1},{kind:'scrip',amount:row.sell}],`${row.name} sold · +${row.sell} SC.`,'sale','expedition')
    }
    case'rest':{
      if(!at('hub.concourse','f01.stage.arrival'))return fail('Rest at the Concourse or Mara’s camp.')
      const hp=vitals(state).hp;if(hp>=100)return fail('You are already rested · 100 / 100 HP. No recovery was needed.')
      return custom('F01.REST.'+requestId,[{kind:'vitals',hp:100}],`Rested for free · +${100-hp} HP · 100 / 100.`)
    }
    case'use':{
      const current=vitals(state)
      if(state.inventory[action.item]<1)return fail('That item is not in your pack.')
      if(action.item==='f01.item.med-patch'){
        if(current.hp>=100)return fail('HP is already full. Your Med Patch was kept.')
        const hp=Math.min(100,current.hp+30)
        return custom('F01.USE.'+requestId,[{kind:'item',key:action.item,amount:-1},{kind:'vitals',hp}],`Med Patch used · +${hp-current.hp} HP.`,'item-use','expedition')
      }
      if(current.insulation>0)return fail('Insulation is already active. The item was kept.')
      return custom('F01.USE.'+requestId,[{kind:'item',key:action.item,amount:-1},{kind:'vitals',insulation:2}],'Insulator equipped · 2 environmental contacts protected.','item-use','expedition')
    }
  }
}
export const personalTier=(score:number)=>score<=-10?'Distrustful':score<0?'Wary':score<10?'Neutral':score<25?'Friendly':'Trusted'
export const factionTier=(score:number)=>score<=-15?'Distrusted':score<0?'Wary':score<10?'Neutral':score<25?'Respected':'Allied'
export function reputationChanges(before:Campaign,after:Campaign){
  const result:string[]=[]
  for(const [id,value]of Object.entries(after.relationships)){const change=value-before.relationships[id as keyof Campaign['relationships']];if(change)result.push(`${id}: ${change>0?'+':''}${change} trust`)}
  for(const [id,value]of Object.entries(after.factions)){const change=value-before.factions[id as keyof Campaign['factions']];if(change)result.push(`${id}: ${change>0?'+':''}${change} standing`)}
  return result.join(' · ')
}
