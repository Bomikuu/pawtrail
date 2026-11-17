/** Authored Phase 6 cases. Execution remains deferred under workspace instructions. */
import test from 'node:test'
import assert from 'node:assert/strict'
import { freshCampaign,validCampaign,applyOutcome,type Campaign } from '../src/game/floors/state'
import { phase6Command,type Phase6Action } from '../src/game/floors/phase6-commands'
import { GOVERNANCE,RECIPES,KOI_ROUTE,KOI_TIMING,fixtures,type Governance } from '../src/game/floors/phase6-content'
import { FloorCampaignStore,type ExclusiveLock } from '../src/game/floors/store'
import { FloorSession } from '../src/game/floors/session'
import { floorConversation } from '../src/game/floors/dialogue'
import { buyingPrice,reputationChanges } from '../src/game/floors/commands'
let serial=0
function base(){const s=freshCampaign('phase6','expedition');s.location.stage='f01.stage.arrival';s.quests.q02='claimed';s.quests.q03='claimed';s.quests.q05='claimed';s.quests.q06='available';s.inventory['f01.key.core']=1;return s}
function apply(s:Campaign,a:Phase6Action,now=1_800_000_000_000){const id='p6-'+(++serial),c=phase6Command(s,a,id,now);assert.ok(c.ok);if(!c.ok)throw Error(c.message);const r=applyOutcome(s,c.outcome,{id,kind:c.outcome.event});assert.ok(r.ok);if(!r.ok)throw Error(r.message);return r.state}
function reload(s:Campaign):Campaign{const x:unknown=JSON.parse(JSON.stringify(s));assert.ok(validCampaign(x));return x}
function storage(s:Campaign){let raw=JSON.stringify(s),fail=false;const lock:ExclusiveLock=async(_name,task)=>task(),port={getItem:()=>raw,setItem:(_key:string,value:string)=>{if(fail)throw Error('quota');raw=value}},store=new FloorCampaignStore('phase6',port,lock);return{store,fail:(v:boolean)=>fail=v,read:()=>raw}}
function ending(choice:Governance){let s=apply(base(),{kind:'accept-q06'});return apply(s,{kind:'governance',choice})}
test('each governance branch consumes exactly one Core, applies its table and shares only its public knowledge',()=>{
 for(const choice of ['community','warden','exchange'] as const){let s=base();s.decisions.archive='erased';s.knowledge.eko=['archive'];s=apply(s,{kind:'accept-q06'});const without=structuredClone(s);without.inventory['f01.key.core']=0;const before=JSON.stringify(without);assert.equal(phase6Command(without,{kind:'governance',choice},'missing').ok,false);assert.equal(JSON.stringify(without),before)
  s=reload(apply(s,{kind:'governance',choice}));assert.equal(s.inventory['f01.key.core'],0);assert.equal(s.scrip,80);assert.equal(s.quests.q06,'claimed');assert.equal(s.quests.q11,'available');assert.equal(s.facts['floor-cleared'],true)
  for(const [npc,n]of Object.entries(GOVERNANCE[choice].npc))assert.equal(s.relationships[npc as keyof Campaign['relationships']],n)
  for(const [faction,n]of Object.entries(GOVERNANCE[choice].faction))assert.equal(s.factions[faction as keyof Campaign['factions']],n)
  for(const npc of ['mara','ivo','nyx','sena'] as const){assert.ok(s.knowledge[npc].includes('governance'));assert.equal(s.knowledge[npc].includes('archive'),false)}
  assert.equal(phase6Command(s,{kind:'governance',choice:choice==='community'?'warden':'community'},'second').ok,false)
 }
})
test('reputation feedback uses the applied clamped delta; Exchange prices round upward and cap combined discounts',()=>{
 let s=apply(base(),{kind:'accept-q06'});s.relationships.mara=99;const after=apply(s,{kind:'governance',choice:'community'});assert.equal(after.relationships.mara,100);assert.ok(reputationChanges(s,after).includes('mara: +1 trust'))
 s=ending('exchange');s.relationships.ivo=10;assert.equal(buyingPrice(s,12),10);assert.equal(buyingPrice(s,3),3);s.relationships.ivo=-10;assert.equal(buyingPrice(s,12),12);s.decisions.governance='community';assert.equal(buyingPrice(s,12),14)
})
test('supplies and maintenance are expedition scoped; fresh expeditions keep the ending, unlocks and furnished camp',async()=>{
 for(const choice of ['community','warden'] as const){let s=ending(choice);s.location.stage=choice==='community'?'f01.stage.arrival':'f01.stage.switchyard';s=apply(s,{kind:'claim-perk'});s=apply(reload(s),{kind:'claim-perk'});assert.equal(s.inventory[choice==='community'?'f01.item.med-patch':'f01.item.insulator'],1)
  s.location.stage='f01.stage.switchyard';s.inventory['f01.mat.scrap']=4;s.inventory['f01.mat.coolant']=2;const rep=JSON.stringify([s.relationships,s.factions]);s=apply(s,{kind:'accept-q11'});s=apply(s,{kind:'claim-q11'});assert.equal(s.scrip,92);assert.equal(JSON.stringify([s.relationships,s.factions]),rep);assert.equal(phase6Command(s,{kind:'claim-q11'},'again').ok,false)
  s.location.stage='hub.concourse';s.fixtures={bench:{rotation:90,lit:true}};const env=storage(s),r=await env.store.newExpedition('next-expedition',s.revision);assert.ok(r.ok);if(!r.ok)continue;assert.equal(r.state.quests.q11,'available');assert.equal(r.state.decisions.governance,choice);assert.equal(r.state.fixtures?.bench?.rotation,90);assert.equal(r.state.scrip,92)
  const next=r.state;next.location.stage=choice==='community'?'f01.stage.arrival':'f01.stage.switchyard';const supplied=apply(next,{kind:'claim-perk'});assert.equal(supplied.inventory[choice==='community'?'f01.item.med-patch':'f01.item.insulator'],2)
 }
})
test('paid awning repair precedes Mara report and does not consume materials or award twice',()=>{
 let s=apply(base(),{kind:'accept-q07'});s.location.stage='f01.stage.market';const before=JSON.stringify(s);assert.equal(phase6Command(s,{kind:'repair-awning'},'poor').ok,false);assert.equal(JSON.stringify(s),before)
 s.inventory['f01.mat.fiber']=3;s.inventory['f01.mat.scrap']=2;s=apply(s,{kind:'repair-awning'});assert.equal(s.scrip,0);assert.equal(s.inventory['f01.mat.fiber'],0);assert.equal(s.quests.q07,'completed');assert.equal(phase6Command(s,{kind:'repair-awning'},'again').ok,false)
 s.location.stage='f01.stage.arrival';s=apply(reload(s),{kind:'claim-q07'});assert.equal(s.scrip,30);assert.equal(s.relationships.mara,3);assert.equal(s.factions.residents,4);assert.equal(phase6Command(s,{kind:'claim-q07'},'again').ok,false)
})
test('normal Koi beats reject early/wrong inputs; normal and assisted success earn the identical once-only report',()=>{
 for(const mode of ['normal','assisted'] as const){let s=apply(base(),{kind:'accept-q10'});s=apply(s,{kind:'koi-start',mode});const start=s.activities!.koi!.start
  if(mode==='normal'){const old=s.activities!.koi!.id;s=apply(s,{kind:'koi-input',direction:'left',attempt:old},start+1);assert.equal(s.activities?.koi,null);assert.equal(s.activities?.koiSolved,false);s=apply(s,{kind:'koi-start',mode});assert.equal(phase6Command(s,{kind:'koi-input',direction:'left',attempt:old},'stale',start+3900).ok,false)}
  const attempt=s.activities!.koi!;for(let i=0;i<4;i++)s=apply(reload(s),{kind:'koi-input',direction:KOI_ROUTE[i],attempt:attempt.id},attempt.start+KOI_TIMING.answerDelay+i*KOI_TIMING.answerBeat+KOI_TIMING.answerBeat/2)
  assert.equal(s.activities?.koiSolved,true);assert.equal(s.quests.q10,'completed');assert.equal(s.scrip,0);s=apply(reload(s),{kind:'claim-q10'});assert.equal(s.scrip,20);assert.equal(s.relationships.eko,3);assert.equal(s.quests.q10,'claimed');assert.equal(phase6Command(s,{kind:'claim-q10'},'again').ok,false)
 }
 let s=apply(base(),{kind:'accept-q10'});s=apply(s,{kind:'koi-start',mode:'assisted'});s=apply(s,{kind:'koi-input',direction:'down',attempt:s.activities!.koi!.id});assert.equal(s.activities?.koi,null);assert.equal(s.scrip,0)
})
test('all four recipes spend exact inputs once per request; locks, shortages and failed storage grant nothing',async()=>{
 for(const recipe of ['med','insulator','koi','bench'] as const){let s=base();s.location.stage='f01.stage.market';const action={kind:'craft',recipe,request:'craft-'+recipe} as const
  if(recipe==='koi'||recipe==='bench')assert.equal(phase6Command(s,action,'locked').ok,false)
  s.quests.q10='claimed';s.facts['floor-cleared']=true
  for(const [item,n]of Object.entries(RECIPES[recipe].inputs))s.inventory[item as keyof Campaign['inventory']]=n!*2
  const env=storage(s),command=phase6Command(s,action,'quote');assert.ok(command.ok);if(!command.ok)continue;env.fail(true);assert.equal((await env.store.commit(command.outcome,{id:'quote',kind:command.outcome.event},s.revision)).ok,false);assert.deepEqual(env.store.load(),{ok:true,state:s});env.fail(false)
  s=apply(s,action);s=apply(reload(s),action);assert.equal(s.inventory[RECIPES[recipe].item],1)
  for(const [item,n]of Object.entries(RECIPES[recipe].inputs))assert.equal(s.inventory[item as keyof Campaign['inventory']],n)
 }
})
test('furnishing preparation and storage failures preserve the item; deploy/rotate/reclaim save real ownership',async()=>{
 const s=base();s.location.stage='hub.concourse';s.inventory['f01.item.bastion-bench']=1;const env=storage(s),session=new FloorSession(env.store);session.refresh();const before=env.read(),action={kind:'fixture-deploy',item:'bench',request:'deploy'} as const
 assert.equal(await session.performPrepared(action,async()=>{throw Error('asset load failed')},new AbortController().signal),null);assert.equal(env.read(),before)
 let disposed=0,activated=0;env.fail(true);assert.equal(await session.performPrepared(action,async()=>({dispose:()=>{disposed++},activate:()=>{activated++}}),new AbortController().signal),null);assert.equal(disposed,1);assert.equal(activated,0);assert.equal(env.read(),before);env.fail(false)
 const result=await session.performPrepared(action,async()=>({dispose:()=>{disposed++},activate:()=>{activated++}}),new AbortController().signal);assert.ok(result);if(!result)return;assert.equal(activated,1);assert.equal(result.inventory['f01.item.bastion-bench'],0);assert.equal(fixtures(result).bench?.rotation,0)
 let next=apply(reload(result),{kind:'fixture-rotate',item:'bench',from:0});assert.equal(next.fixtures?.bench?.rotation,90);assert.equal(phase6Command(next,{kind:'fixture-rotate',item:'bench',from:0},'stale').ok,false);next=apply(next,{kind:'fixture-reclaim',item:'bench',request:'reclaim'});assert.equal(next.inventory['f01.item.bastion-bench'],1);assert.equal(next.fixtures?.bench,undefined)
})
test('public ending callbacks reach five contacts while private history and betrayal remain distinct after reload',()=>{
 let s=ending('community');s.decisions.archive='erased';s.decisions.invoice='protected';s.decisions.promise='reconciled';s.facts['promise-sold']=true;s.knowledge.eko.push('archive');s.knowledge.ivo.push('invoice');s.knowledge.nyx.push('promise');s.relationships.nyx=50;s.met=['mara','ivo','eko','nyx','sena']
 for(const npc of s.met){const memory=floorConversation(reload(s),npc,'governance');assert.ok(memory.text.length>20);assert.equal(memory.acknowledge,false);assert.ok(memory.choices.some(c=>c.history==='governance'));assert.equal(memory.choices.some(c=>c.history==='archive'),npc==='eko');assert.equal(memory.choices.some(c=>c.history==='invoice'),npc==='ivo')}
 assert.ok(floorConversation(s,'nyx','promise').text.includes('doesn’t erase'));s.decisions.promise='sold';assert.equal(floorConversation(s,'nyx').choices.some(c=>c.id==='N.tip'),false);assert.equal(s.facts['promise-sold'],true)
})
test('legacy optional fields default safely and malformed puzzle prefixes/facings are rejected without migration',()=>{
 const s=base();assert.ok(validCampaign(s));const bad=structuredClone(s) as Campaign;bad.activities={awning:false,koiSolved:false,koi:{id:'attempt',mode:'normal',start:1,entered:['right']},koiMessage:''};assert.equal(validCampaign(bad),false);delete bad.activities;bad.fixtures={bench:{rotation:45 as 90,lit:true}};assert.equal(validCampaign(bad),false)
})
