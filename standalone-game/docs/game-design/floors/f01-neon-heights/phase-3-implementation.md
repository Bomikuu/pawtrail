# Neon Heights Phase 3 Implementation Plan

**Goal:** connect the approved lobby, arrival and market into the real local
prepare → travel → Q01/Q02 → remembered allocation → return loop.

**Architecture:** reuse StageCanvas/StagePlaytest and the live prop/NPC renderer.
Add a dedicated adventure route, separate from editor rehearsals. Typed authored
commands and dialogue consume FloorCampaignStore; save inventory, SC, claims,
location, knowledge and reputation atomically. Destination scenes preload and
resolve collision-safe arrivals before location persistence and activation.

**Tech stack:** React, TypeScript, existing Phaser/Three/canvas adapters,
Tailwind, official installed shadcn components and shared parchment GameDialogue.

**Spec:** floor-design.md, npc-scripts.md, npc-state-spec.md and Phase 3 in
implementation-phases.md. These documents and this execution scope are already
approved by the owner. Implement directly without agents.

## Constraints and review focus

- Local campaign/save-slot identity is independent of the selected actor.
- Preserve existing editor, neighborhood and social-worktree data.
- Keep all rewards/SC local. No Django/Kibble/payment writes.
- No new map/art production: reuse the three approved maps and existing props.
- Preserve old v1 saves: absent optional vitals means 100/100 HP and no insulation;
  invalid explicit values/unknown versions remain errors, not a reset.
- Save failure, stale state, double submission, stock exhaustion, missing costs
  and cancelled/overloaded allocation must spend/grant nothing.
- Callback delivery survives reload via receipts + seen-node acknowledgements;
  personal trust does not reveal private facts to other NPCs.
- Travel failure retains the old scene; returning/resting/reloading never restocks.
- No automated tests, builds, checks or browser verification unless requested.
  The owner's latest decision remains “Skip verification for now.”

## Tasks

- [x] Add phase-three commands: actual prices/stock, buy/sell/use/rest, Q01/Q02
  outcomes, P01 capacity preview and deterministic journal/reputation summaries.
  Extend the save store with locked travel and idempotent seen acknowledgements.
  Author focused tests for these new transitions; leave execution pending.
- [x] Add authored M01–M03/I01 dialogue selection and pending-response/callback
  precedence. Show costs/reputation deltas after successful commits only.
- [x] Add optional gameplay hooks to the stage adapter: pause, collision-safe
  initial placement, accepted object actions, labels and destination preloading.
  Preserve editor behavior when no adventure binding is supplied.
- [x] Add the adventure controller and responsive HUD: real world interactions,
  shared dialogue, P01 preview/confirm/cancel, shop, journal/inventory, free rest,
  travel, local save feedback and actor switching.
- [x] Register the lazy route and navigation entries; update production status,
  handoff and owner-facing run link. Report unobserved runtime acceptance clearly.

## Focused verification when requested

Both allocation branches, overload/cancel, Q01/Q02 once-only claims, failed
payments/storage, finite expedition stock, duplicate purchase submissions,
save/actor/stage reload, NPC callbacks and knowledge, blocked/failed travel and
return to hub. Inspect changed source dependencies; no unrelated mobile, couch
or whole-game sweeps and no extrapolated performance claims.
