# Neon Heights — implementation phases

**Status:** floor plan and concepts A–F approved. Phases 1–6 are authored and
installed locally. Historical Phase 1 checks remain historical; current runtime
acceptance is pending under the owner's “Skip verification for now.”
See [Phase 6 delivery](phase-6-delivery.md) and `production-status.json` for the
actual installed scope. Governance, optional activities and crafting are installed. Phase 7 full-loop
review remains planned.

Read [floor design](floor-design.md), [NPC scripts](npc-scripts.md) and
[NPC state specification](npc-state-spec.md) as one versioned package. All new
content IDs and suggested new module paths below are proposals. Existing source
paths identify foundations to inspect/reuse, not proof they already implement
the proposed floor.

## Delivery principle

Build one real prepare → enter → act → remember → return loop before expanding
the floor. Reuse the existing city art, actor, HUD, furniture and Kurogane family.
Production batches follow accepted concepts and real dependencies. Don't generate
all assets before resolving interactive 3D, or preload all 50 floors to build one.

Planning approval records the agreed design. Begin these phases when the owner
requests implementation of the approved scope. Map/asset concept gates remain
in force. Existing verification permission is governed by the live AGENTS/user
instructions; the checks listed here do not grant that permission themselves.

## Phase 0 — Review the floor package

**Prerequisite:** owner can read the four linked documents.

**Deliverables:** accepted floor identity/number, shared versus local lobby
structure, six-stage route, character arcs, gameplay/currency scope and first
production batch. Record changed decisions in this package rather than keeping
contradictory versions. Proposed rates/prices remain subject to later playtesting.

**Review points:** provisional Floor 01 with an existing 8,400-HP boss; solo
baseline; five new NPC identities; two different meaningful privacy choices;
optional Keepsake sale/reconciliation; governance's three equally valid routes
to advancement. Confirm the interactive 3D intent while retaining the established
2D environment and creature pipeline.

**Exit:** explicit reviewed package version and requested implementation scope.
Text review doesn't approve future unseen map concepts. No images, models, world
scripts, database data or gameplay grants are created by this phase alone.

## Phase 1 — Resolve the runtime and state contracts

**Depends on:** Phase 0 and an implementation request.
**Scope:** only floor support needed for this floor and reusable future content.

Inspect current stage canvas/playtest, actor/furniture source renderers, dialogue
choices, quest events and save validation. Candidate foundations:

- `src/game/stage-editor/{data,canvas,playtest}.ts` for registered layouts,
  ground/native assets, depth, actor movement and interaction contacts.
- `src/game/housing/geometry.ts` and interaction controller for per-facing
  actor contacts/occupancy and stateful usable props.
- `src/components/game/dialogue.tsx` and shared dialogue HUD for real choices,
  text reveal, portrait performance, keyboard/focus and reduced motion.
- `src/game/systems/{quests,save}.ts`, `types.ts` for actual local state contracts.
- `src/game/monsters/arena-contract.ts`, robot/family encounters and
  `src/game/items/` for fictional combat/accepted event integration.

Proposed new domain boundary: `src/game/floors/`, with typed stage/quest/content
registries, narrative condition/effect evaluation, local campaign save/migration,
loot/claim receipts and transition ownership. Select exact files/interfaces after
inspecting these real boundaries; do not append every system to a giant scene.
Keep narrative data separate from portrait art and from game mutation code.

**Interactive 3D decision:** prefer one bounded shared orthographic model renderer
that composites actual visible 3D prop instances into the 2D stage, with aligned
ground/foreground output and per-instance poses. Preserve pixel filtering,
integer zoom and actor geometry. Validate how the actor passes behind/front,
sits in and rotates the existing approved furniture model before promising all
new props. Do not create a WebGL renderer per item or call a baked sprite live 3D.
If that approach cannot meet the real device budget, present the concrete gap
and alternatives for an owner decision; don't silently replace the requirement.

**Deliverables:** documented runtime choice; floor transition and checkpoint
contract; typed NPC facts/knowledge/reputation; atomic local outcome/claim model;
save ownership and migration contract; shared animation clock/lifecycle plan;
first selected interactive model adapter. A new local currency requires an actual
inventory/service adapter, not the neighborhood's fixed Kibble quest fields.

