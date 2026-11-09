# Populated pages audit — 8 November 2026

The local social application at `http://127.0.0.1:3000` was inspected in Firefox using persisted database records. Changes were made in the running implementation worktree, `/home/micxsz/projects/pawtrail/.worktrees/implementation`; the standalone game workspace and other projects were preserved.

## Result

- **62 page/route variants** rendered at 1440 × 1000 and 390 × 844, including all dashboard tabs, public directories, record details, creation/edit forms, camera workspace and Play modes. Login was also exercised through normal account sign-in.
- **176 discovered internal destinations** returned HTTP 200, with no detected page-load error screen.
- Final combined page checks found **zero broken rendered images, page exceptions, failed API responses, or horizontal document overflow**. The camera and map received additional interaction and resize checks after their fixes.
- Community reactions and post saves were added and removed through normal UI controls, returning to their original state. Existing comments rendered; no comments or messages were posted.
- The preview and API remain running.

## Issues fixed

| Issue observed | Cause and correction | Confirmation |
| --- | --- | --- |
| Places map showed Animals 0 and an empty animal-only layer despite populated records | All 18 animals belonged to shelters or Hordes. Animal-only discovery now includes those memberships and deduplicates by animal identity. All mode preserves the grouped places. | Animals 18; animal-only list has 18 results. Selecting Smokey opens a detail card and `/pets/smokey`. |
| Some urgent missions were absent from the Help requests shortcut | Shortcut selected only the regular help kind. It now includes both regular and urgent help. | 9 results including urgent missions; All shows 21 places. |
| Refresh reused cached public data | Retry invalidated report data but retained the platform discovery cache. It now invalidates both. | Refresh issued new animals, shelters, Hordes, missions and events API requests. |
| Dashboard pages intermittently failed with a throttle error | Session/header reads and regular page data exhausted the same 120/min budget as writes. Safe reads now have separate configurable anonymous/member budgets; existing mutation and capture limits remain enforced. | All dashboard tabs and previously failing edit/review pages rendered successfully. Two focused throttle-policy tests pass. |
| A longer session lost access to Play after token expiry | Read-only rendering rotated a blacklisted refresh token without being able to persist its replacement. Page navigation now renews through a cookie-writing route before streaming; render-scoped adapters cannot consume refresh tokens. Game session POST uses a cookie-writing adapter. Relative redirects preserve the browser host and validated destination. | Two consecutive normal JWT renewals retained authentication and their destinations. Authenticated map and community-world APIs succeeded. Unit checks cover expiry, redirect safety, render isolation and credential persistence. |
| Dashboard animal total was 0 while My animals listed shelter animals | Summary counted only personally assigned caretakers. It now shares the same managed-animal query as the list. | This operator sees 12 managed animals in the overview, consistent with My animals. |
| Notifications had no activity destinations | API DTO always returned a null destination; the frontend also rejected the existing achievement kind. Resolve available public references and role-appropriate application destinations; accept achievement notifications. | Notification list/menu link to shelter applications, the event and the mission. Achievement notification contract test passes. |
| Camera pages horizontally overflowed | A visually clipped file input retained the shared full-width input layout. Hide the actual file input while retaining its accessible picker button. | No overflow on Spot and both report aliases. Native picker opened; unsupported text file produced client validation before upload. |
| Capture subpages nested main landmarks | Feature containers declared main inside the platform main. Use named sections. | Spot has one main landmark after hydration. |
| Story-reference tags had insufficient contrast in dark mode | Light-only tag backgrounds remained behind the light dark-theme link color. Use theme-aware surface tokens. | Inspected dark screenshot; foreground rgb(126,215,174) on rgb(36,36,36). |
| Play toolbar labels crowded adjacent controls | Icon-size width constrained visible text labels. Allow intrinsic widths and prevent shrinking. Inventory category actions now use rounded-md. | Desktop controls measure 56–70 px and fit their labels. Inventory, journal, animal directory and detail dialog open and close. |

## Interaction evidence

- Places: persisted animal filter, search, shared-location explanation, profile navigation, device save/revert, help/all filters, live refresh, mobile list/map switch, zoom and desktop canvas resize. Final canvas and container are both 1088 px wide.
- Community: reaction 3 → 4 → 3, save/unsave, two existing comments, recent-notification menu, dark/light theme switch.
- Dashboard: all tabs, notification destinations, mobile navigation drawer, populated shelter/application details, managed animal totals and session renewal.
- Directory: neighborhood guide expands and exposes six destinations without requiring a Google Maps key.
- Play: entrance, story exploration, populated map, authenticated community world, inventory, journal, 12 public shelter animals and Ginger's current platform detail/profile link. Local game progress remains separate from authoritative community Kibble.
- Forms: creation/edit screens and adoption introduction for Ginger rendered at both viewport sizes. No applications, payments, proof reviews or identity evidence were submitted.

## Validation

- `npm run typecheck` — passed.
- `npm run check:ui` — passed; official shared UI primitives retained.
- Focused Vitest files: discovery membership, notification contract, real refresh and renewal navigation — **8 tests passed**. The renewal file was rerun after adding the proxy redirect assertion and passed.
- `backend/.venv/bin/python backend/manage.py test config.tests --noinput` — **2 tests passed**.
- Jev classified the map symptom as membership filtering; the source trace and live Firefox checks independently confirmed it. No credentials or private records were supplied.
- No production build or deployment was performed.

## Evidence and limits

Artifacts are in `output/playwright/populated-audit-2026-11-08/`:

- `final-page-results.json`: merged final desktop/mobile results for all 62 variants; latest regression results replace earlier failures.
- `link-checks.json`: status checks for 176 internal destinations.
- `final-ui-interactions.json`, `community-interactions.json`, `play-interactions.json`, `final-map-game.json`: focused interaction evidence. The earlier community JSON's `darkTheme` field used the wrong DOM attribute; the final computed colors and screenshots confirm the real theme state.
- Representative final screenshots: `map-final-desktop.png`, `map-final-mobile.png`, `community-dark-final.png`, `play-controls-final-desktop.png` and `regression-dashboard-mobile.png`.

This is Firefox desktop plus mobile viewport emulation, not physical-device camera/GPS or cross-browser certification. Render and targeted interaction checks do not validate every possible submission or authorization combination. The genuine-only identity record route has no actual identification evidence to display; none was manufactured for this audit. Existing truthful empty states for verified rewards, sightings and proof queues were preserved. Illustrated animal fallbacks are intentional, not identification photographs.

The checks used the local development server. Page-pass timings include development compilation, readiness waits and screenshots, so they are not production load benchmarks. The repeat failures traced to throttling and refresh-token loss were reproduced and corrected.
