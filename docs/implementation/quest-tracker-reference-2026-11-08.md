# Quest tracker reference layout — 8 November 2026

The owner supplied a quest-panel layout reference. The discovery map now composes the existing official shadcn Collapsible, Tabs, Progress, Button, Badge and Skeleton components into a compact upper-right tracker, retaining PawTrail’s palette, small-radius actions, circular portraits, Saira Condensed headings and Instrument Sans secondary text. Registry sources are unchanged; no shipping raster was added or generated.

## Layout and interaction

The expanded panel contains a Quests title and short description, Neighborhood care progress card with a trophy motif, four counted filters, portrait rows and a View more quests control. The filters are All, Needs attention, Adoption and My quests. The panel width adapts to the right side of the map; its filter group wraps into two rows, and its list scrolls while header/filter/footer controls remain available. Up to five rows are initially shown, with five more revealed per click. Counts describe the available records, not a fabricated global total.

The desktop panel starts expanded. Collapsing keeps its title, recorded care progress, attention/adoption shortcuts and expansion control. Phones retain the compact right-side quest toggle and open the panel below the retained PawTrail/search header; opening quests folds the left results body and vice versa. The existing detail/directions flow still takes precedence over quests. Official disclosure/tab semantics, focus restoration, contextual count announcements and reduced-motion-aware arrival are retained.

Animal rows combine public identity, portrait, area and the actual attention/adoption status. A single animal can carry both status labels without being duplicated in the list. Attention rows open the existing care/help flow; adoption rows open the same animal detail drawer as the map/list. Mission rows retain their real public links and show saved participation milestones when the viewer has joined them. No online-status dot is inferred from an animal’s map presence.

## Database projection

`MapAnimal.adoptable` comes from the published social animal DTO; shelter residence alone never implies adoption availability. Unknown flags remain unknown. Attention rows come from the loaded public animal records, including shared-place members, and persist independently of one nearby prompt or its local dismissal. The All view combines these animals, real mission records and any distinct contextual place alert.

The map-only mission bridge reads an open, priority-ordered public page and every page of the authenticated viewer’s own participation records. It fetches missing joined mission details, including closed/approved quests outside the public page, with at most four detail requests in flight. Public portraits are fetched in groups of at most 50 IDs, with the same concurrency bound. Superseded requests abort. Failed details are omitted and produce an explicit unavailable/retry message; private evidence/reviewer fields are not projected.

Neighborhood care shows the actual number of approved joined quests divided by the viewer’s recorded joined quests. Awaiting-review totals also come from saved participation states. Guest, no-participation, loading and unavailable states are explicit. The reference’s example 3/5 values and reward promise were not introduced. These bars do not grant Kibble, imply welfare recovery or authorize payouts.

Row distances appear only when an explicitly obtained viewer location is present. They are labelled approximate straight-line distances to published approximate locations; they are not shortest walking routes, live animal tracking or device permission substitutes. The existing route feature remains separate and unchanged.

## Delivery and verification

Shared quest components, models, adoption field and map call sites were mirrored narrowly between the standalone game and the social worktree. The integrated app retains the real API loader; its runtime bridge and the standalone integration source both preserve the adoption flag. The superseded standalone attention-list component was removed after its rows were consolidated.

Source review only. No automated tests/checks, builds or browser verification were run, under the owner’s standing instruction. Development services remain running. No database records, geographic boundaries, community memberships, server instances, rewards or payments were created or changed. The regional-border question is documented separately as a proposed capability.
