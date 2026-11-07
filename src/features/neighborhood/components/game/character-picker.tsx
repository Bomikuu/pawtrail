import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CHARACTER_OPTIONS,
  SPEAKER_PORTRAITS,
  characterId,
  characterSheet,
  type CharacterId,
} from '@/features/neighborhood/game/characters'
import { DialoguePortrait } from './dialogue-portrait'

export function CharacterPicker({
  value,
  onSelect,
  disabled = false,
}: {
  value?: string
  onSelect: (id: CharacterId) => void
  disabled?: boolean
}) {
  const selected = characterId(value)
  const current = CHARACTER_OPTIONS.find((character) => character.id === selected) ?? CHARACTER_OPTIONS[0]
  return (
    <div className="space-y-3">
    <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-3">
      {SPEAKER_PORTRAITS[selected] ? (
        <DialoguePortrait compact dialogue={{ name: current.name, text: '', portrait: selected }} />
      ) : (
        <span className="relative block h-24 w-16 shrink-0 overflow-hidden" aria-hidden="true">
          <img src={characterSheet(selected)} alt="" width={256} height={2592} className="absolute top-0 left-0 max-w-none [image-rendering:pixelated]" />
        </span>
      )}
      <div className="min-w-0 space-y-1" role="status">
        <p className="text-sm font-bold">{current.name}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{current.description}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Choose your game character">
      {CHARACTER_OPTIONS.map((character) => (
        <Button
          key={character.id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-pressed={selected === character.id}
          onClick={() => onSelect(character.id)}
          className="relative h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-xl px-2 py-3 text-center transition-colors aria-pressed:border-primary aria-pressed:bg-primary/10 hover:bg-muted focus-visible:ring-2"
        >
          <span className="relative block h-24 w-16 shrink-0 overflow-hidden" aria-hidden="true">
            <img src={characterSheet(character.id)} alt="" width={256} height={2592} className="absolute top-0 left-0 max-w-none [image-rendering:pixelated]" />
          </span>
          <span className="text-xs font-bold leading-snug">{character.name}</span>
          <span className="sr-only">{character.description}</span>
          {selected === character.id && <Check aria-hidden="true" className="absolute top-2 right-2 size-4 text-primary" />}
        </Button>
      ))}
    </div>
    </div>
  )
}
