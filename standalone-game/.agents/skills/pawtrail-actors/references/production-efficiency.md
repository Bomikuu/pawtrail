# Reuse-first actor production

Use for new actors and relevant production revisions. Preserve the owner's
artwork-first order, style choice, approved designs, omitted stages and current
verification permissions. Early checks are part of the existing stages; they do
not introduce extra approval questions or replace final acceptance.

## Carry forward the working pipeline

Read the actor brief, selected-style manifest and relevant exporter once. Inventory
approved and missing assets before generation. Reuse the shared rig/actions,
portrait playback, painted-part illustration renderer, icon frame, preview and
registration contracts. Generate only missing identity-specific artwork or a
demonstrably inadequate source. Request static turnarounds only where geometry
is ambiguous. Keep new tooling separate from routine character production.

Use Aurelia's measured Refined cel export as a working recipe, not as permission
to copy her face, artwork, UV coordinates or emotion behavior to another actor.
Other styles keep their own proven settings and visual requirements.

## Catch face and icon failures early

- **Portrait stage:** inspect the first angle sheet's existing neutral rest,
  half/closed blink, small/open speech and a demanding emotion at the final native
  size. Compare eyes, jaw, hair, ornaments, face scale and stable feature positions
  across those drawings. Fix extraction/registration or the affected artwork
  before generating remaining angles. Avoid a separate sample generation when
  the first sheet already supplies these states. Retain authored complete frames,
  character-specific eye behavior and the requested full matrix.
- **Icon stage:** start from the approved normal illustration, with three-quarter
  framing unless changed by the owner. Inspect the actual 40 px artwork inside
  the existing 48 px wood frame, plus an integer enlargement, before integrating
  it or starting the model. If the crop loses eyes, chin or identity, generate
  dedicated coarse artwork designed for that native size. Keep readable eye and
  hair clusters and comparable visible face size; shrinking a fine illustration
  alone is insufficient. Reuse the frame and selected glow.
- **Model stage, after artwork:** first fit this actor's authored open/half/closed
  eye textures to the curved head with the actual fringe and nearby collar or
  shoulder silhouette present. Review front, three-quarter and side at gameplay
  and inspection sizes. Check eye placement below bangs, jaw outline and face
  separation before expanding the costume/cape. Fit UVs to this face rather than
  copying another actor's crop coordinates. Preserve the common rig and actions.

These checks narrow the cost of a repair. They do not approve the unbuilt angles,
emotions, costume, moving cloth or action set.

## Proven Refined cel portrait export

The current reusable function is `portraits(job, actor_id, actor_name,
happy_closed_poses)` in the game's `scripts/prepare-sieghart-revision.py`.
`scripts/prepare-aurelia-assets.py` demonstrates explicit actor/job parameters.
Use the parameterized function for a new actor; running a legacy actor's default
CLI can target that old actor. Inspect its current signature before adapting it.

Working baseline for this existing complete-frame contract:

- Native cells **96 × 120**, nearest-neighbor resizing, no dithering.
- Three angles, six emotions and five authored face states, plus complete-frame
  breath variants: 90 source drawings / 180 packed frames for this contract.
  Honor a different explicitly requested contract instead of forcing these counts.
- Clear invisible RGB only where alpha is zero before palette selection.
- Pillow `FASTOCTREE`, **48 colors including transparency** initially;
  lossless WebP with `method=6`, `exact=True`.
- Compact JSON manifest and optimized indexed PNG reference stills. Preserve
  all required metadata, source registration, timings and review artifacts.
- Check this actor's face/extraction and chest-breath boundaries on the early
  sample. Reusing the exporter does not approve a fixed crop or breath cut line
  that moves the chin, eyes or rigid ornaments on a different drawing.
- Measure the **complete style bundle**, including its manifest and shipped
  reference stills, against the current **300,000-byte** limit. Keep source files
  and temporary encoding probes outside the measured runtime staging folder.

Aurelia's full pack fit at 48 colors: **289,795 bytes**. This is evidence that
the recipe works for that pack, not a size guarantee for future artwork.
For a fitting, visually acceptable export, stop encoding and proceed to review.
If it exceeds budget, first remove accidental runtime duplicates/probes and
compact lossless metadata/reference exports. Then use the existing bounded
palette fallback **40 → 32 → 24** only as needed, inspecting eye colors, facial
lines, ornaments and all affected states before accepting a reduction.

