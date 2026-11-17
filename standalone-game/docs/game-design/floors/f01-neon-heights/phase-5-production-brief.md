# Phase 5 — Neon Switchyard concept and encounter handoff

Current status: concept F v1, both prop turnarounds and Sena’s Refined cel
style were explicitly approved. Production and local integration are installed;
see [Phase 5 delivery](phase-5-delivery.md). The original gate/brief below records
the required sequence; runtime verification remains deferred.

Owner instruction, 2026-11-16 (Asia/Manila): proceed to Phase 5, show the
Switchyard concept for explicit approval **before creating its assets**, then
connect Sena, Iron Marshal and Kurogane. This step produces a map concept and
its review record only. No production assets, NPC appearance package, editable
layout or runtime changes precede that approval. Existing tests/checks/builds
and browser verification remain deferred; work directly without agents.

## Concept F — Neon Switchyard v1

Stage `f01.stage.switchyard`, proposed 36 × 28 native 32px cells (1152 × 896).
Continue the accepted textured 2D, fixed top-down three-quarter Neon Heights
style: fine stepped outlines, graphite/steel-blue materials, muted burgundy,
selective cyan/magenta emission and warm amber safe areas. Keep one walkable
plane and continuous terrain without editor grid lines. The current Undergrid
native art and approved Rainline concept are the visual continuity references.

- Southwest: safe Rainline arrival/return landing and service-stair portal.
- Upper left, R10 Freight Dispatch: Sena's safe cabin and exterior desk,
  two-slot authorization terminal, checkpoint marker and supply bin. Her tiny
  concept figure indicates placement, not approval of a final character design.
- West middle: closed future Market shortcut, connected to the main lane.
- Centre: broad freight-service loop, grouped cargo and recessed rail spurs.
  Preserve actor/outfit and interaction approach clearance.
- Lower right, R11 Marshal Dock: a separated flat encounter pad with a wide
  readable entrance, low perimeter crash barriers and clear dodge space.
  Existing Iron Marshal (3.4 × human height) belongs here; no trash enemies
  enter his fight. His shoulder emitters are decorative, not Kurogane's four
  destructible funnels. No HP/stat or creature representation change is proposed.
- Upper right: the closed Bastion bulkhead and a clear waiting/entry pad. Kurogane
  stays in the separate existing arena beyond this gate, not inside the yard.
- Upper central side spur: at most one existing Prism Gunner, with an obvious
  bypass and separation from the safe desk and Marshal encounter.

Planned motion: localized signal/window/terminal lighting, crane warning lamps,
slow fans, cable equipment and damp-ground highlights. Keep architecture fixed;
no whole-map pulsing. Newly authored active gate/terminal/container props follow
our real textured 3D workflow; passive architecture can stay animated 2D.
Furniture turnarounds and Sena's design/portrait choice retain their applicable
later review steps. Reuse complete existing sources before commissioning gaps.

## Connection rules after concept approval

1. Inventory actual reused freight/city/prop sources, then produce only the
   missing approved scenery and usable props. Build an editable stage with
   safe entries, one walkable plane and collision/approach/depth contracts.
2. Create Sena's presentation through the actor workflow and connect her exact
   S01–S03 scripts. Private archive policy stays private; she needs EKO's signed
   header, not that private decision. Reputation never replaces actual keys.
3. Accept Q04 after Q03 closure. P02 grants the Relay Seal; an actual Iron Marshal
   defeat grants the Transit Writ. Allow early-found keys to reconcile without
   circular quest gates or requiring a second first-clear defeat.
4. Preserve Marshal: 6 × 500 = 3,000 HP, armor ×0.8, recovery ×1.5, enrage at
   30%, Riot Sweep 23 / Siege Lock 25 damage. Reuse native art and attacks;
   separate accepted floor defeat/loot from preview/reset controls.
5. Sena confirms both keys atomically: consume Seal/Writ once, grant Q04's 60 SC,
   Sena +5 / Wardens +4, and open the actual Market shortcut and Bastion entry.
   Missing records consume nothing. Accept Q05 through her boss topic.
6. Adapt the existing Kurogane arena for floor prepare/entry/death/return/save.
   Preserve its articulated 2D representation, 14 × 600 = 8,400 body HP and four
   independently reachable 360-HP funnels. The body stays shielded until all four
   are down; 30% body HP triggers the existing Overclock phase. Existing arena
   composition/coordinate adaptation needs its integration review; this Switchyard
   concept does not approve unseen new Bastion artwork or a redesigned boss.
7. Commit first/repeat encounter drops from actual accepted defeats. First Marshal:
   35 SC + Alloy 2 + Coolant 2 + protected Writ; later 25 SC and no duplicate Writ.
   First Kurogane: 120 SC + Alloy 4 + protected Core + emblem; later 50 SC + Alloy 2
   and no repeated unique grant. Use the approved exclusive bonus tables. Sena's
   Q05 report changes story/trust only, without paying boss loot a second time.
8. Keep R10's Scrap 4 / Fiber 2 supply expedition-scoped. Preserve safe returns,
   bounded hazards, confirmed contact sprites/applied damage, reduced motion,
   lazy loading and disposal. Governance and optional crafting remain Phase 6.

## Review and verification status

The forthcoming concept is a composition proposal, not a gameplay screenshot,
installed map, asset atlas, Sena appearance approval or combat acceptance.
Wait for explicit owner approval of the named version; no response is not approval.
No tests or browser review run during this concept step. Phase 4 remains installed
with runtime acceptance pending, as recorded in `production-status.json`.
