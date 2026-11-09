# Community discovery

Open `/play?map=community`. This extends the existing MapLibre + OpenFreeMap map, street-map fallback, home listing permissions, shelter profile links and room entry. It does not replace the Phaser neighborhood or introduce Google Maps.

## Three independent relationships

| Concept | Implementation | What changes it |
| --- | --- | --- |
| Animal membership | Stable platform animal IDs on a home, shelter or Horde; signed public home memberships use `HomePetMembership` | The actual membership changes, never map zoom |
| Geographic cluster | MapLibre clusters visible map entities; street-map fallback groups nearby screen positions | Zoom and the visible entity layers |
| Proximity | Spherical distance from a selected entity, an explicit map point or a one-shot device location | The selected center and 100–5,000 m radius |

An animal referenced by multiple entities counts once in cluster/proximity animal totals. Group badges show entity count; home/Horde/shelter badges show publicly shared animals. A shelter member does not automatically become a separate stray-animal pin. Owned/adopted animals remain in their explicit associations. Counts reflect the loaded public snapshot, not a complete census.

## Map interface

- Circular photo/collage markers for animals and groups, type icons, urgent indicators, hover/focus proximity circles and synchronized list selection.
- Search names, neighborhoods, hosts and member animals. Eight independent layers: homes, shelters, communities, animals, Hordes, help, urgent cases and incident reports. Geographic grouping and contribution areas have separate switches.
- Filters for publicly shared animals, available visitable spaces, documented contribution levels, illustrative samples and device-local saved places.
- Cluster composition includes distinct shared animals. Expanding a cluster preserves the current entity selection.
- Nearby controls offer 100/250/500/1,000 m presets and a custom 100–5,000 m radius. Nearby counts can filter the list. The circle uses geodesic geometry; it does not grow with zoom.
- **Nearby me** requests location once. Coordinates remain in browser memory; they are not sent to a tracking endpoint or saved to localStorage. A public-record proximity request includes the center as query parameters, so normal server/access-log privacy policies still apply. There is no continuous position watch. Denied/unavailable permission offers manual map selection.
- Desktop details float over the map. Mobile details expand/collapse by the handle button or a short vertical drag. Mobile Map/List controls expose the same filters and actions.
- Animal profiles, sighting capture, follow actions and published help missions use the existing platform flows. Local help requests accept private offers visible to their organizer/reviewers.
- Source failures preserve available records and provide retry. Loading cards, missing-image icons and empty results have explicit placeholders. Public report responses are bounded to 500 per record type, and platform domains to 250 records each; truncation is disclosed.

## Contribution evidence and welfare

These use different tables, calculations, filters and display sections. No Good/Bad classification is produced. A positive score cannot subtract from or hide an unresolved concern.

**Contributions:** reviewer-recorded evidence references, deduplicated by subject/source, with a rolling one-year window. Fixed internal weights cover feeding, approved missions, care, volunteering, rescue, shelter support and incident response. A record has an unrated, growing or established contribution level; insufficient evidence remains unrated. Game Kibble, visits, chat, local saves and simulated actions are not inputs. This delivery does not automatically infer verified contributions from client totals or automatically certify remote evidence references.

**Welfare:** private incident submissions with category, observation time, direct-witness declaration, precise submitted coordinate and optional evidence. Statuses are submitted, under review, needs information, corroborated, resolved, rejected and archived. Public summaries require an explicit reviewer decision. Published under-review records are visibly unconfirmed. Public map locations are generalized to a 0.005-degree grid, labeled approximately 500 m. The public map uses a 90-day observation window. Reporting absence is never described as proof of safety.

Corrections/additional information and appeals remain private. Reviewer decisions use a version guard and retain an incident review audit entry. Uploads accept up to six JPEG/PNG/WebP/PDF/MP4/WebM files of at most 10 MB each. The server detects supported signatures, assigns opaque storage filenames and serves downloads only through owner/reviewer authentication. Raw reporter details, attachments and submitted coordinates are absent from public DTOs.

**Help:** separate records with priority, category and moderation. Critical requests expire after four hours; other requests after seven days. Expired requests cannot be published and disappear from active map responses. This is assistance coordination, not incident corroboration.

