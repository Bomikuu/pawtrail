# World interactions and immersion — phased implementation

**Goal:** Extend the existing playable game with a physical mission board, mission tracking, collectible inventory, a synchronized cat soundboard, weather, clouds, lighting, and environmental interactions.

**Execution:** Native implementation in this session. Preserve current movement, platform integration, demo rooms, local saves, and server permissions. No agents, automated tests, builds, or browser verification. The user will play the result. Jev supplies architecture judgments, not certification.

**Architecture:** Reuse the existing quest/care/inventory/audio/clock systems. Exploration remains a local saved simulation. Shared rooms use server-derived world time/weather, server-validated collectibles and soundboard events. Generated native sprites have explicit manifests; original sources and prompts remain available. Official shadcn and Tailwind provide controls; the canvas stays primary.

## Phases

- [x] 1. Assets: original board/UI, animal portraits, inventory items, cat expressions, weather, night props, interactive props. Native exports/manifests and original short sound assets.
- [x] 2. Community board: world object/collision/proximity, pet mission cards, categories, details, accept/status/claim.
- [x] 3. Tracker: collapsible right tracker, objectives/pinning/known-location guidance; Pets/Missions switch in Homes and compact mobile access.
- [x] 4. Inventory: preserve old saves, add categorized items/details/use, world discoveries and protected quest items; authoritative per-player claims in shared rooms.
- [x] 5. Cat soundboard: original audio, animated faces, local controls, proximity, overlap/cooldown, synchronized IDs through existing Channels events.
- [x] 6. Weather: deterministic clear/cloudy/rain cycle, pooled rain/splashes, drifting clouds, puddles, indoor attenuation and safe behavior changes.
- [x] 7. Day/night: replace the exploration dark overlay with sprite/tile tinting and readable light zones; room time/weather from server, indoor/outdoor lights and ambience.
- [x] 8. Integration: environmental inspect/rustle/mail/sit interactions, reduced effects, touch/keyboard/accessibility, app sync, documentation and truthful completion record.

## Boundaries

- No client-submitted balances become server currency or verified platform rewards.
- Client world collectibles are local; shared room pickups are per-player, idempotent, and server-position validated.
- Shared conditions derive from server epoch, not player preferences. Effects preferences only alter rendering/audio.
- Generated frame dimensions and source rectangles are recorded. No animation/performance approval is claimed without playback.
- Known-location guidance never reveals hidden/discovery objectives.

Implementation phases are recorded as delivered; runtime acceptance is not certified. No automated tests, typechecks, builds, browser checks, playback or performance measurement were run. See docs/implementation/world-immersion.md for the exact delivery and limitations.
