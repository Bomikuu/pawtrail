import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { ArrowLeft, BookOpen, Compass, LoaderCircle, Minus, Package, Plus, RotateCw, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlayShell } from './shared/play-chrome'
import { TouchControls } from './touch-controls'
import { GameDialogue } from './dialogue'
import { FloorAdventurePanels, FloorQuestSummary, type AdventurePanel } from './floor-adventure-panels'
import { browserFloorStore } from '@/game/floors/store'
import { FloorSession, type PreparedFloor } from '@/game/floors/session'
import { floorConversation, type FloorChoice, type FloorConversation } from '@/game/floors/dialogue'
import { floorNpcs, type FloorNpcId } from '@/game/floors/npcs'
import { INSTALLED_STAGES, floorStage, preferredArrival, stageInteraction, stageNames, stageObjectStates, worldLabel } from '@/game/floors/stages'
import { vitals } from '@/game/floors/commands'
import type { FloorAction } from '@/game/floors/actions'
import { safeId, type Campaign, type StageId } from '@/game/floors/state'
import { playCharacterPresets, readPlayCharacter, type PlayCharacter } from '@/game/stage-editor/play-character-presets'
import { campSignature } from '@/game/floors/phase6-content'
import { isFixtureAction } from '@/game/floors/phase6-commands'
import type { FixtureHandle,FloorView, FloorCombatReport } from '@/game/floors/view'
import { recoveryStage } from '@/game/floors/checkpoints'
import { FloorCombatHud } from './floor-combat-hud'
import type { PlayInteractionPrompt } from '@/game/stage-editor/playtest'
import type { StageObject } from '@/game/stage-editor/data'
import type { DialogueChoice } from '@/game/types'

