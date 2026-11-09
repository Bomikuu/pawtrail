# User profile layout aligned with Kopi

The owner requested `/users/pawtrail-manager` use a layout similar to the actual `/pets/kopi` page. Both live pages were inspected in Firefox before editing; reference and before screenshots are saved alongside the completed captures.

## Composition and implementation

The shared user profile now follows Kopi's 1124px overall composition: a main column up to 800px, a 300px supporting right rail and a 24px gap. The cover and identity sit inside the main column rather than spanning both columns. The cover uses the same 3.7:1 proportion and compact height limits as Kopi. The circular avatar overlaps the cover; human name, username, permitted location and provenance retain their user meaning. Owner profile/banner actions and visitor follow behavior use the existing components and URLs.

Four real contribution totals are compact inline text, replacing the large colored metric panels. Overview, Stories, Sightings, Missions and Contributions remain server-rendered URL sections, now reached through underlined horizontal navigation. A small client island keeps the selected section visible when navigation overflows on mobile. About and community impact move to the right rail; earned level/progress and the original non-cash Kibble explanations remain there. Existing badge showcase, mastery details, supported animals and stories retain their content, actions and public-data rules.

At a profile-container width below 52rem, the rail stacks below the main content. Its two detail cards sit side by side when space permits and stack below 38rem. DOM reading order follows the main profile before supporting details, matching Kopi. New detail cards compose the existing registry-installed shadcn Card; action links, avatars and progress use the canonical shared components. Tailwind owns routine layout, with no added stylesheet or token/rebrand changes.

Files: `src/features/users/public-profile.tsx`, `public-profile-header.tsx`, `public-profile-details.tsx` and `profile-tabs.tsx`. No API, database, medical-record or 3D code changed. The shared layout applies consistently to public user profiles, without a username-specific branch.

## Review and evidence

Impeccable's layout guidance was applied using this session's already-announced direct-context fallback. Reference comparison, layout assessment and source review were performed directly under the owner's no-agents instruction. Jev 1.14.0 received only a generic layout/privacy summary and selected preserving user semantics/actions/public-data boundaries while matching the inspected composition. No private profile data or credentials were sent to Jev.

Firefox's initial rendered batch covered 1440px desktop, 1024px tablet and 390px mobile. It reported no page errors or document-width overflow. The desktop main column measured 800px and rail 300px; narrower layouts stacked correctly. The final bounded confirmation corrected tablet card stretching, waited for avatar hydration/loading and captured all three sizes again. All five owner profile tabs navigated to their existing sections; the last selected tab remained visible on mobile. No profile records were modified.

The first signed-out selector expected Follow to be a button; the existing implementation correctly renders a sign-in link. After inspecting that component, the selector was corrected. A fresh signed-out Firefox context confirmed one sign-in-to-follow link with the correct profile return URL, and zero Edit profile, Change banner or Manage profile privacy controls. That context reported no console or page errors. No follow, edit, privacy-save or other mutation was performed.

The initial screenshot pass ran before hydration completed and temporarily caused an input caret-style mismatch warning from the screenshot's default caret hiding. Final captures waited for client-rendered avatar readiness and used `caret: initial`; the subsequent owner page reported zero console errors. No unrelated search component was changed to mask the capture artifact.

The final required `npm run check:ui` passed. No production build, typecheck, broad automated suite or mutation E2E tests were run. Populated badge/activity and private-contribution variants were preserved in source rather than filled with fabricated data for screenshots. The development preview remains running.

## Screenshots

Actual rendered PNGs in `output/playwright/profile-layout-2026-11-08/`:

- `kopi-before-desktop.png` — inspected reference.
- `manager-before-desktop.png` — previous manager layout.
- `manager-after-desktop.png` — completed desktop profile.
- `manager-after-tablet.png` — completed stacked/tablet profile.
- `manager-after-mobile.png` — completed mobile profile.
- `manager-contributions-mobile.png` — selected Contributions section in the initial functional pass.

No action is denied, pending or uncertain at completion. The visitor selector timeout was a read-only verification error and is resolved.
