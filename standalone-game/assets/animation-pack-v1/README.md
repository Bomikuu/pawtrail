# PawTrail character and animal animations — v1

Original sprites generated with built-in imagegen, using the previously created PawTrail animal art as palette/style reference. The owner's previously approved pixel-processing workflow was used for the exact-size exports. This pack is separate from the earlier environment collection and does not replace it.

## Files to use

- **`native/rescuer.png`**: 192×576 atlas, six columns, twelve animation rows, **32×48 cells**, 62 occupied frames.
- **`native/<animal>.png`**: eight separate 192×320 atlases, six columns, ten animation rows, **32×32 cells**, 42 occupied frames each.
- **`frames/<identity>/<animation>/<number>.png`**: all **398 individual native frames**.
- **`manifest.json`**: exact rectangles, animation row, frame count, suggested FPS, loop flag, and pivot for all **92 animation rows**.
- **`generation-prompts.json`** and **`prompts/`**: the complete final generation prompt set.
- **`masters/`**: unchanged generated source art, retained for provenance and future art edits. Use the normalized `native/` files in the game rather than these imperfectly packed masters.
- **`tools/export-animations.cjs`**: the repeatable native export process; requires Node.js, sharp, and the adjacent earlier pixel-art pack for its shared palette.

No animation preview, gameplay screenshot, interface, or background scene is included.

## Rescuer design

A friendly young rescuer with short dark-brown hair, warm tan skin, a dusty-teal shirt, tan shorts, comfortable brown shoes, and a small mustard backpack. Warm plum-brown outlines, compact shading, upper-left light, and the same limited palette as the environment.

### Character rows, from top to bottom

| Row (zero-based) | Animation | Frames | Suggested FPS |
| ---: | --- | ---: | ---: |
| 0 | Walk downward | 6 | 9 |
| 1 | Walk upward | 6 | 9 |
| 2 | Walk left | 6 | 9 |
| 3 | Walk right | 6 | 9 |
| 4 | Idle downward | 4 | 4 |
| 5 | Idle upward | 4 | 4 |
| 6 | Idle left | 4 | 4 |
| 7 | Idle right | 4 | 4 |
| 8 | Feeding | 6 | 7 |
| 9 | Petting | 6 | 6 |
| 10 | Picking up an item | 6 | 7 |
| 11 | Sitting | 4 | 4 |

Idle frame counts were not specified in the brief; four frames per direction were supplied. Unused cells at the right of four-frame rows are transparent.

## Animal identities

Orange tabby, black cat, white cat, calico, Siamese, brown Aspin, white puppy, and spotted dog. Each receives the full row set below; no other animal from the earlier collection is substituted.

### Animal rows, from top to bottom

| Row (zero-based) | Animation | Frames | Suggested FPS |
| ---: | --- | ---: | ---: |
| 0 | Standing idle | 4 | 4 |
| 1 | Walk downward | 4 | 7 |
| 2 | Walk upward | 4 | 7 |
| 3 | Walk left | 4 | 7 |
| 4 | Walk right | 4 | 7 |
| 5 | Sitting | 4 | 4 |
| 6 | Sleeping | 4 | 2 |
| 7 | Eating | 6 | 5 |
| 8 | Happy reaction | 4 | 6 |
| 9 | Being petted | 4 | 4 |

Rows contain poses for stepping, blinking, breathing, tail/ear movement, resting, eating, and reactions. No human hand is baked into the animal petting row. Food is contained within eating cells. Unused columns 4 and 5 remain transparent outside the eating row.

## Engine integration

The final sheets have **zero spacing and zero outer margin**. Frame rectangles are exactly `x = column × frameWidth`, `y = row × frameHeight`. The last column index is determined by each animation's frame count, not by the six-column atlas width.

Ground anchors are **(16,44)** for the rescuer and **(16,28)** for animals. One uniform scale is applied across every pose of an identity, so crouching/sleeping poses remain shorter rather than being stretched to standing height. Feet/contact pixels stay on the same baseline. Sprite silhouettes are extracted before repacking to avoid pieces of neighboring rows. Frames have hard binary alpha, nearest-neighbor resizing, and colors mapped to the existing 63-color PawTrail palette.

```js
const animation = manifest.animations['orange_tabby/walk_down']
const frame = animation.frames[Math.floor(elapsedSeconds * animation.fps) % animation.frames.length]
ctx.imageSmoothingEnabled = false
ctx.drawImage(sheets[animation.sheet], frame.x, frame.y,
  frame.width, frame.height, x, y, frame.width * zoom, frame.height * zoom)
```

Draw at integer coordinates and integer zoom, with nearest-neighbor filtering. Loop settings and FPS are supplied as runtime defaults; use a one-shot trigger in gameplay where an action such as item pickup should occur once. Static sheets and export metadata were inspected. Actual in-game motion/loop quality and cross-character interaction placement have not been playback-tested; no animation preview was created, as requested.
