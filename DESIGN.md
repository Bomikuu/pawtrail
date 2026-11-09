---
name: PawTrail social platform
description: Every Paw Has a Story.
colors:
  primary: '#F97316'
  primary-dark: '#EA580C'
  teal: '#0F766E'
  green: '#84CC16'
  background: '#F7F7F5'
  surface: '#FFFFFF'
  foreground: '#3B2416'
  muted: '#78716C'
  border: '#E4DED7'
  action-hover: '#9A3412'
  secondary-text: '#6B625B'
typography:
  heading:
    fontFamily: 'Saira Condensed, sans-serif'
    fontSize: '2rem'
    fontWeight: 700
    lineHeight: 1.2
  subheading:
    fontFamily: 'Saira Condensed, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  navigation:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.4
  mobile-heading:
    fontFamily: 'Saira Condensed, sans-serif'
    fontSize: '1.75rem'
    fontWeight: 700
    lineHeight: 1.2
  form-subheading:
    fontFamily: 'Saira Condensed, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.2
  section-title:
    fontFamily: 'Saira Condensed, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.4
  status:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 600
    lineHeight: 1.6
  availability:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.4
  mobile-navigation:
    fontFamily: 'Instrument Sans, sans-serif'
    fontSize: '0.6875rem'
    fontWeight: 400
    lineHeight: 1.4
rounded:
  control: '0.75rem'
  menu-item: '0.5rem'
  status: '0.375rem'
spacing:
  field: '0.5rem'
  control: '0.75rem'
  gutter: '1rem'
  form: '1.25rem'
  panel: '1.5rem'
  section: '2rem'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.control}'
    height: '2.75rem'
    padding: '0.625rem 1rem'
  button-primary-hover:
    backgroundColor: '{colors.action-hover}'
    textColor: '{colors.surface}'
  button-outline:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.control}'
    height: '2.75rem'
    padding: '0.625rem 1rem'
  input:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.foreground}'
    rounded: '{rounded.control}'
    height: '2.75rem'
    padding: '0.625rem 0.75rem'
  navigation-current:
    backgroundColor: '{colors.surface}'
    textColor: '{colors.teal}'
    rounded: '{rounded.control}'
  status-success:
    backgroundColor: '{colors.teal}'
    textColor: '{colors.surface}'
    rounded: '{rounded.status}'
---

# Design System: PawTrail

## Overview

**Creative North Star: "A neighborhood social network, with a separate management workspace"**

The platform is a familiar, full-width social network for pets and their people. A light neutral canvas, white posts, orange actions, recognizable identities and generous photographs make the feed easy to scan. Pet stories remain connected to practical help. The management dashboard uses a distinct task-oriented shell, restrained teal navigation and a wide workspace.

The user explicitly replaced the journal composition with a social layout comparable to X/Facebook, requested full viewport width and a separate management dashboard, and supplied a PawTrail illustration sheet. This supersedes the earlier journal layout. The code-first preference, Saira Condensed/Instrument Sans type, orange identity, existing functionality and privacy boundaries remain. Tests and browser verification remain disabled by user instruction.

**Key Characteristics:**

- Animal identity leads; supporting chrome stays compact.
- Warm, flat surfaces with clear text and native interaction.
- Honest sample labels, permissions, unavailable states, and recovery.

This contract records the approved world and its source implementation. Licensed fonts and credited photography are self-hosted. The user later selected direct implementation without agents or automated testing. Historical foundation checks predate the native feature changes; fresh automated and rendered verification have not been performed.

## Colors

Orange, teal, green, cream, white, and brown remain the brand palette. The canonical shadcn tokens in `src/app/globals.css` own control colors and states. Primary buttons use the official shadcn primary/primary-foreground treatment and hover opacity; custom legacy button CSS no longer overrides them. Dark mode uses black and neutral charcoal surfaces.

Teal supports links, focus, current navigation, and successful states. Green is an accent with brown text. `secondary-text` supplies readable descriptions and placeholders on cream or white; `muted` supplies visible form outlines. Beige rules separate content but do not replace required control boundaries. Status always includes words; color never conveys the only meaning. Do not infer verification from teal or create a verification claim in a shared primitive.

## Typography

