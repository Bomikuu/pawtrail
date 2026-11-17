---
name: pawtrail-furniture
description: Author interactive PawTrail furniture using native 2D sprites or 3D sources rendered to 2D. Choose the workflow, add collision, actor contacts, states and optional construction, then preview actual interactions. Use for furniture, props and ground behavior, not character appearances.
---

# PawTrail Furniture

Read the game workspace's AGENTS.md. Keep furniture art, collision, actor
contacts and state separate. Reuse shared actor rigs/animations and existing
housing interaction/navigation rules; do not duplicate the actor action library.

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

Sitting, occupancy, blocked approaches, rotation, lights/doors, palette saves and construction need clear in-world or control-state confirmation; numbers are only for real numeric changes.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Choose the workflow first

If the owner has not already chosen, ask: **“Should this use 3D + 2D renders,
or 2D sprites only?”** Recommend **2D sprites** for interaction-focused work;
**3D + 2D** supplies a source model and rendered views. Wait for the choice before
dependent art/model work. The no-response art-review default does not answer this
question. Honor an explicit choice or an unambiguous acceptance of a proposed
workflow without asking again. Keep that choice for the agreed request/batch and
record it in the queue.

**2D sprites:** follow [the sprite workflow](references/sprite-workflow.md):
original art → collision/seat/approach/exit points → state frames/foreground layers
→ actual actor preview → scoped installation. Chairs, sofas, beds, climbing,
collision, actor fit and state changes can all work without a furniture mesh.
Reusing existing 3D-derived actor animations does not make the furniture 3D.

For upholstery/body color changes, use [masked palette coloring](references/palette-coloring.md)
with the existing views before generating color-variant sprites. Protect other
materials explicitly and recolor foreground layers with the same palette. The
original two-seat sofa supports editor color preferences and per-placement live
colors. Keep local authoring preferences separate from database-backed placements;
the interaction trial remains local.

**3D + 2D renders:** follow [reference fidelity](references/reference-fidelity.md)
and [the production workflow](references/workflow.md). A hybrid model with
illustrated layers belongs to this mode. Choose it for source geometry, coherent
model views or free camera inspection, not because an object supports sitting.

The current texture editor is `/play?preview=furniture`, setup is
`/play?preview=furniture-setup`, and comparison is `/play?compare=furniture`.
Keep existing authored models (`studio-couch`, curtain, aquarium, timber pieces
and chairs) installed. Original 2D inventory IDs stay distinct from model IDs.

## Art review

On the selected model route, Request furniture and substantial conversions/remodels
start with a generated coherent multi-angle reference set. Follow
[the turnaround workflow](references/furniture-turnarounds.md). Keep an existing
original front canonical; generated side/rear views propose unknown construction.
A matching front alone does not complete a multi-angle model.

Show a newly generated set and ask whether it is good enough for modeling.
Use the owner's stated 60-second optional art-review window: yes advances, no
revises, and no response advances under the explicit default. Record silence as
`no_response_default`, never affirmative approval. This default is specific to
that generated-art review and never chooses a representation or expands scope.

The sprite route reviews its actual artwork/state frames. Reusing an unchanged
original does not require generating turnarounds or asking for another art
approval. If new artwork is generated, show it for the applicable art review.
Do not create a mesh, GLB or unused hidden-face references for sprite-only work.

## Interactions and states

Every interactive object needs an explicit actor contract: solid/traversable
parts, triggers/actions, actor/species/tool requirements, visible response,
occupancy, approach and safe exit/cancel. Read
[actor/environment contacts](references/environment-contacts.md) for cloth/bush
sway, wall recoil, bounded fish, wet footprints and grass/soil tool responses.
Do not make an entire window passable merely because its curtain is soft.

Sitting docks the actual unscaled actor to a seat point with facing/elevation,
reserves the slot and releases it when standing, cancelling, leaving or removing
the item. Preview each seat and both seats when present. Keep arms/pillows,
clothing/breathing allowance and foreground layering readable at native scale.
A mesh is not required for these contacts. Single-seat controls must enable
seat 1 and disable seat 2/Both seats; never hardcode seating to the couch model.

