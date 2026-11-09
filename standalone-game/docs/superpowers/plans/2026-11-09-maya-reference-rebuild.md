# Maya Reference Rebuild Implementation Plan

> Execute directly in the existing workspace. No agents. The owner authorizes visual comparison and validation in this brief; do not run unrelated test suites/builds.

**Goal:** Replace assumption-driven portrait iteration with a calibrated Maya asset contract, measurable reference comparison and honest asset-authoring handoff.

**Architecture:** A fixed reference camera and named landmarks are shared by runtime rendering, export and comparison. A Maya-only authored GLB slot preserves shared appearance/animation infrastructure; the existing procedural bust is explicitly the baseline until an authored asset is supplied. The development comparison surface exposes the original, rendered image, overlay, difference and silhouette/landmark measurements.

**Tech Stack:** Three.js, React, official shadcn/ui, Tailwind, existing Firefox native art exporter; Pillow for reference/expression/contact-sheet production. No installed Blender or dedicated modeling tool was found.

**Spec:** `assets/maya-portrait/reference/reimplementation-brief.md`

## Global constraints

- Maya's original illustration is the visual specification. Prototype images are diagnostic evidence only.
- Lock camera/pose/framing for comparisons. Render at 192×192 with integer nearest-neighbor enlargement.
- Preserve genuine head/hair volume and occlusion; no billboard or rotating sprite substitute.
- Do not install or label a procedural starter GLB as the finished likeness.
- Keep other characters unchanged until Maya's authored asset is proven.
- Retain 12 fps, shared rendering, bounded caching, hidden-view pausing and text-reveal talking.

## Review focus

- Transparent source edges, not a background rectangle, determine silhouette metrics.
- Landmark coordinates must distinguish annotated reference points, actual projected nodes and unavailable detections.
- Calibration must not silently auto-fit either candidate or reference independently.
- Missing/authored/invalid assets need explicit state; never present the baseline as an accepted Maya asset.
- Side/back views are authored interpretations without additional reference images.

## Task 1: Diagnose and calibrate

- [x] Record visible differences and source landmarks at native reference coordinates.
- [x] Save immutable initial camera/pose settings and an explicit editable working calibration.

## Task 2: Integrate authored Maya assets

- [x] Define named rig nodes, facial morph targets, UV/expression/material and semantic color contracts.
- [x] Add the Maya-only GLB loader and renderer; keep a clearly labeled baseline fallback.
- [x] Add landmark projection and a steady comparison pose without changing ordinary gameplay bodies.

## Task 3: Reference comparison UI

- [x] Add `/play?preview=portraits` with reference/render/opacity overlay/difference/silhouette panels.
- [x] Show projected landmark errors and actual alpha silhouette overlap; report absent landmarks as unavailable.
- [x] Expose calibration edits as a named draft with export/reset, not hidden auto-framing.

## Task 4: Authoring handoff and visual evidence

- [x] Provide a concrete Blender setup/import/export script and a semantic asset checklist.
- [x] Export the baseline bust as an explicitly labeled starter GLB, reference-view/turnaround images and continuous rotation/expression examples.
- [x] Inspect native and integer-upscaled images plus real desktop/mobile comparison UI in Firefox.
- [x] Report measured baseline discrepancies and exact missing authored assets; do not claim fidelity from landmark arithmetic alone.

## Remaining asset work (not completed by this integration)

- [ ] Author the reference-specific Maya geometry and corrected front/profile/back paint.
- [ ] Supply the registered expression atlas, morphs, semantic masks and real landmark nodes.
- [ ] Review/accept the final likeness and all-angle behavior against the original.

The installed environment lacks Blender; the supplied setup/export scripts are unexecuted handoff resources. The current procedural baseline remains outside the likeness target and is not replaced with another claimed successful render.
