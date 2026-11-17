# Shared human locomotion rebuild — 11 November 2026

The owner rejected the previous restrained/block-like movement and requested a
full human movement revision. This supersedes the earlier instruction to retain
the old footstep pattern. Character geometry, UV skins, selected face style,
world scale, camera framing and 32 px tiles retain their existing dimensions.

## Shared gait

`actor-rig/human-gait.ts` is the single numerical gait source. It provides
alternating planted-foot/recovery phases, boot-sole heel/toe contact height,
two-bone leg solutions, running heel recovery/flight, lateral pelvis weight
transfer, hip yaw/roll, opposite torso rotation, forward lean, a steadier head,
contralateral arm swing, bent elbows and delayed wrist/forearm motion. The shared
rescuer rig applies it without renaming/reparenting existing joints, preserving
saved mesh paths and character customization. Non-locomotion actions still own
their authored poses. Moving upper-body actions keep the gait's leg solution.

Amber and Yae now preserve the shared hip displacement and locomotion shoulder
rotation, applying only their reference-specific width offsets. Their former
neutral-limb override was erasing the gait's side rotation on every walking and
running frame. Their independent face, hair, sleeve, cape and robe artwork stays
in the existing refined factories.

## Travel and sampling

Base walking is 128 px/s and running is 208 px/s, configured in the shared
ability definitions. The room service loads the same file for its speed budget;
its loader names that path explicitly. Running services must load the updated
configuration before applying these speeds in online rooms. No service
redeployment, production restart or online validation was performed here.

One complete left/right cycle corresponds to 78 px walking / 100 px running.
Creator/comparison, personal LiveCharacter and Item/Stage rehearsal use those
same distances. Static human previews use 20 fps walk / 26 fps run source timing;
native renders sample finer phases instead of limiting live motion to the
original twelve indexed poses. Cat clips and cat travel timing remain separate.

World/room input uses a bounded short velocity approach, existing collision
substeps and existing special-ability speed caps. Studio movement uses the same
base speeds without its old extra 1.2 multiplier. Pose changes use a 130 ms
transition, and live humanoid facing interpolates through smaller angular steps.
Reduced-motion handling retains neutral/frozen poses and the required jetpack
transition behavior. Existing movement authority, furniture contacts and item
hit windows are not replaced with animation-driven client authority.

## Relaxed standing idle

`actor-rig/human-idle.ts` now supplies the human standing pose. Its 2.5-second
cycle combines gently expanding chest volume, a small shoulder lift, backward
rock on inhalation, a following head motion, relaxed elbows/wrists and a minimal
lateral weight shift. The stance is slightly wider and staggered with outward
toes. A two-bone solution adjusts each hip/knee above fixed ankle targets; the
ankles cancel the leg rotation so the soles remain flat instead of sliding with
the torso. Small hip-height changes keep the knees softly bent throughout.

The subsequent owner-provided idle video informed asymmetric authored breathing
timing, a slightly deeper relaxed knee bend and delayed shoulders/arms. Weapon
clips use a `referenceStance` option for their authored angles; otherwise those
angles would be layered over the relaxed idle's different hip height. Unlocked
weapon attacks now retain distance-driven walking/running legs during movement.

Amber and Yae provide their boot/sandal sole heights and retain their own hip
widths. Their factory adjustments preserve the shared idle's arm motion. Base
humans and saved appearances inherit the same pose; gown slippers use their own
sole height. Joint names, geometry, UVs, collision dimensions and existing action
poses are preserved. Idle timing changes only the live human clip's fps (3.2 for
eight source poses); native live sampling remains finer than those eight poses.
Cats and original baked 2D reference sheets are unchanged. Reduced motion keeps
the neutral sampled stance. Painting/posing reference views may remain paused.

This improves articulated balance; the rig still uses rigid body parts rather
than a deforming anatomical chest or muscle simulation. Subpixel motion is
deliberately subtle at native pixel resolution. Visual review of the loop,
ground contact and transitions remains pending under the owner's verification
restrictions.

## Where to review

- Item Studio → Try: move Amber/Yae with WASD; hold Shift for the new run. Weapons
  continue to share the rig, including a back-carried hammer and hovering chain.
- Actor preview / creator: select walk/run and compare the native human rig with
  the existing 2D reference. Original baked 2D artwork is not regenerated.
- Explore and housing personal characters: LiveCharacter uses the shared gait,
  smoother pose sampling and transitions. Custom saved human appearances inherit
  the new shared animation; their appearance records are not rewritten.

Implementation and manual source review only. Per the owner's standing request,
no agents, automated tests, checks, builds or browser verification were used.
Visual acceptance remains pending; this is a procedural stylized-human gait,
not a claim of motion-captured or photorealistic animation.
