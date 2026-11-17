import type { Campaign } from './state'
import type { FloorNpcId } from './npcs'
import type { FloorChoice,FloorConversation } from './dialogue'
import { activities,GOVERNANCE,type Governance } from './phase6-content'
export type MemoryTopic='governance'|'archive'|'invoice'|'promise'|'allocation'|'gate'|'awning'|'calibration'|'shipment'
const GOVERNANCE_LINES:Record<FloorNpcId,Record<Governance,string>>={
 mara:{community:'The clinic’s on a shared schedule now. It will mean meetings and arguments. At least the people losing sleep get a say.',warden:'Sena sent the new supply rules. I’ll hold her to the part about emergency access. People can’t wait for a form to be approved.',exchange:'The lights are steady. The bills will be too. I hope the safeguards you agreed to mean something when business gets difficult.'},
 ivo:{community:'The new committee wants open repair accounts. I suppose you’ve given them practice asking for those.',warden:'One schedule, one inspector, three copies of every order. We’ll adapt.',exchange:'The concession is signed. You’ll see its discount on basic goods. Now we’ll have to prove the service is worth the contract.'},
 eko:{community:'The first council meeting ran late. Three amendments, one repaired line. I have archived both the argument and the work.',warden:'The inspection log is public. That is a better use of records than a list of people who once crossed a bridge.',exchange:'The concession’s first report is filed. We will keep the report beside the contract, not behind it.'},
 nyx:{community:'The council asked how couriers use the night routes. First time anyone asked before drawing the map.',warden:'New route permits are clear enough. We’ll see if they stay clear when the first exception comes in.',exchange:'Contracts keep parcels moving. I’m keeping a copy of the clause that says a courier can refuse an unsafe run.'},
 sena:{community:'The council has the authority key. I’ll share the safety maps. I’d rather they know the risks than learn them through an outage.',warden:'The charter’s signed. We have authority now, which means we also have responsibility. Ask to see the logs if we forget that.',exchange:'The concession is legal. It doesn’t exempt them from inspection. I intend to be very clear about that.'},
}
const acceptedGovernance:Record<Governance,string>={community:'Recorded. The grid will answer to the people who live beside it. Their first task is agreeing how to listen to each other.',warden:'Recorded. Sena’s charter carries the authority now. A clear rule is useful; a rule that can never be challenged is not.',exchange:'Recorded. The contract and its safeguards are public. Let us make sure people can read both.'}
function memoryText(s:Campaign,npc:FloorNpcId,topic:MemoryTopic):string|null{
 const knows=s.knowledge[npc]
 if(topic==='awning'&&npc==='mara'&&s.quests.q07==='claimed')return 'Dry shelves, dry dressings. Small things add up. The Repair Bay’s patched awning is on your completed work record.'
 if(topic==='calibration'&&npc==='eko'&&s.quests.q10==='claimed')return 'Still synchronized. No need to recalibrate for another reward. The small projector plan is unlocked at the Repair Bay.'
 if(topic==='shipment'&&npc==='sena'&&s.expedition.receipts['F01.MAINT.CLAIM'])return 'We’ve logged this run’s shipment. Next expedition, we’ll need another.'
 if(topic==='governance'&&knows.includes('governance')&&s.decisions.governance!=='unset')return GOVERNANCE_LINES[npc][s.decisions.governance]
 if(topic==='archive'&&npc==='eko'&&knows.includes('archive'))return s.decisions.archive==='redacted'?'The new public record contains no names. Someone used it to find the clinic this morning. That is enough detail.':'There is an empty field where the private paths used to be. I have stopped trying to reconstruct it.'
 if(topic==='invoice'&&knows.includes('invoice'))return npc==='ivo'?(s.decisions.invoice==='protected'?'Still keeping the document private? Good. My recommendation wasn’t a promise that we’d agree on everything.':'Your notice is still up. I’ve answered more questions this week than in a year of trading. You can buy what you need; I don’t have to like you.'):s.decisions.invoice==='published'?'I saw the district notice. Some families have been paying twice for the same repairs. They’ll have questions for Ivo.':null
 if(topic==='allocation'&&knows.includes('allocation'))return npc==='mara'?(s.decisions.allocation==='clinic'?'Still hearing a steady monitor from the clinic. That’s your work.':'A courier brought medicine on the restored tram. We’re making it stretch.'):s.decisions.allocation==='transit'?'The district notice records a restored tram line. The clinic still has its reserve supply.':'The district notice records a stable clinic line. The tram remains on reserve.'
 if(topic==='gate'&&npc==='sena'&&knows.includes('gate'))return 'Your authorization is recorded. I won’t charge you another pair of seals.'
 if(topic==='promise'&&knows.includes('promise')){
  if(npc==='mara'&&s.decisions.promise==='returned')return 'The charm is safe. Nyx’s reply came through.'
  if(npc==='ivo')return 'The registered sale stays on the record. A replacement is not the original Keepsake.'
  if(npc==='nyx')return s.decisions.promise==='reconciled'?'We can work together. Slowly. And I will remember both things. The replacement doesn’t erase the registered sale.':s.decisions.promise==='sold'?'The registry sent me a sale receipt. Ivo’s stall. Forty scrip. You could have said no when I asked.':s.decisions.promise==='returned'?'Mara’s receipt came through. The charm’s where it should be. Thank you for carrying something that had no use to you.':s.facts['promise-declined']?'You said no before. That was honest. The delivery only became your responsibility when you accepted it.':'Mara’s at Lantern Landing. Keep the charm safe.'
 }
 return null
}
function fallback(s:Campaign,npc:FloorNpcId){
 const score=s.relationships[npc],low=score<0,high=score>=10
 if(npc==='mara')return low?'I’m busy. If you need treatment, sit down. We can disagree without leaving someone hurt.':high?'Good to see you back. Tell me what the city looks like beyond these rails.':'How are you holding up? The landing’s clear if you need a moment.'
 if(npc==='ivo')return score<=-10?'Prices are on the board. Ask before touching anything.':high?'I’ve held a few useful pieces aside. Take a look.':'Looking for parts, or looking for answers?'
 if(npc==='eko')return low?'I can provide the public record. Private questions will need a reason.':high?'I’ve kept your place in the record. What have you found?':'Which part of the city are you trying to understand?'
 if(npc==='nyx')return s.decisions.promise==='sold'?'Need the public route? The maintenance plaque has the archive code. I’m not offering another personal favor.':low?'Need a public route, or another favor?':high?'Good timing. I can tell you which walkways are clear.':'Where are you headed?'
 return low?'We can keep this professional. What do you need?':high?'You’re back. Good. I’d like your account before I finalize the patrol notes.':'Any trouble on the service route?'
}
/** Augments real existing topics while keeping knowledge and callback priority separate. */
export function phase6Conversation(s:Campaign,npc:FloorNpcId,base:FloorConversation,history?:MemoryTopic):FloorConversation{
 const choice=s.decisions.governance,a=activities(s),extra:FloorChoice[]=[]
 if(npc==='mara'&&s.quests.q02==='claimed'){
  if(['locked','available'].includes(s.quests.q07))extra.push({id:'M04.accept',label:'I’ll repair the awning.',command:{kind:'accept-q07'}})
  if(s.quests.q07==='active')extra.push({id:'M04.station',label:'Review the Repair Bay materials.',panel:'repair'})
  if(s.quests.q07==='completed'&&a.awning)extra.push({id:'M04.report',label:'The awning is patched. Report the repair.',command:{kind:'claim-q07'}})
 }
 if(npc==='eko'){
  if(s.quests.q03==='claimed'&&['locked','available'].includes(s.quests.q10))extra.push({id:'E05.start',label:'Let’s calibrate the koi.',command:{kind:'accept-q10'},panel:'koi'},{id:'E05.assist',label:'Let me follow one direction at a time.',command:{kind:'accept-q10'},panel:'koi-assisted'})
  if(s.quests.q10==='active')extra.push({id:'E05.resume',label:'Continue Koi Signal Echo.',panel:'koi'})
  if(s.quests.q10==='completed'&&a.koiSolved)extra.push({id:'E05.report',label:'The signals match. Report calibration.',command:{kind:'claim-q10'}})
  if(s.quests.q05==='claimed'&&choice==='unset')extra.push(s.quests.q06==='active'?{id:'E06.review',label:'Review the three governance choices.',panel:'governance'}:{id:'E06.start',label:'Who should operate the restored grid?',command:{kind:'accept-q06'},panel:'governance'})
 }
 if(s.quests.q06==='claimed'&&(npc==='mara'&&choice==='community'||npc==='sena'&&choice==='warden'))extra.push({id:'perk',label:'Review this expedition’s '+(choice==='community'?'clinic':'insulation')+' supply.',panel:'perk'})
 if(npc==='sena'&&s.quests.q06==='claimed')extra.push({id:'S05.maintenance',label:s.quests.q11==='claimed'?'This expedition’s shipment record.':'Maintenance Run · supplies for 12 SC.',panel:'maintenance'})
 if(npc==='nyx'&&s.decisions.promise!=='sold')extra.push({id:'N.tip',label:'Point me toward the archive maintenance clue.',pin:'maintenance-plaque'})
 for(const topic of ['governance','archive','invoice','promise','allocation','gate','awning','calibration','shipment'] as MemoryTopic[])if(memoryText(s,npc,topic))extra.push({id:'history.'+topic,label:'Remembered '+topic+'.',history:topic})
 const choices=[...extra,...base.choices.filter(c=>!c.close),{id:'leave',label:'I’ll return.',close:true}],line=(id:string,text:string,expression:FloorConversation['expression']='idle',acknowledge=true):FloorConversation=>({id,npc,text,expression,choices,acknowledge})
 if(history)return line('history:'+npc+':'+history,memoryText(s,npc,history)??'I do not have a record of that conversation.','idle',false)
 if(npc==='eko'&&choice!=='unset'&&s.receipts[GOVERNANCE[choice].bundle]&&!s.seen.includes('reply:'+GOVERNANCE[choice].bundle))return line('reply:'+GOVERNANCE[choice].bundle,acceptedGovernance[choice],'smile')
 if(npc==='mara'&&s.receipts['F01.AWN']&&!s.seen.includes('reply:F01.AWN'))return line('reply:F01.AWN','Dry shelves, dry dressings. Small things add up.','smile')
 if(npc==='eko'&&s.receipts['F01.KOI']&&!s.seen.includes('reply:F01.KOI'))return line('reply:F01.KOI','Agreed. A clean loop. I’ve unlocked the small projector plan at the repair bay.','smile')
 if(npc==='sena'&&s.expedition.receipts['F01.MAINT.CLAIM']&&!s.seen.includes('S05.claimed'))return line('S05.claimed','Recorded. That’s this expedition’s delivery.')
 const specific=base.id.startsWith('reply:')||['N03.sold','N04.reconciled','N02.returned','M03.revisit','I01.allocation','S03.reported','S02.authorized'].includes(base.id)||base.id.startsWith('E03.')||base.id.startsWith('I03.')
 if(specific&&!s.seen.includes(base.id))return {...base,choices,acknowledge:true}
 if(npc==='mara'&&s.knowledge.mara.includes('invoice')&&s.decisions.invoice==='published'&&!s.seen.includes('M07.invoice'))return line('M07.invoice',memoryText(s,npc,'invoice')!)
 if(choice!=='unset'&&s.knowledge[npc].includes('governance')&&!s.seen.includes('governance:'+npc+':'+choice))return line('governance:'+npc+':'+choice,GOVERNANCE_LINES[npc][choice],npc==='mara'&&choice==='community'||npc==='ivo'&&choice==='exchange'||npc==='sena'&&choice==='warden'?'smile':'idle')
 if(npc==='eko'&&s.quests.q03==='claimed'&&s.quests.q10==='active')return line('E05.active','The two koi disagree about which way the signal travels. Follow Left, Up, Right, Down and I can synchronize the emitter. Normal and assisted calibration give the same result.','idle',false)
 if(npc==='mara'&&s.quests.q07==='active')return line('M04.active','The rain gets through the bay awning. Bring Fiber 3 and Scrap 2 to the repair station; saying it’s done won’t keep the rain out.','idle',false)
 if(npc==='sena'&&s.quests.q06==='claimed'&&s.quests.q11==='active')return line('S05.active','We can use two pieces of scrap and one coolant pack for routine repairs. Twelve scrip for the delivery. The contract won’t change your standing; we need supplies, not a ceremony.','idle',false)
 // Preserve unfinished main-story guidance and first introductions. Repeated
 // known history moves to explicit topics, allowing later public events to speak.
 if(!specific&&base.acknowledge&&!s.seen.includes(base.id)||npc==='sena'&&s.quests.q05!=='claimed'||npc==='eko'&&s.quests.q03!=='claimed'||npc==='mara'&&s.quests.q02!=='claimed')return {...base,choices}
 return line('repeat:'+npc,fallback(s,npc),'idle',false)
}
