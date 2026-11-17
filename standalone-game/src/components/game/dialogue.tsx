import { useEffect, useId, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NPCS } from "@/game/data";
import type { Dialogue, DialogueChoice } from "@/game/types";
import { DialoguePortrait } from "./dialogue-portrait";
import { DialogueHud, DialogueNextButton, DialoguePageProgress } from "./shared/dialogue-hud";
import { gameVoice, voiceActor } from '@/game/runtime/game-voice';
import { gameStore } from '@/game/store';
import { featuredActors } from '@/game/runtime/featured-actors';
import { homes } from '@/game/housing/client';
import { LivingPortrait } from './shared/living-portrait';

/** Keyed by the conversation so pages and text always start with their speaker. */
export function GameDialogue({
  dialogue,
  onClose,
  onChoice,
  portraitControls,
  playerVoice = true,
  onPresented,
  choicesDisabled = false,
  bodyFont = false,
}: {
  dialogue: Dialogue;
  onClose: () => void;
  onChoice: (choice: DialogueChoice) => void;
  portraitControls?: ReactNode;
  playerVoice?: boolean;
  onPresented?: () => void;
  choicesDisabled?: boolean;
  bodyFont?: boolean;
}) {
  const voice = useSyncExternalStore(gameVoice.subscribe, gameVoice.getSnapshot, gameVoice.getSnapshot);
  const player = useSyncExternalStore(gameStore.subscribe, () => gameStore.getSnapshot().progress.appearance, () => 'rescuer');
  const homePlayer = useSyncExternalStore(homes.subscribe, () => homes.get().data?.player.appearance, () => undefined);
  const owner = 'dialogue:' + useId();
  const dialogueActor = [dialogue.voiceActorId, dialogue.appearanceId, dialogue.portraitCollection, dialogue.npcId].map(voiceActor).find(Boolean) ?? '';
  const speaker = dialogueActor || (playerVoice && dialogue.npcId ? voiceActor(voice.scene==='home' ? homePlayer : player) : '');
  const speaking = voice.actorId === speaker && voice.status === 'playing';
  useEffect(() => {
    if (!speaker) return;
    gameVoice.stop();
    void gameVoice.speak(speaker, dialogue.voiceCue ?? 'hi', owner, 3);
    return () => gameVoice.stop(owner);
  }, [speaker, owner, dialogue.voiceCue]);
  const close = () => {
    gameVoice.stop(owner);
    if (speaker) void gameVoice.speak(speaker, 'bye', 'dialogue-exit', 3);
    onClose();
  };
  const [page, setPage] = useState(0),
    [letters, setLetters] = useState(0);
  const paragraphs = dialogue.text.split("\n\n"),
    paragraph = paragraphs[page] ?? "";
  const revealing = letters < paragraph.length,
    last = page === paragraphs.length - 1;
  useEffect(()=>{
    if(!last||revealing||!onPresented)return
    const deliver=()=>{if(!document.hidden)onPresented()}
    deliver();document.addEventListener('visibilitychange',deliver)
    return()=>document.removeEventListener('visibilitychange',deliver)
  },[last,revealing,onPresented]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;
    const begin = () => {
      window.clearInterval(timer);
      if (media.matches) {
        setLetters(paragraph.length);
        return;
      }
      setLetters(0);
      timer = window.setInterval(
        () =>
          setLetters((value) => {
            const next = Math.min(paragraph.length, value + 2);
            if (next === paragraph.length) window.clearInterval(timer);
            return next;
          }),
        28,
      );
    };
    begin();
    media.addEventListener("change", begin);
    return () => { window.clearInterval(timer); media.removeEventListener("change", begin); };
  }, [paragraph]);
  function advance() {
    if (revealing) setLetters(paragraph.length);
    else if (!last) {
      setLetters(0);
      setPage((value) => value + 1);
    } else close();
  }
  return (
    <DialogueHud
      bodyFont={bodyFont}
      onClose={close}
      title={dialogue.name}
      subtitle={
        dialogue.subtitle ?? (dialogue.npcId
          ? (NPCS[dialogue.npcId]?.personality ??
            "Your neighborhood care circle")
          : "Around the neighborhood")
      }
      portrait={<DialoguePortrait dialogue={dialogue} voiceActorId={dialogueActor} talking={dialogueActor ? speaking : !speaking && revealing} expression={dialogueActor && speaking ? voice.cue?.portraitEmotion : dialogue.expression} frameless />}
      portraitControls={portraitControls}
      progress={<DialoguePageProgress current={page + 1} total={paragraphs.length} />}
      actions={
        <>
          {last &&
            !revealing &&
            dialogue.choices?.map((choice, index) => (
              <Button
                key={index}
                disabled={choicesDisabled}
                variant="outline"
                className="h-auto min-h-10 max-w-full rounded-md border-[#bc8751] bg-[#fff7e9] px-3 py-2 text-sm whitespace-normal text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]"
                onClick={() => { if(choice.action==='close'){close();return} gameVoice.stop(owner);onChoice(choice); }}
              >
                {choice.label}
              </Button>
            ))}
          <DialogueNextButton
            type="button"
            autoFocus
            onClick={advance}
            aria-label={
              revealing
                ? "Show full dialogue"
                : !last
                  ? "Continue conversation"
                  : "Close conversation"
            }
          >
            {last ? (
              <Check aria-hidden="true" className="size-5" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-5 fill-current" />
            )}
            {revealing ? "Show text" : !last ? "Next" : "Done"}
          </DialogueNextButton>
        </>
      }
    >
      {speaker && voice.actorId === speaker && ['loading','playing','error'].includes(voice.status) && <div role="status" className="mb-2 flex items-center gap-3 rounded-md border border-[#bc8751]/30 bg-[#fff7e9]/70 px-3 py-2 font-body text-xs">
        {!dialogueActor && <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md border border-[#bc8751]/40 bg-[#e3e7ce]"><LivingPortrait name={featuredActors[speaker]?.name??'Your character'} collection={featuredActors[speaker]?.collection} talking={speaking} expression={speaking?voice.cue?.portraitEmotion:'idle'} controls={false} inspectable={false}/></div>}
        <div><p className="font-semibold">{featuredActors[speaker]?.name} · {voice.status === 'playing' ? 'Voice cue' : voice.message}</p>
        {speaking && <><p lang="ja" className="mt-1">{voice.cue?.text}</p><p className="mt-1 text-[#805d3c]">{voice.cue?.translation}</p></>}</div>
      </div>}
      <p
        aria-hidden="true"
        className="min-h-16 whitespace-pre-line text-sm font-normal leading-relaxed sm:text-base"
      >
        {paragraph.slice(0, letters)}
        {revealing && (
          <span className="ml-0.5 inline-block h-4 w-0.5 bg-[#8e5d34] align-middle motion-safe:animate-pulse" />
        )}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {paragraph}
      </p>
    </DialogueHud>
  );
}
