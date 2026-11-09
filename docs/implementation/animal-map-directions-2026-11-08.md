# Animal map directions — 8 November 2026

The animal popup on `/play?map=community` now offers **Go to {animal name}**. It requests the visitor's device position or accepts a manually selected starting point, draws a shortest available mapped walking route, shows their current account avatar, and displays estimated walking time, distance and expandable walking instructions. The visitor can refit the route, update it, stop directions or open the destination in Google Maps.

## Location meaning and privacy

- Routing uses published database locations, never marker avatar offsets or generated nearby records.
- The integrated bridge rechecks that the animal is still publicly listed before resolving its destination. It uses the latest published, active sighting when available; otherwise it uses the published approximate animal profile location.
- Latest sightings are ordered by observation time, not database order or approval time. Sighting destinations retain the public two-decimal coordinate generalization and at least a 1,500 m radius. Private capture coordinates are not returned.
- If only a shared place is known, the UI identifies it as a shared place, not a sighting. Missing last-seen timestamps are stated explicitly.
- The route panel says **Approximate location, not live tracking**, shows a real last-seen time when recorded, warns that the animal may have moved, and states that travel time is approximate. The published uncertainty area remains visible around the destination.
- The visitor's location is sent only when they request directions, in a POST body. It is not persisted, published to other map visitors, written into game saves or used as reward evidence. Routing provider attribution remains visible.
- Signed-in visitors use their own avatar. Visitors without an avatar receive a neutral person icon.

## Routing service

The housing/map Django service owns `POST /api/v1/map/route/`. The integrated Next app uses a same-origin relay at `POST /api/game/directions`; the standalone game calls the map service directly.

Valhalla is requested with `costing=pedestrian`, `costing_options.pedestrian.shortest=true`, a 4.5 km/h walking speed, and kilometer output. The UI uses the provider's route geometry and travel duration. It does not draw a straight line and call it a walking route. Dashed connectors distinguish the short connection to the road graph from the routed path. Both MapLibre and the raster fallback render the same route and avatar.

Configuration belongs on the **housing Django process**:

```dotenv
PAWTRAIL_ROUTING_URL=https://your-valhalla-service.example/route
PAWTRAIL_ROUTING_CLIENT_ID=pawtrail.example
```

For local development, the bounded default is `https://valhalla1.openstreetmap.de/route`. Production has no public-demo default and requires an explicitly configured service. Requests have time, response-size, coordinate and local walking-distance limits. The public development provider has a shared cooldown, and route requests also have a per-caller limit. Unavailable, unrouteable and permission-denied states keep retry, cancel and Open Maps actions usable.

