# Multiplayer Homes — first playable

Entry: `/play?home=me` in the existing PawTrail application. `/play` retains the exploration RPG and its real-profile/adoption encounters. The Go Home action opens the new housing view. Asset generation from the attached brief was skipped; runtime definitions were prepared from the already generated housing catalog.

## Implemented

- Automatic account-linked home provisioning on the first game session; server-saved starter interior and a shared neighborhood hub with house portals, nameplates, mailboxes and gardens.
- Phaser walking, tap navigation, touch joystick, depth sorting, furniture collision, E interaction, remote player interpolation and reconnect resynchronization. No movement while typing or using a modal.
- Eight-person configurable room limit. Channels scopes events to the current house. Nearby players have names, public profile access, friend/wave/visit/block/report actions. Server movement segments are checked for speed and collision.
- Ten cat visual variants, actual owned-pet profile linkage, autonomy with reachable routes, personality-weighted behavior, sleeping/grooming/playing/feeding states, preferences, friendship and virtual memories. The compact right directory selects/highlights pets, focuses the camera, shows their real published details and links to the full profile. Mobile panels use bottom dialogs.
- Virtual petting/feeding/water/play/help actions. The server checks room access, visitor permissions, proximity, sleeping state and need/care cooldowns. Water/help share one refill need. These never create real sightings, care evidence or verified wallet credits.
- Furniture inventory/shop with previews, category search, purchase confirmation and authoritative prices. Tile-snapped mouse/touch drag, keyboard placement, valid/invalid feedback, planar-item rotation, storage, cancellation, undo/redo and save/discard. Server checks inventory quantities, overlaps, reachable approach points, entrance access, player positions, placement limits and captured layout revision. Authorized decorators use the owner's permitted stock; purchases and gifts spend only the acting account's resources.
- Friends search among housing players, requests/accept/decline/remove, invitations/accept/visit, favorites, block/unblock, reports, permission changes, closing/kicking visitors and online visibility. Public/friends/invite/private house access is enforced by the backend, including active connections.
- House chat, short speech bubbles, private accepted-friend messages, timestamps/history, mute, simple character insertion and unread counts. Private messages use personal channels, never room broadcast. Twelve reactions select the existing animated emote/effect sprites and appropriate character poses with server cooldowns.
- Five optional social quest definitions, one-time game rewards, cosmetic inventory gifts with ownership transfer, a moderated guestbook, persistent photographs/album/download, notification history/quiet preference, appearance selection, floor/wall selection and an actual 40→80 decoration-slot upgrade.
- Existing original procedural music, indoor ambience, footsteps, interaction/reward sounds and nearby animal voices. Spatial attenuation, stored volume/mute and gesture unlock are retained. No new audio/image generation was performed.

## Authority and authentication

Next `/api/game/session` reads the existing platform session and signs a two-minute account assertion. The server-only secret is shared with Django. The browser exchanges the assertion for a short opaque session token in memory; the larger pet projection is not placed in WebSocket URLs or repeated HTTP authorization headers. Production requires `PAWTRAIL_GAME_SECRET` in both services. Development creates a mode0600 secret outside the repository in `~/.local/share/pawtrail-housing/bridge-secret`.

Only authenticated server-derived identities and public owned cat profiles enter tickets. In demo mode the bridge verifies actual record `ownerId` and published/owned state against the current session repository. For ordinary real-mode members the existing `scope=mine` contract is used. Real-mode shelter-manager pet import is intentionally withheld because their mine scope also includes organization animals and the current public DTO does not prove personal ownership. The interface names this limitation rather than importing shelter residents as personal pets.

Django persists game-specific profiles keyed by existing platform IDs, houses/rooms, virtual pet references, relationships, visitors, messages, gifts, photos, guestbook entries, receipts and reports. It does not create a second credential database or duplicate core animal profiles. Display snapshots are caches from the signed bridge; virtual preferences/memories remain game data.

Durable mutations run in database transactions with player/house locks and idempotency receipts. The client preserves uncertain action keys for retry. Layout saves use the revision captured when decoration began. Purchases, gifts and quest claims are server-authoritative. Prototype local game saves and the platform verified wallet are never accepted as balances.

## Run and configuration

1. From the game workspace: `uv sync --project backend` (already installed for this delivery).
2. `npm run sync:app` installs source, the signed session route and only runtime housing assets into the existing Next worktree.
3. `npm run dev:homes` migrates and runs Daphne on127.0.0.1:8001. Keep the existing Next app running on3000.
4. Sign in through PawTrail, then visit `http://127.0.0.1:3000/play?home=me`.

Local development uses persistent SQLite and a single-process channel/cache layer. Production requires a PostgreSQL `DATABASE_URL`, `REDIS_URL`, `PAWTRAIL_PRODUCTION=1`, explicit `PAWTRAIL_GAME_HOSTS` and allowed `PAWTRAIL_GAME_ORIGINS`. Set `NEXT_PUBLIC_HOUSING_URL` in Next to the externally reachable HTTPS/WSS service origin. Both services can share `PAWTRAIL_GAME_DATA_DIR` for local development; production should use the shared environment secret instead of a development file. The default visitor limit is8; change `PAWTRAIL_HOUSE_CAPACITY` to configure it. Redis is required for multi-process presence/channel behavior; do not deploy the local memory layer across workers.

## Validation and current limits

The supplied brief explicitly requested two-account verification. A bounded isolated two-identity service check covers account assertion exchange, friends/invite access, unauthorized layout/fact rejection, purchase replay, stale revision rejection, valid starter layout, live join/chat/movement/emote/leave and block revocation. Temporary database/cache storage avoids changing real platform accounts. Standalone and scoped integrated source checks are recorded in the delivery notes. No production build or browser/visual verification was run. This is service-level evidence, not a claim that two actual signed-in browser accounts have completed the full UI journey.

The first playable milestone is the implemented scope. Expanded room/garden maps, party management, pet transfer/playdate permissions, dogs as house residents, a moderation-review dashboard and uniform fine animation rigging remain later content/integration work. The shop does not sell nonfunctional room upgrades. Game photos live in the account-linked housing album, not the unrelated public community-post media collection. Existing generated animation proportion/loop limits are not magically certified by using the artwork. The backend is installed/running locally, not deployed to a production PostgreSQL/Redis environment.

Delivery validation: standalone TypeScript and the integrated scoped TypeScript pass (including `/api/game/session`) completed successfully. The isolated service smoke also covers the literal `house=me` client bootstrap and opaque token exchange. Jev selected the server-authoritative architecture and the honest `first_playable` release label; see `homes-jev-review.json`. These are model judgments alongside direct checks, not substitutes for them. The Impeccable launcher was unavailable (permission denied); existing PRODUCT/DESIGN context and the skill references guided this extension. No visual approval is claimed.

Transport sends changed player movement at up to10Hz into a separate interpolation lane rather than re-rendering the full React shell for each position update. Pets publish lightweight1Hz state with client prediction. Sample and real-account houses/social hubs are isolated. Presence and tokens are temporary; layouts, stock, quest receipts and virtual care persist. Production deployment guidance follows [Channels deployment documentation](https://channels.readthedocs.io/en/stable/deploying.html).
