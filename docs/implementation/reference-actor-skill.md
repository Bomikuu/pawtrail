# Reference-guided actor appearances

The installed user skill is `/home/micxsz/.codex/skills/pawtrail-actors/SKILL.md`.
Invoke `$pawtrail-actors` with an image and a brief. It interprets the reference,
configures the approved rig and produces native pixel exports. Reference images
guide an agent-authored appearance; the browser does not perform image-to-model
generation. Image references can specify appearance, style or both.

## First actual use

The owner selected **red hair, glasses and a green jacket**. Rowan is an original
trial on the approved rescuer rig. The earlier owner-supplied RPG sprite sheet is
stored as a style reference, with the owner's appearance brief recorded separately
in `assets/actor-appearances/catalog.json`.

The skill workflow was used to execute:

```bash
node scripts/pawtrail-actors.mjs render --id rowan-rescuer
node scripts/pawtrail-actors.mjs render --id rowan-rescuer --actions feed
```

The complete export produced 2,176 native frames, 208 directional clips and a
1024×3840 sheet: 26 actions in eight directions. The second production pass
rendered only 96 feeding frames after separating food color from outfit colors;
other source frames were retained. This demonstrated both a complete appearance
export and an incremental export on the same trial. No other appearances were
re-exported, no character picker entry was added and saved selections are intact.

## Preview page

Open `/play?preview=actors`, also available from **Your spaces → Character
preview**. The existing Phaser comparison scene displays the approved base and
the new skin with the same clock, ground, anchors, movements and emote props.
Choose any exported action, eight headings, play/pause, reset, native/synchronized
timing and integer zoom. WASD/arrows or touch controls move both appearances.
The original `/play?compare=actors` comparison is preserved.

The side panel contains the reference image, exact brief, palette, appearance
thumbnail, sprite download and a copyable skill request. A chosen local reference
is an ephemeral object URL, with file-type/size feedback and URL cleanup. It can
be enlarged and compared, but does not regenerate or upload artwork. Include the
reference when asking the skill to render a new skin. Empty/loading/error states
compose the existing shadcn components; mobile shows the animated field first.

## Shared implementation

- `createRescuer(appearance)` and `createCat(appearance)` share all existing pose
  functions. Materials are scoped per appearance and painted hair is cached by
  its palette. Glasses attach to the existing head group.
- `scripts/pixel_actor_art.py` contains the palette and connected one-pixel
  outline pass shared with the approved first-pair export pipeline.
- `scripts/pawtrail-actors.mjs` starts a bounded private authoring server and
  Firefox session, exports requested frames, finishes native pixels and installs
  content-versioned assets. It closes those owned resources on exit.
- `actor-previews.json` holds preview-only sheets. The live baked registry and
  roster are separate. The appearance signature prevents a partial export from
  mixing old and new clothing/accessories. Actor sheet columns expand if needed
  to retain the existing 4096-pixel axis budget.

For an authorized shared walk update, edit the base pose once and run:

```bash
node scripts/pawtrail-actors.mjs render --all --actions walk
```

This updates all catalogue entries, including the two existing live base actors.
It was intentionally not run during the preview-only trial. A palette, accessory
or geometry change requires a full appearance render. New action frames must
exist before repacking. Game promotion also requires the requested roster and
profile integration; a preview export alone does not add a selectable character.

The human rig now supports swept/spiky/cropped hair, wide-brim headwear, an open
hood, vest/tunic/coat geometry, trousers and hand-bound sword equipment. Other
shapes and detailed coat markings require deliberate mesh/texture work guided by the reference.
Large illustrated dialogue portraits are separate from the exported sprite
thumbnail. Cosmetic effects and previews never provide identification references,
verified welfare activity or authoritative Kibble.

## Review and running worktree

The original image and exported native artwork were visually reviewed. The
production commands above were actual skill use. No agents, automated tests,
checks, builds, skill validator or browser verification of the game were run,
following the standing workspace instructions.

