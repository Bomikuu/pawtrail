# Neon Heights — NPC memory and reputation specification

**Status:** approved state/logic design. Phase 3 implements the Q01/Q02 first loop,
saved allocation memory, personal/faction standing, shop and stage travel. See
[Phase 3 delivery](phase-3-delivery.md); runtime verification remains deferred.
The later archive/courier/governance story integration is still pending.
Read [floor design](floor-design.md), [authored scenes](npc-scripts.md) and
[implementation phases](implementation-phases.md). The IDs below are proposed.
The existing game has simple relationship/quest foundations, not this full system.

## 1. Ownership and persistence

Propose a versioned local floor-campaign bundle per explicit player/save slot.
Its story, inventory, SC, reputation, claims and pending accepted rewards form
one consistent snapshot. Do not casually put negative reputation into an old
save field with different validation, or copy the prototype SC into Kibble.
Preserve `pawtrail:neighborhood:v2` and stage-editor drafts through any migration.
Implementation must identify the real save integration boundary before choosing
a new key/version; no new store is created by this document.

Identity is a stable save-slot ID, not actor appearance/name or the current map.
Changing Amber to another playable actor doesn't erase relationships. New saves
start independently. Relevant records survive hub travel, stage unload, death,
re-entry and reload. NPCs do not need live AI or conversation transcripts: store
typed facts/decisions, a bounded set of accepted story event IDs and seen nodes.

## 2. Proposed state dictionary

| Key / family | Type and default | Meaning and lifecycle |
| --- | --- | --- |
| `f01.met.*` | Set of the five NPC IDs, initially empty | First accepted conversation per NPC; lifetime of save |
| `f01.decision.allocation` | `unset / clinic / transit`, unset | Exclusive accepted P01 route; Cell consumed with decision |
| `f01.decision.archive` | `unset / redacted / erased`, unset | Exclusive EKO privacy policy; Q03 closure |
| `f01.decision.invoice` | `unset / protected / published`, unset | Exclusive Q08 outcome; protection isn't automatically public |
| `f01.decision.promise` | `unseen / declined / carrying / returned / sold / reconciled`, unseen | Q09 present status; history flags below retain earlier actions |
| `f01.decision.governance` | `unset / community / warden / exchange`, unset | Exclusive public ending; Core consumed with accepted decision |
| `f01.fact.checkpoint-active`, `route-inspected`, `cell-issued` | Booleans, false | Q01 facts and once-only Cell provision |
| `f01.fact.archive-open`, `fragment-recovered`, `invoice-found`, `header-retained` | Booleans, false | P03 facts; private citizen-route content is separate from the non-private header |
| `f01.fact.private-routes-available` | Boolean, false until P03, then true while sealed policy is pending | Becomes false under either final policy; raw identifying paths are not kept after redaction/erasure |
| `f01.fact.redacted-archive-available` | Boolean, false | True only after the redacted policy; represents the sanitized civic copy, not raw private paths |
| `f01.fact.p02-solved`, `gate-authenticated`, `marshal-first-clear`, `boss-first-clear`, `floor-cleared` | Booleans, false | Persistent progression facts with accepted-event receipts |
| `f01.history.promise-declined`, `promise-sold` | Booleans, false | Preserve the earlier decline/betrayal through later acceptance/reconciliation |
| `f01.knowledge.*` | Set of defined fact IDs per NPC/faction | Only facts learned through the channels in section 3 |
| `f01.relationship.*` | Signed integer, default 0, clamp -100…100 | One personal trust score per planned NPC |
| `f01.faction.residents / exchange / couriers / wardens` | Signed integer, default 0, clamp -100…100 | Named groups, not a global morality score |
| `f01.quest.q01…q11` | Quest progress + explicit resolution and claim receipt | Reuse available/active/completed/claimed where possible; branch-aware outcomes require an adapter |
| `f01.seen.*` | Set of scene/node IDs | Greeting/callback once guards, no rewards from viewing text |
| `f01.effects.*` | Set of applied effect-bundle IDs | Permanent idempotency guards for table in section 5 |
| `f01.claim.*` | Claim receipt keyed by scope, source and instance | Profile caches/first-clear, expedition nodes, per-attempt combat receipts |
| `f01.expedition.id` | Opaque ID, created only at confirmed fresh expedition | Scopes node replenishment, shop/perk/contract claims and enemy instances |

