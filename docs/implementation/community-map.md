# Community map: discover, preview, enter

The owner chose **MapLibre + OpenFreeMap**, with no API key. Entry is `/play?map=community` in the community app, or `/?map=community` in standalone Vite. Exploration has an **Explore places** action; Homes has a **Places** action. The existing in-game world map remains separate.

The [sample neighborhood](sample-neighborhood.md) adds eight furnished demo homes and four care-oriented demo shelters in three clusters. It is visible by default with a hide/show switch. Explicit demo entry uses a separate local guest session, without changing platform login.

## Experience

- Full interactive geographic map with type-specific home, shelter, and community icons, zoom controls, attribution, and clustered points.
- Clicking a cluster expands its zoom and shows its member places in the list. Clicking a pin or list item opens an inline preview with description, area, provenance, host, and actual occupancy/pet counts when available.
- Search by place, neighborhood, or host; filter by type; **Search this area** scopes the list to the current viewport. Clear filters restores the directory.
- **Enter home** and **Join commons** open the existing signed-in multiplayer room. Capacity, blocks, invitations, closed doors, and realm permissions remain enforced by the Homes service when entering.
- Shelter previews offer the actual platform profile plus **Enter care space**. This opens the existing shared exploration shelter interior and limits imported encounters there to that shelter's eligible public animals. It is a virtual visit, not a separately implemented multiplayer shelter room or a copy of the physical building. Fictional volunteers/story content remains fictional.
- Desktop combines a searchable list, large map, and inline place preview. Mobile stacks the map and scrollable list, with a preview anchored inside the map area. The list and entry actions remain usable if map loading/WebGL/tiles fail.
- Loading placeholders, retry, empty search results, missing-image fallbacks, room-full state, immediate entry feedback, keyboard list controls, and reduced-motion camera transitions are included.

## What appears on the map

**Shelters:** the platform bridge pages through the existing public shelter directory. It projects only its public fields and published approximate location. Photos marked sensitive are omitted; sample provenance stays visible. No new core social API is invented. The standalone world has a clearly fictional practice shelter and a virtual community hub.

**Homes:** an authenticated `GET /api/homes/places` lists up to 500 opt-in, open, accessible homes in the viewer's sample/real realm. The batch query applies owner/public/friend/invitation access, valid invitation expiry, and blocks. Counts come from recent room presence and linked virtual pets; no audience numbers are fabricated. Entry permissions are checked again through the existing room flow.

Owners choose **Homes → Settings → Your place on the map** and save a neighborhood, or leave the home **Unlisted**. Existing homes default to unlisted. A new `PlayerHouse.map_area` column stores only an area ID. Stable fictional offsets distribute virtual homes around the chosen neighborhood center; these are not private residential coordinates. No device geolocation is requested. Door access and map listing are independent: a private home is visible only to its owner, and closed homes are excluded.

The starter home-area catalog is a Davao pilot: Poblacion, Buhangin, and Matina. Public shelter records elsewhere still appear and can be selected from the list. Additional home areas must be added to both the frontend catalog and backend allowlist. Discovery does not yet include events, member-created organizations, a new shelter live-room service, pagination beyond the 500-home bound, or search-engine geocoding.

## Source and runtime

| Boundary | Source |
| --- | --- |
| Map page, renderer, and previews | `src/components/game/community/` |
| Place DTOs and starter areas | `src/game/community.ts` |
| Public shelter projection | `integration/platform-bridge.ts` |
| Authenticated home directory | `backend/housing/discovery.py` and `views.py` |
| Opt-in home field | `backend/housing/migrations/0002_playerhouse_map_area.py` |
| Owner listing controls | `src/components/game/housing/panels.tsx` |

MapLibre GL JS is pinned to 6.16.0 in both workspaces. The map renderer is loaded only when the geographic map is opened. The same-version ESM worker/shared module is hosted under `public/pawtrail-game/maplibre/` for both Vite and Next; its BSD license is retained. Run `npm run maps:prepare` after intentionally upgrading MapLibre, then synchronize runtime files to the community app. Vendor MapLibre CSS supplies required map controls; product layout and states use Tailwind and official shared shadcn components. No registry primitives were replaced.

The worker requires the normal application static-file origin. Tiles, glyphs, and styles use OpenFreeMap's external service, so an internet connection is required for the basemap. Keep its attribution visible. The map is not an offline map pack.

The local migration was applied without running automated system checks. Existing setup still uses `npm run dev:homes` for the housing service and the separate Next dev server for platform sessions. No server is started by opening the directory; if Homes is unavailable, public shelters and the local practice entry remain usable.

No automated tests, typechecks, builds, browser verification, or screenshots were run for this change, following the owner's standing instructions. The implementation needs hands-on browser review, especially map rendering and signed-in room entry.

References: [OpenFreeMap setup and attribution](https://openfreemap.org/quick_start/), [MapLibre clustering](https://maplibre.org/maplibre-gl-js/docs/examples/create-and-style-clusters/).
