# Interactive Furniture Queue Implementation Plan

> **For agentic workers:** Execute directly, task by task, under the workspace's no-agent instructions. Interaction-01 has been executed as recorded below; remaining tasks are planned. Do not run application tests, checks, builds or browser verification without a request.

**Execution update (2026-11-11):** Interaction-01 is installed with three approved chair models and native actor-fit evidence. Current counts are nine authored models, 24 pending 3D, 20 interactive 2D and 57 deferred sprites. Other batches remain planned; live gameplay has not been verified.

**Goal:** Prioritize new 3D work for furniture with meaningful actor/pet interactions, including furniture states such as candle on/off.

**Architecture:** Reuse the current furniture exporter, native Phaser assets, actor/pet contacts and housing interaction service. Save durable state per placed instance in `PlayerHouse.object_states`; keep occupancy in existing leases and animation phases transient. Leave inspection-only items as their existing sprites for now and preserve all previously authored models.

**Tech Stack:** Existing TypeScript/Phaser/Three.js furniture pipeline and Django housing backend. Keep existing shared shadcn controls when UI changes are needed.

**Spec:** The owner's interaction-first request and `assets/furniture-studio/batches/interaction-plan.json`. That file defines per-ID routes and interaction/state contracts; `conversion-queue.json` defines execution order.

## Global constraints

- Implement directly without agents. Do not run automated tests, checks, builds, or browser verification unless requested.
- Keep prototype saves and Kibble clearly local. Never treat client reward totals as authoritative Django data.
- Preserve catalog IDs, inventory, prices, construction rules, source sprites and saved placements. Do not delete existing models to enforce the temporary priority.
- Show generated multi-angle references and resolve the configured review window before dependent 3D modeling. A planning request does not start that generation.
- Use native manifest dimensions, nearest-neighbor integer zoom, character-style outlines and actual unscaled actors with clearance.
- Inspection, generic collision, placement rotation and colors do not qualify an item for new 3D work.

## Queue

| Batch | Items | Interaction/state |
| --- | --- | --- |
| `interaction-01` | Chair, Armchair, Dining Chair | Sit/stand; available/occupied seat leases |
| `interaction-2d-02` | Candles, Floor Lamp, Garden Lamp | 2D `lit` on/off sprites; flames only while on |
| `interaction-03` | Wooden door | `open` closed/open; safe passage and closure |
| `interaction-04` | Sofa and three colors, Three Seat Sofa | Sit/stand; reuse matched shapes/palettes |
| `interaction-05` | East/west Sage Loveseat, Sage Chaise | Sit/stand; shared facing geometry where matched |
| `interaction-06` | Garden Bench, Community Bench | Multiple reserved seats and safe exits |
| `interaction-07` | Single Bed, Double Bed, Sage Bed | Rest/wake; occupied slots and blanket clearance |
| `interaction-2d-03` | Legacy Feeding Bowl, three Food Bowl levels | `food` 0–3, fill and pet consumption |
| `interaction-2d-04` | Three Water Bowl levels | `water` 0–3, refill and consumption |
| `interaction-2d-05` | Automatic Feeder, Water Fountain, Garden Feeding, Double Feeding Tray | Per-item resources; tray food/water separately |
| `interaction-11` | Cat Tree, Tall Cat Tower, Basket Cat Stand | Climb, occupy and descend |
| `interaction-12` | Cozy Cat Perch, Window Perch, Cat Hammock | Pet surface leases and safe descent |
| `interaction-13` | Cat Bed, Small Cat Bed, Round Fluffy Cat Bed | Cat rest/perch contacts, not human seats |
| `interaction-14` | Coffee Table | Existing cat-top surface, not human sitting |
| `interaction-2d-06` | Flower Pot, Garden Pot, Banana Plant | Watering timestamp; solid base plus sprite foliage |
| `interaction-2d-01` | Decorative Lights, Garden Bush, Bamboo Window | Keep 2D; light states or existing soft-contact response |

