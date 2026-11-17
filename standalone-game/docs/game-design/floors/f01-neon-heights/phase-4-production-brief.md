# Phase 4 — Undergrid and Rainline production brief

**Authorization:** owner said “proceed” after Phase 3 delivery on 2026-11-15.
Continue the approved floor plan. The latest instruction to skip automated tests,
typechecking, builds and browser verification remains in effect. Work directly,
without agents. New map production waits for explicit concept-image approval.

**Current step:** generate and review concepts D/E in
`concepts/batch-b-v1/`. These are composition proposals, not installed stages or
asset sheets. No earlier approval of A/B/C approves these unseen images.

## D — Undergrid: Pump Gallery and Relay Hall

- Stable stage: `f01.stage.undergrid`; planned editable size 40 × 28 native 32px
  tiles, 1280 × 896. Keep existing stage/editor formats and a single walkable plane.
- Main route: southwest market hatch → wide maintenance lane around a machinery
  island → northeast Rainline service lift. Both ends have safe waiting/spawn space.
- Western Pump Gallery/R06: contained coolant reservoir, separate harvest valve,
  fixed pump bodies with rotating/flowing components, steam/vent telegraphs and
  one bounded Arc Wisp pocket. Keep a dry, readable bypass and safe reset position.
- Eastern Relay Hall/R07: P02's distinct 3 × 3 relay board, two supply cabinets,
  clear approach/contact space and the service lift beyond. A small mechanical
  hound pocket stays outside the puzzle standing area and return landing.
- Palette: graphite/indigo utility structure, subdued teal coolant, narrow amber
  maintenance lights, occasional magenta status accents; quiet continuous floor,
  fine textured pixels and colored contours matching the approved city.
- Planned motion: real fan rotors, flowing coolant, keyed status lights and vent
  effects; fixed solids/ground. Telegraphs must remain legible without color/audio.

## E — Rainline Skybridge: Courier Walk and Signal Archive

- Stable stage: `f01.stage.skybridge`; planned size 40 × 24 tiles, 1280 × 768.
- Main route: southwest Undergrid lift → broad railed promenade with a side loop
  → eastern future-Switchyard threshold. The latter remains unavailable until
  Phase 5 installs the destination. No disconnected platforms or invented jumping.
- R08 courier shelter: protected north-side awning, seat, parcel shelf and warm
  work light; Nyx stands in a safe alcove away from damage areas. A portrait-sized
  face in a map concept is not her final approved actor design.
- R09 archive: quest terminal for P03 and a separate optional first-only locker.
  Nearby maintenance plaque exposes the public clue independently of Nyx's trust.
  Leave every approach and the return route unobstructed.
- Two short patrol pockets reuse Rivet Hound and Prism Gunner. Safe waiting spaces
  and a readable route remain visible. Distant city facades sit below the rail
  visually and remain passive background, not implied extra walkable floors.
- Planned motion: local window/sign cycles, restrained rain/reflection layers,
  shelter fabric and archive projection/signal components. Keep broad structures
  and walking/collision geometry fixed, with useful reduced-motion states.

## Reuse before generation

| Existing source | Reuse and real integration gap |
| --- | --- |
| Batch A native city scenery and animation renderer | Skyline/rails/fans, fixed emitters and localized light/reflection playback; do not regenerate city buildings |
| Approved lift, allocation and planning models | Shared gate/cabinet materials and some geometry; P02 relay and archive need matching state/component changes, not renamed static pictures |
| Existing `studio-couch` and native contacts | Courier seat if the approved composition calls for one; no unrelated sofa conversion |
| Arrival android projection | EKO's world representation can reuse the existing animated projection; add an actual NPC binding/presentation, not an unrelated human stand-in |
| Kurogane normal family | `arc-wisp` 280 HP, `rivet-hound` 360 HP, `prism-gunner` 400 HP; existing authored 2D art/skills, no new creature identity/stat generation |
| Shared item/impact pipeline and stage locomotion | Bridge real stage coordinates, wall/LOS checks, live enemy state, player HP and confirmed hit sprites/numbers; preview arenas/training targets do not grant floor loot |
| Phase 3 campaign, store, session, dialogue and travel | Preserve local slot, atomic costs/results, once-only receipts, safe preloaded travel and authored knowledge rules |

