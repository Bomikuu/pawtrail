# Illustration motion and integration

Read when producing a loop or wiring an approved illustration into a screen.
This is an authoring guide, not a claim that a matching registry already exists.

Full new-actor deliveries contain normal and enraged attack-pose variants.
Apply the prompt/motion contract to each separately, using the changed pose,
expression and safe bounds for enrage. Keep each variant independently selectable
with its own poster and animation metadata; reuse suitable background layers.
See [variants and feedback](variants-and-feedback.md) for the illustrated
performance and feedback checkpoint. Do not hide an absent enraged asset behind
a tint or a manifest entry pointing at the normal art.

## Updated visibility, motion and blinking

Apply [the actor performance contract](../../pawtrail-actors/references/illustration-performance.md)
in prompts, artwork, shared playback bindings and actual preview acceptance.
Background and aura must be clear as independent layers. Increase loose hair/garment
travel with a slightly quicker sway while keeping attachments stable, and include authored natural
blinks in both variants where eyes are visible. Unused blink artwork or new metadata
that the renderer never plays does not complete this stage.

## Prompt structure

> Make a [selected style] [full/three-quarter-body/torso] illustration of
> [character], preserving the attached identity reference's [face, hair,
> costume, ornaments] and the approved style's [contours, shading, pixel density].
> The selected illustration reference is the STYLE authority. Default to the
> Refined cel + painterly blend: keep NEW Sieghart's mature anatomy/features,
> detailed face/hair and rich painted material depth, combined with OLD Sieg's
> pixel texture, readable cel-shadow planes, grouped highlights,
> semi-bold stepped outer contours and finer internal face/detail
> lines. Preserve that outline around hair, clothes and props through the loop.
> A later Refined cel portrait does not change this illustration's style.
> Preserve the new illustration's painted richness inside the old style's crisp,
> readable shapes and pixel accents. Painted interior transitions are allowed;
> do not flatten away detail, return entirely to the old style or merely apply
> a pixel filter to a smooth painting. Compare both references at equal head size.
> Use a consistent [chosen native size] and edge treatment across every frame.
> No blurred silhouettes, noisy tiny details or indiscriminate sticker halo.
> Intended use: [loading screen / special-ability cut-in / scene-side overlay].
> Pose: [specific gesture and silhouette]; expression: [one fixed expression].
> For enrage, use the owner's demonic smiling/angry reference: sharp brows,
> narrowed eyes and a dangerous grin or intense angry glare on this actor's face.
> Camera and scale stay fixed. Animate only [specific hair sections / robe hem /
> ribbon / accessory] with readable, stronger [wind direction, amplitude] sway
> and a slightly quicker secondary-motion cycle. Hair roots,
> shoulders, face and hand grips remain stable. Arrange [chosen count] complete
> drawings in identical cells with sufficient gutters and a constant [anchor].
> Every frame contains the intact character; preserve all costume details and
> overlaps. Include this character's matching open, half-closed, fully closed and
> reopening blink drawings while retaining the held expression and registration.
> Transparent background, generous movement margins. No text, UI, dialogue emotion
> sheet, talking, whole-body rocking, camera movement or scenery.

The default is the combined direction above. Strict pure-pixel constraints apply
only to explicitly selected pixel categories; the blend retains painted interior
depth. Keep pure Painterly anime fantasy available separately. Use a resting illustration as
the identity/style anchor for motion after it matches the selected illustration
reference. Do not use the
rejected smooth Amber V1 as a Refined cel style reference. Inspect real gutters
before slicing; nominal equal divisions are not
evidence that a generated sheet is aligned. Cropping/alignment follows imagegen's
processing permissions and keeps original sources.

For the subsequent 3D model, retain this approved full-body resting illustration
and generate only needed static matching turnaround views. Keep front, three-quarter,
side and back construction coherent; never interpret a newly invented accessory
in a turnaround as part of the approved design without reconciling it first.

## Loop construction

- Register the body using stable anatomy: neck base, shoulders, hips and planted
  feet as applicable. Use one native scale and whole-frame translations. A changing
  hair/cape bounding box or the moving silhouette's centroid is not the body pivot.
  Preserve face/head size and weapon grip; never move facial features to hide drift.
