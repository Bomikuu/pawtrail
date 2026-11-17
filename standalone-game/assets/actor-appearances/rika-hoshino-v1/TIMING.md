# Rika Hoshino and Peony-7 — production timing

All timestamps in `timings.json` are UTC. Local time is Asia/Manila, UTC+08.
Started **15 November 2026, 03:46:08 Manila**. The host session was interrupted after about 04:29; the Drive mount and development processes were absent on return. Work resumed about 11:31. That inactive gap is excluded from the intervals below. The exact shutdown instant was not observed.

| Stage | Duration | Measurement |
| --- | ---: | --- |
| reference-and-brief | 1m 53s | Recorded production interval; includes preparation/review, not only service wait. |
| illustrations-turnaround-export | 11m 00s | Recorded production interval; includes preparation/review, not only service wait. |
| portrait-and-icon-production | 12m 05s | Recorded production interval; includes preparation/review, not only service wait. |
| model-and-game-integration | 14m 54s | Bounded from surface export and last integration file timestamp, not a continuous stopwatch. |
| initial-review-and-fixes | 12m 18s | Review start from browser console; end rounded to last pre-interruption tool interaction. Not all of this interval is browser execution. |
| resumed-final-review-and-delivery | 14m 51s | Recorded production interval; includes preparation/review, not only service wait. |

These intervals overlap: model work began while portraits/icons were finishing, and initial browser inspection overlapped integration. Do not sum them as elapsed wall time. The pre-interruption production window was about 43 minutes; the resumed interval is listed separately. This package includes a pilot and a separately modeled, fully playable vehicle, rather than one humanoid skin.

## Export settings reused

- Portrait: 96×120 cells, three angles, six emotions, 90 authored source drawings, 180 complete frames including breathing, 48-color lossless WebP, compact JSON and indexed source references. First working encoding succeeded: **202,880 bytes** for the complete style.
- Illustrations: existing 320×448 continuous painted-part renderer, 5-second loops, separate background and aura; reused existing VFX artwork recolored teal for the attack effect.
- Icons: native 40×40 pixel PNG in the shared wood frame; tightened the pilot face crop without regenerating it.
- Successful export commands consumed **22.293 seconds** combined. That excludes generation, prompting, source preparation, modeling and browser review.

## Generation and retries

Thirteen generated sources were used, including one normal-framing repair, two portrait expansion angles, two icons and a static model turnaround. Exact service durations for the first eight calls are retained, plus the rounded 40.8-second first portrait duration. Four remaining per-call starts were lost with the interrupted session; actual generated-file completion times are retained instead of inventing durations. Parallel requests overlap, and generation can queue.

Recorded fixes: normal antenna framing; redundant overlapping crown extraction; an early portrait export before source copying finished; a tighter icon crop; keyboard selection for Firefox review dropdowns; and a numeric-side error in the mech parking pose discovered visually. The last fix was reviewed again in sit, sleep, rooftop ride and float. A timed-out sleep-button lookup was corrected from `Sleep` to its actual accessible label `Sleep E`. The main-game first-visit Maya conversation was dismissed before continuing the character-picker review.

The working exporters were fast. Most time went into artwork preparation, two distinct model geometries, integration and the complete live review. This run does not establish a faster total than the previous single-actor run.
