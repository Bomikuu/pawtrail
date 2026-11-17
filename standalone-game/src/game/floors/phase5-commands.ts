import type { CommandResult } from './commands'
import { vitals } from './commands'
import { deterministicRoll } from './content'
import { safeId, type Campaign, type Effect, type Outcome } from './state'
export const ENCOUNTER_DAMAGE={'riot-sweep':[23,29],'siege-lock':[25,31],'crossfire-lattice':[20,25],'reactor-sweep':[26,33],'neon-lockdown':[24,30]} as const
export type Phase5Action={kind:'meet-sena'|'accept-q04'|'authorize-gate'|'accept-q05'|'report-boss'|'dispatch-checkpoint'|'dispatch-supplies'|'recover-writ'|'claim-encounter'}|{kind:'encounter-contact';attack:keyof typeof ENCOUNTER_DAMAGE;amount:number;contact:string}
export const PHASE5_KINDS=new Set(['meet-sena','accept-q04','authorize-gate','accept-q05','report-boss','dispatch-checkpoint','dispatch-supplies','recover-writ','claim-encounter','encounter-contact'])
export function phase5Command(s:Campaign,a:Phase5Action,id:string):CommandResult{
 const fail=(message:string):CommandResult=>({ok:false,message}),atYard=s.location.stage==='f01.stage.switchyard'
 const result=(key:string,effects:Effect[],message:string,scope:Outcome['scope']='profile',event:Outcome['event']='conversation'):CommandResult=>({ok:true,outcome:{id:key,scope,event,conditions:[{kind:'stage',value:s.location.stage}],effects},message})
 switch(a.kind){
 case'meet-sena':return atYard?result('F01.SENA.MET',[{kind:'met',key:'sena'}],'You met Sena Valez.'):fail('Sena is at Freight Dispatch.')
 case'accept-q04':return atYard&&s.quests.q03==='claimed'&&['locked','available'].includes(s.quests.q04)?result('F01.Q04.ACCEPT',[{kind:'quest',key:'q04',value:'active'}],'Open the Dead Line accepted. Bring both the Relay Seal and Transit Writ to Sena.'):fail('Resolve EKO’s archive first. This job may already be accepted.')
 case'authorize-gate':{
   if(!atYard||s.quests.q04!=='active'||s.quests.q03!=='claimed'||!s.facts['header-retained']||!s.facts['p02-solved']||s.inventory['f01.key.relay']<1||s.inventory['f01.key.writ']<1)return fail('Authorization needs the retained archive header, solved relay, actual Seal and actual Writ. No partial payment was taken.')
   return result('F01.GATE',[{kind:'item',key:'f01.key.relay',amount:-1},{kind:'item',key:'f01.key.writ',amount:-1},{kind:'fact',key:'gate-authenticated',value:true},{kind:'knowledge',key:'sena',value:'gate'},{kind:'relationship',key:'sena',amount:5},{kind:'faction',key:'wardens',amount:4},{kind:'scrip',amount:60},{kind:'quest',key:'q04',value:'claimed'},{kind:'quest',key:'q05',value:'available'}],'Both authorizations verified · shortcut and Bastion gate opened · Q04 complete · +60 SC.')
 }
 case'accept-q05':return atYard&&s.quests.q04==='claimed'&&s.quests.q05==='available'?result('F01.Q05.ACCEPT',[{kind:'quest',key:'q05',value:'active'}],'The Neon Bastion accepted. Destroy all four funnels before attacking Kurogane’s main body.'):fail('Ask Sena after the two-record authorization.')
 case'report-boss':return atYard&&s.quests.q05==='active'&&s.facts['boss-first-clear']?result('F01.BOSS.REPORT',[{kind:'quest',key:'q05',value:'claimed'},{kind:'quest',key:'q06',value:'available'},{kind:'relationship',key:'sena',amount:4},{kind:'faction',key:'wardens',amount:4},...(['mara','ivo','eko','nyx','sena'] as const).map(key=>({kind:'knowledge' as const,key,value:'victory' as const}))],'Bastion victory reported. Take the Clearance Core to EKO’s public controller. The victory report grants no second boss currency reward.'):fail('A saved first boss-victory claim and active Q05 are required.')
 case'dispatch-checkpoint':return atYard?result('F01.DISPATCH.CHECKPOINT',[{kind:'checkpoint',value:'f01.dispatch'}],'Freight Dispatch return checkpoint recorded.','state','checkpoint'):fail('Use the Dispatch beacon.')
 case'dispatch-supplies':return atYard?result('F01.DISPATCH.SUPPLIES',[{kind:'item',key:'f01.mat.scrap',amount:4},{kind:'item',key:'f01.mat.fiber',amount:2}],'Dispatch supply bin collected · Scrap +4 · Fiber +2.','expedition','resource'):fail('The supply bin is in Freight Dispatch.')
 case'recover-writ':return atYard&&s.facts['marshal-first-clear']&&!s.facts['gate-authenticated']&&s.inventory['f01.key.writ']===0?result('F01.WRIT.RECOVER',[{kind:'item',key:'f01.key.writ',amount:1}],'Missing Transit Writ recovered against the accepted first-clear record. No extra loot.'):fail('No missing, unsubmitted first-clear Writ is available for recovery.')
 case'claim-encounter':{
   const pending=s.encounters?.pending;if(!pending||pending.expedition!==s.expedition.id)return fail('There is no recorded encounter victory waiting for a claim.')
   const marshal=pending.kind==='marshal',first=!s.facts[marshal?'marshal-first-clear':'boss-first-clear'],effects:Effect[]=[{kind:'scrip',amount:marshal?(first?35:25):(first?120:50)},{kind:'item',key:'f01.mat.alloy',amount:marshal?2:first?4:2}]
   if(marshal)effects.push({kind:'item',key:'f01.mat.coolant',amount:2},...(first?[{kind:'item',key:'f01.key.writ',amount:1} as Effect]:[]))
   else if(first)effects.push({kind:'item',key:'f01.key.core',amount:1},{kind:'emblem'})
   const roll=deterministicRoll(pending.expedition+':'+pending.kind+':bonus')
   if(marshal&&roll<.25)effects.push({kind:'item',key:'f01.mat.prism',amount:1})
   if(!marshal)effects.push(roll<.4?{kind:'item',key:'f01.mat.prism',amount:2}:roll<.75?{kind:'item',key:'f01.mat.wire',amount:3}:{kind:'item',key:'f01.mat.coolant',amount:3})
   effects.push({kind:'fact',key:marshal?'marshal-first-clear':'boss-first-clear',value:true},{kind:'encounter-clear'})
   return result('F01.ENCOUNTER.'+pending.kind,effects,`${marshal?'Iron Marshal':'Kurogane'} ${first?'first-clear':'rematch'} loot saved · ${marshal?(first?35:25):(first?120:50)} SC${first?(marshal?' · protected Transit Writ':' · protected Clearance Core and Bastion emblem'):''}.`,'expedition','combat')
 }
 case'encounter-contact':{
   if((atYard?!['riot-sweep','siege-lock'].includes(a.attack):s.location.stage!=='f01.stage.bastion'||!['crossfire-lattice','reactor-sweep','neon-lockdown'].includes(a.attack))||!safeId(a.contact)||!Number.isSafeInteger(a.amount)||a.amount<1||!ENCOUNTER_DAMAGE[a.attack]?.some(n=>Math.min(vitals(s).hp,n)===a.amount))return fail('This encounter contact is not valid. No HP was changed.')
   if(s.combat?.recent.includes(a.contact))return result('F01.CONTACT.'+id,[],'This contact was already saved.','state','combat')
   return result('F01.CONTACT.'+id,[{kind:'vitals',hp:vitals(s).hp-a.amount},{kind:'contact',id:a.contact}],`${a.amount} HP encounter damage confirmed.`,'state','combat')
 }
 }
}
