import type { Campaign } from './state'
import type { FloorNpcId } from './npcs'
import type { FloorChoice, FloorConversation } from './dialogue'
/** Private callbacks require their own knowledge channel; reputation is not mind reading. */
export function phase4Conversation(s:Campaign,npc:FloorNpcId):FloorConversation|null{
 const leave:FloorChoice={id:'leave',label:'I’ll return.',close:true}
 const node=(id:string,text:string,choices:FloorChoice[],expression:FloorConversation['expression']='idle',acknowledge=true):FloorConversation=>({id,npc,text,choices:[...choices,leave],expression,acknowledge})
 if(npc==='eko'){
   const topics:FloorChoice[]=[...(s.quests.q03==='available'?[{id:'E02.accept',label:'I’ll recover the Rainline fragment.',command:{kind:'accept-q03'} as const}]:[]),...(s.quests.q03==='active'&&s.inventory['f01.key.fragment']>0?[{id:'E03.review',label:'Review what the archive should retain.',panel:'archive-policy' as const}]:[])]
   if(s.decisions.archive!=='unset'&&s.knowledge.eko.includes('archive')){
     const redact=s.decisions.archive==='redacted',id='E03.'+s.decisions.archive
     if(!s.seen.includes(id))return node(id,redact?'Then I will keep what helps without keeping what exposes them. A smaller archive can still be an honest one.':'Understood. I will remember that we chose to forget those paths. That distinction matters.',topics,redact?'smile':'sad')
     return node('E04.'+s.decisions.archive,redact?'The new public record contains no names. Someone used it to find the clinic this morning. That is enough detail.':'There is an empty field where the private paths used to be. I have stopped trying to reconstruct it.',topics,'idle',false)
   }
   if(!s.seen.includes('E01.intro'))return node('E01.intro','Welcome to the plaza. My public map is twelve years out of date. The koi have been circling the same maintenance warning for most of that time.',topics)
   return node('E02.job',s.quests.q02==='claimed'?'The Rainline archive holds a memory fragment. Bring it here sealed before deciding what should remain. Its gate header can be retained without exposing anyone’s private paths.':'Mara needs the auxiliary line stable first. I can wait; the city has already kept me waiting twelve years.',topics,'idle',false)
 }
 if(npc==='nyx'){
   const promise=s.decisions.promise,topics:FloorChoice[]=[]
   if(promise==='unseen'||promise==='declined')topics.push({id:'N01.accept',label:promise==='declined'?'I can take the charm now.':'I’ll take it to Mara.',command:{kind:'accept-promise'}},...(promise==='unseen'?[{id:'N01.decline',label:'I can’t promise that.',command:{kind:'decline-promise'} as const}]:[]))
   if(promise==='sold'&&s.inventory['f01.item.replacement']>0)topics.push({id:'N04.repair',label:'I brought a replacement. Review the repair.',panel:'reconciliation'})
   if(promise==='sold')return node('N03.sold','The registry sent me a sale receipt. Ivo’s stall. Forty scrip. You could have said no when I asked.'+(s.inventory['f01.item.replacement']?' That housing is a replacement, not the original.':' Ivo can supply a replacement housing. The public maintenance plaque still has the archive instructions.'),topics,'sad',!s.seen.includes('N03.sold'))
   if(promise==='reconciled')return node('N04.reconciled',!s.seen.includes('N04.reconciled')?'We can work together. Slowly. And I will remember both things.':'The replacement’s holding. So is the agreement. Let’s leave it at that for now.',topics,'idle',!s.seen.includes('N04.reconciled'))
   if(promise==='returned')return node('N02.returned','Mara’s receipt came through. The charm’s where it should be. Thank you for carrying something that had no use to you.',topics,'smile',!s.seen.includes('N02.returned'))
   if(!s.seen.includes('N01.intro'))return node('N01.intro',(s.decisions.allocation==='clinic'?'You’re the one on the power notice. Clinic got the auxiliary line. My tram’s still waiting, but I’ve delivered to that ward. I understand the choice.':s.decisions.allocation==='transit'?'The tram controls are alive again. Your name was on the power notice. That line saved us a very long walk.':'The rain’s easier to read from under this roof.')+'\n\nI’m Nyx. Courier, when the city lets me.\n\nThis charm belonged to my brother. Mara has a place for it at the landing. It won’t open a gate or win a fight. Will you take it to her?',topics)
   if(promise==='carrying')return node('N01.carrying','Mara’s at Lantern Landing. Keep the charm safe. For the archive: Fish, Moon, Fish, Star. The public plaque repeats the sequence if you need it.',topics,'idle',false)
   return node('N01.offer','This charm belonged to my brother. Mara has a place for it at the landing. It won’t open a gate or win a fight. Will you take it to her?'+(promise==='declined'?' You said no before. That was honest; the offer is still open.':''),topics,'idle',false)
 }
 if(npc==='mara'&&s.decisions.promise==='carrying'&&s.inventory['f01.item.keepsake']>0)return node('M04.delivery','Nyx asked you to bring something? I can record the handover and send a courier receipt.',[{id:'M04.confirm',label:'Review Keepsake handover.',panel:'keepsake-delivery'},{id:'M04.rest',label:'Can I rest first?',panel:'camp'}],'idle',false)
 if(npc==='ivo'){
   const topics:FloorChoice[]=[{id:'I.shop',label:'Show me your stock.',panel:'shop'}]
   if(s.quests.q03==='claimed'&&s.facts['invoice-found']&&s.decisions.invoice==='unset')topics.unshift(s.quests.q08==='active'?{id:'I03.review',label:'Review the invoice options.',panel:'invoice-policy'}:{id:'I03.accept',label:'I found an invoice record.',command:{kind:'accept-q08'}})
   if(s.decisions.promise==='carrying'&&s.inventory['f01.item.keepsake']>0)topics.push({id:'I02.sale',label:'What would you pay for this charm?',panel:'keepsake-sale'})
   if(s.decisions.promise==='sold')topics.push({id:'I02.replacement',label:'About a replacement housing…',panel:'replacement'})
   if(s.knowledge.ivo.includes('invoice'))return node('I03.'+s.decisions.invoice,s.decisions.invoice==='protected'?'You kept the invoice off the public board. I won’t pretend it was clean, but I know who let me set it right.':'The invoice is on every public board now. We can still trade. Prices are posted; emergency supplies stay available.',topics,'idle',false)
   if(topics.length>1)return node('I02.topics','You’ve brought more than salvage. Tell me which matter you want to settle. Anything with a registry trail stays on the record.',topics,'idle',false)
 }
 return null
}
