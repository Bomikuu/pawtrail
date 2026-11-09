# PawTrail animation approval — first pair

One original rescuer and one orange tabby, prepared for visual approval before
expanding the character collection or changing live game assets.

The owner approved this first visual direction and requested an in-game pilot.
The pair is now installed for walking/idle trials; see
[runtime integration](../../docs/implementation/baked-actor-pilot.md).

## Previews

- [Idle animation](previews/idle-preview.gif)
- [Walking animation](previews/walk-preview.gif)
- [All eight directions](previews/all-directions.png)

The preview enlargement is exactly 4× nearest-neighbor. Captions and the cream
backdrop are presentation only; exported sprites have transparent backgrounds.

## Direction and scope

The supplied RPG reference guides the compact silhouette, dark one-pixel contour,
simple face, limited shading and clear clothing shapes. PawTrail's brown hair,
teal shirt/backpack, brown vest, orange shorts and orange-tabby markings remain.
This is an art-direction draft, not a claim that the user has approved the match.

The initial pair supported idle breathing/blinking and walking, with cat tail
motion. The owner subsequently requested in-game integration and the remaining
actions for this pair. The same rigs now export twenty-six rescuer actions and
twenty-three cat actions, including care, sitting, sleeping and reactions. Other
characters remain outside this pass.

## Source and exports

The pipeline is **articulated 3D source → fixed orthographic render → native pixel
frames → palette and one-pixel outline pass**. The GLBs contain named rigid joint
hierarchies and all authored action clips. They are editable 3D sources,
not weighted deforming meshes and not flat images pretending to be 3D models.

| Actor | Native cell | Sheet | Frames per action/direction |
|---|---|---|---|
| Rescuer | 32×48 | 1024×3840 | 8 or 12, manifest-defined |
| Orange tabby | 32×32 | 1024×2336 | 8 or 12, manifest-defined |

Each sheet has thirty-two columns, keeping each animation in a horizontal
row. Core care/rest clips, expressive emotes and the rescuer walk use twelve
frames; other clips use eight. Unused cells provide padding where an animation cannot fit.
Direction order is down, down-left, left, up-left, up, up-right, right,
down-right. Each direction lists its actions in `source/actions.json` order.
Idle plays at 4 fps. Rescuer walking uses twelve frames at 15 fps, while the
cat retains eight at 10 fps; both walking loops last 0.8 seconds. Care, reactions and one-shot behavior
use their own rates/repeat settings in that file. Runtime frame ranges are
recorded in each manifest. The action preview is
[here](previews/actions-preview.gif).

Actor folders under `exports/` contain:

- `source-rig.glb`: editable articulated model and its authored action clips.
- `frames/`: native transparent renders before the contour/palette pass.
- `sprites/`: finished transparent native PNG frames.
- `spritesheet.png`: finished native sheet.
- `manifest.json`: frame geometry, animation ranges, palette and ground anchor.

Every frame uses the same camera and cell origin. No individual frame is
automatically cropped or recentered. Preserve the manifest ground anchor when
integrating; cell padding is intentional.

## Reproducing the art export

From the workspace root, run `node scripts/render-animation-approval.mjs` and
open `http://127.0.0.1:5181/assets/animation-approval-v1/source/index.html` in
Firefox. Invoke `window.exportApproval()` in that page to export the two models
and their frames. Then run `python3 scripts/finish-animation-approval.py`.

The authoring sources are `source/rigs.ts` and `source/export.ts`. The export
server writes only inside this approval folder. No live-game asset manifest or
runtime was changed by the initial art pass. The subsequent pilot installs only
this pair through `scripts/install-baked-actors.mjs`. No automated tests or builds
were run.

The current v4 material pass adds hand-painted hair lock clusters directly to
the crown, fringe, side and back surfaces and a darker, connected one-pixel
contour. The refined gait is unchanged. See the
[hair and outline comparison](previews/hair-texture-comparison.png).

The v5 care/rest pass adds a spine hinge, articulated wrists, larger care
gestures, closed-eye expressions, distinct low sitting/curled sleeping poses
and visible breathing. All texture/style decisions from v4 remain. The
[action preview](previews/actions-preview.gif) shows the current exported art.

The v6 emote pass adds sad/cry, happy jumping, angry, floating, disco dancing
and tired body gestures. The exports contain 4,128 finished frames, including
all eight directions. Runtime pixel overlays add rain clouds/tears, confetti,
angry and disco symbols, floating clouds, Zs and a tired cue, outside the native
cells. These overlays are authored in `src/game/runtime/emote-art.json` and
`emote-effects.ts`; they are intentionally not baked into the body frames.

The v7 pass adds twelve-frame surprise clips for both actors in all eight
directions. See [surprise poses](previews/surprised-poses.png). Existing walking
and care frames are preserved. Runtime effects now include an overhead charcoal
rain cloud, a larger angry face, a lobed white cloud, pulsing cat-petting hearts
and a rolling yarn ball during cat play. Effect masks remain in emote-art.json;
menu icons are generated from those same masks under emote-fx-v2.

The v8 pass adds expressive laughing, sick and rooftop-riding poses, preserving
all existing walking/care frames. A separate original orange/cream hatchback
uses the same materials, shading and native contour pass. Its atlas contains
96 transparent 80×64 frames, twelve per direction, including spinning wheels,
visible spokes and an asymmetric orange valve marker. Menu icons use the same
laugh/sick masks and a thumbnail of the actual car art. See
[rooftop poses](previews/car-rooftop-poses.png),
[car animation](previews/car-rooftop-preview.gif) and
[new reaction details](previews/laugh-sick-car-details.png).
