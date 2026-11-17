# Part-built actors → offline sprite playback

Use this operation when the owner requests a more controllable 3D source followed
by lightweight 2D playback. It does not require regenerating the existing actor's
portrait, icon, illustration, biography or voice. Reuse approved identity assets.

## Source accuracy and parts

1. Inspect the canonical actor and game scale. Reuse suitable approved front,
   side/back views; generate only missing visible construction references. Keep
   pose, proportions, lighting and costume consistent. Detail important joins:
   head/hair, goggles/ribbon, jacket/bodice, belt, gloves, boots and cape as needed.
   Record inferred hidden details as interpretations rather than reference facts.
2. Use an actual mesh-authoring or image-to-3D tool available in the session.
   State which: Blender mesh authoring is not a trained image-to-3D generator.
   Do not relabel a procedural approximation or an assembled reference picture as
   a Tripo-generated model. Do not require a particular paid service by default.
3. Build named editable meshes with appropriate thickness, curves and clearances.
   Separate semantic parts so incorrect shapes can be corrected independently.
   Preserve complete silhouette and sensible side/rear volume. Inspect the actual
   source views during authoring: component count alone does not prove likeness.
4. Paint or reuse approved textures after shaping. Keep stable material regions,
   UVs and optional palette masks. Important eyes/face details may remain textures
   on a curved 3D face; preserve their identity rather than replacing them with
   generic spherical eyes. Retain editable textures and source provenance.

## Skeleton and action scope

Bind each part to an explicit hierarchy with sensible pivots/weights. Prefer
existing compatible skeleton/actions; when a new skeleton is necessary, retain
its joint map and keep game retargeting pending until requested. Separate hair,
cape and accessory follow-through where the silhouette needs it. Keep scale,
garment contact, ground alignment and actor/prop clearances deliberate.

Author the requested action set before baking. A dedicated run needs its own
pose/lean/stride changes; speeding up the walk does not create new run artwork.
Use actual source clip durations and stable cyclic poses. Include face blink
and secondary motion where appropriate. A scoped idle/walk/run comparison must
disclose missing diagonal, interaction, equipment and combat states; it is not
the full actor action acceptance step or automatic game installation.

## Bake once, play sprites

Keep a detailed source before any native-pixel reduction. Physical mesh scale,
geometry density, texture resolution and final frame resolution are independent:
enlarging a 64-pixel sprite or scaling its mesh cannot restore facial detail.
When close-up inspection is requested, retain a sufficiently detailed face texture
and master renders, with genuine new artwork where the old texture lacks detail.
Preserve UV registration and identity; avoid treating a larger file as proof of
likeness. Keep the gameplay pixel edition separate from smooth detail previews.

Use a live model inspector with camera zoom when the owner needs to inspect
geometry and facial detail; CSS enlargement alone is insufficient. An HD sprite
face crop is still limited by its source frame. For larger animation sheets,
split by action/direction and load only the active clip; close released bitmap
buffers and cancel stale loads. Choose frame/texture limits from actual use
rather than eagerly decoding the entire HD animation library.

- Render the requested action/direction matrix in one bounded authoring job.
  Reuse installed tools and setup; keep CPU/GPU threads, resolution and temporary
  buffers bounded. No browser/UI is needed when an offline tool can do the bake.
  Asset rendering requested by the owner is separate from app tests/browser QA.
- Render consistent transparent frames with a fixed camera, pixel dimensions and
  ground anchor. Keep sprite art nearest-neighbor with integer display zoom and
  the actor's shared dark contour. Never normalize each gait frame independently
  in a way that erases stride, scale or motion.
- Pack actual rendered frames into a bounded atlas. The native manifest owns
  frame size, clips, direction ranges, durations, anchor and file paths. Record
  compressed/decoded sizes and source model/script hashes for reproducibility.
- Save an editable authoring file and a standard model export, real animation
  clips, part/joint inventory, reference prompts and representative source views.
  Download/inspect links must refer to those actual artifacts, not the old model.
- Add a clearly labeled baked comparison mode that loads image/manifest only.
  Do not instantiate Three/Phaser model renderers or evaluate skeletal poses in
  that sprite-only mode. Keep one selected preview loaded; unload releases it.

## Evidence and iteration

Inspect generated reference, actual source render, final native composition and
representative motion exports under the applicable permissions. Correct observed
issues in the affected parts, then rebake the clips they affect. Reuse unchanged
evidence; do not redo unrelated model/portrait/voice or app/mobile reviews.

Preserve all workspace gates for automated tests, builds and browser verification.
Report artwork/source inspection, successful baking and live acceptance separately.
Do not mark a pending in-game review as passed or a local comparison as a live
roster installation. Keep confirmed hit sprites/HP feedback if combat is in scope.

Amber's first scoped example uses `tools/actors/build_amber_parts.py` in background
Blender, then `tools/actors/pack_amber_parts_bake.py`. The source is in
`assets/actor-appearances/amber-parts-baked-v1/`; playback is
`/play?compare=amber-representations&mode=parts-baked`. These paths describe the
implemented pilot, not mandatory identifiers or frame counts for future actors.
