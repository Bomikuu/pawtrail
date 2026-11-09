# Yae Miko Sharp cel — failed facial performance review

The owner rejected the current performance after the earlier installation review.
This diagnostic focuses on **one style**, Sharp cel, rather than approving or
regenerating the other four. No asset or runtime repair is claimed here.

## Observed in Firefox

Six front-angle resting states were captured beside closed-blink + rounded-speech
states. Angry was also inspected in four-angle Compare mode and combined speech,
blink and breathing playback. Evidence:
`output/playwright/sharp-cel-review/sharp-cel-expression-motion-review.png`,
`angry-compare-closed-speech.png` and `angry-playback-*.png`.

- Neutral, smile, sad and angry converge toward very similar closed-lid/O-mouth
  faces under combined motion. Their expression distinctions weaken substantially.
- Happy retains its upward closed eyes, but its broad joyful mouth is replaced by
  a small generic O while speaking; the mouth no longer carries the same intent.
- The angry Compare capture shows the same softened closed-lid/rounded-mouth
  performance in front, three-quarter, profile and tilted views.
- The four combined playback samples are diagnostic snapshots, not a complete
  breathing-cycle or transition acceptance review. Those states remain pending.

## Source cause

`scripts/prepare-portrait-collection.py` loads `pose.closed`, `pose.half` and
`pose.speech` outside its emotion loop. It emits distinct per-emotion IDs, but the
motion artwork originates in the same pose-level neutral performance. Geometry
and a few retained lip-corner pixels cannot restore the selected emotion's acting.

The earlier `author_expressions.py` also derived contextual facial islands from
generated art and a neutral base with broad RGB masks. Those masks can alter the
original feature context. An exported resting reference is therefore not an
independent artistic authority merely because the live canvas matches it.

The shared runtime correctly selects expression frame IDs, so this is not evidence
that every character globally shares one PNG. The principal demonstrated problem
is incompatible source artwork reused across emotions within a pose, combined
with an inadequate authoring/verification process.

## Verdict and required repair

**FAIL — expression preservation during blink/speech.** Full breathing and
mid-speech/mid-blink emotion transitions are **PENDING**, not passed. Other styles
have not been re-audited in this task. File-size compliance, changing frame hashes
and lack of console errors do not override this visual failure.

Repair Sharp cel before starting another style: author compatible blink and speech
for its actual expressions and angles; bind those sources per expression or use
full authored motion frames; preserve brows, lips and jaw; then review all required
emotion/angle combinations, breathing and transitions. Retain the original static
art and version the candidate. Do not quietly substitute a surprised mouth for
speech, redraw generic lids, or mark a partially reviewed candidate complete.

The canonical independently callable workflow is
`/home/micxsz/.codex/skills/pawtrail-portraits/SKILL.md`. Actor and cat portrait
creation route to it; their gameplay body rigs remain unchanged. No new images,
application checks/builds or automated test suites were run for this skill update.
