# PawTrail — Spacious playable community and customizable homes

Implement the accepted PawTrail community concept as a playable extension of the existing game. Preserve its warm pixel art, six districts, jeepney arrival point, and four private home plots. The owner's correction is that the concept feels too cramped: add comfortable space between destinations, houses and objects, with larger usable yards and readable walking routes.

This is an implementation prompt. Its preparation does not itself change the game or authorize execution before the owner asks to implement it.

## Workspace and existing systems

Primary game workspace: `/home/micxsz/Documents/ChatGPT/pawtrail`.

Approved visual reference: `/home/micxsz/Documents/ChatGPT/pawtrail/docs/images/pawtrail-community-layout-v1.png`.

Use that image for visual identity and district relationships. The new spacing requirements below replace its dense packing. Build the world from reusable tiles, sprites and data; the concept image is not a playable background or collision map.

Read `AGENTS.md`, `PRODUCT.md`, `docs/implementation/multiplayer-homes.md`, `docs/implementation/community-map.md` and `docs/implementation/world-immersion.md` before implementation. Extend existing features; several requirements below already have implementations that must be retained and adapted.

- Phaser world and navigation: `src/game/world-scene.ts`, `create-game.ts`, `data.ts`, `pathfinding.ts` and the existing map preparation workflow.
- Homes rendering, state and placement: `src/game/housing/{scene.ts,client.ts,types.ts,geometry.ts,catalog.json}`.
- Existing housing controls: `src/components/game/housing/{app.tsx,decoration.tsx,panels.tsx,social.tsx,pets.tsx}`.
- Existing authoritative game service: `backend/housing/{models.py,service.py,geometry.py,live.py,discovery.py}`.
- Geographic discovery: `src/game/community.ts`, `src/components/game/community/`.
- Native art manifests: `public/game-assets/world-manifest.json`, `public/assets/game/housing/exteriors/complete-exteriors-manifest.json`, furniture/pet-furniture manifests and character/animal manifests.
- Existing integrations: `/play`, `/play?home=me`, `/play?map=community` in the social application. Use `scripts/sync-game-to-app.mjs` for the supported runtime/source synchronization when implementation reaches that stage.

The social application is a separate worktree at `/home/micxsz/projects/pawtrail/.worktrees/implementation`. Preserve its unrelated work. Its real capture/identity/rewards backend is separate from this workspace's game housing backend.

## Spatial direction

Keep the map cozy and inhabited, with room for players and pets to move naturally. Preserve the current sprite proportions and 32px base tile. Make space by increasing usable world area and simplifying clutter.

Use an **80×56-tile starter community**, representing 2560×1792 native world pixels. This is approximately 46% more area than the earlier 64×48 conceptual footprint. Keep the playable camera at a comfortable integer zoom; let it follow the player through the larger map.

Spacing requirements:

- Main pedestrian routes: **four clear walkable tiles wide**.
- Secondary public routes: **three clear tiles wide**.
- Small private garden paths: at least **two tiles wide**.
- District separation: generally **four to six tiles** of path, lawn or forecourt.
- Separate commercial building silhouettes by at least **three tiles**; keep a clear approach in front of each entrance.
- Four home plots: **14×14 tiles each**, with **five-tile gaps between plot boundaries**.
- At each house, reserve at least a two-tile-wide continuous gate-to-door route, a clear door landing, and a useful contiguous yard area around six by eight tiles where the selected house footprint allows it. Choose fitting existing house presets rather than distorting sprites.
- Keep at least 45% of shared outdoor ground free of blocking objects. Also leave visually quiet lawns; nonblocking flowers can still create clutter.
- Place trees in groups and along selected edges. Leave readable views of doors, gates, NPCs and the plaza. Avoid lining every path edge with pots, lamps, shrubs and fences.
- Use depth/occlusion handling so a canopy cannot make the player or an interaction target disappear without feedback.

Use the following tile-coordinate guide for the initial blockout. Coordinates identify district envelopes, not solid rectangles to fill with scenery:

| District | x | y | Width | Height |
| --- | ---: | ---: | ---: | ---: |
| Pocket Park | 4 | 4 | 18 | 24 |
| Care Hub | 28 | 3 | 24 | 14 |
| Paw Plaza | 28 | 20 | 24 | 12 |
| Market Lane | 60 | 4 | 16 | 24 |
| Home plot A | 5 | 34 | 14 | 14 |
| Home plot B | 24 | 34 | 14 | 14 |
| Home plot C | 43 | 34 | 14 | 14 |
| Home plot D | 62 | 34 | 14 | 14 |
| South sidewalk | 0 | 49 | 80 | 3 |
| South road | 0 | 52 | 80 | 4 |

