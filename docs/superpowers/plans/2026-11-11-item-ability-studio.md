# Item & Ability Studio Implementation Plan

> **Execution:** Implement natively in this workspace, without agents. The owner’s instruction overrides generic plan defaults: do not run automated tests, checks, builds or browser verification unless requested. Do not commit, push or publish without a separate instruction. Manual acceptance steps below are planned, not completed.

**Goal:** Author an item’s appearance, grip, actions, hit areas and effects, then equip it on Amber or Yae and try it in a local training stage.

**Architecture:** Keep item appearance, character animation, gameplay simulation and audiovisual presentation separate. A renderer-independent TypeScript ability runtime emits events to the existing Canvas 2D stage preview and, subsequently, the live Phaser world. Three.js supplies the character and equipped-item visuals through the existing pixel renderer.

**Tech stack:** Existing React/shadcn/Tailwind studio; Three.js 0.187.0; Phaser 4.2.1 for the live world; the existing Canvas 2D stage editor; procedural audio. No engine replacement or new dependency is needed for the pilot.

**Spec:** The design and behavior contract in this document. Proposed defaults are starting values for the first trial, not already implemented functionality.

## What exists and what is missing

- `actor-rig/appearance-parts.ts` already constructs a sword and sheath, and `rigs.ts` attaches the sword to the right wrist. This is appearance/holding behavior, not a complete sword attack or projectile system.
- Refined actors archive much of the original base geometry. A new item must attach **after** the refined factory runs; enabling an old base appearance flag alone is insufficient for a reliable Amber/Yae item workflow.
- The Character studio already adds geometry, edits vertices, poses joints and records motion. Reuse its shapes, transforms, vertex offsets, joint names and pose sampling.
- `StageCanvas` and `StagePlaytest` provide a Canvas 2D rehearsal environment with movement, collision, depth and furniture interactions. They are not Phaser scenes.
- `abilities/state.ts` handles existing movement abilities and their local/room scope. Preserve those abilities and their authority boundaries; item rehearsal state must not overwrite them.
- Missing: portable item documents, item action events, hit queries, projectiles, world-space effect presentation and an authoring interface connecting them.

## Global constraints

- Use installed official shadcn components in `src/components/ui`, Tailwind first, small-radius action buttons, Saira Condensed headings and Instrument Sans controls.
- Preserve pixel rendering, original portraits, native manifests, stable feet anchors and current editor scrolling behavior.
- Preserve one shared character rig; item-specific joint motion and attachment offsets do not create a new character rig.
- Stage coordinates use pixels with **32 pixels per tile**. Tile units are an editing convenience; simulation and collisions remain continuous.
- Use authored ground footprints for walls/furniture, not sprite image bounds or the weapon’s visible outline.
- Studio imports and saves remain local. They do not grant abilities, alter platform animals, award verified Kibble or create multiplayer permissions.
- Keep imported definitions data-only. No scripts, arbitrary module imports, remote executable effects or automatic game installation.
- Synchronize only changed game files into the app worktree and its standalone-game archive; preserve unrelated application changes.

## Studio experience

Add `/play?preview=items` and **Your PawTrail spaces → Item & Ability Studio**. Keep the existing Character studio and Stage editor as the owners of character appearance and room layout.

```text
Item & Ability Studio   [Item] [Character]              Save / Files
Geometry | Equip | Actions | Effects | Area | Try
┌────────────────┬─────────────────────────────┬───────────────────┐
│ Parts / actions│ Editing preview or          │ Selected property │
│ and saved items│ local training stage        │ inspector         │
│                │                             │                   │
│                │ item + grip / actor + sword │ transform, timing,│
│                │ or targets + wave + walls   │ range, effect etc.│
├────────────────┴─────────────────────────────┴───────────────────┤
│ Play / pause / scrub / loop / speed                              │
│ Body motion | Item motion | Active area | Projectile | FX | Sound│
└─────────────────────────────────────────────────────────────────┘
```

### Workspace behavior

1. **Geometry:** create/edit the portable item’s parts, textures and vertex offsets using the existing authoring tools. The character’s body is a reference, not part of the item export. Item parts share an item-root hierarchy.
2. **Equip:** choose Amber or Yae, attach the item to `WristRight`, place its grip pivot and adjust hand-local position/rotation. Show grip and blade-tip markers. Changing the pivot preserves the visible item placement.
3. **Actions:** select Primary or Special, pose the necessary joints and record motion. Show wind-up, active and recovery sections on one timeline. Reuse the existing pose interpolation with a joint mask so item motion need not overwrite unrelated joints.
4. **Effects:** place named events at exact times: trail start/stop, projectile release, impact burst and sound. Offer a small reusable preset list, not arbitrary effect code.
5. **Area:** edit arc/circle/box/capsule dimensions over the ground grid. Display affected tiles, actual continuous hit shape, wall obstruction and target eligibility. Visual size and gameplay area are independent controls.
6. **Try:** equip the item, walk in the training stage and use Primary/Special through visible buttons or J/K. Preserve E for furniture interactions. Exiting Try clears casts/effects/voices and returns to the same document and selection.

