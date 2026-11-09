# Couch: rounded all-angle refinement

The previous model still had tall slab profiles, square arm frames and a rear panel that masked the paired cushions. It also stretched small upholstery patches across unrelated surfaces. The generated reference set remains unchanged; this refinement changes the actual 3D model, face UVs and documented profile projection.

## Geometry and paint

Installed native revision: **76bf5663ae50**. Source geometry is in `src/game/furniture/couch.ts`; the embedded-texture GLB is `assets/furniture-studio/exports/studio-couch/source-model.glb`.

- Back pads are shorter and deeper (22.8 × 19.5 × 12.4), with rounded XY silhouettes and elliptical depth. Their top height remains close to the source front.
- The lower rear shell exposes the rounded pair. Dedicated rear-cushion, profile-cushion and rear-panel maps preserve the generated reference's highlight/shadow divisions.
- Arms use independent X/Y/Z corner radii. This avoids the generic rounded-box radius being limited by a thin arm's width. A broad padded upper lobe tapers to a narrower lower frame. The separate bar-like arm roll was removed.
- Body width/depth are 56.645/34.300 world units, down from 58/36.4. Overall top is 37.319. Source color roles, paired flower pillows, short timber feet and palette styling remain.
- Pillow yaw presents the floral faces at side/three-quarter angles. Original outline pixels are retained; missing material extends from light pillow colors instead of growing dark background corners.

`prepare-couch-turnaround.py` imports additional face-specific material regions from the same accepted generated sheet. Their original/background provenance is retained. UV direction now follows front-to-back correctly. Native references still use one uniform import scale; no rendered image was stretched to improve a score.

## Projection and actor contract

The generated side drawings use a flatter camera than the source front. The couch's side camera is calibrated to 12°, blended by sin(yaw)^4 for intermediate authoring views. Front/rear use the source camera. This is a recorded camera change applied to real shared geometry, without per-facing mesh deformation. `reference-camera.json`, the exported manifest and GLB user data record the policy.

Actors keep their shared native camera at (0,34.5,90) and remain unscaled. During preview composition, their pelvis is projected onto the furniture seat, then their native actor layer is composited between furniture base and foreground. Live seat elevation uses the same native hip rise; collision, placement, approach, seat and rotation-indicator projection all use the corresponding furniture camera. The actor library was not modified.

Seats remain (±9.3,10.4,6). Across four breathing samples, the exported shared actor has minimum clearances of 2.177 units from the arms, 3.309 from pillows, 3.400 between actors and 2.246 pelvis-to-seat-front support. `seat-fit.json` now also records measured furniture bounds. These measurements apply to the exported appearance, not every oversized costume.

## Firefox review and fixes

Reviewed actual Firefox creator captures for four empty/occupied facings, each individual seat, both seats, standing, Oat and custom blue fabric. Reviewed front/rear three-quarter export images and the native reference/before/revised board. The actor clears the padding, rear/near furniture layers occlude as expected, and the above-item rotation action stays available. Comparison shows matching references and projected seat/collision overlays.

Navigation exposed a real `host.current is null` resize callback. FurniturePair and the contact-field observer now capture their element and stop queued callbacks during cleanup. A fresh Firefox session navigated creator → comparison → interaction field → comparison → creator with zero console errors. Existing WebGL cleanup/preload warnings are not an all-warning-free claim.

Evidence is under `output/playwright/`:

- `couch-side-rear-refinement.png`: generated references, prior installed model, revised model.
- `couch-turnaround-review.png`, `couch-three-quarter-review.png`: current model at all four facings and two authoring angles.
- `couch-refined-browser-empty.png`, `couch-refined-browser-seating.png`, `couch-refined-browser-controls.png`: actual creator captures.
- `couch-refined-comparison-contacts.png`: side view with both seats and projected contacts.

The single couch catalog record and scoped furniture code/assets were mirrored to the social worktree. The existing local housing service was reloaded with its original command/environment and data. No accounts, inventory grants, recipes, prices, actor files or database records were changed. No automated test suite or build was run; authenticated live seat leases/construction were not exercised. Generated drawings retain some camera/proportion differences, and exact all-angle identity is not claimed.
