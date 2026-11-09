# Maya reference-specific portrait asset handoff

This bundle is an authoring brief, reference/camera scaffold and a **procedural starter**, not an approved replacement model. The current model's likeness failed visual comparison; changing its texture detail did not fix its head/hair/clothing shapes. No Blender executable is installed in the implementation environment. The setup/export scripts are supplied for an artist and have not been executed in Blender here.

## Visual authority and units

Use `reference/maya.png` (96×96), the original illustration. Do not use the prototype as a design reference. At runtime it is compared at 192×192 using exact 2× nearest enlargement. `reference/reference.json` provides manually annotated source landmarks, confidence, a pinned orthographic camera and the initial reference yaw. This initial camera is a **starting scaffold**, not proof that the current model matches the drawing. Fit mesh silhouette/landmarks and explicitly update the saved calibration if needed; never silently auto-fit each candidate or comparison separately.

The camera uses Three.js Y-up coordinates: position [0,31.9375,100], target [0,30.7,0], vertical span 27.5, near .1 and far 250. Reference root yaw is -.42 radians. The Blender setup converts Y-up to Z-up as (x,y,z) -> (x,-z,y). Author at these portrait units; no gameplay collision/scale is involved.

Run `blender --python blender-setup.py -- --bundle /path/to/bundle` to open Blender with the reference scaffold. The scripts require Blender and have not been executed in this environment. It creates the calibrated camera/background and imports the optional starter. Sculpt/model a new head and asymmetrical bob, neck, shoulders, ochre sleeves, open green vest and neckline to reproduce the drawing. Preserve her subtle painted nose in this Maya-specific asset: the newly approved original-image brief takes precedence over the older generic no-nose gameplay preference. Do not change other characters.

## Required hierarchy and geometry

- `MayaPortraitRoot`: identity transform on export; contains the complete bust.
- `MayaHead`: group/pivot for head animation. Preserve authored rest orientation.
- `MayaHair`: group below MayaHead, with genuine front/side/back hair masses.
- `MayaTorso`: group for neck/shoulders/clothing; build no legs.
- Optional `MayaHeadwear`: authored attachment group under MayaHead.
- Empty landmark nodes named exactly as `reference/reference.json`: eye centers, brows, painted nose, mouth, chin, shoulders, crown and bob tips. Attach head features to the head and shoulder features to the torso. These are artist-placed anchors, not automatic image-feature detections.

Use head/cheek/jaw planes that read correctly from both profiles. Model the side part, swept fringe, crown height and asymmetric bob ends as shaped volumes. Avoid thin disconnected hair noodles, a frontal shell without a back, billboard planes and symmetrical generic facial proportions. Compatible authored hair/clothing modules can replace children of group targets through the manifest's modules list. Their local transforms must fit the same anchors; do not export separate full rigs for each attachment.

## Texture and UV authoring

Start with camera projection at the pinned reference view, then repaint UV seams, distortion, profiles and back. The source is only one angle; record unseen-side interpretations explicitly. Keep original color clusters, selective warm outlines and restrained highlights. A single front PNG wrapped around the entire head is not acceptable.

Export painted materials as KHR_materials_unlit or simple base-color textures; runtime uses unlit MeshBasicMaterial and no tone mapping. Painted map colors use sRGB, nearest filtering, no mipmaps. Do not bake new realistic specular highlights or apply procedural lighting that changes the illustration. Alpha-cutouts may use alphaTest; do not use flat transparent layers to replace head volume.

Give the face material the name `MayaFacePaint`. Keep its neutral texture registered to the original eye/brow/mouth design. Supply `semantic-masks.png` per relevant material, same dimensions as its UV texture. Red-channel integer role IDs (not normalized floats): 0 untouched ink/details, 1 skin, 2 hair, 3 vest, 4 shirt/sleeves, 5 image-left iris, 6 image-right iris. Keep black outlines/catchlights unmasked. The runtime preserves neutral painted pixels; optional color variations map role ramps without tinting every material together.

## Facial drawings and morphs

Author separate eyes/brows/mouth regions in `expressions.png`. Paint neutral, blink, smile, happy and talking designs from Maya's original contours; do not substitute generic vector eyes. Include talk_closed, talk_A, talk_O and talk_E mouth frames. Set each source rectangle and its target face-UV rectangle in `expressionAtlas.regions` in the manifest. Target UV coordinates are top-left pixel coordinates in the neutral face image. There is no mandatory atlas packing; use exact integer rectangles and 2 px padding between frames.

The runtime composites those drawings into the existing head's UV map, not floating facial planes. Supply subtle morph targets `jawOpen`, `smileCheeks`, `blink_L`, `blink_R` where useful. Confirm neutral weights 0 reproduce the illustration. Optional named view-corrective morphs can be listed as yaw/width curves; runtime uses smooth weights. Correctives must preserve continuous geometry and parallax.

Talking remains driven by text reveal, not recorded audio. Returning to neutral must restore base geometry and paint without doubled eyes/mouths or seams.

## Export and installation

Keep only the bust, its groups and landmarks selected; exclude camera and reference image. Export GLB, Y-up conversion enabled, UVs, embedded PNG textures, normals, morph targets and node names. Apply object scale; do not bake the reference yaw twice. The supplied setup uses a separate reference-pose parent. The export helper temporarily clears only that parent’s reference yaw and restores it afterward, preserving the model’s neutral transforms and any import axis conversion. Leave the starter's authoringStatus marker unchanged until the mesh has actually been replaced and reviewed; the runtime refuses to install a marked starter as an authored asset.

Copy the GLB into `public/pawtrail-game/game-assets/maya-reference-v5/maya.glb` and the atlas/masks beside it. Update `manifest.json` using `manifest.example.json`: set `modelUrl`, expression atlas rectangles and mask bindings. Keep `referenceConfigUrl` pointing to the saved reference JSON, or paste an explicitly reviewed calibration draft into `manifest.calibration`; the runtime and comparison load that same camera. Do not update only an offline camera without installing its configuration. Do not mark the asset accepted solely because it loads.

Open `/play?preview=portraits`, select Authored GLB candidate, and keep the same camera while comparing original/render/overlay/difference/silhouette and landmark errors. Aim for roughly 1–2 px on clear landmarks at 192×192, but also inspect eye contours, hair masses, mouth and color grouping by eye. Check front, both three-quarters, both profiles and back, continuous rotation, all expressions and at least one color/module variation. Record every remaining mismatch; source-occluded landmarks are not hard acceptance targets.

## Exact outstanding deliverables

1. Reference-matched Maya head/hair/bust GLB (the current starter is not it).
2. Artist-corrected front/profile/back UV paint, with meaningful side geometry.
3. Registered eye/brow/mouth expression atlas and subtle facial morphs.
4. Semantic color masks and any alternate hair/clothing modules.
5. Correctly attached landmark nodes and the reviewed reference calibration.
6. Rendered likeness review and documented profile/back assumptions.

Official references: https://docs.blender.org/manual/en/latest/addons/scene_gltf2.html and https://threejs.org/docs/pages/GLTFLoader.html .
