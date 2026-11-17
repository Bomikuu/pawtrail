# Phase 3 — connected first district

Implemented on 2026-11-15 for the standalone game. Entry:
`http://127.0.0.1:5173/play?floor=neon-heights`.
The shared game menu and Stage Editor Files menu also open this adventure.

This route uses the approved lobby/arrival/market artwork and live props. Editor
rehearsals remain separate. No new art, mobs, source models or social-worktree
changes were required.

## Play the loop

1. Create the named local slot, or resume its saved location. Actor selection is
   independent of the slot. Optional `&slot=another-name` selects another slot.
2. At the Concourse, approach the upper lift and press E. Confirm travel to
   Lantern Landing. First confirmed entry grants 30 local Circuit Scrip once.
3. Talk to Mara and accept **Find Your Footing**. Activate the labeled landing
   return beacon and read the market route board. Return to Mara for 15 SC.
4. Accept **Keep One Light On**. Use the market gate to enter Lumen Market, then
   ask Ivo for the free Emergency Cell. It cannot be sold/discarded. A guarded
   once-only recovery service exists for an issued-but-missing unspent Cell.
5. Use P01. Safety costs 2 units; Clinic and Transit cost 4 each. Preview is
   read-only; overload/missing safety is rejected. A valid preview opens a named
   confirmation with the exact Cell cost and reputation consequences. Cancel
   returns to editing without a save. Confirm saves one exclusive decision,
   consumes one Cell and updates Q02, public knowledge and actual clamped scores.
6. Return to Mara, report the line and claim 35 SC once. Her reply and later
   callback depend on Clinic versus Transit. Ivo can acknowledge the district's
   public allocation notice. The utility gate honestly remains unavailable until
   the Undergrid is installed.
7. Return to the Concourse, change actors or reload. Profile quests, inventory,
   decisions, relationship/faction scores and receipts remain in the same slot.

Walk with WASD/arrows, run with Shift and interact with E. Touch controls reuse
the existing movement component. The adventure includes the approved camp seat,
world interaction labels, objective pin, quest progress, inventory and journal.

## Actual services and persistence

- **Shop:** six basic goods, plan-defined prices/sell values and finite expedition
  stock. Price rules use Ivo's actual personal trust and Exchange governance,
  upward rounding and the 20% discount cap. A purchase commits SC, inventory and
  its stock receipt together. Stale quotes, insufficient funds and exhausted stock
  cannot grant an item. Basic resale never replenishes stock.
- **Expeditions:** explicit confirmation at the Concourse starts a fresh expedition
  and restocks basic goods; it keeps profile SC/items, quest claims and memories.
  Resting, stage travel, actor changes and reload do not restock.
- **Recovery:** free rest restores only missing HP. Med Patches restore up to 30;
  Insulators record two protected future environmental contacts without stacking.
  These three stages are safe; this phase adds no artificial damage or later
  hazards to demonstrate healing. Already-full recovery keeps items and grants
  nothing. Insulation is prepared for later hazard integration.
- **NPC scripts:** executable M01–M03/I01 adapters reuse the shared parchment
  GameDialogue and the NPC's own Refined cel portrait. Natural text revelation
  drives speech; choices disable during saves. The new floor uses Instrument Sans
  body/controls and Saira Condensed names through existing font tokens. No voices
  or portrait-style regeneration was added.
- **Memory:** reward/choice receipts persist before response presentation. Seen
  nodes are acknowledged only after the final paragraph is revealed. Unread
  accepted replies and later allocation callbacks resume on reopening/reload.
  Greeting/replay acknowledgements grant no trust, goods or rewards. Personal
  tiers never replace specific history, and private knowledge is not broadcast.
- **Save boundary:** `pawtrail:floor-campaign:v1:<slot>` under a Web Lock. Failed
  writes never publish a successful reward/purchase. Revision conflicts refresh
  the save without spending against a stale snapshot. Missing optional vitals
  in earlier foundation v1 saves defaults to 100 HP, max 100, insulation zero;
  malformed explicit vitals or unsupported versions remain errors, not resets.
- **Travel:** preload the destination's native assets and live models; let the
  existing collision controller resolve an actual safe spawn; lock and persist
  location plus any first-entry grant; activate the prepared scene, then dispose
  the previous one. A preload/save failure keeps the source scene. An interrupted
  committed departure resumes at its saved destination later. External-tab
  location changes pause the old scene and require Resume before continuing.

This is local fictional game progress. It does not write Django data, verified
Kibble, payments, achievements or community records.

## Implementation and review status

Domain: `src/game/floors/{commands,dialogue,session,stages,state,store}.ts`.
UI: `src/components/game/floor-adventure{,-panels}.tsx`.
Optional runtime hooks extend StageCanvas/StagePlaytest while preserving the
editor's default behavior. Hidden candidates stay paused; all prop instances
share one renderer per live scene, with the previous scene released on activation.
New route code remains lazy; source masters/Blender files never enter imports.

Focused tests are authored in `tests/floor-adventure.test.ts`. Existing foundation
and Batch A tests are retained. **No tests, typecheck, build or browser review
were run**, following the owner's latest “Skip verification for now” instruction.
Runtime behavior, motion, viewport fit and performance therefore remain unverified.
Earlier Phase 1 test passes do not validate these changed dependencies.

Later phases still own Undergrid/skybridge/switchyard/boss content, archive and
invoice choices, courier/Keepsake stories and final governance. Their authored
plans remain available; this delivery does not label those systems installed.