Desktop uses a bounded outliner, flexible viewport, inspector and bottom timeline. On narrow screens, switch between Preview, Properties and Timeline rather than squeezing all panels together. Keep the established single canvas/editor instance mounted where practical, and suspend inactive rendering. No side-by-side full character duplication is needed.

## First trial: training sword and shockwave

Use the current sword’s visual identity and existing stage assets. Introduce training targets and diagnostic overlays; original procedural trails/sounds are sufficient to establish the behavior before commissioning effect sprites.

| Setting | Primary: sword swing | Special: traveling wave |
|---|---|---|
| Cast duration | 600 ms | 900 ms |
| Preparation | 0–150 ms | 0–300 ms |
| Active/release | Arc active 150–280 ms | Wave emitted once at 300 ms |
| Recovery | 280–600 ms | 300–900 ms |
| Ground interaction | 120° forward arc, 64 px reach | Moving band, 96 px wide × 16 px deep |
| Travel | None | 192 px/s, maximum 192 px, 1,000 ms lifetime |
| Cooldown | 800 ms from cast start | 2,500 ms from cast start |
| Target behavior | Each target once per cast | Pierce targets; each target once per projectile |
| Walls | Obstructed targets excluded | Whole band stops at its first solid collision |
| Movement/aim | Movement locked; facing captured at start | Same; released wave travels independently |

Normal hits visibly flash training targets; the wave can hit several targets. Use resettable local target health/counters if useful. The pilot needs cooldowns, not an invented energy or currency system.

The training scene contains a clear lane, targets at multiple distances, a wall and a footprint-bearing prop. Hit detection covers target shapes, not just target centers. A large target occupying several tiles receives one hit, not one hit per tile. A doorway narrower than the wave blocks the wave even if its centerline fits.

## Runtime and data contract

### Item documents

Create a separate versioned `pawtrail-item` format. It contains item ID/name, visual parts, textures/vertex offsets, grip/socket transforms and Primary/Special ability definitions. Reference imported shared shapes/pose types rather than embedding a whole saved character.

Each ability contains:

- ID, duration, cooldown and wind-up/active/recovery timing;
- a masked pose clip and optional item-root motion;
- a facing/movement policy;
- stable-ID timed events;
- approved hit/projectile specifications and effect/sound references.

Do not extend a character’s existing skin save with an entire inventory/combat subsystem. Item documents own item editing. The stage references an equipped item ID/document for local rehearsal; stage layouts and character skins remain independently portable.

### Simulation interfaces

Create `AbilitySession` with these public operations:

```ts
equip(item: ItemDocument | null): void
activate(action: 'primary' | 'special', actor: AbilityActor): ActivationResult
advance(deltaMs: number, world: AbilityWorld): AbilityEvent[]
cancel(reason: 'unequip' | 'leave' | 'reset'): void
snapshot(): AbilitySnapshot
```

`AbilityWorld` supplies the clock, actor ground position/facing, candidate targets and current solid ground footprints. `AbilityEvent` is a discriminated event for pose, trail, projectile, impact, hit, sound or completion, with cast/event IDs and world-space coordinates. Keep all renderer imports out of this simulation.

`AbilityActor` identifies the actor, item, ground position and eight-way facing.
`ActivationResult` is `{ok: true, castId}` or `{ok: false, reason}`, where reason
is `no-item`, `cooldown`, `busy` or `invalid-state`. The UI shows a blocked-action
reason without starting an animation or spawning effects. `EquippedItemHandle`
exposes named grip/tip/muzzle samples, equipped/stowed visibility and `dispose()`;
socket samples distinguish visual offsets/height from ground offsets.

Use a bounded fixed-step accumulator with swept collision between previous and next positions. Compare wall and target contact times, so a target behind the first wall cannot receive a hit during a long frame. Deduplicate by cast/projectile ID and target ID.

Timed events fire when time crosses an event boundary, once, even if a frame skips over that boundary. Seeking is a separate preview operation: rebuild from a captured training snapshot and deterministic seed, then resimulate to the selected time. Seeking is silent and never dispatches gameplay writes. Normal playback resumes without replaying crossed sound/release events twice.

### Rendering and motion

