---
name: PawTrail community journal
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

**Creative North Star: "Community journal with a pet story feed"**

An animal story is the useful center of PawTrail. Warm cream ground, white story surfaces, brown text, and recognizable animal identities connect community responses to practical help. Photography belongs to the content; clear names and native links carry identification across posts, profiles, maps, and help requests.

The user approved code-first implementation and the community-journal direction on 2026-11-02. Direction seed `0cbeff46`, candidate 5, and challenger verdicts are recorded in `.superpowers/sdd/2026-11-02-pawtrail-implementation/approved-direction.md`. The chosen world inherits the challengers' discipline in identity, status hierarchy, space budgets, and reduced motion without borrowing their unrelated materials.

**Key Characteristics:**

- Animal identity leads; supporting chrome stays compact.
- Warm, flat surfaces with clear text and native interaction.
- Honest sample labels, permissions, unavailable states, and recovery.

This contract completes the F4/F5 foundation. F7 owns licensed self-hosted font and photographic assets. Rendered visual quality remains unverified under repository policy. Source checks and automated behavior/contrast tests are the current evidence; the parent implementation coordinates the final source-scope finish review and documentation.

## Colors

The pinned orange, teal, green, cream, white, brown, muted, and border values remain exact. Orange primary actions use brown foreground. Hover changes both foreground and background to white on deep burnt orange (`action-hover`) for AA contrast. The pinned `primary-dark` remains a brand color, not an assumed accessible text pairing.

Teal supports links, focus, current navigation, and successful states. Green is an accent with brown text. `secondary-text` supplies readable descriptions and placeholders on cream or white; `muted` supplies visible form outlines. Beige rules separate content but do not replace required control boundaries. Status always includes words; color never conveys the only meaning. Do not infer verification from teal or create a verification claim in a shared primitive.

## Typography

Nunito headings and wordmark; Inter body, labels, controls, and data, with sans-serif fallbacks until F7 supplies licensed assets. Body is 1rem/1.6. App headings are 2rem desktop and 1.75rem mobile; dialog/empty-state headings are 1.5rem. Navigation uses 0.9375rem/1.4. Mobile bottom labels use 0.6875rem while retaining 3.5rem targets. Long prose stays near 65–75ch. PHP amounts use tabular numerals and integer centavos.

## Layout

The app uses a utility header, compact left navigation, central content, and an optional contextual right rail. Section destinations belong in the sidebar, avoiding duplicate top/side copies. Header utilities are search, Create, notifications, non-cash Kibble, and account. Signed-in home goes to Community when that route is implemented.

The app grid is capped at 80rem with a 14.5rem sidebar, flexible content, 1.5rem outer gutters, and 2rem gaps. At 80rem and above, supplied contextual content gains a 16rem right rail. Below that threshold the optional rail is omitted; essential tasks must remain in the center. At 48rem and below, the sidebar collapses into a dialog drawer, content becomes one column with 1rem gutters, and the fixed bottom order is Explore / Adopt / Create / Community / Profile. The drawer keeps extra destinations and account management reachable. Bottom safe-area padding and document scroll padding keep content and focus clear of the fixed navigation.

Marketing is a distinct Persuade surface with its own navigation, owned by F7. Auth retains one 30rem form column. Use `AppShell` only for app routes; the dashboard layout already integrates it. Community/discovery/adoption/fundraising route layouts should opt into it as they ship.

## Elevation & Depth

Surfaces are flat at rest, separated by warm borders. Portaled menus use `0 8px 24px rgb(59 36 22 / 12%)` to communicate temporary elevation. Modal overlays use brown at 40% opacity. No card shadows or decorative halos. Short 150ms color transitions respond to intent; reduced-motion disables transitions, animations, and smooth scrolling. Skeletons are static, and content never depends on an entrance animation.

## Shapes

Controls use 0.75rem corners; menu items 0.5rem; status labels 0.375rem. Images preserve useful pet identity and meaningful alt text. The shared AnimalImage fallback/sensitivity contract remains authoritative. Lucide provides consistent line icons; the temporary PawTrail wordmark uses its paw icon until approved identity assets are supplied.

## Components

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
