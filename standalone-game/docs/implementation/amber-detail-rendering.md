# Amber detail rendering and zoom

The previous comparison discarded source detail by packing every frame to
64 × 80 pixels and applying a small palette plus one-pixel contour. The face
also used a 64-pixel-wide expression map. Increasing CSS zoom enlarged those
pixels. Physical model scale was not the cause and has not been changed.

## Detailed source

`build_amber_parts.py --detail --output-id amber-parts-detail-v2 --face-texture …`
retains the separate model parts, body scale and shared animation timing, uses a
denser curved face/skull surface and maps a genuinely redrawn face atlas onto it.
Built-in ImageGen preserved the existing three expression UV registrations while
adding facial detail from the approved modeling reference. The generated atlas
is 2,172 × 724: three 724-pixel-wide expressions. It is an opaque skin albedo;
the actor renders remain transparent foregrounds.

Master animation renders are 512 × 640 with 32 Cycles samples and denoising. The
CPU authoring batch uses two ray-render threads, a 1,500 MiB memory ceiling and
bounded CPU quota. A separate actual model close-up is rendered from its saved
Blender scene; it is not a magnified gameplay sprite or the input illustration.
Expression surface swaps use stepped scale keys to prevent the painted face from
shrinking visibly between blink poses in live playback.

## Comparison controls

- **Parts model → 2D / HD detail:** 256 × 320 lossless smooth frames, packed by
  action and direction. Only one clip is decoded at a time; the prior ImageBitmap
  is closed when the selected clip changes or the preview unloads. The maximum
  clip contains 16 frames, 1,024 × 1,280 pixels: 5 MiB of RGBA pixels, excluding
  browser/Canvas overhead. Face detail crops the high-resolution frame without
  changing its proportions. It is still finite sprite resolution.
- **Parts model → 2D / Native pixels:** retains the original 64 × 80 atlas,
  nearest-neighbor integer zoom, limited palette and pixel outline.
- **Parts model 3D:** loads the actual new GLB on request. A bounded 512 × 640
  WebGL canvas, camera zoom/orbit and body/face framing allow closer inspection.
  Zoom changes the camera and rerenders geometry; it does not enlarge a 64-pixel
  rendering. The texture, geometry and viewport still define its detail limits.

The existing live/pixel/native comparisons remain available. Quality changes
unload the current preview. All modes keep the same action durations, cardinal
heading controls and local preview boundary. This work does not replace Amber
in the live game or add missing gameplay/interaction animations.

## Files and reproducibility

Source: `assets/actor-appearances/amber-parts-detail-v2/` includes the generated
face albedo and exact prompt, `.blend`, animated `.glb`, master frames, actual
face close-up and manifests. Runtime detail files are under
`public/pawtrail-game/actor-studio/amber-parts-detail-v2/`.

After the requested source bake, run the actual close-up renderer and detail
packer using the cached Blender/Pillow tools:

```bash
blender --background --threads 2 --python tools/actors/render_amber_face_detail.py -- --root "$PWD"
uv run --no-project --with pillow python tools/actors/pack_amber_detail.py
```

The actor skill now distinguishes detailed master assets, low-resolution gameplay
exports and live camera inspection. Native output stays separate from HD assets;
whole-library eager decoding is not introduced. Source/artifact inspection is
part of this asset-authoring task. App tests, builds, type checks and browser
verification were not requested and are not part of the recorded acceptance.
Final in-app likeness, zoom behavior and interaction review remain pending.
