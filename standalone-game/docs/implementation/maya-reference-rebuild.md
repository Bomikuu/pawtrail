# Maya reference rebuild: integration and asset gap

The original illustration is the specification. The existing procedural portrait remains a diagnostic baseline, not an accepted Maya rebuild. No artist-authored replacement GLB has been supplied. Blender and Assimp executables were unavailable in this workspace. Three.js geometry/GLTF export and Firefox native rendering were available and used; their availability does not make the generic mesh a faithful likeness.

## Implemented

- `/play?preview=portraits`: original/render, opacity overlay, actual alpha silhouette outlines, amplified difference and annotated/projected landmark errors. Neutral comparisons use one pinned camera and steady pose; the preview separately rotates and changes expressions.
- Native 192×192 rendering, exact 2× desktop enlargement, explicit calibration drafts/export/reset, clear missing-asset/error states, 12 fps, visibility/reduced-motion controls and bounded resource disposal.
- Maya-only authored GLB slot in the shared portrait factory, preserving all other characters and gameplay bodies. Manifest-selected camera/pose settings are shared by runtime and comparison.
- Authored-node/material contracts, UV-attached expression-region compositing, jaw/cheek/blink morph control, optional smooth view correctives, semantic role masks and compatible authored hair/clothing modules. Unrelated neutral morph weights are preserved. Final artist textures avoid the prototype's new-outline/palette-reduction pass.
- A concrete Blender handoff, setup/export helpers, reference/camera/annotation bundle, unapproved editable starter GLB, seven-view evidence, expressions/color variation and a continuous 96-frame/12 fps baseline turntable.

## Measured baseline

The native evidence report records 84.3% alpha silhouette IoU, mean RGB error 70.84/255 over the silhouette union, and 11.05 px mean error across available clear reference landmarks. The reference target is roughly 1–2 px, not an acceptance certificate. Nose and bob-tip model anchors are unavailable; their errors are not counted as zero. The partly obscured left brow is not included in the clear-landmark mean. The projected anchors describe actual UV/mesh positions, not an automatic image-feature detector.

These numbers confirm that the head/hair/feature placement and clothing differ substantially. They do not demonstrate artistic fidelity. The initial camera is a pinned diagnostic scaffold, not an accepted match to the drawing.

## Visual verification performed

Firefox inspection covered the real comparison page at 1440×1100 and 390×844, neutral original/render alignment, overlay opacity changes, silhouette/difference switching, rotation, facial controls, preview-only color variation, stable neutral comparison metrics and the real handoff ZIP download. Captures are under `output/playwright/maya-reference-*.png`. No browser errors were recorded in that session. No unit suite, typecheck or production build was run.

The authored GLB, atlas, masks and attachment path cannot be visually validated with a final Maya asset until it exists. The Blender helpers were not executed here. Do not report those assets, their final profile appearance, their UV registration or their likeness as completed/verified.

## Outstanding authored assets

1. Maya-specific head/facial planes, swept bob, neck/shoulders and clothing, matched to the original reference view.
2. Corrected profile/back geometry and painted UVs; unseen regions remain explicit artist interpretations without more references.
3. Registered painted eye/brow/mouth expression drawings and appropriate subtle facial morphs.
4. Semantic masks and any fitted alternate hair/clothing modules.
5. Real model landmark nodes and the reviewed reference camera/pose.
6. Final all-angle/expression comparison and artistic acceptance.

`assets/maya-portrait/handoff/BLENDER-HANDOFF.md` specifies the meshes, node names, camera conversion, UV/atlas layout, role IDs, morphs, materials and export requirements. The runtime rejects the marked procedural starter as an authored Maya replacement. The downloadable bundle is `public/pawtrail-game/game-assets/maya-reference-v5/artist-handoff.zip`.
