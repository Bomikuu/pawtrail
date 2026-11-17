# Amber model study — 10 November 2026

Historical first model study. The current `/play?compare=amber` view compares
this study's head against the narrower head/hair revision; see
[Amber head study](amber-head-study.md) for its current behavior.

Open `/play?compare=amber`. The Amber creator template also has an **Amber model
study** button. This is a separate comparison, not a replacement for the saved
Amber template or any other player/NPC appearance.

## Appearance and animation

The left side uses the current `amber-outrider` appearance with the unchanged
`createRescuer` model factory. The right side uses `createAmberStudy`, which reuses
its pose skeleton but replaces visible geometry with a broader face/body,
curved tapering hair locks, layered outfit pieces, tailored shorts, boots,
gloves, satchel, goggles, a textured red rabbit ribbon and a flexible cape.
The reference's pixel RPG images guide proportions, silhouette and painted
surface treatment. Amber's original illustration guides her identity/outfit.
This is a first visual candidate, not a claim of an exact reference match.

The cape is an actual 3D surface with 195 vertices and 336 triangles, fixed at
its shoulder edge and deformed toward the hem. This is authored procedural
fabric motion, not a cloth-physics simulation. Curved 3D hair locks move with
delayed phases. Garment motion runs on a continuous clock independent of the
body clip, with locomotion intensity eased over roughly 180 ms. Switching to
idle preserves cloth phase and lets it settle; it does not reset the cape.

Both sides use the same body pose/clock, native 128×160 frame, world camera and
feet anchor. The preview samples the shared pose at finer temporal intervals;
it does not change the frame counts or movements of installed game characters.
Shadows remain at the feet. Only idle and walking are offered in this study.
Care, rest, emotes and game installation remain outside this trial's scope.

## Painted textures

The built-in ImageGen tool generated a six-panel material atlas from the owner's
Amber appearance and pixel RPG style references. It contains whole open,
half-blink and closed-blink face UV patches, bodice, hair and cape surfaces.
Additional jacket, boot, short and ribbon details are code-authored pixel textures.
These wrap genuine 3D meshes; a full-body drawing is not pasted over the model.
The separate Refined cel dialogue portrait is unchanged.

The native atlas is 192×128 pixels, 96 indexed colors, **7,295 bytes**. It uses
nearest-neighbor sampling and no mipmaps. Source and generation prompt:

- `assets/amber-study-v2/painted-surfaces-generated.png`
- `assets/amber-study-v2/texture-prompt.txt`
- `public/pawtrail-game/actor-studio/amber-study-v2/painted-surfaces.png`

The **Inspect model & textures** dialog provides a larger model comparison,
eight directions, pixel zoom, and a painted-texture tab. **Save native comparison**
exports both current frames side by side at native resolution with transparency.
The scene pauses while hidden, starts paused for reduced motion, and disposes
both renderers/caches on unmount. Opening the inspector pauses the field behind
it. Factory and secondary-motion parameters added to the shared renderer are
optional; existing users retain their original factory and pose behavior.

## Implementation

- `src/game/actor-rig/amber-study-rig.ts`: isolated model geometry and cloth/hair motion.
- `src/game/actor-rig/amber-study-textures.ts`: UV artwork and bounded shared atlas loading.
- `src/game/actor-rig/pixel-renderer.ts`: optional model factory/preview sampling inputs.
- `src/game/runtime/amber-study-scene.ts`: side-by-side Phaser presentation and capture.
- `src/components/game/amber-model-study.tsx`: shadcn controls, inspection and references.

The integrated app and its archived standalone source receive scoped copies of
these files. No appearance save contract, database records, Kibble state or game
roster was changed. No agents, automated tests, type checks or production builds
were used. Scoped Firefox visual captures cover the requested comparison.

Visual evidence is retained locally under `output/amber-study-v2`, including
native front/diagonal/side/back images, idle/walking sequences, enlarged materials,
desktop/mobile captures, and animated comparison GIFs. Reference fidelity remains
subject to the owner's assessment before any rollout to other appearances.
