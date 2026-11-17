# Sampaguita Care Grove

A first reference-led PawTrail outdoor map, authored entirely from existing 2D
art. The upper-right shelter, wooded perimeter and branching paths echo the
reference composition; the care garden, seating and arrival are original.

- Editor: `/play?preview=stage&map=care-grove` → **Play map**.
- Alternative: **Files → Sampaguita Care Grove map**.
- 32 × 24 tiles, 1024 × 768 px, 79 editable objects.
- WASD/arrows walk, Shift runs, E uses the nearest supported item.
- Three benches; wooden garden door; two lights; feeding station; two planters.
- Existing saved editor draft is preserved until the owner explicitly saves.

## Source and outputs

- Canonical runtime layout: `src/game/stage-editor/maps/care-grove.json`.
- Import/download: `public/pawtrail-game/stages/care-grove-v1.json`.
- Authoring copy: `care-grove.stage.json`.
- Inspected artwork: `native-overview.png`; labeled guide: `interaction-guide.png`.
- Registry: `src/game/stage-editor/native-assets.json`.
- Source hashes/dependencies: `asset-inputs.json`; phase journal: `job.json`.
- Scoped exporter: `scripts/prepare-care-grove.py` (Pillow through uv).

No newly generated raster art, global world regeneration, NPC records, account
writes, supply costs or Kibble rewards. The lodge is scenery with collision;
there is no interior or overworld portal. Playtest care/door/light state resets
on returning to Edit; edited layout saving uses the existing local editor save.

## Review

Native overview visually inspected. Repeating grass holes in broad dirt paths
were repaired using solid dirt interior tiles. Source integration reviewed for
atlas crop/selection, nearest interaction targeting, controller state and
registration. Live actor scale, seating alignment, route clearance and actual
interaction playback remain pending. No automated checks/tests/builds, browser
verification or agents were run under the owner's current instructions.
