# Refined actors in the creator preview — 10 November 2026

`/play?preview=actors` now offers **Amber** and **Yae Miko** as featured selections
above the portrait, and in **Start with a look**. Direct links:

- `/play?preview=actors&skin=amber-outrider`
- `/play?preview=actors&skin=yae-miko`

Amber uses `createAmberShoulderStudy`, including the approved head, hair,
shoulders and cape. Yae uses her preferred own face and soft contour through
`createYaeStudy`. These are the actual refined factories rather than generic
appearance-slot approximations. Both reuse the existing actor comparison field,
movement/heading controls, idle/walk/run, native renderer, ground effects and
face inspection. Continuous secondary motion and finer pose samples preserve
the study's hair/cloth behavior without reauthoring the movement skeleton.

`creator/preview-models.ts` prepares the chosen factory and UV textures before
mounting the comparison scene. Changing model stops/cleans up the previous
scene before creating the new actor. Device draft state remembers the preview
selection; account/saved appearance contracts are unchanged. Loading a saved
custom character returns to the shared customizable model.

These two appearances remain fixed previews with the shared human action list.
Shape/color controls and Save are shown for customizable
templates, preventing a refined preview from being saved as an unrelated generic
model. No game-roster installation, unsupported save-schema extension, new sprite
exports or additional action claims are implied by this preview integration.

The human creator portrait is now a full-width panel up to 288×360 CSS pixels,
compared with 112×144 previously, and continues to fit authored pixels with
nearest-neighbor display. Amber and Yae use their existing Refined cel portrait
collections, including in the expression inspector. The shared portrait component
retains compact sizing for callers such as the cat creator. No new artwork or
extra per-character assets were generated.

Source was reviewed and mirrored to the integrated application and archived
standalone source. No agents, automated tests/checks/builds or browser verification
were run for this revision.

## Shared action restoration

The initial integration unnecessarily restricted refined models to idle/walk/run.
That selector restriction is removed. Both now expose the existing human action
catalogue: care actions, gestures, sit/sleep, emotes, running, power-up/dash and
staged jetpack flight. Existing effect/audio/shadow and ability rules remain in
the common actor comparison scene; no new gameplay permission or reward is added.

`refined-action-support.ts` archives replaced body art while preserving food,
water, supplies, cleaning cloth, pillow, blanket and jetpack equipment on their
original joints. It chooses each model's authored closed/half/open face patches
for rest/emotes, and binds custom neck/collar pieces to the shared torso bend.
Amber/Yae's idle shoulder adjustments now apply only to neutral locomotion;
gestures retain the base rig's action-specific arm angles. Yae's long panels
gather for lowered poses and Amber's cape folds for sleep. Actor identity and
the enlarged illustrated portraits are retained. These are source-level action
adaptations; no visual pass of every action or automatic sprite re-export ran.
