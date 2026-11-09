⚠️ DEGRADED: single-context (the owner requires direct work without subagents).

# PawTrail functional and design audit — 8 November 2026

## Verdict

The visual identity is recognizably PawTrail: warm animal-welfare surfaces, Saira Condensed/Instrument Sans typography, original animal artwork, and a distinct pixel world. Implementation integrity does not pass as one connected product yet. Live navigation promises social and management services that the selected real backend explicitly does not implement. This is an integration/readiness gap, not evidence that the existing mock workflows never worked.

Current reviewed preview: http://127.0.0.1:3000. Social source: `/home/micxsz/projects/pawtrail/.worktrees/implementation`. Game source owner: `/home/micxsz/Documents/ChatGPT/pawtrail`; the integrated copy is under `src/features/neighborhood` in the social worktree. No implementation files, environment settings, account records, or synchronization scripts were changed. No production build or unit-test suite was run.

## Method and limits

Firefox 158 / Playwright, using a fresh audit browser session, at 1440×900, 1280×900, 390×844 and a 320×740 boundary check. Desktop/mobile viewport emulation is not a physical-device or synthesized-touch test. Story controls were exercised by keyboard and browser clicks; physical joystick/pinch gestures, screen-reader operation, and multi-user WebSocket sessions remain untested.

The current application uses real-data mode. Community and Explore returned no published records. Their empty state is legitimate; no sample records were inserted to make screenshots look populated. The first community visit hit its error boundary while the backend was unavailable; a later visit recovered when the backend became available. Later read-only requests returned community HTML in approximately 150ms and the empty animal collection in approximately 4ms. These isolated local measurements are not production performance/CWV results. Firefox also reported compositor delays, so automation wall times are not used as application-speed evidence.

Dashboard entry redirected to `/login?returnTo=%2Fdashboard`. A real login was not completed. Protected dashboard coverage is source/contract review, not a signed-in visual walkthrough. No credentials were requested in chat. Populated feed reactions/comments, clustering, shelter review, home decoration, ownership boundaries, and real adoption/payment workflows are not certified by this pass.

The Impeccable context launcher could not execute directly because its file lacks execute permission; existing PRODUCT.md and DESIGN.md were read instead. After recording the manual assessment, the detector was invoked through Bash. It returned 17 font-size advisories in eight files, all under `design-system-font-size`. These are type-ramp review candidates, not 17 proven accessibility failures. Small map metadata and intentionally compact game labels require contextual judgment. No live detector overlays were generated. There was no extracted Graphify graph; component relationships were traced from source.

Jev was explicitly requested and received only a sanitized summary of functional observations. It selected `service_readiness` ahead of decoration or adding features. That is supporting prioritization judgment, not browser evidence or an independent visual audit. Its response and the submitted state are saved with the evidence.

## Technical health — provisional sampled scope

| Dimension | Score /4 | Evidence |
| --- | --- | --- |
| Accessibility | 2 | Labeled actions and keyboard dialogs; duplicate main landmarks and narrow-screen reflow need repair. |
| Performance | 2 | Initial dependency failure and retry-state gaps; no controlled production measurement. Maps/game are lazy boundaries, not globally eager bundles. |
| Responsive design | 2 | 390px layouts fit, but 320px header extends to 330px; compact map/game targets and hidden mobile disclosures remain. |
| Theming | 3 | Actual light/dark surface switch and current self-hosted font roles verified; action-label/radius drift remains. |
| Implementation integrity | 1 | Current navigation and core dashboard calls disagree with backend capability. |
| Total | 10/20 | Significant work needed; this is not WCAG certification or a production performance grade. |

## Design heuristics — provisional sampled scope

| Heuristic | Score /4 | Finding |
| --- | --- | --- |
| System status | 2 | Clear game notices; expected auth gating becomes an error/disconnected state. |
| Real-world match | 2 | Warm care language; backend terminology and developer instructions intrude. |
| User control | 3 | Escape, game shortcuts, list/map toggle and manual center selection exist. |
| Consistency | 2 | Community labels mean different places; action styles vary. |
| Error prevention | 2 | Protected data requires login; unsupported services are still advertised. |
| Recognition | 2 | Mobile game actions rely on icon recall; map filters expose many choices. |
| Efficiency | 2 | Useful shortcuts; repeated unauthenticated source retries cannot fix the state. |
| Minimalism | 2 | Canvas-first play is strong; too many empty filters and disabled home controls weaken the first view. |
| Error recovery | 1 | Homes retries the same unavailable/auth-gated action and offers irrelevant service-start advice. |
| Help | 2 | Story field guide is useful; first Play entry and map auth recovery need clearer guidance. |
| Total | 20/40 | Coherent brand, fragmented end-to-end experience. |

## Prioritized findings

### F1 — P1: navigation exposes services that the real backend cannot deliver

