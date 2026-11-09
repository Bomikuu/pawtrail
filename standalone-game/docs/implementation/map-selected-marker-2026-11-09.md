# Clearer selected map markers — 9 November 2026

The selected entity marker now has a persistent high-contrast four-pixel outer ring, a two-pixel separating offset, 125% scale. The same treatment applies to an individually selected animal orbiting its shared place. Hover styling does not shrink a selected marker. Existing attention colors, status icons and pulse rings remain separate. The existing accessible pressed state identifies selection. The owner subsequently removed the added selected-name label; the outline, scale, stacking and closer zoom remain.

MapLibre and the raster renderer lift the actual selected marker group above nearby markers. The membership-aware helper matches exact parent/member IDs rather than proximity, and the route destination retains its higher map layer. An explicit selection repaint updates/clears the highlight even when the camera does not move.

Both renderers use a shared selection zoom floor of 16, one level closer than the previous effective selection floor. The camera preserves a more zoomed-in view and existing sidebar/detail padding. Generic location focus keeps its previous default. Both the selection effect and the follow-up focus effect honor the floor, so the latter cannot undo the closer view. Motion reduction remains respected. City boundary styles and whole-area fits are unchanged.

Only the marker component, two renderers, camera-layout helper and membership helper were mirrored into the social worktree. The previously reverted drawer typography/status-border update remains reverted. Existing collection photos, category thumbnails, routes, privacy and database state are retained.

Source review covered selected/hover/cleared states, direct versus shared-member IDs, stacking, reduced motion and the competing camera effects. No agents, automated tests/checks, build or browser verification were run under the owner's standing instruction.
