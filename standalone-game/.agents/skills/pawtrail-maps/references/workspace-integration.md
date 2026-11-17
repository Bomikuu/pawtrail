# Current PawTrail map integration

Source inspection snapshot: 2026-11-15. Paths below are workspace-relative.
Re-read the relevant live definitions before implementation; do not assume a
file's presence means every asset or feature is registered in every renderer.

## Asset sources

| Source | Relevant content |
| --- | --- |
| `assets/pixel-art-v1/manifest.json` | Native 32px tile size, top-down three-quarter perspective, upper-left light, atlas rectangles and connection masks |
| `assets/pixel-art-v1/native/terrain.png` | Eight grass variants; dirt, stone, brick, concrete, asphalt, sand, gravel; connected paths; shore/inner-water pieces; grass/dirt transitions |
| `assets/pixel-art-v1/native/environment.png` | Trees, bushes, flowers, pots, fences/gates, bench, lamp, rocks, signs and animal-care props |
| `assets/pixel-art-v1/native/buildings.png` | Homes, shelter, vet, shops/store, bamboo house and resting pavilion |
| `public/pawtrail-game/game-assets/` | Served world atlases and `world-manifest.json`; source sprite paths are not interchangeable with public URLs |
| `src/game/housing/community-art.json` | Registered individual community/nature cutouts, including trees, shrubs, benches, fence/gate, shelter, fountain and care station |
| `src/game/housing/catalog.json` | Furniture, native facings, styles and geometry; use its current entries rather than duplicating definitions |
| `assets/furniture-studio/` | Furniture source views, sprite manifests, masks and prior production records |

Useful existing names include native `large_tree`, `small_tree`, `flowering_tree`,
`rocks`, `wooden_sign`, `fence_gate`, `wooden_bench`, `cat_feeding_station`,
`rescue_shelter` and `resting_pavilion`. These are **source-manifest IDs**, not
automatically valid stage asset IDs. Registered furniture examples include
`garden-bench`, `garden-pot`, `garden-feeding`, `garden-banana`, `garden-lamp`,
`garden-bush` and `community-bench`. Inspect each current facing and geometry.

The current stage registry prefixes furniture with `f:` and community scenery
with `environment:`. A source sprite on a sheet needs a correct registry adapter
before the editor importer can place it. Register its actual source rectangle,
anchor, footprint and supported facings; don't supply arbitrary file paths in
imported stage JSON.

## Tile indices and registration gaps

Read `src/game/stage-editor/data.ts` and `native-assets.json`. Care Grove's
scoped exporter now registers all 127 existing terrain frames, 36 scenery props,
9 buildings and six integer 2× large scenery variants. Native scenery uses the
`native:` prefix and actual source rectangles, anchors and ground footprints.
Existing community cutouts retain `environment:` IDs. All remain registry-owned;
imported stage files cannot inject external asset paths.

Terrain IDs keep their zero-based frames, with labels derived from the real
manifest rather than the old five-entry approximation. Frame 9 is stone and
11 is concrete. Water/shore cells have blocking metadata consumed by rehearsal
navigation. Do not rely on labels alone. Broad dirt paths use solid dirt for
fully surrounded cells; cross-connector art has grassy corners and creates a
repeating hole pattern if used throughout a wide road.

Native connection bits are north=1, east=2, south=4, west=8. Connected families
include `dirt_path_0..15`, `stone_path_0..15`, `brick_path_0..15`,
`gravel_path_0..15`, `water_shore_0..15` and `road_0..15`. Inner shore corners and
grass/dirt transition pieces have their own entries. Follow their authored
semantics; not every family is interchangeable.

Stage terrain frames are zero-based. World Tiled terrain IDs use `firstgid=1`,
so their GIDs are the corresponding frame index plus one. The current world
helper computes IDs from sprite coordinates. Extending registered terrain also
requires appropriate navigation/water behavior; the editor cannot infer that
from an image or a label alone.

## Editable stage and local rehearsal

- Route: `/play?preview=stage`; first map: `/play?preview=stage&map=care-grove`.
- Canonical types/registry/importer: `src/game/stage-editor/data.ts`.
- Canvas/placement/depth/native export: `src/game/stage-editor/canvas.ts`.
- Rehearsal actor and collision: `src/game/stage-editor/playtest.ts`.
- Furniture approach paths: `src/game/stage-editor/interaction-path.ts`.
- UI and working behavior: `src/components/game/stage-editor.tsx` and
  `docs/implementation/stage-editor.md`.

