# Solvaris — The Solar Arbiter

Implemented November 12, 2026 as an additional local fictional encounter.
Preview: http://127.0.0.1:5173/play?preview=monsters&boss=solvaris

## Reference, representation and scale

The supplied deity image drives the horned pale mask, orange hair, purple/gold
armor, red sash, white stoles, two open palms and segmented golden halo.
Solvaris's name, Sunken Orrery biography and judgment mechanics are original
PawTrail adaptations. Grand Chase Classic Samsara was only a scale cue; no exact
dimensions or design correspondence to that game are claimed.

The gameplay creature is articulated native 2D cutout artwork in the existing
WebGL arena, with normal/enraged parts, portraits, icons and illustrations.
Its camera has a fixed three-quarter orientation, pan and zoom. It is not a
freely orbitable 3D creature. Amber retains her existing model, scale, movement,
weapon and contact system.

| Authored extent | Solvaris | Existing comparison |
| --- | --- | --- |
| Nominal vertical envelope | 30 player-height units | Vaelrith: 8 |
| Halo/overall span | 28 player-height units | Vaelrith: 15 |
| Body envelope | Approximately 26 units | Morvane: 33 segments at 0.6 spacing, or 19.2 units between end centers along its body |

These are authored world extents, not exact opaque-pixel or screenshot ratios;
transparent cutout margins, poses and projection affect the visible silhouette.
Solvaris is the largest current authored overall silhouette. Morvane's length
is not a vertical-height measurement. The arena unit is calculated from the
unchanged Amber mesh bounds, excluding equipped items. The on-screen ruler uses
that unit; the ground grid stays at 0.5 units in each direction.

The initial camera fits the whole colossus. Right-drag pans and the wheel zooms.
**Follow Amber** provides a closer moving view; **Fit colossus**, **Reset camera**
or encounter **Reset** restores the wide framing.

## Encounter

18,000 HP, displayed as eighteen 1,000-HP bars. Enrage begins once at 30% HP
(5,400). The rehearsal button explicitly sets local preview HP; it does not
simulate a damaging hit or grant a reward.

| Attack | Warning | Normal field / damage | Enraged field / damage |
| --- | --- | --- | --- |
| Solar Verdict | 1,700 ms | Reach-limited palm disk, radius 2.7 / 28 HP | Radius 3.5 / 35 HP |
| Halo Decree | 2,100 ms | Annulus, inner 5.5 / outer 12 / 32 HP | Inner 4.4 / outer 15 / 40 HP |
| Astral Tribunal | 1,900 ms | Three ground-locked disks, radius 2.5 / 30 HP | Five disks, radius 3.15 / 38 HP |

Normal cooldowns are 7,800 / 12,600 / 15,800 ms; enrage multiplies them by 0.64.
Pillar offsets point inward near arena edges instead of clamping several marks
onto the same location. Telegraphs and contact use the same area definitions.
Each cast applies at most one contact damage event, even if areas overlap.

The giant's hands visibly descend to reachable ground regions during recovery.
Palm seals take 1.75× damage; armored feet take 0.35×. The high head/halo cannot
be hit by ground melee. Hand animation, eligible hit regions and the ground
seals share palm-position data. Damage receipts, health changes and bounded
animated contact sprites use accepted combat outcomes.

Enrage switches to distinct broken-halo artwork, briefly displays its
illustration and changes the actual pattern. Pause, reset, exit and defeat
cancel pending hazards. Reset restores normal art, HP and cooldowns. Defeat
fade/tilt and stop behavior are implemented but were not played through in full.

## Related family

Select members in Solvaris's roster or append `&creature=<id>` to its URL.
Each has a profile, icon, portrait, illustration and five authored pose frames.
Dawnwarden also has a separate enraged row and illustration.

| Member | ID | HP | Authored height | Abilities |
| --- | --- | --- | --- | --- |
| Dawnwarden, mini-boss | dawnwarden | 2,400 | 3.1 | Dawn Edict: 135° sector / 24 HP; Sanctum Ring: annulus / 28 HP; enrage at 720 HP |
| Halo Acolyte | halo-acolyte | 320 | 1.05 | Halo Flare: targeted disk / 12 HP |
| Gilded Sentinel | gilded-sentinel | 420 | 1.15 | Gilded Slam: forward sector / 14 HP |
| Sun Mote | sun-mote | 260 | 0.85 | Mote Pulse: annulus / 11 HP |

