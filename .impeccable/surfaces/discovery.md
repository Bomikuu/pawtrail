# Discovery

6 November live-review follow-up: responsive resource grids use distinct sample portraits and avoid repeated cover thumbnails. Open, urgent, expired and closed help have explicit availability. Neighborhood browsing uses real public records when Maps is unavailable; configuration instructions stay out of visitor copy. Hordes distinguish animal profiles from consenting community helpers. See `docs/implementation/live-review-follow-up.md` for source delivery limits.

Mode: Operate. Approved build path: code. Inherits the community journal in DESIGN.md.

Find animals and useful welfare activity nearby, then inspect the same animal identity in its public profile. D1–D5 own maps, filtering, search, and Hordes.

## Direction contract

THESIS: Find a recognizable animal and its story; an expansive map must not obscure identity or replace a usable result list.

OWN-WORLD: Cream ground, white surfaces, brown text, orange actions, teal help/status accents, rounded Shadcn controls, and beige rules; Saira Condensed headings and Instrument Sans body. Animal imagery owns content space.

STORY: Filter nearby animals, inspect an approximate location, select an identity, and open its public profile.

FIRST VIEWPORT: A full-viewport map sits beneath an expanded, floating left results sidebar. The sidebar contains brand/navigation, search and readable results; the visible Places map title is removed. Category filters (All, Animals, Homes, Shelters, Help requests, Events and Saved) float across the top center. A compact quest tracker occupies the top right, showing public mission/animal imagery and the current viewer’s saved Join → Submit proof → Approval milestones. No full-width app header or reserved sidebar column reduces the map canvas. The results body starts open and folds vertically below the retained PawTrail title, description and search; choosing a result on phones folds that body. Phone filters scroll horizontally; the quest tracker opens from a compact toggle. Location/search tools sit beside matching compact zoom controls in a bottom dock; detail/directions panels take priority over quests. The result list remains usable without Maps.

FORM: Grounded candidate 5, local community newspaper/journal, seed `0cbeff46`; preserve recognizable pet/person names and the approved identity system.

SIGNATURE INTERACTION: Map/list selection shares stable pet identity and keyboard alternatives; native profile links remain available. Brief selection feedback respects reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Delivery and verification

Use Saira Condensed headings, Instrument Sans body, the pinned palette, warm rules, canonical Shadcn controls, and stable internal fixture provenance without repeated visible Sample tags. All shipping raster provenance and self-hosted font licensing are F7-owned. Motion responds briefly to intent and disappears under reduced-motion. Loading skeleton, informative empty, permission, validation, unavailable, error/retry, pending, rollback, and completion states belong to the feature that owns the action.

Only implemented destinations become working links through the central readiness registry. This brief is the approved contract for future feature work; it does not claim that those routes already exist. Automated source and behavior checks only. Rendered quality remains unverified; the parent coordinates final source-scope finish review.

## Animal directions extension — 8 November 2026

Mode remains Operate. The existing popup adds Go to {name}; its route panel replaces the detail overlay while keeping the map usable. A blue walking path connects the viewer's real avatar to a published approximate destination; time, distance and uncertainty appear together. A missing timestamp is stated, shared membership is never labeled a sighting, and a real last-seen record stays generalized. The panel supports keyboard dismissal, cancellation, retry, route refit and an external Maps handoff. Incumbent fonts, tokens and official shadcn components remain authoritative. Source-reviewed only under the standing no-test/no-browser instruction; see docs/implementation/animal-map-directions-2026-11-08.md.


Animal drawer follow-up: animal details use a full-height, non-modal right Sheet with 300 ms arrival, 200 ms exit and reduced-motion overrides. Published sighting photos carry small date, area and observation captions. Unavailable device position enters an explicit map picker, whose chosen start is labeled as manual and never given GPS accuracy. The fixed header/actions and scrolling body keep the core task available on narrow screens. Official Sheet/Skeleton registry sources remain unchanged. Source review only; docs/implementation/animal-map-directions-2026-11-08.md records the extension.

Animal detail refinement: use a circular portrait beside the animal name, recorded facts and status in the drawer header, with the primary Go to control and overflow menu above equal-weight sighting/help actions in the pinned footer. During navigation, show one named destination pin at the resolved public location; keep the chosen animal fixed through manual start selection. Distinguish short road-access gaps from routed walking paths and reject endpoints beyond 75 m. Do not imply live tracking or verified access across dashed gaps.

