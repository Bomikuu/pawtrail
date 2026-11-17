# Kaedros — the Embermaw Hydra

Play in the standalone game at
`http://127.0.0.1:5173/play?preview=monsters&boss=kaedros`.
The game header's **Your spaces → Kaedros boss arena** opens the same encounter.
Vaelrith retains its existing route and implementation.

This is local fictional combat, using the actual Amber character, movement,
equipped training sword, shared AbilitySession contact detection, contact-sprite
pool and bounded damage feedback. It does not mutate real community animals,
account inventory, database rewards or verified Kibble. It is installed as a
playable boss arena, not as a persistent world-map spawn.

## Reference and representation

The supplied `/home/micxsz/pawtrail-boss-reference.jpg` guided the five horned
green heads, segmented cream throats, four-legged body, red bat wings and tail.
The name, biography, fire patterns and ember-cracked enrage are original encounter
design. Normal and enraged illustrations and their registered cutouts were made
with the built-in ImageGen tool. Masters, prompts, profile and the native manifest
are retained under `assets/monster-studio/kaedros-embermaw/`.

The creature is a native illustrated cutout rig in the existing Three.js arena
renderer. It has articulated necks, closed/roaring head artwork, walking leg
motion, breathing, tail sway and wing motion. The camera is fixed three-quarter
with zoom, appropriate for the supplied art; it does not promise unpainted rear
views or a freely orbiting 3D hydra. Amber retains her real 3D rig and scale.

The 512×512 part atlas has sixteen 128×128 cells: eight normal parts and eight
matching enraged parts. Nearest-neighbor rendering and integer canvas display
zoom are retained. The export script slices approved masters, removes detached
neighbouring-cell fragments, trims open neck attachment ends for overlapping
links, reduces the palette without dithering and writes lossless WebP.

New runtime artwork totals **177,314 bytes (173.2 KiB)** including the atlas,
two 384×384 illustrations, portrait and compact icon. Shared Amber, sword,
flame and impact assets are reused and are additional cached dependencies.

## Encounter

There is one 3,600 HP pool, displayed as six 600 HP bar stacks. Grounded armored
contact takes ×0.75 damage. The chest takes ×1.65 damage during attack recovery.
Airborne and phase-transition targets are ineligible. Per-strike IDs prevent
duplicate hits; an accepted hit produces an actual impact sprite and applied
damage/HP feedback.

| Behavior | Normal | Enraged, at ≤1,080 HP |
| --- | --- | --- |
| Chase speed, player-height units/second | 1.25 | 1.8 |
| Sustained fire | 3.2 seconds, alternating heads | 4.2 seconds, two outward fans per pulse |
| Fire pulse interval | 190 ms | 125 ms |
| Fire cooldown from cast start | 8.5 seconds | 5.4 seconds |
| Stomp cooldown from cast start | 11.5 seconds | 6.9 seconds |
| Central stomp radius | 1.65 player heights | 2.35 player heights |
| Additional stomp hazards | None | Three radius-1.1 satellite blasts |
| Rest between moves | 1.7 seconds | 0.85 seconds |

Fire travels from registered head heights toward the player's ground plane.
Swept contact and projectile height gate damage; embers do not hit merely
because an attack started. The pool is bounded to eighty projectiles, and player
damage has a 400 ms invulnerability interval. The existing generated animated
flame atlas supplies visible fire, with shared contact sprites on confirmed hits.

Skyfall locks its landing location when announced. Its one-second warning is
followed by takeoff, airborne travel and descent, with a grounded shadow and
matching ground circles. Damage occurs once on landing. The exact same circle
definitions drive warnings and contact. Movement remains available for evasion.

The HP threshold invokes a one-shot, 1.8-second enrage transition: old casts and
embers are cancelled, matching enraged cutouts replace normal artwork, a brief
illustration cut-in appears, and the changed pattern resumes. A clearly labelled
rehearsal button sets real local preview HP to 30%; it does not fabricate a hit.

Pause cancels pending hazards. Reset restores both HP pools, normal artwork,
phase/cooldown state, player placement, weapon state and transient effects.
Exit disposes the rig, textures, materials, controls, audio, RAF and listeners.
Movement starts immediately, independently of audio permission. The native
WebGL canvas and a separate feedback overlay avoid Firefox's WebGL-to-Canvas2D
color-copy issue observed during review.

## Controls and observed review

Load the arena, then Start. WASD/arrows move; Shift runs; J strikes; K uses the
equipped sword ultimate; Escape pauses; the wheel zooms. Touch direction controls,
attack rehearsal, mute, camera reset and encounter reset are available.

Requested narrow Firefox visual review used Playwright CLI interactions and
screenshots. No test files, automated test suite, lint/type checks or production
build were run.

Observed:

- Normal rig, real player movement/chase, sustained fire, and player HP damage.
- Sword contact reduced boss HP from 3,600 to 3,465 and displayed the armored
  impact and −135 receipt.
- Takeoff, airborne relocation, grounded shadow, landing marker, and −26 player
  damage on a normal stomp.
- Rehearsed low-HP phase, changed live artwork, illustration cut-in, fire fans,
  shorter displayed cooldowns, and the enlarged stomp plus three satellite areas.
- Reset restored 3,600 boss HP, 100 player HP and normal phase.

Evidence is under `output/playwright/kaedros/`: `normal.png`, `normal-fire.png`,
`normal-flying.png`, `normal-contact.png`, `sword-contact.png`, `enraged.png`,
`enrage-cut-in.png`, `enraged-fire.png`, `enraged-stomp.png` and `reset.png`.

Not exhaustively reviewed: a complete defeat run, crossing the enrage threshold
solely through ordinary combat, all evasion/weakness edge cases, reduced-motion
runtime and small-screen input. Existing nonfatal `THREE.Material` undefined-map
warnings appeared during shared-model loading; no fatal arena error was observed.
Six dedicated creature vocal cues remain pending; shared item/contact sounds
and mute are implemented. The social application worktree was not overwritten.
