# Interactive furniture from 2D sprites

Use this mode when the owner chooses 2D sprites. Sitting, actor fit, bed/rest
contacts, collision, opening/closing, on/off states and climbing do not require
a furniture mesh. Reuse current actor animations; their existing source rig does
not turn the furniture into 3D.

## Author the sprite and contacts

1. Inspect native dimensions, alpha bounds, anchor and catalog ID. Preserve the
   source PNG and its frame. Reuse acceptable artwork rather than generating a
   replacement or unused turnaround. Avoid a second border on finished sprites.
2. Define ground collision independently of full image bounds. Add reachable
   approach/exit points and per-seat ID, point, facing and elevation. Align the
   actual actor's native seated pelvis with the cushion. Ground-Y sorting,
   collision position and visible elevation remain separate.
3. Extract only the foreground pixels that cover actors, e.g. couch arms. Draw
   original furniture → seated actors → foreground. Masks preserve source RGBA
   and exactly share its frame/anchor. Do not conceal bad docking with a large
   rectangle or accidentally cover actor feet with the whole front skirt.
4. Add required state/facing frames only. Rotatable seating needs front, right,
   back and left artwork, each with its own seat points/facing, collision,
   approaches/exits and foreground masks. Review seated actors in all four views;
   the rear backrest may correctly hide most of a seated actor. Never reuse the
   front mask or front-facing actor unchanged for the back. Preserve the original
   front and reuse accepted art; generate only missing directions, not another
   complete reference exercise. Candles can use off/on sprites plus
   flame/glow; food/water follow existing counters. Door art and passage collision
   agree. Four-way rotation switches authored sprites and matching contacts;
   front-only art advertises front only, with no fake planar rotation.

## Reuse actual interaction mechanics

Use `InteractionController`, shared navigation/foot clearance, actor poses and
housing actions. Reserve a seat, decline another occupant, and release on stand,
cancel, departure or removal. Actual-room permissions, supplies and persistent
states stay authoritative on the backend.

Reuse `StagePlaytest` for local trials rather than creating a second movement or
sitting controller. A shared local seat-reservation map can preview both seats;
it is not server concurrency verification. A second preview actor is not a
generated database account. Existing actor/appearance choices remain at native
scale; do not shrink characters to disguise a furniture fit problem.

The couch pilot uses existing item `sofa`, original source
`/assets/game/housing/furniture/sofa-housing-v1.png` and an exact-pixel arms mask.
The separate `studio-couch` source model stays installed. Open
`/play?compare=furniture&asset=sofa&representation=sprite` for the local trial.
The couch now has four native 2D views using the original front and accepted
turnaround side/rear pixels. The circular above-item control (or R) rotates
artwork, contacts and seated actor facing together. Reuse this trial and
`refreshFurnitureContacts` for future sprite items instead of rebuilding actors.
Its manifest records the current revision and actual local verification scope.


The next installed sprite contract is `wooden-door`, available in the same trial
selector or `?compare=furniture&asset=wooden-door&representation=sprite`.
`scripts/prepare-sprite-door.py` extracts canonical frame/panel pixels and exports
64×64 closed/open states at exact 2× scale. It is intentionally fixed-facing.
`stateViews.open` supplies the open image and permanent frame ground shapes;
never remove all collision for a generic `open` flag. Client/server navigation
use that explicit state geometry. `StagePlaytest.useObject` reuses the existing
interaction controller; local object state is separate from server authority.
Reuse these paths for later stateful sprites. Tests live in
`tests/door-passage.test.ts` and `backend/housing/test_door.py`; consult the item
manifest for actual review scope, including pending live multiplayer checks.

## Fast repeatable loop

1. Read the selected item/manifest and relevant existing helpers once. Reuse the
   editor, `StagePlaytest` and the current interaction trial. Do not create a
   new preview page, controller or test harness per item/batch.
2. Reuse unchanged source art, approved directions, masks and contacts. Create
   only missing facings/states. Group related shapes and reuse valid palette
   variants; no mesh, UV/GLB export or model render for this route.
3. Inspect one combined native board of required views, with seated actor and
   foreground where relevant. Correct visible problems before opening the app.
4. Use one Firefox session for the final batch. For an unchanged shared seating
   implementation, do one sit/stand cycle per item and a visual check of every
   facing; include a brief collision/exit spot check where geometry changed.
   Review the current batch's items. Mobile sweeps, rechecking the old couch,
   editor round-trip tours and repeated project-wide typechecks are not routine
   batch steps. Keep shared preview UI unchanged where possible. State any
   necessary new interaction work separately; don't silently turn an asset batch
   into a general editor/controller upgrade. If shared logic changes, prefer
   targeted contract tests; broader visual regression needs a specific affected
   dependency or an explicit owner request.
   Do not repeat the full occupancy, reload, responsive, touch and navigation
   matrix on every item. Test the affected shared behavior when its code changes
   or a failure appears; expand only enough to resolve that concern. An explicit
   request for broader testing overrides this minimal pass.
5. Install changed records/assets and update queue/provenance once at the end.
   Prefer the existing manifest plus a concise result; avoid new reports, broad
   inventory audits and duplicate bookkeeping for routine batches.

The first pilot can incur shared tooling work. Subsequent items reuse it; do not
restart setup or rediscover the workspace. Give a brief progress update if art
generation/rendering is the actual wait. Never omit required angles or hide a
failed interaction to meet a time target.

## Review and install

- Inspect the original and final composition at nearest-neighbor integer zoom.
  For newly changed shared seating mechanics, check each seat, both seats,
  occupied-seat rejection and safe stand/cancel. For later art/contact-only
  items, use the focused pass above. Always inspect fit and foreground for the
  required facings; a front-only success does not prove side/back fit.
- Keep loading/error states and keyboard/touch controls in the existing shared
  shadcn layer, with the project's heading/body font tokens.
- Use Firefox when visual/interaction review is requested. Otherwise report
  source/art-review limits; this route does not waive workspace check restrictions.
- Update only the chosen catalog ID and matching frontend/backend contact data
  and versioned masks. Preserve price, inventory, recipes and source art. A local
  authoring trial does not change a player's home or prove authenticated actions.
- Record representation, source hash, frame/anchor, geometry, layer provenance,
  reviewed actor/poses and the actual verification scope.

No GLB, furniture mesh, UV mapping, model camera calibration or generated
turnaround is required. If new art is generated, show it for applicable review.
The initial workflow choice requires an answer; the optional silence default for
generated reference reviews does not select 2D or 3D.
