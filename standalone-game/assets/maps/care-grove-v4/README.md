# Care Grove — softer outline and palette revision

Built-in ImageGen edits lighten the v3 palette and reduce heavy near-black
contours to finer warm brown lines. The v3 source is the edit target and v2
provides a softer-value reference. Exact prompts and image service timings
are retained in `prompts.json` and `sources/*.json`.

The current layout, native sizes, anchors, ground footprints, placement IDs,
furniture controller and local saves are preserved. Terrain stays continuous,
with softer path edges and no grid or square tile seams.

- Entry: `/play?preview=stage&map=care-grove`.
- Served artwork: `public/pawtrail-game/map-art/care-grove-v4/`.
- Active registry: `src/game/stage-editor/grove-art.json`.
- Export: `scripts/prepare-care-grove-v3.py --revision 4` (existing shared exporter).
- Layout: existing `src/game/stage-editor/maps/care-grove-v2.json`.
- Source art, prompts, output manifest, journal and native overview: this folder.

Only native artwork export and visual review are in scope. No automated app
checks/tests/builds, agents or browser verification were run; live gameplay
review remains pending under the current owner instructions.