Evidence: read-only GET requests to `http://127.0.0.1:8002/api/v1/me/summary` and `/api/v1/community/posts` returned HTTP 501 with `DOMAIN_NOT_CONNECTED`. `backend/observations/views.py:269` deliberately returns that response for unsupported domains, registered by `backend/config/urls.py:33`. The overview requires `api.users.summary()` and `api.community.list()` at `src/features/workflows/private-pages.tsx:30`; their client paths are `/me/summary` and `/community/posts`. `src/components/layout/navigation.ts:42` still includes the dashboard and community composer in a single mode-independent READY_ROUTES inventory. Other connected-domain coverage must be checked against the same contract before release.

Impact: a user can sign in expecting the advertised dashboard/posting experience and encounter a service that cannot complete the task. The real community page is an encounter stream, while Create a post advertises the unconnected human-post domain.

Recommendation: make route/action readiness depend on active backend capabilities. Connect the promised endpoints or present an explicit unavailable state with working capture/history alternatives. Retain server-side permissions. Do not invent fallback records or mix mock results into real mode. Suggested command: `/impeccable harden`.

### F2 — P1: the default Play entrance presents expected sign-in as a system failure

Evidence: `/play` opens Homes, then shows “The door needs a moment”, “Sign in to enter your home”, a disconnected indicator, and disabled game controls. `/play?home=system%3Ahub&demo=1` is explicitly disallowed in current real mode. The same error panel always advises starting the housing service on port 8001 even when that service is already listening (`src/features/neighborhood/components/game/housing/app.tsx:443`). “Open my home” repeats `enter('me')` regardless of the failure; its sign-in destination also always targets the personal home.

Impact: a visitor choosing Play sees an apparent outage before discovering that story exploration works. Account, service, session-expiry and permission failures give the same misleading recovery treatment.

Recommendation: provide an intentional guest entrance with working “Explore the story world” and “Sign in for Homes” choices. Branch recovery by error type, preserve the requested room, and reserve server startup instructions for developer diagnostics. Suggested commands: `/impeccable onboard`, `/impeccable harden`.

### F3 — P1: the 320px utility header overflows and clips Sign in

Evidence: at 320×740, document scrollWidth is 330px; the Sign in link ends at x≈329.98. The header combines a 44px drawer, search, camera, Create and theme controls with a ≈78px sign-in action. `src/components/layout/header.tsx:65` and `:163` own the composition. The 390px sample fits; this is a verified narrow-boundary failure, not a claim that all phone widths break.

Impact: the authentication action extends offscreen and creates horizontal page overflow.

Recommendation: retain the primary encounter/sign-in actions and move secondary utilities into a menu or an intentional responsive row. Do not solve it by shrinking touch targets. Suggested command: `/impeccable adapt`.

### F4 — P2: map authentication recovery invites a retry that cannot change permissions

Evidence: anonymous discovery displays “Sign in to discover member homes…” with a Retry sources button but no contextual sign-in action. Clicking Retry sources returned the same state. `src/features/neighborhood/game/discovery/service.ts:71` maps every home-source failure to that sign-in message, including possible service failures; `components/game/community/app.tsx:630` renders one generic retry for every issue.

Impact: users cannot tell “not signed in”, “no published records”, “no matches”, and “source unavailable” apart; retries repeat work without changing access.

Recommendation: return structured source statuses, offer Sign in for auth-required sources, Retry for transient failures, and Clear filters only when filters are active. Keep public records usable independently. Suggested command: `/impeccable clarify`.

### F5 — P2: Community and Explore name several different destinations

Evidence: story exploration has two visible desktop Community links: one enters the virtual commons (`app.tsx:269`), another opens the social feed (`app.tsx:302`). Global Explore opens the database animal list, while Explore places opens the geographic map. The map’s primary Home action leads an anonymous visitor into the Homes gate.

Impact: users must remember which surface owns each identically named action and lose their mental location when moving between care, discovery and play.

Recommendation: consistently distinguish “Community feed”, “Community world”, “Places map”, “Animal directory” and “Story exploration”, with a clear return destination. Preserve distinct management/platform layouts. Suggested command: `/impeccable clarify`.

### F6 — P2: mobile operational controls rely on small targets and icon recall

Evidence: Firefox DOM measurements show 36×36 map list/home-menu controls, 32px quick-filter heights and a 28×28 refresh action. Story toolbar actions are configured at 36px in `src/features/neighborhood/app.tsx:189`; phone footer actions are icon-only. Homes renders 16 toolbar actions, most disabled at the guest entrance (`housing/app.tsx:505`). Switches are label-named controls; an empty textContent in a raw DOM scan is not an accessibility-name failure.

Impact: one-handed users have less reliable targets and must recall unfamiliar icons. The disabled full toolbar implies complexity before the world is available.

Recommendation: use 44px phone hit areas, retain labels for primary actions and group secondary actions under More. Conditionally disclose relevant Home controls after entry. Compact target sizes alone are not automatically an AA failure; spacing/label exceptions require context. Suggested commands: `/impeccable adapt`, `/impeccable distill`.

### F7 — P2: mobile play hides the local/virtual currency boundary