Dawnwarden uses 0.8× armor and 1.5× recovery damage. Its shared family controller
provides pursuit, attack phases, damage, enrage, defeat and reset. These are
individual rehearsal encounters, not simultaneous live-world spawns.

## Artwork and integration

Exact ImageGen prompts, reference provenance and original masters are retained
in `assets/monster-studio/solvaris-solar-arbiter/art-provenance.json` and the
adjacent source directories. No copied game voice/audio was used.

Runtime artwork totals **883,673 bytes across 24 image files**: 414,284 bytes for
Solvaris and 469,389 for the family. This excludes JSON, source masters and
already-shared Amber, weapon, audio and impact assets. The selected boss atlas
decodes to 13.5 MiB; the selected family atlas to 6.25 MiB. Encounters load their
own assets. Rendering uses nearest-neighbor filtering and integer canvas scale.

The family source sheet has explicit row boundaries
`[0, 256, 541, 775, 999, 1286]`. This removed a leaked foot/ray fragment in the
first export. Only Solvaris was re-exported using the new `--family` option;
previous family exports were preserved.

The deity arena plugin, navigation entry and roster reuse the existing preview.
Shared arena additions are optional camera framing/pan/follow, a scale guide,
fixed-step rectangular grid, per-attack cooldown reporting and impact selection.
Their defaults preserve prior arena behavior. Vite's watch exclusion was narrowed
to binary source art/media so catalogue JSON changes can refresh; the old broad
assets exclusion initially left the new family catalogue stale in the browser.

## Observed Firefox review

Review used the existing Firefox session and actual UI/keyboard interactions.
No automated tests, builds, lint/type checks or agents ran.

- Whole-body fit, unchanged Amber scale, ruler, pan, close follow view and reset
  were observed. The final preview is paused in normal form at full health.
- Solar Verdict dealt 28 HP. A recovery sword strike dealt 315 HP to a lowered
  palm, leaving Solvaris at 17,685 HP. Both receipts were visible.
- The normal Halo Decree left Amber unharmed outside the outer radius.
- Normal Astral Tribunal contact dealt 30 HP. Enraged Halo Decree dealt 40 HP;
  the five-pillar pattern dealt 38 HP in a separate contact rehearsal.
- In the final enraged pillar dodge, Amber remained at 65 HP after an earlier
  35-HP palm strike: moving into the unmarked gap avoided additional pillar
  damage. This is one observed dodge, not an exhaustive balance claim.
- The labelled low-HP rehearsal showed the distinct enraged form/cut-in and
  wider patterns; reset restored the normal state.
- Dawnwarden's two attacks dealt 24 and 28 HP, and its 720-HP enrage artwork was
  observed. Halo Acolyte contact dealt 12 HP.
- All four corrected family models were loaded, started, paused and captured.
  The recaptured contact sheet shows the source-row fragments are gone.
- Kaedros, Morvane, Vesper and Vaelrith previews were opened/captured, plus the
  prior Bellwarden family encounter. Their full fights were not replayed.
- The final Firefox log inspected had no JavaScript error entries. Existing
  source-map/font warnings and disposed-context messages remain separate from
  encounter acceptance.

Capture directory: `output/playwright/solvaris/`. Main evidence:
`final-ready.png`, `palm-counter.png`, `enrage-cutin.png`, `five-pillars.png`,
`pillar-dodge.png`, `wide-pan.png` and `family-scale-review.png`.

## Remaining limits

Full boss defeat, naturally damaging through the enrage threshold, exhaustive
edge/collision balance, full Sentinel/Sun Mote fights, mobile controls,
reduced-motion behavior and dedicated creature vocals remain unreviewed or
pending. Shared contact/item audio and mute are reused; no new speech model was
selected or downloaded. VoiceStudio's model decision remains separate.

This installation changes only local fictional combat. It does not write real
animal records, authoritative inventory, payments or verified Kibble. Previous
boss/family packages and the separate social worktree were preserved.
