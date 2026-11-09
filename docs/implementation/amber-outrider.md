# Amber — reference-guided actor and Refined cel portrait

Created 10 November 2026 with PawTrail Actors and PawTrail Portraits. This is a
preview appearance, not a change to the live game roster or the equipped player.

Open `/play?preview=actors&skin=amber-outrider` to try the shared actions, directions,
sounds and shadows, change parts/colors, or save a named character. Choosing **Use
in game** remains a separate user action. `/play?preview=portraits` opens Amber's
Refined cel collection; the older characters and styles remain available.

## Reference and appearance

The owner's uploaded Amber illustration supplies the appearance. It is retained
at `assets/actor-appearances/references/amber-outrider.png`, with an optimized
preview in `public/pawtrail-game/actor-studio/references/amber-outrider.webp`.
The brief and generation provenance are under
`output/imagegen/amber-refined-cel-v1/`.

Preserved features: long chestnut hair, amber eyes, red rabbit-ear ribbon with
cream/gold tips, bronze forehead goggles, cropped scarlet jacket, gold piping,
ivory bodice, burgundy shorts, white gloves, tall dark/red boots and hip satchel.
The reference crops the feet; soles use the established rig. No held weapon or
new combat behavior was inferred.

The body retains the approved no-nose/simple-eye native-pixel style. The separate
portrait uses the original Refined cel style reference, not Sharp cel or a new
style under an old name. Gameplay bodies are not generated portrait cutouts.

## Shared geometry and exports

`src/game/actor-rig/outrider-parts.ts` adds actual ribbon/goggle, jacket/bodice,
satchel, sleeve/glove and boot geometry on the established skeleton. Long hair
retains its existing secondary motion and care/rest adaptations. New contract
choices are `headwear: outrider-bow` and `outfit: outrider`; the creator and Django
cosmetic validator read the same contract. The local game service was reloaded
to recognize the additional choices. No database, reward or welfare state changed.

The live creator stays at 128×160 pixels, density 2, over the same 64×80 world
window and feet anchor. The production export contains 3,056 frames in 272
clips (34 actions × 8 directions), with a 64×80 fallback frame and a versioned
nearest-neighbor sheet/manifest. The export command is:

`node scripts/pawtrail-actors.mjs render --id amber-outrider`

The preview registry retains `portraitCollection: amber-refined-cel`.
`authored-actor-portrait.ts` matches normalized complete appearance data so exact
saved copies retain their original artwork. Editing the appearance uses the
existing closest-illustration fallback; a changed look is not silently presented
as newly authored Amber artwork. The creator inspector offers all six authored
expressions and a speaking preview for the exact look.

## Authored portrait

Built-in image generation produced three complete 5×6 sheets, with each row
carrying neutral, smile, happy, sad, angry or surprised. Columns contain resting,
half blink, closed blink, small speech and open speech. Each angle was registered
as whole drawings and exported at 96×120 native pixels with binary alpha and a
24-color palette. The happy expression deliberately keeps both eyes closed;
its separately generated redundant blink drawings remain in the authoring source.

Angles: front, three-quarter and head tilt. No side profile. The shipped pack
contains immutable full frames and an offline subtle lower-torso breathing frame;
there is no runtime eye/mouth painting or facial patch compositing. The shared
renderer retains dialogue-driven speech and lazy bounded caches.

The complete served portrait pack is **178,448 bytes**, including its animation
asset, manifest and three neutral posters. The 300,000-byte cap applies to this
portrait style, not the gameplay body atlas or retained generation sources.
Prompts: `output/imagegen/amber-refined-cel-v1/prompts.json`. Generation used the
built-in ImageGen tool; the original reference, style samples and raw outputs
remain alongside the native frames and source-to-frame registration/provenance.

## Visual review

Firefox evidence and the detailed pose/emotion matrix are in
`output/playwright/amber-refined-cel/` and the portrait job's `review.json`.
The review compares the appearance/style reference, generated sheets, native
exports and captured live playback. It covers all 18 angle/emotion combinations,
blink/speech/breath combinations, interrupted speech, emotion changes under a
closed blink, restored resting expressions, and desktop/mobile fit.

No automated test suite, type check or build was run. The Firefox work is limited
to the actor/portrait production and visual review requested by the invoked skills.
Source synchronization into the running social worktree copied only the affected
game modules and Amber assets; it did not overwrite unrelated platform work.
