# Personal character creator

The preview route `/play?preview=actors` now edits a personal human appearance.
The canonical factory, geometry, palette, allowed slot contract and actions live
in `src/game/actor-rig/`. Old authoring module paths re-export the canonical rig.
The offline production CLI hashes the canonical modules and palette.

The creator uses actual modular geometry, not flat recolors. Its 128×160 native
cell samples the original 64×80 world window at density 2, with a native ground
anchor at (64,120). A half-scale sprite preserves original world proportions.
It uses the same orthographic camera, palette quantization and bold contour as
the offline art, with contour thickness compensated for density.
A shared offscreen WebGL context renders changed native frames only; Phaser
continues to own the shared game canvas, movement field and emote props.

Named account saves are owner-scoped housing database rows with strict schema
validation and revision conflicts. Device saves are explicitly browser-local.
Account characters can be equipped in Explore and homes; device characters are
local Explore only. JSON import/export backs up data, never executable assets.
Templates and personal saves do not overwrite the approved built-in roster.
The skin studio can author local attached geometry and vertex edits; it does not
turn uploaded reference images automatically into meshes. Refer to the implementation guide
`docs/implementation/character-creator.md` for current API and persistence paths.

## Refined base and free-form texture layers

Custom human work starts from the existing **Custom base · Refined v2** template.
The shared factory uses `actor-rig/humanoid-base.ts` for a curved, softly outlined
jaw, rounded torso/shoulders and tapered limbs. Preserve its existing skeleton,
joint anchors, action library and world scale rather than forking the rig.
Named featured actors retain their own authored body geometry.

The skin studio (`/play?preview=skin`) adds whole-image transparent panels for
head/hair and garment front/back/sides, plus front/back panels for both upper
arms, forearms, thighs and shins. These oversized, alpha-tested surfaces follow
existing joints; artwork may extend past the body without changing vertices.
Use each panel's actual downloadable body guide. Match physical and canvas aspect
ratios, preserve transparency and provide separate view drawings. Split artwork
at moving joints. These rigid panels do not provide cloth simulation or solid
volume; use the existing attached-geometry tools where true thickness is needed.
Retain original UV painting for body details. Do not describe a texture alone as
creating new 3D volume.

**Current Dororong/base-skin choice: use the shared base model directly.** Keep
`createRescuer` geometry, hands, feet, proportions, rig and animations. Do not
restore the retired sphere/bean body, additional finger/thumb study, complete
cutout-body replacement or special Idle override. The temporary `volume-skin.ts`
module was removed. Artwork stays available as source/reference texture sheets;
ordinary base-model UV painting remains active. Full-body 2.5D comparisons or
new per-character geometry require a separate request. Flat parrot/hair
extensions may use a larger panel, while real side/quarter volume needs shaped
geometry. Keep the ordinary 3D body visible when the owner expects a 3D skin.
This scopes the current studio trial; it does not change existing named actors'
approved geometry or restart their artwork workflows.

Studio packages are local authoring data. Version 6 stores the v2 base tag,
transparent panel canvases and base-hair visibility. Older v1–v5 shared packages
load the classic geometry to preserve their UVs and vertex indices. Do not silently
upgrade vertex topology or claim that exporting a skin equips it in gameplay.
Version 7 also retains base-body visibility. An explicitly requested floating
skin can hide the original meshes while joint-attached, directional cutouts follow
the shared actions. The Dororong studio preset demonstrates this 2.5D option; it is
not a replacement for the default volumetric actor workflow or a gameplay equip.
The current v8 `joint-panels-v2` layout has 56 panels, including separate hands
on WristLeft/Right and feet on AnkleLeft/Right. Register every view to the same
joint pixel; keep connective artwork overlapping the actual limb spans. Never
use an elbow/knee card as the hand/foot pivot. The artwork's local transform stays
fixed during movement/rotation; view selection changes visibility with hysteresis.
Do not independently billboard or orbit extension panels. Existing v6–v7 skin
packages retain their legacy layout; importing old art does not prove it has
corrected registration. Reuse the current Dororong exporter/template rather than
regenerating identity artwork to repair a pivot. Runtime acceptance remains
subject to the owner's verification permissions.
Follow `docs/implementation/skin-texture-studio.md` for the implemented contract
and current review status. A new custom actor still needs its scoped installation
and the normal likeness/action acceptance under the owner's permissions.

