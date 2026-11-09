# In-game original/current actor comparison

Open `/play?compare=actors`, or choose **Your spaces → Compare character styles**
from the shared game header. The comparison uses the existing Phaser game
instance through `runtime/session.ts`, stopping the previous scene while the
comparison is open. Returning to Explore/Home uses the same renderer.

An optional `pose` and `facing` query selects a starting action/direction, such as
`/play?compare=actors&pose=feed&facing=down_right`.

The field shows four explicitly separate sprites: original 2D rescuer and orange
tabby on the left, current baked versions on the right. The original side uses
the preserved native `rescuer.png` and `orange_tabby.png`, not an earlier version
of the new renders. Neither side goes through the appearance overlay binding,
so the intended comparison cannot reintroduce overlapping legacy/replacement
actors into normal play. Both sides use the same actual terrain, native pixel
scale, foot anchors, camera and input displacement.

Action choices are idle, walk, feed/eat, pet, play/yarn, sit, sleep, sad/cry, happy jump,
angry, surprised, laugh, sick, rooftop car ride, disco dance, floating on a cloud
and tired. Facing includes all
eight current directions; original walking/character idle maps to the nearest
available cardinal direction. Other original actions retain their authored
facing. Original sheets lack some newer actions; an idle fallback is explicitly
described in the interface. No new original frames are synthesized.

Synchronized mode matches normalized action cycles while retaining each sheet's
own frames. Game timing uses each original/current manifest frame rate instead.
Pause freezes the current animation phase; Reset restarts both timelines and
recenters the actors. Integer 1×–4× zoom retains nearest-neighbor rendering.
Clicking the field enables WASD/arrow-key movement for both pairs; the holdable
arrow controls also support touch and keyboard activation. Blur/cancellation
clears held inputs. Reduced motion initially pauses playback; Play is an
explicit override. Original/current clips are cached by action and facing.

Controls compose the existing registry shadcn Button, Select and Progress with
the shared game shell/header. Loading and retry states stay in the comparison
field. Scene loading only requests the four actor sheets and existing terrain.
This scene has no platform API calls, claims, care events, saved appearance
changes, reward writes or persistence. No automated tests, checks, builds or
browser verification were run, following the owner's standing instructions.

The current side adds actor-attached pixel rain, confetti, angry symbols,
disco sparkles, clouds, rising Zs and tired cues. Effects share the comparison
clock, so Pause freezes them and Reset restarts them. Unsupported original
poses retain an explicitly described idle fallback rather than invented frames.
At 4× zoom the field grows to leave room above the character for these effects.

The v7 visual refinement moves a dark rain cloud above the head, enlarges the
angry face, uses a puffy white floating cloud, adds a pulsing heart on the cat
being petted, and exposes startled poses and a direction-aware yarn play prop.
These effects remain paused/reset with the comparison clock. Original art is
preserved. No browser verification of the running game was performed.

The v8 selections add **Laugh**, **Sick** and **Car rooftop ride** for the current
pair. A native 80×64, eight-direction vehicle layer shares the comparison clock,
so wheel spin pauses and resets with the rider. Bounds leave space for the car.
The car is cosmetic, and movement returns the actor to walking. No changes are
made to the preserved original sheets; unsupported original poses show idle.
See the [car art preview](../../assets/animation-approval-v1/previews/car-rooftop-preview.gif).
