# PawTrail portrait integration

Read the workspace AGENTS.md. The standalone game and integrated social worktree
are separate; mirror only authorized portrait files/assets, not the broad game sync.
Keep actual installed shadcn controls, Tailwind layout and existing font roles.
Prefer Firefox for authorized browser review. Don't introduce agents or application
tests/builds/checks when the owner has prohibited them.

`scripts/prepare-portrait-frames.py` reads `eyesClosedAtRest` from each
pose/emotion's performance data. Inspect the drawings and set that value explicitly;
a happy portrait can have open eyes in one angle and closed eyes in another. The
closed-eye hold applies only where the resting artwork actually has closed eyes.

## Shared runtime, specific artwork

**Current owner preference:** complete-frame playback. The V1/V2 facial-patch
performance was rejected. Preserve old packs as a compatibility path, not as
templates for new art or as evidence of current aesthetic acceptance.

**Style classification correction:** the owner retained the V3 whole-frame art as
**Refined cel**, under `yae-miko-refined-cel` in `yae-refined-cel-v1`. It did not
match original Sharp cel. The fresh `yae-sharp-cel-rebuild-v1` job replaces its
deleted legacy exports using original Sharp cel references and complete frames.
Its source, performance, size, publication and review records are independent of
Refined cel. Historical V3 folder/prompt names do not make its art a Sharp cel
reference. Read [style contracts](style-contracts.md) before generation.

- `src/components/game/shared/living-portrait.tsx`: lazy loading, neutral profile
  snapshot, animation, pause/reduced-motion/offscreen lifecycle and dialogue display.
- `src/game/actor-rig/photo-portrait-renderer.ts`: native authored collection playback.
- `src/game/actor-rig/portrait-renderer.ts`: shared renderer interface and legacy
  layered portrait adapter. Legacy assets are not an excuse to reuse generic faces.
- `src/game/actor-rig/portrait-motion.ts`: native breathing implementation.
- `src/game/actor-rig/portrait-display.ts`: fixed opaque-content bounds and integer
  nearest-neighbor presentation for live and actual reference images.
- `src/game/actor-rig/photo-portrait-catalog.{ts,json}`: character/style IDs, asset
  folders, revisions and measured sizes.
- `src/components/game/photo-portrait-studio.tsx`: `/play?preview=portraits`, character
  chooser, styles, Compare, reference display and manual/playback controls.

Use the shared Canvas 2D path. The owner replaced the rotatable 3D bust with 2D
art to preserve the illustration. No Three.js/GLB is needed for these dialogue
portraits. Gameplay rigs remain separate. Keep the character's recognizable hair,
glasses, eyes, accessories, outfit and torso framing. Preserve approved portrait
details such as Maya's illustrated nose; don't force the gameplay body's generic
face policy onto an independently approved illustration.

The existing version-2 runtime shape is:

```
manifest.poses[pose].expressions[emotion] = {
  base: fullRestFrameId,
  blink: [halfFrameId, closedFrameId],
  talk: [restDeltaId, smallFrameId, openFrameId],
  reference: actualRestPngPath,
  blinkRegions: [[x, y, width, height], ...],  // optional replacement footprint
  speechRegions: [[x, y, width, height], ...], // optional replacement footprint
  blinkPerformance: { sequence, durationsMs, idleDelayMs },
  speechPerformance: { sequence, durationsMs },
  breathing: { periodMs, risePixels, torsoStartY, anchorRows }
}
```

These indices already allow unique artwork per pose and emotion. Composite from
a cleared canvas, selected full base, current compatible blink and mouth layers;
never accumulate deltas. Restore the selected resting mouth after speech.
Keep automatic profile snapshots steady and neutral. The runtime uses bounded
caches and visibility/pause controls; don't fork a renderer per person or style.

The shared reader now consumes these optional per-expression timing and breathing
values, falling back to the style-level values for older packs. The auto-blink
reader currently uses the first idle-delay entry and a fixed 700ms cycle allowance;
do not claim randomized blink timing from the second entry. The internal manual
mouth key remains `round` for compatibility, but the control says **Open speech
shape**: its artwork must fit the emotion rather than always being a rounded O.

For authored replacement patches, the renderer clears only the exact run rectangles
in `blinkRegions` or `speechRegions` before drawing that channel. This supports
transparent profile-lip changes without leaving a second mouth behind. Eye/mouth
replacement footprints must not overlap. Resting speech uses an empty delta and
does not clear the resting mouth. Older packs without regions retain source-over
compositing. Timing, masks and breathing data are part of the performance, not
metadata that can be copied blindly from another character or angle.

