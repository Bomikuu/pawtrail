# From floor design to implementation phases

Write a roadmap for the approved design, not a generic development checklist.
Scale or combine the phases below to its real dependencies; don't implement all
50 floors or duplicate shared lobby/quest/loot systems for each floor.

Each phase should name:

- Goal and concrete playable/authoring deliverables, with stage/quest/asset IDs.
- Prerequisites and existing implementation to reuse; new engineering gaps.
- Responsible production skill or code area, and bounded asset/encounter batches.
- Acceptance conditions a reviewer can observe; separate authored, installed,
  runtime-verified and owner-approved states.
- Focused visual/functional checks to perform **when authorized**, including
  affected dependencies, and any pending permissions or concept approval.
- The decision or completion evidence that permits the next dependent phase.

## Suggested dependency order

### 1. Agree on the floor and map concepts

Review the readable floor design, content tables, stage graph and major new
mechanics. Resolve important uncertainties. During later authorized production,
PawTrail Maps generates the lobby/stage concept images for explicit approval
before dependent assets/layouts. Text approval does not approve unseen images.
Reuse an already-approved exact concept and record its version.

### 2. Establish the shared lobby and first playable loop

Reuse existing lobby/navigation, actor and save/controller contracts. Scope only
the shared systems needed for entry, preparation, one representative stage and
return. If those systems don't exist, include their engineering honestly.
Block out route, entry/exit, collision and recovery first. This validates the
floor's scale and transition needs before producing the whole content inventory.
An initial blockout may reuse approved placeholders with the gap explicit.

### 3. Produce the reusable floor asset kit

PawTrail Assets consumes the approved concepts and floor inventory. Batch terrain,
scenery, animated environment components and interactive textured 3D props by
shared dependencies. Reuse approved sources; produce only missing directions,
states or motion. Use furniture/actor specialists for requested contacts/NPCs.
Record animation budgets, native metadata, model/runtime representation and
required renderer adapters. A static PNG export is not completed animation.

### 4. Build stages, hazards and interactive activities

Expand the connected maps/rooms with real transition and depth/collision rules.
Implement the planned camp/facility interactions, puzzles/minigames, gathering,
containers and environmental changes in dependency order. Include hints, safe
retry/reset and actual visible state outcomes. Do not claim a painted door,
button or terminal works until its controller/transition is connected.

### 5. Connect story, quests, materials and economy

Install the defined NPC/story conditions, objectives/progress, item/material and
recipe/shop records into the chosen real game systems. Reuse shared quest and
inventory infrastructure. Implement the authored dialogue/decision scripts, NPC
knowledge and durable personal/faction reputation from `npc-scripts.md` and
`npc-state-spec.md`. Connect real accepted outcomes to one-time state changes,
immediate reactions, delayed callbacks and service/quest consequences. Add any
missing dialogue/memory infrastructure as explicit work, not a claimed existing
feature. Define reward/claim, currency/spending, failure and
persistence boundaries. Keep local prototype progression explicitly local and
avoid claiming platform/database authority. Refer to source IDs from the design
instead of creating parallel inconsistent item lists.

### 6. Produce mobs, boss and encounter rewards

Use the monster skill for approved concepts, required creature animation,
telegraphs, attack/phase/reset behavior, weak points and confirmed hit feedback.
Connect actual drop rolls and clear/quest events to the intended reward system.
Mob/boss damage, guaranteed quest drops, first/repeat clear and retry/reset
handling are acceptance criteria. A biography, model or art preview alone is
not a completed encounter. Reorder a representative mob earlier if other phases
depend on its combat/quest event contract.

### 7. Integrate floor progression and persistence

Connect lobby selection, stage checkpoints, camp/world state, quest/puzzle
progress, inventory, boss clears, returns and next-floor unlocks. State exact
persist/reset rules across death, reload, re-entry and repeated clears. Address
NPC memory/reputation and seen/decision flags across lobby, stages, floors and
reloads, including new-save isolation and any content migrations. Address
missing prerequisites and one-time/repeat claims. Keep loading per active
floor/stage, dispose departed resources and preserve existing user saves.

### 8. Review the complete floor and refine

Plan a focused full loop from lobby preparation through exploration, quests,
puzzle/resource interactions, encounter/drop, boss clear, return and reload.
Review actual animation loops, actor fit, feedback, route/occlusion, reduced
motion, resource/memory budgets and the relevant failure/retry paths.
Include contrasting NPC decisions and later callbacks, knowledge boundaries,
reputation thresholds, fallback branch priority and replay/reload guards.
Run tests, builds or browser checks only when authorized by the current workspace/user;
list unperformed checks as pending, never passed. Findings may require another
scoped content/balance/art iteration, not a full regeneration of approved assets.

## Review checkpoints and scope

Put approval checkpoints before expensive dependent production. Plan approval
does not automatically start implementation. Preserve authorization already
given for the requested scope, and don't repeatedly ask to approve unchanged
artifacts. Follow the explicit map-concept gate and companion art-review rules;
silence never substitutes for floor-plan or map-concept approval.

Use actual timestamps when production starts. Don't invent phase durations,
service availability or successful verification while planning. Record risks
with a concrete next decision/probe and affected phases. A deferred optional
minigame should have an honest dependency/cut, not disappear from the plan or
be marked complete to shorten the timeline.
