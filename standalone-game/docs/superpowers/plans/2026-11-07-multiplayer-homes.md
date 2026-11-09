# Multiplayer Homes Implementation Plan

**Goal:** Implement the supplied multiplayer home/social-world brief with existing generated artwork; no asset generation.
**Architecture:** Existing Next account sessions mint short-lived signed identity/pet tickets. Django/DRF persists authoritative houses, inventories, permissions, relationships, gifts and game quests. Channels synchronizes bounded house/hub rooms. A separate Phaser home scene and shadcn/Tailwind shell extend /play without replacing the neighborhood.
**Spec:** docs/requirements/multiplayer-homes.md.
**Execution:** Direct implementation, as requested by project guidance. The owner's explicit implementation request supplies authorization; no additional design approval gate. No production builds or browser inspection. The supplied brief explicitly requests two-account verification: use one bounded isolated service/type pass, with a confirmation after material fixes; no application-wide test suite. Full signed-in browser acceptance remains unverified.

- [x] Account ticket bridge, PostgreSQL-ready Django models/migrations, local SQLite fallback, Redis-ready Channels configuration and commands to run.
- [x] Authoritative transactional action service: access, friends/invites/blocks, decoration/collision/inventory, care/cooldowns, gifts/shop/quests, guestbook/favorites/photos/moderation.
- [x] WebSocket protocol: authenticated room join, limits, scoped events, validated movement, remote interpolation, chat/DM/emotes, reconnect/resync, deterministic pet state.
- [x] Data-driven existing-asset catalogue and Phaser indoor/hub scene: doors, furniture, navigation/depth, pet behavior/selection, interactions and drag placement.
- [x] Social sidebar, pet directory/detail, decoration inventory and undo/redo, settings, optional social quests, emote menu and photo controls using official shared shadcn components.
- [x] Sync/install source and assets into Next, expose /play?home=me, document configuration/limits and Jev review.

Review focus: cross-owner changes/blocked users; repeated purchases/rewards/gifts; stale house revisions; entrance-blocking decoration; lost connection and session expiry. SQLite is local development only; production uses PostgreSQL and Redis. Game currency never credits the verified platform wallet.

Delivered as the first playable milestone. Optional expanded room maps/party/playdate orchestration and dog housing remain outside this milestone; no nonfunctional room purchases are exposed. See docs/implementation/multiplayer-homes.md.
