# Care Grove — darker character-style outline revision

Built-in ImageGen edits redo six map assets with dark espresso contours, stronger
internal shape/material lines and slightly darker midtones. The installed game
character sheet provides the line/shading reference. Exact prompts and source edit
paths are in `prompts.json`; each `sources/*.json` records actual generation timing.

Open `/play?preview=stage&map=care-grove`. The same layout, placement IDs, furniture
controller and registered native sizes/anchors/footprints are retained. Prior v2
source/runtime art is preserved. The continuous ground and hidden default grid
remain, with no new square tile seams or global night/tint overlay.

- Generated sources: `assets/maps/care-grove-v3/sources/`.
- Native runtime art: `public/pawtrail-game/map-art/care-grove-v3/`.
- Registry: `src/game/stage-editor/grove-art.json` (same asset IDs).
- Prior geometry snapshot: `prior-registry.json`; installed copy: `registry.json`.
- Layout: existing `src/game/stage-editor/maps/care-grove-v2.json`.
- Served import: `/pawtrail-game/stages/care-grove-v3.json`.
- Scoped native exporter: `scripts/prepare-care-grove-v3.py`.
- Native composition: `native-overview.png`; output manifest: `asset-inputs.json`.

This is an artwork revision. Native image export and overview inspection do not
verify walking/contact/interaction playback. No automated tests/checks/builds,
subagents or browser verification were run under the owner's current instructions.
