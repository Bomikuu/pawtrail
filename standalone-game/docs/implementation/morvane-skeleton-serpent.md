# Morvane — the Ossuary Serpent

Open `http://127.0.0.1:5173/play?preview=monsters&boss=morvane`, or choose
**Your spaces → Morvane · skeleton serpent**. Load the arena, then Start.
WASD/arrows move, Shift runs, J strikes, K uses the equipped sword ultimate,
Escape pauses and the wheel zooms. Touch movement, individual attack rehearsal,
phase rehearsal, mute and reset are available.

## Reference and authored package

The supplied `/home/micxsz/pawtrail-skeleton-snake-reference.jpg` guided the
crowned skull, red eyes, detached lower jaw, ribbed neck, pointed forearms and
many skeletal legs. The long coiled serpent, name, biography, attacks and crimson
marrow phase are original adaptations of that reference.

Built-in ImageGen generated matching normal/enraged illustrations and a registered
sixteen-cell cutout atlas. Masters, prompts, profile and native manifest are in
`assets/monster-studio/morvane-ossuary-serpent/`. The production export script
retains transparency, removes soft halo alpha, registers limb attachment axes,
slices individual ribs, uses nearest-neighbor resizing and reduces the palette
without dithering. Runtime artwork is under
`public/pawtrail-game/monsters/morvane-ossuary-serpent/v1/`.

The five runtime art files total **197,263 bytes (192.6 KiB)**. This excludes
metadata and reused Amber, weapon and impact assets. Generation masters are not
downloaded by the game. A single atlas supplies all repeated ribs and limbs.

## Gameplay and scale

Morvane has 33 body joints at 0.6 actual player heights per joint: a **19.2-player-
height centerline**, plus its crowned skull and forearms. Amber retains her actual
rig scale. Each joint follows the previous one at its authored spacing, so turns
uncoil the body behind the head. Leg cycles follow travelled distance, with
mirrored left/right artwork, tapered ground contacts, rib motion and body shadows.

The fixed three-quarter native cutout presentation matches the existing pixel
boss style. It supports zoom, not arbitrary unpainted rear views. The creature
uses a dedicated skeletal hierarchy rather than a stretched rescuer model.

There is one 6,000 HP pool, shown as ten 600 HP bar stacks. The high skull is
unreachable until lowered during a bite or recovery; skull recovery contact deals
×1.65 damage. Ribs take ×0.65. Separate narrow collision circles follow the actual
spine, and separate hit regions cover its skull and ribs. Transparent limb margins
do not become solid rectangular obstacles. A strike cannot multiply damage by
hitting many segments of the same shared HP pool.

| Move | Normal | Enraged at ≤1,800 HP |
| --- | --- | --- |
| Pursuit | 1.65 player heights/second | 2.3 player heights/second |
| Gravebite | 1.1 s warning, 1.05 radius, 6.5 s cooldown | 1.5 radius, 4 s cooldown |
| Ribwave | 0.8-radius areas along every third segment, 45 ms propagation interval, 11 s cooldown | 1.12-radius areas along every second segment, 35 ms propagation interval, 7 s cooldown |

Gravebite locks a visible ground location, lunges, applies contact once at 1.4 s
and leaves a recovery opening. Ribwave locks its circles along the body, then
activates them in sequence; each area may confirm contact once, with a 500 ms
player invulnerability interval. The same circle data drives warnings and damage.
Confirmed hits use the existing animated contact-sprite pool, applied damage
numbers and HP receipts. Casts and misses do not fabricate successful damage.

Low health invokes a one-shot 1.8 s enrage transition, cancelling incompatible
casts and swapping to independently authored cracked/crimson cutouts. Its matching
illustration appears briefly, then faster pursuit and the changed pattern resume.
The labelled phase-rehearsal button sets real local preview HP to 30%; it records
neither a hit nor a reward. Reset restores both HP pools, normal art, the initial
coil and cooldown/phase state. Pause and exit cancel hazards and release resources.

## Reuse and installation scope

Kaedros and Morvane share the same arena workspace, real Amber rig, movement,
equipped sword, AbilitySession hit engine, impact sprites, feedback, camera,
controls and lifecycle. Boss definitions, simulations and artwork remain separate;
only the selected boss allocates its rig and optional hazard assets. Kaedros keeps
its original attacks and assets. Vaelrith keeps its separate anchored encounter.

This is a playable local fictional-combat arena. No community animal, database
record, account inventory or verified Kibble total is changed, and no persistent
world-map spawn is claimed. The social application worktree was not overwritten.

## Requested visual review

Firefox was used for narrow browser interactions and screenshots. No automated
test suite, type/lint check or production build was run.

Observed during review:

- The initial giant coiled rig and the body following the chasing head.
- Amber running left while Morvane turned and followed her moving position.
- Normal bite contact reduced Amber from 100 to 76 HP, with contact feedback.
- A recovery counterattack reduced boss HP from 6,000 to 5,703, with the −297
  exposed-skull receipt and contact sprite.
- Rehearsed low-HP art, the matching illustration cut-in, a 32-damage enraged
  bite and the travelling, expanded rib-wave areas.
- Kaedros loaded through the shared workspace and its fire attack still applied
  an 8 HP hit. Switching back to Morvane restored the correct boss and reset
  restored its 6,000 HP, Amber's 100 HP, initial coil and normal phase.

Screenshots are in `output/playwright/morvane/`: `normal.png`, `chasing.png`,
`contact.png`, `turning-chase.png`, `enraged.png`, `enrage-cut-in.png`,
`enraged-wave.png`, `kaedros-regression.png` and `reset.png`.

Limits: no complete defeat run, ordinary-combat-only threshold crossing,
exhaustive edge/collision sweep, reduced-motion runtime or small-screen review.
Shared model loading emitted the existing nonfatal undefined-material-map
warnings. Dedicated creature vocal cues were not produced; shared item/contact
sounds and mute are available. Source-level cleanup and reduced-motion paths
are implemented, but are not presented as exhaustively exercised evidence.