Saira Condensed headings and wordmark; Instrument Sans body, labels, controls, and data, with self-hosted Latin and Latin Extended fonts and sans-serif fallbacks. Body is 1rem/1.6. App headings are 2rem desktop and 1.75rem mobile; dialog/empty-state headings are 1.5rem. Navigation uses 0.9375rem/1.4. Mobile bottom labels use 0.6875rem while retaining 3.5rem targets. Long prose stays near 65–75ch. PHP amounts use tabular numerals and integer centavos.

Marketing display typography uses 3.25–5.5rem on desktop and 3.25–4.5rem on mobile; marketing section headings use 1.85–2.6rem. Application workspaces use the same Saira Condensed/Instrument Sans roles, compact data rows, story surfaces, native semantics, and responsive control spacing. Maps and charts are lazy islands, and adoption transitions honor reduced motion.

## Layout

The platform uses all available viewport width. `AppShell` defaults to the `platform` variant: a sticky 68px utility header, a 224px navigation rail, a flexible feed and a contextual discovery column. The community feed now matches the pet profile: an up-to-800px main column, a 300px supporting rail, and a 24px gap inside a centered 1124px container. Other workspace surfaces retain their own width requirements. The community page uses compact feed filters, a small composer, photo-led posts and actual reaction/comment counts. Supplemental guidance belongs in the discovery rail, not above every post.

The optional discovery rail appears when sufficient width is available. At the Tailwind `md` breakpoint and below the sidebar becomes a shadcn Dialog drawer and the platform uses one feed plus bottom navigation. All primary social actions remain reachable. Page content owns document scrolling; only the desktop sidebar has bounded overflow.

`/dashboard/**` explicitly uses the `management` variant: management-only grouped navigation, a breadcrumb, real contribution summaries and full-width task content. It does not render the social sidebar or mobile social bottom bar. Management destinations remain available through its mobile drawer. Forms retain a readable measure inside the wide workspace; tables and lists can use the remaining width. A visible link connects both workspaces.

Marketing and authentication retain their existing route-specific layouts. The redesign does not replace them or change data/permission rules.

The later 6 November login update follows the owner's supplied two-column reference, with restrained Saira Condensed headings, a cream canvas, a white shadcn form card and the supplied cat-and-dog illustration. The subsequent registration update uses a centered card in the same treatment, an avatar picker, responsive paired fields and inline community guidance, without a left illustration. The platform/management shells keep their layouts. See `.impeccable/surfaces/auth.md`, `docs/implementation/login-redesign.md` and `docs/implementation/register-redesign.md` for the route contracts, integration boundaries and source-only review status.

## Runtime token ownership

`src/app/globals.css` remains the canonical runtime token source (existing-runtime ownership). This file mirrors the roles; it does not generate a competing theme. Shadcn/Radix controls continue to use the canonical `src/components/ui` layer.

| Role                  | Runtime variable                    | Value                   | Consumers                                    |
| --------------------- | ----------------------------------- | ----------------------- | -------------------------------------------- |
| Brand action          | `--primary`                         | `#F97316`               | Button, selected feed indicator              |
| General foreground    | `--foreground`                      | `#3B2416`               | Text, controls, identity                     |
| Social canvas         | `--social-canvas`                   | `#F7F7F5`               | Both workspace backgrounds, search           |
| Social separation     | `--social-line`                     | `#E4DED7`               | Header, posts, management divisions          |
| Social secondary text | `--social-muted`                    | `#6B625B`               | Metadata, labels, supporting text            |
| Surface               | `--surface`                         | `#FFFFFF`               | Header, posts, management forms              |
| Management/help       | `--teal`                            | `#0F766E`               | Focus, links, selected management navigation |
| Scrollbar             | `--scroll-thumb` / `--scroll-track` | `#B7B4AE` / transparent | Global scrollable surfaces                   |

Social headings use 26px Saira Condensed; posts use 15px Instrument Sans and a readable text measure within the flexible feed. People use the owner's 30 illustrated portraits, selected in the profile form and rendered through `CommunityAvatar`. Stable record-based illustrations supply defaults for identifiable people; initials remain the anonymous/unavailable fallback. The controlled picker uses shared Buttons, visible selection, descriptive accessible names and a constrained scrolling grid. All 30 WebP files total approximately 151 KB; see `docs/assets/people-avatars.md`. Hover, focus, selected, disabled, loading, empty and error treatments reuse maintained components.

## Elevation & Depth