Firefox routing verification: use absolute camera-fit padding so existing drawer insets are not added twice. Reserve label room at viewport edges; repeated route fitting must keep scale stable. The static named destination remains in the accessibility tree while interactive map markers are inert for origin picking. Animals counts include distinct published members of places.

Reference-layout update: the map begins at the top of the viewport. Its title and navigation live inside the left sidebar; phones open the list from the map toolbar and return using Show map. Every map entity uses the shared full-height animated right Sheet with a fixed title, scrolling body and pinned actions. Events, help requests, shelters, homes and other places retain their image banners. Animals have no banner: an 80/96 px circular portrait sits beside details, then public location, shared place/help, a three-column sighting photo gallery and About content. Existing tokens, full-height Sheet motion, real-data boundaries and pinned actions remain. This layout update was source-reviewed only under the standing no-check/no-browser instruction; prior Firefox results predate it.

Shared detail contract: `DetailDrawer` composes the installed official Sheet for every selected map entity, retaining the 300 ms entrance, 200 ms exit and 240 ms parent retention. Animal facts form one correctly spaced text line; 30 recorded months displays as “2 years 6 months”, and sheltered records use “In shelter care” with a care icon. The characteristics section uses the same age formatter. Unknown facts are omitted from the compact summary and remain explicit in detailed fields. This refinement is source-reviewed only.


## Floating map and real quest tracker — 8 November 2026

This update supersedes the earlier side-by-side sidebar and mobile closed-list layout descriptions above. The canvas fills the viewport, with an initially expanded floating left panel, top-center category controls and upper-right mission tracker. Sidebar state informs camera padding in both map renderers; route fitting retains absolute padding. Zoom controls move beside an open detail/directions panel.

Quest progress comes from the authenticated viewer’s saved mission participation state: not started 0/3, accepted 1/3, submitted 2/3 and approved 3/3. Rejected proof returns to the joined milestone with a changes-requested label. The adapter reads open missions and public, non-sensitive animal photos; only mission IDs and participation states enter this map projection. Guests see an explicit sign-in state. Missing data, loading and retry states never fabricate progress, animal evidence, reward totals or location claims. The tracker refreshes on discovery reload, browser focus and a visible-page 60-second interval. Existing attention alerts remain actionable and duplicate mission alerts are omitted.

The implementation composes the already-installed official shadcn Button, Badge, Progress and Skeleton components; registry sources are unchanged. Latest verification is source review only: no automated tests, checks, builds or browser verification were run for this update under the owner’s standing instruction. Earlier Firefox evidence predates the floating-map layout. See `docs/implementation/floating-map-quests-2026-11-08.md`.


Follow-up contract: category buttons float independently over a transparent navigation wrapper. The sidebar uses the official Collapsible to fold only results, advanced filters and the list footer; brand, description, search and result controls remain visible. The old horizontal close behavior is retired. Quests include all attention-bearing animals in the loaded public snapshot, with portrait, recorded alert label and public area; shared-place members are deduplicated by animal. These alerts persist independently of nearby prompt dismissal and do not invent progress. Mission participation alone supplies milestone bars. Locate, choose-center, search-area and zoom/fit use the same compact bottom dock in both renderers. Mobile quest/result disclosures yield to one another, with retained triggers for focus. The refinement is source-reviewed only, with no tests/checks/builds/browser verification under the current owner instruction.


Quest reference update: the right tracker now has a recorded Neighborhood care summary, counted All/Needs attention/Adoption/My quests tabs, unified portrait/status rows, five-at-a-time disclosure and a retained compact summary when collapsed. Adoption is sourced from the public DTO flag; My quests includes joined records outside the open priority page. Summary approval/joined counters are personal saved states, with no fixed-five reward claim or inferred online presence. Distances require an explicitly obtained viewer position and are labelled approximate/straight-line. Existing palette, fonts, official shadcn components and map/detail priorities remain authoritative. Source review only; no tests/checks/builds/browser verification. See `docs/implementation/quest-tracker-reference-2026-11-08.md`. Geographic boundary entry remains a separately documented proposal because current areas contain centers/radii, not real polygons.


## Local community borders and entry — 8 November 2026

The owner chose local areas/custom splits. Stored, source-dated Davao barangay polygons now draw in MapLibre and the raster fallback; custom child zones use dashed teal boundaries. A compact Local communities selector and visibility switch live in the floating results panel. Selecting a polygon or option opens the shared full-height animated right drawer, hides competing quests, and offers an authenticated shared-world entry. No location permission is required for choosing an area. Existing animal routing/picking retains priority and stable identity.

