# PawTrail frontend requirements

- Use actual **shadcn/ui components installed from the official registry through the shadcn CLI**. Hand-written components that merely resemble shadcn do not satisfy this requirement.
- Keep the official shared component layer in `src/components/ui`. Compose those components for product behavior, including loading buttons, navigation actions, forms, and profile cards. Document necessary changes to registry sources.
- Use standard small-radius shadcn action buttons (rounded-md); avoid pill-shaped actions. Animal map markers, attention rings, and avatars remain circular. Keep navigation, titles, and menu text neutral; do not inherit the platform link accent into action labels.
- Use **Tailwind CSS first** for routine layout, spacing, typography, colors, borders, responsive behavior, and hover, focus, selected, disabled, and loading states.
- Reserve `.css` files for theme tokens, font declarations, browser-specific behavior, and genuinely complex animations or effects that are impractical to express clearly with utilities. Do not move ordinary component or page styling into separate stylesheets.
- Apply these requirements throughout the platform, management dashboard, authentication, and marketing interfaces. Preserve the distinct platform and management layouts.
- Follow these requirements for future work; do not reintroduce custom primitive substitutes or a parallel CSS component system.

These are the frontend requirements explicitly requested by the owner. They do not reinstate previously revoked agent instructions.

## Current game workflow

- This workspace now contains the standalone Phaser game. The social application remains in its separate worktree; do not overwrite its unrelated changes.
- Implement directly without agents. Do not run automated tests, checks, builds, or browser verification unless requested.
- Open external websites/browser links in Firefox and prefer Firefox for browser automation. Explain a tool limitation before choosing another browser.
- Keep prototype saves and Kibble clearly local. Never treat client reward totals as authoritative Django data.
- The generated native asset manifests are authoritative for frame dimensions and animation counts. Keep pixel-art rendering nearest-neighbor with integer zoom.
- Typography: use self-hosted **Saira Condensed** for primary headings, names and world labels, and **Instrument Sans** for secondary body text, controls and dialogue. Keep these roles consistent across the game, platform and management dashboard; use the existing font tokens.

- The owner now authorizes fixtures persisted in the actual database without repeated visible Sample tags. Keep stable internal seed provenance, the real API adapter and no in-browser/proximity fixtures. Never turn seeded animals or generated illustrations into identification references, verified Kibble or collected payments. See the live-social-backends guide for the real service boundaries.

## Weapon authoring

- Use `.agents/skills/pawtrail-weapons/SKILL.md` for new usable weapons: inspect the base character, create quick front/side concepts, build geometry with a generated 2D skin, then create three regular abilities and one ultimate with matching generated icons and Item Studio integration. Focused revisions can reuse approved assets. Keep existing verification permissions and local/platform boundaries.