## Service boundaries

| Source | Responsibility |
| --- | --- |
| Existing social API on port 8002 / its configured adapter | Public animals, shelters, Hordes, missions and account roles, where those domain endpoints are implemented |
| `integration/platform-bridge.ts` | Bounded public DTO projection and a short-lived cache; strips sensitive photos and private fields |
| Housing Django service on port 8001 | Permission-aware homes, explicit public home/animal join records, private reporting, review, offers and verified contribution records |
| `integration/housing-session-route.ts` | Signed account/role/public-pet assertions; browser input cannot grant reviewer privileges |
| `/api/game/community-records` | Same-origin relay of public reporting records only; forwards no account credentials |
| `src/game/discovery/` | Shared DTOs, distance/deduplication and bounded cached public requests |
| `src/components/game/community/` | Accessible map/list controls, native map markers, contextual details and report/review forms |

There is no duplicate User, Animal or Shelter table. `MapSubject` contains typed references to existing external IDs. `HomePetMembership` is an explicit join with a signed public snapshot, supporting public cats and dogs independently of the existing cat-only virtual home-care feature. Existing live home data is refreshed on a signed session exchange. Public membership/profile changes in the platform must be reflected by that exchange; this is not a live cross-database synchronization worker.

The current real identity API implements animals and camera/identity records; shelter/Horde/mission coverage still depends on the configured social adapter. Missing domains yield partial-source notices, rather than invented real records. Existing fictional home/shelter samples remain labeled. No fictional poisoning, abuse or violence allegations are seeded as verified cases.

## Review workflow

1. Sign in through the platform and open the discovery map. Choose a center or entity, then **Report concern** or **Request help**.
2. **My reports & review queue** shows your private submissions, files and status. Saved files can be downloaded; failed uploads can be added to the saved report without resubmitting it.
3. A platform `moderator` role produces a signed `mapReviewer` assertion. In the real platform API, staff or membership in `identity_reviewers` supplies that role. Guest sessions never receive it. Sign in again after a role change so a new assertion is exchanged.
4. Reviewers open **Review queue**, write an approved public summary, choose status/severity and explicitly publish it. Public fields are serialized separately from private records.
5. With a subject selected, the reviewer contribution form can record a documented `platform:` or `review:` source reference. This is a moderation action, not a self-awarded point form.

Private reports and reviewer access are isolated between real and sample realms. Authenticated creation uses the existing signed housing bearer session, origin restrictions and rate limits. Public external reference publication depends on a reviewer validating the referenced entity/evidence; there is no public entity-ownership certification endpoint.

## Persistence and spatial deployment

Applied locally without system checks:

- `housing.0008_petgameprofile_map_visible_and_more`
- `community_map.0001_initial`
- `community_map.0002_reputationevent_created_at_and_more`

Local SQLite queries use indexed public coordinate bounds followed by exact Haversine distance, with bounded responses. Production can opt into the separate GeoDjango index:

```sh
# Use a PostgreSQL database with the PostGIS extension and native GEOS/GDAL/PROJ installed.
export PAWTRAIL_MAP_POSTGIS=1
export DATABASE_URL='postgresql://…'
uv run manage.py migrate --noinput --skip-checks
uv run manage.py reindex_discovery --skip-checks
```

Run these from `backend/` with the normal deployment environment. Provision `CREATE EXTENSION postgis` through database administration before migration. Existing public records need the reindex command when first enabling this index. Reviewer changes update indexed generalized points; private submission coordinates never enter the spatial index. PostGIS distance/intersection queries use a geography PointField spatial index. Local development does not import GIS native libraries. The PostGIS path has not been executed in this delivery.

Public endpoints include `/api/v1/map/entities/` and `/map/nearby/` with bbox or longitude/latitude/radius queries. Authenticated endpoints cover `/map/mine/`, incident/evidence/correction submission, help/offer submission, `/map/moderation/` and `/reputation/events/`. These augment the existing housing service; they do not replace the separate camera-identification backend.

## Design and implementation evidence