Candles can use 2D off/on frames with optional flame/glow. Keep durable state
per placed item through the existing housing backend (`lit`, `open`, resource
counters and care timestamps). Occupancy uses leases, animation phases are
transient, and authoring/trial state stays explicitly local. Read
[the interaction queue](references/interaction-queue.md) for the current scope
and source-backed contracts. Inspect-only/collision metadata alone is not a
reason to create a new model; do not invent actions to justify modeling.

## Artwork, facings and installation

Use native manifest frames/anchors, nearest filtering and integer zoom. Preserve
source identity, counts, silhouette and warm light/middle/shadow divisions.
Match the character's thin brown contour once; do not double-outline already
finished sprites or actors. Use source RGBA for extracted foreground masks.
For model-specific contour, material and camera rules read reference fidelity.

A rotatable 2D seat needs front, right, back and left sprites with matching
seat facing, contacts and foreground occlusion. Sprite-only does not mean
front-only. Preserve the original front and reuse accepted views; author only
missing directions. A front-only sitting pilot is incomplete for rotation and
must be described that way. Intentionally fixed-facing props can stay front-only.
Switch frames when rotating; never spin a front image flat to imply missing
facings. Where multiple facings exist,
keep the owner's circular rotation button above the selected object in creator
and live placement; a toolbar angle alone does not replace it.

The creator's drafts and JSON exports are local authoring data. Installation
updates selected catalog/native assets deliberately, preserving item IDs, prices,
styles, inventory, construction and saved placements. Backend/client collision
and actor contacts must use the same definitions. Spending, recipes, ready times
and inventory grants remain on the game server; no verified rewards or payments
come from client totals or trial fixtures.

Mirror only the changed modules, selected records and new versioned assets into
the main app. Do not run the blanket game sync over unrelated social/actor work.
Preview-only requests stay preview-only; an authorized install needs no redundant
permission request.

## Batches and verification

Use [batch mode](references/batches.md) within this same skill. Read
`assets/furniture-studio/batches/conversion-queue.json`; record representation,
source/provenance, review state, actual installation and remaining work. Older
“needs 3D” suggestions do not choose a workflow for a new batch.

Sprite batches reuse native art and review contacts/state/foreground together.
Chosen model batches reuse valid shape families and exports, generate independent
references together, preview canonical materials/actor fit, then use one
Firefox/Vite session per final batch pass. Metadata-only edits do not require
rerendering unchanged pixels. Never share mutable textures or actor poses to
obtain a speed-up.

Keep subsequent batches lean: reuse the existing editor/trial and shared
controllers, inspect one combined facing board, and use one focused final
interaction pass. Recheck shared occupancy/navigation mechanics only when their
implementation changes or a failure warrants it. Record revisions/status once
at completion; do not duplicate reports or repeat source discovery and browser
checks for unchanged items. Read the fast sprite loop in
[the sprite workflow](references/sprite-workflow.md).

Routine furniture asset/state batches do not include mobile sweeps, repeated
couch/other-item visual reviews, editor navigation tours or project-wide typecheck
loops by default. Keep shared UI and tooling unchanged when possible. Do not add
generic selectors or refactor preview infrastructure merely to process an item.
Separate incidental tooling improvements from the batch; explain necessary new
interaction/infrastructure work before broadening. Keep current-item visual and
functional checks, and use targeted contract tests for genuinely affected shared
logic. Broader mobile/other-item review needs a concrete dependency risk or an
explicit request, not a blanket quality checklist.

Reuse prior evidence only when its artifact, inputs and dependencies remain
unchanged. Changes to shared contacts, rotation, navigation, renderer or
interaction lifecycle broaden review to affected views/items and behaviors;
failures or uncertainty can require more checks. Required directions, state art,
actor fit, collision, occupancy, safe exits, budgets and owner review gates still
apply. Inspect the final composition and affected behavior; unavailable required
review stays pending. Report the actual bottleneck rather than dropping details
or checks to meet a time target.

Follow workspace limits for agents, tests, checks, builds and browser review.
Use Firefox for requested visual/interaction checks and inspect the final native
composition rather than judging source code alone. Isolated asset export is
separate from live account testing. Report which art and interactions were
actually inspected, what was installed and what remains unverified.
