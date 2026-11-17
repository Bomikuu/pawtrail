# Reference-first furniture conversion

This document applies after the owner chooses **3D + 2D renders**. For **2D sprites**, use [the sprite workflow](sprite-workflow.md); collision and sitting do not require structural volume.

Judge the final native image, not whether the source code sounds detailed. A generic mesh with similar colors is insufficient. The aquarium trial applies the owner's supplied 2D-to-3D prompt and provides a working hybrid example.

## Measure before modeling

Inspect the source at integer nearest-neighbor zoom. Record its actual alpha bounds, anchor, major component rectangles, dividers, palette and identifying details in source pixels and normalized coordinates. Separate visible evidence from unknown sides/rear. Match the reference projection and framing before detail. Keep the game orthographic camera locked unless the comparison demonstrates a projection error; controlled geometry distortion is acceptable for illustrated sources.

For the aquarium, the source is 96×64 with opaque bounds (3,2)–(93,64): a shallow hood, 29-pixel water region, five-pixel base molding, 14-pixel cabinet and short feet. Four front compartments, two painted fish and distinct plants are identity details, not interchangeable decorations.

## Choose the representation

Within the chosen model route, use real volume for structural pieces whose modeled views must change silhouette. Collision itself is independent 2D metadata. Apply authorized source artwork directly to faces with unlit sRGB textures. Preserve baked shadows/highlights without a second shading/grain pass. Use shallow relief and layered cards for illustrated contents when appropriate. Do not silently substitute an entire flat image for a volumetric asset. Finish the visible sides and rear as authored interpretations; one image cannot establish their exact appearance.

The working aquarium has a real hood roof/front/sides, cabinet surfaces, plinth returns, tank sides/back and feet. The source front is distributed over those surfaces, separate water/plant layers, linework and two independent crossed fish profiles. It is not a single full-object billboard. Its contents intentionally use illustrated layers, not fully sculpted fish or plants.

## Native outlines

Match the character's one-native-pixel brown contour: shadow ink `#2a1c17` and
the lighter edge `#3a261d`. `furniture/pixel-outline.ts` preserves painted interior
RGB while adding the surrounding contour. Source-painted/unlit objects use it
in both `PixelFurniture` and the live texture-editor scene. Procedural furniture
and the couch already use `PixelFinish`; do not stack both outer passes. Finish
the furniture layer before compositing actors, whose native finisher stays intact.

Add selective structural seam/crease lines on actual volumes rather than
darkening arbitrary texture changes. `furnitureKit.outline` owns the line geometry
and material; reference timber uses it for physical component edges. Avoid
triangulation lines, grain outlines, thick halos or CSS drop shadows. Keep strokes
crisp with nearest-neighbor integer enlargement and a transparent background.
The current owner's outline requirement supersedes the historical exact
front-only pixel match; the original PNG remains unchanged, while the 3D render
gets the common furniture finish. Recompute opaque visible bounds after outlining
so placement fitting includes the drawn pixels without changing collision.

## Source and camera contracts

- `scripts/prepare-aquarium-reference.py` extracts palette-indexed source, water, flora, edge and fish layers without resizing/repainting the PNG.
- `src/game/furniture/references/aquarium.json` records source checksum, pixel/normalized landmarks, native frame/anchor and the actual camera/render settings.
- `src/game/furniture/aquarium.ts` builds the hybrid model. Source coordinates are inverse-projected into world positions. The current hood is a closed beveled volume with source-painted front/top and generated side/rear materials.
- `model-kit.ts` owns unlit source textures/meshes and disposes them with the model. Do not relight or add procedural textures to the supplied painting.
- The 96×112 frame, (48,96) game anchor, nearest filtering, no antialiasing, sRGB output and no tone mapping are saved with the export. Transparent artwork remains transparent. Default front/rear camera is (0,34.5,90). Current profiles use an explicit 8° pitch blended by sin(yaw)^2; actor projection stays native.
- The current source anchor is (48,60), aligned to the centered floor pivot. Geometry, collision and approach use that same pivot. Read the current turnaround metadata instead of inheriting the superseded front-edge origin.
- Two fish move through a periodic, code-owned swim; nine native motion frames per style/facing are installed. The GLB stores the source model/reference pose, while runtime code/native motion frames own playback.

## Render, compare, correct

Run only when the task authorizes art production/visual comparison:

```bash
python3 scripts/prepare-aquarium-reference.py
node scripts/pawtrail-furniture.mjs render --id aquarium --install
python3 scripts/compare-furniture-reference.py --id aquarium --before b0f04426e561
```

The comparison aligns declared anchors, keeps native resolution, and computes exact RGBA equality only over the union of opaque object pixels. It saves a native pair, nearest-neighbor board, 50% overlay, change mask, four-view board and `comparison.json`. Do not stretch/warp the rendered image or include the empty background to inflate the score. Correct silhouette and component boundaries before decorative detail. Inspect source opacity, overlaps and pixel stability, then every installed facing and animation.

The earlier front-only aquarium trial matched all 5,246 opaque source pixels with identical bounds. That historical measurement belongs to the superseded front-edge model and is not a claim for the current centered multi-angle model. Judge the current model against the original front and accepted generated sides/rear; no exact all-angle reconstruction is claimed.