- A calm loop commonly spans 4–6 seconds. Preserve this slow motion through actual
  in-betweens, not by holding six widely separated poses for almost a second each.
  Around 10–12 visible updates/second can be a useful initial cadence; inspect the
  motion instead of imposing an fps target. Keep pauses only where physically
  intentional. More frames do not fix inconsistent anatomy or costume drawings.
- Author enough compatible in-between drawings, or rig **purpose-built separated
  painted hair/cloth layers**, pinning roots and deforming only loose sections
  with weighted mesh motion. Reuse the implemented live painted-part path below
  for suitable held poses; bake complete native frames when a destination needs
  frame-only playback. Preserve outlines and painted folds. Neither path means
  whole-image warping, face morphing, pose crossfades or optical-flow repair.
  Do not claim an unsupported renderer or metadata path exists.
- Use small key-pose sets as authoring inputs, not automatic completed motion.
  A 4–5 second cycle at 10–12 updates/second commonly needs about 40–60 finished
  frames. Adapt to the actual motion and checked exporter/runtime limits: the
  current shared illustration loader allows at most 64 atlas frame entries per
  track. Do not exceed that contract, repeat unchanged frames to claim smoothness,
  eagerly decode the roster or silently inflate transfer/decoded-memory budgets.
  Measure the finished bundle. A focused extension of a limit needs real scope.
- Hair tips and cloth hems lag from stable roots, with staggered phase/weight
  instead of every part swinging together. Use eased direction changes and a
  natural cyclic return. Mechanical ping-pong can reverse folds/velocity abruptly;
  use it only when the actual motion and seam look continuous.
- The owner's current default favors stronger visible hair/robe/ribbon travel
  and a slightly faster secondary sway than the old subtle preset. Increase
  amplitude as well as speed, preserve calm breathing and anchored anatomy,
  and follow the actor performance contract's tuning guidance. Keep authored
  half/closed/reopening blink drawings visibly playing in both variants.
- Keep secondary movement small relative to the silhouette but visible at the
  destination size. Hair and cape should not move as a single rigid slab. Keep
  folds, highlights and outlines attached to their material through the swing.
- Loop from a stable phase. Native-pixel art should move in deliberate pixel
  steps with integer sampling; an illustration may have smoother authored edges.
- If a layered/deformation alternative is explicitly chosen, use authored clean
  layers with correct overlap coverage and attachment pivots. Do not cut arbitrary
  holes or use a generic full-image CSS sway as a shortcut for cloth animation.

## Hair and lightning motion

- Visible hair has a continuously looping motion of its own in every normal and
  enraged illustration during active playback. Animate appropriate locks/tips with
  pinned roots, staggered follow-through and an eased cyclic return. Short hair
  needs smaller but still readable tip travel; bald or fully covered heads do not
  require invented hair. A brief natural reversal is fine; long frozen holds are not.
- Included lightning must visibly move through changing arc paths, traveling energy
  along branches or branching/retracting tips. Soft brightness pulses supplement
  that movement; opacity-only animation of a fixed bolt does not fulfill it.
  For face lightning, keep the emission point pinned to the authored eye/temple
  while loose arc ends evolve. Keep the face and dangerous grin/glare intact.
- Use compatible authored effect frames or a genuinely supported, appropriately
  pinned effect rig. The existing part `pulse` field controls opacity only; it does
  not create moving lightning. Do not invent manifest fields or describe a pulse-only
  implementation as arc motion. Retain clean transparent sources and layer separation.
- Review hair and lightning independently at destination size across full cycles,
  with other effects/background hidden, then in the complete composition. Check
  readable motion, fixed roots/origins, safe bounds, loop continuity and face clarity.
  Avoid rapid strobing and exaggerated head/body sway. Preserve user pause,
  reduced-motion stills and offscreen suspension; these are intentional exceptions
  to continuous active playback.

## Live painted-part motion

PawTrail now has a continuous 2D painted-part renderer in
`src/game/creator/illustration-motion.ts`, loaded through `illustration-assets.ts`
and composed by the shared `IllustrationPreview`. Reuse it for suitable held-pose
artwork; an already implemented mesh path does not need offline duplicate full
frames or a new renderer for each actor. Existing complete-frame atlases remain
supported and should not be silently converted during unrelated work.

