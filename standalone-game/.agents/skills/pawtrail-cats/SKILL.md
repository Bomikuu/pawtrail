---
name: pawtrail-cats
description: Create reference-guided PawTrail cats with recognizable breeds, fur patterns, tails, accessories and automatic animated dialogue portraits. Add shared actions, cat soundboard audio and ground shadows, then export native pixel sprites for the creator or an authorized game installation.
---

# PawTrail Cats

Use for PawTrail feline models, coats, tails, accessories and actions. Work in
the game workspace containing `src/game/actor-rig/rigs.ts`; read AGENTS.md first.
The cat is an articulated 3D authoring rig rendered into native pixel sprites,
with shared runtime sounds, props and shadows. It is not a human rig recolor.

## Visible interaction feedback — owner requirement

Every interactive result in this skill's scope must visibly register: show pending
work when needed, then the actual success, failure or changed state. Existing
clear state changes may suffice; do not add a toast for every animation frame.
Use real outcome events, never a cosmetic effect or a console log as evidence of
success. For fictional combat, confirmed contact must play an actual animated
impact sprite on the affected enemy/player: e.g. a slash flash, spark burst or
elemental impact. Damage numbers, HP changes, tint and floor rings supplement
that sprite; they do not replace it. Distinguish weak points and incoming damage
where useful, and keep blocked/miss/cooldown cues separate from successful hits.
Reuse suitable approved transparent VFX atlases; generate missing raster effects
with the available image-generation workflow. Preserve native frames, anchors
and nearest-neighbor playback; bind contact to accepted outcomes, not casts.
Artwork-only and noncombat work do not gain new combat scope from this rule.

Show the actual cat action, interaction or ability result and applicable status feedback. This does not authorize making real community pets combat targets.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Fast workflow with quality safeguards

Read the selected cat's reference/manifest and relevant helpers once. Reuse
approved matching assets, the feline rig, creator, mixer and exporter. Carry
forward known choices; load extra references only as needed. Group compatible
exports in one authoring/browser session and regenerate only affected outputs.
New tooling is one-time work, not setup to repeat for every breed or palette.

Keep all required breed/coat details, headings, actions, accessories, sounds,
shadows, portrait states, native bounds and review gates. New or changed
silhouette, coat or bounds still requires the full cat export; action-only export
is only for compatible pose changes. A new portrait still follows its complete
selected-style acceptance; reuse does not authorize another cat's face or coat.

Inspect final native art and affected interactions. Prior evidence is reusable
only when its artifact, inputs and dependencies remain unchanged. Changes to the
shared rig, movement/audio lifecycle, exporter, renderer or bindings broaden
checks to affected cats/actions, tail/accessory clearance, ground alignment and
portrait integration. A failure or unresolved concern warrants further checks;
unchanged passed behavior does not need repeated testing. Preserve verification
permissions and mark unobserved required behavior pending.

Update existing manifests, acceptance and scoped installation once at completion.
Avoid duplicate reports, repeated setup and unrelated application checks. Report
the actual bottleneck without skipping required art or behavior.

## Choose the work

- **Personal cat:** use `/play?preview=cats` to choose existing breed, coat, tail,
  body size, face markings, separate eye colors, accessories and colors,
  preview actions, and save to the device or private
  account library. No sprite export is needed for these live combinations.
  See [the cat creator](references/creator.md).
- **New cat:** interpret the reference, configure morphology/coat/accessories,
  and export a preview. See [appearance](references/appearance.md).
- **New action or shared movement:** change the shared cat pose, register its
  timing, sound and effects, then re-export affected clips for existing compatible
  appearances. See [actions, sounds and shadows](references/actions.md).
- **New accessory or breed shape:** attach actual geometry to existing joints.
  Re-export the full cat when its silhouette, markings or bounds change.
- **Game installation:** only promote a new preview into the live roster when
  requested. Preserve the platform's real animal records and unrelated changes.

## Reference and style

