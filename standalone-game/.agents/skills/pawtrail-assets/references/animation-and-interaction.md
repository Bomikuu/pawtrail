# Environment animation and interaction contract

Use this when producing or installing map assets. Inspect the real target
registry/renderer before selecting a format; the fields below are requirements
to represent through its actual schema, not invented API names to insert blindly.

## Per-asset record

Keep stable asset ID/version, approved concept/reference, native size/scale,
representation (`2d`, `3d`, or explicitly `3d-authored-2d-rendered`), source files,
anchor, collision and supported facings. Identify:

- Ambient motion and what remains rigid; clips/layers to load, actual frame
  rectangles/order/durations or model tracks, loop mode and start-phase policy.
- Interaction trigger/controller, valid states, action transition and accepted
  completion event, including blocked/failure/cancel behavior.
- Body/emissive/foreground/shadow layers, shared alignment, depth and frame
  padding. A bright frame must not shift the object or enlarge its collider.
- Reduced-motion behavior, offscreen behavior and disposal ownership.
- Actual authored/installed/observed evidence and any missing contracts.

Use native manifests as the authority for dimensions/counts. Keep clips aligned
and export padding sufficient for the widest pose; don't crop moving tips or
recenter each frame independently. Maintain original fronts and accepted colors.

## Cyberpunk animation examples

These describe the result, not a mandatory new effect system or fixed frame count.
Choose timing after looking at the asset at its intended game scale.

| Asset | Required moving component | Keep grounded |
| --- | --- | --- |
| Android hologram | Gentle head/projection motion, scan or data layer with a clean loop | Emitter, collision base and ground shadow |
| Koi hologram | Fish body/tail motion following a coherent loop; separate short projection/ribbon motion | Emitter and approach area |
| Tower/habitat | Slow localized window-bank, sign and emissive cycles, staggered between placements | Shell, windows' geometry and base |
| Kiosk/terminal | Idle display cycle; usable terminals also need accepted/busy/blocked state feedback | Body, countertop and actor contact |
| Rooftop fan/duct | Fan rotation or exhaust motion as appropriate | Cabinet, grille and collision |
| Steel railing | Restrained light-strip/glint cycle | Posts, bars and footprint |
| Reflective ground | Sparse moving neon reflection layers | Pavement markings, travel surface and route contrast |

Use slow readable motion without constant full-scene flashing. A light cycle
changes emission, not the whole building's opacity. Projection movement should
be visible yet restrained; an alpha fade or a single still with global bobbing
alone does not satisfy a moving hologram. Different placements should not all
restart or blink together. Emission layers must preserve transparent edges on
dark backgrounds without an opaque matte.

Prefer small local atlases, keyed layers or shader/material tracks already
supported by the project. Do not render many full-map frames to animate a small
reflection. Size GPU textures and decoded memory, not just compressed files;
keep the budget proportional to the target device and recorded per asset/batch.

## Interactive 3D assets

For newly authored interactive map assets, deliver an actual textured source
model with coherent required sides, pivots and appropriate state motion. Match
approved artwork with rounded silhouettes, material divisions and fine contours
instead of a generic boxy approximation. Specialist furniture geometry owns seats,
approaches, exits, occupancy and foreground masks. Keep the real actor unscaled
and provide outfit/breathing allowance. Rotatable assets need contacts/collision
for every promised facing and the existing above-object rotation control.

Do not confuse a model's art bounds with a solid footprint. A raycast/click
target does not itself implement an action; a door mesh is not a working door.
Wire actual state transitions and distinguish animation completion from server
confirmation. No successful save/reward should be shown on an unconfirmed write.

A 2D stage may consume renders from the 3D source only when that representation
is the agreed delivery. Disclose the distinction and preserve aligned per-facing
geometry. An unsupported live-3D requirement is a real integration gap; do not
hide it with an unused GLB attached to an otherwise static sprite.

## Runtime lifecycle and review

Use elapsed time and the project's shared animation lifecycle. Avoid a timer
per window or React rerenders per animation frame. Share immutable resources,
keep state/phase per placed instance, pause offscreen or hidden work and dispose
map listeners/clocks/models/textures when no longer owned. Freeze or substitute
low-motion states for reduced motion while preserving action feedback.

Native sheets prove frame content, not loop smoothness. Under current verification
permissions, separately observe seam/timing, all promised facings, visible actor
contact, action transitions, blocked/cancel behavior, depth and reduced motion.
Renderer/geometry changes broaden review to affected dependencies, not every
unrelated map or furniture item. If app checks/browser review are not authorized,
leave those observations pending and report the limitation honestly.