When changing the shared rig, preserve its canonical imports and personal save
contract. Existing personal characters use new shared movement directly; baked
built-ins still require a scoped action export. Follow AGENTS.md restrictions on
agents, tests, builds, browser verification and asset production.

For actions that temporarily change model appearance, read
[action creation and temporary forms](actions.md). That guide covers the current
Goku transformation and the reusable implementation for future actions, including
movement layering, expiry/interruption and restoring the user's saved look.

## Face details and inspection

`face: {leftEye, rightEye, nose, marking}` holds four validated hex colors.
`accessories.facialHair` supports none/mustache/goatee and
`accessories.faceMarking` supports none/freckles/beauty-mark. Existing
`parts.face` retains its default/soft shape/lash choices. Glasses, hair and gear
still follow the same joints and actions. Human faces now omit the nose and use
dark oval eyes, a restrained colored iris accent and a tiny catchlight, without
white sclera. Both normal and powered eyes share that drawing helper. Keep gameplay face details in the shared rig rather than patching body thumbnails.
Dialogue portraits now use separately authored 2D artwork; see portraits.md.
Do not restore realistic gameplay eyeballs.

`src/components/game/shared/face-details-editor.tsx` provides matching or separate
eyes, common eye palettes, marking colors and inspection for both creators.
Human controls hide the nose field; the saved nose color remains solely for
backward compatibility. Cat faces retain their nose and its color control.
`runtime/actor-comparison-state.ts` owns separate actor/cat detail states, a shared
faceInspection query and toggle. Inspection hides the reference and centers the
face at a closer integer camera zoom. Full body restores comparison mode.

The shared FaceColors type/defaults live in `actor-rig/face-details.ts`.
`appearance.ts` and the housing backend validate them and upgrade old version-1
saves with natural brown eyes and the prior skin/hair shading. Device, account
and imported configurations preserve details. No database migration is needed
for these existing JSON columns. Keep older saves loadable and accessory edits
merged so toggling glasses does not discard facial hair or markings.

`PixelActor(appearance, 2)` samples both the creator and all in-game humans.
The shared WebGL stage switches size when needed and keeps the same world camera
and bounded frame cache. LiveCharacter uses a 128×160 texture; the displayed image
is half-scale with the existing foot anchor, preserving world size and collision.
The physical actor remains the effects/audio target; do not double-apply density
to its props or shadows. Previously baked sheets still require re-export to gain
new rig pixels. Face details/accessories must enter export validation, palette,
signature and rig hash.
Temporary eye-color forms restore saved colors after expiry or cancellation.

## Consistent in-game roster and saved looks

`actor-rig/game-appearances.ts` converts existing roster identities and palette
roles to shared rig configurations. It preserves hair/outfit colors, glasses,
hats/hoods, trousers and local workshop preferences. `models3d/phaser-bridge.ts`
routes every human through LiveCharacter, including player avatars, visitors and
NPCs. The workshop's human view and character picker use the same factory.
Keep this one face implementation, including temporary powered eyes.

Existing saved device/account configurations are read with current defaults and
rendered directly. Do not overwrite their records, IDs, choices or revisions to
update a shared face. `FACE_STYLE_REVISION` in face-details.ts versions generated
thumbnails: old-style snapshots are ignored and miniatures regenerate from saved
configuration. Stamp new thumbnails in creator/library.ts and bump the revision
when future shared face changes would make existing snapshots misleading.
Independent dialogue illustrations and original-2D comparison assets are separate
artwork; do not rewrite them as a side effect of a world-model update.
