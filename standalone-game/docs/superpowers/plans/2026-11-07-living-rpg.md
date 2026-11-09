# PawTrail Living RPG Implementation Plan

Execution: direct implementation in the current session. The attached brief explicitly requests implementation and validation; targeted system tests/type checks are authorized for this task. No production builds or browser inspections will be used without an additional request.

**Goal:** Expand the existing playable prototype into the first neighborhood RPG described in the owner's brief, integrated at `/play` in the existing application.

**Architecture:** Preserve Phaser rendering and movement; move gameplay rules into data-driven pure systems for quests, care/trust, time, upgrades, achievements, and versioned saves. A browser-only Web Audio manager provides original procedural music/ambience/SFX. React/shadcn provides the RPG HUD, journals, inventory, dialogue, photos, map, and audio controls. A sync script installs the same game source and prefixed assets into the existing Next application without replacing social features.

**Spec:** `docs/requirements/cozy-rpg-brief.md`.

## Incremental tasks

- [x] Structured animal/NPC/item/project/quest content; version-2 state, version-1 migration and validated persistence.
- [x] Reusable event/objective quest engine with three main story chains, five calendar daily quests, side/exploration/community content, explicit acceptance/claim, and journal unlock.
- [x] Gradual trust, daily care limits, diverse personalities, routines, following/avoidance, photography, NPC relationships, achievements and collectibles.
- [x] World clock, smoothly interpolated daylight, lamps, NPC schedules, visible upgrades, hidden garden/riverside unlocks and reusable interaction objects.
- [x] Original synthesized Web Audio soundtrack variants, ambience, positional animal/footstep/action sounds, autoplay-safe start, four saved volume controls and mute.
- [x] RPG journals/inventory grid, objective tracker, typewriter dialogue/choices, photo album, world map, run/shortcut controls and mobile joystick.
- [x] Integrate at `/play` in the existing app; keep standalone preview and existing social routes intact.
- [x] Validate quest ordering/idempotency/calendar resets, trust/resource gates, collision/pathfinding, audio preferences, and save migration. Document content extension and honest delivery limits.

## Validation boundaries

Use scoped pure-system tests and TypeScript checks only, justified by the attached brief's explicit validation request. No frontend/backend production build and no automated browser/visual inspection. Preserve existing unrelated application changes. Original procedural audio is functioning synthesized audio, not a silent asset reference. Game rewards remain local and never represent verified real-world rescue claims.
