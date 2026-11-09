import { LivingPortrait } from './living-portrait'
import { useSyncExternalStore } from 'react'
import { gameStore } from '@/features/neighborhood/game/store'

export function PlayerPortrait({ appearance, name, local = false }: { appearance: string; name?: string; local?: boolean }) {
  const save = useSyncExternalStore(gameStore.subscribe, () => gameStore.getSnapshot().save, () => 'saved')
  return <div className="mb-2 flex items-center gap-3 border-b border-[#bc8751]/25 pb-2">
    <div className="size-24 shrink-0 overflow-hidden rounded-md border-2 border-[#bc8751]/60 bg-[#e3e7ce] sm:size-28">
      <LivingPortrait identity={appearance} name={name || 'Your rescuer'} />
    </div>
    <div className="min-w-0 max-w-32 pr-1">
      <p className="break-words font-heading text-xl font-semibold leading-tight text-foreground">{name || 'Your rescuer'}</p>
      <p className={`mt-1 text-[11px] leading-relaxed ${local && save === 'unavailable' ? 'text-destructive' : 'text-muted-foreground'}`}>
        {local ? save === 'unavailable' ? 'Saving unavailable — export from Pause' : 'Local exploration · Saved on this device' : 'Your rescuer'}
      </p>
    </div>
  </div>
}
