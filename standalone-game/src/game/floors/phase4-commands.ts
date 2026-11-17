import { vitals, type CommandResult } from './commands'
import { ARCHIVE_SEQUENCE, INITIAL_RELAY, RELAY_CELLS, LOCKER_CODE, puzzleState, relayTrace } from './puzzles'
import { FLOOR_MOBS, RESOURCE_NODES, INCOMING_DAMAGE, mobLoot, type SpawnId } from './content'
import { safeId, type Campaign, type Effect, type Outcome, type StageId } from './state'
export type Phase4Action=
 |{kind:'recover-replacement'|'meet-eko'|'meet-nyx'|'accept-q03'|'accept-q08'|'decline-promise'|'accept-promise'|'deliver-promise'|'sell-promise'|'reconcile-promise'|'relay-check'|'relay-reset'|'archive-reset'}
 |{kind:'archive-policy';policy:'redacted'|'erased'}
 |{kind:'invoice-policy';policy:'protected'|'published'}
 |{kind:'replacement';payment:'scrip'|'wire'}
 |{kind:'relay-rotate';index:number}
 |{kind:'archive-symbol';symbol:number}
 |{kind:'collect';node:string;code?:string}
 |{kind:'mob-loot';spawn:SpawnId;defeated:boolean}
 |{kind:'incoming';source:keyof typeof INCOMING_DAMAGE;contact:string}