The five-tile gap between plots B and C carries the central north-south greenway. Connect it through the plaza to the care forecourt and to the pedestrian crossing at the south road. Add coherent east-west links to the park and market, keeping continuous path widths at intersections and gates. The spare rows between homes and sidewalk provide access, not an additional blocking hedge.

## Six connected destinations

**Paw Plaza:** A comfortable gathering space with one modest focal feature, a community quest board, two or three seating groups, and a feeding/water station. Leave the center navigable. Reuse current board, bench, sitting and interaction systems. Connect existing quest controls to the physical board.

**Care Hub:** Separate shelter and veterinary entrances, with a broad shared forecourt and a shaded fenced animal courtyard. Link suitable animal encounters to the existing platform profile/help/adoption actions. Do not invent eligibility or label every animal adoptable. Keep the current distinction between shared multiplayer homes and the existing shelter exploration interior; do not imply new multiplayer shelter rooms unless they are actually implemented.

**Market Lane:** Reuse the pet shop, sari-sari store and wooden workshop art. Give each a small forecourt and a clear role in existing inventory/decor/supply flows. Avoid storefronts that all open the same generic popup. Connect only functional destinations; clearly label unavailable extensions.

**Pocket Park:** A quieter loop with pond/rain garden, a shaded rest area, a picnic spot and animal encounter anchors. Keep substantial open grass. Reuse behavior, weather, day/night, discovery and audio systems. A trail exit can reserve future expansion without promising an unimplemented area.

**Home Lane:** Four separate owner properties, not four decorative houses painted into the scenery. Give each an entrance, stable plot identity, nameplate/mailbox where public permissions permit it, yard, house preset and link to its saved interior. Start with four visible plots per neighborhood instance/block. Additional households belong in connected blocks or instances, not unlimited portals squeezed into the same lawn. Reuse existing sample records only with their sample labels; unassigned plots need honest empty states.

**Jeepney Stop:** Place the jeepney at the southwest curb, outside the pedestrian care/plaza areas. Add a small shaded waiting area with a direct sidewalk route to the crossing. Initially, interacting opens the existing community discovery/travel interface with functional destinations. Arrival/departure animation is secondary to completing the usable stop. Pets remain in designated pedestrian areas.

## Owner customization

Extend the existing decoration editor rather than implementing another editor, inventory or save system.

Provide distinct **Yard** and **Interior** editing contexts. Preserve existing interior `layout` and `revision` fields and saved layouts. Add yard layout/revision and exterior-preset state through additive schema changes. Do not change the existing 24×18 interior geometry into a 14×14 room just because exterior plots have different dimensions.

Make client and server placement geometry aware of editing context, bounds, entrance and catalog footprint. The current fixed interior dimensions must remain valid for existing rooms; do not globally replace them with the community map dimensions.

Owner flow:

1. Select **Decorate** on an owned or explicitly editable property.
2. Open the existing inventory drawer with search and Furniture/Garden/Pet Care/Decor categories mapped to the real catalog.
3. Drag an owned item onto the plot. Show a translucent sprite and tile footprint; green means valid and red means invalid, accompanied by an explanation.
4. Support selecting and moving placed items, storage, undo/redo, cancel and save. Keep the current mouse/touch controls and keyboard alternatives. Offer explicit select/place/nudge controls so dragging is not the only method.
5. Rotate only supported items using the catalog's existing rotation behavior or available sprite orientations. Never rotate an entire rendered house or upright character arbitrarily.
6. Save to the existing authoritative game service. Show pending/success/failure states; a failed save keeps the draft. Version conflicts offer reload/reapply without silently replacing another person's changes.

Placement rules:

- Objects stay within the correct owned/editable zone and respect item/layer compatibility.
- Use manifest anchors and collision footprints; tall sprite pixels are not all solid ground.
- Enforce the total owner's inventory across yard and interior. Placing an item outside must not make a duplicate copy available inside.
- Preserve reachable gate/door routes, interaction approaches and pet navigation. Reject overlaps with forbidden geometry and current player positions.
- Cosmetic ground layers can coexist only under explicit layer rules; blocking objects cannot overlap accidentally.
- Disable world walking while dragging, typing or using modal controls. Draft previews stay local until a valid save.
- Visitors can use the existing permitted interactions. They cannot move furniture unless server-side decorator permission grants it.

