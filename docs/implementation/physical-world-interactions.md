# Physical world interactions

Implemented 8 November 2026 directly, without subagents. This is a source implementation and database migration delivery; no automated tests, checks, builds, browser verification or performance measurements were run, per the owner’s instructions.

## Renderer

Both the standalone game and integrated platform pin Phaser **4.2.1**. `src/game/renderer.ts` centralizes nearest-neighbor rendering, explicit pixel rounding and 60 FPS scheduling. The migration follows the official Phaser 4 migration guide: this game uses public sprite/camera/tile APIs and no old custom WebGL pipelines, pre/postFX or bitmap masks. Native frame registration now reads frame size, columns, counts and rates from manifests. House asset loading reports actual progress; failed assets and graphics context loss offer a lighter Canvas retry. Exploration uses its existing error/retry surface with the same renderer recovery. Canvas is a compatibility fallback, not a promise of advanced WebGL effects.

## Geometry

The catalog in `src/game/housing/catalog.json` and `backend/housing/catalog.json` has `geometryVersion: 2`. Each furniture entry separates native artwork, ground rectangles, placement rectangles, approach points, seat slots, animal surfaces and occlusion role. Existing item IDs and saved tile coordinates have not changed. Quarter turns rotate all four rectangle corners around the actual art anchor, including 180° and asymmetric footprints.

`housing/spatial.ts` and `housing/spatial.py` implement matching 8px navigation and a 10×6px foot body. Fine navigation uses A* with orthogonal neighbors, clearance at both ends and bounded segment collision. Navigation is rebuilt on geometry/door changes; Python caches immutable geometry signatures. Exploration registers its actual terrain and ground-object rectangles with the same navigation, instead of inflating every chair or trunk to full tiles. Physics bodies remain separate from the art rectangles. There is no automatic redecoration of existing houses.

Add `&geometry=1` to a Homes URL (or `?geometry=1` on `/play`) for the developer geometry toggle. It shows physical blockers, actor feet, art bounds, placement bounds, approaches, seats, surfaces and blocked navigation cells. It is intentionally off by default.

## Interactions

`housing/interactions.ts` owns the typed select → approach → align → perform → complete → recover lifecycle. Object clicks stop propagation and open a compact shadcn action menu. E and touch interaction select the same target/actions. Choosing an action walks to a reachable approach, faces the target and uses the native player animation. Manual movement or Escape cancels. Unreachable, removed, timed-out or rejected targets produce a recovery message. Moving resident pets can trigger bounded approach replanning.

Furniture actions include seated/rest poses, filled/half/empty bowls, lights, watering plants, aquarium care and doors. Furniture editing shows the precise placement shape and pickup/place poses. Saved furniture, rather than extra decorative props, remains authoritative. Stair and exit clicks approach their landing before entering another space. Shared commons benches use the same reservation system as homes/yards. A wooden door is available in the workshop; it uses the existing native closed/open artwork.

## Authoritative housing backend

Migration `0009_world_interactions` adds durable `PlayerHouse.object_states` and unique per-player `WorldInteraction` receipts. The room protocol accepts `interaction.begin`, `interaction.complete`, and `interaction.cancel`, each with a stable `actionId`. The server validates entry/permissions, approach, target revision, available slot, duration and supply stock. A house lock serializes resource use and occupancy. Repeated completion returns the receipt instead of spending twice. Food/water consume actual *game* supplies; plants and aquarium use water bottles. Bowl servings are consumed by resident animals.

Seats have 30-second leases renewed by an active session. Cancellation, disconnect, replacement, permission changes, expiry and moved/removed furniture release poses. Late acknowledgements cannot re-seat a cancelled local action. Remote position interpolation is frame-rate independent, with bounded 10 Hz movement messages; durable object state is not sent every render frame. Current local development uses the existing single-process Channels/cache configuration; configure shared Redis and PostgreSQL for multiple workers.

## Animals

Resident pets use a low-frequency server state machine with personality/time-aware watch, wander, follow, play, eat, drink, groom, rest, sleep, climb and descend states. Their cache retains routes and cooldowns between snapshots. A cat approaches a specific surface, reserves its stable ID, hops, settles and descends to a safe ground point. Elevation is independent of navigation. Higher cat-tree platforms use linked lower platforms with a 24px elevation-step limit. Moved/removed supports recover to walkable floor. Bowl consumption and shared perch reservations do not become real welfare activity.

The client renders a restrained hop arc, ground shadow, support-aware depth and native poses. Reduced effects/system reduced motion removes the arc. Public platform animals in the commons keep actual profile links; their nearby wandering and pet/play reactions are cosmetic local presentation and do not reserve real resident pets, spend shared supplies, generate sightings or award verified Kibble.

## Practical limits

Native manifests remain authoritative. There are existing jump/sofa/cat-tree poses, but no complete directional climb animation or unique directional seated/rest pose for every character and every object. The implementation reuses available poses and procedural elevation rather than inventing missing sprite frames. Fine-grained furniture anchors, occlusion at every rotated arrangement, network timing and renderer migration still need a separately authorized runtime pass. The 60 FPS setting is a target, not a measured result. Frame timing/profiling and cross-browser acceptance are unverified.

Real platform animal coordinates, adoption workflows, identification evidence and the verified Kibble ledger remain separate. Housing receipts and virtual rewards cannot certify real-world animal care.
