# Phase 5 — Switchyard, Sena, Marshal and the Bastion

Authored and installed 2026-11-16 (Asia/Manila). **Runtime acceptance pending.**
No automated tests, checks, typecheck, build, dev server or browser were run for
this delivery. The owner's verification deferral remains in effect. Native
image inspection and background Blender authoring are art production, not
observed game behavior.

## Entries

- Connected campaign: `http://127.0.0.1:3000/play?floor=neon-heights`.
- Editable art rehearsal: `http://127.0.0.1:3000/play?preview=stage&map=f01-switchyard`.
- A separate local save uses `&slot=your-name`. No save was pre-completed or
  seeded to bypass the story. Existing campaign slots retain progress.

Follow Rainline's east gate into the southwest yard landing. Freight Dispatch,
Sena, authorization desk, checkpoint and supply cabinet are on the west; the
optional Prism Gunner has an upper detour. The open southeast pad is Marshal
Dock, entered at its board. The northeast gate leads to the existing Kurogane
arena. The Market shortcut opens after Sena accepts both physical records.
The editor remains an art/interaction rehearsal, separate from campaign rewards.

## Installed content

The approved Switchyard F v1 is a native 1152×896 ground with editable scenery
and contacts. New generated art covers the Dispatch cabin, freight stacks,
cargo/crates, fixed crane body and separately animated cable/hook/load. Ground
reflections, cabin fan/windows and cargo/crane lights use the stage-owned clock,
with stable reduced-motion poses. No whole-map animation atlases were added.

Both explicitly approved turnarounds became actual embedded-texture GLBs:
Bastion bulkhead and two-record authorization desk, with four native facings,
collision and approaches. Door leaves slide; the desk's two record models are
visible only after the accepted key submission. Source masters and `.blend`
files remain outside runtime imports. Existing supply, checkpoint, seat and lift
models are reused.

Sena uses her explicitly approved design and Refined cel style. She has six
full-body idle/blink frames over 4.8 seconds, a dedicated compact icon, and
three dialogue angles × six emotions × five face states × two breath frames
(180 complete frames). Her native portrait bundle is 213,502 bytes. Friendly
shared-rig gameplay appearance is separate from the authored dialogue portrait.
Voices, an enraged NPC version and hero combat abilities remain outside scope.
The first angle was inspected before the remaining angle production.

## Story and real encounter outcomes

- Q03 closure now offers Q04; Q04 starts through Sena after Q03 is claimed.
  Older saves with a locked Q04 reconcile through the same Sena topic. Both archive policies keep the
  non-private header; Sena does not learn private archive choices.
- The restored relay's physical Seal and first Marshal clear's physical Writ
  are submitted together. A missing record spends nothing. The accepted atomic
  outcome consumes one each, opens Market/Bastion gates, grants 60 local SC,
  Sena +5 and Wardens +4, and offers Q05. No reputation substitution.
- Marshal uses the existing FamilyEncounter and native family artwork: 3,000 HP
  (6×500), armor ×0.8, recovery ×1.5, 30% natural enrage and both original attacks.
  The dock bounds leave clear dodge space; normal-machine updates are suspended
  during this encounter. Leaving an unfinished fight resets it without loot.
- Kurogane uses the existing arena/rig/controller and selected playable actor,
  loaded only for the Bastion stage. Its 8,400 HP (14×600), four 360-HP funnels,
  body shield, recovery opening, 30% Overclock and original attacks are retained.
  The campaign exposes movement, real sword/wave, component targeting, pause
  resume and return; rehearsal/reset/forced-enrage controls are not exposed.
- Confirmed hits use shared animated impact sprites plus applied numbers. Player
  damage feedback follows the accepted local HP write; failed writes roll HP
  back. Ordinary item contact effects are suppressed for real floor targets so
  rejected hit events do not add a second, unconfirmed impact.
- The HUD shows actual HP bars, funnels/shield, cast state, recovery and a centered
  enraged-art cut-in. No new creature art, representation or balance is claimed.

## Durable loot and recovery

Real controller defeat callbacks issue an in-memory victory proof; a caller's
`defeated: true` flag is not an encounter award. The local store records the
accepted victory under its existing exclusive lock and revision before claiming
loot. If a claim fails, the pending record survives reload. If recording itself
fails, the proof stays in the scene for retry; scene replacement/travel and
normal unload are guarded. A forced process crash before any successful write
cannot preserve that unsaved victory; no success is advertised in that state.

Once per expedition, first Marshal: 35 SC, Alloy 2, Coolant 2, protected Writ;
later: 25 SC and the same basic materials, no duplicate Writ. The 25% Prism 1
bonus is stable for the expedition. First Kurogane: 120 SC, Alloy 4, protected
Core and emblem; later: 50 SC, Alloy 2. Its exclusive bonus is Prism 2 (40%),
Wire 3 (35%) or Coolant 3 (25%). Reopening or reloading does not repay a bundle.

Sena's Q05 report grants trust/standing and public victory knowledge, completes
Q05 and makes Q06 available. It grants no second boss currency reward. The Core
stays protected for the unimplemented Phase 6 governance choice. Dispatch's
Scrap 4/Fiber 2 supply is once per expedition. Dispatch and Landing checkpoints
can be rebound repeatedly without a reward receipt. Defeat restores 100 HP at
the saved safe checkpoint while preserving inventory, SC and decisions.

All saves/rewards/SC are local prototype campaign data, never Django, verified
Kibble or payment records.

## Authoring evidence and pending review

Native stills inspected:

- `assets/floors/f01-neon-heights/batch-c-v1/model-native-review.png`
- `assets/floors/f01-neon-heights/batch-c-v1/switchyard-native-art-layout.png`
- `assets/floors/f01-neon-heights/batch-c-v1/sena-native-art-review.png`

These establish artwork/facing observations, not observed movement, sitting,
travel, combat, dialog playback or performance. Batch C job and Sena's actor
ledger retain approvals, sources, prompts, exports, timing notes and omissions.
Overlapping generation/review/engineering spans are wall time; do not sum them
or report them as exclusive generation latency.

Six focused cases are authored in `tests/floor-phase5.test.ts`, **not run**:
atomic/missing keys and travel gates; real proof/failed save/reloaded first and
repeat claims; actual Kurogane shield/funnel/body logic and report; supply and
checkpoint recovery; stage-specific clamped/deduplicated contacts; private
archive variants/early keys and missing-Writ recovery.

When authorized, review the changed shared scene input/hold lifecycle and actor
selection, normal floor contact presentation and repeat checkpoint binding along
with the yard/arena loop. Confirm all four funnel approaches, natural Overclock,
full defeat, claim retry/reload, death/return, portrait motion, prop rotation and
sitting. Balance and memory/FPS remain unmeasured. Phase 6 and 7 are next.