**Acceptance:** one actor and existing selected 3D prop retain scale, contacts,
rotation and correct depth; a story choice has a well-defined once-only outcome,
save/reload and failure path. The actual floor's missing `SceneId`/save support
is handled deliberately. Preserve original neighborhood and editor save keys.

**Proposed checks when authorized:** focused adapter contact/rotation/depth pass;
one choice→save→reload and duplicate/failed submission check; affected state and
geometry tests only. Do not run unrelated mobile, couch or whole-game sweeps.
Unobserved checks remain pending. Owner checkpoint: approve any required change
to interactive representation, substantial renderer scope or save policy.

## Phase 2 — Approve the first map concepts and asset batch

**Depends on:** Phase 1's viable representation/state boundary.
**Skills:** PawTrail Maps → PawTrail Assets, Furniture/HUD where needed.

Generate the shared-lobby, revised arrival and market concepts first; show the
proposed route/landmarks and planned motion. Existing Neon Heights art is a
reference/reuse foundation, not automatic approval of a new floor layout. Wait
for explicit approval of each identified map image or the named concept package.
Keep other stage concepts as later batch gates to avoid premature whole-floor art.

**Batch A:** reuse city-kit bodies; add localized window/reflection/sign animation,
moving koi/android projections, fan/rail/kiosk motion; author only the missing
usable lift, camp seat, P01 board and Ivo/Mara presentation needed for the first
loop. Follow furniture's applicable source-angle reviews. No source-image masters
or entire art directories enter browser imports or Tailwind scanning.

**Deliverables:** approved concepts, actual native/model animation packages,
manifests with exact frames/durations, contact geometry and collision; versioned
arrival/market layouts preserving `neon-heights-v1`. Review native artwork at
its actual game scale and all promised views. A still export isn't motion evidence.

**Acceptance:** planned palette/camera identity is recognizable, navigation gaps
remain readable, interactive props are actual selected representation, every
cyberpunk asset has its moving component or an owner-approved explicit exception.
Animation entries are consumed by the runtime, not dead manifest descriptions.

**Proposed checks when authorized:** first-stage loading, animation seam/speed,
actor occlusion and confirmed interactions; measure memory after a return cycle.
Owner checkpoint: map concepts and any material visual deviation before new art.

## Phase 3 — First playable floor loop

**Depends on:** Phases 1–2.
**Scope:** hub ↔ arrival ↔ market; Q01/Q02, Mara/Ivo and P01 only.

Implement actual lift transitions and safe return; free rest, local inventory/SC,
Q01's meeting/checkpoint/board conditions, free guarded Cell provision, load-preview
puzzle and both confirmed power allocations. Consume the Cell and apply memory,
reputation, visible lights and quest progress consistently. The basic shop must
show computed price/stock, cost failure and accepted purchase, not fake success.

Turn M01–M03/I01 into actual engine scripts/adapters from the authored scene data.
Don't regenerate voice or the entire actor roster. Save the outcome and show
Mara's correct later line after leaving/re-entering the stage. Add only art needed
for these actual interactions; keep the next-zone exit visibly unavailable with
an honest explanation until its content is installed.

**Acceptance:** complete Q01/Q02 on both routes, collect each reward once, spend
or fail a shop action honestly, heal for free and return to hub/reload without
forgetting the allocation or duplicating a Cell/reward. Changing playable actor
preserves save identity. Reputation never removes the main route.

**Proposed checks when authorized:** the two allocation paths, cancelled overload
preview, missing-cost purchase, duplicate confirm, hub return/reload. Limit scope
to changed controllers/entries. Owner checkpoint: first loop feel and first NPC
memory outcome before expansion.

## Phase 4 — Undergrid, Rainline and the personal stories

**Depends on:** first loop accepted; shared event/save contracts stable.
**Skills:** Maps/Assets + Actors/Portraits for EKO/Nyx + Monsters for normal-family
integration. Any new map needs concept approval before its dependent production.

