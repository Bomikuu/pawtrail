# Phase 4 — Undergrid and Rainline installation

Status: **authored and installed; runtime acceptance pending**. The owner approved
both D/E map concepts, the four prop turnarounds and both NPC designs with Refined
cel portraits. The prop job initially advanced after the owner's existing 60-second
furniture-review default; the subsequent explicit approval is recorded too.

## Open the content

- Connected saved adventure: `http://127.0.0.1:3000/play?floor=neon-heights`.
- Editable Undergrid: `http://127.0.0.1:3000/play?preview=stage&map=f01-undergrid`.
- Editable Rainline: `http://127.0.0.1:3000/play?preview=stage&map=f01-skybridge`.
- The editor is an art/interaction rehearsal. Use the connected adventure for
  campaign puzzles, quests, encounters, shops, reputation and durable receipts.

The market utility gate opens after Q02 is reported to Mara. Undergrid and
Rainline have safe return lifts. The Switchyard honestly remains unavailable
until Phase 5. Existing v1 local campaigns retain progress; new puzzle/contact
fields are additive. A separate `&slot=name` creates an independent local slot.

## Installed gameplay

P02 traces actual matching connector ports and persists each rotation. Confirming
a connected west-to-east path grants one Relay Seal. Its physical model rotates
the corresponding connector groups; acceptance energizes its real emissive state.

P03 has a replayable visual four-symbol sequence and accessible transcript. Wrong
input resets only the entry. Correct input opens the archive drawer and records
one Memory Fragment and Invoice Record. The public plaque also supplies the
maintenance locker code; losing Nyx's trust cannot remove the main route.

Six resources distinguish first-only profile discoveries from per-expedition
reservoir/cable stock. The market advert cache is inspected through its actual
unlit 3D panel. The valve wheel, archive drawer and cabinet doors respond to
accepted collection/puzzle states. Reloading or travelling does not refill stock.

Rivet Hounds, Prism Gunner and Arc Wisp reuse their existing native family atlas,
HP and telegraph definitions. They remain in bounded combat pockets away from
safe NPC shelters/return arrivals. The existing training sword/Rescue wave has
visible keyboard and button controls (J/K), collision and wall sight checks.
Normal strikes use 45 base damage, wave 80; existing recovery/armor multipliers
apply. Confirmed hits show the shared animated contact sprites, applied damage
numbers and actual HP. Ground hazards warn for 1.5 seconds, then allow one 10-HP
contact per cycle. Insulation reduces the next two environmental contacts to 5.
Mob loot is deterministic per spawn/expedition and saved once after actual defeat.

Zero HP offers a safe return: prepare a clear Lantern Landing scene, persist
recovery, then activate. Inventory, SC and decisions stay; uncommitted loot is
not granted. Store failure preserves the defeat state for retry. Other actions
cannot revive the actor through an unintended shopping/healing path.

Q03 offers the two explicit archive policies, both preserving the gate header.
Q08 offers private repair or district publication of Ivo's invoice. Q09 supports
decline, later acceptance, Mara delivery OR registered sale, replacement purchase
or guarded recovery, and reconciliation. Sale/delivery rewards are exclusive;
repair grants no second currency reward. Original decline/sale history survives.
Knowledge channels, personal trust and faction standing remain separate. EKO,
Ivo, Mara and Nyx use authored conditional dialogue and acknowledged callbacks.

## Art and runtime packages

Source package: `assets/floors/f01-neon-heights/batch-b-v1/`.
Runtime: `public/pawtrail-game/floors/f01/batch-b-v1/`.
Registry: `src/game/stage-editor/f01-batch-b-art.json`.

- Two native ground paintings, turbine machinery, flowing reservoir and pipe wall.
- Four genuine generated-paint GLBs with full geometry visible from all sides,
  four native facings, ground contacts and keyed connector/door/drawer/wheel nodes.
- Existing city lights, rails, lift, seating and projection sources reused.
- Nyx uses the shared humanoid rig. EKO retains the existing animated holographic
  projection; no biological legs or invented humanoid rig are claimed.
- Each NPC has a six-frame 4.8-second illustration, generated compact icon and
  three Refined cel portrait angles with six expressions, blinking and speech.
  Each portrait bundle contains 180 complete native frames at 96 × 120 pixels.
- Nyx portrait bundle: 243,031 bytes; EKO: 228,219 bytes, including references.
- One stage-owned clock/canvas, shared machine atlas, bounded contact/number pools,
  bounded live props and lazy/disposable 3D adapters. No per-mob WebGL contexts.
  Ambient motion pauses on panels/hidden tabs; reduced-motion feedback is retained.

Actor source jobs are in `assets/actor-appearances/{nyx-tal,eko-9}-floor-v1/`.
Generation span intervals include waiting and independent implementation, not
measured active model time. All source masters remain outside runtime imports.

## Evidence and limits

Native source art, all 16 prop facings, portrait emotion/angle review sheets and
native art-layout compositions were inspected as asset authoring work. Files
`undergrid-native-art-layout.png` and `skybridge-native-art-layout.png` are static
art composition proofs, **not browser screenshots or runtime evidence**.

No tests, typecheck, lint, app build or browser verification were run. The owner's
“Skip verification for now” remains in force. Six focused cases were authored in
`tests/floor-phase4.test.ts`; their execution is pending. Earlier Phase 1 results
apply only to their recorded revision, not this installation.

Pending requested acceptance should cover actual stage traversal/void edges,
P02 solve/reset/reload, P03 replay/mismatch/recovery, both archive/invoice branches,
Q09 delivery and sale/reconciliation, failed saves/costs/duplicate claims, confirmed
machine misses/hits/loot, hazards/insulation/death return, portrait playback,
seating/rotation, pauses and a stage unload cycle. Runtime performance and visual
motion are unobserved. No claim of a passing playthrough is made.

All SC, inventory and campaign saves remain local fictional game state, separate
from authoritative Django records, community Kibble, identification or payments.