Evidence: story footer “Local prototype · non-cash Kibble” is hidden below `sm` (`src/features/neighborhood/app.tsx:425`); the coin’s accessible name is only “[number] Kibble”. Homes also hides “Server-saved home · Virtual care & rewards” on phones (`housing/app.tsx:561`). Mobile screenshots show the balance without that disclosure. The Help dialog does explain fictional local rewards.

Impact: a new player can mistake game Kibble for the welfare platform’s verified contribution balance, especially when switching worlds.

Recommendation: label the visible balance “Game Kibble”, include the local/virtual distinction in its accessible name and retain a compact, reachable explanation on phones. Keep game totals out of authoritative platform balances. Suggested command: `/impeccable clarify`.

### F8 — P2: database pages nest main landmarks inside AppShell’s main

Evidence: current community and Explore accessibility snapshots contain main > main; DOM count is two. `src/features/database/pages.tsx:104` and its Animals page render main within the main owned by `src/components/layout/app-shell.tsx`.

Impact: landmark navigation is ambiguous and ownership becomes inconsistent across real/mock surfaces.

Recommendation: make embedded page bodies section/div elements and let AppShell own the page’s main landmark and skip-link target. Suggested command: `/impeccable harden`.

### F9 — P2: action colors/radii drift from the owner’s current standards

Evidence: global anchor accent at `src/app/globals.css:117` reaches outline ButtonLink labels whose variant lacks an explicit foreground (`src/components/ui/button.tsx:14`). Screenshots show teal Sign in/Spot/Open community map action labels. `src/components/layout/platform-sidebar.tsx:67` forces rounded-xl on Create a post; Homes floor actions force rounded-full. These are ordinary actions, not the circular avatars/map markers that the owner permits.

Impact: controls look like different systems despite sharing the official primitive layer.

Recommendation: apply neutral action-label foregrounds through the canonical variant/composition, remove caller radius overrides from ordinary actions, and retain circular identity/map markers. Do not replace installed shadcn components or add parallel CSS primitives. Suggested command: `/impeccable polish`.

Counts: 0 observed P0, 3 P1, 6 P2, 0 P3. The count excludes the initial transient backend startup failure and the detector’s advisory count.

## What works and should be retained

- Pixel artwork, NPC portraits and canvas-first exploration are distinctive and internally coherent. Keyboard journal/map/help shortcuts, quest acceptance, objective tracking and Escape dismissal were exercised successfully.
- Geographic mapping renders in Firefox, includes attribution, switches between list/map views, exposes labeled layer controls, and enters a cancellable manual-center mode without requiring device location. Approximate-location/privacy messaging is explicit.
- Real-data empty states do not invent animals or outcomes. A usable encounter CTA remains available. Actual light/dark backgrounds and the Saira Condensed / Instrument Sans roles were verified.
- Shadcn primitives retain semantics and accessible control names. Touch source handles pointer cancellation/lost capture and uses touch-action:none; this source strength does not replace a real gesture test.

## Persona assessment

- First-time volunteer: expects a community and working management tools, but must infer which capabilities are actually connected. Needs a clear guest Play entrance and meaningful auth recovery.
- One-handed phone user: encounters compact icons, long control lists, a clipped 320px sign-in action and hidden reward provenance.
- Keyboard/assistive-technology user: benefits from game shortcuts and dialog semantics; duplicate main landmarks and icon-heavy recognition still need work. Screen-reader and physical-touch conformance remain open.

## Recommended order

1. `/impeccable harden`: capability-aware navigation and service contracts; split auth/service recovery.
2. `/impeccable onboard`: intentional Play guest entrance with a direct working exploration path.
3. `/impeccable adapt`: 320px header reflow and phone action targets.
4. `/impeccable clarify`: destination names, map source statuses and visible Game Kibble provenance.
5. `/impeccable distill`: prioritize map filters and Homes toolbar actions.
6. `/impeccable polish`: neutral labels, standard action radii and remaining verified type-ramp issues.

Questions skipped: this audit documents recommendations; no implementation decision is required. The optional sign-in clarification did not result in a completed authenticated walkthrough during the pass.

## Evidence

Local screenshots, initial manual notes, detector JSON, Jev input/output and DOM measurements are under `output/playwright/audit-2026-11-08/` in the social worktree. Firefox accessibility snapshots and runtime logs are in the standalone workspace’s `.playwright-cli/` directory. Important captures: community-1440.png, community-390.png, community-320.png, community-dark-desktop.png, map-empty-desktop.png, map-list-mobile.png, exploration-desktop.png, exploration-mobile.png, play-guest-mobile.png, homes-sample-mobile.png and login-desktop.png. The earlier dashboard-gate-mobile capture is a transient loader and is not treated as a finished page screenshot.

The experimental batch-capture helper was interrupted after browser navigation/compositor delays; its error output is not a clean test result. Only completed captures, current accessibility snapshots, explicit source paths and the read-only HTTP observations above support findings. No changes were applied to the product during this audit.
