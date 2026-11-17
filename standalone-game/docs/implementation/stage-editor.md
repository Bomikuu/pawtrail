# Stage and room editor

Open `/play?preview=stage` or **Your spaces → Stage & room editor**.
This is a local authoring workspace using the game's installed native assets.
It does not modify a live home, account furniture inventory, construction stock
or Django progress. Existing Phaser world rendering remains unchanged.

## Workspace

The full-height editor puts the searchable asset library on the left, a
pan/zoom stage in the center, and object properties plus render-order list on
the right. Narrow displays use Assets / Stage / Properties panels without
unmounting the canvas. Lists scroll independently of the stage and toolbar.

The library reuses the housing furniture catalogue (including authored facing
and color variants), community/nature manifest, modular wall tiles, six installed
indoor floors and the existing terrain sheet. Thumbnails load when near the
visible asset list. All asset paths come from the installed registry. Imports
cannot supply external images, JavaScript or model paths.

Drag an asset onto the canvas, or select it and click/tap to place. Furniture
and props snap to the existing native 32px ground-anchor convention. Alt-drag
or turning Snap off allows pixel placement. Select and drag an existing object
to rearrange it. Transparent sprite corners do not intercept selection of
objects behind them. The art remains sharp at integer 1×–4× camera scale.
Fit centers at the largest native integer scale that fits; large stages may
still require panning at the 1× minimum.

The tile brush paints individual cells continuously with one undo step per
stroke. Erase removes a selected object, or clears floor overrides back to the
base floor. Room settings control dimensions (8–64 columns/rows), base floor,
wall shell and finish. Starter templates include an empty room, the existing
cozy studio furniture arrangement, and an open garden. Layout changes are
reversible through 40-step undo/redo. Shrinking a stage removes out-of-bounds
painted tiles and clamps object anchors; undo restores the prior layout.

## Depth and placement

Each object has a ground anchor `(x,y)`, pixel elevation, a layer and a depth
offset. Sprite elevation moves artwork above its ground anchor. Ground objects
render first, world objects sort by ground Y plus depth offset, and foreground
objects render last. Elevation intentionally does not change ground-Y sorting.
The ordered scene list corresponds to this draw order.

Depth mode overlays catalogue-derived ground footprints, red same-layer
footprint overlaps, elevation tethers and numbered drawing order. These are
authoring diagnostics; overlap is allowed (e.g. decor on rugs), and no server
placement/navigation validation is implied. Sprite bounds are selection/art
bounds, not full walking collision boxes. Collision/approach geometry remains
owned by the existing housing definitions. Furniture rotations use registered
native facings; single-facing assets are not falsely presented as full 3D.
The selected object also exposes a floating circular rotation control.

## Files

**Save locally** explicitly stores `pawtrail:stage-editor:v1` on this device.
Files includes loading that save, template creation, JSON import/export and a
native PNG export. Loading/templates enter undo history rather than destroying
the previous draft. Imports validate format, version, dimensions, tile and
asset IDs, object count (up to 1,000), numeric bounds, authored rotations and
style references. The local stage schema is separate from multiplayer home
layout APIs; export does not publish or install a playable room.

PNG export waits for the stage's images, captures at native dimensions and
excludes the editor grid, selection, depth overlays and placement ghost. An
asset load failure leaves a selectable fallback and a status notice; PNG export
reports missing assets instead of silently exporting incomplete art.

## Controls

- V: select; B: tile brush; E: erase; H: pan.
- R: rotate selected object through authored facings.
- Delete/Backspace: remove selected; Ctrl/Cmd+D: duplicate selected.
- Arrow keys: move selected by the snap step; Shift+arrows: one pixel.
- G: grid; D: depth overlay; F: fit; +/−: zoom.
- Space+drag or middle-drag: pan; ordinary scrolling also pans.
- Ctrl/Cmd+scroll: zoom the stage.
- Ctrl/Cmd+Z, Shift+Z or Y: undo/redo; Ctrl/Cmd+S: save locally.
- Escape: cancel an active move/brush stroke and return to Select.

Text inputs, selectors, menus and dialogs retain standard typing behavior.

## Sources and verification

- `src/game/stage-editor/data.ts`: installed asset registry, geometry adapters,
  document schema, templates, image cache and strict import parsing.
- `src/game/stage-editor/canvas.ts`: native 2D authoring renderer, tile brush,
  placement, drag/pan/zoom, depth diagnostics and image export.
- `src/components/game/stage-editor.tsx`: shared shadcn/Tailwind workspace,
  history, properties, local save and files.

No generated assets were necessary. This delivery is source-reviewed only;
no agents, automated checks/tests, builds or browser verification were run under
the owner's standing instructions.

