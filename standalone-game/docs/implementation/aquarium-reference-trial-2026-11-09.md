# Aquarium: trial of the supplied reference-conversion prompt

The owner rejected the couch's reference fidelity and requested trying the aquarium with the pasted 2D-to-3D prompt. The prompt explicitly authorizes direct source textures, layered contents, a locked reference camera, measured component boundaries, native image comparison and truthful limits. This is the trial's scope. The couch was not remodeled in this turn.

## Representation and source

Source: `public/assets/game/housing/furniture/cozy-room-v1/aquarium-v1.png`, 96×64, opaque bounds (3,2)–(93,64). Measurements retain the shallow hood, water rows 14–42, base molding rows 43–47, cabinet rows 48–61, short feet and the original two fish/plant details. The prior generic mesh had a taller cabinet, different plants, five generic fish, altered tint and oversized opaque bounds.

The new `src/game/furniture/aquarium.ts` builds a source-painted hybrid. Cabinet sides/rear/top, hood roof/front/sides/rear, plinth returns, tank sides/back and feet have meaningful volume. The source image is mapped to those surfaces without relighting the painted shadows or adding procedural grain. The hood's painted top is a horizontal roof face. Water, source plants, edge linework and two independently moving fish profiles are separate layers. Crossed profiles give illustrated contents a side presence; they are not full sculpted fish/plants. This is not a single flat full-object image. Unknown rear and side details remain authored interpretations.

`prepare-aquarium-reference.py` derives six palette-indexed layers from the source, records its SHA-256, component rectangles and normalized boundaries. It does not resize the source. `model-kit.ts` owns/disposes the unlit texture/mesh resources. Native source paint bypasses the second contour/quantization pass; a nearby actor retains the shared actor finisher. Preset and custom wood colors tint only the wooden surfaces while retaining source shading.

## Camera and native comparison

The game camera stays fixed: orthographic frustum (-48,48,96,-16), eye (0,34.5,90), target origin, frame 96×112, anchor (48,96), sRGB output, no tone mapping/antialiasing, nearest texture filtering and integer display zoom. The source anchor is (48,64); model origin is the front floor edge. Pixel coordinates are inverse-projected into world positions. Contacts/collision/approach derive from this origin, with matching metadata installed for all facings. Source camera/settings and landmarks are saved as `assets/furniture-studio/exports/aquarium/reference-camera.json` and in the native version folder/GLB metadata.

`compare-furniture-reference.py` aligns source/render by declared anchors and excludes the transparent background. At facing 0, phase 0, the final render matches **5,246/5,246 object pixels exactly (100.0%)**, with identical 90×62 opaque bounds and zero silhouette mismatches. This measures one reference image/pose, not semantic 3D correctness or every viewpoint. Side/rear and moving fish phases intentionally differ. No output was stretched or warped to improve the score. The comparison saves a native pair, nearest-neighbor before/after, overlay, difference mask and four-view board.

During correction, the comparison exposed rear plinth surfaces protruding beyond the source silhouette, a mismatched foot edge and a rear water plane extending past a transparent frame pixel. Geometry and source-painted return faces were corrected. A side fish profile extending past the tank was moved inside its depth. Repeated renders had identical pixels but different Firefox ancillary `deBG` PNG chunks; the exporter now strips only that nonvisual metadata before hashing/writing frames.

## Installation and Firefox review

Installed native revision: **37feead146e2**. All three styles, four facings, foreground layers and nine fish phases per facing/style were exported. The source GLB embeds its painted textures and stores the reference pose. Runtime code/native motion frames own fish playback; the GLB does not contain a baked swim clip. Camera JSON is saved alongside it.

The main worktree received only these furniture sources, the reference data, creator control changes, matching registry/catalog item and versioned aquarium assets. Other item IDs, styles, actor work and social changes were preserved. The housing service was reloaded with its existing environment for the new geometry. No accounts, balances, inventory grants or fixtures were created.

Firefox at 1280×900 reviewed the real creator: source/render front, all quarter-turn facings via the above-object circular rotation action, Honey oak/Walnut/Pale oak and playback/pause. The creator now has a Pause animation control that returns to the source pose, and labels the aquarium's color input Wood color. Paused canvas pixels remained identical; resumed playback changed 95 native pixels in the sampled interval. The custom wood input changed 2,729 sampled wooden pixels while leaving the central water/contents region unchanged; Honey oak was restored afterward. A nearby shared actor was also captured. No renderer error state appeared.

Evidence in `output/playwright/`:

- `aquarium-fidelity.png`: original, prior generic model and new render.
- `aquarium-reference-native.png`, `aquarium-reference-comparison.png`, `aquarium-turntable.png`.
- `aquarium-final-front.png`, `aquarium-final-90.png`, `aquarium-final-180.png`, `aquarium-final-270.png`.
- `aquarium-final-walnut.png`, `aquarium-final-pale-oak.png`, `aquarium-final-swimming.png`.

This is source/art/creator visual review, not an authenticated home placement, construction, care transaction or concurrency test. No production build or unrelated automated suite was run. The furniture skill now records this reference-first hybrid workflow and its limitations.
