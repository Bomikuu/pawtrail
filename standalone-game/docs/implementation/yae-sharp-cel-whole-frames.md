> **Style correction:** the whole-frame artwork was retained as **Refined cel**,
> not Sharp cel. See [the style contracts](portrait-style-contracts.md). Original
> Sharp cel references are separate; their matching animation remains pending.

# Yae Miko · Sharp cel · whole-frame trial

The owner chose complete authored images after rejecting the V1/V2 facial-patch
preview. The current trial is installed at `/play?preview=portraits`, Yae Miko →
Sharp cel, revision **`746b25fdf7c0`**. Other styles and gameplay bodies are unchanged.

## What plays

The player selects one complete portrait image. It does not draw eyelids, move
mouth patches, combine facial features, morph emotions or deform the chest.
Each of four angles has six emotions and five complete states: rest, half blink,
closed blink, small speech and open speech. All **120 authored cells** are retained
and referenced. Twenty-four pre-exported idle-breath variants bring the total to
144 full frames. Blink/speech drawings otherwise play unchanged.

No combined blink/open-mouth image was supplied, so a blink briefly takes priority
over speech; speech resumes afterward. Happy's already closed eyes skip automatic
blinking. Manual frame inspection can display every actual supplied drawing. This
avoids fabricating unsupported facial combinations.

## Use of existing artwork

The original complete portraits and later expression sheets remain the reference
for character identity, costume, palette and acting. Inspection found chin/neck
fragments already baked into some old native PNGs. A direct repack preserved those
defects, so that candidate was rejected rather than presented as a repair.

Four built-in ImageGen edits produced missing complete 5×6 bust sheets using those
retained sources. No fallback image API was used. Originals and exact prompts are
in `output/imagegen/yae-sharp-cel-complete-v3/generated-sources.json` and
`prompts/exact-prompts.json`. The 120 complete cells are imported without extracting
eye, lip, nose or jaw pieces. Whole characters receive one uniform scale per angle
and a whole-image placement at a fixed center/bust baseline.

Generated gutters are uneven. The importer takes a small crop allowance, isolates
the complete character and nearby ornaments, and excludes disconnected fragments
from neighboring cells. This fixes the clipped hair and stray sprite fragments
found during review. Native exports retain 96×120 pixels, binary alpha, nearest
sampling and a 15-color opaque palette. Source originals remain unmodified.

## Size and loading

| Served assets | Bytes |
| --- | ---: |
| Complete-frame data + manifest | 232,757 |
| Four neutral PNG posters | 13,769 |
| Complete style, six files | **246,526** |

The complete style is below 250,000 bytes. Enlarged source sheets, 120 native
authoring PNGs, prompts and review captures are not additional game downloads.

Whole frames are losslessly palette-indexed and Brotli-compressed as one asset.
The loader expands that image data once; playback copies an immutable full frame.
There is no runtime face construction. Decoded-frame and bundle caches remain
bounded. Older integrated browsers can use the narrow public HTTP Brotli adapter
instead of native DecompressionStream support; no JS/WASM codec is downloaded.

## Preview controls

**Exported asset frames** shows five decoded complete images for the selected
pose/emotion. Selecting one pauses the large preview on that image. Play restores
natural blinking/speech controls; Reset returns to the neutral animated front.

**Hold resting frame** displays the selected complete resting image. Motion
controls are disabled while it is held. It is a frame from the same runtime pack,
not a separate artistic authority; original generated sheets are retained for
comparison. Independent blink/open-mouth combinations are unavailable because
there is no authored combined drawing. The UI reflects that restriction.

## Visual review

Firefox review used 1440×1250 desktop and 390×844 mobile viewports. Six actual
normal-speed combined sequences, about 8.2 seconds each, showed all four angles
simultaneously. Native phase boards and captured playback preserve the observed
cadence. All six emotion changes were captured during a held blink, and actual
dialogue was allowed to finish. No runtime page errors were recorded. Mobile
content width and viewport width both measured 390 pixels.

Evidence: `output/playwright/yae-complete-frames/` contains the final inspector,
mobile/Compare screenshots, `*-actual-playback.png` phase boards, six
`*-whole-frame-playback.webp` normal-speed captures and raw playback JSON. A
separate idle review captures complete breathing cycles for all 24 pose/emotion
states. The HTTP fallback was observed in Firefox with native Brotli stream
construction deliberately unavailable; the requested frame rendered correctly.

Earlier repack and gutter diagnostics are historical evidence, not current
acceptance. The current pack is marked **trial**: functional and visual playback
coverage does not assert that the owner has approved the artistic result. Any
remaining drawing variation must be repaired in the complete source frames,
rather than hidden with procedural facial patches. Review another style afresh.

No agents, application test suites, lint/type checks or production builds were
used. Image processing and the requested Firefox visual review were scoped to
this portrait. Only its assets, catalogue entry, shared portrait modules and
public art-transport adapter were mirrored to the running app.
