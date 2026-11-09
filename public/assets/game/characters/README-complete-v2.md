# PawTrail player catalog v2

Ten appearance sheets contain 27 action rows per appearance: eight movement/idles, nine social gestures, six animal-care actions and four decoration actions. Each action has four generated frames. Total: 270 strips, 1,080 frames at 32×48. The glasses rescuer, three hair-color variants, and three distinct male rescuers were added on 7 November 2026 with matching portraits.

- Rescuer: short dark hair, medium-brown skin, sage shirt, rust shorts and tan backpack.
- Jacket rescuer: curly black hair, deep-brown skin, teal jacket, charcoal trousers and rust backpack.
- Braided rescuer: light warm-tan skin, chestnut braid, cream hat, ochre shirt, forest pants and sage backpack.
- Glasses rescuer: a young woman with round dark-brown glasses, dark ponytail, sage overshirt, cream tee, rust shorts and ochre backpack. Sources and exact prompts are under `animations/glasses-rescuer/`.
- Blonde rescuer: a golden blonde hair variant of the glasses rescuer.
- Violet rescuer: a lavender/violet hair variant of the glasses rescuer.
- Redhead rescuer: a copper-red hair variant of the glasses rescuer.
- Blonde scout: a man with tousled blonde hair, a denim jacket, charcoal shorts, and a sage backpack.
- Violet volunteer: a man with curly violet hair and glasses, a mustard hoodie, navy trousers, and a rust backpack.
- Copper gardener: a man with side-swept copper-red hair, a terracotta tee, green overalls, and a navy backpack.

The three color-variant sources and exact built-in Imagegen edit prompts are retained in `assets/character-colors-v1/` at the workspace root. Their native exports are under each variant's `animations/` directory. See `docs/implementation/character-colors.md` for generation and regeneration details. These variants add a compact hair-color ramp to the incumbent palette; no existing images were replaced.

The three male character sources and exact prompts are in `assets/male-characters-v1/`. Their full action sets use the same cell layout, with hair and outfit ramps added to the existing palette. See `docs/implementation/male-characters.md` for saved files, selection, and regeneration. The picker shows a matching portrait for the selected appearance when available.

`complete-characters-manifest.json` indexes per-appearance manifests and actual native PNGs under `animations/`. Original source renders and exact built-in imagegen prompts/jobs are retained. Source alpha row bands were inspected/detected before extraction, so the manifests record actual source rectangles rather than assuming uniformly spaced rows.

A targeted imagegen edit repaired the jacket-care sheet's shorts/long-trouser mismatch. The bottom holding-item rows in dense social sheets had cropped feet; separately generated four-frame holding strips supplied native bottom shoe pixels only, retaining each original upper-body pose and identity. Original pre-repair sources remain available.

Native exports use binary transparency, nearest-neighbor sampling, palette cleanup and foot baseline y46. Every action has at least two distinct native frames; all frame dimensions/transparency/nonempty-cell checks were inspected. These counts do not certify smooth looping. Walking and idle rows repeat; social/care/decoration rows are one-shot transitions with final-pose hold available to a future engine.

Production readiness remains false. Wide-prop and wide-arm rows are fitted into the required 32-pixel width and consequently can have smaller heads than movement rows. Perfect cross-action proportions need pixel rigging/art refinement. There are no modular clothing layers; separate appearance spritesheets provide the appearance variants. The game now offers these appearances in exploration and multiplayer Homes. The new glasses appearance was exported and visually inspected as artwork without automated checks or a playback review.
