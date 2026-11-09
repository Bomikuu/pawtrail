import {useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {characterLibrary,loadCharacterLibrary,getSavedCharacter} from '@/game/creator/library';
import {customCharacterId} from '@/game/actor-rig/appearance';
import {CharacterMiniature} from './character-creator-editor';
import {gameAppearance} from '@/game/actor-rig/game-appearances';
import {modelPreferences} from '@/game/models3d/preferences';
import {navigateActorPreview} from '@/game/play-navigation';
import { ModelWorkshop } from "./model-workshop";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CHARACTER_OPTIONS,
  characterId,
  type CharacterId,
} from "@/game/characters";

function CharacterPreview({ id }: { id: CharacterId }) {
  const [revision,setRevision]=useState(0)
  useEffect(()=>{const refresh=()=>setRevision(value=>value+1);window.addEventListener('pawtrail:models3d',refresh);return()=>window.removeEventListener('pawtrail:models3d',refresh)},[])
  const look=useMemo(()=>gameAppearance(id,modelPreferences(id))??gameAppearance('rescuer')!,[id,revision])
  return <CharacterMiniature character={{appearance:look.appearance,headScale:look.headScale,bodyScale:look.bodyScale,name:CHARACTER_OPTIONS.find(row=>row.id===id)?.name??'Trail rescuer'}}/>
}

export function CharacterPicker({
  value,
  onSelect,
  disabled = false,
  accountOnly = false,
}: {
  value?: string;
  onSelect: (id: CharacterId) => void;
  disabled?: boolean;
  accountOnly?: boolean;
}) {
  const library=useSyncExternalStore(characterLibrary.subscribe,characterLibrary.getSnapshot,characterLibrary.getSnapshot);
  useEffect(()=>{void loadCharacterLibrary()},[]);
  const selected = characterId(value);
  const personal=getSavedCharacter(selected);
  const saved=[...library.account,...(accountOnly?[]:library.device)];
  const current =
    CHARACTER_OPTIONS.find((character) => character.id === selected) ??
    CHARACTER_OPTIONS[0];
  return (
    <div className="space-y-3">
      {selected !== "rescuer" && !customCharacterId(selected) && <ModelWorkshop identity={selected} />}
      <div className="flex items-center gap-4 rounded-xl bg-muted/40 p-3">
        {personal ? <CharacterMiniature character={personal}/> : <CharacterPreview id={selected} />}
        <div className="min-w-0 space-y-1" role="status">
          <p className="text-sm font-bold">{personal?.name??current.name}</p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {personal ? "Your personal character. Shared movement, your own look." : current.description}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-heading text-lg font-bold">Personal characters</h4><Button type="button" variant="outline" size="sm" disabled={disabled} onClick={navigateActorPreview}>Character creator</Button></div>
      {saved.length ? <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Choose a personal character">{saved.map(row=><Button key={row.id} type="button" variant="outline" disabled={disabled} aria-pressed={selected===row.id} onClick={()=>onSelect(row.id as CharacterId)} className="h-auto flex-col gap-2 rounded-md p-3 aria-pressed:border-primary aria-pressed:bg-primary/10"><CharacterMiniature character={row}/><span className="max-w-full truncate text-xs font-bold">{row.name}</span><span className="text-[10px] text-muted-foreground">{row.scope==='account'?'Account':'This device'}</span></Button>)}</div> : <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">{accountOnly?'Save a character to your PawTrail account to wear it at home.':'Create and save your first personal look in the character creator.'}</p>}
      <h4 className="font-heading text-lg font-bold">PawTrail characters</h4>
      <div
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="group"
        aria-label="Choose your game character"
      >
        {CHARACTER_OPTIONS.map((character) => (
          <Button
            key={character.id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-pressed={selected === character.id}
            onClick={() => onSelect(character.id)}
            className="relative h-auto min-w-0 flex-col gap-2 whitespace-normal rounded-md px-2 py-3 text-center transition-colors aria-pressed:border-primary aria-pressed:bg-primary/10 hover:bg-muted focus-visible:ring-2"
          >
            <CharacterPreview id={character.id} />
            <span className="text-xs font-bold leading-snug">
              {character.name}
            </span>
            <span className="sr-only">{character.description}</span>
            {selected === character.id && (
              <Check
                aria-hidden="true"
                className="absolute top-2 right-2 size-4 text-primary"
              />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
