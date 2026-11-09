# Floating map and quest tracker — 8 November 2026

The discovery map now uses the whole viewport behind floating controls. Its left results panel starts expanded and contains the existing brand/account navigation, search and results; the visible Places map title is removed. The result body folds vertically on desktop and phones, retaining PawTrail, its description and search. Choosing a result or map action folds the phone results so the map remains accessible. Category buttons moved into a horizontally scrollable top-center group, keeping their existing filters and real counts.

Location/search actions sit beside matching zoom/fit controls in a compact bottom dock. The upper-right quest tracker is replaced by the selected detail/directions view when that task needs the space. Phones open quests through a compact button. Zoom controls sit at the lower right and move beside a desktop detail drawer. Camera calculations in MapLibre and the raster fallback reserve space for the expanded sidebar and selected detail panel, while keeping the canvas full width. Existing route endpoint identity and absolute route-fitting padding are retained.

## Saved mission progress

The integrated social app exposes `PlatformBridge.mapQuests` through `loadMapQuests`. This reads open public missions in priority order, the current session, the signed-in viewer’s participation pages (`scope: mine`), and public animal records for the mission portraits. No evidence text, evidence media, reviewer fields or other people’s participation records enter the map projection. The standalone composition accepts the same optional bridge and reports unavailable tracking when none is supplied.

A progress bar represents three workflow milestones rather than a welfare or reward estimate:

| Saved state | Milestones | Label |
| --- | --- | --- |
| No participation | 0/3 | Not started |
| Accepted | 1/3 | Joined; submit your proof |
| Submitted | 2/3 | Proof submitted; awaiting review |
| Approved | 3/3 | Approved; quest complete |
| Rejected | 1/3 | Changes requested; update your proof |

Guests see a sign-in prompt instead of an assumed personal state. The panel shows at most three tasks from a priority-ordered public page, preferring saved active participation, with a link to the full mission list. Animal photos use public, non-sensitive media and existing labelled illustration fallbacks. Existing attention alerts remain actionable; an alert already represented by a quest is omitted. Loading, unavailable, empty and retry states are explicit.

The tracker refreshes independently from map rendering on mount, discovery reload, window focus and every 60 seconds while the document is visible. Superseded requests are aborted. All progress is read from persisted database states. No mission, fixture, review, Kibble, payment or location record was created or changed.

## Components and verification

The layout uses Tailwind utilities and existing official shadcn Button, Badge, Progress and Skeleton components. Their registry sources are unchanged. Existing Saira Condensed and Instrument Sans roles, neutral action text, small-radius action buttons and circular avatars remain in use. Shared game/map changes were mirrored narrowly between the standalone game and the social worktree; the API adapter remains integrated-only.

Source review only. No automated tests, checks, builds or browser verification were run for this update, following the owner’s standing workspace instruction. Prior Firefox route verification predates this layout change. Development services remain running.


## Floating controls and vertical results disclosure

The owner's follow-up clarifies that collapsing the sidebar must hide its results body, rather than remove PawTrail and search. The left card now always retains the brand, “A little closer to your animal neighbors.” description, search, result count, refresh and a vertical chevron trigger. The initially expanded result list, advanced filters and list footer fold below these controls. Searching and opening advanced filters expand results. The installed official shadcn Collapsible owns disclosure semantics; hiding focused results restores focus to the retained trigger. The registry component was added in each project using `npx --yes shadcn@4.23.0 add collapsible --yes`, without source modifications.

Category buttons now float individually: their navigation wrappers have no background, border or shared shadow. Each small-radius button owns its solid themed surface, border, focus and selected state.

Find animals near me, Choose center and Search this map area moved beside zoom/fit into one bottom control dock. All six actions use the same composed shadcn Button and tooltip treatment, 32 px desktop controls and larger 44 px touch targets. Desktop groups stack side by side; narrow screens use a compact row. The same component receives the existing callbacks in MapLibre and raster fallback modes. The dock clears detail/directions panels, preserves picking and loading states, and keeps the existing location action ID for focus restoration. The old top-left toolbar and horizontal sidebar collapse control were removed.

Quests now include a dedicated Needs attention section for the loaded public animals, including published help flags, missing-animal states and public welfare concerns. Animals sharing a place are included once per animal, ordered by recorded urgency. Each entry has the current public portrait/fallback, animal name, recorded alert label and public area, and opens the existing help/details flow. These entries do not depend on the current nearby prompt, category filter or local prompt dismissal; only loaded public data is used, with no invented welfare percentage. Community missions retain their separate saved participation progress. On phones, opening quests folds the results body, and reopening results folds quests. The title/search remain visible in either state. Closing quests restores focus to its toggle.

UI/UX Pro Max supplied relevant shadcn disclosure guidance. Its semantic disclosure search did not yield a relevant UX match, so general keyboard/focus guidance was used for that part. Review remains source-only under the standing owner instruction: no automated tests/checks, builds or browser verification were run for this refinement. Shared source was mirrored narrowly; API, database, reward and route-request logic were not changed.