Surfaces are flat at rest, separated by warm borders. Portaled menus use `0 8px 24px rgb(59 36 22 / 12%)` to communicate temporary elevation. Modal overlays use brown at 40% opacity. No card shadows or decorative halos. Short 150ms color transitions respond to intent. Navigation content arrives in 180ms without delaying route changes, and skeletons pulse while the paw loader spins. Reduced motion removes spatial movement and retains only a gentle loading-opacity signal. Content remains visible without an entrance animation.

## Shapes

Controls use 0.75rem corners; menu items 0.5rem; status labels 0.375rem. Images preserve useful pet identity and meaningful alt text. The shared AnimalImage fallback/sensitivity contract remains authoritative. Lucide provides consistent line icons; the PawTrail lockup uses a compact crop of the user-supplied cat/dog illustration beside the wordmark. Other supplied crops appear in the discovery rail and empty/404 states; all five WebP assets total about 33 KB. See `docs/assets/pawtrail-illustration.md`.

## Components

The whole-app social surface pass extends the same card grammar to public discovery and management: contained resource/activity items, compact genuine identities, human attribution, current opted-in badge illustrations and top-ten crowns, and small public participant strips. System and private/unavailable identities use labeled resource marks. Supplied illustration placeholders explain empty or unavailable content without inventing activity. Tailwind utilities own these shared treatments inside the existing platform/management shells; `components/shared/social-card.tsx` owns bylines, badges, participant faces and activity cards. See `docs/implementation/social-surface-audit.md` for route coverage and unverified delivery limits.

Community event detail follows the supplied events reference: compact supplied illustrated cover, strong title/date/venue hierarchy, genuine capacity/attendance/RSVP facts, a conversation column and a practical RSVP/attendees/details/host rail. Event directory cards use the same small supplied artwork and genuine schedule/capacity data. Discussion, About and Attendees have URL-backed content; sharing, public-venue Maps links and authorized organizer editing remain actionable. RSVP is join/withdraw, with visible closed/full states. Public identities require discoverability and contribution consent. Event presentation is expressed in component Tailwind utilities; narrow screens stack in DOM order. See `docs/implementation/events-ui.md`.

Pet profiles follow the owner's supplied social-profile reference: a compact supplied cover, overlapping pet photograph, real public activity totals, Activity/About/Photos/Location navigation and a feed/details split. The timeline always names human reporters, helpers and story authors. Practical help and sightings lead by default; tagged-story cards retain the existing community interactions and put the current pet tag first. Pet-side “Community care” markers describe recorded facts; human achievement badges, ranks and Kibble are never assigned to animals. The primary profile column is capped at 800px beside the smaller care/details rail; component Tailwind utilities use the canonical runtime tokens.

Public PawPal profiles use the owner's supplied profile reference: a compact illustrated cover, overlapping illustrated avatar, current rank crown, real Kibble level progress, four contribution totals and a two-column overview. The sidebar holds About and Community impact; the main column holds activity navigation, opted-in badges/mastery, animal associations and story previews. Eight owner-supplied cover presets match the avatar/badge illustration style and share the controlled avatar-picker pattern and the existing profile-save transaction. No invented XP, online presence, messaging action or activity totals fill the reference. Profile content remains server-rendered, and mobile folds the columns into one reading flow. See `docs/implementation/profile-covers.md`.

Top-ten recognition uses the shared `RankCrown`: a Lucide crown and real `#1`–`#10`, with gold/silver/bronze treatments for the first three. Public profiles show the rank beside the name; post and comment bylines use the same marker. Its accessible name identifies the all-time leaderboard and its link opens that exact ranking. The server derives it from the canonical current public ranking, clears it for hidden identities and ranks outside ten, and never accepts a client-selected rank.

The public leaderboard follows the owner's supplied recognition reference: the owner's full-width cat-and-dog trophy banner, contribution totals, teal period navigation, a gold/silver/bronze top-three podium, illustrated member identities, earned showcase badges and dense readable rows. It occupies the full platform content width. On mobile the podium remains visible and the semantic table scrolls inside a named, keyboard-focusable region. Recognition comes from recorded activity and consent, never follower/like counts. Levels retain the existing 100-lifetime-Kibble policy; mastery is shared only by explicit opt-in. See `docs/implementation/leaderboard.md`.

Achievements use the owner's 45 illustrated badge assets, a compact responsive collection, official shadcn `Progress`, and separate requirement/reward/state text. `features/achievements/catalog.ts` owns the version-one one-time 10–500 Kibble schedule approved by the owner. Private progress and evidence stay in management; public profiles show at most six chosen unlocked badges and optional aggregate mastery. Do not infer real-world outcomes from clicks, RSVP or adoption approval. See `docs/implementation/achievements.md` for rules, provenance and unverified delivery status.

