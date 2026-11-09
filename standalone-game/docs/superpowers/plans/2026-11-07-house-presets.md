# House Layout Presets Implementation Plan

**Goal:** Make the approved cottage and two-storey references selectable, persistent, furnished playable houses with linked floors and large Settings previews.

**Architecture:** Preserve the current `layout`/`revision` as the ground-floor save. Add an optional upstairs layout/revision, preset identity, bounded layout history and one-time preset furniture-pack unlocks. A shared data contract defines dimensions, partitions, door openings, stair footprints, landings and canonical furniture for each floor. Existing authentication, house permissions, receipts, inventory, editor and room-scoped live events remain authoritative.

**Tech Stack:** Existing Phaser3, React, official shadcn/ui, Tailwind, Django/DRF/Channels and native sprite catalogs.

**Execution:** Direct implementation without agents. The owner's no-tests/no-checks/no-builds/no-browser instruction overrides skill defaults. Source review, asset thumbnail exports, additive migration execution with `--skip-checks`, runtime synchronization and service restart are authorized implementation steps. Do not reset existing rooms before the owner explicitly selects Apply in the product.

- [x] Add shared studio/cottage/two-storey definitions. Keep studio24×18; use larger36-tile-wide footprints for connected rooms and aligned stairs. Mirror structure and furnishings into the backend contract. Prepare small WebP thumbnails from the approved references.
- [x] Add preset/upstairs/history/unlock model fields with an additive migration. Implement transactional owner-only apply/restore actions, expected revisions on both floors, one-time furniture grants, shared stock across yard/ground/upstairs, protected routes, and backups. Require other interior visitors to leave before structural changes; reopening supplies the new geometry.
- [x] Extend existing room IDs with `|upstairs`. Use floor-aware movement/pathfinding, reachable cat routes on the ground floor, chat/presence and furniture interactions. Validate upstairs existence and authoritative stair-entry positions. Preserve yard and existing community behavior.
- [x] Render partition wall sprites, visible door gaps and native wooden stairs. E at a landing changes floors; accessible floor buttons expose the same destinations. Adapt the editor, collisions, revisions and inventory totals to the active floor.
- [x] Enlarge Settings and add thumbnail selection, a larger selected-plan preview, floor/room descriptions, furnishing choice, explicit Apply review, and restore controls. Document behavior and unverified runtime limits; migrate, sync and restart only the housing service.