## Complete-frame packs (current workflow)

### Smooth painterly packs

Sieghart's `sieghart-painterly` collection is the first mature painterly-anime
option. Keep its complete-frame playback and smooth display metadata separate
from the existing pixel styles. The shared reader accepts `portrait.avif` as well
as PNG/WebP atlases; browser decoding still returns ordinary complete images.
The manifest uses `filter: "smooth"`, while catalogue metadata uses
`rendering: "smooth"`. Shared display fitting then uses smooth scaling; approved
pixel styles retain integer zoom and nearest-neighbor display.

For textured painterly packs, inspect transparency before spending time on many
WebP quality attempts. Near-opaque alpha noise and invisible matte RGB can consume
more bytes than the visible face. Clean only generation residue, preserve actual
edges, and optimize encoding. The scoped `scripts/prepare-sieghart-assets.py`
exports 108 complete 144×180 frames to an AVIF atlas, including its pre-exported
torso breaths, and keeps compact PNG reference thumbnails. Its measured whole
style is 289,411 bytes at the recorded quality. These are this asset's measured
settings, not universal quality/alpha thresholds for other artwork.

Keep full-quality authoring sources, disclose lossy encoding and actual size,
and inspect the decoded result in the target browser through all requested
angles/emotions, speech, blinking, breathing and transitions. Do not promise that
AVIF or those settings will fit every new face, remove states to meet a cap, or
substitute a coarse pixel palette for an explicitly selected painterly style.

New/rebuilt jobs default to **front, three-quarter and head tilt**, without a side
profile, and **300,000 bytes maximum per complete style**. Keep the requested pose
list and byte budget explicit in the job configuration. Historical source folders
and production/capture helpers may assume four poses or a 250,000-byte guard;
align those inputs, export/publication guards, catalogue counts and review grids
with the current job before use. Do not generate an unused fourth sheet or reduce
the palette to satisfy an obsolete 250 KB limit. Keep original four-angle design
references and existing published packs unless their replacement is requested.

The shared importer now accepts `source.json` fields `poses` (ordered pose IDs)
and `nativeMargin`. The packer/publisher honor `budgetBytes`, defaulting to 300,000
for new work. Publication records `poseIds`; the gallery and decoder use those
IDs for available controls and required source validation. Legacy catalogue entries
without `poseIds` keep their four-angle behavior. Use explicit job inputs rather
than generating an unused profile sheet to accommodate an older helper.

Version 3 `kind: authored-frame-portrait` stores each pose/emotion's complete
`rest`, `half`, `closed`, `small` and `open` images. State entries reference full
frame IDs for resting/raised idle-breath variants. A complete blink takes priority
over speech; unsupported combined faces are not invented. `eyesClosedAtRest` skips
automatic blinks for already closed happy eyes.

`scripts/prepare-portrait-frames.py` packs complete native PNGs. The Yae Miko trial
imports whole generated cells via
`output/imagegen/yae-sharp-cel-complete-v3/import_frames.py`; it does not extract
facial parts. Its records include generation paths/prompts, whole-frame native
registration and source hashes. It isolates whole characters from uneven gutters
without dropping nearby detached ornaments. Inspect full original sheets too.

The trial retains 96×120 dimensions with 15 opaque palette colors plus transparency.
It losslessly Brotli-packs complete palette-indexed frames in `portrait.frames.br`.
This is image decoding, not facial compositing: expand once, then copy one immutable
full ImageData frame. Caches remain bounded. Idle breathing applies only to rest;
supplied blink/speech frames play unchanged. That historical trial counted four
neutral posters; new default jobs count three. Other resting images are read from
the same full pack.

Use native Brotli DecompressionStream when available. The integrated Next app
has a public HTTP adapter from `scripts/templates/portrait-frames-route.ts` for
older browsers, using ordinary HTTP Brotli decoding without a JS/WASM download.
Standalone deployments targeting older browsers need equivalent HTTP encoding
support. Observe the actual target browser rather than assuming support.

The studio's **Exported asset frames** strip shows decoded full images without
playback and pauses the large preview on selection. **Hold resting frame** reads
the same pack; it is not an independent original-art reference. A paused image
match proves transport, not artistic approval. Keep original sheets openable and
review normal-speed acting with one-style gates.

## Approved static style examples