export const PHASE4_KINDS=new Set(['recover-replacement','meet-eko','meet-nyx','accept-q03','accept-q08','decline-promise','accept-promise','deliver-promise','sell-promise','reconcile-promise','relay-check','relay-reset','archive-reset','archive-policy','invoice-policy','replacement','relay-rotate','archive-symbol','collect','mob-loot','incoming'])
export function phase4Command(s:Campaign,a:Phase4Action,id:string):CommandResult{
 const stage=s.location.stage,fail=(message:string):CommandResult=>({ok:false,message})
 const outcome=(key:string,effects:Effect[],message:string,event:Outcome['event']='conversation',scope:Outcome['scope']='profile'):CommandResult=>({ok:true,outcome:{id:key,event,scope,conditions:[{kind:'stage',value:stage}],effects},message})
 const at=(expected:StageId)=>stage===expected
 const puzzle=puzzleState(s),edit=(message:string)=>outcome('F01.PUZZLE.'+id,[{kind:'puzzles',value:puzzle}],message,'puzzle','state')
 const story=(name:string,effects:Effect[],message:string)=>outcome(name,effects,message)
 switch(a.kind){
 case'meet-eko':return at('f01.stage.arrival')?story('F01.EKO.MET',[{kind:'met',key:'eko'}],'You met EKO-9.'):fail('EKO is at Hologram Plaza.')
 case'meet-nyx':return at('f01.stage.skybridge')?story('F01.NYX.MET',[{kind:'met',key:'nyx'}],'You met Nyx Tal.'):fail('Nyx is in the Rainline courier shelter.')
 case'accept-q03':return at('f01.stage.arrival')&&s.quests.q02==='claimed'&&s.quests.q03==='available'?story('F01.Q03.ACCEPT',[{kind:'quest',key:'q03',value:'active'}],'Ghosts in the Glass accepted. Recover the Rainline archive fragment.'):fail('Report Q02 to Mara before accepting this job.')
 case'accept-q08':return at('f01.stage.market')&&s.quests.q03==='claimed'&&s.facts['invoice-found']&&s.decisions.invoice==='unset'?story('F01.Q08.ACCEPT',[{kind:'quest',key:'q08',value:'active'}],'An Honest Invoice accepted. Review the private and public choices before confirming.'):fail('Recover and resolve EKO’s archive before discussing the invoice.')
 case'archive-policy':{
   if(!at('f01.stage.arrival')||s.quests.q03!=='active'||s.decisions.archive!=='unset'||s.inventory['f01.key.fragment']<1)return fail('Bring the recovered Memory Fragment to EKO with Q03 active.')
   const redact=a.policy==='redacted'
   return story(redact?'F01.ARCH.R':'F01.ARCH.E',[{kind:'item',key:'f01.key.fragment',amount:-1},{kind:'decision',key:'archive',value:a.policy},{kind:'fact',key:'private-routes-available',value:false},{kind:'fact',key:'redacted-archive-available',value:redact},{kind:'fact',key:'header-retained',value:true},{kind:'knowledge',key:'eko',value:'archive'},{kind:'relationship',key:'eko',amount:redact?8:-4},{kind:'faction',key:'residents',amount:redact?2:6},{kind:'scrip',amount:45},{kind:'quest',key:'q03',value:'claimed'},{kind:'quest',key:'q04',value:'available'},{kind:'quest',key:'q10',value:'available'},{kind:'quest',key:'q08',value:'available'}],`${redact?'Redacted civic copy retained':'Private routes erased'}. Gate header retained · Q03 complete · +45 SC.`)
 }
 case'invoice-policy':{
   if(!at('f01.stage.market')||s.quests.q08!=='active'||!s.facts['invoice-found']||s.decisions.invoice!=='unset')return fail('Discuss the recovered invoice with Ivo first.')
   const protect=a.policy==='protected',knowledge:Effect[]=protect?[{kind:'knowledge',key:'ivo',value:'invoice'}]:(['mara','ivo','eko','nyx','sena'] as const).map(key=>({kind:'knowledge' as const,key,value:'invoice' as const}))
   return story(protect?'F01.INVOICE.P':'F01.INVOICE.B',[{kind:'decision',key:'invoice',value:a.policy},{kind:'relationship',key:'ivo',amount:protect?10:-10},{kind:'faction',key:'exchange',amount:protect?6:-6},...(!protect?[{kind:'faction',key:'residents',amount:8} as Effect]:[]),...knowledge,{kind:'quest',key:'q08',value:'claimed'},{kind:'scrip',amount:40}],`Invoice ${protect?'kept private':'published to the district'} · Q08 complete · +40 SC. Prices now reflect Ivo’s actual trust.`)
 }
 case'decline-promise':return at('f01.stage.skybridge')&&s.decisions.promise==='unseen'?story('F01.PROMISE.D',[{kind:'decision',key:'promise',value:'declined'},{kind:'fact',key:'promise-declined',value:true}],'Delivery declined. You can explicitly accept later; no penalty.'):fail('This offer has already been answered.')
 case'accept-promise':return at('f01.stage.skybridge')&&['unseen','declined'].includes(s.decisions.promise)?story('F01.PROMISE.A',[{kind:'decision',key:'promise',value:'carrying'},{kind:'item',key:'f01.item.keepsake',amount:1},{kind:'quest',key:'q09',value:'active'},{kind:'knowledge',key:'nyx',value:'promise'}],'Nyx’s Keepsake received. Deliver it to Mara; no trust reward for accepting.'):fail('You already accepted or resolved this delivery.')
 case'deliver-promise':{
   if(!at('f01.stage.arrival')||s.decisions.promise!=='carrying'||s.inventory['f01.item.keepsake']<1)return fail('Bring Nyx’s actual Keepsake to Mara.')
   return story('F01.PROMISE.R',[{kind:'item',key:'f01.item.keepsake',amount:-1},{kind:'decision',key:'promise',value:'returned'},{kind:'relationship',key:'nyx',amount:10},{kind:'relationship',key:'mara',amount:2},{kind:'faction',key:'couriers',amount:6},{kind:'knowledge',key:'mara',value:'promise'},{kind:'knowledge',key:'nyx',value:'promise'},{kind:'scrip',amount:30},{kind:'quest',key:'q09',value:'claimed'}],'Keepsake delivered and courier receipt issued · Q09 complete · +30 SC.')
 }
 case'sell-promise':{
   if(!at('f01.stage.market')||s.decisions.promise!=='carrying'||s.inventory['f01.item.keepsake']<1)return fail('The original Keepsake must be in your pack for this registered sale.')
   return story('F01.PROMISE.S',[{kind:'item',key:'f01.item.keepsake',amount:-1},{kind:'decision',key:'promise',value:'sold'},{kind:'fact',key:'promise-sold',value:true},{kind:'relationship',key:'nyx',amount:-20},{kind:'faction',key:'couriers',amount:-8},{kind:'knowledge',key:'ivo',value:'promise'},{kind:'knowledge',key:'nyx',value:'promise'},{kind:'scrip',amount:40},{kind:'quest',key:'q09',value:'claimed'}],'Registered Keepsake sale · +40 SC. Nyx received the registry notice. No delivery reward was granted.')
 }
 case'replacement':{
   if(!at('f01.stage.market')||s.decisions.promise!=='sold'||s.inventory['f01.item.replacement']>0)return fail('Replacement service is only available for a sold, unreconciled Keepsake.')
   if(s.receipts['F01.REPLACEMENT'])return fail('This replacement already has a purchase receipt. Check recovery storage; it cannot be purchased twice.')
   if(a.payment==='scrip'&&s.scrip<40||a.payment==='wire'&&s.inventory['f01.mat.wire']<3)return fail('Replacement costs 40 SC or 3 Wire. Nothing was spent.')
   const cost:Effect=a.payment==='scrip'?{kind:'scrip',amount:-40}:{kind:'item',key:'f01.mat.wire',amount:-3}
   return story('F01.REPLACEMENT',[cost,{kind:'item',key:'f01.item.replacement',amount:1}],'Replacement Housing acquired. Bring it to Nyx; this is not the original charm.')
 }
 case'recover-replacement':return at('f01.stage.market')&&s.decisions.promise==='sold'&&!!s.receipts['F01.REPLACEMENT']&&s.inventory['f01.item.replacement']===0?story('F01.REPLACEMENT.RECOVER',[{kind:'item',key:'f01.item.replacement',amount:1}],'Purchased replacement recovered against its receipt. No additional cost or reward.'):fail('Recovery requires a purchased, missing replacement and an unresolved sale.')
 case'reconcile-promise':return at('f01.stage.skybridge')&&s.decisions.promise==='sold'&&s.inventory['f01.item.replacement']>0?story('F01.PROMISE.F',[{kind:'item',key:'f01.item.replacement',amount:-1},{kind:'decision',key:'promise',value:'reconciled'},{kind:'relationship',key:'nyx',amount:8},{kind:'faction',key:'couriers',amount:4},{kind:'knowledge',key:'nyx',value:'promise'}],'Replacement delivered. Nyx remembers the sale and the repair. No second Q09 currency reward.'):fail('Bring the actual Replacement Housing to Nyx.')
 case'relay-rotate':if(!at('f01.stage.undergrid')||s.facts['p02-solved']||!RELAY_CELLS.includes(a.index as never))return fail('This relay cannot be rotated.');puzzle.relay[a.index]=(puzzle.relay[a.index]+1)%4;return edit('Relay connector rotated and saved.')
 case'relay-reset':if(!at('f01.stage.undergrid')||s.facts['p02-solved'])return fail('The accepted relay is already latched.');puzzle.relay=[...INITIAL_RELAY];return edit('Relay layout reset. No items were consumed.')
 case'relay-check':if(!at('f01.stage.undergrid')||!relayTrace(puzzle.relay).solved)return fail('Breaker stayed open: connect matching ports from the west source to the east output.');return outcome('F01.P02.SOLVE',[{kind:'fact',key:'p02-solved',value:true},{kind:'item',key:'f01.key.relay',amount:1}],'Relay energized · guaranteed Relay Seal received.','puzzle')
 case'archive-reset':if(!at('f01.stage.skybridge'))return fail('Use the Rainline archive.');puzzle.archive=[];return edit('Archive entry reset. Replay the clue whenever needed.')
 case'archive-symbol':{
   if(!at('f01.stage.skybridge')||s.facts['fragment-recovered']||!Number.isInteger(a.symbol)||a.symbol<0||a.symbol>2)return fail('This archive input is unavailable.')
   const next=[...puzzle.archive,a.symbol],correct=next.every((symbol,i)=>symbol===ARCHIVE_SEQUENCE[i])
   if(!correct){puzzle.archive=[];return edit('Pattern did not match. Only the input reset; no items or HP were lost.')}
   puzzle.archive=next
   if(next.length<4)return edit(`Symbol accepted · ${next.length}/4.`)
   return outcome('F01.P03.SOLVE',[{kind:'puzzles',value:puzzle},{kind:'fact',key:'archive-open',value:true},{kind:'fact',key:'fragment-recovered',value:true},{kind:'fact',key:'invoice-found',value:true},{kind:'fact',key:'private-routes-available',value:true},{kind:'item',key:'f01.key.fragment',amount:1}],'Archive unlocked · Memory Fragment and Invoice Record recovered. Bring the sealed fragment to EKO.','puzzle')
 }
 case'collect':{
   const node=RESOURCE_NODES[a.node];if(!node||stage!==node.stage)return fail('That resource node is not here.')
   if(a.node==='archive-locker'&&a.code!==LOCKER_CODE)return fail('Maintenance code did not match. Read the public plaque beside this locker.')
   const items=Object.entries(node.items).map(([key,amount])=>({kind:'item',key,amount}) as Effect)
   return outcome('F01.NODE.'+a.node,[...items,...(node.scrip?[{kind:'scrip',amount:node.scrip} as Effect]:[])],node.label+' collected · '+Object.entries(node.items).map(([key,n])=>key.split('.').at(-1)+' +'+n).join(', ')+(node.scrip?' · +'+node.scrip+' SC':''),'resource',node.scope)
 }
 case'mob-loot':{
   const spawn=FLOOR_MOBS.find(row=>row.id===a.spawn);if(!spawn||stage!==spawn.stage||!a.defeated||vitals(s).hp===0)return fail('Loot requires the actual defeated enemy in this stage.')
   const loot=mobLoot(a.spawn,s.expedition.id),items=Object.entries(loot.items).map(([key,amount])=>({kind:'item',key,amount}) as Effect)
   return outcome('F01.MOB.'+a.spawn,[{kind:'scrip',amount:loot.scrip},...items],`Defeat loot saved · +${loot.scrip} SC · `+Object.entries(loot.items).map(([key,n])=>key.split('.').at(-1)+' +'+n).join(', '),'combat','expedition')
 }
 case'incoming':{
   if(!['f01.stage.undergrid','f01.stage.skybridge'].includes(stage)||!safeId(a.contact))return fail('This contact is not valid here.')
   if(s.combat?.recent.includes(a.contact))return outcome('F01.CONTACT.'+id,[],'This contact was already recorded.','combat','state')
   const current=vitals(s),shield=a.source==='vent'&&current.insulation>0,damage=Math.min(current.hp,shield?5:INCOMING_DAMAGE[a.source])
   return outcome('F01.CONTACT.'+id,[{kind:'vitals',hp:current.hp-damage,insulation:current.insulation-(shield?1:0)},{kind:'contact',id:a.contact}],`${damage} HP damage confirmed${shield?' · insulation absorbed half':''}.`,'combat','state')
 }
 }
}
