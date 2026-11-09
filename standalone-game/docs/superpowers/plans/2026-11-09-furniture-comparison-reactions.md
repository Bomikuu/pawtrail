# Furniture comparison and reactive world implementation plan

**Goal:** Give furniture an original/current comparison page and playable actor-contact examples; make the same reactions available in Homes and document their authoring contract in the furniture skill.

**Architecture:** Keep movement/collision, soft contact sensors, transient wet footprints and ambient fish separate from durable terrain edits. Share a small contact simulation between the comparison field and Phaser. Housing owns equipped tools and grass-to-soil changes; client previews never grant inventory or edit a live yard.

**Tech stack:** React, official shadcn controls, Tailwind, native canvas/Three.js previews, Phaser and existing Django housing transactions/cache.

**Spec:** Owner's current request: compare creation like actors; curtains/bushes react, running walls knock back, fish swim, rain-soaked actors leave prints and equipped mower/shovel transform grass to soil. Keep the existing native pixel visual world, typography and actor model.

## Constraints

- Implement directly, without agents or automated tests/checks/builds/browser verification. Source review only.
- Preserve other actor/cat/social changes and the running development preview.
- Original art remains a reference. A reference without rotated facings must not pretend to support them.
- Solid walls remain solid; a curtain sensor does not remove structural collision. Traversable openings need explicit clear geometry.
- Footprints and sway expire; soil is permissioned server state. Local comparison controls affect only the preview.
- Use game supplies/currency only. No seeded balances, social rewards or real payments.

## Work

1. Add shared contact response, soft-object sway and footprint lifecycle primitives with explicit sensors and bounded pools.
2. Add `/play?compare=furniture`: original/current couch views, geometry overlays, synchronized movement and a playable reactions field with rain/tool controls, keyboard/touch input and reset.
3. Attach the shared contact rules to Homes movement, soft scenery/curtains, aquarium fish and wet footsteps; preserve collision and seated actor poses.
4. Add owned shovel/mower purchase/equip controls. Persist eligible owner-yard grass edits through the existing locked housing service and broadcast them. Reject private/structural/path/furniture cells and out-of-range edits.
5. Extend `$pawtrail-furniture` with collision/sensor/ambient/status/tool authoring contracts, comparison instructions, runtime boundaries and source maps. Mirror only touched modules to the main app.

## Review limits

Review source for collision clearance, trigger entry/crossing, cooldown/recoil, cleanup/reduced motion, authoritative tool ownership/range/permission and once-only terrain writes. Do not claim runtime validation without a requested verification pass.