- Build the weapon once and parent it to the selected hand socket after constructing the chosen actor. Use the same item on both actors.
- Evaluate the base rig, masked action pose and item-local transforms in a defined order. Preserve the existing hair/cape behavior and vertex-offset application contract.
- Keep sword trails, waves, impacts and projectiles outside the small actor raster canvas. They are world objects rendered by the active stage/world adapter.
- Keep **visual socket offsets/height** separate from **ground-space hit origins**. Projected hand height must not shift the mechanical attack range or furniture collision footprint.
- Preserve actor world scale and feet anchor. If a weapon/action requires extra transparent raster padding, expose that padding to consumers; never shrink the entire actor to fit a sword.
- Use capped effect pools, short lifetimes and render-on-change/cached pose samples where possible. Initial caps: 16 active projectiles and 128 particles per rehearsal scene. These are limits, not measured performance claims.
- Audio starts through the existing user-gesture-unlocked sound system, respects mute/volume and owns per-cast cleanup handles. Add original procedural whoosh/release/impact voices as needed.

## Review focus

1. Fast movement or long frames: waves must not tunnel through walls or skip targets.
2. Repeated frames, scrubbing and loops: release events and target hits must not duplicate.
3. Different actors/facings: grip, feet anchor, blade bounds and visual height must remain aligned.
4. Switching document/mode/item or losing focus: no orphan projectiles, stuck movement lock, input capture or audio.
5. Imported/stale packages: bounded validation, recoverable errors and no loss of the current unsaved document on failed import.

## File map

Create under `src/game/items/`:

- `document.ts`: types, limits, versioned reader/writer and migrations.
- `sword-pilot.ts`: the initial item and both ability definitions.
- `equipment.ts`: item ownership, socket attachments and equip/unequip lifecycle.
- `motion.ts`: joint-mask application and item motion, reusing shared pose sampling.
- `runtime.ts`: `AbilitySession` and action/event lifecycle.
- `spatial.ts`: continuous arc/projectile/target/solid queries and first-contact resolution.
- `preview.ts`: deterministic training targets, rehearsal state and seeking.
- `presentation.ts`: renderer-independent effect and sound presentation state.

Create UI under `src/components/game/item-studio/`:

- `app.tsx`: workspace state, files/save, current item/action/character and route shell.
- `timeline.tsx`: lanes, event selection, playback and scrubbing.
- `inspector.tsx`: selected part/action/event/hit-area controls.
- `preview.tsx`: active item/equip/training viewport and diagnostics.

Modify existing owners only at clear seams:

- `skin-studio/model-editor.ts`, `vertex-editor.ts`, `model-document.ts`: extract reusable geometry/vertex utilities without replacing Character studio behavior.
- `actor-rig/appearance-parts.ts`: delegate the existing sword visual to a reusable item builder while preserving old callers.
- `actor-rig/pixel-renderer.ts`: allow a decorated item rig/pose and expose necessary render bounds/socket samples without changing default actors.
- `stage-editor/playtest.ts`, `canvas.ts`: local item rehearsal adapter and effect drawing.
- `systems/action-sounds.ts`: original sound presets and scoped playback.
- `App.tsx`, `game/play-navigation.ts`, `components/game/shared/play-chrome.tsx`: lazy route/menu entry.

The existing Stage editor is Canvas 2D, so its adapter must remain native. Add a separate Phaser adapter after the local pilot is accepted; do not rebuild the stage editor in Phaser merely to share abilities.

## Implementation phases

### Phase 1 — Portable sword, equip and swing

- [ ] Define and validate `ItemDocument`, `AbilityDefinition`, `AbilityActor`, `AbilityWorld`, `AbilityEvent`, `ActivationResult`, `AbilitySnapshot` and `EquippedItemHandle` in `items/document.ts`.
- [ ] Extract reusable shape/sword construction and shared pose sampling from their current owners; preserve existing Character studio and old sword appearance behavior.
- [ ] Implement `equipItem(rig, item): EquippedItemHandle` in `items/equipment.ts`. The handle owns item objects, grip transform, named sockets and disposal.
- [ ] Decorate both refined actors after factory creation; author the primary/special pose clips and joint masks.
- [ ] Include stowed/equipped visibility and measured render bounds.

**Deliverable:** the same sword fits Amber and Yae, follows their hand, and performs a deliberate swing.

**Owner acceptance:** front/three-quarter/side and all eight world facings; idle/walk/swing; equip/unequip repeatedly; no duplicate old sword, cropped blade or change in actor scale.

### Phase 2 — Complete the playable sword/shockwave trial

- [ ] Implement `AbilitySession` lifecycle, event crossing, movement/facing lock, cooldowns and cancellation.
- [ ] Implement continuous arc/band sweeps and target deduplication in `items/spatial.ts` using current ground footprints.
- [ ] Add a resettable training stage/targets and its Canvas 2D adapter. Primary/Special buttons and J/K activate actions; E retains its existing furniture meaning.
- [ ] Add synchronized trail, wave, impact and sound presentation with scoped cleanup.
- [ ] Add toggles for hit shapes, impacted targets, collision footprints and an event log.

