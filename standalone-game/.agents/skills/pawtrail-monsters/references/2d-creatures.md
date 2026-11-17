# Native 2D creatures and fair comparisons

Choose complete frame-by-frame sprites when anatomy changes strongly between
poses. Use layered cutouts for independently moving heads, necks, jaws, eyes or
limbs. A wall-anchored boss can mix a mostly static socket/body with articulated
illustrations and authored attack/hurt expressions. Reuse approved profile,
portrait, icon and illustration during a focused representation revision.

## Artwork and registration

Generate missing raster parts through the available image-generation workflow.
Retain true alpha, creature identity, outlines, material divisions and consistent
lighting. Each part needs adequate native detail for the actual gameplay scale.
Keep complete silhouettes and transparent padding within atlas cells. Do not
paint a poster and call it an articulated sprite package.

Record frame dimensions, counts, parts/state indices, pivots, contact points,
layer order and source provenance in the native manifest. Align eyes, skulls and
attachment points between expressions. Keep jaw/neck joins hidden by deliberate
overlap or masks; do not let cell padding create gaps or introduce unrelated
scaling between poses. Unseen backs/angles need not be generated for a fixed view.

## Motion and contact

Separate anticipation, active motion, recovery, idle, hurt/stagger and defeat.
Layered transforms may interpolate between authored poses and add restrained
follow-through; meaningful silhouette/expression changes need actual artwork.
Do not label scalar pose samples as generated animation frames. More frames alone
do not guarantee better timing, and baking a stiff 3D clip preserves stiffness.
Keep roots fixed where anchored. Reduced motion suppresses secondary sway and
recoil but retains readable gameplay position, attack windows and status.

Bind hurt areas, mouths and impact effects to the same animated part anchors.
Sprite rectangles and transparent margins are not collision regions. Keep ground
telegraphs in world coordinates, distinct from apparent screen-space head size.
Confirmed hits need contact sprites plus applied damage/HP feedback. Misses,
blocked casts, cooldowns and cancellations must not fake a successful impact.

## Comparison and resource scope

Painted textures on real creature geometry are still live 3D. Do not call that
native sprite work or imply that removing textures alone creates a new model.
An optional full-3D material comparison can reuse the approved rig with solid
light-driven materials and an unfiltered render. Label geometry, material style,
pixel filtering and creature/arena scope accurately. Keep extra subdivision,
render resolution and shadow maps bounded; retain required impact sprites.


Reuse one encounter controller, player scale, HP, attack timing, abilities and
feedback. Change only presentation and the camera constraints it actually needs.
Explain whether only the creature is 2D or the whole arena/renderer is 2D. A flat
creature in the existing 3D arena is a valid native-2D creature comparison; it is
not a zero-WebGL implementation.

Prefer a selector that disposes the outgoing version and resets to a clearly
stated starting state. Do not load two expensive renderers merely to show a
comparison. Share atlas sources, reuse parts/materials and bound effects. Record
compressed and decoded atlas sizes; native 2D is not automatically lower memory.
Keep nearest-neighbor rendering and integer output zoom. Dispose all owned
textures/materials and cancel motion/effects on unload.

Review the changed scope only when authorized: part seams, readable poses,
maximum reach, anchored roots, actual hit/weak-point alignment, pause/reset and
resource ownership. Never infer a smooth/live result from source or poster art.
Do not run tests, builds or browser checks without the workspace's authorization.
