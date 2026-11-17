---
name: furniture-batch
description: Author or revise interactive game furniture from existing art, 2D sprites or 3D-to-2D sources. Use for requested furniture items and batches, including actor contacts, state artwork, palette masks and scoped installation; not for actor appearances or an unrelated editor rebuild.
---

# Interactive furniture production

Read the target workspace's `AGENTS.md`, then `.pixelsbymiku/project.json`.
The binding supplies the project's paths, art direction, preview routes and
authority boundaries. If absent, use the project's documented paths; ask only
for missing choices that block the requested work. Never infer authorization
for agents, automated tests, builds, browser review or external account changes
from this skill. Carry forward permission already given for the same scope.

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

Seats, state toggles, blocked approaches, rotation, palette saves and construction need visible result feedback in the real item preview; preserve local/server confirmation boundaries.

Reuse the existing event/feedback layer, pool or bound transient indicators, and
clean them up on reset/exit. Preserve contrast and useful reduced-motion feedback;
sound or color alone is insufficient. Keep local receipts distinct from confirmed
server saves/rewards. Review feedback under current verification permissions and
leave unobserved runtime behavior pending.

## Scope and representation

Read the selected queue entry, catalog record and existing manifest once.
Choose the explicitly requested item/batch, preserving unrelated assets and
worktrees. Record its starting state and source hashes. A planning request edits
the plan only; an authoring request includes the scoped catalog installation.

Honor the owner's selected representation for the agreed batch. If unresolved,
ask **2D sprites or 3D authoring with rendered views?** Interaction alone does not
require a mesh. State-only lights may use original sprite bodies and off/on art;
rotatable seats need every promised direction with matching actor contacts.
Read [the asset contract](references/asset-contract.md) before authoring.

## Art and interaction

Preserve the canonical front and accepted artwork. Generate only missing
directions/states through the environment's available authoring tools. Show new
generated art for the applicable owner review before dependent implementation.
Do not generalize an optional art-review timeout into approval for workflow,
scope, installations or other actions. Reusing approved native pixels needs no
new generation exercise. Use semantic palette masks for supported recoloring;
protect wood, pillows, contours and unaffected materials explicitly.

Reuse the actual project actor, renderer, interaction controller and editor.
Define ground collision separately from image bounds; author seat/approach/exit
points and per-facing foreground masks where needed. Keep the actor at native
scale with clothing/motion allowance. Preserve fixed-facing props as fixed-facing;
never spin front artwork to imply an uncreated side/back view. Use existing
durable state names and server actions instead of a parallel state system.

## Install and verify the requested scope

Version the changed artwork, metadata and masks together. Update only selected
catalog IDs and their required frontend/backend contracts, preserving prices,
inventory, source identity and existing placements. Reuse existing preview pages;
never create an editor or test harness per item. Keep local authoring/trial data
separate from authenticated state, occupancy, inventory and reward authority.

Inspect the final native composition. When tests/browser checks are authorized,
use a combined view board and one focused final pass for the current items.
State changes need their affected on/off/open/counter behavior; seat/contact
changes need their affected fit, collision and safe exits. Shared controller,
renderer, rotation or authority changes expand review to affected dependencies.
Do not repeat unrelated couch, mobile or project-wide checks without that reason.
Honor the project's browser choice. Missing required verification remains pending.

## Progress and handoff

When a studio run is supplied, use its explicit `task stage` commands to record
the actual start/completion, review waits, failures and evidence. Never fabricate
command output, durations, approval, a percentage or a passed check. Read
[the run example](references/run-records.md) when stage recording is requested.
Record statuses once in the existing queue/manifest: authored, installed and
runtime-verified are separate facts. Summarize changed IDs, actual checks,
remaining work and the next queue item; do not mark the whole batch complete
after converting one item.