Initial coverage is 182 source barangays and 237 community rooms, with 55 larger barangays divided into two child zones under a configurable 10 km² rule. Source edition and 0.005-degree upstream simplification remain visible. Real database geometry replaces the earlier point/radius-only proposal; no private home/animal positions, generated boundary fixtures, invented online counts or reward evidence were introduced. Canonical shadcn Select/Switch/Sheet/Button compositions and incumbent fonts/palette remain. Schema/import completed and the existing housing service reloaded; rendered and end-to-end behavior remain unverified under the standing no-test/no-browser instruction. See `docs/implementation/geographic-community-areas-2026-11-08.md`.


## Whole-city community layer — 9 November 2026

The owner replaced barangay/custom-zone communities with unsplit cities. The map keeps the current floating panels and uses sourced whole-city shapes, distinct solid colors with white-cased outlines, subtle colored fill and a named hover entrance cue. Click/touch or the official city Select opens the existing animated right drawer. Current Davao Region coverage has six city communities; retired smaller rooms retain history but cannot be entered. Route picking and active destinations retain priority. See `docs/implementation/city-communities-2026-11-09.md` for direct Impeccable/Jev review, Firefox screenshots, UI-check evidence and runtime limits.


## Nationwide cities — 9 November 2026

The owner clarified cities only for nationwide expansion. The layer now publishes 149 sourced whole-city communities; municipalities, barangays and custom zones stay excluded from discovery and entry. Preserve the established colored borders/hover preview/drawer, with province context for duplicate city names. Country views use lighter geometry and fit within response limits without truncation. See `docs/implementation/nationwide-city-communities-2026-11-09.md` for normalization, retained data, screenshots and verification limits.


## Zoom-aware city discovery — 9 November 2026

City navigation now has three scales: province/metro database-count circles below zoom 8; thin colored city boundaries and the entrance cue from 8 to below 13; no city geometry, entrance hover cue or city-area click at street zoom 13 and above. The keyboard selector remains available. City drawers show six circular image/icon counts from the real services. Animal totals are unique published profiles; open help and scheduled public events have time/state eligibility. Home counts respect the current viewer’s existing visibility/blocking/realm rules and stay unknown before authentication. Preserve the incumbent theme, official shadcn components, filtering/route priorities and whole-city-only entrances. Firefox desktop/mobile and scoped home counts were reviewed; UI boundary check passed. See `docs/implementation/map-zoom-summaries-2026-11-09.md` for source provenance, evidence and limits.


## Transparent map artwork and zoomed-out hover — 9 November 2026

This update supersedes the lower city-outline cutoff above. Thin city lines and the entrance hover card remain available from zoom 3 to below 13, alongside province count circles below zoom 8. Street zoom still hides lines, hover cues and city-area click entry. Hover cards now share six compact circular database counts with the city drawer. Public photos take priority; missing/broken images use the new transparent, logo-referenced animals/events/home/shelters/groups/help/city illustrations. Reuse the category asset map and shared official-shadcn Avatar composition across markers, summaries and empty banners. Generated art is decorative, never identity evidence or real location imagery. Alpha was inspected on all seven optimized assets; this follow-up is source-reviewed only under the standing no-application-check/no-browser instruction. See `docs/implementation/map-hover-artwork-2026-11-09.md` and `public/pawtrail-game/discovery/map-placeholders-v1.json` for final prompts, provenance and scope.


## Larger category thumbnails and restored animal portraits — 9 November 2026

Render the new transparent category artwork at 125% without extra avatar padding; keep real photos at their existing cover treatment. Individual animal identities again use the former species/coat illustrations. Category artwork belongs to map summaries, place/sidebar rows, map missions, non-animal popup headers and empty banners/help prompts. Use the shared EntityFace to preserve the individual/category distinction, with existing photo priority, count badges and quest state. This supersedes the previous generic category fallback for individual animals. No new assets or backend records were created. Source review only; see `docs/implementation/map-thumbnail-refinement-2026-11-09.md`.


## Selected map marker and closer focus — 9 November 2026

A selected marker uses a steady high-contrast outer ring and 125% scale. Apply the same state to the actual selected shared animal and raise its parent marker group above neighbors. Preserve attention/status cues and route-destination priority. Selecting an item focuses at zoom 16 in both renderers without zooming out from a closer view; follow-up focus shares the floor and respects panel padding/reduced motion. Keep the reverted typography/status-border update reverted. Source review only; see `docs/implementation/map-selected-marker-2026-11-09.md`.