**Deliverable:** the first end-to-end prototype: equip → swing → release → travel → hit several targets → stop at a wall → recover/cool down.

**Owner acceptance:** a multi-tile target gets one hit; targets behind walls get none; a wide wave checks its full width; a released wave continues after actor recovery; unequip/exit clears effects and locks.

### Phase 3 — Build the studio shell and timeline

- [ ] Add the lazy Item & Ability Studio route/menu and six workspaces.
- [ ] Reuse shape, vertex and pose controls for item parts; keep item-root/grip editing separate from character-body editing.
- [ ] Implement action/event selection, timeline lanes, numerical timing, playback, loop, speed, mute and deterministic seek.
- [ ] Add property inspectors for movement/facing rules, effect/sound references and target eligibility.
- [ ] Reuse the studio undo model, keyboard-focus rules, error/status feedback and responsive panel switching.

**Deliverable:** the sword trial is editable through the studio rather than source-code changes.

**Owner acceptance:** change a grip, swing pose and release time; undo each; scrub across release repeatedly without duplicate projectiles or audio; rotate the preview freely.

### Phase 4 — Visual hit-area and effect authoring

- [ ] Add ground handles and matching numeric fields for forward arc, circle, box and capsule dimensions. Tile values convert through the existing 32px tile scale.
- [ ] Show affected tiles, world footprint obstruction and actual queried targets at the selected timeline moment.
- [ ] Expose projectile width/depth, speed, range, target piercing and wall-stop policy with consistent units and limits.
- [ ] Add effect presets for slash arc, traveling wave, radial pulse and impact burst, plus color/lifetime/size controls.
- [ ] Keep visual size independent from gameplay size, with an explicit overlay showing both when they differ.

**Deliverable:** an author can visibly change the sword’s reach or the wave’s width and observe the corresponding world behavior.

**Owner acceptance:** compare 1-, 2- and 3-tile widths; rotate into diagonal directions; test a narrow passage; change only the visual effect size and confirm the hit area remains unchanged.

### Phase 5 — Save, reuse and stage rehearsal

- [ ] Implement local Save/Load and versioned item JSON import/export with embedded bounded visual assets. Failed imports preserve the current item and editor history.
- [ ] Add action duplication, item duplication, stable IDs and a local item catalog.
- [ ] Let the Stage editor choose a locally saved item for its existing Amber/Yae play mode, using the same `AbilitySession` and presentation adapter.
- [ ] Preserve the stage layout/history/camera when entering and leaving rehearsal. Clear only transient targets/effects, not the authored document.
- [ ] Document package versions, limits, controls, reusable authoring seams and the manual acceptance record.

**Deliverable:** a saved custom sword works in another locally authored room with the same geometry, action, effects and interaction rules.

**Owner acceptance:** save/reload/export/reimport; duplicate and edit one item without changing the original; try it in a furnished room; leave/return without stale effects or cooldown resets caused by re-equipping.

### Phase 6 — Live-world adapter, after the studio pilot

- [ ] Add a Phaser presentation/world adapter using the same runtime and item definitions; do not fork the hit or cooldown rules.
- [ ] Define approved item IDs and the installation boundary separately from importing a local draft.
- [ ] For multiplayer, add server-authoritative eligibility, action timing, target resolution and cooldown contracts in the real housing/game service. Client-authored gameplay fields never become authority merely by loading an item file.
- [ ] Keep platform animal records, identification and verified Kibble outside these effect handlers.

**Deliverable:** an explicitly installed item behaves consistently in the real world. This phase requires its own server-scope review; it is not implied by the local prototype.

## Completion criteria and implementation order

Complete **Phases 1–2 first** and show the single sword trial before broadening the UI/catalog. Then complete Phases 3–5. Treat Phase 6 as a follow-up integration decision.

No full effects marketplace, general-purpose shader graph, arbitrary scripting,
physics-based cloth rewrite, combat economy or new engine is needed for the first
studio. The useful unit is one portable item whose appearance, motion, timing,
affected area and world feedback can all be authored and inspected together.

## Implementation update — 11 November 2026

Phases 1–5 have source implementations: portable item documents, shared model
editing/pose helpers, equipped Amber/Yae, local sword/wave runtime and training
adapter, six-workspace UI/timeline, area/effect controls, local library and Stage
editor equipment selection. See `docs/implementation/item-ability-studio.md`.
No tests, checks, builds or browser verification were run under the owner's
standing instruction. Manual acceptance remains pending. Phase 6 stays deferred;
there is no live-world or server-authorized installation claim.