Official shared shadcn Button, Card, Badge, Input, Switch, Select, Textarea and Dialog compose this surface. The standalone Select and Textarea sources were copied from the social workspace's already-installed official registry components; no replacement primitives or new CSS component system were created. Product layout, state and responsive styles use Tailwind. Existing vendor MapLibre CSS remains necessary for its controls.

Graphify performed local code-only AST extraction, without semantic agents, into `docs/analysis/community-discovery/graphify-out/`. Its existing-path query traced the map to rendering, preview, housing and platform boundaries. The pre-edit extraction contained 514 nodes and 1,939 edges; it is architecture context, not a current runtime verification.

Jev received only the non-sensitive architecture synopsis in `community-discovery-jev-state.json`. It returned probability 0.96 for preserving the independent relationships/evidence model (`jev-1.14.0`). This is structured architecture feedback, not proof of implementation correctness.

No agents, automated tests, checks, builds or browser verification were run for this update. Additive migrations, source synchronization and the affected housing-service restart were implementation operations. Rendering, hands-on flows, upload behavior and PostGIS deployment still need user-requested verification.

## Nearby samples and direct interaction refinement

The discovery map now includes six fictional roaming cats/dogs and two fictional membership places (a two-pet home and a three-pet shelter). Initially they surround the pilot map center. **Nearby me** or an explicit **Choose center** repositions this browser-only fixture set around the chosen point; ordinary entity selection/hover does not move it. Names, provenance and locations are illustrative. The outer sample remains beyond the default 500 m radius so the circle and the optional nearby-only filter can be compared. No fixture is written into Django, sightings, adoptions or rewards. Hide them with **Include illustrative samples**. These two new practice places do not claim to be enterable rooms; existing furnished sample homes/shelters retain their working entry links.

Homes, shelters, Hordes and geographic groups expose up to four individually clickable animal circles outside the main pin, with a connector and stable membership targets. The selected member remains visible among the four previews. Expand the geographic group or open a place's complete animal roster to reach other members. Avatar offsets are screen layout only; child details explicitly describe the shared place location. A shared projection preserves the actual platform animal ID and profile link, and reporting a member uses the canonical animal reference rather than inventing a second animal identity.

Sidebar hover/keyboard focus previews the corresponding point after a short debounce; click always issues a fresh camera focus command, even when reselecting the same item. Camera framing leaves space for the floating details. Both map renderers use the same member projections and illustrations. Proximity no longer hides outside pins automatically: nearby-only remains an explicit switch.

Incident/help forms no longer display longitude/latitude inputs. An embedded map lets the user choose a point without losing the form, with an explicit current-location action and a nontechnical selected-location summary. Coordinates remain internal request data. Permission denial preserves manual selection. Map controls inside forms use `type="button"` to avoid accidentally submitting a report.

Original cat/dog placeholders were generated with the built-in image_gen tool using the existing meadow-banner illustration as the style reference. Transparent PNG masters live in `assets/discovery/`; the 256 px transparent WebP runtime assets are `public/pawtrail-game/discovery/cat-placeholder-v1.webp` and `dog-placeholder-v1.webp`. The exact prompts and export provenance are in `assets/discovery/placeholder-prompts-v1.json`. They are used for missing/broken cat/dog images; genuine published photos retain priority. No additional frontend primitives or product stylesheets were introduced. No agents, automated checks/tests/builds or browser verification were used for this refinement.

## Branded map navigation and visible state changes

The map header now uses the platform's existing PawTrail brand mark and wordmark. Community navigation goes to `/community`, separate from Play's virtual neighborhood. The My home split action provides house, yard and exploration destinations. Account menus use the existing public session projection for the signed-in name/avatar/profile; management navigation is shown only for the matching role hint, with the destination's own server permissions unchanged. Saved places and private reports remain directly available. Guest sessions get a sign-in link rather than fabricated account details.

Locate, choose-center, layers and search-area actions float over the map with labeled tooltips. Help/request/report actions have a separate floating menu. The basemap mode switch moves to the bottom on this surface, preserving the default position inside the report-location picker. Mobile list overlays contain their own stacking layer so map buttons do not leak through it.

