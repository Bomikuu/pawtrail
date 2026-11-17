---
name: pawtrail-floors
description: Plan themed PawTrail floors with connected stages, ecosystem, quests, puzzles, resources, mobs, bosses and loot, plus scripted NPCs who remember choices and reputation. Produce readable designs, NPC scripts and phased implementation plans before production.
---

# PawTrail Floors

Read the current workspace's `AGENTS.md`. This is the **concept and planning
layer** above map, asset, character and encounter production. A request to create
or use this planning skill does not itself authorize asset generation, models,
runtime edits, seed data or game installation. Preserve the current restrictions
on agents, automated checks/tests/builds and browser verification.

## Name the hierarchy clearly

The proposed game has **50 themed floors**. Use **floor** for one numbered world
region, **stage/zone** for a connected playable map within it, and **room** for
a smaller encounter, puzzle or discovery space. Avoid calling a stage another
floor. Each numbered floor can have several maps and its own ecosystem.

Distinguish the **shared tower lobby** used to access unlocked floors, shop,
prepare, camp and follow overarching stories from a floor's **arrival/staging
area** or local camp. Unless the owner says otherwise, propose a shared central
lobby plus only the local facilities each floor needs; mark that as a planning
assumption, not a settled implementation. Don't duplicate a complete shop/hub
system on all 50 floors by default.

Accept a description, references or both. Identify the requested floor(s), theme,
purpose in the wider progression, target player experience and existing design
decisions. Ask only about consequential missing constraints; make routine creative
choices as clearly labeled proposals. Plan the requested floor in detail, with
its connections to the larger tower. A 50-floor vision is not an instruction to
write 50 full designs or start building them all.

## Produce the readable floor design

Use [the floor design guide](references/floor-design-guide.md) for the actual
content contract. Write the design in this reading order:

1. **Theme and identity:** premise, mood, art direction, floor-specific gameplay
   hook, inhabitants/factions, environmental rules and story arc.
2. **Lobby and preparation:** floor access/unlocks, shops, camp, planning, quests,
   NPC/story interactions and the panels/popups needed for those activities.
   Include each NPC's memory, reputation response and written dialogue branches.
3. **Stages and ecosystem:** connected zone/room graph, main route and optional
   branches, habitats, resource relationships, hazards, checkpoints and returns.
4. **Whole-floor asset brief:** reusable terrain/building/prop families, landmarks,
   interactive 3D props, animation needs and existing/new production gaps.
5. **Activities and economy:** concrete quest list, materials, recipes/uses,
   puzzles/minigames, room discoveries, loot sources and resource sinks.
6. **Mobs and boss concepts:** roles, habitat/behavior, story, weaknesses, explicit
   HP proposals, attacks/telegraphs/phases and distinct mob/boss drop tables.
7. **Progression and implementation:** first/repeat clear behavior, unlocks,
   persistence/reset rules, risks, phased work and owner review points.

This is **asset planning**, not permission to produce every asset. Design enemy,
boss, quest and puzzle needs before finalizing the asset inventory so their
required rooms, animations, props and effects are included. Use names, readable
tables and a small route diagram where helpful; don't deliver only machine JSON.
Write actual proposed content for the chosen floor, not a list of empty headings.

Use stable proposed IDs linking stage, quest, item, material, puzzle, NPC, mob,
boss, drop table and asset records. Mark new IDs as proposed; don't imply they
exist in a runtime registry. Preserve real IDs and accepted lore when revising.
Clearly separate owner decisions, proposals, existing capabilities and production
gaps. Proposed rates, HP and prices are balance hypotheses, not tested facts.

## Write NPC memory, reputation and scripts

Read [NPC memory and scripts](references/npc-memory-and-scripts.md). NPCs must
remember relevant player decisions and respond consistently on later visits,
including across stages/floors when their knowledge and story justify it. Define
personal memory separately from faction/public reputation; don't make every NPC
omniscient or reduce every relationship to one global good/evil score.

Author the **actual narrative scripts** in the planning package: dialogue lines,
player choices, branch conditions, state effects, immediate reactions, delayed
callbacks, repeat/fallback lines and portrait/emotion/action cues. A statement
such as "the NPC remembers your choices" or a list of conversation topics does
not satisfy this requirement. Link decisions and consequences to the floor's
quests, services, shops, alliances, rewards and story progression as appropriate.

Also specify the implementation contract: stable NPC/decision/memory/event IDs,
knowledge rules, reputation scopes/tiers, state transitions, one-time guards and
save/re-entry/reset behavior. Use compact structured state and authored branches
by default; remembering a decision doesn't require an external AI service or
replaying entire conversation transcripts. Narrative scripts and a state spec
are planning artifacts, not an already-installed dialogue engine. Later authorized
implementation must connect the scripts and durable state to real game outcomes.

