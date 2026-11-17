# Phase 6 — Governance, optional activities, crafting and remembered history

Authored and installed locally on 2026-11-16 (Asia/Manila). **Runtime acceptance
is pending.** No automated tests, checks, typecheck, build, app startup or browser
verification were run. The owner's previous verification deferral remains in
force. Native Blender exports and still-image inspection are asset authoring.

## Where to use it

Open `http://127.0.0.1:3000/play?floor=neon-heights` with your existing local slot.
No campaign was seeded or pre-completed for this delivery.

- After reporting Kurogane to Sena, speak to EKO or use the public controller
  beside the plaza projection. Accept Q06, inspect all three choices, then
  confirm one authority. Cancelling keeps the Clearance Core.
- Ask Mara for Rainproof Neighbors after Q02. Use the Repair Bay counter in
  Lumen Market, supply Fiber 3 + Scrap 2, then explicitly report to Mara.
- Ask EKO for Two Koi, One Signal after Q03. Normal and assisted versions are
  also available at the plaza's signal board. Report the accepted success.
- Repair Bay crafting is accessible from its counter. Bag → Recipes allows
  material planning elsewhere; crafting itself remains at Lumen Market.
- Bag → Camp furnishings, or the Concourse planning board, manages crafted
  items. Deploy at the Concourse, approach the bench to sit, and use the circular
  above-object rotation control or the furnishing panel. The lamp has on/off.
- After Q06, Mara provides the Community supply, or Sena provides Warden supply.
  Sena also offers Maintenance Run. Exchange governance affects Ivo's actual
  basic-shop quotes instead of granting a free item.

The arrival and market facilities are in their editable stage templates too.
The crafted assets are registered in the Stage Editor's **Floor 01 · crafted 3D**
category. Editor placement is an art rehearsal and does not spend campaign items
or grant quest progress.

## Governance and progression

The public controller requires Q05 reported, Q06 accepted, an unset authority
and the actual first-clear Core. Confirmation atomically consumes Core 1,
records the selected governance, grants SC 80, claims Q06, marks Floor 01 clear,
shares the public outcome with all five contacts, and offers Q11. It preserves
private archive, invoice and promise knowledge independently.

| Authority | Personal trust | Faction standing | Ongoing perk |
| --- | --- | --- | --- |
| Community | Mara +6, Sena −3, Ivo −2 | Residents +12, Wardens −4, Exchange −4 | Med Patch 1 per expedition from Mara |
| Warden | Mara −2, Sena +8, Ivo −2 | Residents −4, Wardens +12, Exchange −4 | Insulator 1 per expedition from Sena |
| Exchange | Mara −3, Sena −3, Ivo +8 | Residents −4, Wardens −4, Exchange +12 | Basic-shop buying discount 10% |

All three outcomes record the same future-floor eligibility through the clear
flag. No travel action points to an unbuilt Floor 02. Confirmation cannot vote
again or repeat the SC/reputation bundle. Displayed applied reputation changes
use the existing clamped delta helper.

Ivo's own trust remains separate from public Exchange standing. Personal trust
at least 10 discounts basic buys 10%; at most −10 adds 10%. Exchange's 10%
discount combines additively, capped at 20%, with upward price rounding. Fixed
story recovery, sell prices and recipe inputs are excluded. Main services,
free Cell, safe recovery and all endings remain available at low reputation.

## Optional quests and sources

Q07 accepts without consuming materials. The actual Repair Bay action takes
Fiber 3 + Scrap 2 once and records completion; its counter state/label changes.
Only Mara's later report grants SC 30, Mara +3 and Residents +4. A greeting or
saying the repair is done cannot pay the reward.

P04 follows Left → Up → Right → Down. Normal mode presents four 650ms cues,
then four one-second answer beats with ±360ms input windows. Inputs are validated
against the saved attempt ID, start time, current prefix and current stage.
Wrong/late input ends that attempt without resource or reputation loss. Assisted
mode validates the same sequence without time limits. Closing the panel stops
its UI timer; normal time can expire, and retry/assisted mode remains available.
Neither mode grants a reward on opening, reset or visual cue. Accepted success
records Q10 completion; EKO's explicit report grants SC 20, EKO +3 and the Koi
Lamp recipe once. Existing fixed R05/R09 Prism caches remain obtainable without
random drops or Nyx's personal tip.

Q11 is available after Q06: accept with Sena, then confirm Scrap 2 + Coolant 1
for SC 12. It grants no reputation and is once per expedition. Community/Warden
supply claims use separate expedition receipts and grant no trust. A fresh
expedition from the Concourse resets resource/encounter/shop/perk receipts and
Q11 availability, preserving story rewards, decisions, reputation, recipes,
clearance, inventory and camp furnishings. Rest/reload/travel do not reset them.
The refreshed camp is reloaded after a successful fresh-expedition save.

