# Solvaris implementation plan

Create the owner's horn-masked, gold-armored deity as the largest current boss.
Keep the existing player scale and all previous boss/family packages. Use the
owner's actual image for anatomy/materials; Samsara is a scale cue only.

The approved workflow is native articulated 2D artwork in the shared arena:
normal/enraged illustrations, registered cutouts, character-specific portraits,
icon, profile and a playable encounter. Solvaris has a nominal 30-unit height,
28-unit halo span, 18,000 HP and three ritual attacks. Its hands descend to real
ground counterattack regions, rather than treating an unreachable head as a
melee target. Warning and contact share exact shapes. A wide framing camera,
world-height guide, pan/zoom and optional player-follow view keep the large
scale usable without shrinking Amber.

Add its related Dawnwarden mini-boss (two skills and enrage), plus Halo Acolyte,
Gilded Sentinel and Sun Mote normal mobs through the current family workflow.
Only process the new family; preserve the previous generated exports.

- [x] Generate/inspect/save normal and enraged illustration, cutouts, portraits
  and the five-row family sheet. Retain exact prompts and reference provenance.
- [x] Register native sizes/anchors and export runtime art, icon and profiles.
- [x] Implement the stationary giant's palm strike, annulus and three/five
  targeted pillars, real palm/feet hits, enrage, defeat/reset and bounded VFX.
- [x] Add the isolated deity arena plugin, scale camera/guide and entry links;
  add the new mini-boss/mobs to the shared family selector and controller.
- [x] Review artwork/scale, representative accepted hits and safe zones,
  enrage/reset, four subordinate models and previous-boss navigation in Firefox.
  Record exact evidence and unfinished checks. No agents, automated tests,
  checks, builds or speech-model selection/downloads.

Implementation, observed Firefox evidence and remaining review limits are
recorded in [the delivery notes](solvaris-solar-arbiter.md). A complete defeat
run and exhaustive encounter balance remain unreviewed.