**Batch B:** Undergrid/skybridge scenery, pump/vent effects, relay model/board,
archive-locker model, corridor geometry, EKO/Nyx requested presentation. Reuse
Rivet Hound, Prism Gunner and Arc Wisp sources; don't author duplicate creatures.
Connect their actual encounter/movement/hit contracts to stage coordinates and
small patrol pockets; a single-creature arena preview doesn't supply world AI.

Implement P02/P03, guaranteed Seal/Fragment/Invoice facts, Q03 privacy policy,
normal loot and fixed room supplies. Add Q08 invoice branches and Q09 decline,
accept/return/sell/reconcile arc with registry knowledge. Add the written branch
conditions/precedence and fallback replies, not a new live-LLM dependency.

**Acceptance:** both privacy branches retain the required header; normal enemies
and hazards apply real damage/contact feedback; main keys aren't random or
sellable; private choices remain private; Nyx's callback uses actual delivery or
sale receipt. Public locker hint stays accessible after betrayal. No one-time
relationship/reward can be farmed by replay or changing stages.

**Proposed checks when authorized:** P02 board solution/reset, P03 untimed/replay,
both archive/invoice branches, Q09 decline→accept, return path, sale→replacement
path, failed payments and reload before callback; one normal enemy of each type
with blocked/miss/hit/death/claim behavior. Re-review affected shared logic only.

## Phase 5 — Switchyard, Marshal and the Bastion

**Depends on:** Phase 4's reliable quest/loot and stage combat adapters.
**Skills:** Maps/Assets, Actors for Sena, Monsters for the existing Kurogane family.

**Batch C:** Switchyard map concept, gate/checkpoint/shortcut props and Sena;
adapt the existing boss arena entry/exit to the floor. Preserve Kurogane/Marshal
identities, stats and representation unless a distinct balance revision is agreed.
Use accepted events to issue the guaranteed Writ, consume the Seal/Writ once,
open the real gate and accept Q05. The Marshal has recovery armor; he must not
inherit Kurogane's destructible-funnel gate accidentally.

Connect boss victory to the floor's first/repeat loot receipt, protected Core,
emblem flag and Sena's report. Preview/rehearsal/reset controls must not clear
the story floor or grant loot. Defeat/reset/exit dispose pending hazards and
release temporary resources. Mark earlier partial preview evidence accurately;
don't reuse it as proof this newly installed full encounter works.

**Acceptance:** four independently reachable 360-HP funnels gate the 8,400-HP
body, recovery damage behaves correctly, natural 30% transition/reset/defeat
work, accepted hits produce real impacts and applied numbers, and a victory
receipt can grant the first bundle only once. Death doesn't lose key story
progress or strand the player behind a sealed gate.

**Proposed checks when authorized:** gate missing-one-key and accepted submission,
Marshal defeat/writ; Kurogane shield/funnels, natural phase, full defeat, reload
during grant and first/repeat claim; return/death/reset. This is the genuinely
affected encounter scope, not every unrelated boss/mobile viewport.

## Phase 6 — Governance, optional activities and complete ecosystem

**Depends on:** confirmed first-boss receipt and persistence; concepts/models
approved for remaining optional facilities.

Implement Q06 public controller and all three exclusive choices, SC 80, floor
clear and future-floor eligibility. Do not expose a travel action to an unbuilt
floor. Apply personal/faction effects and later dialogue/service callbacks from
the exact state table. Optional service supply and Q11 claims are expedition-
scoped, not granted whenever a conversation opens.

Complete Q07/Q10, P04 normal/assisted modes, crafting, room discoveries, basic
stock restock and four recipes. **Batch D:** optional Koi Lamp and Bastion Bench
as actual interactive 3D props with their appropriate animation, safe actor fit
and existing above-object rotate control. Complete the five NPC performance and
fallback branches; full dedicated voices remain outside the current commission.

**Acceptance:** all three endings advance; betrayal doesn't softlock anything;
each material has the stated source/use, guaranteed Prism caches permit one lamp,
craft/repair spends and outputs commit together, assisted play grants the same
Q10 reward, perks/stock reset only on a fresh expedition, prior story decisions
remain after that reset. Every planned source/claim ID points to actual content.