`StageDocument` is `format: "pawtrail-stage"`, `version: 1`, with `name`,
`width`, `height`, `baseTile`, `tiles`, `shell`, `wallpaper`, `objects`.
Dimensions are tile counts, currently 8–64 per side. Tile keys are zero-based
`"column,row"` strings. The current importer accepts at most 1,000 objects and
4,096 tile overrides; check current limits before choosing a large map.

Objects have unique `id`, registered `asset`, pixel `x,y`, `elevation`, `layer`,
`bias`, `rotation` and optional registered `style`. Outdoor stages generally
use `shell: false`. `wallpaper` still needs a valid schema value even without
a shell. Derive placement anchors from the registry; the usual bottom-center
cell anchor is `(column*32+16, row*32+32)`.

Supported layer values are only `ground`, `world`, `foreground`. World depth is
ground Y plus bias; elevation offsets artwork without changing ground-Y sorting.
Do not insert conceptual layers such as `canopy` into the enum or claim elevation
implements traversable height. `assetView` resolves an actual furniture facing;
single-facing assets do not gain unseen sides by rotating a bitmap.

The editor already supports JSON import/export, native PNG export, local save,
undo/redo, depth diagnostics and local actor rehearsal. The `pawtrail:stage-editor:v1`
device save is a user draft; don't overwrite it to deliver a new map file.
PNG export excludes authoring overlays and waits for actual images. Exported
stage JSON is not a published world map or an authoritative home/inventory save.

Existing rehearsal includes movement, solid geometry and supported furniture
sit/sleep/rest, door/light toggles and local food/water/plant care via the shared controller. A decorative door or landmark does not
become a scene portal merely by placing it in the stage. Keep additional gameplay
metadata separately documented until the real consuming contract is implemented.

## Collision and actor contacts

`src/game/housing/spatial.ts` owns `footRect`, `worldPoint`, `worldRect` and related
geometry transforms. The current shared foot box is 10 × 6 native units and the
navigation step is 8. Reuse those definitions instead of copying the constants
into an unrelated map controller. Validate comfortable visible actor/outfit
clearance as well as mathematical foot-box clearance.

The housing geometry and `InteractionController` own active-facing ground,
placement, approach, seat, elevation, exit and foreground data. Use the current
catalogue and controller contracts. Art bounds, placement footprints and walking
blockers are distinct. Preserve appropriate collision for trunks, walls and
rocks while keeping visual canopies and passable ground decor usable.

## Connected Phaser world maps

`src/game/world-scene.ts` loads orthogonal Tiled-compatible maps from
`public/pawtrail-game/maps/`. Current layers are `Ground`, `Collision`, `Objects`,
using the tileset name `PawTrail terrain`. Tile sizes are 32 × 32; object positions
are pixel coordinates. Inspect `WorldObject` in `src/game/types.ts` for supported
kinds/properties rather than inventing a new object schema in a JSON export.

`SceneId` is currently the explicit union `neighborhood`, `shelter`, `garden`,
`riverside`. New world destinations require real loader/type/navigation and
spawn/return/save handling. `WorldScene.create` currently has a special direct
query entrance for shelter; arbitrary `?scene=<new-name>` is not a general
implemented route. Report a new entry URL only after its route is connected.

`scripts/prepare-world.mjs` demonstrates the current layer format and adjacency
selection, but executing it copies sheets and rewrites existing maps and their
placements. It is not a safe per-map export command. Reuse its relevant logic
through a scoped production path rather than regenerating unrelated worlds.

Local quests, map progress and Kibble use current game systems. Real community
records, verified rewards and payments remain behind their real adapters and
backend authority. Do not fabricate platform animals/quests in a scenery import.

## Production record and review

### Additional cyberpunk template

`/play?preview=stage&map=cyberpunk` or **Files → Neon Heights cyberpunk district**
opens the separate 48 × 36 **Sampaguita Neon Heights** stage. Definitions are in
`src/game/stage-editor/neon-art.json` and `maps/neon-heights-v1.json`, using
`neon:` registered IDs. `assets/maps/neon-heights-v1/` retains the new owner
reference, prompts, source cutouts, declared inputs, timing and native evidence.
`scripts/prepare-neon-heights.py` exports only this job's art/layout. The north
skyline includes integer 2× variants with stories continuing above the map edge.
This map's neon architecture/palette is a brief-specific override; the approved
Care Grove v5 default still applies to other maps. City holograms, kiosks and
machinery are static scenery with base footprints, no new E actions or interiors.
Actual app walking/loading/occlusion remain pending authorized review.

