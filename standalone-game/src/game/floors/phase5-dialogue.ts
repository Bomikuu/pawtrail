import type { Campaign } from './state'
import type { FloorNpcId } from './npcs'
import type { FloorChoice, FloorConversation } from './dialogue'
export function phase5Conversation(s:Campaign,npc:FloorNpcId):FloorConversation|null{
 if(npc!=='sena')return null
 const choices:FloorChoice[]=[{id:'S.checkpoint',label:'Mark Freight Dispatch as my return point.',panel:'dispatch-checkpoint'}]
 if(s.quests.q03==='claimed'&&['locked','available'].includes(s.quests.q04))choices.unshift({id:'S01.accept',label:'I’ll open the line.',command:{kind:'accept-q04'}})
 if(s.quests.q04==='active')choices.unshift({id:'S02.review',label:'Review both authorizations.',panel:'gate-authorization'})
 if(s.quests.q05==='available')choices.unshift({id:'S02.boss',label:'I’ll face the Bastion.',command:{kind:'accept-q05'}})
 if(s.quests.q05==='active'&&s.facts['boss-first-clear'])choices.unshift({id:'S03.report',label:'The Bastion is down.',command:{kind:'report-boss'}})
 if(s.facts['marshal-first-clear']&&!s.facts['gate-authenticated']&&s.inventory['f01.key.writ']===0&&!s.receipts['F01.WRIT.RECOVER'])choices.push({id:'S.writ',label:'Recover the missing accepted Transit Writ.',command:{kind:'recover-writ'}})
 choices.push({id:'leave',label:'I’ll return.',close:true})
 const line=(id:string,text:string,expression:FloorConversation['expression']='idle',acknowledge=true):FloorConversation=>({id,npc,text,choices,expression,acknowledge})
 if(s.receipts['F01.BOSS.REPORT']&&!s.seen.includes('S03.reported'))return line('S03.reported','Take its authority core to EKO’s plaza controller. Decide who operates the restored grid. I can make a case, not make your choice.\n\nEKO’s public controller is ready. Keep the Core until you confirm a governance choice; it cannot be sold or discarded.','smile')
 if(s.facts['boss-first-clear']&&s.quests.q05==='active')return line('S03.victory','All four funnels offline. Core directive terminated. It’s the first clean report the yard has produced in years.','smile',false)
 if(s.facts['gate-authenticated'])return line('S02.authorized','Your authorization is recorded. I won’t charge you another pair of seals.\n\nBreak all four of Kurogane’s funnels before striking the main body. The Marshal’s armor worked differently; don’t confuse them.','idle',!s.seen.includes('S02.authorized'))
 if(s.quests.q03!=='claimed')return line('S01.header','EKO’s signed header is missing. Resolve the archive recovery first; I don’t need to know what you do with the private records.','idle',false)
 if(s.quests.q04==='active')return line('S02.records',s.inventory['f01.key.relay']>0&&s.inventory['f01.key.writ']>0?'Seal verified. Writ verified. The cross-route and core gate are ready to unlock.':s.inventory['f01.key.relay']===0?'I don’t have the Relay Seal. The board in Relay Hall needs to record a successful route.':'The Marshal’s defeat record hasn’t issued a writ. Check its accepted receipt, not an arena rehearsal.','idle',false)
 return line('S01.intro','The Bastion still obeys the yard’s perimeter order. I need a Relay Seal from the Undergrid and a Transit Writ from the Marshal. Not a recommendation. Not a good reputation. The actual authorizations.\n\nThe Relay Hall board can restore the seal. The Marshal holds the writ. Come back here before you enter the core.')
}
