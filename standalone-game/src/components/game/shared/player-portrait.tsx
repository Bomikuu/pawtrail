import { LivingPortrait } from './living-portrait'
import { useSyncExternalStore } from 'react'
import { gameStore } from '@/game/store'
import { gameVoice, voiceActor } from '@/game/runtime/game-voice'
import { featuredActors } from '@/game/runtime/featured-actors'
import { portraitForAction } from '@/game/actor-rig/action-portrait'

export function PlayerPortrait({ appearance, name, local = false }: { appearance: string; name?: string; local?: boolean }) {
  const save = useSyncExternalStore(gameStore.subscribe, () => gameStore.getSnapshot().save, () => 'saved')
  const voice = useSyncExternalStore(gameVoice.subscribe, gameVoice.getSnapshot, gameVoice.getSnapshot)
  const id=voiceActor(appearance),actor=featuredActors[id],speaking=!!id&&voice.actorId===id&&voice.status==='playing'
  const performance=portraitForAction(voice.localActorId===id?voice.action:'idle',!!actor)
  return <div className="mb-2 flex items-center gap-3 border-b border-[#bc8751]/25 pb-2">
    <div className="size-24 shrink-0 overflow-hidden rounded-md border-2 border-[#bc8751]/60 bg-[#e3e7ce] sm:size-28">
      <LivingPortrait identity={appearance} collection={actor?.collection} name={name || actor?.name || 'Your rescuer'} expression={speaking?voice.cue?.portraitEmotion:performance.expression} talking={speaking} blink={speaking?'auto':performance.blink} />
    </div>
    <div className="min-w-0 max-w-32 pr-1">
      <p className="break-words font-heading text-xl font-semibold leading-tight text-foreground">{actor?.name || name || 'Your rescuer'}</p>
      {speaking && <p role="status" className="mt-1 text-xs leading-relaxed text-foreground">{voice.cue?.translation}</p>}
      {id && voice.actorId===id && voice.status==='error' && <p role="alert" className="mt-1 text-xs text-destructive">{voice.message}</p>}
      <p className={`mt-1 text-[11px] leading-relaxed ${local && save === 'unavailable' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {local ? save === 'unavailable' ? 'Saving unavailable — export from Pause' : 'Local exploration · Saved on this device' : 'Your rescuer'}
      </p>
    </div>
  </div>
}
