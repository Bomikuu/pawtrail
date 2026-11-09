# Website audit remediation — 8 November 2026

Implemented directly against the existing social worktree and standalone game owner. No accounts, seeded rows, sightings, payments or rewards were created for this work. Existing fixtures remain stored but are excluded from application queries. No bulk game synchronization was run.

## Changes against F1–F9

| Finding | Remediation |
| --- | --- |
| F1: frontend/backend capability mismatch | Retained the newly delivered Django social services and real adapter. Added a genuine-record default manager, explicit maintenance access, fixture-profile exclusion and core animal visibility filtering. The real animal directory tolerates an empty area configuration; location-dependent submissions show a setup state. Empty map ID filters return an empty set. Achievements/proof review remain unimplemented: navigation no longer advertises them as ready, direct pages handle the service-specific 501, and sharing no longer attempts unsupported achievement writes in real mode. |
| F2: Play entrance and recovery | `/play` presents Community world, Story exploration and Places map. Anonymous home entry asks for sign-in, preserving the requested room. Housing transport distinguishes authentication, permission, missing destination, service/session exchange and other request failures. Retry preserves the current destination; stale entry/connection failures cannot overwrite a later visit. Housing rendering and operational controls load only after state is available. Removed developer startup commands from the recovery UI. |
| F3: narrow header overflow | Search/theme move into the phone navigation drawer. Primary header actions retain their 44px targets. Compact bottom navigation uses Spot/Animals labels with full accessible names. |
| F4: misleading map retries | Member-home source issues carry an explicit auth/permission/unavailable kind. Auth offers sign-in; unavailable sources offer retry; public records stay independent. Clear/reset actions appear only for active filters. |
| F5: destination naming | Community feed, Community world, Places map, Animal directory and Story exploration are distinct across navigation and play. Story map identifies the fictional world map. |
| F6: mobile controls | Canonical registry buttons and menu items retain at least 44px phone hit areas. Homes and story toolbars expose labeled primary actions and a More menu. The story pauses when More opens. Phone map filters use a horizontally scrolling row. Map/home/zoom controls retain small-radius actions; narrow map header labels no longer overlap. |
| F7: currency boundary | Game Kibble remains visibly named on phones and has a named status with its virtual/non-cash provenance. Local story and server world disclosures remain visible. Neither balance is treated as authoritative community Kibble. |
| F8: nested main landmarks | Database page compositions use sections inside the shell-owned main. Full community and animal-directory routes retain one main landmark. |
| F9: inconsistent actions | The official shared Button outline/ghost and menu item styles explicitly set neutral foreground colors. Sidebar/navigation, property-floor and zoom actions use rounded-md. Circular avatars, animal markers and non-action indicators remain intact. |

## Registry adaptations

The existing official shadcn/ui sources remain in `src/components/ui`; no substitute primitives were introduced. Both workspaces adapt Button with 44px phone minimum dimensions and neutral outline/ghost text. DropdownMenu item, checkbox/radio item and submenu trigger sources gain 44px phone minimum heights and neutral text. Product behavior composes those registry components. Fonts retain the existing Saira Condensed/Instrument Sans roles.

The default social Record manager excludes `is_fixture=True`. `all_objects` is explicit maintenance access, used by the existing seed maintenance helper and admin listing; Django's unfiltered base manager still resolves foreign keys. UserProfile provisioning retains its normal manager to preserve one-to-one uniqueness. No migrations or database cleanup were necessary.

## Evidence

- Through the actual Next API adapter: community posts, animals, Hordes, missions, fundraisers, shelters, events and leaderboard returned HTTP 200 with count zero. `/me/summary` returned HTTP 401 anonymously, preserving the authentication boundary. See `output/playwright/fixes-2026-11-08/public-api.json`.
- Read-only database inspection: 0 visible posts, 12 fixture posts preserved; 0 visible social animals, 18 fixture animals preserved; 12 fixture profiles preserved.
- Firefox: 320px platform header/document width 320px, Sign in right edge 308px; four visible header actions 44px tall. At 320px the map header actions also fit inside 308px and are 44px tall; quick filters and refresh have 44px hit areas. At 390px the map document remains 390px wide and all header actions fit inside 378px.
- Guest Play and explicit home sign-in recovery render successfully; the sign-in link retains `system:hub`. Story entry, close-dialog action, labeled toolbar and More menu work. At 320px its primary toolbar controls are at least 44×48px and the currency exposes a named Game Kibble status. Map list toggle, separate sign-in recovery, empty state and absence of inactive Clear filters were observed. The animal directory renders its genuine empty state without a configured area.
- `npm run check:ui` passed after the shared component and responsive changes. No unit suite, typecheck, detector, format-check or production build was run. Source formatting was applied to changed files.

Screenshots live in `output/playwright/fixes-2026-11-08/`. The headed audit Firefox session stalled during resizing, so the final review used isolated headless Firefox sessions with explicit desktop/phone viewports. This is browser viewport verification, not physical touch or screen-reader certification.

## Remaining verification limits

No real-account login was supplied or completed. Protected dashboard CRUD, private-house permissions, authenticated WebSocket recovery, achievement service recovery, and populated genuine-record DTOs were reviewed in source rather than exercised with invented data. The claim/proof backend still needs its own implementation before those routes can be re-enabled. Authored fictional story characters remain confined to the local story game; they are never substituted for database community records.

## Achievements follow-up

The subsequently requested real achievements backend has now been implemented and its schema migrated. Its navigation and tracking controls are enabled again. The earlier unavailable-service notes describe the audit-remediation state before this follow-up. See [real database achievements](real-achievements.md) for current behavior and verification limits.
