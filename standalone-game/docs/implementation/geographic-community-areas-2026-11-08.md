# Local community areas — 8 November 2026

> Superseded on 9 November 2026: active discovery and entry now use unsplit whole-city communities with distinct colors. Historical barangay/zone records are retained but unpublished and closed. See [city communities](city-communities-2026-11-09.md).

The owner selected smaller local areas with custom subdivisions. The map now reads published geographic communities from the housing/map database. Selecting an outline or the keyboard-accessible Local communities selector opens the shared animated right drawer. The drawer shows parent area, approximate size, actual room capacity and source edition, then offers Enter community. Entry opens that area's real shared game room through the existing account, access, capacity and WebSocket services.

## Imported coverage and provenance

The local database contains 182 sourced Davao City barangays and 237 enterable community areas: 127 whole-barangay communities and 110 custom zones produced by dividing 55 larger barangays into two. Parent barangay and city records remain stored. Source geometry comes from the PSA/NAMRIA-based Barangay Boundaries Repository, PSGC snapshot 2023-10-24 and NAMRIA geometry edition 2023-11-06. The upstream extract is simplified at 0.005 degrees; this limitation and its dates are retained in metadata and the detail drawer. It is not a newly surveyed boundary layer. The initially considered PSA GeoRisk endpoint timed out; no 2016 GeoRisk geometry was imported.

Source: https://github.com/bendlikeabamboo/barangay-boundaries-repository/tree/main/2023-10-24/hierarchical_t0p005

The normalized Davao GeoJSON, attribution, upstream content hash and upstream code license are retained in `backend/community_map/data`. It is an import source, not a browser fallback. Visible map geometry always comes from persisted published records. No user/home/animal coordinates were used to invent regional boundaries, and no animal identity or member account was created by the import. Internal, non-login game-host resources hold the shared rooms, with zero local wallet balance and hidden directory visibility.

## Models and service

`CommunityArea` owns source/version metadata, parent hierarchy, full geometry, simplified display geometry, bounds, representative point, approximate size and publication state. `GeographicCommunity` links a leaf area to one existing housing room. Migration `community_map.0003_communityarea_geographiccommunity` was applied to the actual local housing database.

`GET /api/v1/map/communities/` returns published leaf areas with enabled, open, public communities. Bounds and area-ID inputs are validated. The response is limited to 180 areas and 50,000 vertices with explicit truncation; private evidence, precise animal/home coordinates and membership records are absent. The integrated app uses the allowlisted, no-store `/api/game/community-areas` relay. Geometry loads independently from animal discovery, with abortable/debounced bounds requests, bounded public caching, loading, empty, unavailable and retry states.

The room namespace is `system:hub:geo:<area UUID>`. Housing entry and the live connection recheck the area's publication/leaf state and community enablement, then retain normal real-account realm, blocked-user, open-room and capacity checks. Each room has its own live group and conversation. Geographic rooms do not inherit unrelated residential plots or home-block navigation. They share the existing game backend; no separate physical server process was provisioned per area. Existing social feeds and cross-area missions are not repartitioned by this game-room entry feature.

## Custom subdivisions

The initial import used a configurable 10 km² threshold and split each larger source barangay once, along the longer bounding-box axis. Each child is explicitly named Zone 1 or Zone 2. Shapely validates polygon geometry and the resulting children, including non-empty area, parent coverage and no overlapping interiors. The cut rule is stored. Default splits are geographic partitions, not claims about population or equal workload. Existing subdivisions are preserved on reimport; changing their source boundary requires a new source edition rather than silently invalidating child geometry.

Administrative operations:

```bash
uv run python manage.py migrate --skip-checks --noinput
uv run python manage.py import_community_areas --skip-checks --file community_map/data/davao-barangays-2023.geojson --split-over-km2 10
uv run python manage.py split_community_area --skip-checks <area-slug> --axis longitude --cut <longitude>
```

Run these from `backend` using the intended database/service environment. The commands are not public editing endpoints. Imported/source areas and their custom subdivisions never provide animal identification evidence or verified Kibble.

## Map and UI behavior

Both MapLibre and the raster/SVG fallback draw the stored polygons, including holes and multipolygons. Normal boundaries use restrained brown lines; custom community subdivisions use dashed teal lines. Selecting an area emphasizes its fill/outline and fits its full bounds while reserving space for the floating sidebar and detail drawer. The selected stored polygon is retained across viewport paging so its outline cannot disappear when the response limit omits it. Raster paths cache projected vertices per zoom rather than recomputing geometry during each pan. The left panel offers a border visibility switch and official shadcn Select as the keyboard alternative to map clicks.

Picking a route origin takes priority over community selection, and background area clicks cannot replace an active animal destination. Selecting an animal or explicitly choosing location tools clears the community drawer. The shared official Sheet composition retains its full-height layout, fixed entry action, 300/200 ms slide and reduced-motion behavior. The standalone now uses the existing canonical ButtonAnchor composition as the social app does. No registry source was modified, no decorative raster was generated and font roles remain Saira Condensed/Instrument Sans.

Shared map source and the relay template were mirrored narrowly. The synchronization script now preserves the community relay and map quest loader. Source review caught and fixed a missing `mapQuests` assignment on the runtime platform bridge and integration template, so the existing recorded progress/My quests loader is now attached.

## Operations and verification limits

The schema migration and actual database import completed; the importer reported 182 local areas and 237 community rooms. The housing service was reloaded with its existing environment and port, and its startup log reported listening on 127.0.0.1:8001. The Next preview remains running.

Source review only. No automated tests/checks, production builds, HTTP integration probes or browser verification were run under the owner's standing instruction. Import-time geometry validation and schema/data writes are implementation operations, not an end-to-end verification claim. The new map selection, authenticated room entry, live-room separation and responsive rendering still need an explicitly requested runtime test. No account credentials, private evidence, payments or authoritative reward totals were changed.