When layouts change, update collision/pathfinding caches coherently. Accepted server state, not a local drag preview, drives visitor movement and multiplayer broadcasts. Reuse permission enforcement, room-scoped events, reconnect resynchronization and revision handling. Public neighborhood snapshots must not expose private interiors or private owner information. Yard visibility should follow explicit house/privacy policy.

## Art and interface

Reuse the existing houses, shelter/clinic/shop buildings, fences, gates, paths, benches, plants, furniture, pet equipment, animals, rescuers, portraits and effects. Use native runtime exports and their authoritative manifests; do not load generation masters into gameplay or assume pending catalog pieces are already integrated.

Prioritize new assets only where the concept requires missing art: jeepney, waiting-stop pieces, a modest paw fountain, and a few compatible tropical plant variants. Prefer modular exports over a new monolithic neighborhood image. If image generation is needed during implementation, use built-in Imagegen with the existing sprites as references, preserve original files, export appropriate transparent/native variants and document sources, sizes, anchors and footprints. Do not claim generated concepts are exact game-ready tiles without the production export pass.

All world art remains top-down three-quarter, warm 16-bit-inspired pixel art with consistent upper-left lighting and world scale. Use nearest-neighbor rendering, integer zoom and rounded pixel rendering positions. Preserve smooth delta-time movement; do not make movement tile-jump just to keep edges sharp.

The green placement grid and cursor in the concept are editor behavior, not permanent painted terrain. Render them dynamically only in decoration mode.

Use actual installed official shadcn/ui components in `src/components/ui` for the surrounding React controls. Compose existing Buttons, Tabs, Dialogs, tooltips and inventory controls with Tailwind. Keep the game viewport dominant; desktop drawers and mobile bottom sheets must preserve a usable view of the placement target. Reserve CSS for theme/font setup and genuinely complex effects.

Preserve existing player choice, portrait dialogue, animal behaviors, weather, lighting, inventory, boards, social interactions and sound settings. Keep game rewards/currency separate from authoritative real-platform Kibble. Virtual feeding, walking and decorating must never fabricate real sightings, adoption approvals, achievements or wallet entries.

## Implementation phases

1. **Map and spacing:** Make a data-driven community layout and native tile blockout using existing art. Establish the six district envelopes, wider routes, four plots, entrance anchors and camera bounds. Document the coordinate contract.
2. **Navigation and interactions:** Implement physical doors, gates, board, seating, care encounters and jeepney access through the current systems. Connect existing destinations and preserve return/spawn positions.
3. **Persistent yards:** Add zone-aware geometry and additive yard/exterior state to the housing backend/client contracts. Preserve old interiors and enforce inventory/permission/revision rules across both spaces.
4. **Decoration experience:** Adapt the existing drag/touch/keyboard editor, ghost preview, validation reasons, storage, undo/redo and save/conflict states. Keep public paths independent of private drafts.
5. **Multiplayer and platform links:** Synchronize committed public yard changes, visits and reconnection state with existing privacy/capacity rules. Preserve real-animal profile and adoption links without treating the virtual map as a physical address or verified sighting source.
6. **Asset completion and documentation:** Add only necessary missing assets, apply authorized migrations/asset transforms and the existing runtime sync, and update source/asset documentation. State any remaining external requirements honestly.

## Completion criteria and execution constraints

The implementation must expose the intended spacing in data and enforce placement rules in source. The eventual hands-on review should be able to walk from the jeepney stop to every public district, enter/leave a home, arrange/save/reload its yard, retain the interior, visit under permissions and recover from a failed or conflicting save. Mobile controls and keyboard placement must expose the same actions. These are acceptance criteria, not a request to run verification now.

Work directly without subagents. Do not author/run automated tests, type checks, builds, detectors or browser verification unless the owner explicitly requests them. Do not run an unsolicited QA loop. Source review is permitted; document unverified rendered/runtime behavior honestly. If browser work is later authorized, prefer Firefox and explain tool limitations before selecting another browser.

Use Impeccable to preserve the approved design and make spatial hierarchy, readable controls and honest states intentional. Use Jev only for concise non-sensitive design/architecture judgments, never as proof of correctness, collision safety, performance or real animal identity. The recorded judgment favored expanding usable world area while preserving sprite scale; the owner remains the visual authority.

Deliver the integrated implementation in phases, list changed entry points and migrations, preserve unrelated work, and distinguish implemented mechanisms from behavior that has not been exercised. This task should produce a spacious playable neighborhood with persistent customizable properties, not merely render the concept image inside Phaser.
