import test from 'node:test'
import assert from 'node:assert/strict'
import { freshCampaign, applyOutcome, validCampaign, type Campaign } from '../src/game/floors/state'
import { allocationPreview, firstLoopCommand, shopQuote, buyingPrice, type FirstLoopAction } from '../src/game/floors/commands'
import { floorConversation } from '../src/game/floors/dialogue'
import { FloorCampaignStore, type ExclusiveLock } from '../src/game/floors/store'
import { FloorSession } from '../src/game/floors/session'
import { INSTALLED_STAGES } from '../src/game/floors/stages'

function action(state:Campaign,request:FirstLoopAction,id:string){
  const prepared=firstLoopCommand(state,request,id);assert.ok(prepared.ok)
  if(!prepared.ok)throw Error(prepared.message)
  const result=applyOutcome(state,prepared.outcome,{id:'accepted:'+id,kind:prepared.outcome.event});assert.ok(result.ok)
  if(!result.ok)throw Error(result.message)
  return result.state
}
function bearings(){
  let state=freshCampaign('member','expedition');state.location.stage='f01.stage.arrival';state.scrip=30
  for(const kind of ['meet-mara','accept-q01','checkpoint','route','claim-q01','accept-q02'] as const)state=action(state,{kind},kind)
  state.location.stage='f01.stage.market';state=action(state,{kind:'cell'},'cell');return state
}
class Storage{
  values=new Map<string,string>();fail=false
  getItem(key:string){return this.values.get(key)??null}
  setItem(key:string,value:string){if(this.fail)throw Error('Quota');this.values.set(key,value)}
}
function locking():ExclusiveLock{
  let queue=Promise.resolve()
  return async(_name,task)=>{const old=queue;let release!:()=>void;queue=new Promise<void>(resolve=>{release=resolve});await old;try{return await task()}finally{release()}}
}

test('both first-loop branches spend one Cell, claim once and retain distinct public memory',()=>{
  for(const service of ['clinic','transit'] as const){
    let state=bearings();assert.equal(state.scrip,45);assert.equal(state.location.checkpoint,'f01.landing')
    state=action(state,{kind:'allocate',controller:true,clinic:service==='clinic',transit:service==='transit',service},'allocate')
    assert.equal(state.inventory['f01.key.cell'],0);assert.equal(state.relationships.mara,service==='clinic'?8:-3)
    assert.ok(state.knowledge.ivo.includes('allocation'))
    assert.ok(!state.knowledge.mara.includes('invoice'))
    state.location.stage='f01.stage.arrival';state=action(state,{kind:'claim-q02'},'report')
    const reloaded:Campaign=JSON.parse(JSON.stringify(state));assert.equal(validCampaign(reloaded),true)
    assert.equal(reloaded.scrip,80);assert.equal(reloaded.quests.q02,'claimed')
    assert.equal(action(reloaded,{kind:'claim-q02'},'repeated').scrip,80)
    const reply=floorConversation(reloaded,'mara');assert.equal(reply.id,'reply:F01.Q02.CLAIM')
    reloaded.seen.push(reply.id);assert.equal(floorConversation(reloaded,'mara').id,'reply:F01.Q01.CLAIM','older undelivered replies are retained')
  }
})

test('allocation overload, missing safety and cancelled preview do not mutate inventory or decisions',()=>{
  const state=bearings(),before=JSON.stringify(state)
  assert.equal(allocationPreview(true,true,true).load,10)
  assert.equal(allocationPreview(true,true,true).valid,false)
  assert.equal(allocationPreview(false,true,false).valid,false)
  assert.equal(firstLoopCommand(state,{kind:'allocate',controller:true,clinic:true,transit:true,service:'clinic'},'bad').ok,false)
  allocationPreview(true,true,false)
  assert.equal(JSON.stringify(state),before)
})

