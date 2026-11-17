# Floor design content guide

Use this to write a concrete floor design, scaling detail to the requested scope.
The lists below are content requirements, not runtime schemas or directions to
create every possible subsystem. Describe deferred mechanics honestly.

## Floor identity and tower role

Give the floor number, name, theme, short premise, intended player experience,
story position and entry/clear/unlock rules. Identify what distinguishes this
floor from neighboring themes. Retain the approved fine-textured 2D art direction
while adapting palette, architecture, sound/motion mood and landmarks to the
setting. Record references and what's proposed versus owner-approved.

Specify difficulty as proposed encounter/resource/puzzle expectations with the
player abilities/equipment they assume. Do not equate floor number with player
level or multiply every statistic linearly without a balancing rationale. Record
solo/co-op assumptions when they change puzzle or encounter feasibility; don't
silently add multiplayer. Keep future-floor connections brief unless requested.

## Shared lobby, floor arrival and camp

Describe the shared tower lobby and the particular floor's arrival/staging area
separately. Show the route from floor selection to preparation, entry, checkpoint,
return, death/recovery and re-entry. Define access conditions and how locked,
available and cleared floors are explained. Explain whether local camps are safe
rest points, supply sinks, crafting stations or persistent player constructions.
These are design choices, not automatic support for all camp systems.

List planned facilities and their purpose: floor-access point, shop/vendor,
quest board, story characters, planning/inventory, camp/rest and crafting when
appropriate. For each facility/popup, identify trigger, information, useful
actions, eligibility/cost, visible result/failure and close/back behavior. Keep
existing HUD/shadcn/font conventions in the eventual implementation brief.
Include meaningful NPC roles, remembered decisions, personal/faction reputation
and actual branching narrative scripts using
[NPC memory and scripts](npc-memory-and-scripts.md). Author the lines, choices,
immediate reactions and delayed callbacks, plus the state specification; don't
leave dialogue as a list of topics. Full voice or portrait production remains
separate unless requested. Separate shared services from floor-only stock,
quests and local characters, preserving an NPC's identity/history across stages.

## Stage graph, rooms and ecosystem

Give each stage/room a proposed ID and a concise table of role, visual identity,
entry/exit, objective, inhabitants/resources, hazards, encounters and return/checkpoint.
Use a compact diagram for lobby → arrival → main stages → boss → return/next floor,
including optional loops and secrets. Gates need prerequisites and a recovery path.
Choose stage/room counts for the brief instead of a fixed quota on all floors.

Describe habitats, factions, resource flows and environmental cause/effect. A
cyberpunk floor might relate power infrastructure, maintenance drones, market
salvage and projection districts; another floor should have its own relationships.
Distinguish authored encounter/resource placement from simulated populations or
time-driven events. Explain what persists, respawns, resets or changes after quests
and boss clears. Do not claim a living simulation merely from a lore paragraph.

For each room, specify what the player can discover or do: puzzle, resource,
enemy, NPC/story clue, chest, hazard, rest or optional reward. State repeatability,
visibility/hints and any tool/quest prerequisites. Include useful quiet space and
navigation readability rather than filling every room with every activity.

## Whole-floor asset brief

Group assets into shared kits and unique landmarks: terrain/transitions, buildings,
structural pieces, ambient scenery, usable props, resources/collectibles, quest
and puzzle pieces, loot containers/icons, NPCs, mobs/bosses and feedback/VFX.
For each family list proposed IDs, owning stages/actions, reused source or new
gap, representation, facings, state/motion needs and companion skill.

Interactive map props follow the selected textured 3D workflow with actual actor
contacts. Passive blockers and ambient scenery may use 2D animation. Assess
animation on every asset; cyberpunk assets need actual moving components such
as projection motion, localized light cycles, fans and reflection overlays.
Keep shared sources, native scale and transparency, and distinguish live 3D from
3D-source renders. Plan the inventory here; asset generation happens in production
after the required concept reviews.

## Quests, materials, puzzles and room loot

Quest table: ID/name, main/side/repeatable/story role, giver/start condition,
dependencies, stages, ordered objectives, exact progress/completion/turn-in rule,
required resources, rewards, failure/reset and repeat eligibility. Include a
readable purpose/story beat. Explain how objectives are counted and how progress
is shown. Avoid objectives that require an unavailable mechanic or ambiguous
instructions such as "help the district" without a completion condition.

Material/item table: ID, category, source and stage, proposed quantity/rarity,
uses in quests/recipes/shop/camp/upgrades, and sinks. Recipes need actual input
counts and output; shop plans need proposed price/currency, availability and
buy/sell rules when included. Critical consumables need a replenishment route.
Shared materials should retain their identity across floors. Clearly label new
prices and rates as proposals; do not write inventory or grants while planning.

Puzzle/minigame table: ID and location, premise, visible rules/hints, inputs and
states, success condition, failure/retry/reset, time/resource costs, accessibility
alternative where relevant, reward and dependencies. Explain one concrete
solution path and anti-softlock behavior. Avoid color-only clues or mandatory
timed input without an alternate when the intended audience needs one.

Room discovery/loot table: source/container ID, stage/room, discovery/open trigger,
prerequisites, contents or drop table, first/repeat behavior and completion feedback.
Chests, ambient finds, puzzle rewards, quest rewards, gathering and enemy drops
must have distinct source/claim rules so returning to a room doesn't duplicate
a one-time reward.

## Mobs, boss and drops

Mob concepts: ID/name, silhouette/theme, ecosystem role/faction, habitat/stages,
combat or noncombat behavior, attack/telegraph, weakness/counter, proposed HP and
damage units, normal/elite variants if useful, spawn/recovery and drop-table link.
Don't invent many near-identical species solely to make a list look complete.

Boss concept: ID/name, biography, floor story connection, arena/entry gate, scale
relative to the actual actor, anchor/representation, clear objective, weaknesses,
attack patterns, telegraphs/area effects, phases and reset/death behavior. Express
HP in unambiguous units: bars × HP per bar = total HP when bars are used. Avoid
an unexplained `10x`. Include animation/contact feedback and required portraits
or effects as asset gaps, not already-produced files. Leave full production to
the monster workflow after approval.

For every mob/boss drop table, specify source/eligibility, roll model (independent
chance versus weighted exclusive selection), item ID, quantity range, proposed
chance/weight, guaranteed entries and first/repeat clear handling. Exclusive
probabilities must total 100%; independent rolls need not. Distinguish rate,
weight and rarity labels. Identify quest-critical guarantees/alternatives and
special boss rewards, progression items or equipment. Explain reset/retry and
claim semantics; don't promise authoritative multiplayer rewards from local state.

## Written-design review

Read the proposed path from preparation to clear and return. Resolve circular
quest/key/loot gates, missing resource uses, unavailable actions and stranded
death/re-entry paths. Trace every quest/drop reference to its defined item/source,
and every interactive/animated requirement to an asset/controller phase.
NPC memory sources, decision flags and reputation changes must agree with their
written branches, callback conditions and persistence/once guards. Identify
what already exists versus new work and what remains uncertain. Balanced rates,
smooth motion and fun gameplay remain hypotheses until authorized playtesting.
