# Furniture comparison and actor/environment responses

The owner requested an actor-style furniture comparison page and interactive objects/floors, including soft curtain/bush contact, solid-wall running recoil, ambient fish, rain footprints and tool-driven grass-to-soil changes. This extends the furniture pilot; it preserves the existing actors, currency and layout services.

## Use

- Open `http://127.0.0.1:3000/play?compare=furniture`, the Furniture creator's **Compare & interact** action, or the game menu's **Furniture comparison** entry.
- The creator itself now uses the same original/current pair, so fabric edits and seat/facing controls update beside the source sofa while authoring.
- **Couch comparison** shows the original 2D sofa and authored Trail couch at the same native scale. Select finish, facing and either actor seat. Both use the current character creator appearance. The original keeps its actual single front view; only the new couch has four generated facings. Geometry overlays show solid ground and seat points.
- **Interaction field** is a separate local authoring area. Focus it and move with WASD/arrows, hold Shift or enable Run, and use E/Dig with the shovel. Held touch/keyboard direction buttons also move the actor. Turn on garden rain, walk into it, then return indoors to leave wet prints. Mower movement and shovel actions turn grass into soil. Reset clears only this field. No room API, balance, inventory or live terrain is changed there.
- In Homes, **Inventory** and the **Workshop** have owned tool purchase/equip controls. A shovel costs 30 game Kibble, a mower 120. Buying does not auto-equip. Put a tool away through the same controls. With a shovel equipped, E prioritizes digging in your yard; put it away to return to normal E interactions. The inventory also has Dig facing tile for touch users.
- The shop includes **Soft garden bush** (25) and **Curtained opening** (55). These reuse existing 2D art and add authored contact/collision layers; they are not advertised as additional 3D exports. The opening has solid posts and a passable center. Existing bamboo-window furniture receives soft cloth panels; structural room windows/walls remain solid.

## Shared mechanics

`src/game/furniture/contacts.ts` owns the collision motor, swept soft sensors, damped sway, bounded footprints and water-bounded fish motion. Both the comparison field and Homes use it. Collision and contact sensors are separate. The foot body is 10×6 native pixels; movement is subdivided, and recoil also uses the same clearance function. Running into a solid produces a 150ms impulse along the blocked normal with a 650ms repeat guard. There is no damage or currency effect.

`interactions.json` binds front-facing legacy-art examples to local sensor, cloth and water bounds. `reactive-items.json` owns the two new catalog definitions. The new bush is traversable, but its placement space remains reserved. The curtain's two posts retain ground collision; only its cloth layer sways. No controller turns a solid wall/window into a portal. Future native rotations must project the sensors, rigid parts, ambient bounds and cloth attachments alongside the model.

`RoomReactions` draws cloth independently from its rigid frame, bounded swimming fish above existing aquarium artwork, equipped tools, fading prints and persisted soil. The existing tank art contains static fish too; the additional fish are an ambient native-pixel overlay, not a rigged 3D aquarium. Community scenery also contains a few passable native bushes that use the same contact response. Soft contact observes real local/remote actor positions. Large position jumps are ignored as sweeps.

Footprints are emitted after traveled-distance intervals while wet and indoors, fade over 12 seconds and are capped at 100. Wetness is observed from shared outdoor rain and carried through the server for 45 seconds after leaving rain. The effect consumes the effective wet flag rather than repeatedly extending its lifetime. Recoil/sensors do not alter the actor skeleton or shared animation library; digging reuses the existing low pickup motion. Reduced motion settles soft responses and keeps fish in a stable arrangement. Collision, terrain and tool actions still work.

## Authority and persistence

`backend/housing/environment.py` owns the two garden tool prices, allowlisted equipment and terrain eligibility. Tools are reusable entries in the existing supplies inventory; the equipped choice is a `garden-tool:<id>` player fact validated against owned supplies. Purchase/equip uses the existing idempotent player-locked mutation transaction. No free supplies, accounts or balances were generated.

Server wetness is an expiring game-cache status, carried in room movement and bootstrap data. Cache resets clear this cosmetic status. Clients can predict rain footprints but cannot grant equipment or persistent edits. Existing accepted movement still passes speed, range, segment and collision validation before automatic mower handling. Manual shovel work uses the server's current room position, not a client position assertion.

Grass changes are limited to the owner's own yard. Bounds, structural cells, protected paths, furniture ground clearance, proximity, current interaction and equipped ownership are checked under player/house locks. Soil is stored in `PlayerHouse.object_states` as `yard:terrain:<x>,<y>`; the zone adapter exposes `terrain:<x>,<y>`. A repeated request for already-soil ground does nothing. Changes broadcast to that room and reappear through bootstrap/pet-tick state. This uses existing JSON fields and needs no new schema migration. Soil does not change navigation collision and currently has no automatic regrowth.

Room transitions, layout refreshes and shutdown dispose object layers and reset transient sensors as appropriate. The comparison disposes its input listeners, frames and native renderers on unmount. Persistent yard edits remain on the server. Game currency and terrain never become verified platform rewards or real-world location/environment records.

## Skill and delivery scope

`/home/micxsz/.codex/skills/pawtrail-furniture/SKILL.md` now routes environmental behavior work to `references/environment-contacts.md`. That reference records collision/soft/status/tool/ambient contracts, source paths, comparison usage, current examples and installation boundaries. A furniture task must specify the actor trigger, required state/tool, response and recovery, rather than shipping only inert artwork.

Source review covered the shared motor/sensor calls, rotated couch metadata, wet lifetime, separated zone-state namespace, permission/range/tool checks, idempotent soil writes and disposal paths. Changes were mirrored only into the corresponding main-app game modules, with catalog items merged by ID. The housing process is reloaded with its existing environment for the new handlers. No automated tests, checks, builds, browser/game verification or skill validator were run under the standing workspace instruction. No end-to-end result is claimed.