Official shadcn/ui registry components live in `src/components/ui`, installed through CLI 4.23.0 rather than recreated as lookalikes. Button, Input, Textarea, Checkbox, Native Select, Select, Dialog, AlertDialog, DropdownMenu, HoverCard, Progress, Skeleton, Table, Card, Badge, Avatar, Tabs, RadioGroup, and Sonner are available. Ordinary layout, typography, spacing, colors, responsive behavior, and interaction states use Tailwind utilities; CSS is reserved for theme/font setup, browser-specific rules, and animation keyframes. See `docs/implementation/shadcn-tailwind-migration.md` for provenance and compatibility choices. Internal route actions use ButtonLink; external/document actions use ButtonAnchor; ordinary in-app links use the shared NavigationLink adapter over Next Link. Query tabs, GET filter/search forms, and programmatic push/replace routes use the same immediate page loading feedback. Keep the navigation frame responsive and show a single paw loader in the content area during route work. Controls retain browser semantics, visible labels, official shadcn interaction states, and purposeful touch-target sizing at their call sites.

Create uses a portaled keyboard menu with Report Animal, Create Sighting, Start Fundraiser, Create Community Post, and Create Quest. Anonymous users receive a validated login return URL for implemented protected destinations. `src/components/layout/navigation.ts` is the exact-path readiness registry: owning feature tasks add paths only after their real route and behavior ship. All unimplemented destinations remain non-links labeled Coming soon. Tests may inject a ready-route set; production uses the central registry.

Radix owns menu arrow keys, focus trapping, Escape, and trigger focus restoration. ConfirmDialog protects irreversible local decisions, disables duplicate submission, remains open on errors, and restores focus on completion/cancel. DataState handles loading skeletons, actionable empty, retryable error, and ready content; callers supply domain-specific empty copy. Sonner is mounted once in Providers and announces notices through its polite region. Inline errors remain in the form/dialog.

AppShell accepts optional supplied `unreadCount` and `kibbleBalance` as nonnegative safe integers. It displays unavailable until owning features supply genuine session-scoped data, and hides private values from guests. Kibble is explicitly non-cash. Zustand holds only ephemeral drawer visibility; fetched records and private answers stay out. DemoBanner labels sample profiles, activity, verification, and simulated contributions whenever session.demo is true.

## Live-review refinements

Pet profiles use an up-to-800px primary column for the cover and activity, alongside a narrower right column for About, Community Care, and Recent Sightings. A shared server layout preserves cover, identity, compact inline activity counts, discussion, and supporting cards while only the selected section changes. Reusable `NavigationScope`, `NavigationRegion`, `Skeleton`, and `SectionLoading` components provide immediate section feedback; feed filters keep their controls visible and replace only the results. Help opens a Radix action dialog with Lucide icons and useful descriptions. The shared sign-in prompt supplies a clear primary action and contextual comment/update placeholders. The two columns stack when the available space is too narrow. See `docs/implementation/pet-social-profile.md` for the superseding refinement and unverified runtime status.

The owner approved a live-review follow-up on 6 November 2026: compact expandable feed composition, smaller badge/media presentation, responsive discovery grids, side-by-side desktop adoption, action-first dashboard queues and canonical progress styling. Badge links select the author’s public earned badge rather than the viewer’s collection. The leaderboard also recognizes recent approved care and first contributions beyond rank. Animal groups distinguish animals from consenting human helpers. Twenty small licensed portraits provide consistent sample animal identity across connected activity; `/photo-credits` records attribution. Without Maps credentials, a real neighborhood guide replaces technical setup copy. These refinements preserve the selected visual world. See `docs/implementation/live-review-follow-up.md` for source coverage and the unverified rendered result.

## Do's and Don'ts

- Do keep pet identity, readable names, status words, and the next useful action together.
- Do use shared primitives, safe return paths, truthful readiness, and visible recovery.
- Do preserve all pinned brand tokens and test actual foreground/background pairs.
- Don't invent counts, balances, verification, testimonials, or rescue outcomes.
- Don't expose unfinished destinations as working links.
- Don't claim rendered visual verification from source or component tests.

## Sidebar and theme refinement

