# Batch mode within PawTrail Furniture

Use this workflow for multiple furniture items. It is a mode of the existing
`pawtrail-furniture` skill, not another skill or a second model/actor system.

## Prepare a reviewable batch

Use the actual catalog and `assets/furniture-studio/batches/conversion-queue.json`.
Ask for the batch representation unless already chosen. For 2D batches use
[the sprite workflow](sprite-workflow.md); source art, contact points, state
frames and foreground layers need no model export. The reference-generation
and model-rendering commands below apply only to a chosen model batch.
For sprite batches, use the fast repeatable loop in that reference and stop
reading the modeling commands below. Rotatable seats still require all four
authored directions and per-facing actor composition; skipping a mesh does not
skip side/back art.
Apply the current [interaction-first scope](interaction-queue.md): confirm a
meaningful action/contact, define its state contract, then separately justify
physical volume or actor fit before scheduling 3D. State changes alone stay 2D.
Inspect-only and generic copied actions are insufficient. Defer those items
without removing their current sprites or installed models.
Before scheduling modeling, classify every item as retained 2D, hybrid 3D or
volumetric 3D using [representation rules](representations.md). The catalog's
current decisions are in `assets/furniture-studio/batches/representation-plan.json`.
Keep separate sprite-polish batches and 3D batches, with distinct counts/statuses.
Do not generate turnaround sheets or GLBs for items deliberately retained as 2D.
Group a small number of related shapes; keep each catalog ID and its provenance.
The usual review batch is three shapes, adjusted for complexity. A genuine color
variant or identical-source alias may reuse geometry and already accepted angles;
do not regenerate a known shape simply to give another inventory ID a model.
Preserve its distinct textures, interactions, stock and prices.

Generate independent reference sheets with concurrent built-in image tool calls
when available. Use one prompt/call per distinct shape. Show the selected angles
for the batch before dependent modeling and follow the review window in
`furniture-turnarounds.md`. Do not merge reference approval with an unshown model
approval or claim the whole queue complete after one batch.

## Fast authoring loop

1. Record source hashes, selected references and reuse decisions once. Prepare
   contacts/foreground requirements alongside the shape, before the final export.
2. Reuse the existing primitive/material helpers and immutable source data. Keep
   recolor calculations memoized within each model/style, and projected contacts
   cached per facing; styling alone does not change geometry. Never share mutable
   GPU textures or actor poses between item instances to obtain a speed-up.
3. Render only the canonical material for the batch's first look:

   ```bash
   node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --preview
   ```

   This uses one isolated Firefox/Vite session for all listed items. It writes
   four facings and supported three-quarter views under
   `assets/furniture-studio/previews/<id>/<revision>/`. It skips extra materials,
   motion sequences and GLBs, and does not replace the live
   catalog, generated registry or final export. It cannot be combined with
   `--install`. Seating furniture includes canonical actor/seat-fit evidence so
   clearance can be corrected before full materials; single-seat pieces also
   get standing views. Nonseating previews skip actor evidence. Final exports
   retain the required evidence.
4. Inspect the batch together at native integer zoom. Resolve silhouette, UV,
   outline, shading, contact and frame-margin issues in one correction pass.
   Keep the character-matched outer contour and structural divisions; never
   remove details, contacts or required viewing angles merely to be faster.
5. Publish the changed items together after correction:

   ```bash
   node scripts/pawtrail-furniture.mjs render --ids table,side-table,bookshelf --install
   ```

   One browser/server session serves the whole pass; each model releases its
   local renderer/resources before the next. Keep final materials, source GLBs,
   meaningful ambient frames, actor evidence and native geometry together.
   `--id <item>` remains available for a genuine single-item revision.
6. Retain successful versioned outputs and reference manifests as the cache.
   Select only dirty IDs in the next pass; preserve valid unchanged exports.
   Use source/definition/reference/render-policy hashes to decide whether that
   reuse is valid. The current CLI renders every explicitly supplied ID; it does
   not implement automatic dependency-based skipping. Do not invent a cache flag.
7. When only approaches, collision or contact metadata changes, reuse existing
   pixels and unchanged model geometry. Refresh projection/manifest/catalog
   metadata through a narrow metadata operation; implement that operation if
   needed rather than rerendering images for convenience. Keep immutable version
   records honest. The CLI currently has no contacts-only command; do not claim
   one exists or run `render` and describe it as a metadata-only speed-up.

Use existing generated outputs, native dimension manifests and published records
for source review instead of repeatedly rediscovering the project. Install/check
the matching Firefox runtime once when needed, not once per item. Reuse a running
batch authoring session; do not open the live app for unrequested verification.

## Finish the batch

Update per-item status, review result, final revision and limitations. Merge only
its records/assets and required shared helpers into the main app. Rendered
furniture receives its contour exactly once before compositing separately
finished actors. Preserve collision/seat/perch transforms and the circular
above-item rotation action. Keep account data and verified rewards separate.
Update this bookkeeping once per completed batch. Do not write a separate long
report or rerun unchanged shared interaction tests for each catalog item.

Report references shown, models actually installed, remaining count and the
actual review scope. Follow workspace limits on agents, tests/checks, builds and
browser verification; faster production does not grant extra permissions.
