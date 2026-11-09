# Oreo route end-to-end verification — 8 November 2026

The Oreo directions flow passes in Firefox with the existing local database and live walking-routing service. Eight application route requests returned HTTP 200 and all retained Oreo's destination. No database records or accounts were created or changed during this verification.

## Verified identity and location

The public animal lookup returned **Oreo**, ID `f32e61ab-3484-5745-ab25-394ab7f1fb2c`, slug `oreo`, in Matina. Its current published destination is `[125.5894, 7.0541]` (longitude, latitude), with a 1,500 m uncertainty radius. Oreo has no published last-sighting record, so the route correctly uses the published profile location and states that no last-seen time is recorded. This is an approximate area, not the animal's live position.

Every captured route request used that destination. Depending on approach, the mapped path ended 9.4–18.4 m from the destination pin. The separately displayed road-access gaps were within the 75 m limit. The account-independent guest flow used the neutral person avatar and labelled the manually selected origin **Start**.

## Firefox interaction results

| Interaction | Result |
| --- | --- |
| Open Animals and select Oreo from the list or its shelter membership marker | Correct animal drawer, characteristics and `/pets/oreo` profile action |
| Device location unavailable | Offers manual map selection and continues naming Oreo |
| Click a map starting point | Live route, distance, ETA, origin marker and named destination pin appear |
| Change starting point using arrow keys and Enter | Origin changes, Oreo's destination stays fixed, no additional animal lookup |
| Click another animal marker while choosing the origin | Click is used as the starting position; target remains Oreo and no other animal drawer opens |
| Cancel starting-point selection | Restores the previous route |
| Update route | Preserves both chosen coordinates |
| Show full route three times | Stable camera and endpoint positions; no progressive zoom-out |
| Expand walking instructions | Real provider instructions display |
| Open Maps action | URL retains walking mode and the same origin/destination |
| Stop directions | Removes the directions panel and destination pin |
| Disable the vector style request to exercise the fallback | Real raster map, blue walking line, origin and unclipped destination label remain usable |

The first test used headed Firefox. Its animation timeline later stopped advancing while JavaScript time continued; repeat and final tests ran in headless Firefox without that harness problem. No Chromium browser was used. The fallback test deliberately aborted only the vector-style request; it did not mock animal data or routing results. Expected failed-style console output is confined to that fault-injection case. Captured application page exceptions: **0**. The native vector style also emits upstream missing-POI-icon warnings; these did not affect the route or animal markers.

## Shortest walking route comparison

For the first clicked origin `[125.59177437792232, 7.052780880144439]`, the live provider returned:

| Request | Route distances |
| --- | --- |
| Distance-only pedestrian routing, unranked nearby candidates | **408 m**, 413 m, 526 m |
| Default pedestrian costing, same points and candidate limits | 414 m, **408 m**, 526 m |

PawTrail selected **408 m**, with a provider duration of 339.284 seconds (shown as about 6 minutes), and ended 9.43 m from Oreo's public point. A second clicked origin on Carlos Villa-Abrille Drive produced a direct **259 m** route, shown as about 4 minutes. Additional origin-change cases produced 403 m, 424 m, 1,035 m and 557 m routes, reflecting the different chosen starts.

This verifies selection of the shortest available mapped pedestrian candidate for the compared start. It cannot establish paths that are absent from the provider's map or override access restrictions. Distance-only costing and candidate ranking are documented in the [Valhalla route API](https://valhalla.github.io/valhalla/api/route/api-reference/).

## Fixes made during verification

- The Animals counter now counts distinct member animals: **18**, instead of zero. The standalone map also uses the existing membership projection when filtering animals.
- Destination labels have sufficient camera margins in the vector and fallback renderers.
- Route fitting uses MapLibre's `absolutePadding: true`. Previously the drawer padding was added to existing map padding, leaving too little usable width and zooming a short route out to city scale. See [MapLibre camera padding](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraForBoundsOptions/).
- The static destination pin stays accessible while interactive animal and origin markers are inert during start selection.

Matching map refinements were applied narrowly in the standalone game and the social worktree. No registry component source, backend data, reward or identification reference changed.

## Checks and evidence

- Focused discovery regression tests: **9 passed** across geolocation, member projection and walking-response validation.
- `npm run typecheck`: passed.
- `npm run check:ui`: passed.
- No production build or full test suite was run.

Evidence is in [the Firefox artifact directory](../../output/playwright/oreo-route-2026-11-08/verification-summary.json): normalized network captures, raw provider responses and comparison, and screenshots. Representative captures are [the corrected vector route](../../output/playwright/oreo-route-2026-11-08/10-keyboard-origin.png), [stable repeated fitting](../../output/playwright/oreo-route-2026-11-08/11-stable-repeated-fit.png), and [the fallback route](../../output/playwright/oreo-route-2026-11-08/12-fallback-route.png).