The brand sits at the top of the full-height left navigation. The separate sticky header contains search, Create, account actions, and the theme toggle. On phones, the branded navigation opens as a full-height drawer. Dark mode uses a black canvas and neutral charcoal surfaces with the existing warm accents; artwork keeps its original colors. A local preference is applied before painting, follows the system when unset, and synchronizes across tabs. This pass was source-reviewed only; no tests, builds, detectors, or browser inspection were run.

## Official shadcn and Tailwind ownership

The 6 November 2026 migration replaces the earlier custom primitive layer with actual official shadcn registry sources. This supersedes older control dimensions, hover recipes, and stylesheet ownership references above. Product-specific loaders, route actions, identity badges, and forms compose those components. `next-themes` supplies the class-based theme. The existing supplied artwork and human attribution remain. This pass was source-reviewed only, as requested; no automated tests, checks, builds, or browser inspection were performed.

## Community width and loading refinement — 6 November 2026

The owner requested the pet profile width for the community page. `CommunityLayout` now shares that 800px/300px/24px composition between the loaded page and its loading fallback, stacking at a container width below 832px. The story invitation uses the supplied illustration and a direct Share a story action. Looking for a home shows individual official shadcn Cards with circular pet portraits, location, and gentle color/image/arrow hover feedback. Post, pet, and resource skeletons use official Skeleton components; initial navigation, feed selection, and pagination show item-shaped placeholders. Shared loading and transition fixes preserve the surrounding frame, hidden drafts, and scoped pet sections. See `docs/implementation/community-width-loading.md`. Source review only; no automated tests, checks, builds, or browser verification were run.

## UI standards verification — 6 November 2026

The owner's later request to check all dashboard tabs authorizes the rendered review and scoped checks documented in `docs/implementation/ui-standards-audit.md`; earlier source-only limits above describe previous deliveries. This review preserves the existing visual world, supplied illustrations, Saira Condensed/Instrument Sans fonts, and separate platform/management shells. It confirms 49 routes and every member, shelter, and moderation dashboard tab using sample roles.

Default buttons, inputs, native selects, icon utilities and dialog close controls now implement the documented 2.75rem target. Small control variants remain available for compact contexts. Page headings, filter forms, workflow fields and cards share consistent Tailwind spacing. Status badges can wrap within their parent. Secondary feature text uses `muted-foreground` so the active theme owns contrast. Theme controls wait for the client snapshot before exposing their pressed state. Registry source adaptations and their provenance are recorded in `docs/implementation/shadcn-tailwind-migration.md`.


## Floating discovery map and quests — 8 November 2026

The owner’s latest map direction replaces the reserved sidebar column with an initially expanded floating results panel over a full-viewport canvas. The visible Places map title is removed. Category filters float at the top center; a compact upper-right quest tracker pairs public animal imagery with saved participation milestones. On phones the category group scrolls, the list can be collapsed, and quests open through a compact control. Details and directions take priority over quests. Both map renderers reserve camera space for floating panels; route identity, approximate-location meaning and absolute route-fitting padding remain authoritative.

The map-only bridge reads open public missions and the current viewer’s saved participation state. Progress means joined, proof submitted and approved; it does not claim welfare recovery or a Kibble award. Missing imagery keeps the existing labelled fallback, guests receive sign-in guidance, and unavailable/empty/error/loading states remain explicit. Existing official shadcn components and font/color roles are reused without registry source changes.

Finish verdict: source-reviewed implementation delivered in the standalone game and social worktree. No automated tests, checks, builds or browser verification were run for this update under the current standing instruction; rendered quality remains unverified. No raster assets, database records, payments or rewards changed. The operative discovery contract and technical handoff are `.impeccable/surfaces/discovery.md` and `docs/implementation/floating-map-quests-2026-11-08.md`.


Map-control follow-up: the left results body folds vertically through official shadcn Collapsible, retaining brand, description and search. Category buttons own individual floating surfaces with transparent parent navigation. A single compact bottom dock matches location/search actions to zoom/fit controls in both renderers. Quests include real animal attention alerts independently of the nearby prompt, alongside saved mission progress. Source review only; see the floating-map implementation guide for component provenance, responsive behavior and verification limits.


