# Source-painted couch and actor seating

The owner requested applying the aquarium's source-first method to the couch, closely matching the original, keeping rotation and sitting, preserving actor clearance and checking visually again.

## Model and native match

`prepare-couch-reference.py` measures the original 64×64 sage sofa, splits its painted pixels into paired backs/seats, rolled arms, floral pillows, skirt and feet, and continues hidden upholstery only where other parts cover it. `references/couch.json` records the source checksum, silhouette/component/pillow outlines, normalized landmarks and reference camera. `couch.ts` constructs separate closed curved relief volumes, filled upholstered side panels, a closed base, plain lower rear upholstery and grounded feet. The source contour, painted shadows, tufts and angled floral pillows remain intact. Source colors use unlit nearest-filtered materials; no procedural texture replaces the original front artwork. It is not a single whole-object billboard. Unseen surfaces are authored interpretations.

At the default Sage front view the render matches **2,247/2,247 object pixels (100.0%)**, with identical **58×47** opaque bounds and zero silhouette mismatches. Comparisons align declared anchors, exclude transparent background, and do not resize/warp the output. Native transparent cells remain 96×112 with anchor (48,96).

The fixed camera remains orthographic at (0,34.5,90), looking at origin, no antialiasing/tone mapping, sRGB and nearest filtering. The couch now rotates around its physical center. The geometry/contacts receive the same `9/sin(pitch)` Z translation, and the source reference anchor is calibrated to (32,51), giving an exact nine-pixel front-view translation. The source PNG is untouched. This fixes side-angle clipping from the initial front-edge pivot. Empty bounds are front (19,58)–(77,105), left (21,59)–(74,105), rear (19,68)–(77,103), right (22,59)–(75,105), all inside the native frame.

## Sitting and allowance

The actual shared rescuer rigs remain at native scale and use the existing Sit action. No actor mesh/action library was replaced. Two seat sockets are x=±9.3, y=8.5, z=`-17 + 9/sin(pitch)` (about 8.14), using the existing 5.8-unit hip offset. The surface has the same 8.5 height, and collision, approaches, exits and all projected seat facings/elevations are regenerated from the same centered geometry. Stable seat/item/style IDs remain unchanged; existing backend seat allocation is retained.

`seat-fit.json` measures visible meshes/clothing through four breathing phases. Minimum clearances for the exported shared rescuer are **2.10** at the outer arms, **5.27** to pillows, **3.40** between actors and **2.99** from the actual pelvis bounds to the seat front. Feet remain about 2.82 units above the floor in the existing short-leg Sit pose; the actor was not scaled or stretched. These measurements do not guarantee every oversized costume.

Painted furniture, shared finished actors and authored foregrounds now compose as separate layers, matching the live game rather than adding a second contour around the couch whenever an actor is present. Front arms, near side arm and rear backrest provide the foreground coverage; the front skirt stays behind the actor's feet. Standing nearby is in front of the furniture. The original comparison uses the same projected front contact positions and source arm masks, replacing its previous arbitrary actor offsets.

## Visual review and installation

Firefox at 1280×900 reviewed empty source/model, each seat, both seats, standing, all four facings via the circular above-item rotate control, and Sage/Terracotta/Oat and the fabric color input. A repeat pass followed the centered-pivot/color/rear-panel changes. Both-seat selection and angle captions were correct; no renderer error state appeared. Oat highlights exposed by review were corrected using a bounded relative color mapping and explicit source fabric colors, preserving cream/floral details instead of clipping highlights or leaving olive shadows unchanged.

Installed revision: **3c956f8d9e83**. All three styles and four facings, foregrounds, GLB source, camera metadata and geometry/contact catalogs were regenerated. Only corresponding furniture modules, reference data, comparison component and the matching couch registry/catalog entry were mirrored to the main worktree. Aquarium/curtain assets, actor/social work and account data were preserved. The housing service was reloaded with its existing environment to load the current geometry. Construction costs/materials and verified rewards were not changed.

Evidence in `output/playwright/`: `couch-fidelity-fit.png`; `studio-couch-fidelity.png`, `studio-couch-reference-native.png`, `studio-couch-reference-comparison.png`, `studio-couch-turntable.png`; `couch-reference-final-empty.png`, `couch-reference-final-seat-1.png`, `couch-reference-final-seat-2.png`, `couch-reference-final-both-front.png`, `couch-reference-final-both-90.png`, `couch-reference-final-both-180.png`, `couch-reference-final-both-270.png`, `couch-reference-final-standing.png`, `couch-reference-final-oat.png`, `couch-reference-final-terracotta.png`. Camera/render settings and the source GLB are in `assets/furniture-studio/exports/studio-couch/`.

This verifies source/native art and creator behavior. Authenticated home placement, seat-lease transactions and concurrency were not exercised in this pass. No accounts, balances or fixtures were created; no unrelated automated suite or production build was run.
