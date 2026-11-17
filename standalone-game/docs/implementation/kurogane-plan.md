# Kurogane — The Neon Bastion

Extend the existing authored pixel-boss arena without rebuilding its renderer or
changing previous encounters. Native articulated 2D cutouts remain the selected
representation; use original cyberpunk armor and four independent remote funnels.

## Delivery steps

- [x] Generate and retain normal/enraged illustrations, articulated body/funnel
  cutouts, specific robot portraits and a five-pose family sheet. Inspect artwork
  before building the dependent rig; export transparent nearest-neighbor assets.
- [x] Implement four 360-HP funnels, exact targeting and authoritative local
  shield gating: main-body hits are blocked while any required funnel survives.
  Destroyed funnels stay destroyed until reset. Expose the 8,400-HP core only
  after the fourth destruction; do not revive funnels during low-HP enrage.
- [x] Add visible remaining-funnel HP, A–D ground labels, shield/vulnerability
  state and accepted contact/destruction feedback. Share live funnel coordinates
  between art, targeting and health markers; reject duplicate/dead-target hits.
- [x] Author Crossfire Lattice, Reactor Sweep and Neon Lockdown with locked-ground
  warnings, real contact and recovery. Enrage at 30% uses distinct art and wider,
  faster patterns. Pause cancels hazards; reset restores all components and HP.
- [x] Add Iron Marshal (larger mini-boss, two skills plus enrage), Rivet Hound,
  Prism Gunner and Arc Wisp through the shared family workflow. Export only this
  family and preserve every existing boss/family asset.
- [x] Rehearse through the actual Firefox UI: shielded-body rejection, individual
  funnel damage/destruction, vulnerability after the last funnel, actual body
  damage, reset, phase and representative family attacks. Capture evidence and
  revisit affected existing previews. Record limits honestly.

No agents or automated tests/builds. Browser review is explicitly requested.
All combat is fictional/local. No real animal, inventory or verified Kibble data
is changed. VoiceStudio model choice and downloads remain outside this task.

See [delivery and observed review](kurogane-neon-bastion.md) for exact outcomes,
screenshots and the limits of the completed Firefox review.