const meetings:Record<FloorNpcId,FloorAction>={mara:{kind:'meet-mara'},ivo:{kind:'meet-ivo'},eko:{kind:'meet-eko'},nyx:{kind:'meet-nyx'},sena:{kind:'meet-sena'}}
const EMPTY={campaign:null,status:'error' as const,busy:false,notice:'',error:''}
export default function FloorAdventure(){
  const query=new URLSearchParams(window.location.search),requestedSlot=query.get('slot')??'neon-local',slot=safeId(requestedSlot)?requestedSlot:'neon-local'
  const setup=useMemo(()=>{try{return{session:new FloorSession(browserFloorStore(slot)),error:''}}catch(error){return{session:null,error:error instanceof Error?error.message:'Local saves are unavailable.'}}},[slot])
  const session=setup.session
  const snapshot=useSyncExternalStore(session?.subscribe??(()=>()=>{}),session?.getSnapshot??(()=>EMPTY))
  const {campaign,status,busy,notice,error}=snapshot
  const [slotDraft,setSlotDraft]=useState(slot),[character,setCharacter]=useState<PlayCharacter>(()=>readPlayCharacter(query.get('actor')))
  const [sceneRevision,setSceneRevision]=useState(0)
  const [loading,setLoading]=useState(false),[sceneStage,setSceneStage]=useState<StageId|null>(null),[sceneError,setSceneError]=useState('')
  const [panel,setPanel]=useState<AdventurePanel|null>(null),[conversation,setConversation]=useState<FloorConversation|null>(null),[interaction,setInteraction]=useState<PlayInteractionPrompt|null>(null)
  const [combat,setCombat]=useState<FloorCombatReport|null>(null),[fixtureHandle,setFixtureHandle]=useState<FixtureHandle|null>(null)
  const host=useRef<HTMLDivElement>(null),engine=useRef<FloorView|null>(null),engineHost=useRef<HTMLDivElement|null>(null),pending=useRef<FloorView|null>(null),pendingHost=useRef<HTMLDivElement|null>(null)
  const engineStage=useRef<StageId|null>(null),engineExpedition=useRef<string|null>(null),engineCamp=useRef('')
  const abort=useRef<AbortController|null>(null),loadToken=useRef(0),alive=useRef(true),loadingRef=useRef(false),dialogueToken=useRef(0),delivered=useRef(new Set<string>())
  const campaignRef=useRef(campaign);campaignRef.current=campaign
  const worldDeath=useRef(()=>{});const events=useRef({object:(_stage:StageId,_object:StageObject)=>false,npc:(_npc:FloorNpcId)=>{}})
  const outOfSync=!!campaign&&!!sceneStage&&(campaign.location.stage!==sceneStage||campaign.expedition.id!==engineExpedition.current||campaign.location.stage==='hub.concourse'&&engineCamp.current!==campSignature(campaign))
  const paused=loading||busy||!!panel||!!conversation||outOfSync||!!campaign&&vitals(campaign).hp===0
  const closeConversation=()=>{dialogueToken.current++;setConversation(null)}
  const closePanels=()=>{setPanel(null);engine.current?.focus()}
  const openPanel=(value:AdventurePanel)=>{closeConversation();setPanel(value);session?.clearError()}

  const prepare=useCallback(async(stage:StageId,actor:PlayCharacter,from?:StageId,initial?:{x:number;y:number},candidateCampaign?:Campaign):Promise<PreparedFloor>=>{
    if(!host.current||!session)throw Error('The adventure workspace is unavailable.')
    if(!INSTALLED_STAGES.has(stage))throw Error('This saved district is not installed. Your save has been preserved.')
    const token=++loadToken.current,container=document.createElement('div');container.className='absolute inset-0 invisible';host.current.append(container);pendingHost.current=container
    let renderer:FloorView|null=null
    const dispose=()=>{renderer?.dispose();container.remove();if(pending.current===renderer)pending.current=null;if(pendingHost.current===container)pendingHost.current=null}
    try{
      const preparedState=candidateCampaign??session.getSnapshot().campaign!,preparedExpedition=preparedState.expedition.id
      if(stage==='f01.stage.bastion'){
        const {FloorArenaView}=await import('@/game/floors/arena-view')
        const signal=abort.current?.signal??new AbortController().signal
        renderer=await FloorArenaView.create(container,session,actor,value=>{if(engine.current===renderer)setCombat(value)},()=>worldDeath.current(),message=>{if(engine.current===renderer)setSceneError(message)},signal)
        pending.current=renderer
      }else{
        const [{StageCanvas},{FloorWorld},{trainingSword}]=await Promise.all([import('@/game/stage-editor/canvas'),import('@/game/floors/world'),import('@/game/items/sword-pilot')])
        if(!alive.current||token!==loadToken.current)throw Error('The stage load was cancelled.')
        const canvas=new StageCanvas(container,floorStage(stage,preparedState),{commit:()=>{},select:()=>{},handle:()=>{},status:()=>{},item:message=>{if(engine.current===renderer)session.notice(message)},interaction:value=>{if(engine.current===renderer)setInteraction(value)},npc:id=>events.current.npc(id),error:message=>{if(engine.current===renderer)setSceneError(message)}})
        renderer=canvas;pending.current=canvas;canvas.setSuspended(true)
        const world=await FloorWorld.create(stage,session,()=>worldDeath.current(),value=>{if(engine.current===renderer)setCombat(value)})
        canvas.setGameplay({fixtureHandle:value=>{if(engine.current===renderer)setFixtureHandle(previous=>JSON.stringify(previous)===JSON.stringify(value)?previous:value)},world,item:trainingSword(),initial:initial??preferredArrival(stage,from),options:{realTargets:true,movementBounds:world.bounds,dynamicSolids:world.solids,onAbilityEvents:world.ability,objectStates:stageObjectStates(preparedState),onObject:object=>events.current.object(stage,object),objectPrompt:object=>{const binding=stageInteraction(stage,object.id);return binding?{label:binding.label,button:binding.to?'Travel':binding.blocked?'Inspect gate':'Use',description:binding.blocked??'Press E to approach and interact.'}:null}},label:object=>campaignRef.current?worldLabel(stage,object,campaignRef.current):undefined})
        await canvas.preload();const entered=await canvas.enterPlay(actor)
        if(!entered||!canvas.playPosition)throw Error('The destination could not prepare a safe arrival.')
        if(candidateCampaign&&initial&&Math.hypot(canvas.playPosition.x-initial.x,canvas.playPosition.y-initial.y)>.5)throw Error('The furnishing would block your current position. Move clear and try again; your item was kept.')
      }
      if(!renderer||!alive.current||token!==loadToken.current)throw Error('The stage load was cancelled.')
      const next=renderer
      return{dispose,activate:()=>{
        const old=engine.current,oldHost=engineHost.current
        engine.current=next;engineHost.current=container;setCombat(null);engineStage.current=stage;engineExpedition.current=preparedExpedition;engineCamp.current=campSignature(preparedState);setFixtureHandle(null);pending.current=null;pendingHost.current=null;container.classList.remove('invisible');setSceneStage(stage);setSceneError('');setInteraction(null)
        old?.dispose();oldHost?.remove();next.setSuspended(true);setSceneRevision(value=>value+1)
      }}
    }catch(error){dispose();throw error}
  },[session])
  const resume=useCallback(async()=>{
    if(!session||loadingRef.current)return
    if(engine.current?.unrecordedVictory){session.error('Retry the held victory save before reloading this scene.');return}
    const loaded=session.refresh();if(!loaded.ok)return
    loadingRef.current=true;setLoading(true);setSceneError('');engine.current?.setSuspended(true)
    abort.current?.abort();abort.current=new AbortController()
    const signal=abort.current.signal
    try{const candidate=await prepare(loaded.state.location.stage,character,undefined,engineStage.current===loaded.state.location.stage?engine.current?.playPosition??undefined:undefined);if(signal.aborted){candidate.dispose();return}candidate.activate()}
    catch(error){if(!signal.aborted)setSceneError(error instanceof Error?error.message:'The saved stage could not load.')}
    finally{if(!signal.aborted){loadingRef.current=false;setLoading(false)}}
  },[session,character,prepare])
  useEffect(()=>{
    alive.current=true;session?.refresh()
    const storage=(event:StorageEvent)=>{if(event.key===session?.store.key)session.refresh()};window.addEventListener('storage',storage)
    return()=>{alive.current=false;loadToken.current++;abort.current?.abort();pending.current?.dispose();pendingHost.current?.remove();engine.current?.dispose();engine.current=null;engineHost.current?.remove();engineHost.current=null;pending.current=null;pendingHost.current=null;loadingRef.current=false;window.removeEventListener('storage',storage)}
  },[session])
  useEffect(()=>{if(status==='ready')void resume()},[status,resume])
  useEffect(()=>{engine.current?.setSuspended(paused);if(!paused)engine.current?.focus()},[paused,sceneStage,sceneRevision])
  useEffect(()=>{if(campaign){engine.current?.updateObjectStates(stageObjectStates(campaign));engine.current?.syncCampaign?.(campaign)}},[campaign])

  useEffect(()=>{const guard=(event:BeforeUnloadEvent)=>{if(engine.current?.unrecordedVictory){event.preventDefault();event.returnValue=''}};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard)},[])
  const talk=async(npc:FloorNpcId)=>{
    if(!session||!campaignRef.current||busy||loading)return
    const token=++dialogueToken.current;delivered.current.clear();setPanel(null);engine.current?.setSuspended(true)
    let state=campaignRef.current
    if(!state.met.includes(npc)){const met=await session.perform(meetings[npc]);if(!met){engine.current?.setSuspended(false);return}state=met}
    if(alive.current&&token===dialogueToken.current)setConversation(floorConversation(state,npc))
  }
  events.current={npc:id=>void talk(id),object:(stage,object)=>{
    if(stage!==campaignRef.current?.location.stage||paused)return false
    if(['mara','ivo','eko','nyx','sena'].includes(object.id)){void talk(object.id as FloorNpcId);return true}
    const binding=stageInteraction(stage,object.id);if(!binding)return false
    openPanel({kind:binding.panel,label:binding.label,to:binding.to,blocked:binding.blocked,node:binding.node});return true
  }}
  const perform=async(action:FloorAction)=>{
    if(!session)return null
    if(isFixtureAction(action)){
      const blocked=engine.current?.canChangeFixtures?.();if(blocked){session.error(blocked);return null}
      const current=engine.current;current?.setSuspended(true)
      abort.current?.abort();abort.current=new AbortController();const signal=abort.current.signal
      try{return await session.performPrepared(action,state=>prepare(state.location.stage,character,undefined,current?.playPosition??undefined,state),signal)}finally{if(engine.current===current){current?.setSuspended(paused);if(!paused)current?.focus()}}
    }
    return session.perform(action)
  }
  const choose=async(choice:FloorChoice)=>{
    if(choice.close){closeConversation();return}
    if(choice.pin){engine.current?.pinObject(choice.pin);session?.notice('Objective marked on the map. Walk to the highlighted terminal.');closeConversation();return}
    if(choice.history&&conversation&&campaignRef.current){delivered.current.clear();setConversation(floorConversation(campaignRef.current,conversation.npc,choice.history));return}
    if(choice.panel&&!choice.command){openPanel({kind:choice.panel,label:choice.panel.replaceAll('-',' ')});return}
    if(choice.command&&conversation&&session){const npc=conversation.npc,token=dialogueToken.current,result=await session.perform(choice.command);if(result&&token===dialogueToken.current){if(choice.panel){openPanel({kind:choice.panel,label:choice.panel.replaceAll('-',' ')});return}delivered.current.clear();setConversation(floorConversation(result,npc))}}
  }
  const presented=useCallback(()=>{if(!conversation?.acknowledge||!session||delivered.current.has(conversation.id))return;delivered.current.add(conversation.id);void session.seen(conversation.id)},[conversation?.id,conversation?.acknowledge,session])
  const travel=async(to:StageId)=>{
    if(!session||!campaignRef.current||loadingRef.current)return
    if(engine.current?.unrecordedVictory){session.error('Retry the held victory save before leaving.');return}
    const from=campaignRef.current.location.stage;abort.current?.abort();abort.current=new AbortController();const signal=abort.current.signal
    setPanel(null);closeConversation();setInteraction(null)
    await session.travel(to,()=>prepare(to,character,from),signal)
  }
  worldDeath.current=()=>{setPanel(null);closeConversation();session?.notice('Defeated. Return to your safe checkpoint; your pack and decisions are kept.')}
  const recover=()=>{if(!campaignRef.current)return;const to=recoveryStage(campaignRef.current);return session?.recover(()=>prepare(to,character,campaignRef.current?.location.stage,to==='f01.stage.switchyard'?{x:280,y:390}:{x:760,y:1090}))}
  const retryVictory=()=>{if(engine.current?.retryVictory&&['f01.stage.switchyard','f01.stage.bastion'].includes(sceneStage??''))void engine.current.retryVictory();else void session?.perform({kind:'claim-encounter'})}
  const enterEncounter=()=>{setPanel(null);closeConversation();engine.current?.beginEncounter?.();engine.current?.focus()}
  const openSlot=()=>{if(!safeId(slotDraft))return;const url=new URL(window.location.href);url.searchParams.set('slot',slotDraft);window.history.pushState(null,'',url.pathname+url.search);window.dispatchEvent(new PopStateEvent('popstate'))}
  const health=campaign?vitals(campaign):null
  return <PlayShell floatingAbilities={false}>
    <header className="relative z-20 flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b bg-background px-3 py-2 sm:px-5"><Button asChild size="icon" variant="ghost" aria-label="Return to stage editor"><a href="/play?preview=stage&map=f01-lobby"><ArrowLeft className="size-4"/></a></Button><div className="min-w-0 flex-1"><h1 className="truncate font-heading text-xl font-semibold">{sceneStage?stageNames[sceneStage]:'Neon Heights'}</h1><p className="text-[11px] text-muted-foreground">Floor 01 · local save {slot}</p></div>{campaign&&<><div className="hidden w-28 space-y-1 sm:block"><p className="text-xs tabular-nums">HP {health!.hp} / 100</p><Progress value={health!.hp} aria-label="Health" className="h-1.5"/></div><span className="rounded-md border bg-secondary px-3 py-2 text-sm font-semibold tabular-nums" aria-label={campaign.scrip+' local Circuit Scrip'}>{campaign.scrip} SC</span><Select value={character} disabled={paused||!!combat||!!engine.current?.unrecordedVictory} onValueChange={value=>setCharacter(value as PlayCharacter)}><SelectTrigger className="h-9 w-28" aria-label="Playable actor"><SelectValue/></SelectTrigger><SelectContent>{Object.entries(playCharacterPresets).map(([id,value])=><SelectItem key={id} value={id}>{value.name}</SelectItem>)}</SelectContent></Select><Button size="icon" variant="outline" disabled={loading||busy} aria-label="Quest journal" onClick={()=>openPanel({kind:'journal',label:'Quest journal & reputation'})}><BookOpen className="size-4"/></Button><Button size="icon" variant="outline" disabled={loading||busy} aria-label="Inventory" onClick={()=>openPanel({kind:'bag',label:'Your pack'})}><Package className="size-4"/></Button></>}</header>
    <main className="relative min-h-0 flex-1 bg-[#151a28]">
      <div ref={host} className="absolute inset-0" aria-label="Connected Neon Heights adventure"/>
      {campaign&&sceneStage&&!loading&&<><aside className={(combat?'hidden ':'')+"absolute top-3 left-3 z-10 w-64 max-w-[calc(100%-6rem)] rounded-md border bg-card/95 p-3 shadow-md"}><FloorQuestSummary state={campaign} compact/><Button size="sm" variant="ghost" className="mt-1 h-7 px-0 text-xs" onClick={()=>openPanel({kind:'journal',label:'Quest journal & reputation'})}>View journal</Button></aside><div className="absolute top-3 right-3 z-10 flex flex-col gap-1"><Button size="icon" variant="outline" className="size-8" aria-label="Zoom in" onClick={()=>engine.current?.zoom(1)}><Plus className="size-4"/></Button><Button size="icon" variant="outline" className="size-8" aria-label="Zoom out" onClick={()=>engine.current?.zoom(-1)}><Minus className="size-4"/></Button></div>{interaction&&!paused&&<div className="absolute inset-x-3 bottom-4 z-10 mx-auto flex max-w-md items-center gap-3 rounded-md border bg-card/95 p-3 shadow-md"><div className="min-w-0 flex-1"><p className="font-heading text-lg font-semibold leading-tight">{interaction.label}</p><p className="mt-1 text-xs text-muted-foreground">{interaction.description}</p></div><Button disabled={interaction.disabled} onClick={()=>engine.current?.interactPlay()}>{interaction.button} <kbd className="hidden text-xs opacity-70 sm:inline">E</kbd></Button></div>}<div className="absolute right-3 bottom-28 z-10 flex gap-2 sm:bottom-4"><Button size="sm" variant="outline" disabled={paused} onClick={()=>engine.current?.useItem('primary')}>Slash <kbd>J</kbd></Button><Button size="sm" variant="outline" disabled={paused} onClick={()=>engine.current?.useItem('special')}>Wave <kbd>K</kbd></Button></div><TouchControls disabled={paused} showInteract={false} onMove={(x,y)=>engine.current?.setPlayInput(x,y)} className="md:hidden"/></>}
      {fixtureHandle&&!paused&&<Button size="icon" variant="outline" className="absolute z-10 size-9 rounded-full border-primary bg-card shadow-md" style={{left:fixtureHandle.x,top:fixtureHandle.y,transform:'translate(-50%,-50%)'}} disabled={fixtureHandle.occupied||busy} aria-label={'Rotate '+(fixtureHandle.id==='koi'?'Koi Lamp':'Bastion Bench')+' 90 degrees'} title={fixtureHandle.occupied?'Stand up before rotating':'Rotate 90° · '+fixtureHandle.rotation+'°'} onClick={()=>void perform({kind:'fixture-rotate',item:fixtureHandle.id,from:fixtureHandle.rotation})}><RotateCw className="size-4"/></Button>}
      {combat&&campaign&&!loading&&<FloorCombatHud report={combat} state={campaign} busy={busy} paused={paused} held={!!engine.current?.unrecordedVictory} onRetry={retryVictory} onLeave={()=>{if(combat.kind==='bastion')void travel('f01.stage.switchyard');else engine.current?.leaveEncounter?.()}} onTarget={id=>engine.current?.targets?.(id)} onResume={()=>{engine.current?.resumeCombat?.();engine.current?.focus()}}/>}
      {campaign&&!combat&&(campaign.encounters?.pending||engine.current?.unrecordedVictory)&&<div className="absolute bottom-20 inset-x-3 z-20 mx-auto max-w-md space-y-2 rounded-md border bg-card p-3"><p className="text-sm">{campaign.encounters?.pending?'Victory recorded · loot claim pending.':'Victory held in this scene · local save failed. Retry before leaving.'}</p><Button disabled={busy} onClick={retryVictory}>{campaign.encounters?.pending?'Claim recorded loot':'Retry victory save'}</Button></div>}
      {(!campaign||status==='error'||outOfSync||sceneError)&&<div className="absolute inset-0 z-20 grid place-items-center bg-background/95 p-5"><section className="w-full max-w-md space-y-4 rounded-md border bg-card p-6"><Compass className="size-8 text-primary"/><h2 className="font-heading text-3xl font-semibold">{campaign?'Resume your adventure':'The Borrowed Dawn'}</h2><p className="text-sm leading-relaxed text-muted-foreground">{setup.error||sceneError||(status==='error'?error:outOfSync?'This save’s stage or expedition changed. Resume its saved location before continuing.':'Explore six connected districts, unlock the Bastion and settle choices your contacts remember.')}</p>{!campaign&&<><label className="block text-xs font-medium">Local save slot<Input value={slotDraft} onChange={event=>setSlotDraft(event.target.value)} className="mt-1" maxLength={128}/></label>{slotDraft!==slot?<Button variant="outline" disabled={!safeId(slotDraft)} onClick={openSlot}>Open this slot</Button>:<Button disabled={!session||busy||status==='error'} onClick={()=>void session?.begin()}>{busy?'Creating save…':'Start local adventure'}</Button>}</>}{campaign&&<Button disabled={loading||busy} onClick={()=>void resume()}>Resume saved location</Button>}<p className="text-xs text-muted-foreground">Saved on this device. Circuit Scrip is game currency, separate from community Kibble or payments.</p></section></div>}
      {campaign&&health?.hp===0&&<div className="absolute inset-0 z-30 grid place-items-center bg-background/90 p-5"><section className="max-w-md space-y-4 rounded-md border bg-card p-6"><h2 className="font-heading text-3xl font-semibold">Return to safety</h2><p className="text-sm">Your pack, SC and decisions are kept. The unfinished encounter resets; unclaimed loot is not granted.</p><Button disabled={busy} onClick={()=>void recover()}>{busy?'Preparing return…':'Return to '+(campaign?stageNames[recoveryStage(campaign)]:'safety')+' · restore HP'}</Button></section></div>}
      {(loading||busy)&&<div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center p-3"><p role="status" className="flex items-center gap-2 rounded-md border bg-card px-4 py-2 text-sm shadow-md"><LoaderCircle className="size-4 motion-safe:animate-spin"/>{loading?'Loading stage…':'Saving local outcome…'}</p></div>}
    </main>
    <footer className="relative z-20 flex min-h-10 shrink-0 items-center gap-2 border-t bg-background px-3 py-2 text-xs"><Save className="size-3.5 shrink-0"/><p role="status" className="min-w-0 flex-1">{notice||'WASD / arrows walk · Shift runs · E interacts · J slash · K wave. Progress saves after accepted actions.'}</p><span className="hidden shrink-0 text-muted-foreground lg:inline">Local campaign · not platform Kibble</span></footer>
    {(error||sceneError)&&status!=='error'&&<div role="alert" className="absolute inset-x-3 top-20 z-50 mx-auto flex max-w-xl items-start gap-2 rounded-md border border-destructive/30 bg-card p-3 text-sm text-destructive shadow-md"><p className="flex-1">{error||sceneError}</p><Button size="icon" variant="ghost" className="size-6 shrink-0" aria-label="Dismiss message" onClick={()=>{session?.clearError();if(engine.current)setSceneError('')}}><X className="size-3.5"/></Button></div>}
    {campaign&&<FloorAdventurePanels key={panel?.kind??'closed'} panel={panel} state={campaign} busy={busy||loading} onClose={closePanels} onAction={perform} onTravel={to=>void travel(to)} onNewExpedition={()=>void session?.newExpedition().then(ok=>{if(ok){setPanel(null);void resume()}})} onPanel={openPanel} onEncounter={enterEncounter} onTalk={npc=>void talk(npc)}/>}
    {conversation&&<GameDialogue key={conversation.id+':'+conversation.npc} playerVoice={false} bodyFont choicesDisabled={busy||outOfSync} onPresented={presented} onClose={closeConversation} onChoice={(choice:DialogueChoice)=>{const selected=conversation.choices.find(row=>row.id===choice.target);if(selected)void choose(selected)}} dialogue={{name:floorNpcs[conversation.npc].name,npcId:'f01-'+conversation.npc,portraitCollection:floorNpcs[conversation.npc].portrait,portraitPose:'three-quarter-left',expression:conversation.expression,text:conversation.text,choices:conversation.choices.map(choice=>({label:choice.label,action:choice.close?'close':'accept',target:choice.id}))}}/>}
  </PlayShell>
}
