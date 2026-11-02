---
name: PawTrail social platform
description: Every Paw Has a Story.
colors:
  primary: '#F97316'
  primary-dark: '#EA580C'
  teal: '#0F766E'
  green: '#84CC16'
  background: '#FFFBF5'
  surface: '#FFFFFF'
  foreground: '#3B2416'
  muted: '#78716C'
  border: '#EDE5D8'
  action-hover: '#9A3412'
  secondary-text: '#6B625B'
typography:
  heading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '2rem'
    fontWeight: 700
    lineHeight: 1.2
  subheading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '1.5rem'
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: 'Inter, sans-serif'
    fontSize: '1rem'
    fontWeight: 400
    lineHeight: 1.6
  navigation:
    fontFamily: 'Inter, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.4
  mobile-heading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '1.75rem'
    fontWeight: 700
    lineHeight: 1.2
  form-subheading:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '1.25rem'
    fontWeight: 700
    lineHeight: 1.2
  section-title:
    fontFamily: 'Nunito, sans-serif'
    fontSize: '1.125rem'
    fontWeight: 700
    lineHeight: 1.3
  caption:
    fontFamily: 'Inter, sans-serif'
    fontSize: '0.875rem'
    fontWeight: 400
    lineHeight: 1.4
  status:
    fontFamily: 'Inter, sans-serif'
    fontSize: '0.8125rem'
    fontWeight: 600
    lineHeight: 1.6
  availability:
    fontFamily: 'Inter, sans-serif'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.4
  mobile-navigation:
    fontFamily: 'Inter, sans-serif'
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

The user explicitly replaced the journal composition with a social layout comparable to X/Facebook, requested full viewport width and a separate management dashboard, and supplied a PawTrail illustration sheet. This supersedes the earlier journal layout. The code-first preference, Nunito/Inter type, orange identity, existing functionality and privacy boundaries remain. Tests and browser verification remain disabled by user instruction.

**Key Characteristics:**

- Animal identity leads; supporting chrome stays compact.
- Warm, flat surfaces with clear text and native interaction.
- Honest sample labels, permissions, unavailable states, and recovery.

This contract records the approved world and its source implementation. Licensed fonts and credited photography are self-hosted. The user later selected direct implementation without agents or automated testing. Historical foundation checks predate the native feature changes; fresh automated and rendered verification have not been performed.

## Colors

The pinned orange, teal, green, cream, white, brown, muted, and border values remain exact. Orange primary actions use brown foreground. Hover changes both foreground and background to white on deep burnt orange (`action-hover`) for AA contrast. The pinned `primary-dark` remains a brand color, not an assumed accessible text pairing.

Teal supports links, focus, current navigation, and successful states. Green is an accent with brown text. `secondary-text` supplies readable descriptions and placeholders on cream or white; `muted` supplies visible form outlines. Beige rules separate content but do not replace required control boundaries. Status always includes words; color never conveys the only meaning. Do not infer verification from teal or create a verification claim in a shared primitive.

## Typography

Nunito headings and wordmark; Inter body, labels, controls, and data, with self-hosted Latin and Latin Extended variable fonts and sans-serif fallbacks. Body is 1rem/1.6. App headings are 2rem desktop and 1.75rem mobile; dialog/empty-state headings are 1.5rem. Navigation uses 0.9375rem/1.4. Mobile bottom labels use 0.6875rem while retaining 3.5rem targets. Long prose stays near 65–75ch. PHP amounts use tabular numerals and integer centavos.

Marketing display typography uses 3.25–5.5rem on desktop and 3.25–4.5rem on mobile; marketing section headings use 1.85–2.6rem. Application workspaces use the same Nunito/Inter roles, compact data rows, story surfaces, native semantics, and responsive control spacing. Maps and charts are lazy islands, and adoption transitions honor reduced motion.

## Layout

The platform uses all available viewport width. `AppShell` defaults to the `platform` variant: a sticky 68px utility header, a 224px navigation rail, a flexible feed and a contextual discovery column. There is no 80rem outer cap or 48rem content cap. The community page uses compact feed filters, a small composer, photo-led posts and actual reaction/comment counts. Supplemental guidance belongs in the discovery rail, not above every post.

