# Batch A — authored and installed for rehearsal

The owner approved concepts A/B/C, then requested production. The four prop
turnarounds and both NPC designs/Refined cel portraits were explicitly approved
in this chat. No silence/default was used for these approvals.

## Open the three versioned stages

On the standalone Vite server (configured port 5173):

- `/play?preview=stage&map=f01-lobby` — Wayfarer Concourse.
- `/play?preview=stage&map=f01-arrival` — Lantern Landing.
- `/play?preview=stage&map=f01-market` — Lumen Market.

The Stage Editor Files menu also opens each stage. Existing `cyberpunk` and
`neon-heights-v1.json` are retained. The current explicit Save locally action
still owns the existing editor save key; opening a template does not save it.

Choose **Play map**, walk with WASD/arrows, run with Shift and use E near a prop
or NPC. Edit mode shows exported model views. Play mode lazy-loads the actual
textured GLBs and existing couch model into one shared prop WebGL context.
Mara/Ivo use the shared humanoid rig/context with character-specific appearances.
NPC presentation includes generated full-body idle illustration, a compact icon,
and Refined cel portraits: three angles × six expressions × five face states,
with complete torso breath frames. Voices and combat variants are deliberately
outside this friendly first-loop NPC batch.

## Runtime package and behavior

- Two new continuous native grounds, a lobby wall, workshop, awning and clinic
  canopy. Existing district building bodies and scenery are reused.
- Localized window/sign light banks and ground reflection sweeps; fixed shells
  and colliders. Android projection has keyed scan/displacement, with a fixed
  emitter. Koi use four authored tail/fin frames per fish and continuous orbits.
  Fans rotate their rotor region; only awning fabric deforms.
- Lift: two real sliding leaves; closed passage/columns versus open columns,
  per-facing contacts and occupancy guard before closing.
- Allocation console: real separate lever nodes and emissive materials. Inspection
  changes its local presentation; it does not allocate power or spend a Cell.
- Planning board: generated map paint on actual geometry, a lit display and a
  route-inspection outcome. Vendor counter: real cabinet/display geometry and a
  moving lid for local inspection, without claiming a purchase.
- Camp seat reuses the approved `studio-couch` source, native seat approaches,
  occupancy/controller and separate foreground pass. Rotation uses the existing
  editor control and per-facing contacts. No new sofa artwork is generated.
- E near Mara/Ivo approaches their local contact and opens the presentation
  dialog. It exposes all authored portrait angles/expressions and speech motion.
  These rehearsal lines do not mutate campaign memory/reputation/quests.

One stage clock owns transient time. Live prop output is bounded to 16 instances
and cached at 80 ms steps; existing furniture frames use fixed phase buckets.
NPC output has fixed idle frame keys and an eight-instance cap. Visible objects
are culled, hidden documents pause scheduling, and model resources/context are
released on leaving Play. Reduced motion keeps ambient poses stable while real
state changes still redraw. Source masters and Blender files live outside
runtime imports and Tailwind discovery.

## Production sources

`assets/floors/f01-neon-heights/batch-a-v1/` contains exact built-in image-generation
prompts, source/provenance JSON, four `.blend` sources, native layout contact
sheets and model views. Runtime files are under
`public/pawtrail-game/floors/f01/`. The source registry is
`src/game/stage-editor/f01-art.json`; exact model dimensions and projected contacts
are in `batch-a-v1/model-manifest.json`. Native scenery and model exports use
`scripts/prepare-f01-batch-a.py`, `author-f01-props.py` and
`register-f01-batch-a.py`. Scoped friendly NPC export uses `prepare-f01-npcs.py`
and the durable `scripts/actor-job.py` production ledger.

The GLBs contain beveled part geometry and embedded generated paint patches;
the reference fronts are not used as billboard substitutes. Runtime motion is
keyed on named GLB nodes/materials, not an unused clip label.

## Acceptance status

Native artwork, all sixteen model views, three map compositions and both
portrait angle/expression review sheets were visually inspected during authoring.
This is static source inspection, not runtime animation or interaction approval.
The source models are a native-scale interpretation of the approved references;
their live camera/lighting, pose fit, depth and speed still need runtime review.

Phase 1's seven tests/typecheck covered its previous source revision. Batch A
changes the stage adapter, renderer and interactions; the old pass does not prove
this revision. New focused contact/layout tests are authored but unrun. The owner
explicitly chose **“Skip verification for now”** when offered four new tests,
seven foundation tests, a scoped typecheck and a focused Firefox pass for Batch A.
Browser/build/new typecheck were not run as part of native production.
No performance figure or game interaction pass is inferred from these exports.

The connected prepare → enter → act → remember → return loop, real lift travel,
P01 choices, quest claims, purchases and persistent NPC callbacks remain Phase 3.
The editor explicitly labels this installation an art/interaction rehearsal.