**Proposed checks when authorized:** all ending branches, discount/surcharge and
rounding boundaries, perk/contract caps, once-only fixed caches, failed/duplicate
craft actions, first lamp/bench contacts and rotation. No additional furniture
catalog sweep unless shared geometry actually changes.

## Phase 7 — Complete-loop review and release decision

**Depends on:** earlier deliverables installed, owner authorizes the relevant
runtime/automated verification. No phase here auto-authorizes tests.

Review prepare → enter → allocate → archive/puzzles → Marshal → Kurogane →
governance → return → reload, plus the meaningful NPC alternatives. Capture
specific evidence for accepted art, motion, interaction and persistence separately.
Use Firefox unless the owner explicitly selects another available browser.

Prioritize the changed-risk matrix:

| Risk | Observable acceptance |
| --- | --- |
| Wrong key/quest gate | Early-found facts reconcile; required talk still occurs; no circular prerequisite |
| NPC memory lost/omniscient | Same save remembers supported facts across maps/floors; unknown private choices aren't referenced |
| Replay/duplicate grants | Once receipts guard trust, SC, keys, boss loot and quest rewards; rejected actions change nothing |
| Reputation variation | Correct callbacks, thresholds and prices; all main goods, rest and endings remain available |
| Collision/depth/3D | Actual actor retains scale/outfit allowance; approach/seat/exit and promised rotations work; no opaque render rectangles |
| Unnatural/static cyberpunk art | Visible native loops, localized lighting, grounded bodies, clean seams, useful reduced motion |
| Memory/performance | Loading follows active stage; resource use settles after repeated entry/return; no per-window timers or source-master preload |
| Lifecycle/reset | Death/exit clears hazards; encounter reset grants nothing; new expedition refreshes only scoped claims |
| Save identity/migration | Actor change doesn't change history; new slot is independent; legacy/editor saves preserved |

Run focused affected tests/checks once permitted. Expand only for new failures
or changes to shared dependencies. Record genuine pending observations, not
inferred passes from source, screenshots or a ready button. Balance rates/HP
through observed play, then revise only affected content. A release/installation
beyond the agreed local scope requires its own actual authorization.

## Performance proposal and implementation risks

Use one active stage with bounded transition loading and shared immutable art.
Propose a **64 MiB decoded floor-art working budget** initially, including ground,
environment atlases and prop render targets; profile actual allocations before
acceptance. This is not a promise of total app memory: actor/boss renderer and
engine budgets must be measured separately and reported together. A 1536 × 1152
RGBA ground alone is about 6.75 MiB, independent of compressed PNG size.
Avoid full-map frames for lighting, a WebGL context per prop, unlimited transcript
memory and whole-world rebuilds. Pause/cull hidden loops; dispose departed stages.
No timing or FPS performance is claimed until measured on the real target.

| Largest dependency | Recommendation |
| --- | --- |
| Interactive 3D in a 2D canvas | Resolve first with one existing model and actual actor contact, before commissioning the full prop kit |
| Two different save/game domains | Define a floor-campaign boundary/migration; do not force unknown scene IDs or currency into the legacy validator |
| Multiple enemy stage behavior | Adapt existing accepted-event/encounter contracts deliberately; don't infer patrol/coexistence from preview buttons |
| Branching story expansion | Implement typed conditions and guarded effects first, then the authored arcs; no giant transcript or per-NPC custom engine |
| Existing boss difficulty | Keep provisional floor number; adjust progression/balance through a separate, visible revision if first-floor play warrants it |

## Completion states

Current package: **Phases 1–6 authored/installed; current runtime acceptance
pending.** The owner explicitly approved Switchyard F v1, both prop turnarounds
and Sena with Refined cel portraits. The existing Kurogane arena is adapted to
the local floor; no new unseen Bastion layout/art is claimed. Phase 6 includes its explicitly approved Batch D models and scripted activities.
Phase 7 remains planned. Test/browser/build/typecheck deferral remains in effect.

Record actual durations separately for art-service waits, owner reviews,
engineering, native export and authorized verification. Do not infer active
model time from overlapping elapsed spans, or visual/gameplay approval from a
source image, export, button or readiness result.
