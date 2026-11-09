import {useAbilities} from './ability-status';
import {isAbility,abilitySeconds} from '@/features/neighborhood/game/abilities/state';
import { Zap, Rocket, Wind, Leaf } from 'lucide-react';
import { REACTIONS, reactionEffect, richReaction } from "@/features/neighborhood/game/reactions";
import { Button } from "@/components/ui/button";
import { catalogue } from "@/features/neighborhood/game/housing/geometry";
export function GameReactions({ onReact }: { onReact: (id: string) => void }) {
  useAbilities();
  return (
    <div className="grid grid-cols-4 gap-2">
      {REACTIONS.map(([id, label]) => {
        const effect =
          catalogue.effects[reactionEffect(id)] ?? catalogue.effects.happy;
        return (
          <Button
            key={id}
            variant="outline"
            className="h-auto min-w-0 flex-col gap-1 whitespace-normal rounded-md px-2 py-3 text-center"
            disabled={isAbility(id)&&abilitySeconds(id)>0}
            onClick={() => onReact(id)}
          >
            {id==="rescue_dash"?<Wind aria-hidden="true" className="size-8 text-primary"/>:id==="gentle_approach"?<Leaf aria-hidden="true" className="size-8 text-green-600"/>:id === "jetpack" ? <Rocket aria-hidden="true" className="size-8 text-orange-500"/> : id === "power_up" ? <Zap aria-hidden="true" className="size-8 text-amber-500"/> : richReaction(id) && id !== "cheer" ? <img src={'/pawtrail-game/game-assets/emote-fx-v3/' + id + '.png'} width={32} height={32} alt="" className="size-8 [image-rendering:pixelated]" /> : <span
              aria-hidden="true"
              className="size-8 [image-rendering:pixelated]"
              style={{
                backgroundImage: `url(${effect?.file})`,
                backgroundPosition: "0 0",
                backgroundRepeat: "no-repeat",
              }}
            />}
            <span className="text-xs leading-tight">{label}{isAbility(id)&&abilitySeconds(id)>0?` · ${abilitySeconds(id)}s`:null}</span>
          </Button>
        );
      })}
    </div>
  );
}