Do not restart AVIF/lossy-WebP/alternate-codec experiments for each actor. If the
working recipe cannot satisfy both fidelity and budget, state the concrete
failure and make a scoped adjustment; do not silently remove required states,
change art style, overwrite originals or leave the pack over budget. Keep the
portrait limit separate from illustration, icon, model and total actor sizes.

## Batch final review without repeating setup

Freeze the candidate assets/bindings for the review batch. Reuse one Firefox
session and discover accessible control names from a fresh snapshot; visually
capitalized text may have lowercase accessible names. After a missing-control
timeout, inspect and correct the locator before rerunning the affected batch.
Use bounded waits for real loading/animation cycles rather than repeated default
timeouts. Avoid source hot-reloads during an active capture batch.

Keep the complete [visual acceptance](visual-acceptance.md) and
[action review](action-review.md): every applicable action at multiple moments,
movement layering/return, all requested portrait combinations, native icon,
normal/enraged hair and cape loops, moving face effects, dialogue, shadows,
circle, pause/restart and reduced motion. Source samples, logs, timestamps or
hashes do not replace actual visual review. Early checks never authorize tests
or browser work beyond the owner's current permissions.

After a repair, recheck affected outputs and dependencies. Reuse only observations
for exactly unchanged review units; shared exporter/rig/renderer changes require
wider affected checks. Finalize one review record, provenance and byte report.
Record actual time per generation/export/model/review stage and retry cause when
available; report unknown timings honestly. Faster means less duplicated work,
with the same delivery and quality gates.


## Enforce the workflow with reusable tooling

The PawTrail workspace now provides `scripts/actor-job.py`; read its canonical
`docs/actor-production-tools.md` when starting or resuming production. Use its
`init`, `start`/`end`, `import`, `ready`/`export`, `queue`, `capture` and `review`
operations rather than rebuilding per-character timing/capture scripts.

- Persist actor/stage/service starts before the operation, then record completion,
  failure or interruption immediately. Log retry causes. Completed monotonic spans
  survive session loss; unclosed or interrupted durations remain unknown. Separate
  shared and per-actor work, service wait, exports and review. Never sum overlapping
  spans or compare a two-model vehicle package with one humanoid as equal scope.
- Inventory existing usable backgrounds, effects, frames and scaffolds first.
  Record reused-asset provenance. Reuse humanoid/vehicle setup, articulated pivots,
  parking/cockpit/collision controls where appropriate; retain reference-specific
  silhouette, face UV fitting, texture detail and natural secondary motion.
- Await actual image-tool completion, import the returned file atomically, and end
  the generation receipt before exporting. Declare every required source, shared
  extraction recipe, transparency/framing/grid constraints and bundle budget.
  Nonempty-region checks catch fully subtracted parts. Structural readiness never
  approves identity, native icon readability, face consistency or loop motion.
- Freeze the candidate for each review unit. Reuse one isolated Firefox session,
  current control labels and bounded waits. Capture full fields instead of fixed
  crops that lose a moving/dashing actor. Keep the complete action, heading,
  portrait, illustration, dialogue, audio/shadow/circle and relevant gameplay matrix.
- Inspect evidence before explicitly recording pass/fail. The queue retains captured
  but unapproved, failed, blocked and stale cases. Resume unfinished units after
  interruptions. Bind results to the exact dependency/evidence bytes: model geometry
  changes re-open its actions/headings/likeness; illustration-only changes do not
  discard unchanged portrait results. Shared rig/playback changes require broader
  affected review. Include actual static model imports, runtime assets, bindings,
  package versions and computed dependencies in the manifest inventory.

The Rika/Peony manifest and direct exporter gate demonstrate the contracts without
regenerating their approved assets. Do not relabel their historical timings or
old visual evidence as fresh tooling runs. No new universal time promise follows
from a faster exporter. Spend improvements on eliminating repeated preparation,
missing-source exports, stale captures and locator retries; preserve every quality
check and the owner's current no-agents/no-automated-tests restriction.