Memory/knowledge is bounded by authored decisions, not appended once per render
frame or per greeting. Compress completed content into stable records without
forgetting flags used by future scripts. Unknown content-version keys need a
forward-compatible migration policy rather than deleting the entire save.

## 3. Knowledge: who knows which outcome

| Fact | Source and propagation | Who can use a callback |
| --- | --- | --- |
| Clinic/transit allocation | P01 controller publishes a district power notice | All five may know the public result; Mara/Nyx specifically evaluate it |
| Private archive policy | Player and EKO witness its accepted private conversation | EKO only; Mara's Residents standing reflects EKO's anonymized civic service endorsement, not detailed knowledge of erased routes |
| Protected invoice | Ivo's private conversation | Ivo; Exchange learns only his service endorsement, not the ledger's content; no Residents penalty for an unknown private choice |
| Published invoice | Player confirms release to the public notice system | All may know publication, with character-appropriate reactions |
| Keepsake accepted/declined | Nyx and player | Nyx only; no public trust gain for merely accepting |
| Keepsake delivered | Mara accepts the item and issues its courier delivery receipt | Mara and Nyx; Couriers receive delivery success, not unrelated private history |
| Keepsake sold | Ivo accepts its clearly labeled registry sale and issues a notice | Ivo and Nyx/Couriers through the explicit registered sale; Mara/EKO/Sena don't gain the fact automatically |
| Replacement delivered | Nyx accepts the replacement and records reconciliation | Nyx and Couriers; Ivo only knows the replacement sale he performed |
| Relay/writ authenticated | Sena validates the signed records | Sena and Wardens; doesn't reveal the private archive decision |
| Boss victory | Accepted arena receipt, then player's report to Sena | Sena/Wardens after report; public victory notice after the same report |
| Governance | Confirmed R02 public controller event | All five; later-floor NPCs may read public floor governance without receiving private memories |

Knowledge channels here are fictional game events, not real messages/tools or
external communications. The implementation applies them only on the accepted
event. Faction standing is not proof an individual saw its private cause.

## 4. Reputation tiers and concrete consequences

| Personal trust | Presentation |
| --- | --- |
| -100…-10 | Distrustful: guarded line; optional personal tips withheld |
| -9…-1 | Wary: short, restrained greeting |
| 0…9 | Neutral: ordinary professional greeting |
| 10…24 | Friendly: warmer line; Ivo's basic buying discount |
| 25…100 | Trusted: personal acknowledgement; future optional story branch eligibility |

Faction tiers: -100…-15 distrusted, -14…-1 wary, 0…9 neutral, 10…24 respected,
25…100 allied. These tiers are proposed. No score decays in this floor design.
No NPC dialogue or service repeatedly awards trust for compliments or greetings.

Ivo uses actual personal trust for prices: <= -10 adds 10%; >= 10 subtracts 10%.
Exchange governance subtracts a further 10%; total discount caps at 20% and costs
round upward. Fixed story/recovery transactions and sell prices are excluded.
Hostility does not deny Emergency Cell, main keys, camp recovery or advancement.

Nyx's special locator hint is available before betrayal and after reconciliation;
after a registered sale without reconciliation she refuses the personal tip.
The public locker code remains on the stage plaque, so nothing is softlocked.
Generic trusted status never erases the specific betrayal callback/history.

## 5. Accepted effect bundles

All numerical changes are proposed balance values. Apply each bundle once per
save unless its row explicitly uses expedition scope. Journal/reputation feedback
must use the actual clamped delta, not the requested delta if already at a limit.
Unlisted NPC/faction changes are zero. A score change doesn't grant its recipient
all private knowledge; follow section 3 independently.

