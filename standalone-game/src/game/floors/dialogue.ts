import { phase6Conversation,type MemoryTopic } from './phase6-dialogue'
import type { Campaign } from './state'
import type { FirstLoopAction } from './commands'
import type { FloorAction } from './actions'
import { phase5Conversation } from './phase5-dialogue'
import { phase4Conversation } from './phase4-dialogue'
import type { FloorNpcId } from './npcs'
export type FloorPanel='shop'|'allocation'|'planning'|'checkpoint'|'camp'|'journal'|'bag'|'travel'|'expedition'|'relay'|'archive'|'resource'|'plaque'|'archive-policy'|'invoice-policy'|'keepsake-sale'|'keepsake-delivery'|'replacement'|'reconciliation'|'gate-authorization'|'dispatch-checkpoint'|'dispatch-supplies'|'marshal-dock'|'governance'|'repair'|'crafting'|'koi'|'koi-assisted'|'maintenance'|'perk'|'furnishings'
export type FloorChoice={id:string;label:string;command?:FloorAction;panel?:FloorPanel;history?:MemoryTopic;pin?:string;close?:boolean}
export type FloorConversation={id:string;npc:FloorNpcId;text:string;expression:'idle'|'smile'|'happy'|'sad';choices:FloorChoice[];acknowledge:boolean}
const close:FloorChoice={id:'leave',label:'I’ll return.',close:true}
function topics(s:Campaign,npc:FloorNpcId):FloorChoice[]{
  if(npc==='ivo')return[
    ...(s.quests.q02==='active'&&!s.facts['cell-issued']?[{id:'I01.cell',label:'I’m here for the emergency cell.',command:{kind:'cell'} as FirstLoopAction}]:[]),
    ...(s.quests.q02==='active'&&s.facts['cell-issued']&&s.inventory['f01.key.cell']===0&&s.decisions.allocation==='unset'&&!s.receipts['F01.CELL.RECOVER']?[{id:'I01.recover',label:'Recover the missing quest Cell.',command:{kind:'recover-cell'} as FirstLoopAction}]:[]),
    {id:'I01.shop',label:'Show me your stock.',panel:'shop'},close,
  ]
  return[
    ...(s.quests.q01==='available'?[{id:'M01.help',label:'Where should I start?',command:{kind:'accept-q01'} as FirstLoopAction}]:[]),
    ...(s.quests.q01==='active'?(s.facts['checkpoint-active']&&s.facts['route-inspected']?[{id:'M02.report',label:'I’ve marked the route. Claim 15 SC.',command:{kind:'claim-q01'} as FirstLoopAction}]:[{id:'M02.board',label:'Show me what I still need.',pin:s.facts['checkpoint-active']?'arrival-planning':'landing-beacon'}]):[]),
    ...(s.quests.q02==='available'?[{id:'M02.job',label:'I’ll speak to Ivo.',command:{kind:'accept-q02'} as FirstLoopAction}]:[]),
    ...(s.quests.q02==='completed'?[{id:'M03.report',label:'The auxiliary line is stable. Claim 35 SC.',command:{kind:'claim-q02'} as FirstLoopAction}]:[]),
    {id:'M01.rest',label:'Can I rest here?',panel:'camp'},close,
  ]
}
/** Pinned nodes prevent a seen acknowledgement from replacing words mid-speech. */
function legacyConversation(s:Campaign,npc:FloorNpcId):FloorConversation{
  const next=phase5Conversation(s,npc);if(next)return next
  const later=phase4Conversation(s,npc);if(later)return later
  const choices=topics(s,npc)
  const node=(id:string,text:string,expression:FloorConversation['expression']='idle',acknowledge=true):FloorConversation=>({id,npc,text,expression,choices,acknowledge})
  if(npc==='mara'){
    if(s.receipts['F01.Q02.CLAIM']&&!s.seen.includes('reply:F01.Q02.CLAIM'))return node('reply:F01.Q02.CLAIM',s.decisions.allocation==='clinic'?'The monitors stopped cutting out. I don’t know who’ll be in that bed tonight, but you’ve given them a better chance.\n\nEKO is looking for someone who can reach the old route archive. You’ll find the projection in the plaza. The Undergrid utility gate is open beyond Ivo’s market.':'The tram controls are running. That matters too. I’ll keep the clinic on reserve a while longer. Don’t mistake a hard choice for an easy one.\n\nEKO is at the plaza. The Undergrid utility gate is open beyond Ivo’s market.',s.decisions.allocation==='clinic'?'smile':'sad')
    if(s.receipts['F01.Q01.CLAIM']&&!s.seen.includes('reply:F01.Q01.CLAIM'))return node('reply:F01.Q01.CLAIM','Good. You have a way home. Ivo has an emergency cell at the market. Our auxiliary line can support the clinic or the tram controls, but not both.','smile')
    if(s.receipts['F01.Q02.ACCEPT']&&!s.seen.includes('reply:F01.Q02.ACCEPT'))return node('reply:F01.Q02.ACCEPT','Ask for the district cell. He knows it’s not stock for sale.')
    if(s.receipts['F01.Q01.ACCEPT']&&!s.seen.includes('reply:F01.Q01.ACCEPT'))return node('reply:F01.Q01.ACCEPT','Mark this landing as your return point, then read the market route on the board. Know how to get back before you go looking for trouble.')
    if(s.quests.q02==='claimed'&&s.knowledge.mara.includes('allocation')&&!s.seen.includes('M03.revisit'))return node('M03.revisit',s.decisions.allocation==='clinic'?'Still hearing a steady monitor from the clinic. That’s your work.':'A courier brought medicine on the restored tram. We’re making it stretch.',s.decisions.allocation==='clinic'?'smile':'idle')
    if(!s.seen.includes('M01.intro'))return node('M01.intro','Watch the wet cable by the lift. The lights make this place look healthier than it is. I’m Mara. If you’re staying, we could use another pair of hands.')
    if(s.quests.q01==='active')return node('M02.progress','The landing beacon and the board beside it. Those first.\n\n'+(s.facts['checkpoint-active']?'Return checkpoint: recorded.':'Return checkpoint: still needed.')+' '+(s.facts['route-inspected']?'Market route: recorded.':'Market route: still needed.'),'idle',false)
    if(s.quests.q02==='completed')return node('M03.turn-in',s.decisions.allocation==='clinic'?'The clinic monitors are steady. Tell me the auxiliary line is safe, and I’ll record the work.':'The tram controls are running. Tell me the auxiliary line is safe, and I’ll record the work.','idle',false)
    if(s.relationships.mara<0)return node('Mara.wary','I’m busy. If you need treatment, sit down. We can disagree without leaving someone hurt.','idle',false)
    return node('Mara.repeat',s.relationships.mara>=10?'Good to see you back. Tell me what the city looks like beyond these rails.':'How are you holding up? The landing’s clear if you need a moment.','idle',false)
  }
  if(s.receipts['F01.CELL']&&!s.seen.includes('reply:F01.CELL'))return node('reply:F01.CELL','There. Route it at the allocation board, and read the load before you flip anything.')
  if(s.receipts['F01.CELL.RECOVER']&&!s.seen.includes('reply:F01.CELL.RECOVER'))return node('reply:F01.CELL.RECOVER','I’ve recovered the missing Cell against your original receipt. Bring it straight to the allocation board.')
  if(s.knowledge.ivo.includes('allocation')&&!s.seen.includes('I01.allocation'))return node('I01.allocation',s.decisions.allocation==='clinic'?'The district power notice came through. The clinic has the auxiliary line now. The tram will have to wait.':'The district power notice came through. Transit has the auxiliary line now. The clinic is staying on reserve.')
  if(!s.seen.includes('I01.intro'))return node('I01.intro','If Mara sent you, the district cell is under the counter. The tag says emergency supply. Some things still aren’t for sale.')
  return node('Ivo.repeat',s.relationships.ivo<=-10?'We can still trade. Prices are on the board. Emergency supplies stay available.':s.relationships.ivo>=10?'Good to see you. I’ve marked your regulars’ rate on the board.':'Old systems doing exactly what an old order told them to do. People kept building around them. Now we get to untangle it.','idle',false)
}

export function floorConversation(s:Campaign,npc:FloorNpcId,history?:MemoryTopic):FloorConversation{return phase6Conversation(s,npc,legacyConversation(s,npc),history)}