Nearby information is a floating contextual popup on desktop and mobile, not a sidebar section. It opens after explicit current-location/map-center selection and remains discoverable through a named count/radius trigger. Selecting an animal switches to animal details; reopening nearby results recenters the chosen area. The title reads **Nearby you**, **Around this spot** or **Near [place]**, avoiding the repeated Near/Nearby wording. Counts can filter the nearby directory, and closing the popup preserves the circle and trigger.

Animal media now uses a 4:3 area, capped at 42% of the viewport height, with `object-contain` so the photograph is not cropped to a narrow banner. Placeholder portraits are larger too. Non-animal place covers remain compact.

Shared panel motion provides 200 ms entrances and 100 ms exits; a short retained-value window allows panels to finish closing before unmounting. Selection, nearby radius/count updates, filters and mobile list entry have bounded feedback. Location requests and map-area updates have visible status feedback and polite announcements. Camera framing reserves room for the open contextual panel. Reduced-motion disables panel animations and makes camera movements immediate. Closing controls/Escape restore an appropriate map/list focus target.

DropdownMenu and Tooltip in the standalone shared UI layer are copies of the social workspace's existing official shadcn registry sources; only formatting was normalized. Product behavior composes them with the shared Button/Card components and Tailwind utilities. No page stylesheet, new animation dependency, backend model or fabricated notification action was introduced. This refinement was synchronized to the platform without automated checks, builds, tests or browser verification.

## Animal attention rings and help prompts

Published high/critical active help requests and unresolved high/critical corroborated reports use red attention rings. Missing animals and published concerns under review use amber rings with explicit status labels. The ring is a slow 2.8-second expanding outline; a solid outline and icon remain when reduced motion is requested. Routine help gets a steady indicator. Attention is projected from structured public flags, explicit request animal IDs and approved report subjects, never inferred from photo appearance, free-text descriptions or geographic proximity.

An animal's own alert follows its public ID into home/shelter/Horde membership circles. Groups inherit the strongest visible member alert so geographic clustering cannot hide it. Urgent members are prioritized among the four outside-circle previews. A report concerning a place marks that place; it does not automatically label every resident animal as endangered. Contributions and welfare calculations remain independent and unchanged.

A compact bottom-center prompt offers one visible/nearby urgent or concern case at a time. It names an associated animal when the relationship is explicit and links **Check it out** to the existing map detail/focus flow. Animal details explain the status and link to the actual request or approved report. Real records take priority over illustrative samples, and one record is deduplicated across animal/place/request projections. The prompt respects the current map area or chosen radius, is hidden while other contextual panels/reporting tasks are active, and does not pan, rotate, open a profile or play audio automatically. **Next** advances only on request. Dismiss/check-out quiets prompts for the chosen area during this visit; the rings remain. Choosing a new center allows other, unacknowledged sources to appear. No acknowledgment changes a server-side case or reward total.

The public reporting queries refresh with the existing one-minute UI clock, using the bounded cache and requests. Real help deadlines expire locally; resolved/rejected/archived reports are excluded from attention when refreshed. Platform mission snapshots retain their existing bridge refresh behavior; this is not a push-notification or background tracking service.

Sunbeam's urgent transport example and Poppy's missing-member example are fictional browser fixtures, visibly marked as samples. They create no genuine incident, sighting, medical assessment or backend request. Disable illustrative samples to hide them. The new attention projection and prompt reuse official shadcn components, Tailwind animation utilities and the existing cat/dog illustrations. No agents, automated checks/tests/builds or browser verification were run for this update.

## Actionable help dialog and button styling

**Check it out** now opens an official shadcn Dialog instead of immediately selecting the map pin. It shows the animal's uncropped photo/illustration, public species/status and available profile facts, location area, the published help description, mission requirements and deadline when available, and actual related mission links. Animal and mission details load through the existing public platform projections; unavailable data has a retry state rather than invented requirements.

For a published local help request, **Offer help** opens a private message form in the same dialog and submits to the existing authenticated `/help-requests/<uuid>/offers/` endpoint. For a linked platform mission, offering help uses the existing mission-acceptance API after rechecking the public mission identity, signed-in session, state and deadline. This enrolls participation; it does not approve a contribution or award client Kibble. **Open mission** remains a separate action. Existing adapter/backend availability still applies.