Totals: 27 pending interactive 3D IDs, 20
interactive 2D IDs, six existing authored models and 57 deferred sprites. Catalog
IDs are not distinct model counts: match real variants before sharing geometry.
Split the four care-station shapes into smaller art passes if needed.

## Review focus

- Two actors/pets choose the same seat/surface: reserve once and leave the other actor in a safe position.
- Duplicate/retried completion: no second light toggle, supply deduction or care mutation.
- Rotation, recolor, removal or reconnect during an action: state stays on its placement; stale contacts release safely.
- Off/full/occupied variants: actual native art and available actions agree with authoritative state.
- Blocked approach, occupied doorway or missing supplies: fail without moving through solids or granting resources.

The acceptance steps below are future execution criteria. They are not reported
as verified, and no automated or live browser verification is authorized by this
plan alone.

## Task 1: Correct eligibility and copied interaction metadata

**Files:** `src/game/housing/catalog.json`, `backend/housing/catalog.json`, `src/game/furniture/generated.json` only when the corresponding installed record needs a metadata correction.

**Interfaces:** Existing `geometry.actions`, `geometry.seats`, `geometry.surfaces` and `WorldInteraction`; no new interaction service.

- [ ] Remove the bedside cabinet's copied `rest` action and human seat; keep its sprite and inspection route deferred.
- [ ] Remove indoor plants' `toggle_door`; activate them only after a real `water_plant` approach/supply contract is deliberately implemented. They are currently deferred.
- [ ] Preserve existing table/side-table cat surfaces, couch seats, curtain contacts and aquarium care; bookshelf remains installed without new interaction work.
- [ ] Inspect the scoped metadata changes. When verification is requested, confirm that the cabinet cannot rest and plant interaction cannot open a passage.

## Task 2: Make persistent states resolve to real state artwork

**Files:** `src/game/housing/types.ts`, new `src/game/furniture/state-visuals.ts`, `src/game/housing/geometry.ts`, `src/game/housing/scene.ts`, `src/game/furniture/room-reactions.ts`, `assets/furniture-studio/export.ts`, `scripts/pawtrail-furniture.mjs`.

**Interfaces:** Add optional state visuals on each resolved style/facing: `stateProfile` (`light`, `door`, `food`, `water`, `food-water`) and `stateViews: Record<string, NativeFurnitureVisual>`, where a visual has `file`, optional `frontFile` and optional `motion`. A planned `resolveStateVisual(def: Furniture, state: FurnitureObjectState): NativeFurnitureVisual` chooses that visual and falls back to the current base fields for older assets. These optional fields/helper are not implemented yet.

- [ ] Define `FurnitureObjectState` using the existing `lit`, `open`, `food`, `water` and timestamp fields. Keep state on `zone:placementId`, independent of catalog ID/material.
- [ ] Resolve lights to `on/off`, doors to `open/closed`, and resource levels to `empty/partial/full` (0, 1–2, 3). Resolve the tray's independent food/water pair to a composite key.
- [ ] Export supported state/style/facing art and motion with the existing asset pipeline. Retain canonical-only batch preview and full final export; no new CLI flag is assumed to exist.
- [ ] Make the live prop and reaction layers use the same selected state: off candles have no visible flame or running flame sequence. A whole-image tint alone is insufficient.
- [ ] Preserve old asset fallback, alpha, foreground alignment, visible bounds and nearest-neighbor rendering. When requested, verify state change, reload, remote-client agreement and rotation/style preservation.

## Task 3: Keep actions authoritative and idempotent

**Files:** `backend/housing/interactions.py`, `backend/housing/pet_behavior.py`, `backend/housing/spatial.py`, `src/game/housing/interactions.ts`, `src/game/housing/spatial.ts`.

