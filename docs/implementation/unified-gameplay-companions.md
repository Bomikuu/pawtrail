# Unified gameplay, companions and home editing

Implemented directly from the owner-approved prompt. No subagents, automated tests, checks, builds or browser verification were run. Source was inspected and formatted; runtime behavior is unverified.

## One gameplay session

`src/game/runtime/session.ts` owns the single Phaser.Game instance. Explore and Home are scene adapters in that instance; React viewport hosts reparent the same canvas. Houses, yards and upstairs rooms keep their existing scene and data-driven presets. Scene transitions stop the previous adapter, clean its subscriptions and reuse loaded textures. The old scene-specific game factories are retired.

`runtime/actors.ts` is the shared manifest registry, foot-anchor setup, animation selection and movement controller. The canonical rescuer and supported animal coats use Explore’s native artwork. Extra characters use the same registered appearance in both scenes. Frame counts, dimensions and rates come from manifests; no generic shrinking of 48px sheets into 32px frames. Coats without an Explore-native sheet retain their matching existing native artwork rather than receiving another animal’s markings.

Both scenes use one integer zoom preference and a native viewport. Houses no longer scale a separate fitted canvas. Fit and Fill remain explicit controls; keeping the same zoom can require panning larger rooms. This is intentional to preserve actor/world size between spaces. Shared 8px navigation, foot clearance, keyboard/touch movement and action controllers remain in use.

## Animal circle and companions

The lower-left `AnimalTray` shows animals in the current space. Portraits use actual profile photos or existing coat-aware illustrations, with food/water indicators and local-story provenance. They expose Follow, Stay, Move, Come here, Return home, care, Locate and profile/journal actions. Up to three cats may accompany the player. Story cats require 20 trust. Account companions require ownership and presence; viewing a public animal does not make it a pet.

Move mode selects a walkable destination, leaves player movement separate, shows a reusable destination marker and supports Escape cancellation. Come here provides a keyboard-accessible alternative. Portraits support drag reordering and explicit left/right controls.

The shared CompanionRuntime uses spaced breadcrumbs, clearance-aware routes, bounded replanning, native walking animations and companion spacing. Existing story sprites are bound instead of duplicated. Owned account companions publish bounded position updates; shared-room visitors interpolate server snapshots. Stay commands preserve the animal’s room. Return home is an explicit game-space handoff, not a real-world movement or ownership change.

Migration `0010_companions_and_needs` adds durable food/water reserves, need cycles, companion assignment, current game room, command and position state, roster ordering and care quests. `/api/homes/companions` uses the existing account assertion. Commands validate ownership, room access, destinations, supply stock and action identifiers. Repeated quest claims do not award twice. Companion coordinates never update platform GPS, sightings, adoption state or identification references.

Fictional story companions remain local saved-game state. They can visit the game’s property scene visually without becoming records of real resident animals. Account-linked pets remain in Django. The existing local/remote save and currency distinction is preserved.

## Needs and care missions

Food and water reserves are 0–100; values below 30 create a care-cycle quest. A successful serving raises the reserve, and reaching 60 completes the need. Food/water decay rates are configurable server settings (`GAME_FOOD_SECONDS_PER_POINT`, `GAME_WATER_SECONDS_PER_POINT`, default 30/20 seconds per point). Offline loss is capped and long absences have a reserve floor. There is no damage/death system.

Residents seek reachable bowls with actual servings. A serving is consumed only at a reachable approach. Manual account care uses server supplies, proximity and cooldown checks. Care-cycle IDs are stable; server game-reward claims are idempotent and capped at 40 game Kibble per day. Story care retains its existing supplies, trust and daily rules, with local need-cycle completion and one-time local rewards. No activity credits verified platform Kibble.

Care quests appear in the existing mission board and tracker. The portrait menu links to the account care supply shop. Reserve labels are explicitly virtual game information, not a statement about a real animal’s health.

## Large decoration editor

`DecorationEditor` replaces the small drawer implementation. Desktop uses category navigation, an Owned/Shop catalog and a live placement viewport in a large shadcn dialog. Mobile switches catalog/view within that same editor. The existing canvas is reparented into the preview, not recreated or replaced by a screenshot.

It supports search, native thumbnails, remaining stock, purchase confirmation, drag/drop, selection, nudging, left/right rotation, R, storage, undo/redo, placement confirmation, Save/Cancel and revision-conflict recovery. Pointer previews use cheap bounds/overlap checks; full reachability validation runs on commit and on the server. Drafts remain local until saved.

Supported rotation metadata is explicit. Rugs/runners/blankets support quarter turns. The existing east/west sage loveseat artwork supplies an authored reverse-facing variant with matching geometry behavior. Other furniture currently has one authored facing, so its rotation controls explain the missing art and stay disabled. Existing saved orientations are retained. Additional front/back/side assets are a documented art gap; no sideways perspective artwork is invented to conceal it.

## Remaining practical limits

The implementation has not been exercised in a browser or profiled. Default characters without directional care/social poses use existing compatible animation fallbacks; native sprite art remains authoritative. Cross-worker deployment still requires the project’s shared PostgreSQL/Redis configuration. Real animal identification and verified welfare rewards remain outside these game systems.