| Bundle ID | Accepted trigger / guard | Persistent changes and consequence |
| --- | --- | --- |
| `F01.START` | First confirmed floor entry; no starter receipt | SC +30; starter receipt recorded, no repeat for another actor |
| `F01.CELL` | Ivo service; Q02 active, not cell-issued | Cell +1 and cell-issued true; free, no reputation; missing delivered Cell uses recovery receipt, not another grant |
| `F01.ALLOC.C` | P01 confirm; Cell present, allocation unset | Cell -1; allocation clinic; Mara +8, Residents +6; public power notice; Q02 routing fact |
| `F01.ALLOC.T` | Same guard | Cell -1; allocation transit; Mara -3, Residents -2, Nyx +4, Couriers +6; same required gate result |
| `F01.AWN` | Q07 report/claim after accepted paid repair | SC +30; Mara +3, Residents +4; Q07 claimed; repair inputs were consumed by the single repair action |
| `F01.ARCH.R` | EKO confirms redaction; Q03 turn-in ready, policy unset | Fragment consumed; archive redacted, raw private routes unavailable, sanitized copy available, header retained; EKO +8, Residents +2; SC +45 and Q03 claimed |
| `F01.ARCH.E` | EKO confirms erasure; same guard | Fragment consumed; private routes and sanitized copy unavailable, header retained; archive erased; EKO -4, Residents +6; SC +45 and Q03 claimed |
| `F01.INVOICE.P` | Ivo private-protection choice; Q08 ready, unset | Invoice protected; Ivo +10, Exchange +6; SC +40, Q08 claimed; Ivo submits limited endorsement |
| `F01.INVOICE.B` | Publish confirmation; Q08 ready, unset | Invoice published; Ivo -10, Exchange -6, Residents +8; SC +40, Q08 claimed; public notice |
| `F01.PROMISE.D` | Nyx decline; unseen offer | Promise declined; history.declined true; no score/item/reward; explicit later acceptance remains available |
| `F01.PROMISE.A` | Accept; promise unseen or declined, no prior carrying/return/sale | Promise carrying; Keepsake +1; Q09 active; no immediate trust reward |
| `F01.PROMISE.R` | Mara confirms handover; carrying + Keepsake present | Keepsake -1; promise returned; Nyx +10, Couriers +6, Mara +2; SC +30, Q09 claimed returned; issue courier receipt |
| `F01.PROMISE.S` | Ivo sale confirmation; carrying + Keepsake present | Keepsake -1; SC +40; promise sold/history.sold true; Nyx -20, Couriers -8; Q09 claimed with sold resolution and zero quest reward; courier notice |
| `F01.REPLACEMENT` | Ivo sale; promise sold, no delivered replacement, selected payment available | SC -40 or Wire -3, replacement +1; one acquisition receipt, no reputation/reward |
| `F01.PROMISE.F` | Nyx receives replacement; sold + replacement present | Replacement -1; promise reconciled; Nyx +8, Couriers +4; preserve history.sold; personal hint restored, no SC or second Q09 reward |
| `F01.KOI` | Q10 turn-in after P04 success | SC +20; EKO +3; Koi Lamp recipe unlock; Q10 claimed once |
| `F01.GATE` | Sena authenticates keys; Q03 claimed, P02 solved, Relay Seal + Writ present | Consume Seal/Writ, gate-authenticated true; Sena +5, Wardens +4; SC +60, Q04 claimed; shortcut and boss entry open |
| `F01.BOSS.REPORT` | Sena receives accepted first boss receipt; Q04 claimed | Sena +4, Wardens +4; Q05 claimed; public victory record; no duplicate boss currency/materials |
| `F01.GOV.C` | R02 confirms Community; Q05 claimed, Core present, governance unset | Core -1; governance community; Mara +6, Sena -3, Ivo -2; Residents +12, Wardens -4, Exchange -4; SC +80, Q06/floor clear |
| `F01.GOV.W` | Same guard, Warden choice | Core -1; governance warden; Mara -2, Sena +8, Ivo -2; Residents -4, Wardens +12, Exchange -4; SC +80, Q06/floor clear |
| `F01.GOV.X` | Same guard, Exchange choice | Core -1; governance exchange; Mara -3, Sena -3, Ivo +8; Residents -4, Wardens -4, Exchange +12; SC +80, Q06/floor clear |

Q01 grants SC 15 once when its three conditions are complete and Mara accepts
the report. Q02 grants SC 35 once when its routing fact is complete and Mara
accepts the report. Those claims do not repeat their allocation trust effects.
Q05 has no separate currency reward. Room/encounter loot uses the floor design's
tables, not dialogue bundles. The floor-clear event records next-floor eligibility
without inventing a loaded destination for an unbuilt floor.