## Amber / Yae playtest mode

Choose **Amber** or **Yae Miko** in the command bar, then **Play room**. This
loads the existing refined rig through `prepareCreatorModel` and the creator's
appearance registry. The actor uses `PixelActor`, the shared orthographic/native
pixel finish, the creator world frame/foot anchor, and shared idle/walk/run
clips. It is rendered in the stage rather than installing a new game character.
Character switching during play keeps the current position when walkable.

Play expands the canvas and hides the authoring sidebars. Loading can be
cancelled. **Back to editing** or Escape disposes the rehearsal actor, restores
the previous editor camera and reveals the same stage selection/history.
Pending editor drags are cancelled before starting. No play position, character,
rewards, account state or layout mutations are persisted. Exported stage JSON
and native PNG remain authored-stage outputs and exclude the playtest actor.

Controls:

- WASD or arrows walk, Shift runs; click the canvas to focus movement.
- The existing shared touch joystick is reused below the desktop breakpoint,
  with a hold-to-run button and no unrelated Interact action.
- Respawn chooses a nearby unblocked area near the lower center of the room.
- Grid, Depth, Fit and camera zoom remain available during play.
- D moves right in Play; use the Depth button to change diagnostics.
- Escape returns to Edit. Editing shortcuts are suppressed during play.

Movement uses the game's `movementVector` walk/run speeds and normalized diagonal
input. Integration uses delta time capped at 40ms with axis sliding in <=3px
substeps, matching the room controller's collision stepping. The actual shared
`footRect` (10×6 native units) is tested against spatially indexed collision
rectangles. Furniture reads the active facing's `geometry.ground`, transformed
with the existing housing `worldRect`; nonblocking furniture is passable.
Environment and modular walls use registered footprints, the room shell blocks
its visible walls, boundaries retain the character feet, and water tiles block
walking. Elevation is an artwork offset in this stage format; it does not erase
an asset's ground blocker or implement jumping/climbing.

The actor joins world objects at its ground Y. Ground layers remain behind it,
foreground layers remain ahead, and object depth offsets are respected. Depth
mode in Play shows the actual solid rectangles, the shared player foot box,
and highlighted contact obstacles. The status bar identifies the current
contact. It is a local collision/depth rehearsal, not a server validation pass.
No free spawn produces an actionable error instead of spawning inside a wall.

The rehearsal loop clears input on blur/visibility changes and pauses hidden
or zero-size canvases. Camera following eases only when the player approaches
viewport margins. Avatar resources are released on return to Edit, character
replacement, cancelled loading and unmount.

Source: `src/game/stage-editor/playtest.ts`, integrated by `canvas.ts` and the
stage editor UI. Shared TouchControls gained optional className/showInteract
props with unchanged defaults for existing game callers. Source-reviewed only;
no automated tests/checks, builds, agents or browser verification were run.

## Sit and sleep interactions in Play

Approach a furniture item with authored seats and a `sit`, `sleep` or `rest`
interaction. Within 96 native units of a seat, a contextual prompt names the
furniture and offers **Sit down** or **Sleep**. Press **E** or the prompt button.
The prompt is touch accessible and stays clear of the movement/run controls.
While approaching it offers Cancel; while resting it offers Stand up or Wake up.
New movement input also releases the pose before walking. Escape still returns
to Edit.

This reuses the existing `housing/InteractionController` stages (select,
approach, align, perform, complete, recover), with local/held requests, and the
existing refined actor `sit`/`sleep` animations. No new action clips or artwork
were generated. Both Amber and Yae retain their authored resting face patches
and the shared rig's action props/breathing. No server interaction events or
progress/reward writes are sent by this local controller.

Seat points, approaches, exits and elevation come from the active furniture
facing's `geometry`. Existing housing `worldPoint` handles the authored anchor
and geometry rotation convention. The seat's facing follows furniture rotation;
the sprite uses the catalogue's elevation offset plus the editor object's
height, preserving the exported native pose contract. Multiple-seat furniture
chooses the nearest seat. Non-furniture scenery without human seat contacts does
not advertise unsupported interactions.

A clear approach is selected and reached with the same foot-box collision
checks as walking. `interaction-path.ts` uses a swept direct path or bounded
8px A* search; every edge checks <=3px steps, including diagonal clearance.
Blocked approaches offer an explanatory prompt/status. Explicit input cancels
auto-approach; cancelling before docking keeps the current safe ground position.
Actual resting temporarily docks inside the owning furniture; ordinary movement
collision remains active elsewhere. Standing returns to a validated exit or the
last clear approach instead of leaving the character embedded in a collider.
Character switching uses that safe exit when the previous actor was resting.

