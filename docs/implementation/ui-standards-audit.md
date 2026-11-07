# UI standards audit — 6 November 2026

The owner requested a check of every dashboard tab, then extended the request to the entire interface. This authorized browser inspection and scoped verification for this task. Implementation remains in the main session without subagents, and the development preview remains running. No production build was run.

## Result

Inspected 49 distinct routes in 97 initial desktop/mobile captures, then confirmed the shared fixes across the same 49 routes in 94 recorded observations. All 13 member dashboard tabs, two shelter tabs and two moderation tabs were checked at desktop and phone widths using their intended sample roles. The confirmation found no document-level horizontal overflow or broken loaded images. The overview, profile and settings also received light/dark confirmation; 320px and 1024px overview checks complement the 390px and 1440px review.

The review preserves the platform and management shells, supplied artwork, permissions, privacy settings and existing business actions. It is a single-session implementation review, not an independent review or complete WCAG certification. Only sample profiles were used; registration validation was exercised with empty fields without creating a profile. Live Google authentication and a production backend were not exercised.

## Root causes and fixes

| Finding | Evidence and resolution |
| --- | --- |
| Stale local compiled markup | The running Turbopack preview served pre-migration semantic classes without the Tailwind classes present in source. Touching/reloading did not resolve it. Restarting the development server with a fresh `.next/dev` restored current markup. The old generated cache was removed after confirmation. |
| Action styles defeated responsive visibility | ButtonLink/ButtonAnchor placed caller classes on the Slot child after Button's class merge. Conflicting `inline-flex`/`hidden` classes exposed the desktop community action on phones and pushed every management header 117px beyond the viewport. Merge caller classes on Button before `asChild`. |
| Header controls overflowed | Constrain flexible header areas, use compact icon actions on phones, hide wide Kibble text below `xl`, and keep account/search/theme/notifications reachable. Mobile notifications retain their direct destination; recent-notifications dropdown is desktop-only. |
| Theme hydration mismatched | Server and client disagreed on the toggle's pressed state. A mounted client snapshot gates its state and availability. No new browser console errors were recorded during confirmation. |
| Inconsistent controls and forms | Adapt the installed official registry controls to the existing 44px target; enlarge dialog close targets. Standardize page headings, responsive filter widths, field labels, help associations, checkbox label areas, and readable workflow form width. |
| Over-spaced cards and cramped summaries | Remove unwanted registry Card gaps/padding in composed activity/catalog surfaces. Give overview summaries separate label/value tiles and establish heading defaults. |
| Public profile overflow | Constrain pet cover and public profile tab widths. Wrap long status text instead of widening the document. Previous 66px pet-cover and 42px member-profile overflow no longer reproduce. |
| Dark-mode secondary text | Replace fixed brown secondary text in affected feature components with `muted-foreground`. |
| Misleading member action | Hide organizer-only quest creation for member/guest Create menus while preserving staff/moderator access and server authorization. |
| Session and validation presentation | Center the session status loader while keeping identity content hidden. Replace raw schema diagnostics with useful login/registration field messages. |

## Verification

- `npm run check:ui`: passed; feature code continues to compose the official registry primitives.
- `npm run typecheck`: passed after correcting existing missing Google Maps ambient types, a missing default profile banner, overly narrow RSVP fixture provenance, and outdated typed test fixtures/imports.
- Focused Vitest run: 18 tests passed across `layout/states`, `layout/create-menu` and `layout/navigation`. Update the existing harness for `matchMedia` and App Router hooks; align assertions with current route readiness, registry accessibility names and organizer permissions.
- Browser: confirmed sidebar tab selection, drawer Escape/focus restoration, permission-aware member Create actions, inline registration errors associated with invalid fields, and no new console errors during the confirmation window.
- Raw DOM scans include Radix's hidden form inputs and label-named checkbox buttons; those are not treated as missing accessible names. Clipped progress indicators and locally scrollable tab strips are not document overflow.

Evidence lives in the ignored local `.impeccable/review/ui-standards/` directory: before/after JSON, route screenshots, interaction results, console results, and `desktop-after.jpg` / `mobile-after.jpg`. Some long pages exceeded the browser full-page screenshot capability; viewport observations were used, and the final marketing home confirmation is DOM-only. The final preview images show the overview in its surrounding shell.