The existing five pixel directions can be inspected in
`output/imagegen/photo-character-poses-v2-detail/style-{1..5}-poses.png` and
`output/imagegen/pink-shrine-portraits-v1/style-{1..5}-poses.png`. Use these only
as static style/identity references appropriate to the brief. Their existence does
not approve any later animation, and another character's features are not a skin
template for a new portrait.

## Existing exporter limitation — do not copy this failure

`scripts/prepare-portrait-collection.py` writes version-2 collection packs, but its
current authoring input loads `pose.closed`, `pose.half` and `pose.speech` **once
outside the emotion loop**. `featureByEmotion` adjusts geometry, not the identity
of those source images. Its default behavior therefore borrows neutral acting for
different emotions. Distinct exported IDs do not prevent this visual mismatch.

The V1 `output/imagegen/pink-shrine-emotions-v1/author_expressions.py` also constructs
expressions using threshold-derived contextual feature masks on the neutral base.
The owner rejected the Sharp cel result. Treat this collection as a regression
case, not an approved production template. Its previous partial screenshots,
resting-source matches and changing frame counts did not establish acceptance.

For new/fixed performances, bind genuine emotion-compatible sources for every
required pose/emotion, or author complete motion frames. Extend the exporter to
read those sources when implementing a repair; keep the legacy schema only as a
compatibility path for existing assets. Reuse may be justified by observed identical
anatomy/brow/intent, not simply by a matching crop rectangle. Preserve originals
and don't rerun a legacy exporter over approved packs without a specific reason.

## Authored performance compiler

`scripts/prepare-authored-portrait-performance.py <performance.json>` reads complete
five-column (rest, half, closed, small speech, open speech) by six-emotion sheets
for each angle, its approved body, native palette, explicit source-grid registration
and hand-authored anatomical masks. Emotion-compatible artwork is selected inside
the emotion loop. Source-over/RGB threshold feature extraction is not used. Masks
can include anatomical holes; the compiler makes their replacement footprints
disjoint and emits exact clearing rectangles. It preserves complete native rests
and diagnostic motion frames beside the runtime atlas.

`output/imagegen/yae-sharp-cel-repair-v2/performance.json` is a concrete **Sharp cel
only** production example. Its four angles were registered independently; already
closed happy eyes intentionally hold while happy speech remains animated. Its
breathing band is below the brooch, not across the face or neckline. The compiler
always exports `reviewStatus: candidate` and pending coverage. After regeneration,
repeat the visual gate; never copy a prior verified status to new art. The
superseded V2 review is `docs/implementation/yae-sharp-cel-performance-repair.md`;
the owner rejected its patch-based result. Use the complete-frame workflow above
for new work. Do not copy that character's old calibration or acceptance.

## Pixel production and registration

Inspect identity and style references separately. Retain complete expression bases
and actual source provenance. Use manageable sheets; verify actual grid pitch,
counts and complete cells. Do not derive cell pitch solely from canvas width if
the generated final column is truncated. Reject incomplete required artwork and
reauthor it rather than quietly using a surprised mouth for speech.

Calibrate the actual native source for each style, pose and expression. Left/right
eyes, brows, lips, masks and torso boundaries belong to the performance data.
Don't carry an earlier drawing's anchors forward. Translation-only contextual
motion islands must preserve shade, emotion and contour; a copied threshold mask
is not proof of that. Native exports remain palette-limited, with binary alpha
and hard edges. Do not upscale source files merely to change their display size.

Use fixed union content bounds with a native-pixel allowance to fit the visible
portrait, not transparent padding. Keep the bounds fixed across emotions and
motion so the face does not jump in scale. Compare and single previews use the
same fitting component. Avoid CSS scaling the face for breathing or adding blur
to hide a poor animation transition.

## Budget, catalogue and delivery

Current complete-style cap is **at most 300,000 bytes**, counting compressed atlas,
JSON, any base/mask and served reference/poster PNGs for all requested angles and
emotions. Count actual files; a ZIP estimate or per-frame count is not the budget.
Report runtime, optional reference aids and local generation/review/archive sizes
separately. Load only the selected animated pack. Original photos and decorative
portrait assets do not become identity evidence or backend welfare/reward data.

Use character-specific style IDs and catalogue character metadata. Preserve the
prior collection behind the character chooser. Hash atlas/manifest into revisions
that invalidate bundle, decoded image and poster caches together. Publish the
passed candidate's assets before its catalogue entry references them, and confirm
the installed result with the permitted visual review. A style is ready only
after its [complete visual gate](verification.md), not merely because it exports
and fits the byte cap. Keep authoring/review assets out of runtime downloads.
