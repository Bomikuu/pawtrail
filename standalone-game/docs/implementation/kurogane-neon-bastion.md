# Kurogane — The Neon Bastion

Implemented November 12, 2026. Open:
http://127.0.0.1:5173/play?preview=monsters&boss=kurogane

## Scope and artwork

An original cyberpunk command robot with charcoal/ivory armor, a cyan visor,
magenta reactor, hazard-yellow trim and four separately destructible remote
weapon funnels. The owner's mecha-anime comparison informs the remote-weapon
mechanic; no franchise model, logos or source audio were copied.

The established representation is native articulated pixel-art cutouts in the
shared fixed-three-quarter WebGL arena, with pan and zoom. This is not a live
freely orbitable 3D robot. Amber's existing model, movement, sword and scale are
unchanged. The robot has a nominal 7.5-player-height envelope; Iron Marshal is
3.4, while the normal mobs range from 0.9 to 1.4. Solvaris remains the largest
boss. These are authored world sizes, not exact opaque-pixel screenshot ratios.

Normal and Overclock Siege forms have distinct armor artwork: opened reactor
vents, raised/lit helmet antennae, hotter piping and remote-pod emitters. The
rig articulates registered head, torso, arms, legs, emitter and four pod sprites,
with breathing, hover, attack anticipation/recoil, hurt and defeat responses.
Portraits use six authored head/shoulder cells: alert, threatening and hurt for
each form. No generic human blink/talk masks are applied to the robot.

Original masters and exact built-in ImageGen prompts are retained under
`assets/monster-studio/kurogane-neon-bastion/`, especially `art-provenance.json`.
Runtime exports use hard alpha, nearest-neighbor resizing/filtering, integer
canvas scaling and native manifests. No source masters were overwritten.

## Real component gating

- Main body: **8,400 HP**, fourteen 600-HP bars.
- Four funnels: **360 HP each**, with independent accepted damage and identity.
  Their 1,440 combined HP is separate from the body bar.
- While **any** funnel survives, body hits return `blocked`: no body HP loss,
  damage number or successful-hit sprite is manufactured. The actual rejection
  flashes the shield and displays the remaining count.
- Each accepted funnel hit updates that component only, with an impact sprite
  at its live position. Destruction removes its sprite and firing contribution,
  disables its target card and announces the new remaining count.
- Destroying the fourth funnel removes the actual shield and exposes the body.
  Body damage is then 1× normally or **1.5× during recovery**.
- Destroyed funnels stay offline through enrage. Reset restores all four,
  their HP, body/player HP, normal artwork, cooldowns and targeting state.
- Duplicate strike/target IDs and dead-component hits are rejected. Rehearsing
  enrage cannot bypass the shield; its button is disabled while funnels survive,
  and the controller independently enforces that rule.

Funnel positions are shared by the rendered pods, hit targets, HP labels and
ground brackets. They occupy four reachable low-hover guard stations rather
than flying out of sword reach. Each target is a 1.24×1.24 world-unit square,
matching the existing weapon pipeline's rectangular hurt areas. Physical
collision circles are smaller and separate from transparent art bounds.

The HUD shows A–D HP, remaining funnels and explicit SHIELDED/VULNERABLE text.
Click a target card or press Tab in the arena to choose the next attack's aim.
Selecting does not teleport Amber, deal damage or guarantee a hit. Weapon areas
can still touch other nearby targets; the player must move into actual range.
WASD/arrows move, Shift runs, J strikes, K uses the existing sword wave and Esc
pauses. Pan/zoom remain available through the arena camera.

## Attacks and phase

| Attack | Warning | Normal | Overclock Siege |
| --- | --- | --- | --- |
| Crossfire Lattice | 1,500 ms | Surviving funnels lock beam capsules, width 0.75; 20 HP | Width 1.1; 25 HP |
| Reactor Sweep | 1,600 ms | Locked 110° sector, radius 5.6; 26 HP | 150° / radius 7; 33 HP |
| Neon Lockdown | 1,800 ms | Three locked disks, radius 1.5; 24 HP | Five disks, radius 1.875; 30 HP |

Warnings and contact share exact field data. Beam endcaps are included in both
the mesh and capsule-distance detection. Each volley applies one damage event,
even where several fields overlap. These are timed volley hazards, not a
continuous-damage ballistic-projectile simulation. With every funnel destroyed,
Crossfire uses one body emitter instead of resurrecting remote pods.

Normal cooldowns are 6.4 / 9 / 12.4 seconds. Overclock multiplies them by 0.65
and shortens the inter-attack rest. The natural phase threshold is 30% body HP
(2,520), announced once with distinct artwork and an illustration cut-in.
The labelled rehearsal sets real local HP to that threshold without claiming
a hit or reward. Pause/exit/phase/defeat cancel old hazards; reset clears them.

## Related family

Append `&creature=<id>` to the parent preview URL or use its family roster.
Only the selected encounter loads. All members have profiles, portraits, icons,
illustrations and five authored poses (idle, movement, windup, attack, hurt).
Iron Marshal also has five distinct enraged poses. Runtime interpolation and
secondary motion supplement those authored frames.