At 76rem and below the discovery rail drops; at intermediate tablet widths platform navigation becomes an icon rail with explicit accessible names. At 48rem and below the sidebar becomes a Radix drawer and the platform uses one feed plus bottom navigation. All primary social actions remain reachable. Page content owns document scrolling; only the desktop sidebar has bounded overflow.

`/dashboard/**` explicitly uses the `management` variant: management-only grouped navigation, a breadcrumb, real contribution summaries and full-width task content. It does not render the social sidebar or mobile social bottom bar. Management destinations remain available through its mobile drawer. Forms retain a readable measure inside the wide workspace; tables and lists can use the remaining width. A visible link connects both workspaces.

Marketing and authentication retain their existing route-specific layouts. The redesign does not replace them or change data/permission rules.

## Runtime token ownership

`src/app/globals.css` remains the canonical runtime token source (existing-runtime ownership). This file mirrors the roles; it does not generate a competing theme. Shadcn/Radix controls continue to use the canonical `src/components/ui` layer.

| Role                  | Runtime variable                    | Value                   | Consumers                                    |
| --------------------- | ----------------------------------- | ----------------------- | -------------------------------------------- |
| Brand action          | `--primary`                         | `#F97316`               | Button, selected feed indicator              |
| General foreground    | `--foreground`                      | `#3B2416`               | Text, controls, identity                     |
| Social canvas         | `--social-canvas`                   | `#F5F6F7`               | Both workspace backgrounds, search           |
| Social separation     | `--social-line`                     | `#E4E7EB`               | Header, posts, management divisions          |
| Social secondary text | `--social-muted`                    | `#626873`               | Metadata, labels, supporting text            |
| Surface               | `--surface`                         | `#FFFFFF`               | Header, posts, management forms              |
| Management/help       | `--teal`                            | `#0F766E`               | Focus, links, selected management navigation |
| Scrollbar             | `--scroll-thumb` / `--scroll-track` | `#B7B4AE` / transparent | Global scrollable surfaces                   |

Social headings use 26px Nunito; posts use 15px Inter and a readable text measure within the flexible feed. People use the owner's 30 illustrated portraits, selected in the profile form and rendered through `CommunityAvatar`. Stable record-based illustrations supply defaults for identifiable people; initials remain the anonymous/unavailable fallback. The controlled picker uses shared Buttons, visible selection, descriptive accessible names and a constrained scrolling grid. All 30 WebP files total approximately 151 KB; see `docs/assets/people-avatars.md`. Hover, focus, selected, disabled, loading, empty and error treatments reuse maintained components.

## Elevation & Depth

Surfaces are flat at rest, separated by warm borders. Portaled menus use `0 8px 24px rgb(59 36 22 / 12%)` to communicate temporary elevation. Modal overlays use brown at 40% opacity. No card shadows or decorative halos. Short 150ms color transitions respond to intent; reduced-motion disables transitions, animations, and smooth scrolling. Skeletons are static, and content never depends on an entrance animation.

## Shapes

Controls use 0.75rem corners; menu items 0.5rem; status labels 0.375rem. Images preserve useful pet identity and meaningful alt text. The shared AnimalImage fallback/sensitivity contract remains authoritative. Lucide provides consistent line icons; the PawTrail lockup uses a compact crop of the user-supplied cat/dog illustration beside the wordmark. Other supplied crops appear in the discovery rail and empty/404 states; all five WebP assets total about 33 KB. See `docs/assets/pawtrail-illustration.md`.

## Components

Pet profiles follow the owner's supplied social-profile reference: a compact supplied cover, overlapping pet photograph, real public activity totals, Activity/About/Photos/Location navigation and a feed/details split. The timeline always names human reporters, helpers and story authors. Practical help and sightings lead by default; tagged-story cards retain the existing community interactions and put the current pet tag first. Pet-side “Community care” markers describe recorded facts; human achievement badges, ranks and Kibble are never assigned to animals. The profile-wide cap is removed, and the route's `features/animals/pet-profile.css` uses the canonical runtime tokens.

