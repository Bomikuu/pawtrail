import { useEffect, useState } from "react";
import { ArrowRight, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NPCS } from "@/game/data";
import type { Dialogue, DialogueChoice } from "@/game/types";
import { DialoguePortrait } from "./dialogue-portrait";
import {
  InteractionAction,
  InteractionDialog,
} from "./shared/interaction-card";

/** Keyed by the conversation so pages and text always start with their speaker. */
export function GameDialogue({
  dialogue,
  onClose,
  onChoice,
}: {
  dialogue: Dialogue;
  onClose: () => void;
  onChoice: (choice: DialogueChoice) => void;
}) {
  const [page, setPage] = useState(0),
    [letters, setLetters] = useState(0);
  const paragraphs = dialogue.text.split("\n\n"),
    paragraph = paragraphs[page] ?? "";
  const revealing = letters < paragraph.length,
    last = page === paragraphs.length - 1;
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLetters(paragraph.length);
      return;
    }
    setLetters(0);
    const timer = window.setInterval(
      () =>
        setLetters((value) => {
          const next = Math.min(paragraph.length, value + 2);
          if (next === paragraph.length) window.clearInterval(timer);
          return next;
        }),
      28,
    );
    return () => window.clearInterval(timer);
  }, [paragraph]);
  function advance() {
    if (revealing) setLetters(paragraph.length);
    else if (!last) {
      setLetters(0);
      setPage((value) => value + 1);
    } else onClose();
  }
  return (
    <InteractionDialog
      open
      onClose={onClose}
      title={dialogue.name}
      subtitle={
        dialogue.npcId
          ? (NPCS[dialogue.npcId]?.personality ??
            "Your neighborhood care circle")
          : "Around the neighborhood"
      }
      portrait={<DialoguePortrait dialogue={dialogue} talking={revealing} />}
      actions={
        <>
          {last &&
            !revealing &&
            dialogue.choices?.map((choice, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto min-h-11 max-w-full rounded-md border-[#bc8751] bg-[#fff7e9] px-4 py-3 text-sm whitespace-normal text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]"
                onClick={() => onChoice(choice)}
              >
                {choice.label}
              </Button>
            ))}
          <InteractionAction
            onClick={advance}
            aria-label={
              revealing
                ? "Show full dialogue"
                : !last
                  ? "Continue conversation"
                  : "Thanks, neighbor! Close conversation"
            }
          >
            {last ? (
              <PawPrint aria-hidden="true" className="size-6 fill-current" />
            ) : (
              <ArrowRight aria-hidden="true" className="size-6" />
            )}
            {revealing ? "Show text" : !last ? "Continue" : "Thanks, neighbor!"}
          </InteractionAction>
        </>
      }
    >
      <p
        aria-hidden="true"
        className="min-h-20 whitespace-pre-line text-base leading-relaxed font-medium sm:text-lg lg:text-xl lg:leading-relaxed"
      >
        {paragraph.slice(0, letters)}
        {revealing && (
          <span className="ml-0.5 inline-block h-4 w-0.5 bg-[#8e5d34] align-middle motion-safe:animate-pulse" />
        )}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {paragraph}
      </p>
      {paragraphs.length > 1 && (
        <p
          className="mt-4 text-xs font-medium text-[#805d3c]"
          aria-label={`Part ${page + 1} of ${paragraphs.length}`}
        >
          {page + 1} / {paragraphs.length}
        </p>
      )}
    </InteractionDialog>
  );
}
