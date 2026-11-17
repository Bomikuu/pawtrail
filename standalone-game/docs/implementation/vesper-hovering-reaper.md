# Vesper — the Hollow Reaper

Open `http://127.0.0.1:5173/play?preview=monsters&boss=vesper` (the `boss=reaper`
alias also works), or select **Your spaces → Vesper · hovering reaper**. Load the
arena, then Start. WASD/arrows move, Shift runs, J strikes, K uses the equipped
sword ultimate, Escape pauses and the wheel zooms. Attack rehearsal, labelled
low-HP phase rehearsal, mute, touch controls and reset use the existing workspace.

## Reference and artwork

The supplied `/home/micxsz/pawtrail-scythe-skeleton-reference.jpg` guided the
pointed dark hood, grinning skeletal face, indigo/purple-lined ragged robe,
skeletal hands and oversized twisted-shaft silver scythe. Vesper's name,
bell-chapel biography, spectral binding and combat timings are original additions.

Built-in ImageGen generated the normal/enraged illustrations and matching cutout
atlas. Masters, prompts, profile and native manifest are retained in
`assets/monster-studio/vesper-hollow-reaper/`. The production script exports
hard-alpha, nearest-neighbor, non-dithered lossless WebP artwork under
`public/pawtrail-game/monsters/vesper-hollow-reaper/v1/`.

Five runtime artwork files total **189,952 bytes (185.5 KiB)**, excluding metadata
and reused Amber, sword and impact assets. Generation masters are not loaded by
the game. The 1,024×1,024 atlas has sixteen 256×256 cells: eight normal cutouts and
eight independently drawn enraged counterparts. The body is native layered 2D,
with a fixed three-quarter view and zoom; unpainted rear views are not claimed.

## Rig and movement

Vesper pursues while hovering, with no walking feet. Its head, torso, two sleeves,
two ragged robe panels, scythe and slash afterimage have explicit layer order and
separate motion. A grounded shadow stays below the floating body. Normal hover
is 0.37 player heights, with a subtle bob; Eclipse rises to about 1.27 heights.
The robe and sleeves sway, and the scythe visibly winds back, sweeps and recovers.

Character-specific hand, shoulder and weapon-grip UV anchors are stored in the
manifest. The holding sleeve rotates about its shoulder; the scythe's pivot
follows the actual rotated hand point in the arena camera's billboard basis.
The large blade therefore remains attached through its swing. It is boss-owned
artwork, not a new player-loot or Item Studio equipment export.

## Encounter and authority

There is one 4,800 HP pool, shown as eight 600 HP bar stacks. The spectral shroud
takes ×0.7 damage; low-hover recovery exposes the binding for ×1.65. High Eclipse
hover and the phase transition are out of sword reach. One accepted strike is
deduplicated; actual contact plays the shared animated impact sprite with applied
damage numbers and HP feedback. Casts, missed attacks and high-hover targets do
not fabricate successful damage.

| Behavior | Normal | Enraged at ≤1,440 HP |
| --- | --- | --- |
| Hover pursuit | 1.45 player heights/s | 2.05 player heights/s |
| Crescent radius / angle | 3.1 / 150° | 4.0 / 195° |
| Crescent cooldown | 7.2 s | 4.3 s |
| Eclipse inner / outer radius | 1.4 / 4.4 | 1.1 / 5.4 |
| Eclipse cooldown | 11.2 s | 6.8 s |
| Rest between moves | 1.2 s | 0.65 s |

Reaping Crescent locks a ground sector, warns for 1.15 seconds, applies one
contact at 1.4 seconds and leaves recovery after the swing. Moving behind Vesper
or beyond the outer boundary avoids the sweep. Hollow Eclipse locks an annulus,
warns for 1.65 seconds and applies contact once at 1.9 seconds. Its clear center
and space beyond the outer radius are safe. Raised hover is mechanically
unreachable, rather than a cosmetic label.

The same `ReaperArea` origin, radii, facing and angle drive contact and the visible
sector/ring. Four preallocated warning meshes cover normal/enraged variants;
boundaries are drawn from the same dimensions. Amber warnings turn violet during
the active window. The slash ribbon is a cast visual; confirmed damage separately
uses the existing contact-sprite pool at the affected target.

At 30% HP, a one-shot transition cancels the previous cast, swaps hood/robe/weapon
art and briefly shows the matching enraged illustration. Wider sectors, expanded
rings, faster pursuit and shorter cooldowns then become active. Phase rehearsal
sets real local preview HP to 30% and records neither a hit nor a reward. Pause
cancels hazards; reset restores both HP pools, low hover, normal art, cooldowns
and phase state. Exit disposes the rig, field meshes, textures, RAF and listeners.

This is a playable local fictional-combat arena using the real Amber rig,
movement, equipped sword and shared AbilitySession, not a persistent world spawn.
No animal record, account inventory, payment or verified Kibble total is changed.
Kaedros and Morvane retain separate rigs/simulations/assets in the shared workspace;
Vaelrith retains its existing anchored encounter. The social worktree is untouched.

## Requested review and limits

Firefox visual interactions and screenshots were requested. No automated test
suite, lint/type check or production build was run.

Observed in Firefox using the actual preview controls and player input:

- Normal hovering, the attached scythe windup/swing and the locked sector warning.
  The normal Crescent applied 26 HP damage to Amber.
- A recovery counterattack reduced Vesper from 4,800 to 4,503 HP, with the −297
  exposed-binding receipt, applied health change and animated contact effect.
- Eclipse's amber annulus turned violet in its active window. Amber retained
  100 HP in the clear center through recovery; a separate ring contact applied
  30 HP damage and left Amber at 70 HP.
- The explicitly labelled phase rehearsal set Vesper to 1,440 HP and showed its
  distinct enraged body/scythe artwork and illustration cut-in. Both the larger
  Crescent sector and expanded Eclipse ring were observed. This verifies the
  rehearsal transition, not a threshold reached through ordinary sword damage.
- Reset returned the normal artwork, 4,800 boss HP, 100 player HP, cleared attack
  indicators and available cooldowns. The page was left paused and reset.
- Navigation to Kaedros and Morvane still loaded their original arena rigs,
  illustrations and respective 3,600/6,000 HP displays, then returned to Vesper.
  Their complete fights were not repeated in this final review.

Reviewed captures under `output/playwright/vesper/`:

| Capture | Evidence |
| --- | --- |
| `crescent-warning.png` | Normal scythe pose and sector warning |
| `counter-hit.png` | Applied −297 binding damage; Amber at 74 HP |
| `eclipse-active.png` | Violet active annulus and clear center |
| `safe-center.png` | Recovery with Amber still at 100 HP |
| `eclipse-hit.png` | Applied −30 Eclipse damage; Amber at 70 HP |
| `enrage-cut-in.png` | Distinct phase illustration and 1,440 HP rehearsal |
| `enraged-crescent.png` | Enlarged enraged sector and charged scythe |
| `enraged-eclipse.png` | Expanded enraged ring and high hover |
| `kaedros-preserved.png` | Existing Kaedros arena loaded |
| `morvane-preserved.png` | Existing Morvane arena loaded |
| `reset.png` | Normal form and full health, left paused |

These are browser interaction reviews and inspected screenshots, not an
automated regression suite.

Limits: no complete defeat run, ordinary-combat-only threshold crossing,
exhaustive border/collision sweep, reduced-motion runtime or small-screen review.
Shared model loading may emit the existing nonfatal undefined-material-map
warnings. Shared item/contact sounds and mute are available; dedicated creature
vocal cues were not produced.