The later map/asset workflow now requires concept approval before new map
production, animated cyberpunk assets and textured 3D interactive map props; see
the parent skill and `../../pawtrail-assets/SKILL.md`. That skill-authoring change
did not retrofit Neon Heights. Its existing static assets still need a separate
animation implementation; never treat this snapshot as evidence that moving
holograms or building-light loops are installed.

Keep a per-map authoring directory with the brief/job status, reference/input
paths, selected registered IDs and source frames, canonical editable layout,
declared export inputs, output paths, omissions and observed evidence. Only place
runtime files in public/served paths. Use the existing project production recorder
if it supports the actual map operation; don't pass invented map commands to
`scripts/actor-job.py` or use the furniture conversion queue as a map queue.

Honor current AGENTS.md restrictions. Creating a map or exporting native artwork
does not grant agents, broad automated checks/builds or browser verification.
When explicitly requested, review actual walking, occlusion, interaction and
entry/return behavior in the chosen browser. Source data and screenshots alone
do not prove that those behaviors pass. Keep missing observations pending.


## Approved Care Grove production path

The owner approved the v5 visual finish as the default for future maps/assets.
The skill retains the selected village screenshot, accepted native map overview
and scenery sheet under `references/`; see `reference-and-style.md`. This is art
approval, not a claim that live movement/contact/interaction review has passed.

Current installed sources:

| Purpose | Workspace path |
| --- | --- |
| Default editable template | `src/game/stage-editor/maps/care-grove-v5.json` |
| Active generated-art registry | `src/game/stage-editor/grove-art.json` |
| Native served artwork | `public/pawtrail-game/map-art/care-grove-v5/` |
| Production inputs, prompts, timings and evidence | `assets/maps/care-grove-v5/` |
| Scoped native exporter | `scripts/prepare-care-grove-v3.py --revision 5` |

The 32 × 24 stage opens at `/play?preview=stage&map=care-grove` or through the
Files menu. The library's **Village scenery · reference pack** contains the
slate-roof cottage, barrel/crate supplies, handcart and ivy stone wall plus a low
boundary variant, using `grove:village-*` IDs. Added scenery has independent
solid ground footprints. It does not implement a cottage interior or cart-driving
action; existing benches, gate, lights and care items use their real catalogue
and controller definitions.

The exporter accepts per-job `additions.json` and `layout-source.json`, produces
native artwork and layout copies, and preserves the earlier revision's registered
geometry for existing assets. Reuse approved matching art in subsequent jobs;
export only the requested scope. The current script name contains `v3` for
historical compatibility, while `--revision 5` selects the approved finish.

Previous v1–v4 sources/layouts remain useful as history or explicit restoration
inputs, not competing style defaults. `scripts/prepare-care-grove.py` and
`scripts/prepare-care-grove-v2.py` export those earlier appearances; do not run
them expecting the approved v5 finish. The default template is owned by the
current import in `src/game/stage-editor/data.ts`.

## Continuous ground and editable scenery

`StageDocument.groundArt` optionally names a registered terrain-only painting.
Explicit tile overrides remain editable above it; Erase reveals the painting.
Objects, collision and actor contacts stay separate. JSON import/export, PNG
export and local save preserve the painting ID; unknown IDs fail import. Editor
resizing clips or exposes base floor rather than stretching the artwork.

The grid defaults off and does not render in Play. Ground art itself must also
avoid repeated square cell seams; hiding the grid alone is insufficient. A terrain
painting is not proof of navigation, and a flattened scene must not replace
editable objects/interaction contracts. Preserve the user's explicit local save.

Prior native overview/source review is recorded in each production job. Live
navigation, contact alignment and interaction playback remain pending where the
owner has not requested that review. A skill update does not expand permissions.


## Additional village template

`/play?preview=stage&map=village` / **Files → Sampaguita Old Quarter village**
loads `maps/sampaguita-village-v1.json`: 48 × 32 tiles, 12 houses plus a hall,
connected streets, central courtyard and side alleys. `village-art.json` registers
its new ground and two house types; the approved `grove:` pack is reused.
`scripts/prepare-sampaguita-village.py` exports only this stage's new native art,
layout copies and overview/interaction guide. Production records live under
`assets/maps/sampaguita-village-v1/`. This is a separate local rehearsal template,
not an overworld destination or a replacement of Care Grove/user saves. Native
artwork review is separate from still-pending live interaction/navigation review.
