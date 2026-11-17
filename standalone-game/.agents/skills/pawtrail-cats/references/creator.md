# Personal cat creator

`/play?preview=cats` now opens a live creator in the existing human-creator layout.
It supports breed/body, coat pattern and fur length, long/plume/bobtail/stub tails,
tail motion, hats, boots, collars, wings and colors. Breed changes apply coherent
coat/fur/tail defaults while preserving accessories. Named cats save privately to
this device or the authenticated account, with thumbnails, revisions and a 24-cat
limit per library. Users can edit, duplicate, delete or export/import JSON.

## Source map

- `src/game/cat-creator/appearance.ts`: strict version-1 DTO, IDs and validation.
- `state.ts`: draft restoration, templates, dirty state and portrait capture.
- `library.ts`: explicit device/account saves, local storage, authenticated API,
  revision conflicts, cross-tab reload and private library operations.
- `src/game/actor-rig/cat-pixel-renderer.ts`: one bounded live cat renderer using
  the actual createCat rig, production camera and shared PixelFinish. Native
  160×160 frames sample an 80×80 world window at density 2, with native ground
  anchor (80,104). Sprites display at half scale; bold contours, props and shadows
  compensate for density. The cache remains capped at 96 frames, nearest-filtered.
- `src/game/runtime/actor-comparison-scene.ts`: `cat-creator` mode in the existing
  Phaser comparison scene. Draft edits rebuild only cat geometry, not the scene.
  The approved base stays on the left; only the right cat plays action sounds.
- `src/components/game/cat-creator-editor.tsx`: official shadcn controls, familiar
  creator tabs, save controls, collection and destructive/replace confirmations.
- `backend/housing/cat_appearances.py`: owner-only account list/save/delete,
  authoritative option/color validation, row locking, limits and revisions.
- `PlayerCatAppearance`, migration `0014_cat_appearances`: actual database rows.
  The endpoint is `api/homes/cat-appearances`, using the existing authenticated
  housing bridge; no new credentials or public read endpoint.

Reuse the shared action manifest, cat soundboard, action audio and ground shadow.
Wing-flight selection is available after adding wings. Walk/run can play in place
or follow preview input. One-shot jump/pounce settle at their final grounded
frame. Keep the live renderer, creator controls and save schema consistent when
adding options. UI changes must follow the workspace shadcn/Tailwind/font rules.

An exported backup contains `format: pawtrail-cat`, `version: 1`, `name` and
`appearance: {version: 1, cat, colors, face}`. Import validates data only and never
inherits an ID, owner, save scope or executable assets from the file. A live
creator combination needs no image-generation/export step. Adding a new breed
mesh/accessory still needs shared rig work; publishing a baked appearance still
uses the normal native export pipeline.

The Face tab includes mustache/split-mustache, tuxedo and freckle markings,
left/right eye colors, nose and marking colors. Match both eyes can be disabled
for heterochromia. Body sizes are kitten (.85), standard (1.15) and large (1.4),
applied to the same rig with its existing feet anchor. Inspect face hides the
reference column and uses a closer integer camera zoom; Full body restores the
comparison. These preview controls do not change room collision or real pet data.

Version-1 saves without face, bodySize or faceMarking are upgraded with defaults
when read; independent eye colors default from the old eye palette role.
Frontend and backend validators accept those older saves while validating all
new colors/options. The JSON extension does not require a database migration.
The denser live creator is distinct from previously exported lower-density PNGs;
do not claim those sheets have changed without regenerating them.

Account cat appearances are cosmetic, separate from real animal profiles, home
pet ownership, identification references and verified care/rewards. Saving does
not automatically create/equip/spawn an animal or publish it to other players.
Respect workspace restrictions on tests/builds/browser verification; source
review and applying the required migration with `--skip-checks` are distinct.