Missing animals and welfare reports retain appropriate sighting/information/request actions where no active request exists. **View on map** is an explicit handoff; report/information actions close the help dialog before opening the existing form. Samples without a real request support a clearly labeled local practice offer that sends nothing, creates no mission and awards no Kibble. No fabricated mission URL is created for the samples.

Action buttons in discovery now use the official small-radius `rounded-md` treatment, including header split buttons, filter controls, floating tools, dialog actions and close controls. Animal map markers/attention circles and avatars remain circular. The game route sets an eight-pixel radius token (six-pixel medium buttons) and neutralizes the host platform's teal link-color token while active. Navigation, dropdown labels/items, dialog titles and outline/ghost action compositions explicitly use the foreground color. This fixes inherited link-accent colors without changing the social site's global link palette or replacing shared shadcn primitives. Theme token changes remain in the existing theme CSS; routine styling stays in Tailwind.

The corresponding owner preferences are recorded in AGENTS.md and DESIGN.md. No automated tests, checks, builds or browser verification were run for this change.

## Sample missions, animal facts, events and one zoom control

The nearby sample animals and the furnished demo-room pets now link to a shared catalog of sample missions. **Help & missions** is available from every animal detail, including animals without an urgent alert. The help dialog and the dedicated Play sample-mission page share an offer record in this browser's session storage. **Open mission** navigates to an implemented URL such as `/play?map=community&sampleMission=sunbeam-transport`; it is a labeled sample page, not a fabricated platform mission URL. Returning to the same mission/help dialog shows the existing sample offer and allows updating it. These offers do not contact real organizers, enroll real platform users or award Kibble. Real mission links and participation still use the existing platform bridge/API.

The local catalog is `src/game/discovery/sample-missions.ts`, with furnished-room pet/mission records in `sample-room-missions.json`. Nearby fixtures have explicit fictional age, gender, size, coat and traits. Furnished-room metadata only projects known sprite coat/personality information; absent values say **Not recorded**. Real animals use their published age/gender/size plus the actual public profile appearance and characteristics. Nothing is inferred from a photograph.

Animal help/details now compose a shared characteristic panel and icon badges. **Report sighting** on a real animal opens the existing camera-capture flow. **Report concern** opens the existing private review form with the actual animal reference. Samples open a clearly marked practice-report dialog and save only a browser-session note. Help/report dialogs replace one another rather than stacking. No fake sample sighting is sent to automatic identification or moderation.

The sidebar uses compact rectangular icon filters with count badges for All, Animals, Homes, Shelters, Help requests, Events and Saved. Entity/sample/status badges have corresponding icons. Avatars and map animal circles stay circular; action controls retain the owner's small-radius style.

**Events** is a ninth independent map layer. The bridge loads bounded public scheduled events, requires an intentionally public venue, excludes cancelled/ended records against the appropriate source clock, and projects their public venue coordinates. Previews show event time, venue, capacity, aggregate attendance and only the attendee identities explicitly present in the public DTO. Actual events link to their existing event/RSVP pages. Two nearby fictional event pins provide a local preview without scheduling a real gathering. New layer preferences migrate the former all-eight selection to include Events, while preserving deliberately narrower choices. Real event expiry is also applied by the minute clock.

The manual Street map/Try detailed map button is removed. The existing vector street style reveals closer street/building detail as the map zooms; building layers use the close-detail range where supported. Fallback to the normal-image street renderer remains automatic on WebGL/provider failure. A shared zoom-control component is mounted for exactly the active renderer; the native MapLibre zoom stack is removed. Camera state is passed between rendering paths so loading/fallback does not return to the initial neighborhood. Raster tile zoom is kept integer-valued. The detailed map takes over after its place source and tiles are ready, preventing an early gray-map handoff. Error Retry remains a recovery action, not a basemap selector.

No agents, automated checks/tests/builds or browser verification were run. This source update still needs user-requested hands-on runtime verification, especially public event availability, sample mission navigation and provider recovery. Missing real API domains retain their existing partial-source notices.
