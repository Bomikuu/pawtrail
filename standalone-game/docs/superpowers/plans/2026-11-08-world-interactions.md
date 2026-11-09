# PawTrail world interactions implementation plan

**Goal:** Upgrade the renderer and make movement, furniture and animal interactions physical, connected and durable across home floors, yards and the commons.

**Architecture:** One versioned native-pixel geometry contract in the housing catalog feeds TypeScript and Python. The client predicts movement and orchestrates approach/alignment/animation; Django validates actions, inventory, reservations and durable object state. Art size, ground collision, placement, approach and elevated surfaces have independent meanings.

**Tech stack:** Phaser 4.2.1, TypeScript, React, official shadcn/ui, Tailwind, Django/Channels.

**Spec:** Owner-approved gameplay improvement prompt in this conversation.

## Constraints

Direct native implementation. No agents, automated tests, checks, builds or browser verification. Preserve saved layouts; no automatic redecoration. Nearest-neighbor/integer zoom. No virtual care or currency is real welfare proof or platform Kibble.

## Delivery tasks

- [x] Renderer: pin Phaser in both applications; migrate affected APIs and shared renderer configuration, asset progress and recoverable failure UI.
- [x] Geometry: independent catalog collision/placement/approach/seat/surface metadata; rotated pixel bounds; 8px navigation and foot clearance in both runtimes. Preserve legacy layout coordinates.
- [x] Actions: typed approach-align-perform-complete-recover controller, cancellation, failures, keyboard/touch contextual choices; no click-through movement.
- [x] Furniture/server: transactional leases, idempotent action IDs, persistent bowl/light/plant/aquarium/door state, correct seats/exits and disconnect recovery.
- [x] Animals: authoritative approach/climb/perch/descent and resource consumption; client elevation/jump presentation and ground shadows; personality cooldowns.
- [x] Integration: room, yard and community interactions, remote pose interpolation, debug geometry overlay and motion/accessibility settings.
- [x] Delivery: synchronize standalone source into platform, apply operational migrations with system checks skipped, document actual scope and verification restrictions.

## Motion direction

The focal moment is a cat approaching and hopping onto its perch, with a grounded shadow and quiet landing. Other motion communicates position, action progress and completion. Reduced motion removes the hop arc and secondary particles; it does not hide state. Keep simulation out of React; update HUD only at phase boundaries. Aim for 60 FPS without claiming an unmeasured result.

## Review focus for a future authorized verification pass

Asymmetric 90/180/270-degree placement; legacy layouts near walls; two visitors choosing one seat; moved/removed occupied furniture; suspended tab, lost socket or stale action. These must recover without duplicate inventory use, clipping or invented rewards. Automated and browser verification are intentionally deferred by the owner.

Delivery note: see docs/implementation/physical-world-interactions.md for cosmetic encounter boundaries, directional art gaps and deferred runtime acceptance. All automated and browser verification remains intentionally unperformed.
