# Dororong — reference correction

## Current choice: shared base model

The owner selected the shared base model. The preview now uses `createRescuer`
directly, including its normal head, torso, hands, feet, proportions and actions.
The custom sphere/bean body, extra finger/thumb geometry, complete picture-body
replacement and Dororong-specific idle override have been removed. The temporary
`volume-skin.ts` implementation was deleted.

Dororong source artwork remains in the texture sheets and asset folders as
reference material; it does not replace the visible base body. Standard Shirt,
Pants and Shoes painting still updates the base through the existing UV workflow.
The original rig and body geometry are unchanged. Old study-only `SkinVolume_`
vertex edits are omitted on import because those meshes no longer exist; source
save files and image artwork remain untouched. This is still studio-local.

Earlier sections below document superseded experiments, not the active renderer.
No automated tests/builds or browser verification were run for this change.

## Current renderer: painted 3D with transparent extensions

Dororong now uses solid, curved head/body geometry and the shared template's
actual arm, leg, palm and foot geometry. Hands also have 3D thumbs and finger
tips. These are appearance meshes on the existing joints: rig anchors, gait/IK,
world size and shared animation clips are unchanged. The head and torso have
real depth at side/quarter views; they are no longer complete picture cards.

`src/game/skin-studio/volume-skin.ts` projects the existing artwork onto those
surfaces with native sampling and stepped vertex shading. The forward head
surface uses one face painting to avoid a second profile eye at quarter view.
An opaque shaded inner surface closes transparent gaps. Default hand/foot
surfaces start blank white, preserving normal 3D anatomy instead of displaying
the old paw images as circles. User-painted/imported textures still persist.

Original panels render only artwork outside the projected solid silhouette.
This keeps floating hair/accessory extensions without replacing the body with
flat images. Extra artwork remains a flat extension; independent volume still
requires attached geometry. Painting the model and texture uses the same source
canvas. Masks refresh after painting/vertex edits; UVs, normals and solid cores
remain attached to the original joints. Material triangles are grouped into at
most four texture groups per core to avoid per-triangle draw calls.

The preview's **Textured 3D skin / Template body** control compares the painted
appearance with the original template. **Load current preset** resets unsaved
art/geometry to the clean default; saved packages remain untouched. Account/game
installation is still separate. Source and live module serving were inspected;
browser action/appearance and persistence review remain pending under workspace
restrictions. No agents, automated tests/checks/builds or new image generation ran.

The following sections record the earlier panel-only stages:

The current studio preset uses the **v3 registered exports**, produced from
the same approved source sheet with `source/export-registered-v3.json`.
There are now 56 surfaces (51,775 PNG bytes): four views for the head/body and
each upper arm, forearm, hand, thigh, shin and foot. Hands attach to WristLeft/
WristRight; feet attach to AnkleLeft/AnkleRight. Upper/lower limb artwork overlaps
at the actual joint spans. Wrist pivot is (32,48), ankle pivot (32,32), and the
foot sole is registered at row 49 on its 64×96 sheet. Other limb pivots are
(32,24). All views retain those origins. Guides show the actual joint crosshair.

Panel transforms remain fixed in bone-local space. Camera movement selects a
visible face with a small hysteresis band; it never billboards, spins or orbits
the artwork independently. Head/body have fixed shallow depth offsets for
occlusion; foot layers retain the rig's forward sole center. The shared skeleton,
world movement, IK and animation clips are unchanged. Package v8 stores the panel
layout. Older packages retain the legacy 24-panel registration/artwork; selecting
the current preset loads the fix. Studio textures remain local.

Runtime assets are in `public/assets/game/skins/dororong-floating-v3/`. The
new native hand/foot exports were visually inspected. Runtime action, camera,
painting and save/import review are still pending under workspace restrictions.
No new ImageGen request or automated tests/checks/builds/browser review ran.

The remainder records the v2 artwork generation:

Open `/play?preview=skin&skin=dororong-floating`. The earlier
`skin=mochi-floating` link remains an alias. Character studio now calls the
preset **Dororong · Floating skin**. Existing saved texture packages keep
their saved artwork when imported; selecting the preset loads this correction.

This is the supplied Dororong reference, rather than the earlier generic Mochi
reinterpretation. The new sheet corrects the oversized sleepy gray eyes (no
glasses), tiny omega mouth, flatter white cap, long pink side locks, sparse
shading, white paws and tiny black belly ×. The taller white body covers the
human thigh silhouettes; stub feet remain independently attached to the rig.

Only this floating preset adds an arms-out resting pose during Idle. Pose and
Geometry authoring retain their own joint transforms, and the other action
clips still use the shared rig. No skeleton anchors, locomotion logic or
collision dimensions changed. Directional cutouts remain flat artwork, not a
new solid model. This is a local studio preset, not an installed game character.

## Artwork provenance

- Built-in ImageGen generated `source/parts-generated.png`, using the owner's
  `source/reference.png`. The exact prompt is `source/prompt.txt`.
- `source/reference-inspect.png` is a nearest-neighbor enlargement used to
  inspect the tiny reference and distinguish eyes from glasses.
- `source/export.json` records native placement, palette and actual row gutters.
  The tall torso extends beyond an equal-quarter source row, so production
  slicing uses these explicit source bands to retain the entire body.
- Reuse `assets/actor-appearances/mochi-floating-v1/source/export.py` with the
  path to this package's `source/export.json` to reproduce the exports.
- Runtime assets: `public/assets/game/skins/dororong-floating-v2/`.

There are **24 transparent PNG surfaces, totaling 35,329 bytes** (about 34.5 KiB),
plus the runtime manifest. Original v1 artwork is retained separately.
The full generated sheet and native front head/body exports were visually
inspected. Browser/action and persistence verification remain pending under
workspace restrictions. No agents, automated tests, checks or builds were run.
