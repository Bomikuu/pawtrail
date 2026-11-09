> **Style correction:** the whole-frame artwork was retained as **Refined cel**,
> not Sharp cel. See [the style contracts](portrait-style-contracts.md). Original
> Sharp cel references are separate; their matching animation remains pending.

# Yae Miko — Sharp cel performance repair

> **Superseded by owner feedback.** The owner rejected the V2 preview's visual
> match. A later inspection also found chin/neck artifacts baked into some native
> exports. The historical PASS below must not be treated as current acceptance.
> The replacement trial uses complete images; see
> [the whole-frame implementation](yae-sharp-cel-whole-frames.md).

**Verdict: PASS for the V2 Sharp cel pack only.** Reviewed in Firefox at
`http://127.0.0.1:3000/play?preview=portraits`, with Yae Miko → Sharp cel selected.
The other four styles retain their existing assets and have no new acceptance.
See the job's [acceptance matrix](../../output/imagegen/yae-sharp-cel-repair-v2/acceptance.json)
for the exact installed revision and measured sizes.

Installed revision: `ff05ed0fddcc`.

| Served files | Bytes |
| --- | ---: |
| Animation atlas + manifest | 102,586 |
| 24 reference PNGs | 84,956 |
| Complete style (26 files) | **187,542** |

## Repair

The V1 exporter reused neutral motion sources across incompatible emotions. V2
uses four independently authored five-column, six-emotion facial-performance
sheets. Each emotion has its own resting face, half/closed blink and small/open
speech. Happy intentionally retains its already closed smiling eyes; its mouth
still changes through joyful speech shapes. Angry speech stays tense and sad
speech retains downturned corners. Speech is not substituted with surprised lips.

The approved pink hair, ornaments, outfit and torso silhouette are retained from
`output/imagegen/pink-shrine-portraits-v1/style-1-*.png`. Facial details are redrawn
for consistent expression-specific acting in the same 96×120 Sharp cel style.
The [source record](../../output/imagegen/yae-sharp-cel-repair-v2/generated-sources.json)
names the four original generated PNGs; exact prompts are retained in
`prompt-front.txt` and `prompts-angles.json` beside it. Original generated sheets,
native frames and the failed V1 pack remain available as authoring history.

`scripts/prepare-authored-portrait-performance.py` exports real per-expression
sources using explicit anatomical polygons and independently registered angles.
The polygons preserve facial context and contain no RGB-derived feature masks.
The shared `photo-portrait-renderer.ts` consumes expression-specific timing,
breathing and replacement regions, with compatible fallbacks for older packs.
Exact replacement rectangles remove old pixels before compositing, including
transparent profile-mouth edges. Eye/mouth footprints are disjoint.

Breathing lifts only the lower chest by one native pixel, with the lower four
rows anchored. The band begins at row 112 for front/three-quarter/head-tilt and
108 for profile, below the brooch. Face, hair, neckline and ornaments stay intact.
Different emotion periods range from 3.6 to 5.6 seconds. Rendering remains palette
limited, binary-alpha, integer-scaled and nearest-neighbor.

## Observed coverage

Each row passed rest, half/closed blink, small/open speech, breathing alone,
combined playback, emotion change and speech-end restoration. Every row was
reviewed against original generated expression art and the retained identity.

| Angle | Neutral | Smile | Happy | Sad | Angry | Surprised |
| --- | --- | --- | --- | --- | --- | --- |
| Front | Pass | Pass | Pass¹ | Pass | Pass | Pass |
| Three-quarter left | Pass | Pass | Pass¹ | Pass | Pass | Pass |
| Left profile | Pass | Pass | Pass¹ | Pass | Pass | Pass |
| Right head tilt | Pass | Pass | Pass¹ | Pass | Pass | Pass |

¹ Already closed happy eyes intentionally hold, rather than opening during a blink.

The Firefox review covered all **216 manual combinations** (six emotions × three
eye settings × three mouth settings × four angles), then six seconds of breathing
alone and 8.8 seconds of combined natural blink/speech/breathing for every emotion,
with all four angles playing together. This covers a complete breathing cycle and
multiple blink cycles for each applicable expression. The live sequences were
captured at their actual cadence for normal-speed review, with native phase boards
used to inspect every observed face shape. Changing frame counts were diagnostic
activity information, not the basis of artistic acceptance.

After each speech loop the correct resting mouth returned. Emotion switches during
closed-eye speech used the new mood immediately, without old eye or lip fragments.
All four angle switches during playback retained their correct silhouette and
facial landmarks. There were no double mouths, ghost eye whites, clipped profile
lips, scale jumps or moving brooch seams in the reviewed sequences.

Pause/reduced-motion held the frame. Scrolling the portrait offscreen suspended
motion and returning resumed it. Headless Firefox kept `document.visibilityState`
visible when another tab was focused, so a real OS-hidden-window suspension was
not independently reverified; its existing shared handler was unchanged. Desktop
review used 1440×1200; mobile used 390×844 with no horizontal content overflow.
No runtime page errors occurred during the recorded playback review.

After final publication, Firefox loaded revision `ff05ed0fddcc` with verified
metadata and all four canvases. Actual dialogue was started in angry, changed to
sad, restarted and allowed to finish; the correct sad resting mouth returned.
`installed-final-compare.png` and `installed.json` record this final installation.

## Openable evidence

Evidence is in `output/playwright/yae-sharp-repair/`:

- `*-all-combinations.png`: all manual eye/mouth combinations per angle.
- `*-live-playback-phases.png`: actual combined-playback face phases per angle.
- `all-emotions-breathing.png`: both complete native breath shapes for all 24 states.
- `emotion-transition-frames.png`: all six mood changes during closed-eye speech.
- `speech-restoration.png`: the correct rest after speech for all 24 states.
- `neutral-actual-playback.webp` through `surprised-actual-playback.webp`: actual
  normal-speed Firefox sequences, all four angles, approximately 8.8 seconds each.
- `final-playing.png`, `mobile-portrait.png`: installed desktop/mobile preview.
- `manual.json`, `playback.json`, `playback-summary.json`, `lifecycle.json`: raw
  captures, observed cadence and lifecycle observations.

Authoring/review WebPs and enlarged source PNGs are excluded from runtime downloads.
The complete style includes the atlas, manifest and all 24 served reference PNGs;
its exact byte count is in `sizes.json`, below 250,000 bytes. Only the selected
animated pack loads. The catalogue revision hashes the atlas and manifest together
to invalidate the bundle/poster cache after installation.

The scoped installer publishes only this new Sharp cel folder, its catalogue entry
and the shared renderer/studio modules into the running integration worktree. No
gameplay body, other style or broad social-app sync was changed. No agents,
application test suites, lint/type checks or production builds were used. The
Firefox interactions and native image processing were the requested visual review
and authorized production work.
