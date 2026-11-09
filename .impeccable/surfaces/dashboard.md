# Dashboard

6 November live-review follow-up: lead with current private tasks and upcoming events, then contribution summaries and story previews. Separate mission statuses and disclose evidence forms on intent. Keep public badges/crowns at the page identity rather than repeating them on each private record. Shared page actions stay compact. Source delivery: `docs/implementation/live-review-follow-up.md`; no new rendered verification.

Mode: Operate. Build path: code. Separate management workspace explicitly requested by the owner; see DESIGN.md and UX-CONTRACT.md.

FIRST VIEWPORT: Own management-only navigation grouped by workspace, account and authorized organization work. Sticky utility header, breadcrumb, genuine summaries and wide task area. Clear return-to-community link. No social bottom bar or platform navigation mixed into desktop management.

RESPONSIVE: Management drawer owns mobile wayfinding. Natural-height task documents retain document scrolling; no fixed-height form shell. Forms keep a readable measure while lists use available width.

FUNCTION: Existing role checks, record versions, error recovery and protected destructive actions remain authoritative. No changes to business lifecycles.

VERIFICATION: The owner explicitly requested a complete dashboard check on 6 November 2026. All 13 member tabs, both shelter tabs and both moderation tabs were inspected and confirmed on desktop and mobile. Scoped UI/type checks and 18 navigation/state tests pass. See `docs/implementation/ui-standards-audit.md`. No production build or subagents were used.

## Consistent management cards — 6 November 2026

Retain the separate management shell while carrying community identities into sightings, participation, campaign and calendar cards. Private applications keep pet thumbnails and private status; system ledger and notification entries use resource/system marks. Forms and review queues share the card spacing and illustrated empty states. Existing actions, privacy controls and independent evidence review remain authoritative. The overview includes actual recent own stories. Shared presentation now lives in Tailwind feature compositions and the official `src/components/ui` registry layer. Coverage and unverified delivery limits: `docs/implementation/social-surface-audit.md`.

AUDIT CLOSURE: Independent saved/application/draft/mission queue paging is URL-backed. Review state navigation separates waiting submissions from approved records and retains the existing reversal form. Expense and adoption histories use the shared identity/activity grammar, meaningful empty states and canonical private document actions. Full implementation checklist: `docs/implementation/social-surface-audit.md`; runtime/visual verification remains disabled.

## UI standards confirmation — 6 November 2026

Preserve the Operate layout and its separate management navigation. Use 44px default controls, a fully reachable mobile utility header, wrapping status labels, consistent page-heading/action spacing, readable filter fields and naturally flowing forms. Overview summaries use independent label/value tiles without nested outlines. Heading defaults establish Saira Condensed hierarchy without overriding explicit feature typography. Secondary feature text uses the semantic muted token in both themes.

Mobile action visibility must be merged at Button before Slot composition; never append conflicting visibility classes directly to its child. Theme state must use the server snapshot until mounted. Member Create menus omit organizer-only quests; server permission checks remain authoritative. Session changes show a centered status loader while identity-dependent content remains hidden.
