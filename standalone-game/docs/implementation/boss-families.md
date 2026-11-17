# Boss families — four mini-bosses and twelve normal mobs

Full boss creation now includes one related mini-boss and three distinct normal
mobs in both the workspace and installed `pawtrail-monsters` skill. Focused boss
revisions preserve existing members. `references/boss-families.md` documents the
artwork-first workflow, relative scale, skills, native manifests, accepted-hit
feedback, local authority and review requirements.

## Playable roster

Open any existing boss preview and use its family selector. Each selection loads
one local encounter with the actual Amber model, equipped sword, shared movement,
contact sprites, damage receipts, HP, pause/reset and lifecycle cleanup.

| Parent | Mini-boss | HP | Its skills | Three normal mobs |
| --- | --- | --- | --- | --- |
| Vaelrith | Gloamwarden | 1,500 | Twin Rift Fangs; Rift Rupture | Riftling; Shardback; Ashwing |
| Kaedros | Cindervane | 1,800 | Forked Embers; Cinder Ring | Ember Whelp; Cinder Imp; Coalback |
| Morvane | Ribwarden | 1,800 | Bone Cleave; Marrow Eruption | Bone Crawler; Skull Skitter; Grave Adder |
| Vesper | Bellwarden | 1,500 | Bell Reap; Hollow Chime | Lantern Wisp; Huskling; Sickle Shade |

Examples:

- `/play?preview=monsters&creature=gloamwarden`
- `/play?preview=monsters&boss=kaedros&creature=cindervane`
- `/play?preview=monsters&boss=morvane&creature=ribwarden`
- `/play?preview=monsters&boss=vesper&creature=bellwarden`

WASD/arrows move; Shift runs; J strikes; K uses the equipped ultimate; Escape
pauses. The existing rehearsal buttons request real local creature skills. Only
mini-bosses show the labelled low-HP phase rehearsal. Mob HP ranges from 220 to
420, with one named attack each. All new creatures use 300-HP bar units.

Mini-bosses are 2.45–2.7 player-height units; ordinary members are 0.8–1.1 units.
The player is not shrunk. Footprint/hurt radii are separate from visual bounds;
transparent margins and wings do not become solid rectangles. Hovering members
drift above grounded shadows. Their small hover still permits sword contact.

## Artwork and representation

Built-in ImageGen produced four new family sheets using each approved parent
boss illustration as its reference. All four masters and exact prompts are
retained under `assets/monster-studio/families/`; `art-provenance.json` links them.
The creatures are new related designs, not resized parent-boss crops.

There are **100 authored full-body poses**: five normal and five enraged poses
for each mini-boss, and five poses for each normal mob. These are alert idle,
movement step/drift, anticipation, active attack and hurt. The runtime adds
breathing, idle/step cycling, small follow-through and a defeat fade/collapse.
This is a fixed three-quarter **native 2D creature representation inside the
existing WebGL arena**, not sixteen freely rotatable 3D creatures or complete
directional walking sheets.

`scripts/prepare-monster-families.py` exports hard-alpha, nearest-neighbor,
non-dithered artwork and authoritative manifests. Shared scale is retained across
each creature's poses, with per-frame ground-contact registration to baseline
248. Each atlas is 1,280×1,280, with 25 cells of 256×256. A selected atlas decodes
to 6,553,600 bytes; only the selected encounter allocates its rig texture.

Every member has its own icon, alert/threat/hurt portrait strip, normal
illustration and profile. Mini-bosses additionally have distinct enraged
illustrations and five corresponding live poses. Portraits use their own authored
pixels and follow encounter state, including an accepted hit during recovery;
there are no shared procedural face masks. Illustration breathing is runtime
motion, not additional generated image frames.

The **72 runtime artwork files total 1,986,870 bytes (about 1.90 MiB)**, excluding
JSON, source masters and shared Amber/sword/contact assets:

| Family | Artwork bytes |
| --- | --- |
| Vaelrith | 604,272 |
| Kaedros | 587,453 |
| Morvane | 404,813 |
| Vesper | 390,332 |

## Mechanics and reuse

`family-catalog.ts` reads the authored family catalogue and supplies arena
definitions. `family-encounter.ts`, `family-rig.ts` and `family-fields.ts` own
subordinate simulation, authored sprite poses and exact warning geometry.
The existing loader/scene accept an optional creature ID; original boss branches
retain their existing controllers, rigs, assets and defaults. The shared roster
is installed on all four parent pages. Selected scenes dispose on navigation.

Sector, annulus and targeted-disk attacks lock their origin/direction at cast.
The same shape parameters drive warning meshes and contact detection. Each cast
accepts one contact event; misses and phase rehearsal do not manufacture hits.
Mini-boss armor applies ×0.8, and recovery openings ×1.5. At 30% HP they swap
authored forms, cancel the prior cast, enlarge outer radii ×1.25, widen sectors,
shrink safe inner radii, pursue faster and use ×0.65 cooldowns. Normal mobs do not
inherit the boss enrage system.

These are selectable local combat previews, not multiplayer/group encounters or
world spawns. No community animal, Django record, inventory, payment or verified
Kibble is changed. Shared impact/item sounds and mute are reused. Dedicated
creature vocal packs remain ungenerated; no speech model was selected/downloaded.

## Firefox review and remaining limits

All sixteen selected rigs loaded, started and paused; their scale/identity
captures were inspected. All four mini-bosses displayed distinct phase artwork
using the explicitly labelled HP rehearsal, then reset. A small baseline offset
found in initial captures was corrected and the sixteen model captures refreshed.

Detailed observed combat:

- Sickle Shade: Little Reap applied 13 player damage; a recovery sword strike
  applied 270, leaving 30 HP; a further strike applied the remaining 30 and
  produced defeat. Reset restored 300 creature HP and 100 player HP.
- Bellwarden: Bell Reap applied 22 player damage. Hollow Chime also applied its
  26 damage when Amber stood in the ring. In the final central-position review,
  Amber remained at 100 HP through the ring's active/recovery window. A recovery
  counterattack applied 270. Phase rehearsal set 450 HP, showed the new form and
  expanded area; the equipped ultimate applied the remaining 450 and defeated
  the mini-boss. Reset restored its 1,500 HP and Amber's 100 HP.
- Gloamwarden: a targeted Rift Rupture applied 24 damage at Amber's marked
  position. The normal form and reset remained usable afterward.
- All original parent previews loaded. Vaelrith's existing Full 3D view also
  started/paused. Their complete fights were not replayed.

Screenshots live in `output/playwright/boss-families/`. The four
`*-scale-review.png` sheets compare every family member against the unchanged
Amber. `mini-enrage-review.png` shows the four phase forms. Representative
receipts: `mob-contact.png`, `mob-counter.png`, `mob-defeat.png`,
`mini-scythe-contact.png`, `mini-ring-safe.png`, `mini-counter.png`,
`mini-enraged-area.png`, `mini-defeat.png`, `gloamwarden-rupture-contact.png`.
`*-preserved.png` records the four original previews. `final-ready.png` records
Bellwarden reset and paused.

No automated test suite, lint/type check, production build or skill validator was
run. No browser page errors were reported during the selected workflows. Existing
undefined-material-map/font-preload warnings and deliberate WebGL context-loss
messages during renderer disposal remain. Not verified: every individual mob's
complete fight, every skill's boundary/cooldown cases, natural-damage-only phase
crossings, all reduced-motion/mobile paths or a live multiplayer installation.
