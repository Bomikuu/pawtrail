# Sampaguita Old Quarter

Open `/play?preview=stage&map=village`, or choose **Files → Sampaguita Old Quarter
village**, then **Play map**. WASD/arrows walk, Shift runs, E uses nearby supported
furniture. Respawn returns to a clear area near the lower-center arrival lane.

This is a new editable 48 × 32 tile stage (1536 × 1024 px), with 12 houses in
three silhouettes, a community hall, connected cobbled streets, central market
courtyard, side alleys and an arrival path. Separate house/scenery objects retain
independent ground collision and depth sorting. It reuses the owner-approved
Care Grove v5 cottage, hall, supplies, carts, walls and planting. Only the ground,
wide slate workshop and terracotta townhouse were newly generated with built-in
ImageGen; exact prompts and per-image service timings are retained locally.

Three benches, five lamps, a food station and two planters reuse the existing
local interaction controller and real furniture contacts. There are no new
enterable interiors, NPC/account records, combat encounters, rewards or stock
costs. Care/door/light state stays disposable local rehearsal state.

## Files

- Source art/prompts/job: `assets/maps/sampaguita-village-v1/`.
- Editable layout: `src/game/stage-editor/maps/sampaguita-village-v1.json`.
- New art registry: `src/game/stage-editor/village-art.json`.
- New runtime images: `public/pawtrail-game/map-art/sampaguita-village-v1/`.
- Importable stage: `public/pawtrail-game/stages/sampaguita-village-v1.json`.
- Production script: `scripts/prepare-sampaguita-village.py`.
- Native view: `native-overview.png`; labeled actions/arrival: `interaction-guide.png`.
- Reuse/dependency manifest: `asset-inputs.json`.

Care Grove, its registry and the user's saved draft are preserved. The template
can be edited, undone, exported and explicitly saved using the current editor.
The terrain is one registered continuous painting with editable tile overrides;
no visible grid or repeated square terrain seams are baked into the map. Sources
remain outside runtime imports; only native exports load in the renderer.

## Review

The native composition was visually inspected for house variety, street continuity,
readable alleys, open central arrival and the approved palette. Source integration
was reviewed. No automated checks/tests/builds, browser verification or subagents
were run. Actual actor visibility behind roofs, collision clearance, contacts and
interaction playback remain pending live review under the owner's instructions.
