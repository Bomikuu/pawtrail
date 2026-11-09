# Sharp cel · fresh rebuild

Requested reset: remove the existing Yae Miko Sharp cel implementation and build
fresh using the updated portrait workflow. Refined cel remains a separate style.

The reset removes the old Yae Miko Sharp cel catalogue entry, its four published
legacy folders in both workspaces, and the corresponding old local runtime packs.
Original style-reference sprites are preserved as inputs. Exact deleted paths
and the start timestamp are in `output/imagegen/yae-sharp-cel-rebuild-v1/reset.json`.

## Generation and style gate

Four built-in ImageGen edits use templates containing literal repeated copies of
each original Sharp cel sprite. Those originals are the only image/style inputs;
no Refined cel drawing or rejected facial patch is used. The generated front was
compared at native zoom with the original before the other angles were generated.
The gate checks narrow eyes, angular jaw/hair clusters, stepped contours, flat
shadows, restrained highlights and simplified ornaments, separately from motion.

`front-prompt.txt`, `other-prompts.json` and `prompts.json` retain exact prompts.
`generated-sources.json` records original output paths, local copies and inputs.
All four source sheets remain untouched. Native exports use whole-character
registration, 96×120 dimensions, nearest sampling and a subset of the original
palette within its 24-color maximum. No eye/lip/jaw extraction or runtime face
painting is used.

Happy's already closed eyes hold the full happy resting drawing in blink slots;
the generated wink variants remain available as authoring art. All other blink
and speech states use their complete authored portraits. A full blink briefly
takes precedence over speech. Idle breathing has complete pre-exported frames.

## Reused production path

The shared full-frame renderer, lossless indexed/Brotli asset format, preview
inspector and HTTP compatibility adapter are reused. The importer/publisher now
take independent job configuration rather than reading a rejected runtime pack.
The new Sharp cel assets live in `yae-sharp-cel-rebuild-v1`; the previous folders
and cache revisions cannot be selected accidentally.

`scripts/publish-portrait-pack.py` upserts only the intended character/style ID.
The old split-publication command now publishes the independent current packs;
it cannot restore the deleted reference-only or rejected Sharp cel variants.
Refined cel's artwork and animation data are unchanged.

The exact final byte counts, installed revision, visual review coverage and elapsed
time are recorded in the job's `sizes.json`, `publication.json` and `review.json`.
The timing includes generation, native production, installation and visual review.
No agents, application automated tests, checks or builds are run. The requested
visual review uses Firefox and stores captures in
`output/playwright/sharp-cel-rebuild/`.
