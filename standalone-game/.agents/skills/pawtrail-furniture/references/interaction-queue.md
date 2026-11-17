# Current interaction-first furniture phase

For now, prioritize furniture with meaningful interactions, then separately
ask the owner to choose 2D sprites or 3D + 2D renders. Actor docking, chairs,
beds and support surfaces do not require a model. Candles, lamps,
feeding/water levels and plant-care visuals can remain 2D with state sprites.
A state change alone never justifies new 3D. Inspection, a generic
collision box, placement rotation and recoloring do not qualify by themselves.
Keep noninteractive sprites and defer their models. Preserve already authored
models even if inspection-only. Do not invent an action just to justify a mesh.

Read the current `assets/furniture-studio/batches/conversion-queue.json` and
`interaction-plan.json`. The latter records every catalog ID, actual declared
actions/contacts, planned contract, scope, corrections and batch. Incorrect copied
metadata is not proof of meaningful behavior: current indoor plants declare a
door action and a bedside cabinet declares rest. Those need deliberate correction
before conversion can be activated. Planning a correction does not apply it.

## Define the action and states before the art pass

Record actor/species, approach, pose/socket, duration, collision, occupancy,
required supplies/permission, visible response and exit/cancel behavior. Keep:

- Persistent state on the placed instance, through existing server-owned
  `PlayerHouse.object_states` keys `zone:placementId`: `lit`, `open`, food/water
  counters and care timestamps. Color/facing changes must not reset that state.
- Occupancy/reservations through existing interaction/surface leases, not durable
  `occupied=true` flags. Cancellation, departure and removal release them.
- Flame phases, sway and fish motion as transient presentation, not saved progress.

Candles use `lit=true/false`; on has flame/light and off has no flame/emission.
Keep the candle as a native 2D sprite with off/on artwork and optional flame/glow;
do not model its body just because it has a switchable state. Apply that same
rule to other state-only furniture unless a separate geometry need is explicit.
The existing generic implementation only tints light sprites. Do not describe
proper off art as implemented until it is. Reuse the current `lit` default and
backend action rather than adding a parallel `on` flag. Food/water reuse 0–3
counters and independently resolve empty/partial/full visuals. Double feeding
tray currently declares food only; adding water is explicit planned work.

Door state may change passage collision; a future open cabinet/refrigerator
must keep its rigid body solid. Never make all `open` furniture passable.
Remote clients/reconnect must receive the same server state. Repeated completion
of an action must not toggle twice or spend supplies twice. Keep existing
permissions, costs and reward boundaries.

## Execute a batch only when requested

For 3D/hybrid work, retain the multi-angle reference review, native contour,
canonical-color preview, actual actor clearance and circular above-item rotation
control. Reuse geometry for genuine color/fill-state/facing variants. State art
must cover supported facings and colors without a second furniture system.
An interactive item can remain 2D when sprites suffice; current examples are
decorative lights and soft bush/window contacts.

Report planned, installed and runtime-verified status separately. A queue-planning
request updates plans/records; it does not authorize executing the whole queue,
automated tests/builds, live browser verification or account mutations. Follow
the owner's standing direct-execution/no-agent workflow.