| Member | ID | HP | Height | Skills |
| --- | --- | --- | --- | --- |
| Iron Marshal, mini-boss | iron-marshal | 3,000 | 3.4 | Riot Sweep: 140° sector / 23 HP; Siege Lock: targeted disk / 25 HP; enrage at 900 HP |
| Rivet Hound | rivet-hound | 360 | 1.05 | Rivet Lunge: short forward sector / 12 HP |
| Prism Gunner | prism-gunner | 400 | 1.4 | Prism Mark: targeted disk / 14 HP |
| Arc Wisp | arc-wisp | 280 | 0.9 | Arc Pulse: annulus with a safe center / 11 HP |

Iron Marshal uses the family controller's 0.8× armor and 1.5× recovery weakness;
its shoulder emitters belong to its silhouette, rather than being independently
destructible. Its enrage changes artwork, pursuit, areas and cooldowns. The
parent's component gate is specific to Kurogane.

Only the new family was exported with `prepare-monster-families.py --family
kurogane`. Explicit source rows `[0,258,532,729,1006,1224]` preserve the generated
sheet's transparent gutters and complete feet/weapons. Existing families and
boss packages were preserved.

## Observed Firefox review

Review used actual UI, keyboard, target selection and the existing sword/wave;
no private HP/component injection or fake successful hit was used. No agents,
automated test suite, type/lint checks or build commands ran.

- With four funnels alive, a body strike displayed the shield rejection and
  body HP stayed **8,400**.
- Funnel A took **180 HP**, then another **180** and disappeared. The body
  remained shielded. B was destroyed with the real sword wave; D with sword hits.
- With only C surviving, another body strike was rejected at **8,400 HP**.
- The wave destroyed C, changing the count to zero and removing the shield.
  A subsequent recovery strike dealt **270 HP** to the body: **8,400 → 8,130**.
- A too-distant aimed attack left its selected funnel untouched; moving closer
  allowed contact. An early rehearsal also reached Amber-down, which stopped
  combat. Subsequent review segments paused safely between interactions.
- Overclock rehearsal set body HP to **2,520** and kept all four funnels
  destroyed. Its distinct art/cut-in and five-disk warning were captured.
  An enraged Reactor Sweep dealt **33 HP**; a later diagonal escape left Amber
  at **21 HP before and after** the five-disk volley.
- Normal Crossfire's four overlapping firing lanes dealt **20 HP once**,
  leaving Amber at 80. Normal Neon Lockdown dealt **24 HP**. Normal Reactor
  Sweep's **26 HP** contact was also observed during the funnel sequence.
- Reset restored body **8,400**, player **100**, four **360-HP** funnels,
  shield, normal form and unselected targets. Tab selected A then B correctly.
- Iron Marshal's two skills dealt **23** and **25 HP** (player 52 remaining),
  and its **900-HP** enrage artwork was observed.
- All three normal mobs produced accepted contact: Hound **12**, Gunner **14**,
  Wisp **11 HP**. The Hound was defeated through ordinary sword contact at zero HP.
- All four family models were visually captured against unchanged Amber. Their
  contact sheet shows distinct silhouettes, complete gear and clean row crops.
- Regression: Kaedros accepted an actual **510-HP** armored wave hit, reducing
  HP **3,600 → 3,090**. Morvane, Vesper and Solvaris arenas loaded without funnel
  UI. Bellwarden's previous family encounter loaded/started/paused. Vaelrith's
  existing preview navigation opened; its full 3D fight was not repeated.
- The inspected Firefox console contained no JavaScript error entries. Existing
  source-map/font warnings and disposed-context messages are not counted as
  encounter failures or as a broader clean-console certification.

Screenshots are in `output/playwright/kurogane/`: `body-shield-blocked.png`,
`last-funnel-gate.png`, `all-funnels-destroyed.png`, `unshielded-core-hit.png`,
`enrage-cutin.png`, `enraged-lockdown-warning.png`, `crossfire-active.png`,
`reset-restored.png`, `family-review.png` and `final-ready.png`, plus individual
family/contact/regression captures. Final preview: normal form, paused, full HP.

## Delivery size, boundaries and remaining review

Runtime artwork: **716,882 bytes across 24 image files** (280,247 for the parent,
436,635 for the family). This excludes JSON, editable source masters and shared
Amber/weapon/contact/audio assets. The selected parent atlas is 4 MiB decoded
RGBA; the family atlas is 6.25 MiB. Source assets remain editable and separate.

Full Kurogane/Iron Marshal defeat runs, natural damage crossing the enrage
threshold, exhaustive boundary/angle/cooldown combinations, mobile and reduced-
motion review remain pending. Normal-state attack contact and one enraged dodge
do not establish exhaustive balance. The funnels use fixed guard stations with
hover motion, not free-flight swarm AI. No multiplayer/server encounter or
live-world spawn was added.

Existing confirmed-contact/item sounds and mute are reused. Dedicated robotic
vocals/sound design were not generated or listening-approved. VoiceStudio model
selection remains pending; no speech-model download was authorized or started
for this task. Real animal records, account inventory, payments, verified Kibble
and the separate social worktree are unchanged.
