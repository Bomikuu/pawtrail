import test from 'node:test'
import assert from 'node:assert/strict'
import { freshCampaign, applyOutcome, validCampaign, type Campaign } from '../src/game/floors/state'
import { phase4Command, type Phase4Action } from '../src/game/floors/phase4-commands'
import { relayTrace, INITIAL_RELAY, ARCHIVE_SEQUENCE } from '../src/game/floors/puzzles'
import { phase4Conversation } from '../src/game/floors/phase4-dialogue'
import { mobLoot } from '../src/game/floors/content'
import { FloorCampaignStore, type ExclusiveLock } from '../src/game/floors/store'
let serial=0
function apply(s:Campaign,a:Phase4Action){const id='case-'+(++serial),c=phase4Command(s,a,id);assert.ok(c.ok);if(!c.ok)throw Error(c.message);const result=applyOutcome(s,c.outcome,{id,kind:c.outcome.event});assert.ok(result.ok);if(!result.ok)throw Error(result.message);return result.state}
function base(){const s=freshCampaign('phase4','expedition');s.location.stage='f01.stage.undergrid';s.quests.q02='claimed';s.quests.q03='available';return s}
const reload=(s:Campaign):Campaign=>{const next:unknown=JSON.parse(JSON.stringify(s));assert.ok(validCampaign(next));return next}
test('relay persists rotations and accepts a connected symmetric straight without duplicating its key',()=>{
 let s=base();assert.equal(relayTrace(INITIAL_RELAY).solved,false)
 const initial=JSON.stringify(s);assert.equal(phase4Command(s,{kind:'relay-check'},'wrong').ok,false);assert.equal(JSON.stringify(s),initial)
 for(const i of [1,2,3,4,5])for(let n=0;n<(4-INITIAL_RELAY[i])%4;n++)s=apply(s,{kind:'relay-rotate',index:i})
 assert.equal(relayTrace(reload(s).puzzles!.relay).solved,true)
 // A straight WE tile also connects at 180 degrees.
 s=apply(s,{kind:'relay-rotate',index:3});s=apply(s,{kind:'relay-rotate',index:3});assert.equal(relayTrace(s.puzzles!.relay).solved,true)
 s=apply(s,{kind:'relay-check'});assert.equal(s.inventory['f01.key.relay'],1)
 s=apply(reload(s),{kind:'relay-check'});assert.equal(s.inventory['f01.key.relay'],1)
})
test('archive wrong input resets only entry; both policies retain header and private knowledge boundaries',()=>{
 for(const policy of ['redacted','erased'] as const){let s=base();s.location.stage='f01.stage.skybridge'
  s=apply(s,{kind:'archive-symbol',symbol:0});s=apply(s,{kind:'archive-symbol',symbol:2});assert.deepEqual(s.puzzles?.archive,[]);assert.equal(s.scrip,0)
  for(const symbol of ARCHIVE_SEQUENCE)s=apply(reload(s),{kind:'archive-symbol',symbol})
  assert.equal(s.inventory['f01.key.fragment'],1);assert.equal(s.facts['invoice-found'],true)
  s.location.stage='f01.stage.arrival';s=apply(s,{kind:'accept-q03'});s=apply(s,{kind:'archive-policy',policy});s=reload(s)
  assert.equal(s.inventory['f01.key.fragment'],0);assert.equal(s.scrip,45);assert.equal(s.facts['header-retained'],true);assert.equal(s.facts['private-routes-available'],false)
  assert.equal(s.facts['redacted-archive-available'],policy==='redacted');assert.deepEqual(s.knowledge.eko,['archive']);assert.deepEqual(s.knowledge.mara,[])
  assert.equal(phase4Command(s,{kind:'archive-policy',policy},'again').ok,false)
 }
})
test('invoice has exclusive rewards, correct witness channels and personal versus faction effects',()=>{
 for(const policy of ['protected','published'] as const){let s=base();s.location.stage='f01.stage.market';s.quests.q03='claimed';s.facts['invoice-found']=true
  s=apply(s,{kind:'accept-q08'});s=apply(s,{kind:'invoice-policy',policy});s=reload(s)
  assert.equal(s.scrip,40);assert.equal(s.relationships.ivo,policy==='protected'?10:-10);assert.equal(s.factions.exchange,policy==='protected'?6:-6)
  assert.equal(s.knowledge.mara.includes('invoice'),policy==='published');assert.equal(phase4Command(s,{kind:'invoice-policy',policy:policy==='protected'?'published':'protected'},'other').ok,false)
 }
})
test('decline, later accept, registered sale and reconciliation retain history without a second quest reward',()=>{
 let s=base();s.location.stage='f01.stage.skybridge';s=apply(s,{kind:'decline-promise'});s=apply(reload(s),{kind:'accept-promise'});assert.equal(s.inventory['f01.item.keepsake'],1)
 s.location.stage='f01.stage.market';s=apply(s,{kind:'sell-promise'});assert.equal(s.scrip,40);assert.equal(s.relationships.nyx,-20);assert.equal(s.facts['promise-declined'],true)
 assert.equal(phase4Command(s,{kind:'deliver-promise'},'wrong').ok,false)
 const callback=phase4Conversation(reload(s),'nyx');assert.equal(callback?.id,'N03.sold')
 s.scrip=0;assert.equal(phase4Command(s,{kind:'replacement',payment:'scrip'},'poor').ok,false)
 s.inventory['f01.mat.wire']=3;s=apply(s,{kind:'replacement',payment:'wire'});s.location.stage='f01.stage.skybridge';s=apply(s,{kind:'reconcile-promise'});s=reload(s)
 assert.equal(s.decisions.promise,'reconciled');assert.equal(s.facts['promise-sold'],true);assert.equal(s.inventory['f01.item.replacement'],0);assert.equal(s.relationships.nyx,-12);assert.equal(s.scrip,0);assert.equal(phase4Conversation(s,'nyx')?.id,'N04.reconciled')
})
test('Mara delivery excludes sale and resources/normal loot respect their explicit scopes',()=>{
 let s=base();s.location.stage='f01.stage.skybridge';s=apply(s,{kind:'accept-promise'});s.location.stage='f01.stage.arrival';s=apply(s,{kind:'deliver-promise'});assert.equal(s.scrip,30)
 s.location.stage='f01.stage.market';assert.equal(phase4Command(s,{kind:'sell-promise'},'sold').ok,false)
 s.location.stage='f01.stage.undergrid';s=apply(s,{kind:'collect',node:'coolant-reservoir'});s=apply(reload(s),{kind:'collect',node:'coolant-reservoir'});assert.equal(s.inventory['f01.mat.coolant'],3)
 const loot=mobLoot('pump-wisp',s.expedition.id);assert.deepEqual(loot,mobLoot('pump-wisp',s.expedition.id))
 assert.equal(phase4Command(s,{kind:'mob-loot',spawn:'pump-wisp',defeated:false},'alive').ok,false)
 s=apply(s,{kind:'mob-loot',spawn:'pump-wisp',defeated:true});const paid=s.scrip;s=apply(reload(s),{kind:'mob-loot',spawn:'pump-wisp',defeated:true});assert.equal(s.scrip,paid)
})
test('contact IDs deduplicate, insulation is consumed on confirmed environmental contact, and safe recovery preserves inventory',async()=>{
 let s=base();s.vitals={hp:15,maxHp:100,insulation:2};s=apply(s,{kind:'incoming',source:'vent',contact:'contact-one'});assert.equal(s.vitals?.hp,10);assert.equal(s.vitals?.insulation,1)
 s=apply(reload(s),{kind:'incoming',source:'vent',contact:'contact-one'});assert.equal(s.vitals?.hp,10);assert.equal(s.vitals?.insulation,1)
 s=apply(s,{kind:'incoming',source:'prism-mark',contact:'contact-two'});assert.equal(s.vitals?.hp,0)
 s.inventory['f01.mat.wire']=5;s.scrip=42
 const rows=new Map<string,string>(),storage={getItem:(key:string)=>rows.get(key)??null,setItem:(key:string,value:string)=>{rows.set(key,value)}},lock:ExclusiveLock=async(_name,task)=>task(),store=new FloorCampaignStore('phase4',storage,lock)
 storage.setItem(store.key,JSON.stringify(s));const recovered=await store.recover(s.revision);assert.ok(recovered.ok)
 if(recovered.ok){assert.equal(recovered.state.location.stage,'f01.stage.arrival');assert.equal(recovered.state.vitals?.hp,100);assert.equal(recovered.state.scrip,42);assert.equal(recovered.state.inventory['f01.mat.wire'],5)}
})