## Route coverage

“Desktop” and “mobile” columns below describe confirmation observations; all routes had an initial desktop/mobile inspection. Permission-only routes were reviewed with their intended role. Route parameters refer to fictional sample records.

| Route | Surface | Confirmation |
| --- | --- | --- |
| `/` | Home | mobile-light |
| `/adopt` | Adopt | desktop-dark, mobile-light |
| `/adopt/applications` | Applications | mobile-light |
| `/adopt/interested` | Interested | mobile-light |
| `/adopt/preferences` | Your preferences | mobile-light |
| `/animals/report` | Report Animal | desktop-light, mobile-light |
| `/community` | Community | desktop-dark, mobile-light |
| `/community/create` | Create Community Post | mobile-light |
| `/community/post-1` | Nov 1 | mobile-light |
| `/dashboard` | Overview | desktop-dark, desktop-light, mobile-dark, mobile-light, small-mobile-light, tablet-light |
| `/dashboard/achievements` | Achievements | desktop-light, mobile-light |
| `/dashboard/achievements/review` | Achievement evidence | desktop-light, mobile-light |
| `/dashboard/adoptions` | My adoptions | desktop-light, mobile-light |
| `/dashboard/animals` | My animals | desktop-light, mobile-light |
| `/dashboard/animals/milo/edit` | Animal editor | desktop-light, mobile-light |
| `/dashboard/events` | My events | desktop-light, mobile-light |
| `/dashboard/events/create` | Organizer event form | desktop-light, mobile-light |
| `/dashboard/fundraisers` | My fundraisers | desktop-light, mobile-light |
| `/dashboard/kibble` | Kibble | desktop-light, mobile-light |
| `/dashboard/missions` | My missions | desktop-light, mobile-light |
| `/dashboard/moderation` | Moderation | desktop-light, mobile-light |
| `/dashboard/notifications` | Notifications | desktop-light, mobile-light |
| `/dashboard/profile` | Profile | desktop-dark, desktop-light, mobile-dark, mobile-light |
| `/dashboard/saved` | Saved | desktop-light, mobile-light |
| `/dashboard/settings` | Settings | desktop-dark, desktop-light, mobile-dark, mobile-light |
| `/dashboard/shelter` | Shelter management | desktop-light, mobile-light |
| `/dashboard/shelter/applications` | Shelter applications | desktop-light, mobile-light |
| `/dashboard/shelter/applications/sample-application-extra-user-9` | Private shelter application | desktop-light, mobile-light |
| `/dashboard/sightings` | My sightings | desktop-light, mobile-light |
| `/events` | Events | desktop-dark, mobile-light |
| `/events/sample-gathering-5?section=attendees` | Public attendees | mobile-light |
| `/explore` | Explore | desktop-dark, mobile-light |
| `/fundraisers` | Fundraisers | desktop-dark, mobile-light |
| `/fundraisers/create` | Start Fundraiser | desktop-light, mobile-light |
| `/fundraisers/sample-care-8` | Sample: Safe transport supplies for Patches | mobile-light |
| `/hordes` | Hordes | desktop-dark, mobile-light |
| `/hordes/poblacion-paws-1` | Sample Riverside Paws | mobile-light |
| `/leaderboard` | Leaderboard | desktop-dark, mobile-light |
| `/login` | Login | mobile-light |
| `/missions` | Missions | desktop-dark, mobile-light |
| `/missions/create` | Organizer mission form | desktop-light, mobile-light |
| `/missions/sample-help-22` | Sample: Refresh shaded water stations for Luna | mobile-light |
| `/pets/milo` | Milo | desktop-light, mobile-light |
| `/register` | Register | mobile-light |
| `/search` | Search | mobile-light |
| `/shelters` | Shelters | desktop-dark, mobile-light |
| `/shelters/sample-shelter-1` | Sample Riverside Rescue House | mobile-light |
| `/sightings/create` | Create Sighting | desktop-light, mobile-light |
| `/users/sample-helper-1` | View Sample Helper 1’s profile | desktop-light, mobile-light |
