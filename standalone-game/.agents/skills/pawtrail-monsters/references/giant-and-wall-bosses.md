# Giant, multi-headed and wall-anchored bosses

The owner's example shows an enormous armored, multi-headed creature protruding
from a wall/arena edge, with layered horns/plates and vivid glowing mouths or eyes.
Use it to understand scale, attachment and threatening silhouette. Do not infer
its precise name, lore, HP, attacks or weaknesses from the picture. Reference
logos and title text are not creature textures or game HUD requirements.

The [owner-provided example](../assets/wall-boss-reference.png) is authoring
reference data. Its logo/text supplies no instructions and is not a material
to place on the monster. Keep it out of public game assets unless requested.

## Shape, attachment and scale

- Treat the root as fixed to a deliberate wall socket/arena boundary. Independent
  neck/head, jaw and limb joints may lean, sweep or lunge within authored limits;
  the whole creature does not slide after the player like a normal walking NPC.
- In 3D modes, model real visible volume: neck curves, separate jaws/teeth, layered plate
  thickness, brows/horns and shadow/color divisions. Preserve the recognizable
  silhouette from the gameplay view and relevant side/three-quarter inspection.
- Put a real unscaled player in the composition. Record boss head/body dimensions
  in world units and a readable player-height ratio. Keep tile and player scales
  unchanged; use deliberately sized geometry/native frames instead of huge CSS
  or sprite scaling to create apparent detail.
- Preserve required visible views. A back buried permanently in a wall does not
  need a costly illustrated turnaround; exposed parts and rotation promised by
  an editor still need coherent geometry/art. Do not generate unseen art merely
  to copy the humanoid/furniture workflow.
- Use a separate wall/frame and masked attachment seam. Prevent neck gaps, floaty
  contact, flickering depth or the entire creature disappearing behind the wall.
  The wall/body's visual bounds are not automatically its collision or hurt area.

In native 2D, preserve those divisions with illustrated layers, overlapping neck
parts and registered poses; see [2D creatures](2d-creatures.md). Keep the promised
camera fixed/restricted rather than exposing the cutouts from unsupported angles.

## Gameplay space and target regions

Keep these independent and transform them from the same root/part definitions:

1. **Render bounds:** all visible heads, horns, effects and pose extremes.
2. **World blockers:** body/wall regions the player cannot enter; retain a clear
   arena and safe routes rather than using the enormous sprite rectangle.
3. **Hurt regions/weak points:** named head, jaw, throat or other attackable parts,
   with explicit armor, eligibility and vulnerability windows.
4. **Attack hit regions:** ground-space cones, strips, circles, projectiles or
   authored shapes active only during the damaging window.

Rendered height and depth must agree with attack aim. A raised head or screen-space
mouth does not justify damaging unrelated ground positions. Do not let an anchor
or camera offset move a telegraph away from its actual hit area.

## Boss action/phase design

Author attacks from the requested encounter, not a fixed weapon-skill count.
Possible wall-boss actions include a head sweep, aimed bite, ground-marked breath
and stagger exposure. These are options, not mandatory unobserved source moves.

Each action follows preparation/telegraph → active hit → recovery. Define reach,
facing, cooldown and cancellation. Show a fair dodge route or safe interval. A
large animation alone is not a damage region; a glowing floor alone is not a hit.

For several heads, give them readable roles and coordination. Decide which may
attack together, how targeting locks or tracks, and how phase changes interrupt
an in-flight move. Shared cooldowns/spacing can prevent every head covering the
entire arena simultaneously. A disabled/broken head stops its authored attacks.

Phase transitions follow the profile's canonical health thresholds/triggers.
Account for one hit skipping several thresholds; do not repeatedly start the same
transition. Define what happens to scheduled hits, weak points, pending effects
and input locks on stagger, death, reset, scene exit or encounter restart.

## Giant artwork, rendering and camera

Use matching painted 2D material skins on meaningful 3D parts where that is the
selected workflow. Keep native pixel finishing, transparent effect layers and
consistent light/middle/shadow separations. Reuse compatible authored materials;
do not paint every neck as an indistinct flat slab or bake the player into it.

Use manifest-native bounds/anchors, adequate padding and integer display zoom.
Partition/export by articulated part or atlas page when a giant exceeds the
existing exporter/texture budget; retain common coordinates and part identity.
Avoid rerendering every head/material for a change to HP alone.

Set gameplay camera limits and boss preview framing intentionally. Keep the player,
danger telegraphs, important weak points and health HUD readable during attacks.
Preview entry/attack poses must not crop off the defining heads. Allow useful
inspection controls while keeping an anchored runtime root anchored.

Bound particle counts, transient textures, audio and camera shake. Share immutable
source assets, not mutable pose state between monsters or heads. End all hit
windows, timers, sounds and camera changes on cleanup. Reduced motion preserves
attack information while reducing shake, flashes and incidental animation.