Governance perk claims use `(save, expedition, selected-perk)` once: Med Patch 1
at Mara for Community, Insulator 1 at Sena for Warden; Exchange discount is a
read-only price rule. Q11 consumes Scrap 2 + Coolant 1 and grants SC 12 once per
expedition. Neither perk claims nor Q11 grant reputation.

## 6. Quest, choice and dialogue rules

The script node chooses what is available; the controller validates it again
when selected. Receipt application, inventory, currency, quest resolution,
memory, knowledge and reputation commit as one accepted transition. If a needed
item/payment is missing, show the failure line/state and change none of those
fields. Don't apply effects when selecting a target, showing a preview or opening
a conversation. No stale/double-click choice may apply a bundle twice.

Before P01 allocation, archive erasure/redaction, invoice publication/protection,
Keepsake sale or governance commitment, show the specific decision and a confirm/
cancel step. Cancel returns to the decision without setting its flag. After an
accepted commit, closing the panel doesn't reverse the decision. Resume an
unseen accepted-response node after reload; don't submit the transaction again.

Q09 decline doesn't accept a quest or produce trust; the player may later
explicitly ask to carry the item, with an acknowledgement of the earlier decline.
Returning closes Q09 with its return reward. Selling closes the same quest with
the sold resolution; reconciliation is a follow-up on that history, not another
return claim or a way to delete the sale. The unavailable/missing-Keepsake state
offers recovery/reporting, not another unguarded copy.

For quest facts obtained before acceptance, use receipt-aware reconciliation.
Never assume that an inventory counter alone proves a prior specific turn-in or
that talking to the NPC proves a requested action happened.

## 7. Branch priority and repeat behavior

At conversation open, use the first qualifying category, then its defined node.
After a short auto-callback, offer ordinary topic choices without replaying effects.

1. An accepted transaction's undelivered response, pinned by its receipt.
2. A player-selected available turn-in or service topic (validated current state).
3. Nyx/Mara Keepsake callback: sold, reconciled or returned as specified; specific
   history outranks a generic trust greeting. Use current status first; sold-history
   remains available as a topic after reconciliation.
4. Unseen allocation/archive/invoice/gate/victory callback relevant to this NPC's
   defined knowledge; use the highest-priority one listed in their script.
5. Unseen public governance response.
6. First meeting introduction (with a public-knowledge variant if applicable).
7. Repeat greeting selected by personal tier, then the neutral fallback.

Mark a callback seen only once its line is presented, not when its map loads.
Seen flags have no score effects. Explicit replay/history topics may repeat its
text without changing state. New public events can produce new callbacks, but
random map reloads cannot regenerate an old branch reward.

## 8. State transition examples for review

**Kept promise:** Nyx acceptance creates one Keepsake → Mara handover consumes it
and commits return reward/receipt → Nyx later says she received Mara's delivery
note. Reload before Nyx's callback resumes the same history; replay changes no
inventory/trust. Nyx personal trust rises by exactly 10, plus any earlier public
allocation effects.

**Betrayal and repair:** Nyx acceptance → Ivo warns about registry notice → player
confirms sale → SC +40, trust -20 once, sold history persists → Nyx recognizes the
registered sale → player buys replacement for Wire 3 or SC 40 → Nyx accepts it,
trust +8, no extra quest reward. The resulting -12 trust (before other events)
doesn't block main progression, and reconciliation restores the optional locator
hint through its specific flag even while generic tone remains guarded.

**Private versus public:** Protecting Ivo produces an Exchange endorsement and
his friendly-price threshold, but Mara never accuses the player of hiding an
invoice she didn't see. Publishing produces a district notice and Residents +8;
Mara can acknowledge that real public fact. EKO's private-route policy remains
unknown to Sena in either case.

**Cross-floor meeting:** A future NPC may acknowledge public `governance` or an
explicit courier reference. That doesn't copy all five NPCs' personal trust,
private choices or dialogue transcripts into the new character's knowledge.

## 9. Planned verification, not performed

Trace both branches of every major decision; test failed/missing-cost actions,
double submissions, reload between commit/response, stage and actor changes,
distinct save slots, reputation thresholds/clamping, first-meeting knowledge,
Q09 decline→accept and sale→reconciliation, price rules, perk/claim repetition
and migration of older saves. Confirm Main Q01–Q06 works at worst supported
reputation. Runtime checks require separate authorization under current AGENTS.
This document is written review evidence only.
