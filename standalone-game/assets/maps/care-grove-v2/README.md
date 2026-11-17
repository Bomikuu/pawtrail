# Care Grove — reference-led generated art revision

Open `/play?preview=stage&map=care-grove`, or **Files → Sampaguita Care Grove map**.
The previous layout/assets remain in `assets/maps/care-grove-v1/`.

## Art

Built-in image_gen produced six new source images based on the owner's retained
reference screenshot: continuous woodland ground, weathered stone hall, fir,
rocky mossy cliff, dry scrub and gnarled bare tree. Exact generation/refinement
prompts are in `prompts.json`; original generated sources stay in `sources/`.
The cliff and bare tree required a background-extraction refinement to remove
unwanted colored haze. Runtime crops/scales are native nearest-neighbor exports,
not another art-generation process.

The ground is a continuous 1024 × 768 terrain painting. It contains only grass,
worn earth and irregular stone paving; buildings, scenery and interactive items
are separate objects. There is no repeating square tile pattern in the base
painting. The editor grid starts hidden and stays hidden in Play. Enable Grid
in Edit only when needed for layout work.

Objects remain movable, with independent ground collisions and authored
furniture contacts. Existing benches, garden door, lamps, feeding station and
planters retain the real local controller. The stone hall is scenery, without
an enterable interior or a new overworld portal. Care state is local and resets
on leaving Play.

## Editing and saves

Paint tiles over the continuous ground; Erase reveals the terrain painting.
Stage settings includes a Painted terrain selector. Choosing a different Base
floor switches to that floor rather than silently hiding it under the painting.
Resizing does not stretch the painting; newly exposed area uses the base floor.
JSON import/export and local saves preserve the registered `groundArt` ID.
There are no external paths or scripts accepted from stage JSON.

Save locally remains explicit. Opening the template does not overwrite a saved
user draft. Source art and large references stay outside runtime imports; only
native exports are served, and scenery/terrain retain offscreen culling.

## Production files

- Source art/prompts/journal: `assets/maps/care-grove-v2/`.
- Runtime registry: `src/game/stage-editor/grove-art.json`.
- Layout: `src/game/stage-editor/maps/care-grove-v2.json`.
- Served layout: `public/pawtrail-game/stages/care-grove-v2.json`.
- Served art: `public/pawtrail-game/map-art/care-grove-v2/`.
- Native exporter: `scripts/prepare-care-grove-v2.py`.

Native overview review is separate from gameplay verification. No automated
checks/tests/builds, agents or browser verification are authorized for this
revision; actual walking, contact alignment and interaction playback remain
pending owner review.