Only actual art gaps enter Batch B production after map approval: utility ground,
pump/pipe/corridor scenery, skybridge/railing/backdrop sections and localized
animation layers. Reuse complete existing art before generating variants.
Player-usable relay/locker/cabinet/valve props follow the chosen textured 3D route
and applicable source-angle review. Passive scenery can remain animated 2D.

## Dependency-ordered implementation after concept approval

1. **Native packages and editable layouts.** Use PawTrail Assets for missing art,
   animations/manifests and specialist furniture for usable models. Preserve A/B/C,
   existing saves, original maps and native frame definitions. Review new model
   angles before their dependent modeling. Store source masters outside runtime.
2. **EKO/Nyx presentation.** Reuse EKO's world projection; produce the missing
   matching illustration/portrait/icon presentation and Nyx's friendly courier
   identity through actor/portrait workflows. Get their applicable design/style
   approvals. No voices, flirty default, combat hero package or new boss job.
3. **Puzzle/resource commands.** P02 rotation persistence and actual energized
   path grant one Relay Seal. P03's Fish → Moon → Fish → Star success grants one
   Memory Fragment and records Invoice found. Keep replay/assisted clue access,
   wrong-input feedback, safe cancellation and no input costs on failure. Fixed
   cabinets/reservoir use expedition receipts; the separate archive locker is
   first-only SC 20 + Prism 1. Read actual loot tables, not generic random grants.
4. **World combat and hazards.** Install bounded normal-enemy pockets using their
   existing encounter/animation sources, actual stage collision and player weapon
   contact. Give the player a usable existing weapon contract before spawning
   hostiles. Commit/confirm real HP changes and accepted loot; show contact sprites
   plus applied numbers/status. Vent warnings last 1.5s, deal 10 HP once per active
   cycle, and consume eligible insulation to apply 5 HP instead. Death restores
   100 HP at a prepared safe checkpoint without erasing profile progress or
   granting uncommitted rewards. Pause/dispose hazards on panels, exit and reset.
5. **Private stories and knowledge.** Implement Q03/EKO archive policy, Q08/Ivo
   protection/publication, Q09/Nyx decline → accept → Mara return OR registered
   Ivo sale → replacement → reconciliation. Use exact authored effects and
   callback priority. Preserve both policy branches' non-private gate header,
   original sale/decline history and personal/faction separation. Never regenerate
   trust, scrip or unique items by reopening/reloading/changing actor.
6. **Connect and hand off.** Open the market/Undergrid route after the saved Q02
   report, provide all safe returns and honest unavailable Switchyard messaging.
   Update journal/inventory to actual installed content, then production/evidence
   status. Do not claim runtime acceptance from static source sheets.

## Pending focused acceptance

When separately requested: P02 solve/wrong/reset/reload, P03 replay/wrong/success,
both archive and invoice choices, decline/accept and sale/reconciliation, failed
costs/duplicate claims, each existing normal's miss/blocked/hit/death/loot, vent
telegraph/insulation, safe death return, NPC callbacks and a stage unload cycle.
No tests or browser checks are run while that authorization remains deferred.

## Dependency correction carried forward

During plan/source reading, the Phase 3 Med Patch implementation was found to
restore 35 HP while the approved resource table specifies **30 HP**. Its command
and service description now follow the approved 30-HP value; the 35-SC Q02 reward
is unchanged. This is a source correction, not a verified gameplay result.

## Installation handoff

The approved D/E batch is authored and installed. See [Phase 4 delivery](phase-4-delivery.md) for actual content, native authoring evidence and the runtime acceptance still deferred by the owner. This handoff does not authorize Phase 5 or claim a tested playthrough.
