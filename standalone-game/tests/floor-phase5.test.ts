/** Focused Phase 5 coverage authored with runtime verification deferred. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { freshCampaign,applyOutcome,validCampaign,type Campaign } from '../src/game/floors/state'
import { phase5Command,type Phase5Action } from '../src/game/floors/phase5-commands'
import { planTravel } from '../src/game/floors/travel'
import { FloorCampaignStore,type ExclusiveLock } from '../src/game/floors/store'
import { acceptFloorVictory,type VictoryProof } from '../src/game/floors/encounter-proof'
import { FamilyEncounter } from '../src/game/monsters/family-encounter'
import { familyMember } from '../src/game/monsters/family-catalog'
import { RobotEncounter } from '../src/game/monsters/robot-encounter'
import { phase5Conversation } from '../src/game/floors/phase5-dialogue'
let serial=0
function apply(s:Campaign,a:Phase5Action){const id='phase5-'+(++serial),c=phase5Command(s,a,id);assert.ok(c.ok);if(!c.ok)throw Error(c.message);const r=applyOutcome(s,c.outcome,{id,kind:c.outcome.event});assert.ok(r.ok);if(!r.ok)throw Error(r.message);return r.state}
function yard(){const s=freshCampaign('phase5','expedition');s.location.stage='f01.stage.switchyard';s.quests.q03='claimed';s.facts['header-retained']=true;s.facts['p02-solved']=true;s.inventory['f01.key.relay']=1;return s}
const installed=new Set<Campaign['location']['stage']>(['f01.stage.market','f01.stage.skybridge','f01.stage.switchyard','f01.stage.bastion'])
function reload(s:Campaign):Campaign{const v:unknown=JSON.parse(JSON.stringify(s));assert.ok(validCampaign(v));return v}
function storage(s:Campaign){let raw=JSON.stringify(s),fail=false;const lock:ExclusiveLock=async(_name,task)=>task(),port={getItem:()=>raw,setItem:(_key:string,value:string)=>{if(fail)throw Error('quota');raw=value}},store=new FloorCampaignStore('phase5',port,lock);return{store,write:(value:Campaign)=>raw=JSON.stringify(value),fail:(value:boolean)=>fail=value}}
function marshalProof(expedition='expedition'){
 let proof:VictoryProof|null=null
 const e=new FamilyEncounter(familyMember('iron-marshal')!.creature,event=>{if(event.kind==='defeat'&&event.target==='boss')proof=acceptFloorVictory('marshal',e,'marshal-victory',expedition)})
 assert.equal(acceptFloorVictory('marshal',e,'alive',expedition),null);e.start();e.advance(40,{x:0,z:3});e.hit('actual-contact',e.hp*2);assert.ok(proof);return proof!
}
test('missing authorization consumes nothing; both keys atomically unlock routes once without leaking private archive policy',()=>{
 let s=yard();s=apply(s,{kind:'meet-sena'});s=apply(s,{kind:'accept-q04'});const before=JSON.stringify(s)
 assert.equal(phase5Command(s,{kind:'authorize-gate'},'missing').ok,false);assert.equal(JSON.stringify(s),before)
 assert.equal(planTravel(s,'f01.stage.market',installed).ok,false);assert.equal(planTravel(s,'f01.stage.bastion',installed).ok,false)
 s.inventory['f01.key.writ']=1;s=apply(s,{kind:'authorize-gate'});assert.equal(s.inventory['f01.key.relay'],0);assert.equal(s.inventory['f01.key.writ'],0);assert.equal(s.scrip,60);assert.equal(s.relationships.sena,5);assert.equal(s.factions.wardens,4);assert.deepEqual(s.knowledge.sena,['gate'])
 s=reload(s);assert.equal(planTravel(s,'f01.stage.market',installed).ok,true);assert.equal(planTravel(s,'f01.stage.bastion',installed).ok,false);assert.equal(phase5Command(s,{kind:'authorize-gate'},'again').ok,false)
 s=apply(s,{kind:'accept-q05'});assert.equal(planTravel(s,'f01.stage.bastion',installed).ok,true)
})
test('real Marshal victory survives claim failure/reload and pays first and rematch bundles with no repeated unique key',async()=>{
 const env=storage(yard()),s=env.store.load();assert.ok(s.ok);if(!s.ok)return
 const fake={kind:'marshal',id:'fake',expedition:'expedition',accepted:true} as const
 assert.equal((await env.store.recordVictory(fake,s.state.revision)).ok,false)
 const recorded=await env.store.recordVictory(marshalProof(),s.state.revision);assert.ok(recorded.ok);if(!recorded.ok)return
 assert.equal(recorded.state.scrip,0);assert.equal(planTravel(recorded.state,'f01.stage.skybridge',installed).ok,false)
 const c=phase5Command(recorded.state,{kind:'claim-encounter'},'claim');assert.ok(c.ok);if(!c.ok)return
 env.fail(true);assert.equal((await env.store.commit(c.outcome,{id:'claim',kind:'combat'},recorded.state.revision)).ok,false);env.fail(false)
 const pending=env.store.load();assert.ok(pending.ok);if(!pending.ok)return;assert.equal(pending.state.encounters?.pending?.kind,'marshal')
 let claimed=apply(reload(pending.state),{kind:'claim-encounter'});assert.equal(claimed.scrip,35);assert.equal(claimed.inventory['f01.key.writ'],1);assert.equal(claimed.inventory['f01.mat.alloy'],2);assert.equal(claimed.inventory['f01.mat.coolant'],2);assert.equal(claimed.encounters?.pending,null)
 assert.equal(phase5Command(claimed,{kind:'claim-encounter'},'duplicate').ok,false)
 claimed.expedition={id:'expedition-2',receipts:{}};claimed.encounters!.pending={kind:'marshal',id:'rematch',expedition:'expedition-2'};claimed=apply(claimed,{kind:'claim-encounter'});assert.equal(claimed.scrip,60);assert.equal(claimed.inventory['f01.key.writ'],1)
})
test('Kurogane cannot issue victory while shielded; actual funnel and body defeat issues a claim with exclusive bonus and retained Core',()=>{
 const e=new RobotEncounter(()=>{});e.start();e.advance(40,{x:0,z:3});assert.equal(e.hit('shielded-body',99999,'kurogane-neon-bastion:body'),'blocked');assert.equal(e.hp,8400)
 for(const c of e.components())assert.equal(e.hit('funnel-'+c.id,360,c.id),true)
 assert.equal(e.shielded,false);assert.equal(e.hit('body-clear',99999,'kurogane-neon-bastion:body'),true)
 const proof=acceptFloorVictory('bastion',e,'boss-clear','expedition');assert.ok(proof)
 let s=yard();s.location.stage='f01.stage.bastion';s.quests.q05='active';s.encounters={emblem:false,pending:{kind:'bastion',id:proof!.id,expedition:'expedition'}};s=apply(s,{kind:'claim-encounter'});s=reload(s)
 assert.equal(s.scrip,120);assert.equal(s.inventory['f01.key.core'],1);assert.equal(s.inventory['f01.mat.alloy'],4);assert.equal(s.encounters?.emblem,true)
 assert.equal([s.inventory['f01.mat.prism']===2,s.inventory['f01.mat.wire']===3,s.inventory['f01.mat.coolant']===3].filter(Boolean).length,1)
 s.location.stage='f01.stage.switchyard';s=apply(s,{kind:'report-boss'});assert.equal(s.scrip,120);assert.equal(s.quests.q05,'claimed');assert.equal(s.quests.q06,'available');assert.equal(s.inventory['f01.key.core'],1);assert.equal(s.relationships.sena,4);assert.equal(s.knowledge.mara.includes('victory'),true);assert.equal(phase5Command(s,{kind:'report-boss'},'duplicate').ok,false)
})
test('Dispatch supplies are expedition scoped; checkpoint recovery preserves the pack and story',async()=>{
 let s=apply(yard(),{kind:'dispatch-checkpoint'});s=apply(s,{kind:'dispatch-supplies'});s=apply(reload(s),{kind:'dispatch-supplies'});assert.equal(s.inventory['f01.mat.scrap'],4);assert.equal(s.inventory['f01.mat.fiber'],2)
 s.location.checkpoint='f01.landing';s=apply(s,{kind:'dispatch-checkpoint'});assert.equal(s.location.checkpoint,'f01.dispatch')
 s.vitals={hp:0,maxHp:100,insulation:0};s.location.stage='f01.stage.bastion';const env=storage(s),r=await env.store.recover(s.revision);assert.ok(r.ok);if(r.ok){assert.equal(r.state.location.stage,'f01.stage.switchyard');assert.equal(r.state.vitals?.hp,100);assert.equal(r.state.inventory['f01.mat.scrap'],4)}
})
test('incoming encounter contact accepts only the real stage pattern and clamped damage, then deduplicates',()=>{
 let s=yard();s=apply(s,{kind:'encounter-contact',attack:'riot-sweep',amount:23,contact:'contact-1'});assert.equal(s.vitals?.hp,77);s=apply(reload(s),{kind:'encounter-contact',attack:'riot-sweep',amount:23,contact:'contact-1'});assert.equal(s.vitals?.hp,77)
 assert.equal(phase5Command(s,{kind:'encounter-contact',attack:'neon-lockdown',amount:24,contact:'wrong-stage'},'wrong').ok,false);assert.equal(phase5Command(s,{kind:'encounter-contact',attack:'riot-sweep',amount:99,contact:'wrong-number'},'wrong').ok,false)
 s.vitals={hp:7,maxHp:100,insulation:0};s=apply(s,{kind:'encounter-contact',attack:'siege-lock',amount:7,contact:'fatal-contact'});assert.equal(s.vitals?.hp,0)
})
test('Sena reconciles early keys and private archive variants; a missing Writ recovery never repays combat loot',()=>{
 for(const archive of ['redacted','erased'] as const){let s=yard();s.decisions.archive=archive;s.inventory['f01.key.writ']=1;assert.equal(phase5Conversation(s,'sena')?.text.includes(archive),false);s=apply(s,{kind:'accept-q04'});s=apply(s,{kind:'authorize-gate'});assert.equal(s.facts['gate-authenticated'],true)}
 let s=yard();s.facts['marshal-first-clear']=true;s=apply(s,{kind:'recover-writ'});assert.equal(s.inventory['f01.key.writ'],1);assert.equal(s.scrip,0);assert.equal(phase5Command(s,{kind:'recover-writ'},'repeat').ok,false)
})