Only the new/changed game modules, app preview branch, header navigation, preview
assets and documentation are copied into the running worktree. Do not use the
broad game sync script for this integration. The live backend is unaffected.

## Modular silhouette extension

The owner's follow-up requested different hair, hats, a hood and held gear,
rather than a fixed model with new colors. The movement skeleton is shared;
the visible meshes can now have different profiles and layered volumes.

`appearance-parts.ts` builds pointed, textured hair clumps; a hat with crown,
brim and band; a genuinely open hood with cheek folds and an inner rim; layered
tunic/coat panels; trousers; and a detailed blade, grip, guard and sheath.
Hair/headwear follows Head, clothing follows the spine and hip joints, and the
sword follows the right wrist with a grip correction. The sword is stowed for
care/other occupied-hand gestures and hidden for sleeping. The broad hat is
removed during sleep. Coat hems have a small secondary swing on the hip motion.

Three additional preview-only examples were rendered through the skill:

- `rowan-spiky`: tall golden spiky hair on the familiar green vest.
- `rowan-ranger`: broad hat, layered tunic, trousers and a held sword.
- `rowan-hood`: an open hood and long split coat, with no backpack hiding its shape.

Each has all 26 actions in eight headings, totaling 6,528 new native body frames.
Their 48×64 padded cells produce 1920×3904 sheets. The camera keeps one world
unit per native pixel and the ground anchor becomes (24,52); padding does not
shrink or enlarge the character. Head-height metadata keeps emote icons above
the new silhouettes. The page uses integer-scaled portraits and visible look
buttons. Preview-only textures are released when leaving/changing the scene.

Geometry/frame options participate in the version-2 appearance signature, with
compatibility for older palette-only signatures. Geometry changes require a
complete render. Incremental finishing retains existing finished sprites for
untouched actions. The private art server ignores output folders to avoid asset
exports reloading its authoring page during a multi-appearance batch.

The skill now treats silhouette analysis as a separate reference step and has a
dedicated geometry guide. All three examples remain outside the game roster.
The artwork was reviewed in multiple headings and representative care/rest
poses; no automated checks/tests/builds or game-browser verification were run.

## Aurora: long hair, gown and angel wings

The owner requested an elaborate, clearly feminine long-haired character in a
full gown with angel wings. `aurora-angel` is an original preview-only example:
honey-blonde hair, soft facial details, ivory/lilac dress, gold sash/rose detail,
puff sleeves, slippers, layered white feathered wings and a floating gold halo.
The supplied RPG image remains the style reference; the angel appearance comes
from the explicit brief and recorded design choices.

`angel-parts.ts` builds the new geometry using `part-kit.ts`. Long back/side hair
has lower joints with gentle sway and lean compensation. A twelve-panel bell
skirt follows the pelvis and gathers/spreads for crouching and sitting, with a
flatter sleeping form. Each wing has shoulder/elbow joints, seven primary and
five cover feathers with vanes, shafts and highlights. Wings fold for close care
and sleep. The halo compensates for pitch so it stays approximately level.

Aurora reuses all 26 actions in eight headings: 2,176 native frames in a
3072×3456 atlas. Her 64×72 cell and (32,56) ground anchor add transparent space
without changing the world scale. The preview fits integer zoom and horizontal
movement bounds to larger silhouettes, preserving wings on narrow viewports.
Thumbnail feet use their manifest anchors so different cell padding aligns.

The PawTrail Actors skill now documents these slots and their movement policies
in references/angel.md. No existing appearance was re-exported and the game
roster is unchanged. The new artwork was reviewed in multiple headings and
representative movement, care, sit, float and sleep poses. No automated tests,
checks, builds or game-browser verification were run.

## Character creator

The preview route is now the editable [character creator](character-creator.md).
Canonical rig modules moved to `src/game/actor-rig/`; old source modules re-export
them. The production CLI hashes the canonical geometry, palette and actions.
Personal browser characters are versioned configurations using the same rig;
approved built-in actors remain baked sprites. Use the creator for slot/palette
combinations and the offline skill for new geometry or reference interpretation.
