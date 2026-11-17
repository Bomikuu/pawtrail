# Neon Heights Phase 6 Implementation Plan

> Execute directly, without agents, under the owner's explicit Phase 6 request.
> Tests, checks, builds and browser verification remain deferred. The reviewed
> floor plan and implementation phases supply the approved design and sequence.

**Goal:** Finish the approved local floor ecosystem: three governance endings,
optional quests, four recipes and NPC memory with real reputation consequences.

**Architecture:** Extend the existing typed command/atomic local-save adapters.
Keep optional new state additive for existing saves. Compose the current shadcn
panels and NPC portraits. Reuse approved map layouts, live prop renderer, shared
sitting/navigation and bounded animation clocks; produce only Batch D's missing
Koi Lamp and Bastion Bench under the existing furniture art-review default.

**Tech stack:** TypeScript, React, existing Tailwind/shadcn, shared native canvas,
Three.js authored props, locked localStorage campaign snapshots.

**Spec:** `floor-design.md`, `npc-state-spec.md`, `npc-scripts.md` and
`implementation-phases.md` Phase 6 in this directory.

## Global constraints

- Local SC, inventory and save state never represent Django/Kibble/payments.
- Preserve three exclusive governance choices, exact effect tables and known
  private/public witness boundaries. All endings grant eligibility; no Floor 02
  travel button until a real destination exists.
- Item costs, outputs, story flags, reputation and receipts commit together.
  Opening/cancelling UI grants nothing. Show accepted changes and save failures.
- Preserve old saves, unrelated editor/social data, actor scale, real contacts,
  nearest-neighbor pixels, reduced motion and lazy/disposed stage resources.
- New active map props use actual textured 3D and reviewed turnarounds. Existing
  approved facilities can serve the new activities without a map redesign.
- Self-hosted Saira Condensed headings and Instrument Sans body/control text.

## Review focus

1. Stale confirm/double-click/reload: one immutable ending, no duplicated outputs,
   supplies or optional quest rewards; request IDs protect repeatable crafting.
2. Old slots: additive missing optional state defaults safely; early facts
   reconcile through explicit NPC interactions, not fabricated seed progress.
3. Reputation/privacy: precise clamped effects, real price stacking/caps, no
   knowledge of private choices by an NPC who did not receive them.
4. Interrupted P04: normal beat timing is validated; assisted mode is untimed with
   equal completion; reset/close/failure never pays a reward.
5. Crafted fixtures: spend/place/reclaim/rotate/light state persists, collision
   follows facing, sitting blocks unsafe rotation/reclaim and no actor resizing.

## Tasks

- [x] Extend `src/game/floors/state.ts` with additive activity/fixture state and
  narrowly scoped effects. Preserve v1 validators and exclusive save updates.
- [x] Add `phase6-content.ts`, `phase6-commands.ts` and route through `actions.ts`:
  governance, Q07 repair/report, Q10 actual P04/report, Q11 expedition contract,
  perk claims, four atomic recipes and fixed camp fixture slots. Keep all exact
  approved prices, quantities, event IDs and reputation changes.
- [x] Reset Q11's acceptance/claim only on an explicit fresh expedition. Keep
  permanent decisions, unlocks, items, repairs, recipes and floor eligibility.
- [x] Generate Batch D turnarounds, present them for the existing 60-second
  furniture review (explicit yes or recorded no-response default). Then author
  both live generated-paint models with native four-facing contacts and animation.
- [x] Integrate existing R02/R04 facilities, optional furnishing deployment at the
  shared camp and above-object rotation controls. Keep placement and changed
  navigation owned by the saved campaign, with safe scene preparation for changes.
- [x] Add `phase6-dialogue.ts` and shared scripted callback selection, preserving
  accepted response → specific history → relevant unseen callback → governance →
  personal-tier fallback; explicit turn-ins/history topics remain accessible.
- [x] Add focused `floor-phase6-panels.tsx` and P04 panel, journal/recipe/perk/ending
  status. Show exact materials, consequences, current stock/discounts and failures.
- [x] Author focused transition/persistence/privacy/economy cases without running
  them. Inspect native assets/facings/contact authoring boards; record all runtime
  acceptance as pending, plus changed shared dependencies for Phase 7.
- [x] Update Batch D job, production status and Phase 6 delivery with real outputs,
  review result, source prompts and omissions. Keep verification deferral explicit.

## Delivery status

Authoring/integration tasks are complete. See `phase-6-delivery.md`. Runtime tests,
build/typecheck and browser/animated actor acceptance are deliberately pending;
the checked authoring tasks do not imply those deferred checks passed.