The exporter embeds textures in the source GLB and saves `reference-camera.json`. It strips Firefox's nonvisual ancillary `deBG` PNG capture chunk so native image metadata does not churn the content revision. The creator's Pause animation control resets to the reference pose for comparison; normal playback shows the fish moving. The actor keeps its shared finisher when shown nearby.

Use Firefox for authorized app review. Check rotations, paused image stability, actual moving pixels and style changes. State which were inspected. Do not infer a working authenticated placement/interaction transaction from an art preview. Keep unrelated actors, definitions, catalog entries and accounts unchanged.

## Couch with actors and a generated turnaround

For another couch request, follow [Request furniture](furniture-turnarounds.md) first. The original 64×64 Sage front stays canonical; a generated six-view sheet defines the previously unknown sides/rear. Exact prompts, untouched raw sheets, selected-cell order, tool provenance and review decisions live in `assets/furniture-studio/references/studio-couch/`. `prepare-couch-turnaround.py` imports alpha-isolated, source-palette native references and upholstery material patches. Generated drawn cameras are approximate: retain one uniform reference scale. The couch has an explicit 12° profile camera calibration (smoothly blended by sin(yaw)^4); its original front/rear and actor cameras remain documented separately.

The current `couch.ts` uses coherent rounded volumes: two thick fully rounded back cushions, closed upholstered base, continuous rear shell, padded arm sides, angled flower pillows and four short timber feet. The source front painting is mapped onto identifiable front parts; generated upholstery patches finish real side/rear surfaces. Complete the source material outside a photographed layer so alpha-cut painting does not punch holes through a rounded structural surface. Pillows use local face UVs so their flower pattern turns with the actual pillow. Do not return to front-camera-ray extrusion to force a perfect frontal pixel result.

All parts rotate about the same center; contacts/collision share that transform. Current seat nodes are x=±9.3, y=10.4, z=6, at the actor's shared native scale. Original reference anchor (32,55) aligns with native frame 96×112 and game anchor (48,96). The creator's reference changes with each quarter turn, identifying original versus generated art. Actor overlays on the reference apply only to the canonical front; generated empty references must not be presented as real occupied views.

Occupied furniture composes base → actors finished with the shared actor palette → appropriate furniture foreground. The actor layer uses its original native camera; align its projected pelvis with the furniture seat, and derive live seat elevation from that same docking contract. The closed couch receives its own native contour, separately from the actors. Front arms and rear backs occlude naturally; keep the front skirt behind feet. Do not hide geometry mistakes by changing actor scale or drawing actors over every foreground.

Use bounded relative lightness/hue mapping for custom/preset upholstery colors; preserve cream/floral pixels. Inspect a pale preset and a custom color. Export both seats and individual seats through all four facings. `seat-fit.json` measures visible rig/clothing and actual pelvis-to-seat support through breathing phases; those values apply to the exported appearance, not every oversized costume.

`review-couch-turnaround.py` produces four-facing and front/rear three-quarter comparison boards. The exporter also saves `review-45.png` and `review-135.png` as authoring evidence, without adding unsupported live placement rotations. Judge every view, silhouette, material region, depth and pattern. The earlier exact front-only score belongs to the superseded relief model and is not a current all-angle claim. A generated reference does not guarantee identical hidden geometry or an exact orthographic reconstruction.


## Rounded arms and all-angle proportions

A generic rounded box clamps its corner radius to the narrowest dimension; a thin arm can still look square in profile. The couch uses independent X/Y/Z radii and a broad padded lobe above a slimmer lower frame. Dedicated reference regions map to arm sides, rear panel and exposed rear/profile cushions. Check UV direction (front to back) and visible crop scale; repeating a small fabric patch across every face conceals the silhouette. Keep the rear panel low enough to expose the paired rounded cushions. Compare material divisions and exposed component proportions at every facing, then inspect both seats with their real native projection. Read current furnitureBounds and clearances from seat-fit.json.

## Aquarium with a reviewed turnaround

The owner explicitly accepted `assets/furniture-studio/references/aquarium/turnaround-v2.png` after the configured 2D review. The original front overrides the generated two-door proposals: retain four original compartments, both source fish and original colors. `prepare-aquarium-turnaround.py` imports the generated profiles/rear and their material regions at one uniform scale; raw alpha halos are removed only in the derived native import. Keep the untouched sheet and its recorded exception.

Use the centered closed hood, four corner feet and cabinet volume, with separate side/rear paint. Inward-facing opaque water backgrounds avoid covering fish with a near wall; thin glass remains transparent. Crossed fish profiles and shallow plants are intentional illustrated contents, not fully sculpted animals. Keep foliage low enough for profile fish to remain visible. Nine native motion phases per facing come from the same two fish nodes.

`review-aquarium-turnaround.py` produces front/profile/rear, three-quarter and motion boards. Match each creator reference to the selected facing; show the actual shared actor nearby without implying a seat exists. Preserve the item, style, recipe and price IDs when installing the revised asset.
