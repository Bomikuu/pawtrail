import { useEffect, useState, useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { CAT_EMOTES, CAT_NAMES } from '@/game/immersion-data'
import { immersionPreferences } from '@/game/immersion-preferences'
import { audio } from '@/game/systems/audio'

export function CatSoundboard({ emit }: {emit:(id:string)=>void}) {
  const preferences=useSyncExternalStore(immersionPreferences.subscribe,immersionPreferences.get)
  const [until,setUntil]=useState(0),[now,setNow]=useState(Date.now())
  useEffect(()=>{if(!until)return;const timer=setInterval(()=>setNow(Date.now()),200);return()=>clearInterval(timer)},[until])
  const remaining=Math.max(0,Math.ceil((until-now)/1000))
  return <div className="space-y-5"><div className="grid grid-cols-4 gap-2">{CAT_EMOTES.map((id,index)=><Button key={id} variant="outline" className="h-auto flex-col gap-1 rounded-xl bg-background px-1 py-3" disabled={remaining>0} aria-label={id+' cat sound'} onClick={async()=>{await audio.unlock();emit(id);setUntil(Date.now()+3000);setNow(Date.now())}}><img src={`/assets/game/soundboard/emotes/${id}.png`} alt="" className="size-8 [image-rendering:pixelated]" /><span className="text-xs">{CAT_NAMES[index]}</span></Button>)}</div><p className="text-xs text-muted-foreground" role="status">{remaining?`Let the cats catch their breath… ${remaining}s`:'Original little cat sounds. Nearby PawPals can hear and see your reaction.'}</p><div className="space-y-4 border-t pt-4"><label className="block space-y-2 text-sm">Soundboard volume<Slider min={0} max={1} step={.05} value={[preferences.soundboardVolume]} onValueChange={([value])=>immersionPreferences.update({soundboardVolume:value})} aria-label="Soundboard volume" /></label>{([['muteOthers','Mute other players’ cat sounds'],['emoteEffects','Show cat-face reactions'],['weatherSounds','Weather ambience'],['reducedEffects','Reduced weather and motion effects']] as const).map(([key,label])=><label key={key} className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><Switch checked={preferences[key]} onCheckedChange={(value)=>immersionPreferences.update({[key]:value})} /></label>)}<label className="block space-y-2 text-sm">Nearby audio range · {preferences.audioRange} pixels<Slider min={80} max={300} step={20} value={[preferences.audioRange]} onValueChange={([value])=>immersionPreferences.update({audioRange:value})} aria-label="Nearby soundboard audio range" /></label></div></div>
}
