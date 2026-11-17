---
name: pawtrail-assets
description: Create PawTrail environment asset packages with matching artwork, animation, native manifests and optional textured 3D interactive models. Use standalone or from PawTrail Maps; route furniture, actors and monsters to their specialist workflows.
---

# PawTrail Assets

Read the current workspace's `AGENTS.md`. This skill produces scoped environment
assets, not a new map/editor or authority for tests, browser checks, external
services or agents. Keep local prototype state distinct from platform records.
Follow [animation and interaction](references/animation-and-interaction.md) for
frame/clip delivery, runtime consumption, actor contacts and motion budgets.

## Receive the art and behavior contract

When part of a whole-floor job, consume the reviewed design and asset families
from [PawTrail Floors](../pawtrail-floors/SKILL.md), preserving stage/content IDs,
shared assets, animation decisions and production dependencies. Its asset brief
is a plan, not production authorization or a substitute for map concept approval.

For map work, consume the approved concept/version and brief from
[PawTrail Maps](../pawtrail-maps/SKILL.md). Do not bypass its explicit concept
approval by generating the full production set first. A standalone asset request
does not require inventing a whole-map approval step. A skill update alone
does not authorize producing or installing assets.

Inspect the chosen reference and existing native art/manifests once. Record
identity, silhouette/materials, native dimensions, camera, anchor, footprint,
facings, animation role, actions/state, representation, output target and source
provenance. Reuse complete approved art/models/clips; generate only actual gaps.
Preserve the approved style unless the owner's new brief changes it. Transparent
cutouts and emissive layers require real alpha, including dark-mode edges.
Raster creation/edits use the image-generation workflow; image exports should
preserve the real native frame definitions and nearest-neighbor presentation.

## Select the representation from the requested use

The owner's **map-production default is actual textured 3D models for assets
the player can actively interact with**: seats, usable doors, terminals, switches
or other requested actions. Carry this choice into companion skills without
asking 2D versus 3D again. Use the existing illustrated-skin/model pipeline and
real rig/state clips when appropriate; do not model the entire map just because
one prop is interactive. This preference is not a technical claim that 2D cannot
support interaction.

Ambient animation and passive collision are separate: a hologram, lit facade,
fence or blocking wall can remain animated 2D scenery. Static terrain can stay
2D, with independent overlays for moving reflections or effects. Do not invent
interactions to justify a model. Do not convert unrelated existing catalogue
items or overwrite an earlier explicit representation choice.

If a selected reusable interactive prop is only 2D, make the gap explicit and
include its deliberate 3D conversion in the approved scope, or obtain an owner
exception. Never relabel a sprite as 3D. Check the actual target renderer before
promising live model playback: a 3D source baked into sprite views remains
**3D-authored, 2D-rendered**. Resolve a necessary renderer adapter or a different
runtime representation with the owner instead of silently substituting it.

Use the available specialist skills for their real work:

- **PawTrail Furniture:** usable furniture/props, model turnarounds, sitting,
  rotation, contacts, construction and palette materials. For this map default,
  pass the chosen 3D route and approved concept. Keep canonical fronts and obtain
  the specialist's applicable angle review; never pass silence off as map approval.
- **PawTrail Actors/Cats/Monsters:** character rigs, portraits, creatures and
  encounter contracts only when those entities are actually requested.
- **PawTrail Maps:** layout, path clearance, map-level depth and scoped installation.

Resolve companion skills from the available catalog; do not copy their complete
procedures here or invoke missing tools as if they existed.

## Author animation as part of the asset

Every new or revised asset needs an explicit animation assessment. Record its
ambient loop, state/action motion, contact reaction, or reason to remain static
in the selected scene. Terrain and rigid structural pieces must not deform just
to tick an animation box.

**Cyberpunk packages must include animation for each asset**, using an appropriate
moving component rather than moving the whole object. Holograms need visibly
moving projections/scan layers, buildings need changing window/sign/emissive
patterns, active machinery needs its actual moving parts, and reflective ground
or rigid railings can use subtle animated reflection/light overlays. Keep the
projection base, building shell and solid geometry grounded. A frozen PNG with
an animation label is incomplete. If the owner explicitly requests a static
exception, record that exception instead of claiming animation was delivered.

Produce sufficient unique frames or keyed motion for a natural loop at native
size; export their actual counts and durations. Separate body, emission,
foreground and shadow when their motion/depth differs. For 3D assets, keep clips
and material animations on the actual model or clearly declared render source.
Reuse accepted silhouettes/materials; do not regenerate the whole object for a
small localized light cycle. Show new production views for applicable art review.

## Connect and deliver the real package

Supply stable IDs and versioned artwork/models, textures, clips/atlases, exact
frame sizes/order, timings, ground anchors, supported facings, collision geometry
and action/state hooks. Metadata must match real files and actual renderer APIs.
Connect playback to the selected runtime when installation is authorized; if it
only accepts static images, record and implement the necessary scoped adapter
within authorization rather than declaring the animation finished at export.

Player actions must drive the real controller and visibly register accepted,
blocked, failed or changed state. Preserve actor scale, occupancy, approach,
contact and safe exit/cancel. An attractive mesh or action button does not prove
an interaction works. Fictional hits, when requested, retain the shared confirmed
contact-sprite plus damage/status feedback requirement.

Use a shared bounded clock/cache, stagger loops per instance, cull/pause offscreen
work and dispose resources on exit. Do not duplicate giant ground textures for
every lighting frame or add a live 3D renderer for a decorative 2D light effect.
Preserve reduced motion and authoritative durable state separately from transient
animation time. Keep source/job files outside runtime imports and CSS scanning.

Inspect native artwork, facings and animation frames as permitted authoring work.
Run runtime/interaction checks only under the current project's authorization;
unobserved playback, contacts and performance remain explicitly pending. Reuse
unchanged evidence and avoid unrelated mobile/item regression sweeps. Keep one
job record of real timings, revisions, approvals, outputs, omissions and evidence.
Report authored, installed and runtime-verified as distinct states; a still
render or structural export cannot approve motion or gameplay.
