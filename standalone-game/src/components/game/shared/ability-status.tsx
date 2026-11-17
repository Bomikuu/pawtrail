import {useEffect,useState,useSyncExternalStore} from 'react'
import {Gauge,Timer,Wind,X} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Progress} from '@/components/ui/progress'
import {abilityStore,activeAbility,abilityDefinitions,abilitySeconds,cancelLocalAbility,type AbilityId} from '@/game/abilities/state'
import {actorComparison} from '@/game/runtime/actor-comparison-state'
import {send} from '@/game/store'
import {live} from '@/game/housing/client'

export function useAbilities(){
  const value=useSyncExternalStore(abilityStore.subscribe,abilityStore.getSnapshot,abilityStore.getSnapshot),[now,setNow]=useState(Date.now)
  useEffect(()=>{const timer=setInterval(()=>{activeAbility();setNow(Date.now())},150);return()=>clearInterval(timer)},[])
  return {...value,now}
}
export function triggerAbility(id:AbilityId){
  const {scope}=abilityStore.getSnapshot()
  if(scope==='room')live({type:'player.emote',emote:id})
  else if(scope==='preview')actorComparison.patch({action:id,paused:false,restart:actorComparison.getSnapshot().restart+1})
  else if(scope==='local')send({type:'emote',emote:id})
}
export function endAbility(){
  const {scope}=abilityStore.getSnapshot()
  if(scope==='room')live({type:'player.ability-stop'})
  else {cancelLocalAbility();if(scope==='preview')actorComparison.patch({action:'idle'})}
}
export function AbilityStatus({inline=false}:{inline?:boolean}={}){
  const state=useAbilities(),active=state.active,dash=abilitySeconds('rescue_dash')
  if(!state.scope)return null
  const remaining=active?Math.max(0,active.until-state.now):0
  return <aside aria-label="Movement abilities" className={inline?'rounded-md border bg-card p-3':'pointer-events-auto absolute right-3 bottom-24 z-30 w-64 max-w-[calc(100vw-24px)] rounded-md border bg-background/95 p-3 shadow-lg backdrop-blur-sm sm:right-5'}>
    <div className="mb-2 flex items-center gap-2"><Gauge className="size-4 text-primary"/><h2 className="font-heading text-lg font-bold">{active?active.id==='power_up'&&!active.boosted?'Power up':abilityDefinitions[active.id].name:'Ready to explore'}</h2><span className="ml-auto text-[10px] text-muted-foreground">{state.scope==='room'?'Room':state.scope==='preview'?'Preview':'Local'}</span>{active&&<Button variant="ghost" size="icon" className="size-7" aria-label="End ability" onClick={endAbility}><X className="size-3.5"/></Button>}</div>
    {active&&<div className="mb-3 space-y-1"><div className="flex justify-between text-xs text-muted-foreground"><span>{active.id==='gentle_approach'?'Quiet steps':active.boosted?'Speed boost':'Charging'}</span><span className="tabular-nums">{(remaining/1000).toFixed(1)}s</span></div><Progress value={remaining/abilityDefinitions[active.id].durationMs*100}/></div>}
    <div className="grid grid-cols-2 gap-2"><Button size="sm" variant="secondary" disabled={dash>0} onClick={()=>triggerAbility('rescue_dash')}><Wind className="size-3.5"/>{dash?`Dash · ${dash}s`:'Rescue Dash'}</Button><Button size="sm" variant="outline" disabled={abilitySeconds('gentle_approach')>0} onClick={()=>triggerAbility('gentle_approach')}><Timer className="size-3.5"/>{abilitySeconds('gentle_approach')?`${abilitySeconds('gentle_approach')}s`:'Go gently'}</Button></div>
    {state.notice&&<p role="status" className="mt-2 text-xs leading-relaxed text-muted-foreground">{state.notice}</p>}
  </aside>
}
