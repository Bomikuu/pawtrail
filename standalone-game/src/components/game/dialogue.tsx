import { useEffect, useState, type ReactNode } from "react";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NPCS } from "@/game/data";
import type { Dialogue, DialogueChoice } from "@/game/types";
import { DialoguePortrait } from "./dialogue-portrait";
import { DialogueHud, DialogueNextButton, DialoguePageProgress } from "./shared/dialogue-hud";

/** Keyed by the conversation so pages and text always start with their speaker. */
export function GameDialogue({
  dialogue,
  onClose,
  onChoice,
  portraitControls,
}: {
  dialogue: Dialogue;
  onClose: () => void;
  onChoice: (choice: DialogueChoice) => void;
  portraitControls?: ReactNode;
}) {
  const [page, setPage] = useState(0),
    [letters, setLetters] = useState(0);
  const paragraphs = dialogue.text.split("\n\n"),
    paragraph = paragraphs[page] ?? "";
  const revealing = letters < paragraph.length,
    last = page === paragraphs.length - 1;
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
    } else onClose();
  }
  return (
    <DialogueHud
      onClose={onClose}
      title={dialogue.name}
      subtitle={
        dialogue.subtitle ?? (dialogue.npcId
          ? (NPCS[dialogue.npcId]?.personality ??
            "Your neighborhood care circle")
          : "Around the neighborhood")
      }
      portrait={<DialoguePortrait dialogue={dialogue} talking={revealing} frameless />}
      portraitControls={portraitControls}
      progress={<DialoguePageProgress current={page + 1} total={paragraphs.length} />}
      actions={
        <>
          {last &&
            !revealing &&
            dialogue.choices?.map((choice, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto min-h-10 max-w-full rounded-md border-[#bc8751] bg-[#fff7e9] px-3 py-2 text-sm whitespace-normal text-[#553421] hover:bg-[#f7ddb1] hover:text-[#45291e]"
                onClick={() => onChoice(choice)}
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
