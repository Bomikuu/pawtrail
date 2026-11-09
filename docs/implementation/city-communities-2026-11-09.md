# Whole-city communities — 9 November 2026

The owner replaced barangay communities and custom subdivisions with one whole community per city, requested clearly distinct boundary colors, and wanted hover to indicate that a community can be entered. This supersedes the earlier local-area/custom-split choice. The incumbent PawTrail map, floating sidebar, filters, quests, route controls and animated detail drawer remain in use.

## Data and existing histories

The actual local housing/map database now publishes six whole-city communities in Davao Region: Davao, Panabo, Island Garden City of Samal, Tagum, Digos and Mati. Geometry comes from the source-dated PSA/NAMRIA-based upstream city files, with the edition, simplification, source URLs and SHA-256 hashes retained in `backend/community_map/data/davao-region-cities-2023.geojson`. This is sourced city coverage, not arbitrary rectangles, animal-derived geography or nationwide municipality coverage.

`import_city_communities` validates the bounded extract before publication and runs atomically. It unpublishes smaller barangay/zone areas and disables/closes their rooms while retaining their geography, room records and histories. It publishes one unsplit room for each city and stores its presentation color in source metadata. The existing Davao city identifier is retained. Administrative publishing accepts changes to parents whose old children have been retired, while preserving the previous boundary-change guard for parents with published children. No schema migration was necessary: the existing model already supports the city kind.

Both the public discovery endpoint and housing entry checks now explicitly require `kind=city`. Old smaller-area links cannot bypass this by remaining enabled or being manually requested. Existing real-account realm, blocking, visibility, room-open, capacity and live-connection checks remain. No animal identities, member login accounts, evidence, payments or Kibble were generated. System room hosts use the existing non-login game resource pattern.

Command (from `backend`, with the intended housing service environment):

```bash
python manage.py import_city_communities --skip-checks --file community_map/data/davao-region-cities-2023.geojson
```

The import completed against the running local housing database and its service was restarted while retaining its environment. The social preview remains running.

## Map presentation and interaction

Cities have distinct persisted colors: teal, blue, purple, burnt orange, rose and green. Both MapLibre and raster/SVG rendering use solid 2.75px outlines with a white casing, thicker selected/hover borders and restrained city-colored fill. These are whole administrative city shapes, including multipolygons and holes; there are no displayed custom-zone dashed lines.

Hover uses a pointer, brighter fill/outline and an edge-constrained named preview with a door icon and “Click to view and enter.” The preview composes the existing official shadcn Card. Clicking or tapping the map opens the existing full-height city drawer; its final Enter community action retains the real room URL. The official Select offers the equivalent named keyboard path and includes color swatches. Text identifies each community independently of color. City labels, whole-city scope, source edition and approximation remain explicit in the drawer.

Route-origin selection and active animal destinations keep priority over city selection. Hover is suppressed during picking, active route destinations and detail overlays. The source updates geometry separately from hover paint, avoiding GeoJSON replacement on every mouse move. Raster projected paths remain cached by source/zoom.

Only the seven geography/frontend files were mirrored into the social implementation worktree, with import-prefix translation. No blanket synchronization, medical/profile changes or 3D edits were made.

## Review and screenshots

Impeccable used the session's announced direct-context fallback, current product/design context, layout/operation guidance and craft floor. Work and review were performed directly without agents. Jev received only a generic scope/privacy/interaction summary; it selected enforcing whole-city discovery and room entry with existing access rules as the primary review focus. Its judgment was checked against the actual service source.

Firefox read the live relay and returned exactly six city features with six distinct colors and whole-city room IDs. Desktop keyboard selection opened Davao's city drawer and produced the correct room entrance link. Actual raster-map hover showed the named entrance cue and highlight without page errors. The first phone tap occurred before geometry loaded; after waiting for the visible layer, a genuine touch tap opened Davao's drawer and its matching entrance, with no horizontal overflow. The final UI boundary check passed.

Actual rendered PNGs are in the social worktree's `output/playwright/city-communities-2026-11-09/`: `cities-hover-desktop.png`, `city-drawer-desktop.png`, and `city-mobile.png`. The two bounded capture rounds were reviewed. Source review covered the equivalent MapLibre path; Firefox used the raster fallback, so vector hover is not claimed as runtime-verified. Authenticated multiplayer entry, capacity and legacy-room rejection were not exercised end to end. No broad test suite, typecheck or production build was run.