**Interfaces:** Existing `interaction.begin/complete/cancel`, `actionId`, house locks, `PlayerHouse.object_states`, seat leases and `perch` reservations. Sit/rest release through cancel/leave; do not invent backend `stand`/`wake` request actions.

- [ ] Reuse `toggle_light` and `lit` (existing default true); do not create a parallel `on` flag. Keep current permissions and action duration.
- [ ] Preserve food/water range 0–3, actual supplies, care cooldowns and retry behavior. Add `fill_water` to the double tray deliberately; it currently declares only `fill_food`.
- [ ] Preserve seat/surface capacity and reachable exit. Cancel, disconnect, removal and stale placement revisions must release occupancy.
- [ ] Restrict open/closed passability to actual door passages; future open cupboards/fridges must keep their body collision. Refuse door closure on players/pets and keep the rigid frame.
- [ ] When authorized to verify, exercise duplicate completion, simultaneous seat/supply claims, missing supplies, blocked closure and reconnect. No balances, accounts or placements are generated by planning.

## Task 4: Execute the pilot batches

**Files:** `src/game/furniture/definitions.json`, piece-specific model modules and `src/game/furniture/model.ts`; selected `assets/furniture-studio/references/<id>/`, generated native manifests/assets and the matching catalog records.

**Interfaces:** Existing `createFurniture`, `PixelFurniture`, projected geometry, actor rigs, circular above-item rotation control and the state visual fields from Task 2.

- [x] Begin with `interaction-01`: generate/review the three chair shapes, then author seat sockets, silhouettes, foreground and clearance using the actual native actor.
- [ ] Complete `interaction-2d-02` as native 2D on/off art; candles use an unlit sprite plus optional flame/glow only while on. State changes alone never require a source mesh.
- [ ] Complete `interaction-03` with a real hinge/frame/passage contract. Show the door's open/closed geometry and contact allowance at supported facings.
- [ ] Preview one material for each batch, correct it together, then make one final state/style export pass. Record art review separately from any explicitly requested gameplay verification.

## Task 5: Continue the remaining interaction families

**Files:** The same piece-specific authoring/export paths as Task 4; `conversion-queue.json` and `interaction-plan.json` track individual progress.

**Interfaces:** The contract name on each queue batch determines its existing actions, stored/transient state, actor contacts and acceptance criteria.

- [ ] Work through the remaining active 3D batches in queue order, showing reference angles before dependent modeling. State-only resource/care groups now live in the separate sprite batches. Share geometry only after matching the actual family references.
- [ ] Keep fill/color/facing variants as distinct inventory IDs with shared structural authoring where valid; occupancy and resource state remain per placed instance.
- [ ] Do not add human seating to cat beds or coffee tables. Plant watering adds no growth economy; care and feeding create no verified rewards or payments.
- [ ] Keep all 57 deferred items as current sprites. Future storage, cooking, television, toy or grooming actions need a deliberate scope change rather than guessed implementation.

## Task 6: Review the interactive sprites and finish each batch

**Files:** `src/game/furniture/interactions.json`, `src/game/furniture/room-reactions.ts`, relevant native sprite/state outputs and scoped main-app mirrors under `src/features/neighborhood/`.

**Interfaces:** Existing native-facing 2D contact sensors and light action; no GLB or mesh is required for the three sprite items.

- [ ] Keep candles, lamps, decorative lights, food/water levels and watering visuals as sprites with real state art. No mesh is needed merely because a state changes. Keep bush/window contacts bounded, with independent solid structure and reduced-motion behavior; a window sensor does not create an opening.
- [ ] Preserve already outlined source pixels without applying a second border. Keep sprite facing support honest.
- [ ] Update per-ID states: queued, references awaiting review, modeling, exported, installed, and runtime verification only if actually performed. Do not mark planned state art as implemented.
- [ ] Mirror only the batch's records, assets and required helpers into the main app; preserve unrelated changes. Report current totals, remaining work and review limits.