Public PawPal profiles use the owner's supplied profile reference: a compact illustrated cover, overlapping illustrated avatar, current rank crown, real Kibble level progress, four contribution totals and a two-column overview. The sidebar holds About and Community impact; the main column holds activity navigation, opted-in badges/mastery, animal associations and story previews. Eight owner-supplied cover presets match the avatar/badge illustration style and share the controlled avatar-picker pattern and the existing profile-save transaction. No invented XP, online presence, messaging action or activity totals fill the reference. Profile content remains server-rendered, and mobile folds the columns into one reading flow. See `docs/implementation/profile-covers.md`.

Top-ten recognition uses the shared `RankCrown`: a Lucide crown and real `#1`–`#10`, with gold/silver/bronze treatments for the first three. Public profiles show the rank beside the name; post and comment bylines use the same marker. Its accessible name identifies the all-time leaderboard and its link opens that exact ranking. The server derives it from the canonical current public ranking, clears it for hidden identities and ranks outside ten, and never accepts a client-selected rank.

The public leaderboard follows the owner's supplied recognition reference: the owner's full-width cat-and-dog trophy banner, contribution totals, teal period navigation, a gold/silver/bronze top-three podium, illustrated member identities, earned showcase badges and dense readable rows. It occupies the full platform content width. On mobile the podium remains visible and the semantic table scrolls inside a named, keyboard-focusable region. Recognition comes from recorded activity and consent, never follower/like counts. Levels retain the existing 100-lifetime-Kibble policy; mastery is shared only by explicit opt-in. See `docs/implementation/leaderboard.md`.

Achievements use the owner's 45 illustrated badge assets, a compact responsive collection, native shared `Progress`, and separate requirement/reward/state text. `features/achievements/catalog.ts` owns the version-one one-time 10–500 Kibble schedule approved by the owner. Private progress and evidence stay in management; public profiles show at most six chosen unlocked badges and optional aggregate mastery. Do not infer real-world outcomes from clicks, RSVP or adoption approval. See `docs/implementation/achievements.md` for rules, provenance and unverified delivery status.

Canonical Shadcn-style primitives live only in `src/components/ui`: Slot/CVA Button, Input, Radix DropdownMenu/Dialog/AlertDialog, and Sonner. Add other primitives only when a feature needs them. Internal route actions use ButtonLink; external/document actions use ButtonAnchor; ordinary navigation uses Link. Controls retain browser semantics, visible labels, minimum 2.75rem targets, and 2px teal focus outlines with 3px offset.

Create uses a portaled keyboard menu with Report Animal, Create Sighting, Start Fundraiser, Create Community Post, and Create Quest. Anonymous users receive a validated login return URL for implemented protected destinations. `src/components/layout/navigation.ts` is the exact-path readiness registry: owning feature tasks add paths only after their real route and behavior ship. All unimplemented destinations remain non-links labeled Coming soon. Tests may inject a ready-route set; production uses the central registry.

Radix owns menu arrow keys, focus trapping, Escape, and trigger focus restoration. ConfirmDialog protects irreversible local decisions, disables duplicate submission, remains open on errors, and restores focus on completion/cancel. DataState handles loading skeletons, actionable empty, retryable error, and ready content; callers supply domain-specific empty copy. Sonner is mounted once in Providers and announces notices through its polite region. Inline errors remain in the form/dialog.

AppShell accepts optional supplied `unreadCount` and `kibbleBalance` as nonnegative safe integers. It displays unavailable until owning features supply genuine session-scoped data, and hides private values from guests. Kibble is explicitly non-cash. Zustand holds only ephemeral drawer visibility; fetched records and private answers stay out. DemoBanner labels sample profiles, activity, verification, and simulated contributions whenever session.demo is true.

## Do's and Don'ts

- Do keep pet identity, readable names, status words, and the next useful action together.
- Do use shared primitives, safe return paths, truthful readiness, and visible recovery.
- Do preserve all pinned brand tokens and test actual foreground/background pairs.
- Don't invent counts, balances, verification, testimonials, or rescue outcomes.
- Don't expose unfinished destinations as working links.
- Don't claim rendered visual verification from source or component tests.