Quest-panel reference refinement: official Collapsible/Tabs compose an expandable care summary, four counted filters, animal/status rows, real participation progress and a compact collapsed header. Public adoption flags and current-user participation states own the data; no reference sample counts, five-quest reward promise or online animal dots were added. The work is source-reviewed only under the standing no-verification instruction. Technical boundaries and the separately proposed geographic community areas are documented in the quest-reference implementation guide.


Local community areas: the owner's local-area/custom-split preference is implemented with stored source-dated Davao barangay polygons, dashed custom subdivisions, a keyboard-accessible selector and the shared animated right drawer. Each published leaf area links to a distinct shared game room on the existing backend; no separate infrastructure server or social-feed partition is implied. Polygon selection is subordinate to active animal routing/origin picking. Font roles, small-radius actions, source attribution and real-data/reward boundaries remain. Migration/import completed; source review only, with no runtime/browser tests. The geographic-community implementation guide owns source editions, initial coverage and operational limits.


## Zoom-aware city discovery — 9 November 2026

City navigation now has three scales: province/metro database-count circles below zoom 8; thin colored city boundaries and the entrance cue from 8 to below 13; no city geometry, entrance hover cue or city-area click at street zoom 13 and above. The keyboard selector remains available. City drawers show six circular image/icon counts from the real services. Animal totals are unique published profiles; open help and scheduled public events have time/state eligibility. Home counts respect the current viewer’s existing visibility/blocking/realm rules and stay unknown before authentication. Preserve the incumbent theme, official shadcn components, filtering/route priorities and whole-city-only entrances. Firefox desktop/mobile and scoped home counts were reviewed; UI boundary check passed. See `docs/implementation/map-zoom-summaries-2026-11-09.md` for source provenance, evidence and limits.


## Transparent map artwork and zoomed-out hover — 9 November 2026

This update supersedes the lower city-outline cutoff above. Thin city lines and the entrance hover card remain available from zoom 3 to below 13, alongside province count circles below zoom 8. Street zoom still hides lines, hover cues and city-area click entry. Hover cards now share six compact circular database counts with the city drawer. Public photos take priority; missing/broken images use the new transparent, logo-referenced animals/events/home/shelters/groups/help/city illustrations. Reuse the category asset map and shared official-shadcn Avatar composition across markers, summaries and empty banners. Generated art is decorative, never identity evidence or real location imagery. Alpha was inspected on all seven optimized assets; this follow-up is source-reviewed only under the standing no-application-check/no-browser instruction. See `docs/implementation/map-hover-artwork-2026-11-09.md` and `public/pawtrail-game/discovery/map-placeholders-v1.json` for final prompts, provenance and scope.


## Larger category thumbnails and restored animal portraits — 9 November 2026

Render the new transparent category artwork at 125% without extra avatar padding; keep real photos at their existing cover treatment. Individual animal identities again use the former species/coat illustrations. Category artwork belongs to map summaries, place/sidebar rows, map missions, non-animal popup headers and empty banners/help prompts. Use the shared EntityFace to preserve the individual/category distinction, with existing photo priority, count badges and quest state. This supersedes the previous generic category fallback for individual animals. No new assets or backend records were created. Source review only; see `docs/implementation/map-thumbnail-refinement-2026-11-09.md`.


## Selected map marker and closer focus — 9 November 2026

A selected marker uses a steady high-contrast outer ring and 125% scale. Apply the same state to the actual selected shared animal and raise its parent marker group above neighbors. Preserve attention/status cues and route-destination priority. Selecting an item focuses at zoom 16 in both renderers without zooming out from a closer view; follow-up focus shares the floor and respects panel padding/reduced motion. Keep the reverted typography/status-border update reverted. Source review only; see `docs/implementation/map-selected-marker-2026-11-09.md`.

## Current portrait direction: lightweight original 2D artwork

The owner approved true 2D portraits on 9 November 2026, superseding the rotatable bust/GLB requirements above. Preserve Maya's original illustration and native detail. Use small native eye/mouth atlases for independent blinking, smile, happy and text-reveal talking. No rotation controls. Dialogue, player HUD and creators share `LivingPortrait` with lazy Canvas 2D loading, pause, reduced motion, visibility suspension and neutral snapshots. `/play?preview=portraits` now opens the 2D studio. Cap each complete portrait artwork bundle below 500,000 bytes; current human bundles are about 9.5–31.5 KB. Existing custom silhouettes/accessories need authored 2D portraits rather than being advertised as exact automatic conversions. See `docs/implementation/layered-2d-portraits.md`. Gameplay rigs remain independent.