test('finite stock, pricing and duplicate quotes survive reload without a second purchase',()=>{
  let state=bearings(),quote=shopQuote(state,'f01.mat.scrap')
  state=action(state,{kind:'buy',item:quote.item,slot:quote.slot!,price:quote.price},'buy')
  const after=structuredClone(state)
  state=action(state,{kind:'buy',item:quote.item,slot:quote.slot!,price:quote.price},'buy-again')
  assert.equal(state.scrip,after.scrip);assert.equal(state.inventory[quote.item],1)
  assert.equal(shopQuote(JSON.parse(JSON.stringify(state)),quote.item).remaining,5)
  state.relationships.ivo=10;assert.equal(buyingPrice(state,12),11)
  state.decisions.governance='exchange';assert.equal(buyingPrice(state,12),10)
  state.relationships.ivo=-10;assert.equal(buyingPrice(state,12),12)
  state.scrip=0;quote=shopQuote(state,'f01.item.med-patch')
  assert.equal(firstLoopCommand(state,{kind:'buy',item:quote.item,slot:quote.slot!,price:quote.price},'unpaid').ok,false)
})

test('competing stores accept only one last-stock purchase and failed persistence grants nothing',async()=>{
  const storage=new Storage(),lock=locking(),a=new FloorCampaignStore('member',storage,lock),b=new FloorCampaignStore('member',storage,lock)
  let state=bearings();state.scrip=200
  for(let slot=1;slot<=2;slot++)state=action(state,{kind:'buy',item:'f01.item.med-patch',slot,price:12},'prior-'+slot)
  storage.setItem(a.key,JSON.stringify(state))
  const prepared=firstLoopCommand(state,{kind:'buy',item:'f01.item.med-patch',slot:3,price:12},'last');if(!prepared.ok)throw Error(prepared.message)
  const results=await Promise.all([a.commit(prepared.outcome,{id:'one',kind:'purchase'},state.revision),b.commit(prepared.outcome,{id:'two',kind:'purchase'},state.revision)])
  assert.equal(results.filter(r=>r.ok&&r.status==='applied').length,1)
  assert.equal(results.filter(r=>!r.ok&&r.status==='conflict').length,1)
  const saved=a.load();if(!saved.ok)throw Error(saved.message)
  assert.equal(saved.state.inventory['f01.item.med-patch'],3)
  const raw=storage.getItem(a.key);storage.fail=true
  const next=firstLoopCommand(saved.state,{kind:'buy',item:'f01.mat.wire',slot:1,price:6},'fail');if(!next.ok)throw Error(next.message)
  assert.equal((await a.commit(next.outcome,{id:'failed',kind:'purchase'},saved.state.revision)).ok,false)
  assert.equal(storage.getItem(a.key),raw)
})

test('travel preloading failure preserves origin and a committed entry grants starter SC once',async()=>{
  const storage=new Storage(),store=new FloorCampaignStore('member',storage,locking()),session=new FloorSession(store)
  await session.begin()
  assert.equal(await session.travel('f01.stage.arrival',async()=>{throw Error('Missing ground')},new AbortController().signal),false)
  assert.equal(session.getSnapshot().campaign?.location.stage,'hub.concourse');assert.equal(session.getSnapshot().campaign?.scrip,0)
  let activated=0
  const prepare=async()=>({activate:()=>{activated++},dispose:()=>{}})
  assert.equal(await session.travel('f01.stage.arrival',prepare,new AbortController().signal),true)
  assert.equal(activated,1);assert.equal(session.getSnapshot().campaign?.scrip,30)
  await session.travel('hub.concourse',prepare,new AbortController().signal)
  await session.travel('f01.stage.arrival',prepare,new AbortController().signal)
  assert.equal(session.getSnapshot().campaign?.scrip,30)
})

test('fresh expeditions restock basic goods while keeping choices and claims; legacy vitals are optional',async()=>{
  const storage=new Storage(),store=new FloorCampaignStore('member',storage,locking())
  let state=bearings();state=action(state,{kind:'buy',item:'f01.mat.wire',slot:1,price:6},'wire');state.location.stage='hub.concourse'
  delete state.vitals;assert.equal(validCampaign(state),true)
  storage.setItem(store.key,JSON.stringify(state))
  const result=await store.newExpedition('another-expedition',state.revision);assert.ok(result.ok)
  if(!result.ok)return
  assert.equal(shopQuote(result.state,'f01.mat.wire').remaining,4)
  assert.equal(result.state.inventory['f01.mat.wire'],1);assert.equal(result.state.quests.q01,'claimed')
  assert.equal((await store.travel('f01.stage.undergrid',result.state.revision,INSTALLED_STAGES)).ok,false)
})
