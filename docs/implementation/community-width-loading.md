# Community width, cards, and loading

Implemented 6 November 2026 from the owner's request, within the existing PawTrail social design.

- The community matches the pet profile's dimensions: an 800px maximum main column, a 300px maximum rail, and a 24px gap inside a 1124px maximum container. Container queries stack the columns below 832px. Ready and loading states share `CommunityLayout`.
- “Every paw has a story.” keeps the supplied illustration, improves the hierarchy and supporting copy, and offers Share a story with the existing guest sign-in return path.
- “Looking for a home” uses official shadcn Cards with circular pet portraits, real species/age/neighborhood data, and hover/focus feedback. Photographs retain the shared privacy, sensitivity, failure, and placeholder behavior. Empty and sample states stay explicit.
- Shared post, pet, and resource skeleton components use the official shadcn Skeleton. Post placeholders mirror the author/avatar, text, optional media, and compact action row; pet placeholders match the portrait and profile details.
- Initial community navigation and the streamed route fallback use the same page skeleton. Feed changes replace only the results; pagination appends a loading item while preserving existing stories. DataState accepts feature-specific loading content and uses animated resource placeholders by default.
- The shared paw loader uses Tailwind spin and pulse utilities. Authored transition keyframes live at the global CSS level. Page and section transitions reset after loading without adding delays or remounting hidden drafts. Reduced motion removes spatial movement and retains gentle opacity feedback for loading.

Implementation is native to this session, using the official shadcn component layer and Tailwind for routine styling. No agents, automated tests, checks, builds, detectors, or browser inspections were used. Source review covered loading paths, column dimensions, component boundaries, fallback imagery, and existing authentication/privacy behavior; runtime and rendered behavior remain unverified.

The Impeccable context launcher could not execute because of its file permissions. Existing PRODUCT.md, DESIGN.md, the community brief, layout/motion references, and craft guidance were read directly. Existing unrelated authentication changes were preserved.
