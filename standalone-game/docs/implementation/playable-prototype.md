# Playable prototype — 7 November 2026

## Delivered source

A standalone Vite/React/TypeScript application in this workspace. Phaser 3.90.0 owns the world, Arcade Physics collisions, actor animations, depth sorting, camera, pathfinding, and animal state machines. React and official shadcn components own the operation controls, dialogs, inventory, journal, loading and recovery UI. Tailwind owns routine styling.

Two Tiled-compatible maps are generated from the existing original asset packs. They include ground and collision layers plus typed object markers for buildings, props, animals, volunteers, exits, and supplies. Only native atlas files are copied to public runtime assets. The social application and its existing changes were not modified.

The player can walk with keyboard or touch controls, click/tap to route around blocked cells, interact through keys or accessible buttons, feed/pet/water animals, collect supplies, coordinate two animal rescues, earn one-time local Kibble/quest rewards, talk to volunteers, and visit/leave the shelter. Sheltered animals appear inside. The eight animal identities use their full supplied animation families for idle/walk/sleep/eat/reaction states. The rescuer's supplied action rows are reused for care and pickup/rescue actions.

## Important boundaries

- This is a local game prototype; no production authentication, backend, authoritative Kibble, or real rescue records are implied.
- The shelter interior is assembled from the supplied existing terrain/props. Volunteers reuse the single supplied human sheet rather than claiming a new NPC art collection.
- Progress saves every five seconds, on completed actions and scene changes, and on window blur. Reloading between position saves may restore an earlier position. Gameplay care is recorded only after the action delay and cannot be awarded twice for the same action and animal.
- Game menus pause movement and physics. Active care can complete while a menu is open; the action remains one-time. Reduced motion removes camera easing and incidental tweens.
- The optional Django adapter and contract are source-only. There is no automatic client-ledger upload or server implementation.
- Tiled editing is supported for the JSON ground/collision/object markers; rerunning the map generator overwrites generated layouts.

## Source review and verification

Source review addressed blocked destinations and spawn recovery, normalized diagonal velocity, delta-aware camera smoothing, proximity-gated actions, resource/reward idempotency, malformed/unavailable storage, scene-bound timers, game/keyboard/window listener cleanup, retryable loader failure, and confirmation before resetting progress. shadcn registry sources and fonts retain their licenses. Progress has a documented ARIA value forwarding adjustment.

The Vite development server started on `127.0.0.1:5173`. No agents, automated tests, type/UI/format checks, production builds, or browser-based inspection were performed, following the owner's instructions. Source implementation and a ready development server do not certify rendered/gameplay behavior.

Primary implementation references: [Phaser Arcade Physics](https://docs.phaser.io/phaser/concepts/physics/arcade), [official shadcn Vite setup](https://ui.shadcn.com/docs/installation/vite), and the installed Phaser 3 type definitions for camera, tilemap, and keyboard APIs.
