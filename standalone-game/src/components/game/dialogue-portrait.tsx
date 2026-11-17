import { SPEAKER_PORTRAITS } from "@/game/characters";
import type { Dialogue } from "@/game/types";
import { InteractionPortrait } from "./shared/interaction-card";
import { LivingPortrait } from "./shared/living-portrait";
import { featuredActors } from '@/game/runtime/featured-actors';
import type { PortraitExpression } from '@/game/actor-rig/portrait-state';

export function DialoguePortrait({
  dialogue,
  compact = false,
  talking = false,
  frameless = false,
  voiceActorId,
  expression,
}: {
  dialogue: Dialogue;
  compact?: boolean;
  talking?: boolean;
  frameless?: boolean;
  voiceActorId?: string;
  expression?: PortraitExpression;
}) {
  const source = dialogue.npcId
    ? SPEAKER_PORTRAITS[dialogue.npcId]
    : dialogue.portrait
      ? (SPEAKER_PORTRAITS[dialogue.portrait] ??
        `/pawtrail-game/game-assets/portraits/${dialogue.portrait}.png`)
      : undefined;
  const actor = voiceActorId ? featuredActors[voiceActorId] : undefined;
  const portrait = <LivingPortrait name={dialogue.name} identity={dialogue.appearanceId ?? dialogue.npcId ?? dialogue.portrait} subject={dialogue.portraitSubject} fallback={source} collection={dialogue.portraitCollection ?? actor?.collection} pose={dialogue.portraitPose} expression={expression} talking={talking} controls={!frameless} inspectable={!frameless} />;
  if (frameless) return portrait;
  if (!compact) return <InteractionPortrait>{portrait}</InteractionPortrait>;
  return (
    <div className="flex size-24 shrink-0 items-end justify-center overflow-hidden rounded-md border border-border bg-muted/60">
      {portrait}
    </div>
  );
}