The manifest's `motionRig` declares a parts atlas, `cycleMs` and ordered parts.
Each part has a source `rect`, composition `offset`, fixed `root`, bend `direction`,
`length`, native-pixel `amplitude` and `phase`. The fixed face/body/grip part has
zero amplitude. Separate loose hair/cloth pieces need actual clean masks and
painted coverage beneath them. Optional `pulse` controls a separate painted
effect's opacity; it does not animate the face. An optional integer `cycles`
(1–4, default 1) makes a part complete that many mesh-motion cycles per base loop;
this lets anchored lightning arcs evolve faster than the calmer hair/cloth.
Moving arcs still need nonzero deformation or authored effect frames. The loader bounds these fields;
honor its current contract rather than inventing unsupported metadata.

Set amplitudes from visible tip travel at the actual destination scale, not just
the number in the manifest: root weighting can reduce an already small amplitude
to an invisible fraction of a pixel. Keep roots stable and stagger the loose ends
through a calm continuous loop. Reject tiny motion that reads as a still, detached
seams, rigid slabs, clipped tips and face/body wobble. A running clock or changed
frame hash is insufficient; inspect the actor with background/aura disabled and
then restored across multiple complete cycles. Reuse the current artwork for a
motion-strength correction; regenerate only if clean parts/underlay art are missing.
Version the installed motion data so an open preview cannot retain a cached old rig.

Review normal and enraged independently, including face-effect attachment,
pause/restart, visibility return, reduced motion and fallback. Record the real
method as continuous painted-part motion, not dozens of authored drawings.

## Actor-preview binding

Full new-actor creation automatically includes this integration after the
portrait and icon. Inspect the current catalogue and editor before adding an
entry; follow the existing path rather than creating a parallel gallery:

- `src/game/creator/illustrations.ts`: register the character's name, own versioned
  runtime folder and native size. Use the actual manifest's dimensions.
- `src/components/game/shared/illustration-preview.tsx`: reuse `IllustrationPreview`
  for atlas playback, integer display, pause/restart, reduced motion and cleanup.
- `src/components/game/character-creator-editor.tsx`: retain the Portrait tab and
  expose the matching Illustration tab for the selected character.

The existing Amber binding is the integration example, not a generic fallback.
Resolve **the actual actor identity**; multiple characters can share a body rig
or the `shared` preview model. If that lookup cannot distinguish the new actor,
extend the identity binding so each selects its own illustration instead of
assigning one image to every shared-rig character. Do not substitute Amber's or
another actor's illustration to satisfy an empty entry. Keep art cosmetic and
separate from saved gameplay appearance data.

Return `/play?preview=actors&skin=<actor-id>&art=illustration` with the Illustration
tab selected for the intended actor. Installing the generated assets and binding
is required in full actor creation even when browser review is not authorized;
record playback acceptance as pending in that case. Preserve game integration
boundaries when mirroring into the running app. A manifest without this binding
or a tab displaying only its poster is not a completed animated preview.

## Runtime behavior

Adapt existing asset/playback contracts. A data entry needs the native cell size,
anchor/content bounds, atlas frame rectangles or frame paths, duration/sequence,
poster and version. Document which fields the renderer actually consumes; a new
JSON file alone does not provide working integration.

Use the poster for the immediate/failed-load/reduced-motion state. Start the loop
only after its first required frames are ready. Preload only the current/soon
needed character; share decoded frames, bound caches and cancel stale loads.
Account for decoded/GPU memory as well as compressed transfer bytes: an RGBA
256×384 drawing occupies about 384 KiB before implementation overhead, even if
its compressed file is small. Avoid eagerly decoding the complete roster.

Animate only while visible and the document is active. Stop timers on dismissal,
scene exit and unmount. Honor reduced motion with the resting poster. Keep this
presentational loop silent unless the user requests sound; an existing ability
sound follows its original lifecycle rather than every loop iteration.

Loading art must never delay navigation or add a minimum waiting time. Ability
cut-ins are nonblocking by default: do not capture movement or keyboard focus,
extend an action, change cooldowns, restart audio, or leave overlays behind after
the action ends. Reuse the action's real start/end/interruption signals. A brief
entrance/exit may move the composition; that is separate from its idle cloth loop.
Keep important play areas and controls clear, with a static fallback if necessary.

Record visual review of the first/last seam and several repeats at actual display
size. Review loading or action transitions only when that installation and browser
review are authorized. Source-only work is not a motion pass.
