# Amber shoulder revision — 10 November 2026

The owner approved the narrower head and requested softer shoulders, keeping
the feet as they are. `/play?compare=amber` now shows that approved head on both
sides. **Previous shoulders** retains the previous sleeves; **Refined shoulders**
uses rounded shoulder caps and a narrower sleeve silhouette. Front, three-quarter
and side controls, idle/walking and texture inspection remain available.

`createAmberShoulderStudy` opts into the new shape in `amber-study-rig.ts`.
Seven elliptical sections with sixteen radial segments form each shoulder cap,
sloping toward the neck and tapering into the existing elbow. The arm roots
move inward from ±7 to ±6.4; the arm's slight outward angle reduces from 0.09
to 0.055 radians. The gold shoulder emblems are smaller and sit closer to the
curved sleeve instead of protruding from a flat box. Their palette and identity
remain the same.

A dedicated code-authored `sleeve` UV map adds red fabric folds, a small highlight
cluster and curved gold hem. Fixed three-level vertex shading emphasizes the
cap's volume while retaining nearest-neighbor pixel rendering. There are no
new image downloads or generated artwork. The foot meshes, shared animation
functions, approved head/hair, bodice, cape geometry and cloth timeline are
unchanged. Saved characters, portraits and the game roster remain outside this
preview-only revision.

The source is mirrored to the integrated app and archived standalone source.
No automated tests, checks, builds or browser verification were run for this
revision. The previous head revision's visual captures do not validate these
shoulder changes; review the live comparison before any broader rollout.
