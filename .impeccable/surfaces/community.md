# Community

6 November live-review follow-up: start with a compact composer, expand long story text and extra tags in place, keep badges secondary and constrain photo height. Badge links open the author’s selected public showcase item and earning rule. Distinct locally served animal portraits persist across connected stories. See `docs/implementation/live-review-follow-up.md`; the updated rendering remains unverified.

Mode: Operate. Build path: code. User-directed replacement of the journal composition with familiar X/Facebook social mechanics; see DESIGN.md.

FIRST VIEWPORT: Full-width platform shell, compact left navigation, flexible photo-led feed and optional adoption/help rail. Community heading, four compact feed filters and a small composer leave room for actual posts. No marketing hero or management links mixed into the feed navigation.

SIGNATURE: Recognizable author initials, actual counts, Like/Comment/Share/Save, compact follow and linked pet identities. Existing privacy, moderated publication, rollback and retry remain.

ART: Five compact crops from the supplied PawTrail illustration; only decorative uses, not rasterized interface controls. Provenance: docs/assets/pawtrail-illustration.md.

RESPONSIVE: Rail drops at 76rem; intermediate tablet uses icon navigation; mobile uses one feed, drawer and bottom navigation. No fixed content cap.

VERIFICATION: Source implementation only. No agents, automated tests/checks, builds, detectors or browser inspection under the user override. Rendered quality remains unverified.

RECOGNITION: Attributed post and comment authors in the current all-time top ten have a crown and numbered rank. Use the shared RankCrown and authoritative nullable DTO field, with natural wrapping and a link to the all-time board; no client-authored or persistent rank decoration.

## Whole-app social surface pass — 6 November 2026

The supplied social-post reference extends the established world to resource directories, detail activity and supporting pages: contained semantic cards, compact genuine identities, current opted-in badge illustrations and top-ten crowns, public participant avatar strips, supplied-art empty/media placeholders and real next actions. Horde and saved stories reuse reactive post cards. Privacy and current moderation govern every identity. No fake faces, award claims or like controls fill missing data. Shared owner: `app/social-surfaces.css` and `components/shared/social-card.tsx`; source audit and route coverage: `docs/implementation/social-surface-audit.md`. Direct implementation, source review only; no agents or automated/browser verification.
