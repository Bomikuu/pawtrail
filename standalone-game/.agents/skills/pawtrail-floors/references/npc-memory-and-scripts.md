# NPC memory, reputation and authored scripts

Use this for every planned story/service NPC in a floor design. Produce concrete
content for the requested floor; don't merely copy these instructions as its NPC
design. Keep full NPC/actor art production separate from writing the scripts.

## NPC identities and what they know

Define a stable NPC ID, name, role, personality/values, faction, home stages,
story purpose and services. Identify what this NPC values about the player's
decisions and how that can differ from another NPC's reaction. Existing identities
remain stable across maps; placing the same NPC elsewhere doesn't create a new
relationship record.

For each relevant decision/event, state what the NPC can know and how: personally
witnessed, told by the player/another NPC, quest evidence or a defined public
event. Separate actual world facts from an NPC's belief when deception matters.
Don't give an uninformed merchant precise knowledge of a private conversation.
Faction reputation can influence a first meeting without pretending the NPC
personally remembers a player they never met.

## Memory and reputation contract

Design compact persistent records for decisions, promises, fulfilled/broken
commitments, help/refusal, betrayal, discovered truths and other authored story
events. Define event/decision ID, player/save identity, subject NPC/faction,
scope, value, source/knowledge rule, accepted outcome and persistence/reset rule.
Keep mutually exclusive decisions exclusive; preserve important history when a
later reconciliation changes the relationship.

Distinguish:

- **Personal relationship:** trust, affinity, respect or fear only as the NPC's
  design needs them. Record ranges, starting values, thresholds, clamping and
  actual proposed changes; don't add unused dimensions to every NPC.
- **Faction reputation:** standing with a named group and the events it recognizes.
- **Floor/tower public reputation:** shared notoriety or achievements only where
  the story defines how that information spreads.
- **Story flags:** specific facts/decisions that a numeric score cannot replace.
  High reputation should not erase a remembered betrayal without its own arc.

Map tiers/flags to explicit reactions and consequences: greeting, dialogue,
quest eligibility, disclosure, ally assistance, stock/price changes, camp access
or hostility when included. Tie price/reward effects to defined values and rules,
not vague "better discounts" promises. Mark all new values as balance proposals.
Document forgiveness/recovery and whether reputation decays; don't silently
reset it when leaving a floor. If a consequence blocks a main route, provide a
deliberate alternative or make that irreversible design decision explicit for
owner review instead of introducing an accidental softlock.

## Write the actual dialogue and choice branches

`npc-scripts.md` contains readable, authored scenes with stable scene/node/choice
IDs, not only biographies, topics or a future instruction to write dialogue.
For each relevant NPC, cover introduction, quest/service interaction, meaningful
decision branches, immediate response, a later memory callback, repeat visits
and fallback/exit. Scale optional ambient barks to the NPC's role.

Every scene/node must specify its trigger, conditions and precedence, speaker,
actual lines, portrait/expression/action cues, and the available **written player
choices**. For each choice, give:

1. Availability, costs/prerequisites if any, and clear player-facing wording.
2. The next node/response and accepted story or gameplay outcome.
3. Exact decision/memory updates and proposed reputation changes with targets.
4. Linked quest/shop/world effects, their application guard and failure behavior.
5. Later callback scene(s), the conditions under which they become relevant,
   and repeat/re-entry lines after that callback has been seen.

Write materially different responses to the supported decisions, rather than
several choices that all produce the same unacknowledged outcome. Branches may
rejoin deliberately after their distinct reactions; preserve the memory for
later callbacks. Define priority when quest progress, personal history and
reputation all qualify for a greeting, plus a valid fallback when no special
branch matches. Preserve personality and story knowledge in every variant.

Tie speech and portrait cues to the chosen performance, including mouth/blink
behavior supplied by the actor/portrait skills. Voice lines are optional unless
requested; a memory feature doesn't authorize generating voice/audio assets.
Plan visible in-world acknowledgement or a clear dialogue/service state change
for accepted outcomes. Numeric reputation feedback, if shown, must reflect the
actual applied change; delayed story consequences need not spoil every future
branch in the choice UI.

## State specification and later runtime scripts

`npc-state-spec.md` gives the proposed variables/events, types/defaults/scopes,
knowledge propagation, relationship tiers, branch precedence, transition table,
once/repeat guards and persistence lifecycle. Link its IDs to the written scenes,
quests, materials/rewards and services. Distinguish proposed state from keys that
already exist in the game. Reuse shared flags instead of two independently named
versions of the same decision.

When implementation is later requested, author the corresponding machine-readable
dialogue/condition/effect scripts or code adapters for the actual dialogue engine.
Use that engine's real schema; a planning table or unused JSON file is not an
executing script. Treat missing dialogue/memory/reputation support as engineering
work in the phase plan. Don't introduce arbitrary eval or an external AI runtime
as a requirement for ordinary authored branching dialogue.

Apply state/reputation once on the accepted event, not on hover, conversation
open, previewing a branch or replaying old dialogue. A failed purchase, cancelled
quest turn-in or rejected action cannot award memory, currency or reputation as
if it succeeded. For deliberate social choices without other costs, define the
accepted choice itself as the event. Repeated greetings/compliments, quest retries
and reloads must not farm one-time relationship rewards. Define intended caps or
cooldowns for repeatable social actions. Keep reward/quest updates consistent
with the decision and their existing authority rules.

Persist relevant NPC memory, reputation, seen/once flags and quest consequences
per player/save through map exits, revisits, reload and cross-floor meetings.
Define new-game/reset and content-version migration behavior; don't mix players'
histories or delete memory just because an NPC unloaded. Plan bounded records,
not unlimited transcript storage across 50 floors. If co-op is requested, choose
whose choice and reputation govern a shared scene; don't assume shared history.

## Review paths to include in the implementation plan

During written review, trace contrasting player decisions through immediate
response and delayed callback. Include later authorized checks for:

- Returning to the NPC after changing stages, reloading and meeting across floors.
- Personal knowledge versus faction/public reputation at a first meeting.
- Threshold boundaries, conflicting eligible branches and the fallback greeting.
- Replaying dialogue/retrying a quest without duplicating reputation or rewards.
- Cancelled/failed actions, contradictory choices and forgiveness/recovery paths.
- A new save/player receiving their own initial history and unaffected existing
  saves retaining theirs.

These are planned checks, not evidence that a memory system already works. Keep
unrequested tests and browser verification pending under the workspace rules.