## Keep the systems connected

A floor should have a readable loop: prepare → enter/explore → discover resources
and objectives → solve/fight/interact → obtain the real result → return/advance.
Link each quest's exact completion condition to a real planned action; link its
requirements and rewards to defined items/materials. Place every resource/drop
source in a stage or encounter, and give materials a use or deliberate trade sink.
The floor's ecology should explain why its inhabitants, hazards and resources
coexist; don't promise a full autonomous simulation unless it is requested.

Keep critical-path quest items obtainable without unlimited random farming.
Document guaranteed drops, alternatives or pity rules where needed. State drop
roll semantics, quantities, eligibility, first/repeat clear and claim rules.
Check by reading that quest gates, puzzle prerequisites, boss access and unlocks
do not form circular dependencies or strand the player after failure/re-entry.

Plan visible outcomes for interaction, quest progress, puzzle changes, loot,
camp/shop actions and combat. Confirmed fictional hits need animated contact
sprites plus actual damage/status feedback; a number or sound alone is insufficient.
Keep local save/prototype rewards separate from authoritative platform data.
Do not invent Kibble grants, purchases, backend records or verified rewards.

## Lay out implementation phases

Read [implementation phases](references/implementation-phases.md). Produce a
dependency-ordered roadmap scoped to this floor and any genuinely missing shared
systems. Each phase names its goal, concrete deliverables, prerequisites, relevant
skill, acceptance criteria, proposed verification and owner approval checkpoint.
Distinguish supported mechanics from new engineering; a design table doesn't
implement a quest tracker, puzzle controller, loot roll or floor portal.

Keep a first playable loop early, then expand in coherent stage/asset batches.
Plan streaming/lazy loading per floor/stage and reuse shared systems; don't preload
50 ecosystems or rebuild editors for every floor. Include animation, actor fit,
collision, transitions, state feedback and save/re-entry in the appropriate phases.
List checks to run when authorized; do not run them during this planning request
or omit them to make a phase appear faster. Avoid invented time estimates.

## Hand off to the production skills after review

Planning itself does **not** invoke the following production workflows. It gives
them coherent briefs and dependencies for a later authorized implementation:

- [PawTrail Maps](../pawtrail-maps/SKILL.md): each stage/lobby map's visual concept,
  approved editable layout, routes, transitions and installation scope.
- [PawTrail Assets](../pawtrail-assets/SKILL.md): the shared floor asset families,
  native animation packages and textured 3D player-interactive props. Assess motion
  for every asset; cyberpunk holograms, building lights and active props animate.
- **PawTrail Furniture:** interactive prop actions, actor fit, states, rotations,
  approaches and exits; carry the map's chosen 3D workflow.
- **PawTrail Actors/Cats, Illustrations, Portraits and HUD:** requested story NPCs,
  their approved identities, script performance cues and actual dialogue/quest
  panels. Appearance/voice production does not implement memory or reputation;
  include that state/dialogue integration as explicit engineering work.
- [PawTrail Monsters](../pawtrail-monsters/SKILL.md): the approved mob/boss briefs,
  explicit HP, encounter patterns, weaknesses, feedback, drops and rehearsal.
- **PawTrail Weapons:** only when the floor actually introduces usable equipment
  or movesets. Loot does not automatically require new weapons.

Resolve the named companion skills from the available catalog. Do not copy their
entire procedures into floor plans or imply all their runtime contracts exist.
Preserve the chosen actor/monster representation; the interactive-prop 3D rule
is not a blanket conversion of every creature or entire stage to live 3D.

## Review and deliver

Unless the owner specifies a destination, save a requested floor plan under
`docs/game-design/floors/fNN-theme/` with `floor-design.md` and
`implementation-phases.md`, plus `npc-scripts.md` and `npc-state-spec.md` for the
planned NPCs. Keep references/approval versions alongside the plan
when needed. A tower overview or shared-lobby plan belongs in the parent design
directory and should be reused by later floors. Creating this skill alone does
not populate those output directories or create a first floor.

Review the written plan for connected routes, explicit outcomes, obtainable
requirements, coherent loot/economy, missing asset/animation needs and realistic
implementation dependencies. Trace NPC choices through memory/reputation effects
to later dialogue and game consequences, including repeat/reload behavior.
This is a document review, not runtime verification.
Flag significant unresolved decisions with a recommendation rather than hiding
them behind vague promises. Link the readable documents and summarize the proposed
floor, largest gaps, first implementation phase and decisions needing review.

End at **awaiting owner review**. No response is not approval. Plan approval
records the agreed design; begin production only when the owner also asks to
implement the approved scope. Each new map still needs its generated concept
and explicit approval under PawTrail Maps. Approval of a package that explicitly
includes identified map concepts can satisfy that gate without re-asking; an
approved text plan cannot approve images that do not yet exist.
