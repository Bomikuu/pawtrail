# PawTrail Playable Prototype Implementation Plan

Execution: directly in the current session, as requested. No subagents or automated tests/builds/browser inspections. The owner's explicit request to implement the supplied prototype brief authorizes this work.

**Goal:** A playable asset-driven browser neighborhood with movement, care interactions, rewards, shelter visits, and NPC dialogue.

**Architecture:** Phaser 3 owns map rendering, physics, camera, actors, and state machines. A small typed bridge connects the scene to React/shadcn controls and a validated local save store. Tiled-compatible maps and named manifest frames avoid hard-coded atlas rectangles. A separate adapter describes future Django progress/activity integration.

**Tech stack:** Phaser 3, React, TypeScript, Vite, Tailwind CSS, official shadcn/ui registry components.

**Spec:** The user's mechanics table and technical foundation; PRODUCT.md and DESIGN.md.

## Tasks

- [x] Foundation: configure Vite/React/Tailwind, install official shadcn components, publish only required native assets, retain licenses and generated masters.
- [x] World data: create a Tiled-compatible neighborhood and shelter map with ground, water, collision, exits, buildings, props, animals, and volunteers. Generate tiled terrain connection masks from map data.
- [x] Progress: implement validated, versioned local saving, one-time care rewards, resource spending, rescue requirements, quest tracking, discovery, supplies, and a documented optional Django adapter.
- [x] Phaser runtime: load manifest frames and animation rows; create the world, colliders, feet-based depth sorting, movement/camera interpolation, touch/tap input, animal state machines, interactions, and shelter transitions.
- [x] Interface: implement loading/error states, toolbar, proximity actions, journal/backpack/dialogue/help, save state, accessible movement controls, and pause/focus behavior with official shadcn components.
- [x] Delivery: source-review lifecycle cleanup, collision/input boundaries, save validation, reward idempotency, and interrupted actions; document scope and launch the game preview without running tests or builds.

## Review focus

Lost keyboard focus and stuck touch movement; blocked click destinations; duplicate rewards after reload; malformed/unavailable local storage; scene changes or menus during actions; asset-load failure; animals wandering through colliders; camera bounds on small interiors. Preserve the user's existing assets and unrelated social application work.
