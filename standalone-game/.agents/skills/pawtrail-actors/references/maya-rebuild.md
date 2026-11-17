# Maya reference-specific rebuild

Read the owner's full brief at `assets/maya-portrait/reference/reimplementation-brief.md`
and the visible diagnosis at `assets/maya-portrait/reference/diagnosis.md`.
The original `maya.png`, not any prototype render, is the visual specification.

## Available integration

- `/play?preview=portraits` shows original/render/opacity overlay/difference,
  alpha-silhouette outlines and annotated-versus-projected landmark errors.
  Comparisons are always neutral and steady, on one saved camera. Rotation and
  facial examples use a separate preview so they cannot silently change metrics.
- `src/game/actor-rig/maya/reference.json` records the source, native annotations
  and initial camera scaffold. The camera has not been accepted as a likeness
  fit. Source points double from 96×96 to 192×192; desktop enlargement is exact 2×.
- `maya/authored.ts` loads the versioned asset manifest, named GLB groups,
  registered eye/brow/mouth atlas regions, semantic masks, authored attachment
  modules and optional smoothly weighted view-corrective morphs. It preserves
  unrelated neutral shape weights and uses unlit, nearest-filtered sRGB paint.
  It does not add generic contours or palette-reduce the artist's final artwork.
- The manifest's `referenceConfigUrl` or explicit `calibration` supplies the saved
  runtime camera. Comparison edits are drafts; export/reset is explicit.
- `portrait-source.ts` routes only the Maya preset into this asset slot. Other
  characters and gameplay bodies remain unchanged. When no GLB is installed,
  the prior procedural model remains the baseline, not a finished rebuild.

## Authoring and review

The full concrete artist handoff and Blender scripts are in
`assets/maya-portrait/handoff/`. Blender was not installed during integration;
the Blender scripts have not been executed there. The bundle includes an
unapproved starter GLB, original reference, landmark/camera data, diagnosis and
measured baseline evidence. The starter carries an authoringStatus marker; the
runtime refuses to accept it as the finished authored asset.

Install only a genuinely rebuilt Maya GLB with corrected silhouette, face planes,
asymmetric swept bob, neck/shoulders/clothing, painted profiles/back, registered
expression drawings, appropriate facial morphs, semantic masks and actual model
landmark nodes. A front portrait plane or a frontal projection stretched around
an entire head is not a valid substitute. Reference-guide target empties must
never be exported as actual model landmarks to manufacture zero error.

Use `node scripts/maya-reference-evidence.mjs` for diagnostic native renders,
seven angles, expressions, a color variation, a 96-frame turntable and starter
export. Its outputs are explicitly baseline evidence. The final authored asset
must be reviewed separately once supplied.

Initial measured baseline: silhouette IoU 84.3%; available clear landmark mean
11.05 px, well outside the 1–2 px alignment goal. Missing features are unavailable,
not zero. These measurements are not artistic acceptance. Record remaining
shape/eye/pose/color discrepancies by eye at native size and integer enlargement.

Visual browser runs are authorized only when requested in the active task.
Prefer Firefox, preserve 12 fps/visibility/reduced-motion behavior and bounded
resources, and do not run unrelated suites/builds. Do not claim the final
asset/atlas/UV or Blender pipeline was verified without the required authored
assets and actual evidence.
