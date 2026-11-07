# Community

6 November live-review follow-up: start with a compact composer, expand long story text and extra tags in place, keep badges secondary and constrain photo height. Badge links open the author’s selected public showcase item and earning rule. Distinct locally served animal portraits persist across connected stories. See `docs/implementation/live-review-follow-up.md`; the updated rendering remains unverified.

Mode: Operate. Build path: code. User-directed replacement of the journal composition with familiar X/Facebook social mechanics; see DESIGN.md.

FIRST VIEWPORT: Full-width platform shell and compact left navigation, with a centered 1124px content container: up-to-800px photo-led feed, up-to-300px adoption/help rail, and a 24px gap matching the pet profile. Community heading, four compact feed filters and a small composer leave room for actual posts. No marketing hero or management links mixed into the feed navigation.

SIGNATURE: Recognizable author initials, actual counts, Like/Comment/Share/Save, compact follow and linked pet identities. Existing privacy, moderated publication, rollback and retry remain.

ART: Five compact crops from the supplied PawTrail illustration; only decorative uses, not rasterized interface controls. Provenance: docs/assets/pawtrail-illustration.md.

RESPONSIVE: Columns use available container width. Below 832px they stack into one reading flow; the feed remains capped at 800px. The platform retains its mobile drawer and bottom navigation.

VERIFICATION: Source implementation only. No agents, automated tests/checks, builds, detectors or browser inspection under the user override. Rendered quality remains unverified.

RECOGNITION: Attributed post and comment authors in the current all-time top ten have a crown and numbered rank. Use the shared RankCrown and authoritative nullable DTO field, with natural wrapping and a link to the all-time board; no client-authored or persistent rank decoration.

## Whole-app social surface pass — 6 November 2026

The supplied social-post reference extends the established world to resource directories, detail activity and supporting pages: contained semantic cards, compact genuine identities, current opted-in badge illustrations and top-ten crowns, public participant avatar strips, supplied-art empty/media placeholders and real next actions. Horde and saved stories reuse reactive post cards. Privacy and current moderation govern every identity. No fake faces, award claims or like controls fill missing data. Shared owner: `app/social-surfaces.css` and `components/shared/social-card.tsx`; source audit and route coverage: `docs/implementation/social-surface-audit.md`. Direct implementation, source review only; no agents or automated/browser verification.

## Item loading and supporting cards — 6 November 2026

Official shadcn Cards contain adoptable pets with circular portraits and restrained hover feedback. The supplied-art story invitation leads to Share a story, using the existing sign-in return path for guests. `CommunityPageSkeleton` uses the same layout as the ready page; `FeedLoading` shows post-shaped Skeleton items on feed changes and pagination. The reusable post, pet, and resource placeholders mirror each item’s identity, body, media, and action structure. Loading uses Tailwind spin/pulse, with a gentler reduced-motion opacity signal. Page/section arrival is 180ms and resets after pending content becomes visible; no artificial delay or unmounting of hidden drafts. See `docs/implementation/community-width-loading.md`.
