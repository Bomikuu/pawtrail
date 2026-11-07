import { useState } from 'react'
import { PawPrint } from 'lucide-react'
import { SPEAKER_PORTRAITS } from '@/features/neighborhood/game/characters'
import type { Dialogue } from '@/features/neighborhood/game/types'

export function DialoguePortrait({ dialogue, compact = false }: { dialogue: Dialogue; compact?: boolean }) {
  const source = dialogue.npcId
    ? SPEAKER_PORTRAITS[dialogue.npcId]
    : dialogue.portrait
      ? SPEAKER_PORTRAITS[dialogue.portrait] ?? `/pawtrail-game/game-assets/portraits/${dialogue.portrait}.png`
      : undefined
  const [failedSource, setFailedSource] = useState<string>()
  return (
    <div className={`flex size-24 shrink-0 items-end justify-center overflow-hidden rounded-xl border border-border bg-muted/60 ${compact ? '' : 'sm:size-48'}`}>
      {source && failedSource !== source ? (
        <img
          src={source}
          alt={`${dialogue.name} portrait`}
          width={96}
          height={96}
          onError={() => setFailedSource(source)}
          className="size-full object-contain [image-rendering:pixelated]"
        />
      ) : (
        <PawPrint aria-hidden="true" className="m-auto size-10 text-primary" />
      )}
    </div>
  )
}