Rendering places a docked actor after the owning furniture base and before its
authored foreground image, where available. This lets couch arms/front edges
occlude the actor without changing shared actor geometry or camera settings.
Single-image legacy assets retain their complete original art. Depth mode also
shows the active approach, docking line and exit marker.

All interactions are disposable rehearsal state. Returning to Edit, respawning,
replacing the actor or unmounting releases the interaction. Authored stage data
and undo history remain unchanged. This addition was source-reviewed only; no
agents, automated tests/checks, builds or browser verification were run.


## Sampaguita Care Grove

Open `/play?preview=stage&map=care-grove`, or use **Files → Sampaguita Care Grove
map** in the existing editor. Choose a character, then **Play map**. The template
enters undo history; opening it does not overwrite the explicitly saved device
draft. **Save locally** persists your current edited layout under the existing
stage-editor save key.

This first outdoor map is 32 × 24 native tiles (1024 × 768 px), with 79 editable
objects. A shelter anchors the upper-right stone courtyard; woodland and rocks
frame the edges, while crossing dirt paths connect a planted care garden,
quiet resting corner and lower-center arrival. The shelter is a scenery landmark;
its interior and a connection to the main overworld are outside this stage.

In Play, use WASD/arrows, Shift to run and E or the contextual action button:

- Three benches support sitting, standing and approach/exit collision.
- The wooden garden door changes to its actual open artwork and passage geometry.
  Its frame remains solid; closing waits for the doorway to clear.
- Two garden lamps change local on/off state with a visible glow and state badge.
- The feeding station accepts a local food refill, with a completed-state badge.
- Two planters accept watering, with an actor care gesture and completed-state badge.

The contextual prompt and E key select the same nearest supported target. Walking,
performing, completion and blocked approaches have visible text feedback. Care
state is disposable rehearsal data: no supplies, inventory, accounts, animals or
Kibble change, and leaving Play resets it. The actor, seat contacts, paths and
interaction controller reuse the installed game systems.

`native-assets.json` now registers all 127 existing terrain cells with their real
labels, plus 51 scenery/building entries, using source atlas rectangles and native
anchors. Six large scenery variants use integer 2× nearest-neighbor scaling. Existing
terrain IDs keep their original frames; previously incorrect material labels are
corrected. Water/shore navigation reads blocking metadata. Rendering and hit testing
crop atlas objects correctly, cull offscreen scenery/terrain, and keep PNG exports
free of playtest state.

Authoring sources: `scripts/prepare-care-grove.py`,
`src/game/stage-editor/maps/care-grove.json` and
`assets/maps/care-grove-v1/`. The served import is
`/pawtrail-game/stages/care-grove-v1.json`. The scoped exporter reuses installed
art and does not regenerate unrelated world maps. Its native overview was visually
inspected and broad dirt paths were repaired to remove repeating grassy holes.
Runtime walking, contact alignment and interaction outcomes remain unverified;
no automated checks/tests/builds or browser verification were run for this task.


## Generated Care Grove art revision

The Care Grove query/template now uses the version-two reference-led package:
`src/game/stage-editor/maps/care-grove-v2.json` and `grove-art.json`. New terrain,
stone hall, fir trees, mossy cliff, dry scrub and bare trees use a subdued,
weathered style closer to the supplied screenshot. Source prompts, raw images,
export manifest and production record live in `assets/maps/care-grove-v2/`.

`StageDocument.groundArt` is an optional registered continuous terrain painting.
The importer rejects unknown painting IDs; raw file paths are not accepted.
The renderer draws it at native size beneath explicitly painted tile overrides.
Erase restores the painting beneath a cell; selecting a different Base floor
clears the painting, while Painted terrain can restore/change it. Resizing clips
or exposes base floor instead of stretching the art. Saves, JSON and PNG export
preserve this terrain layer. Collision still uses semantic base/override tiles
and separate scenery/furniture ground geometry, not the painted pixels.

Grid is hidden by default and disabled in Play; Edit retains an explicit Grid
button/G shortcut. This removes authoring lines as well as the repeating tile
boundaries the previous ground textures exposed. The version-one layout/art and
all existing user saves remain available. No global world maps are overwritten.
This revision includes native art inspection; live browser/gameplay checks were
not requested and remain pending.


## Character-style darker outline revision

Care Grove now resolves the same registered IDs to the v3 art under
`public/pawtrail-game/map-art/care-grove-v3/`. Built-in ImageGen edits use the
installed character sheet for dark espresso contours and stepped shading, with
slightly deeper material colors. The ground retains its continuous painting
and route composition; the editor grid remains hidden by default.