## Four recipes and actual furnishings

| Recipe | Inputs | Requirement |
| --- | --- | --- |
| Med Patch 1 | Fiber 2 + Coolant 1 | Repair Bay |
| Insulator 1 | Wire 3 + Coolant 1 + Scrap 2 | Repair Bay |
| Koi Lamp 1 | Prism 2 + Wire 2 + Scrap 3 | Q10 report |
| Bastion Bench 1 | Alloy 4 + Scrap 6 + Fiber 4 | Q06 clear |

Craft confirmation has a stable request receipt. All inputs and the output
commit together; shortages, cancelled confirmation and failed storage grant
nothing. Retry keeps the same request rather than creating a second output.
No SC fee or shop discount applies to a recipe.

The owner explicitly approved both Batch D turnarounds: **“Good enough — model
both.”** Both are actual embedded-texture GLBs with four native facings. The
Koi Lamp has a fixed octagonal emitter and two independently articulated fish/
tail pivots; switching off hides its projection. The bench has two rounded seat
and back cushions, armored sides, four feet and detailed rear crossrails. Its
final 125-unit width allows two 40-unit outfit widths, a 12-unit gap and arm
clearance; actors were not shrunk. Native contacts use actual support/pelvis
projection and facing-specific approaches/exits. Same-source foreground renders
support seated arm/back occlusion. Ambient light/motion uses the shared stage
clock, stable reduced motion and the existing bounded shared renderer.

Camp deployment supports one fixed slot per kind in the east camp area, away
from the main lift route. Deployment moves one crafted item out of the pack;
reclaim returns it. Rotation and lamp state persist. Changed geometry is prepared
before the inventory/placement commit. A failed load/save preserves the previous
scene and item; a blocked current player position rejects the change. Seated or
approaching actors must stand/cancel before rotation/reclaim. Both the editor
and live selection use the above-object rotation control with native indicator
height. More freeform camp building is outside this delivery.

These are local game items, saves and SC, never authoritative Django/Kibble,
verified rewards or payment records.

## NPC memory and presentation

The existing five character appearances/portraits are reused. New dialogue
resolves accepted responses first, specific promise/known story callbacks,
unseen public governance, then personal-tier greetings. Topics remain available
for valid turn-ins and services regardless of greeting priority.

Each contact has its authored response to all three endings. Explicit remembered
history topics can replay only facts that contact actually knows. EKO alone
recalls the private archive policy; protected invoice history remains with Ivo.
Public invoice/governance notices use their defined witness channels. Nyx retains
sale history after reconciliation and regains the personal route tip only after
that reconciliation. Mara remembers the paid/reported awning; EKO remembers
calibration; Sena's shipment topic reflects this expedition's actual receipt.

Viewing or replaying a line grants no items, SC or trust. A callback is marked
seen only through the existing presented-line acknowledgement, and the pinned
conversation is not replaced mid-speech. The journal displays distinct personal/
faction tiers, ending, quest progress and preserved earlier decline/sale history.
No external AI service or transcript replay was added.

## Evidence and pending acceptance

Authoring stills inspected under `assets/floors/f01-neon-heights/batch-d-v1/`:
`model-native-review.png`, `reference-model-board.png`, `bench-native-contacts.png`,
and the three `*-native-art-layout.png` boards. These are source/native artwork
observations, not application captures, live actor-fit approval or motion proof.
Reference and native frames have different framing; no pixel-equivalence is
claimed. Original prompts, source paths, inputs, model sources and explicit
review reply are retained with the Batch D job.

Nine scoped cases are authored in `tests/floor-phase6.test.ts`, **not run**:
all ending bundles/privacy, clamped reputation/prices, expedition perks and
maintenance, repair/report ordering, both P04 modes and stale/missed inputs,
all recipes/failed writes/idempotency, prepared furnishing failures/ownership,
NPC history/privacy, and legacy/invalid optional save fields.

Phase 7 still needs authorized runtime and automated review: full ending paths,
actual beat UI timing, dialogue/acknowledgement/history across re-entry, failed
save retries, all four bench facings/seats/standing and occupied rotation,
lamp on/off and tail motion, fresh expeditions, narrow UI/focus, reduced motion,
and repeated prepare/dispose resource use. Changed shared dependencies include
session preparation/scene activation, live authored foreground rendering,
indicator placement and NPC conversation selection. Memory/FPS and native actor
fit remain unmeasured. No tests or browser evidence were inferred from the
source or these still boards.
