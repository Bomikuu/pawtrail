# Nationwide city communities — 9 November 2026

The owner expanded coverage from Davao Region to the Philippines and clarified **only cities**, excluding rural municipalities. The active database and public/entry contracts now implement that final choice: 149 whole city communities nationwide, without barangay or custom-zone splits.

## Source and stable rooms

`backend/community_map/data/philippines-cities-2023.geojson` contains the sourced city polygons, provenance, upstream hashes and normalization notes. It is approximately 251 KB and contains 5,141 native vertices. The reproducible preparation script consumes the upstream highly urbanized, component and independent component city files. The source edition is explicitly PSGC 2023-10-24 / NAMRIA 2023-11-06, with the inherited simplified geometry; no 2026 survey claim is made.

Isabela's duplicate administrative container is excluded in favor of its actual city polygon and the component-city code in the reference coverage report. This produces 149 distinct city identities. Neighbor-aware colors prevent adjacent areas from sharing the same hue; the original Davao city keys and six colors remain stable.

The import was applied to the actual housing/map database. Every city uses the existing persisted shared-room namespace and account/live service. Earlier barangay/zone records remain unpublished and closed. Municipal resources prepared before the owner's clarification are also unpublished, disabled and closed; their retained historical kind accounts for migration `community_map.0004`. They do not appear in discovery or accept entry. No member login accounts, animals, clinical records, reward credits or payments were created.

Public discovery and both housing access checks explicitly require `kind=city`, even if a caller supplies a retired non-city room identifier. Existing account realm, blocking, visibility, capacity and live checks remain.

## Loading and UI

The endpoint retains viewport filtering and bounded responses, with a 2,000-feature and 75,000-vertex ceiling. Country views use lighter display geometry; street-scale views retain the stored detailed outline. The complete national city layer fits well inside these limits, so it is not truncated. The frontend accepts the national response, retains abort/debounce/bounded caching, and uses a linear name-count lookup to disambiguate identically named cities by province/context. The Map icon is aliased to avoid shadowing JavaScript's native Map collection.

The existing colored borders, hover preview, keyboard city selector, animated entrance drawer and touch path remain. Municipality labels/paths were removed after the scope clarification. City/province context helps distinguish Naga, San Carlos, San Fernando and Talisay. No changes were made to medical profiles, player/cat 3D systems or unrelated social work. Five community source files were mirrored narrowly into the social app; no blanket sync ran.

## Verification

The final required UI boundary check passed. Firefox rendered the live country layer and exposed cities from Luzon, Visayas and Mindanao in the selector. The nationwide live relay returned 149 features, all with city kind, with `truncated=false`. The Quezon City drawer/entrance and desktop/mobile layouts were inspected. Screenshots are in the social worktree's `output/playwright/nationwide-communities-2026-11-09/`.

A real picker rendering error caused by the Map icon/native Map naming collision was found and fixed. Source/render review also found that raster animal-data updates could automatically fit the camera back to Davao after navigating to a distant city. That automatic recenter was removed; the explicit Show all places action is retained, and data refreshes preserve the chosen view. Earlier capture helpers also incorrectly assumed a raster renderer or waited for a network request that could be served from the frontend cache; those helper assumptions were corrected. Firefox's active renderer for the national view is MapLibre/WebGL. No broad test suite, typecheck, production build or authenticated multiplayer entry test was run. This is a geographic discovery/room expansion, not a population of animal posts nationwide.
