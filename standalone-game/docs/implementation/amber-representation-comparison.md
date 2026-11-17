# Amber representation comparison

Open `/play?compare=amber-representations`, or use **Amber · 3D / 2D comparison**
from the existing actor preview/creator. The new page is separate from Amber's
shoulder and volume studies. Creator navigation retains the unsaved-draft prompt.

## Modes and common controls

- **Full 3D:** the approved Amber creator rig with light-driven MeshStandard
  materials, ambient/key/fill lighting, antialiasing and ACES tone mapping. Original
  face/eye and costume maps remain on the real geometry; textures are valid in 3D.
  Render buffer is 256 × 320 with no pixel postprocessing.
- **3D + 2D:** the same rig, original painted materials, camera and poses rendered
  live into 64 × 80 pixels through the existing palette/outline finish. This is
  not a separately authored native-2D sprite or a new baked export.
- **Native 2D:** a generated and registered sprite sheet with no 3D rig or WebGL
  renderer instantiated. It uses four rows for down/left/up/right and eight cells
  per row: two idle drawings, then six stride drawings. The blink appears briefly
  rather than holding closed eyes for half the idle cycle.

Every mode uses the same facing choices, idle/walk/run intent, cycle durations
(2.5 / .8 / .5 seconds), native frame/feet contract and ground shadow. Mode changes
unload the outgoing version and reset playback; the owner explicitly loads the
next version. Only common cardinal headings and movement-preview actions are
offered. The stage previews poses, not game movement, combat, rewards or saves.

Native Run reuses the authored stride at faster cadence, rather than claiming
separate sprint drawings. The native comparison does not have diagonal views or
Amber's complete interaction/prop/action library. The live game roster, creator
appearance and approved 3D rig remain unchanged.

## Native art and resources

Built-in ImageGen used Amber's approved appearance reference and legacy native
gameplay frame. The first sheet clipped a few ribbon tips; a targeted correction
restored complete parts and transparent cell margins. The final master, exact
generation/correction prompts, manifest and directional animated review exports
are retained in `assets/actor-appearances/amber-native-2d-v1/`.

`tools/actors/export_amber_native_comparison.py` packs the corrected art into
`public/pawtrail-game/actor-studio/amber-native-2d-v1/sprites.png`. All cells use
one source scale, a centered feet axis, the existing 64 × 80 frame and (32, 60)
ground anchor. The height reference is 49 pixels from Amber's existing export.
Atlas dimensions are 512 × 320, compressed size 96,864 bytes, decoded RGBA size
655,360 bytes. Pixel modes retain integer zoom and nearest-neighbor rendering.

The stage draws at most 30 FPS. Paused unchanged poses and hidden documents do
not render. It has no phase/direction bitmap cache; pixel mode reuses one output
buffer. Unload/route change cancels playback and releases the owned rig, materials,
textures, renderer and context. Native mode loads only its image and Canvas2D
stage. There is no second renderer in a preview dialog.

## Review status

The generated master and native atlas were inspected as artwork. Automated tests,
type checks, builds and browser verification were not run under the current
workspace instructions. Live appearance, alignment, costume fit, every offered
heading/action and interruption/reset behavior remain pending owner review.
This scoped comparison is not full actor action acceptance or game installation.
The actor skill now documents representation comparisons and their boundaries.

## Part-built Blender model → offline baked sprites

The fourth mode, **Parts model → 2D**, is at
`/play?compare=amber-representations&mode=parts-baked`. It is a new reference-guided
Blender source, not the previous Three.js rig with another material preset.
It uses named head, curved-face, hair, goggles, ribbon, fitted jacket/bodice,
cape, belt/pouches, gloves and boot meshes bound to an explicit skeleton.
Amber's approved face texture is reused on a curved face surface; blink states
are represented by bone-controlled face parts. This is Blender mesh authoring,
not Tripo or other neural image-to-3D generation.

The source has 95 parts and 19,480 triangles. Its GLB contains actual `idle`,
`walk` and `run` animation clips; the editable `.blend`, part/joint inventory,
modeling reference and exact reference prompt are retained under
`assets/actor-appearances/amber-parts-baked-v1/`. Initial source views revealed
obscured goggles and overly rounded eyes; the model was revised before final
packing. Representative source renders and final native compositions were
inspected as authoring artifacts. Accuracy and full actor acceptance still need
owner review.

The offline render matrix contains four cardinal directions, 16 idle poses,
12 walk poses and 12 independently authored run poses per direction: 160 frames.
Walk/run differ in stride reach, foot lift, torso lean and arm bend. Hair, ribbon
and cape have secondary motion. Dedicated run artwork is not a sped-up walk.
Source rendering uses 256 × 320 transparent frames; export finishes them into
the shared 64 × 80 pixel frame, (32, 60) ground anchor, fixed palette and native
dark contour. The atlas is 1,024 × 800, 99,836 bytes compressed, 3,276,800 bytes
of decoded RGBA pixels. GLB download is 805,964 bytes and is not loaded for
sprite playback.

`mountAmberRepresentation` reads frame ranges and durations from the new manifest
and loads image data only for `parts-baked`; it does not construct a character,
create a WebGL renderer or evaluate bones. The source-inspection disclosure uses
actual rendered views and an explicit model download link. All older modes stay
available. This comparison is a new geometry/style trial as well as a playback
comparison; it does not establish that all four modes share identical geometry.

### Reproduce the authoring export

The portable Blender tool is cached at
`/home/micxsz/.cache/pawtrail-tools/blender-5.0.1-linux-x64/blender`.
Run from the project root:

```bash
systemd-run --user --scope --quiet -p MemoryMax=1500M -p MemorySwapMax=128M \
  /home/micxsz/.cache/pawtrail-tools/blender-5.0.1-linux-x64/blender \
  --background --threads 2 --python tools/actors/build_amber_parts.py \
  -- --root "$PWD"
uv run --no-project --with pillow python tools/actors/pack_amber_parts_bake.py
```

The system Pillow package failed its resize operation. Packing uses an isolated,
cached Pillow wheel through `uv`; its version is recorded in the manifest. No
project dependency or global Python package was changed. The first Blender setup
is cached for later batches. The requested asset bake completed without opening
a browser or Blender's UI. No app tests, type checks, builds or browser verification
were run. The new skeleton has not been installed/retargeted into the game actor
or complete interaction/equipment action library.