`scripts/prepare-care-grove-v3.py` normalizes the edited sources to the previous
native canvases and preserves existing sizes, anchors, footprints, placement IDs
and furniture interaction behavior. `assets/maps/care-grove-v3/` keeps exact
prompts, per-image service timings, geometry snapshot, output manifest and native
overview. The v2 artwork/layout remains available; no actor models or interaction
controllers change for this artwork revision. Live gameplay verification remains
pending under the current owner instructions.


## Softer outline and color adjustment

Care Grove's registered art now uses `care-grove-v4`: lighter material midtones,
finer warm brown outlines, softer path transitions and lower contrast in ground
accents. This is a built-in ImageGen art edit using v3 as the target and v2 as a
softer reference. Prior files remain intact. The same shared native exporter
accepts `--revision 4`; it retains native dimensions, geometry and existing local
interactions. Prompts, source images, service timings and the reviewed native
overview are kept in `assets/maps/care-grove-v4/`. No app tests/checks/builds or
browser review are included in this art adjustment.


## Latest village-reference pack

Care Grove v5 matches the owner's newer medieval village screenshot through
asset-level material shading/detail: subdued greens/wood/stone, blue-grey slate,
deep colored recesses and fine contours. Six existing terrain/scenery sources
are restyled; four newly generated placeables add a timber cottage, barrels and
crate, handcart and ivy stone wall. The library category is **Village scenery ·
reference pack**. The default map template uses `maps/care-grove-v5.json`; prior
layouts, asset revisions and user saves remain intact.

New scenery uses declared native frames, ground anchors and solid footprints.
Existing furniture contacts/actions remain owned by the housing catalogue and
controller. The cottage is a scenery landmark, without an enterable interior;
the cart is not a new driving interaction. No combat or backend records are
added from the reference image. The continuous ground and hidden default grid
remain. The shared exporter accepts `--revision 5` and optional per-job
`additions.json` / `layout-source.json`; production records and exact prompts
are in `assets/maps/care-grove-v5/`.

The native overview/new-scenery sheet are artwork evidence only. No automated
app tests/checks/builds or browser verification are part of this authoring task;
live actor scale/contact/navigation/interaction review remains pending.


## Sampaguita Old Quarter village

`/play?preview=stage&map=village` and **Files → Sampaguita Old Quarter village**
open the 48 × 32 editable village template. It includes 12 houses using approved
cottage art and two new workshop/townhouse silhouettes, a community hall,
connected cobbled streets, a market courtyard, side alleys and clear arrival.
The new registry `village-art.json` adds only the missing two buildings and ground;
Care Grove's existing art registry is reused without replacement. Both ground
paintings are registered for the existing inspector/JSON/PNG/local-save path.

Stage data: `maps/sampaguita-village-v1.json`; production inputs/evidence:
`assets/maps/sampaguita-village-v1/`; scoped native export:
`scripts/prepare-sampaguita-village.py`. All houses are separate editable scenery
with ground collision. There are no enterable interiors or new world portals.
The current actor, navigation, depth and furniture controller provide walking
and local bench/light/food/plant actions. User saves and Care Grove remain intact.
Native composition inspected; live navigation, actor/roof visibility and action
playback are unverified. No automated app checks/tests/builds or browser review
were requested.

## Sampaguita Neon Heights

`/play?preview=stage&map=cyberpunk` and **Files → Neon Heights cyberpunk district**
open a separate 48 × 36 editable cyberpunk map. The owner's neon skyline reference
provides cyan/magenta glass towers, android and koi holograms, reflective streets
and an observation/maintenance terrace, rendered as textured 2D pixel art.
Eleven tower blocks, two kiosks, three projection emitters, four rooftop fans
and fourteen steel rail sections are independent movable stage objects. Larger
north-edge towers use integer 2× variants; upper stories intentionally extend
beyond the stage edge. Ground collision follows bases, not full tower heights.

`neon-art.json` registers the continuous ground, eight native props and three
large skyline variants. Authoring sources, prompts, timing/provenance and native
overviews live in `assets/maps/neon-heights-v1/`; only the PNG exports under
`public/pawtrail-game/map-art/neon-heights-v1/` are served. The scoped producer is
`scripts/prepare-neon-heights.py`; the canonical layout is
`maps/neon-heights-v1.json`. The new reference overrides the palette for this
map, while Care Grove and Old Quarter retain their approved finish.

Choose **Play map** for the shared actor and walking/collision controller;
WASD/arrows move and Shift runs. Holograms and kiosks are static scenery, with
no new E actions, interiors, NPCs, vehicles or multi-level terrace physics.
The existing local save, undo and JSON/PNG export paths apply. Loading this
template does not overwrite the user's saved draft. Native composition and
cutouts were inspected; no automated app checks/tests/builds or live browser
verification were requested. Actor occlusion, collision and asset loading in
the running application remain unverified.