Provider references: [Valhalla route API](https://valhalla.github.io/valhalla/api/route/api-reference/), [Valhalla public development service and usage guidance](https://github.com/valhalla/valhalla/blob/master/docs/docs/start/introduction.md). A production operator using the public community service should follow its published usage guidance or use a hosted/self-hosted endpoint.

## Source ownership

Map UI and route helpers are maintained in the standalone game's `src/components/game/community` and `src/game/discovery`, with matching changes applied narrowly to `src/features/neighborhood` in the social worktree. Integrated-only public database projection and Next relay remain in that worktree. Existing official shadcn Buttons and Cards, Tailwind utilities, map markers and font roles were reused. No dependency, database migration, fixture record, native frame dimension or reward change was introduced.

## Verification status

Source review only. Per the workspace's standing instruction, no automated tests, checks, builds or browser verification were run for this feature. The prior E2E report applies to the earlier interaction fixes, not this new routing flow.


## Full-height drawer and manual starting point

The animal detail now composes the official shadcn Sheet installed using `npx --yes shadcn@latest add sheet --yes` in both projects. The standalone game also installed its official Skeleton with the same CLI. Registry source was not modified. The animal Sheet is non-modal, full viewport height and right-aligned; it uses a 300 ms slide-in and 200 ms slide-out, with reduced-motion overrides. Its parent retains closing content for 240 ms. The title/close header and action footer stay outside the scrolling detail body. Other place popups keep their existing layout.

The drawer loads published sighting photographs through a map-only bridge method. Captions use each sighting's recorded time, approximate area and public observation text. Missing photos show an honest empty state; failed loads have a retry action. No illustration is substituted for a sighting photo.

When device position is unavailable, directions automatically enter map-picking mode. The visitor can click/tap a starting point, or pan with arrow keys and press Enter at the center pin. Existing map markers become inert during selection so they do not intercept the choice. The chosen point carries the visitor's avatar, is labeled Start, and has no GPS accuracy circle or GPS accuracy claim. Updating directions preserves a manually chosen start; Change starting point allows moving it. Cancelling selection restores the preceding route or error state. The chosen coordinates remain ephemeral and are used only for the route request.

This extension remains source-reviewed only; no automated verification, builds or browser checks were run.


## Compact animal actions and route destination correction

The reported screenshot shows a Snow route while the visitor intended Oreo, and a path ending far from the animal marker. Source review found two independent destination problems: routing could correlate to roads up to 1,000 m away without validating the returned path endpoints, and an animal's member avatar could remain at its shared place while routing used a different published animal/sighting location. The exact Oreo-to-Snow interaction was not reproduced in a browser.

The refinement makes the route's animal ID, public name, area and coordinates a single resolved destination. The public bridge returns the verified animal ID; mismatches are rejected. Choosing or changing the start, or retrying the route, reuses that destination instead of looking it up again. Route state updates its current reference in the same event, rejects stale asynchronous responses and duplicate origin taps, and cannot restore an old route after stopping. Cancelling a start change restores the previous route, or restarts an interrupted request. Device location requests for directions no longer change discovery selection or enable the separate nearby-area picker. Closing animal drawers are inert.

Both map renderers now draw a labelled animal destination pin at exactly the requested public coordinates, including while choosing a start. The routed animal's ordinary/offset membership avatar is suppressed for the duration of directions so there is one destination representation. Other place/member markers remain. The list highlights the routed entity, and hover previews cannot move the map during navigation. Native markers are cleared while the raster fallback is active, and cluster signatures include current member data.

Valhalla locations use a 25 m candidate radius, a 75 m search cutoff, and `rank_candidates=false`, alongside distance-only pedestrian costing. A single provider request asks for up to two alternatives. The server accepts only pedestrian paths whose first and last geometry points are within 75 m of the requested points; it chooses the candidate with the shortest mapped length plus its access gaps, with time as a tie-breaker. The client independently validates both requested coordinates and the 75 m endpoint limit before drawing a result. An unavailable close route is an actionable error, never a fabricated line/ETA. Dashed access links remain explicit and are excluded from walking distance/time; gaps over 10 m are described in the panel. Public location uncertainty does not increase the snapping limit. Shortest available routing still depends on mapped walkable connections and access restrictions.

The animal hero is now 128 px high on narrow screens and 144 px on wider screens; placeholder art is 96/112 px. The pinned footer has a 44 px primary Go to action, a labelled accessible More menu, and separate Add sighting and Ways to help controls. Profile, follow, device bookmarks, request help and concern reporting are grouped in the official existing shadcn DropdownMenu. Duplicate animal controls were removed from the scrolling body. Sheet animation, full-height behavior and published sighting photos remain. No registry source, dependency, database record, identification reference or reward was changed by this refinement.

Source review only for this refinement. No automated tests, checks, builds or browser verification were run. The housing routing process is reloaded to pick up the Python change; Next's development server remains running.


## Firefox verification update

The owner subsequently requested end-to-end verification. The 8 November Firefox run exercised manual click and keyboard starts, another animal marker during origin selection, cancellation, retry, repeated fitting, walking instructions, external direction coordinates, stop, and the real raster fallback. Eight live route requests retained Oreo and returned HTTP 200, with no application page exceptions. A live comparison verified 408 m was selected ahead of 413 m and 526 m alternatives. Nine focused tests, TypeScript and UI boundary checks passed. Camera fitting now replaces existing padding using MapLibre `absolutePadding`, destination labels have safe margins, static destination pins remain accessible during picking, and the Animals count includes member animals. See the social worktree report `docs/implementation/oreo-route-e2e-2026-11-08.md` for measurements, screenshots and limits. This update supersedes the earlier source-review-only status for the flows exercised.


## Header-free map and portrait drawer layout

The full-width discovery header was removed. The brand, Places map title and existing home/account/navigation menus now live at the top of the left sidebar. On phones, Show place list is available in the map toolbar and Show map returns from the sidebar. The map occupies the full viewport height.

Animal details now open with an 80 px circular portrait (96 px on wider screens) beside the name, database-recorded species/age/gender and status. There is no animal banner image. Public location, linked shared place, help status, compact three-column sighting photographs with captions, About text from the loaded profile, and characteristics follow in the scrolling body. Existing fixed actions and official animated Sheet are retained. Other place popups retain their image layout. No routing, API contract, backend record or reward changed.

This later layout change was source-reviewed only. No tests, automated checks, builds or browser verification were run for it, following the standing workspace instruction. The preceding Firefox report covers the earlier routing implementation, before this layout refinement.


## Consistent map detail drawers and readable animal facts

All selected map entities now use a shared `DetailDrawer` composition of the installed official shadcn Sheet. Events, help requests, shelters, homes, Hordes and welfare reports use the same right alignment, full viewport height, 28 rem maximum width, close/focus behavior and 300/200 ms slide animation as animals. The parent still retains closing content for 240 ms. Registry sources were not changed. Non-animal entities retain their image banners and existing missing-image fallbacks. Their visit/profile/help/report/bookmark actions are pinned outside the scrolling body, with wrapping labels and safe-area padding. The old floating Card, mobile expand/collapse bar and duplicate close/title controls were removed.

The animal header keeps its circular portrait. Summary facts are joined as normal text with explicit spaces, rather than adjacent flex fragments. The shared age presentation converts a 30-month record to “2 years 6 months” and uses singular/plural units correctly; missing or invalid ages are not inferred. The same formatter is used in the characteristics section. Species and known gender are capitalized. Sheltered status displays as “In shelter care” with a care icon in a separate badge, with corresponding labels for the other existing care states. All values still come from the public record.

Both the standalone game and the social worktree received the same drawer and fact formatting. The Next worktree retains canonical ButtonLink navigation and ButtonAnchor document actions for the pinned place controls. No routing, API, database, reward, fixture or identification-reference change was made.

Source review only for this change. No tests, automated checks, builds or browser verification were run, following the current workspace instruction. Earlier Firefox verification predates this drawer refinement.