Inspect an available reference image before choosing the cat's visible traits.
Distinguish a style reference from the animal's appearance: record body shape,
fur length, base/secondary coat, distinctive markings, eyes, ears, muzzle and tail.
Use explicit user details when there is no new image; the established PawTrail
cat and [approved actor style](../pawtrail-actors/assets/style-reference.webp)
remain the visual baseline. Record assumptions instead of inventing exact breed
identity. Breed presets are artistic silhouettes, not real-animal identification.

Keep the existing cozy palette, upper-left light, bold pixel contour, native
world scale, 3/4 orthographic camera and nearest-neighbor rendering. A Persian
needs a rounder flatter face, cheek/chest fluff and plume tail; a Siamese needs
a slender shape, pointed coat, dark ears/paws/tail and blue eyes. A tabby needs
readable forehead M, cheek marks, body/dorsal stripes and tail rings. A different
color alone does not satisfy those shape/marking requirements.

Use the common skeleton, joint names and action functions. Accessories attach
to the head, body, paws or wing joints and follow the animation. Fur tufts,
tail length and wings change geometry rather than merely tinting a fixed model.
Preserve footprint and ground alignment; add transparent frame padding for wide
wings or tall hats instead of shrinking the whole cat.

## Present the complete cat

After creating a cat, include its **lightweight illustrated 2D dialogue bust**.
Preserve recognizable breed silhouette, muzzle, coat pattern, eye colors,
mustache and visible head accessories in authored artwork. Gameplay cats retain
the shared articulated rig; dialogue portraits no longer use a rotating 3D head.
The owner accepted no rotation in exchange for faithful illustrated styling.

Use [PawTrail Portraits](../pawtrail-portraits/SKILL.md) for the dialogue bust; it
can also be invoked separately as `$pawtrail-portraits`. Verify one selected style
before creating another. Author feline-specific lids, muzzle/mouth motion,
whiskers, coat markings and compatible expressions for each angle. Never apply
human or neutral-only facial performance across all cat emotions. Configure and
verify a cat-appropriate breathing band without stretching its muzzle.

Keep an automatic neutral profile picture, lazy loading, shared Canvas 2D playback
and the portrait skill's current angle and complete-style budget defaults. New breeds or hats need matching
authored art; identify a closest-coat approximation honestly. Follow the portrait
skill's full visual gate for emotion changes, speech, blink and breathing before
calling the portrait complete. Animal photographs and identity references remain
separate from decorative game portraits. The [legacy portrait guide](../pawtrail-actors/references/portraits.md)
now redirects to that single maintained workflow.

Every new cat inherits shared idle/breath/blink, walking, care/rest, expressive
tail motion, actions, audio and a single ground shadow. Reuse existing original
cat soundboard recordings where appropriate. Moving or changing direction must
not restart action audio or clear the selected action. Flight/jump shadows stay
on the physical ground and follow the action's height envelope.

Use `node scripts/pawtrail-actors.mjs render --id ID` from the game root. It is
the existing production exporter, not an application test. New cats and changed
geometry need a full export; `--actions` is for compatible shared pose changes.
Review exported native artwork for markings, silhouette, accessories, feet and
representative headings/actions. Keep art review separate from application
verification and respect workspace restrictions on tests/builds/browser use.

The live creator is `/play?preview=cats`; `&skin=ID` starts from an exported
template. It reuses the shared comparison field, action controls, effects,
shadows and mixer. Its reference copy is silent. Personal saves are data-driven
live appearances, while catalogue body PNGs still need re-export after a rig edit.
The live creator uses a denser native render and an Inspect face view so mustache
markings, irises and heterochromia remain visible when enlarged. Keep native
pixel density separate from world size: enlarging transparent padding alone
adds no detail, and denser sprites must not shrink their props or shadows.
Report the skill/model changes, preview link, which cats were exported and any
unreviewed behavior. Do not claim browser/audio verification when it was not run.
Cosmetic cats, breed presets, emotes and generated sprites never become genuine
identity references, actual care evidence, adoption records or verified Kibble.
